"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { data, error } = await supabase
      .from("admin_users")
      .select("id, username, role, password")
      .eq("username", username)
      .single();

    if (error || !data) {
      alert("User not found");
      return;
    }

    if (data.password !== password) {
      alert("Wrong password");
      return;
    }

    // TODO: You can store role in localStorage or context
    localStorage.setItem("admin_user", JSON.stringify({ username: data.username, role: data.role }));

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">AutoCare24 | Backend Login</h1>

        <label className="block mb-2 font-semibold" htmlFor="username">
          Unique ID (Username)
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="unique ID"
          required
          className="w-full mb-4 p-2 border border-gray-300 rounded"
        />

        <label className="block mb-2 font-semibold" htmlFor="password">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="w-full mb-6 p-2 border border-gray-300 rounded"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>
    </main>
  );
}
