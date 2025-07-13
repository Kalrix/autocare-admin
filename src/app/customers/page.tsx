"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/ui/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  address_city: string | null;
  opening_balance: number;
  balance_type: "Cr" | "Dr";
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [allCities, setAllCities] = useState<string[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (data) {
        setCustomers(data);
        const cities = Array.from(new Set(data.map((c) => c.address_city).filter(Boolean))) as string[];
        setAllCities(cities);
      }
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase());
    const matchesCity = cityFilter ? c.address_city === cityFilter : true;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Customers ({filtered.length})</h1>
          <Button onClick={() => router.push("/customers/create")}>+ Create Customer</Button>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex flex-col">
            <Label className="mb-1">Search (Name/Phone)</Label>
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <Label className="mb-1">Filter by City</Label>
            <select
              className="border rounded p-2"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="">All Cities</option>
              {allCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white shadow rounded">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">City</th>
                <th className="px-4 py-2">Balance</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">{c.phone}</td>
                  <td className="px-4 py-2">{c.address_city || "-"}</td>
                  <td className="px-4 py-2">₹{c.opening_balance} {c.balance_type}</td>
                  <td className="px-4 py-2">
                    <Button
  size="sm"
  variant="outline"
  onClick={() => router.push(`/customers/view?id=${c.id}`)}
>
  View
</Button>

                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-400">
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
