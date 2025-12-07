'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function StudentClasses() {
  const [username, setUsername] = useState<string | null>(null);
  const [uid, setUid] = useState<number | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('username');
    router.push('/login');
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('username');
    if (!storedUser) return;

    setUsername(storedUser);

    const load = async () => {
      // 1. Get UID from Users
      const { data: user } = await supabase
        .from('users')
        .select('uid')
        .eq('username', storedUser)
        .single();

      if (!user) return;
      const uid = user.uid;
      setUid(uid);

      // 2. Ensure user is a student
      const { data: student } = await supabase
        .from('students')
        .select('uid')
        .eq('uid', uid)
        .single();

      if (!student) {
        setMessage("You are not a student.");
        return;
      }

      // 3. Load student's enrolled classes
      const { data: sc } = await supabase
        .from('students_classes')
        .select('cid')
        .eq('uid', uid);

      if (!sc || sc.length === 0) {
        setClasses([]);
        return;
      }

      const cids = sc.map((row) => row.cid);

      // 4. Load class + teacher info properly using your schema
      // teacher names must come from Users table
      const { data: classRows, error: classErr } = await supabase
        .from('classes')
        .select(`
          cid,
          classname,
          teachers_classes (
            uid,
            teachers (
              uid,
              users (
                fname,
                lname
              )
            )
          )
        `)
        .in('cid', cids);

      if (classErr) {
        console.log(classErr);
        setMessage("Error loading classes");
        return;
      }

      setClasses(classRows || []);
    };

    load();
  }, []);

  // JOIN CLASS
  const handleJoinClass = async () => {
    if (!uid) return;

    // Find class by code
    const { data: classRow } = await supabase
      .from('classes')
      .select('cid')
      .eq('code', joinCode)
      .single();

    if (!classRow) {
      setMessage("Invalid class code.");
      return;
    }

    const cid = classRow.cid;

    // Prevent duplicate join
    const { data: exists } = await supabase
      .from('students_classes')
      .select('*')
      .eq('uid', uid)
      .eq('cid', cid)
      .maybeSingle();

    if (exists) {
      setMessage("You are already in this class.");
      return;
    }

    await supabase
      .from('students_classes')
      .insert([{ uid, cid }]);

    setMessage("Joined class! Reloading...");
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <main className="flex flex-col items-center min-h-screen p-6 text-center gap-6">
      
      {/* HEADER BUTTONS */}
      <div className="w-full max-w-md flex justify-between">
        <button
          onClick={() => router.push('/')}
          className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded"
        >
          Home
        </button>

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>

      <h1 className="text-3xl font-bold">Your Classes</h1>

      {/* JOIN CLASS FORM */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter class code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="px-3 py-2 border border-gray-700 rounded bg-gray-900 text-white"
        />
        <button
          onClick={handleJoinClass}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Join
        </button>
      </div>

      {message && <p className="text-red-400">{message}</p>}

      {/* CLASS LIST */}
      <div className="flex flex-col gap-4 w-full max-w-md">
        {classes.map((cls) => {
          const teacherUser = cls.teachers_classes?.[0]?.teachers?.users;

          return (
            <div
              key={cls.cid}
              className="border border-gray-700 rounded p-4 bg-gray-900"
            >
              <h2 className="text-xl font-semibold">{cls.classname}</h2>

              {/* Teacher name */}
              {teacherUser ? (
                <p className="text-gray-300 mt-1">
                  Teacher: <b>{teacherUser.fname} {teacherUser.lname}</b>
                </p>
              ) : (
                <p className="text-gray-500">No teacher assigned.</p>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
