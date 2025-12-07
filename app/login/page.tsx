'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setMessage('Please enter both username and password.');
      return;
    }

    try {
      // 1️⃣ Look up user in "users"
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('uid, username, password_hash')
        .eq('username', username)
        .single();

      // Username not found
      if (userError || !user) {
        console.log("USER LOOKUP ERROR:", userError);
        setMessage('Username not found.');
        return;
      }

      // 2️⃣ Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        setMessage('Incorrect password.');
        return;
      }

      // 3️⃣ Store session locally
      localStorage.setItem('username', user.username);

      const uid = user.uid;

      // 4️⃣ Check if user is a teacher
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('uid')
        .eq('uid', uid)
        .single();

      if (teacher && !teacherError) {
        router.push('/teacherHome');
        return;
      }

      // 5️⃣ Check if student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('uid')
        .eq('uid', uid)
        .single();

      if (student && !studentError) {
        router.push('/');
        return;
      }

      // 6️⃣ If neither, user exists but not assigned (should not happen)
      setMessage('Account exists, but no role assigned.');

    } catch (err) {
      console.error(err);
      setMessage('Unexpected error.');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Login</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-sm p-6 rounded-lg"
      >
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded-md"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded-md"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
        >
          Login
        </button>
      </form>

      {message && <p className="mt-4 text-lg text-center">{message}</p>}

      <Link href="/signup" className="text-blue-500 hover:underline mt-6">
        Don’t have an account? Sign up
      </Link>
    </main>
  );
}
