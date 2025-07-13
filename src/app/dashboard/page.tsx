"use client";

import Sidebar from "@/components/ui/Sidebar";


export default function DashboardPage() {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome to the Dashboard</h1>
        <p className="text-gray-600">Start building your control panel here...</p>
      </main>
    </div>
  );
}
