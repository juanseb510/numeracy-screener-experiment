'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateClassPage() {
  const router = useRouter();

  const [className, setClassName] = useState('');
  const [message, setMessage] = useState('');
  const [uid, setUid] = useState<number | null>(null);

  // Load logged-in teacher info
  useEffect(() => {
    const username = localStorage.getItem('username');
    if (!username) {
      setMessage('Not logged in.');
      return;
    }

    const fetchUser = async () => {
      // Get UID from users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('uid')
        .eq('username', username)
        .single();

      if (userError || !user) {
        console.log("USER ERROR:", userError);
        setMessage('Could not load user.');
        return;
      }

      const uid = user.uid;

      // Check if teacher
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('uid')
        .eq('uid', uid)
        .single();

      if (teacherError || !teacher) {
        console.log("TEACHER ERROR:", teacherError);
        setMessage('Only teachers can create classes.');
        return;
      }

      setUid(uid);
    };

    fetchUser();
  }, []);

  // Random code generator
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!className) {
      setMessage('Please enter a class name.');
      return;
    }

    if (!uid) {
      setMessage('User not loaded.');
      return;
    }

    const code = generateCode();

    try {
      // Insert new class
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert([{ classname: className, code }])   // <-- FIX (lowercase)
        .select('cid')
        .single();

      if (classError) {
        console.log("CLASS INSERT ERROR:", classError);
        setMessage('Error creating class.');
        return;
      }

      const cid = newClass.cid;

      // Insert into teachers_classes
      const { error: linkError } = await supabase
        .from('teachers_classes')
        .insert([{ uid, cid }]);

      if (linkError) {
        console.log("LINK ERROR:", linkError);
        setMessage('Error linking teacher to class.');
        return;
      }

      // Success → redirect
      router.push('/teacherHome');

    } catch (err) {
      console.log("UNEXPECTED ERROR:", err);
      setMessage('Unexpected error.');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Create a Class</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-sm p-6 rounded-lg"
      >
        <input
          type="text"
          placeholder="Class Name"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="border p-2 rounded-md"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
        >
          Create Class
        </button>
      </form>

      {message && <p className="mt-4 text-lg text-center">{message}</p>}
    </main>
  );
}
