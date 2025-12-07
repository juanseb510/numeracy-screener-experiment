'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password || !fname || !lname) {
      setMessage('Please fill out all fields.');
      return;
    }

    try {
      // 🔍 DEBUG: Check if "users" table exists
      const usersCheck = await supabase.from("users").select("*").limit(1);
      console.log("USERS TABLE CHECK:", usersCheck);

      // 🔍 DEBUG: Check if "students" and "teachers" tables exist
      console.log("STUDENTS TABLE CHECK:", await supabase.from("students").select("*").limit(1));
      console.log("TEACHERS TABLE CHECK:", await supabase.from("teachers").select("*").limit(1));

      // Check username
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        setMessage('Username already taken.');
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            username,
            fname: fname,           // lowercase to match PG folded name
            lname: lname,           // lowercase to match PG folded name
            password_hash: hashedPassword
          }
        ])
        .select('uid')
        .single();

      // 🔥 DEBUG BLOCK: Print full Supabase error object
      if (insertError) {
        console.log("🔥 SUPABASE INSERT ERROR:");
        console.log(JSON.stringify(insertError, null, 2)); // REAL error message
        setMessage(`Insert failed: ${insertError.message}`);
        return;
      }

      if (!newUser) {
        console.log("🔥 newUser returned null");
        setMessage('Account creation failed.');
        return;
      }

      const uid = newUser.uid;

      // Insert into either students or teachers
      if (role === 'student') {
        const { error: err } = await supabase.from('students').insert([{ uid }]);
        if (err) {
          console.log("🔥 STUDENTS INSERT ERROR:", err);
          setMessage('Error creating student record.');
          return;
        }
      } else {
        const { error: err } = await supabase.from('teachers').insert([{ uid }]);
        if (err) {
          console.log("🔥 TEACHERS INSERT ERROR:", err);
          setMessage('Error creating teacher record.');
          return;
        }
      }

      // Auto login
      localStorage.setItem('username', username);
      setMessage('Account created successfully!');

      // Redirect based on role
      if (role === 'student') {
        router.push('/');
      } else {
        router.push('/createClass');
      }

    } catch (err) {
      console.log("🔥 UNCAUGHT ERROR:", err);
      setMessage('Unexpected error occurred.');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Create Account</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-sm p-6 rounded-lg"
      >
        <input
          type="text"
          placeholder="First Name"
          value={fname}
          onChange={(e) => setFname(e.target.value)}
          className="border p-2 rounded-md"
        />

        <input
          type="text"
          placeholder="Last Name"
          value={lname}
          onChange={(e) => setLname(e.target.value)}
          className="border p-2 rounded-md"
        />

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

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'student' | 'teacher')}
          className="border p-2 rounded-md text-black bg-white"
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
        >
          Sign Up
        </button>
      </form>

      {message && <p className="mt-4 text-lg text-center">{message}</p>}

      <Link href="/login" className="text-blue-500 hover:underline mt-6">
        Already have an account? Login
      </Link>
    </main>
  );
}
