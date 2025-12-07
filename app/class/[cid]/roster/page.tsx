'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RosterPage({ params }: { params: { cid: string } }) {
  const cid = params.cid;
  const [students, setStudents] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadRoster = async () => {
      // 1️⃣ Get all student UIDs assigned to this class
      const { data: links, error: linkError } = await supabase
        .from("students_classes")
        .select("uid")
        .eq("cid", cid);

      if (linkError) {
        console.log("STUDENT LINK ERROR:", linkError);
        setMessage("Error loading roster.");
        return;
      }

      if (!links || links.length === 0) {
        setStudents([]);
        return;
      }

      const uids = links.map((r) => r.uid);

      // 2️⃣ Get only valid student UIDs
      const { data: studentRows, error: studentError } = await supabase
        .from("students")
        .select("uid")
        .in("uid", uids);

      if (studentError) {
        console.log("STUDENT TABLE ERROR:", studentError);
        setMessage("Error verifying student records.");
        return;
      }

      if (!studentRows || studentRows.length === 0) {
        setStudents([]);
        return;
      }

      const validStudentUIDs = studentRows.map((s) => s.uid);

      // 3️⃣ Fetch usernames + names from users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("uid, fname, lname, username")
        .in("uid", validStudentUIDs);

      if (userError) {
        console.log("USER FETCH ERROR:", userError);
        setMessage("Error loading student information.");
        return;
      }

      setStudents(userData || []);
    };

    loadRoster();
  }, [cid]);

  return (
    <main className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Class Roster</h1>
      <h2 className="text-lg text-gray-300 mb-4">Class ID: {cid}</h2>

      {message && (
        <p className="text-red-400 mb-4">{message}</p>
      )}

      {students.length === 0 ? (
        <p className="text-gray-400">No students have joined this class yet.</p>
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <div
              key={student.uid}
              className="p-4 bg-gray-900 border border-gray-700 rounded-lg"
            >
              <p className="text-xl font-semibold">
                {student.fname} {student.lname}
              </p>
              <p className="text-gray-400">@{student.username}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
