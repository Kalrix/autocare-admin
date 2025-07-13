"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/ui/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ✅ Type-safe package pricing
type VehicleType = "Hatchback" | "Compact SUV" | "SUV";
type PackageType = "Basic" | "Premium" | "Plus";

const packagePrices: Record<VehicleType, Record<PackageType, number>> = {
  Hatchback: { Basic: 200, Premium: 300, Plus: 400 },
  "Compact SUV": { Basic: 220, Premium: 350, Plus: 600 },
  SUV: { Basic: 250, Premium: 400, Plus: 800 },
};

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

export default function CreateBookingPage() {
  const router = useRouter();
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicle_type: "",
    package: "",
    express: false,
    date: "",
    time: "",
    store_id: "",
  });

  // ✅ Type-safe price calculation
  const basePrice =
    (form.vehicle_type &&
      form.package &&
      packagePrices[form.vehicle_type as VehicleType]?.[form.package as PackageType]) || 0;

  const totalPrice = basePrice + (form.express ? 199 : 0);

  useEffect(() => {
    supabase
      .from("stores")
      .select("id, name")
      .eq("type", "hub")
      .then(({ data }) => {
        if (data) setStores(data);
      });
  }, []);

  useEffect(() => {
    if (form.date) {
      const today = new Date().toISOString().split("T")[0];
      const currentTime = new Date();

      if (form.date === today) {
        const filteredSlots = timeSlots.filter((slot) => {
          const [hours, minutes] = convertTimeTo24Hour(slot);
          const slotTime = new Date();
          slotTime.setHours(hours, minutes, 0, 0);
          return slotTime > currentTime;
        });

        setAvailableTimeSlots(filteredSlots);

        if (form.time && !filteredSlots.includes(form.time)) {
          setForm((prev) => ({ ...prev, time: "" }));
        }
      } else {
        setAvailableTimeSlots(timeSlots);
      }
    } else {
      setAvailableTimeSlots([]);
    }
  }, [form.date, form.time]);

  const convertTimeTo24Hour = (timeString: string) => {
    const [time, modifier] = timeString.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return [hours, minutes];
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const target = e.target as HTMLInputElement | HTMLSelectElement;
  const { name, value, type } = target;
  const checked = (target as HTMLInputElement).checked;

  setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.phone ||
      !form.vehicle_type ||
      !form.package ||
      !form.date ||
      !form.time ||
      !form.store_id
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (form.date === new Date().toISOString().split("T")[0] && form.time) {
      const [hours, minutes] = convertTimeTo24Hour(form.time);
      const slotTime = new Date();
      slotTime.setHours(hours, minutes, 0, 0);

      if (slotTime < new Date()) {
        alert("Cannot book for a time slot that has already passed");
        return;
      }
    }

    const { error } = await supabase.from("carwash").insert([
      {
        ...form,
        price: totalPrice,
        status: "pending",
        lead_source: "Website",
      },
    ]);

    if (!error) {
      router.push("/crm/bookings/carwashBook");
    } else {
      alert("Booking creation failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 p-4 md:p-6 w-full">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold">New Car Wash Booking</h1>
          <button
            onClick={() => router.back()}
            className="text-sm md:text-base text-gray-500 hover:text-gray-700 flex items-center"
          >
            <span className="hidden md:inline">←</span> Back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Customer Name*</label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Phone Number*</label>
                <Input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Vehicle Type*</label>
                <select
                  name="vehicle_type"
                  value={form.vehicle_type}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select vehicle</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Compact SUV">Compact SUV</option>
                  <option value="SUV">SUV</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Package*</label>
                <select
                  name="package"
                  value={form.package}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select package</option>
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                  <option value="Plus">Plus</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Date*</label>
                <Input
                  type="date"
                  name="date"
                  value={form.date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Time Slot*</label>
                <select
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  disabled={!form.date || availableTimeSlots.length === 0}
                  className="w-full p-2 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  <option value="">
                    {form.date ? "Select time" : "Select date first"}
                  </option>
                  {availableTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                {form.date === new Date().toISOString().split("T")[0] &&
                  availableTimeSlots.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      No available slots left for today
                    </p>
                  )}
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Location*</label>
                <select
                  name="store_id"
                  value={form.store_id}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a hub location</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2 md:col-span-2">
                <input
                  type="checkbox"
                  name="express"
                  checked={form.express}
                  onChange={handleChange}
                  className="h-4 w-4 text-black focus:ring-black"
                />
                <span className="text-sm font-medium">Express Service (+₹199)</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 md:p-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-lg md:text-xl font-bold">₹{totalPrice}</p>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={
                  !form.time ||
                  (form.date === new Date().toISOString().split("T")[0] &&
                    availableTimeSlots.length === 0)
                }
                className="w-full md:w-auto bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition disabled:opacity-50"
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
