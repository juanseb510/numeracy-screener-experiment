'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ComparisonPair from '@/app/components/ComparisonPair';
import { generateComparison, ComparisonType } from '@/utils/comparisonGenerator';
import { supabase } from '@/lib/supabase';

export default function GameUI() {
  const TOTAL_ROUNDS = 5;
  const ROUND_TIME = 5;

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [gameOver, setGameOver] = useState(false);

  const [username, setUsername] = useState<string | null>(null);
  const [uid, setUid] = useState<number | null>(null);

  const [comparison, setComparison] = useState(() => generateComparison());
  const [wrongQuestions, setWrongQuestions] = useState<ComparisonType[]>([]);
  const [sid, setSid] = useState<number | null>(null); // score id

  // Load username
  useEffect(() => {
    const u = localStorage.getItem('username');
    if (!u) router.push('/login');
    else {
      setUsername(u);
      setMounted(true);
    }
  }, []);

  // Fetch UID from Users table
  useEffect(() => {
    if (!username) return;

    const load = async () => {
      const { data } = await supabase
        .from('users')
        .select('uid')
        .eq('username', username)
        .single();

      if (data) setUid(data.uid);
    };

    load();
  }, [username]);

  // Timer logic
  useEffect(() => {
    if (!mounted || gameOver) return;

    if (round > TOTAL_ROUNDS) {
      setGameOver(true);
      return;
    }

    setTimeLeft(ROUND_TIME);
    const t = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(t);
  }, [round]);

  useEffect(() => {
    if (timeLeft === 0) {
      setWrongQuestions((prev) => [...prev, comparison.type]);
      setRound((r) => r + 1);
      setComparison(generateComparison());
    }
  }, [timeLeft]);

  const handleChoice = (side: 'left' | 'right', correct: boolean) => {
    if (!correct) {
      setWrongQuestions((prev) => [...prev, comparison.type]);
    } else {
      setScore((s) => s + 1);
    }

    setRound((r) => r + 1);
    setComparison(generateComparison());
  };

  // Save score and wrong questions
  useEffect(() => {
    if (!gameOver || uid === null) return;

    const save = async () => {
      // 1️⃣ Insert score → get sid
      const { data: scoreRow } = await supabase
        .from('scores')
        .insert([{ uid, score_value: score }])
        .select('sid')
        .single();

      if (!scoreRow) return;

      const newSid = scoreRow.sid;
      setSid(newSid);

      // 2️⃣ Insert wrong questions
      if (wrongQuestions.length > 0) {
        const inserts = wrongQuestions.map((type) => ({
          sid: newSid,
          type,
        }));

        await supabase.from('questions_wrong').insert(inserts);
      }
    };

    save();
  }, [gameOver]);

  if (!mounted)
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  if (gameOver)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <h1 className="text-4xl font-bold">🏁 Game Over!</h1>
        <p className="text-2xl">Final Score: {score} / {TOTAL_ROUNDS}</p>

        <button
          className="px-5 py-2 bg-blue-600 text-white rounded"
          onClick={() => {
            setScore(0);
            setRound(1);
            setWrongQuestions([]);
            setGameOver(false);
            setComparison(generateComparison());
          }}
        >
          Play Again
        </button>

        <Link href="/" className="text-blue-500 hover:underline">
          Back to Home
        </Link>
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-4xl font-bold">Comparison Challenge</h1>
      <p className="text-lg">Welcome, {username}</p>
      <p className="text-lg">Round {round} / {TOTAL_ROUNDS} | Score: {score}</p>
      <p className="text-xl text-blue-600">Time Left: {timeLeft}s</p>

      <ComparisonPair
        left={comparison.left}
        right={comparison.right}
        onChoice={handleChoice}
      />
    </div>
  );
}
