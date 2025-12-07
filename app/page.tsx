'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [username, setUsername] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (!storedUser) return;

    setUsername(storedUser);

    const checkRole = async () => {
      // Get UID
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("uid")
        .eq("username", storedUser)
        .single();

      if (userError || !user) return;

      const uid = user.uid;

      // Teacher check → redirect
      const { data: teacher } = await supabase
        .from("teachers")
        .select("uid")
        .eq("uid", uid)
        .single();

      if (teacher) {
        router.push("/teacherHome");
        return;
      }

      // Student check → show button
      const { data: student } = await supabase
        .from("students")
        .select("uid")
        .eq("uid", uid)
        .single();

      if (student) {
        setIsStudent(true);
      }
    };

    checkRole();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("username");
    setUsername(null);
    router.push("/login");
  };

  return (
    <div className="text-xl flex flex-col items-center justify-center min-h-screen text-center gap-4">
      <div>Home Page</div>

      <div className="flex flex-col items-center gap-2">
        <Link href="/game" className="hover:underline">Game</Link>

        {/* SHOW ONLY IF STUDENT */}
        {isStudent && (
          <Link href="/studentClass" className="hover:underline">Classes</Link>
        )}

        <div className="flex gap-4">
          <Link href="/signup" className="hover:underline">Sign Up</Link>
          <Link href="/login" className="hover:underline">Login</Link>
        </div>
      </div>

      {username && (
        <>
          <p className="text-gray-600 mt-4">Logged in as <b>{username}</b></p>
          <button
            onClick={handleLogout}
            className="text-red-500 underline hover:text-red-600"
          >
            Log Out
          </button>
        </>
      )}
    </div>
  );
}
