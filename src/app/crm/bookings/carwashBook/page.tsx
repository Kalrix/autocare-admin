// File path: /src/app/crm/bookings/carwashBook/page.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/ui/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface Booking {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  package: string;
  express: boolean;
  date: string;
  time: string;
  price: number;
  store_id: string;
  lead_source: string;
  created_at: string;
  status: string;
  stores: {
    name: string;
  } | null;
}

const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
type BookingStatus = (typeof BOOKING_STATUSES)[number];

type StatusWithCount = {
  [key in BookingStatus | "all"]: number;
};

export default function CarwashBookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | BookingStatus>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [counts, setCounts] = useState<StatusWithCount>({
    all: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });

  const router = useRouter();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("carwash")
      .select("*, stores(name)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const bookingsWithStatus = data.map((b) => ({
        ...b,
        status: b.status || "pending",
      }));

      setBookings(bookingsWithStatus);

      const c: StatusWithCount = {
        all: bookingsWithStatus.length,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      };

      bookingsWithStatus.forEach((b) => {
        const s = b.status as BookingStatus;
        c[s]++;
      });
      setCounts(c);
    } else {
      console.error("Failed to fetch:", error);
    }
    setLoading(false);
  };

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    const { error } = await supabase
      .from("carwash")
      .update({ status: newStatus })
      .eq("id", bookingId)
      .select();

    if (!error) {
      await fetchBookings();
    } else {
      console.error("Update failed:", error);
    }
    setEditingId(null);
  };

  const filtered =
    activeTab === "all"
      ? bookings
      : bookings.filter((b) => (b.status || "pending") === activeTab);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Car Wash Bookings</h1>
          <Button onClick={() => router.push("/crm/bookings/carwashBook/create")}>+ Create Booking</Button>
        </div>

        <div className="flex gap-2 mb-6 border-b pb-2">
          {["all", ...BOOKING_STATUSES].map((status) => (
            <Button
              key={status}
              variant={activeTab === status ? "default" : "ghost"}
              onClick={() => setActiveTab(status as BookingStatus | "all")}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1 text-xs font-semibold">({counts[status]})</span>
            </Button>
          ))}
        </div>

        <div className="bg-white rounded shadow">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-xs uppercase text-gray-500 border-b">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Vehicle</th>
                <th className="px-4 py-2">Package</th>
                <th className="px-4 py-2">Express</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Store</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{b.name}</td>
                  <td className="px-4 py-2">{b.phone}</td>
                  <td className="px-4 py-2">{b.vehicle_type}</td>
                  <td className="px-4 py-2">{b.package}</td>
                  <td className="px-4 py-2">{b.express ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">{b.date}</td>
                  <td className="px-4 py-2">{b.time}</td>
                  <td className="px-4 py-2">₹{b.price}</td>
                  <td className="px-4 py-2">{b.stores?.name || "-"}</td>
                  <td className="px-4 py-2">
                    {editingId === b.id ? (
                      <Select
                        value={b.status}
                        onValueChange={(value) => handleStatusChange(b.id, value as BookingStatus)}
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs capitalize">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {BOOKING_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        onClick={() => setEditingId(b.id)}
                        className={`cursor-pointer px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                          b.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : b.status === "confirmed"
                            ? "bg-blue-100 text-blue-800"
                            : b.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {b.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs">{b.lead_source}</td>
                  <td className="px-4 py-2 text-xs text-gray-400">
                    {format(new Date(b.created_at), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/crm/bookings/carwashBook/view/${b.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={13} className="text-center py-6 text-gray-400 italic">
                    No bookings found
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