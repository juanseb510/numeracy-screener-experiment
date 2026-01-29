'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import SketchButton from '../components/SketchButton';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setMessage('Please enter both username and password.');
      return;
    }

    try {
      // Check if the username already exists
      const { data: existingUser, error: selectError } = await supabase
        .from('profiles')
        .select('username, password')
        .eq('username', username)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Select error:', selectError.message);
        setMessage('Database error. Please try again.');
        return;
      }

      // Case 1: Existing user -> attempt login
      if (existingUser) {
        const passwordMatch = await bcrypt.compare(password, existingUser.password);
        if (passwordMatch) {
          localStorage.setItem('username', username);
          setMessage('Logged in successfully!');
          setTimeout(() => router.push('/'), 1000); // Redirect after 1s
        } else {
          setMessage('Incorrect password.');
        }
        return;
      }

      // Case 2: New user -> register
      const hashedPassword = await bcrypt.hash(password, 10);
      const { error: insertError } = await supabase
        .from('profiles')

        .insert([{ username, password: hashedPassword }]);
      if (insertError) {
        console.error(insertError);
        setMessage('Error creating user: ' + insertError.message);
      } else {
        localStorage.setItem('username', username);
        setMessage('Account created successfully!');
        setTimeout(() => router.push('/'), 1000);
      }
    } catch (err) {
      console.error(err);
      setMessage('Something went wrong.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white text-gray-800">
      <h1 className="text-4xl font-bold mb-8">Login / Register</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-sm p-8 bg-gray-50 border-2 border-gray-200 rounded-xl shadow-sm">
        
        <div className="flex flex-col gap-2">
          <label className="font-bold text-gray-600">Username</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-gray-600">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Use SketchButton for submit? Or keep standard button for forms? 
            Let's use a standard button for the form submit to ensure it works correctly with "Enter" key */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors mt-2"
        >
          GO!
        </button>
      </form>

      {message && (
        <p className="mt-6 text-lg text-center font-bold text-blue-600">{message}</p>
      )}

      <div className="mt-8">
        <SketchButton text="BACK HOME" href="/" />
      </div>
    </div>
  );
}