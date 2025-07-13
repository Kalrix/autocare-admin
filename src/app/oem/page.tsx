// File path: src/app/customers/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/ui/Sidebar";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  vehicle_type: string;
  vehicle_subtype: string;
  vehicle_name: string | null;
  address: string | null;
  odo_reading: number | null;
  last_service_date: string | null;
  basic_issues: string | null;
  opening_balance: number;
  balance_type: "Cr" | "Dr";
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setCustomers(data);
      });
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Customers</h1>
          <Button onClick={() => router.push("/crm/bookings/jobcards/create")}>+ Create Customer</Button>
        </div>

        <div className="bg-white shadow rounded">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Vehicle</th>
                <th className="px-4 py-2">Odo</th>
                <th className="px-4 py-2">Balance</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">{c.phone}</td>
                  <td className="px-4 py-2">
                    {c.vehicle_type} - {c.vehicle_subtype}
                  </td>
                  <td className="px-4 py-2">{c.odo_reading ?? "-"}</td>
                  <td className="px-4 py-2">
                    ₹{c.opening_balance} {c.balance_type}
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => alert(`View customer ${c.id}`)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-400">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}