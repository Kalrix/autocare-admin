// File path: /src/app/crm/bookings/carwashBook/view/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/ui/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

const packagePrices = {
  Hatchback: { Basic: 200, Premium: 300, Plus: 400 },
  "Compact SUV": { Basic: 220, Premium: 350, Plus: 600 },
  SUV: { Basic: 250, Premium: 400, Plus: 800 },
};

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

const statusOptions = ["pending", "confirmed", "completed", "cancelled"] as const;

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

export default function BookingViewPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<Partial<Booking>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch booking
        const { data: bookingData, error: bookingError } = await supabase
          .from("carwash")
          .select("*, stores(name)")
          .eq("id", params.id as string)
          .single();

        if (bookingError) throw bookingError;

        // Fetch stores
        const { data: storesData, error: storesError } = await supabase
          .from("stores")
          .select("id, name")
          .eq("type", "hub");

        if (storesError) throw storesError;

        setBooking(bookingData);
        setFormData(bookingData);
        setStores(storesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load booking data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Prepare update data with only changed fields
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        vehicle_type: formData.vehicle_type,
        package: formData.package,
        express: formData.express,
        date: formData.date,
        time: formData.time,
        store_id: formData.store_id,
        status: formData.status,
      };

      // Validate required fields
      if (!updateData.name || !updateData.phone || !updateData.vehicle_type || 
          !updateData.package || !updateData.date || !updateData.time || 
          !updateData.store_id) {
        throw new Error("All required fields must be filled");
      }

      // Calculate new price if vehicle or package changed
      if (formData.vehicle_type && formData.package) {
        updateData.price = packagePrices[formData.vehicle_type][formData.package] + 
                         (formData.express ? 199 : 0);
      }

      const { data, error } = await supabase
        .from("carwash")
        .update(updateData)
        .eq("id", params.id as string)
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned from update");
      }

      setBooking(data[0]);
      setEditing(false);
      toast.success("Booking updated successfully!");
      
    } catch (error: any) {
      console.error("Update error details:", {
        message: error.message,
        details: error
      });
      toast.error(`Failed to update: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-lg">Loading booking details...</div>
      </div>
    </div>
  );

  if (!booking) return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-lg text-red-500">Booking not found</div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {editing ? "Edit Booking" : "Booking Details"}
          </h1>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFormData(booking);
                    setEditing(false);
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => router.back()}>
                  Back to Bookings
                </Button>
                <Button onClick={() => setEditing(true)}>
                  Edit Booking
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Customer Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                    {editing ? (
                      <Input
                        name="name"
                        value={formData.name || ""}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                    ) : (
                      <p className="text-gray-800">{booking.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
                    {editing ? (
                      <Input
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                    ) : (
                      <p className="text-gray-800">{booking.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h2 className="text-lg font-semibold mb-2">Service Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type*</label>
                    {editing ? (
                      <select
                        name="vehicle_type"
                        value={formData.vehicle_type || ""}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select vehicle</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="Compact SUV">Compact SUV</option>
                        <option value="SUV">SUV</option>
                      </select>
                    ) : (
                      <p className="text-gray-800">{booking.vehicle_type}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package*</label>
                    {editing ? (
                      <select
                        name="package"
                        value={formData.package || ""}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select package</option>
                        <option value="Basic">Basic</option>
                        <option value="Premium">Premium</option>
                        <option value="Plus">Plus</option>
                      </select>
                    ) : (
                      <p className="text-gray-800">{booking.package}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Express Service</label>
                    {editing ? (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="express"
                          checked={!!formData.express}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-black focus:ring-black"
                        />
                        <span className="ml-2">Express (+₹199)</span>
                      </div>
                    ) : (
                      <p className="text-gray-800">{booking.express ? "Yes" : "No"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <p className="text-gray-800">₹{booking.price}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule and Booking Info */}
            <div className="space-y-4">
              {/* Schedule */}
              <div>
                <h2 className="text-lg font-semibold mb-2">Schedule</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date*</label>
                    {editing ? (
                      <Input
                        type="date"
                        name="date"
                        value={formData.date || ""}
                        onChange={handleInputChange}
                        className="w-full"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    ) : (
                      <p className="text-gray-800">{booking.date}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot*</label>
                    {editing ? (
                      <select
                        name="time"
                        value={formData.time || ""}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select time</option>
                        {timeSlots.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-800">{booking.time}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location*</label>
                    {editing ? (
                      <select
                        name="store_id"
                        value={formData.store_id || ""}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select location</option>
                        {stores.map(store => (
                          <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-800">{booking.stores?.name || "-"}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div>
                <h2 className="text-lg font-semibold mb-2">Booking Info</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {editing ? (
                      <select
                        name="status"
                        value={formData.status || ""}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : booking.status === "confirmed"
                          ? "bg-blue-100 text-blue-800"
                          : booking.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {booking.status}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <p className="text-gray-800">{booking.lead_source}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                    <p className="text-gray-800">
                      {new Date(booking.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}