'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function TeacherHome() {
  const [uid, setUid] = useState<number | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  // 🔴 LOGOUT HANDLER
  const handleLogout = () => {
    localStorage.removeItem('username');
    window.location.href = '/login'; // redirect
  };

  useEffect(() => {
    const username = localStorage.getItem('username');

    if (!username) {
      setMessage('Not logged in.');
      return;
    }

    const loadTeacher = async () => {
      // 1️⃣ Get UID
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

      // 2️⃣ Ensure teacher
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('uid')
        .eq('uid', uid)
        .single();

      if (teacherError || !teacher) {
        console.log("NOT TEACHER:", teacherError);
        setMessage('You are not a teacher.');
        return;
      }

      setUid(uid);

      // 3️⃣ Load teacher’s classes
      const { data: teacherClasses, error: classError } = await supabase
        .from('teachers_classes')
        .select('cid')
        .eq('uid', uid);

      if (classError) {
        console.log("CLASS LIST ERROR:", classError);
        setMessage('Error loading classes.');
        return;
      }

      if (!teacherClasses || teacherClasses.length === 0) {
        setClasses([]);
        return;
      }

      const cids = teacherClasses.map((row) => row.cid);

      // 4️⃣ Load class details
      const { data: classData, error: classesError } = await supabase
        .from('classes')
        .select('cid, classname, code')
        .in('cid', cids);

      if (classesError) {
        console.log("CLASSES FETCH ERROR:", classesError);
        setMessage('Error loading class details.');
        return;
      }

      setClasses(classData || []);
    };

    loadTeacher();
  }, []);

  return (
    <main className="flex flex-col items-center justify-start min-h-screen p-6">
      <div className="flex w-full max-w-md justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Classes</h1>

        {/* 🔴 LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white"
        >
          Logout
        </button>
      </div>

      <Link
        href="/createClass"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mb-6"
      >
        + Create New Class
      </Link>

      {message && <p className="text-lg mb-4 text-red-400">{message}</p>}

      {classes.length === 0 && (
        <p className="text-gray-400 text-lg">You haven’t created any classes yet.</p>
      )}

      <div className="flex flex-col gap-4 w-full max-w-md">
        {classes.map((cls) => (
          <div
            key={cls.cid}
            className="border border-gray-700 rounded-lg p-4 bg-gray-900 shadow-md"
          >
            <h2 className="text-xl font-semibold">{cls.classname}</h2>
            <p className="text-gray-400 mb-3">Code: {cls.code}</p>

            <div className="flex gap-3">
              <Link
                href={`/class/${cls.cid}/roster`}
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white"
              >
                Roster
              </Link>

              <Link
                href={`/class/${cls.cid}/dashboard`}
                className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-white"
              >
                Dashboard
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
