"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/ui/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";

const vehicleSubcategories: Record<string, string[]> = {
  Car: ["Hatchback", "Sedan", "SUV", "Compact SUV"],
  Auto: ["Passenger Auto", "Goods Auto"],
  Truck: ["Mini Truck", "Heavy Truck", "Container Truck"],
  Bike: ["Scooter", "Motorbike", "Cruiser"]
};

export default function CreateCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicle_type: "",
    vehicle_subtype: "",
    address: "",
    odo_reading: "",
    vehicle_name: "",
    last_service_date: "",
    basic_issues: "",
    opening_balance: "",
    balance_type: "Cr",
    whatsapp: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.vehicle_type || !form.vehicle_subtype) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      toast.error("Enter valid 10-digit phone number");
      return;
    }

    if (form.whatsapp && !/^\d{10}$/.test(form.whatsapp)) {
      toast.error("Enter valid 10-digit WhatsApp number");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        whatsapp: form.whatsapp || form.phone,
        vehicle_type: form.vehicle_type,
        vehicle_subtype: form.vehicle_subtype,
        vehicle_name: form.vehicle_name,
        address: form.address,
        odo_reading: form.odo_reading ? parseInt(form.odo_reading) : null,
        last_service_date: form.last_service_date || null,
        basic_issues: form.basic_issues,
        opening_balance: form.opening_balance ? parseFloat(form.opening_balance) : 0,
        balance_type: form.balance_type,
      };

      const { error } = await supabase.from("customers").insert([payload]);
      if (error) throw error;

      toast.success("Customer created successfully!");
      router.push("/crm/bookings/jobcards");
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Failed to create customer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Add New Customer</h1>
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>

        <div className="bg-white shadow rounded p-6 space-y-8">
          {/* Section: Customer Info */}
          <div>
            <h2 className="text-lg font-semibold mb-4 border-b pb-1">Customer Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Name *" name="name" value={form.name} onChange={handleChange} />
              <FormField
                label="Phone *"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                type="tel"
              />
              <FormField
                label="WhatsApp"
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                type="tel"
                placeholder="Defaults to phone"
              />
              <div className="text-xs text-gray-500 mt-1 md:col-span-2">
                If left empty, phone number will be used as WhatsApp.
              </div>
            </div>
          </div>

          {/* Section: Vehicle Info */}
          <div>
            <h2 className="text-lg font-semibold mb-4 border-b pb-1">Vehicle Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Vehicle Type *"
                name="vehicle_type"
                value={form.vehicle_type}
                onChange={(e) => {
                  handleChange(e);
                  setForm((prev) => ({ ...prev, vehicle_subtype: "" }));
                }}
                options={Object.keys(vehicleSubcategories)}
              />
              <SelectField
                label="Vehicle Subcategory *"
                name="vehicle_subtype"
                value={form.vehicle_subtype}
                onChange={handleChange}
                options={form.vehicle_type ? vehicleSubcategories[form.vehicle_type] : []}
                disabled={!form.vehicle_type}
              />
              <FormField
                label="Vehicle Name / Nickname"
                name="vehicle_name"
                value={form.vehicle_name}
                onChange={handleChange}
              />
              <FormField
                label="Odometer Reading"
                name="odo_reading"
                type="number"
                value={form.odo_reading}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Section: Service Info */}
          <div>
            <h2 className="text-lg font-semibold mb-4 border-b pb-1">Service Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Last Service Date"
                name="last_service_date"
                type="date"
                value={form.last_service_date}
                onChange={handleChange}
              />
              <div className="md:col-span-2">
                <Label htmlFor="basic_issues">Basic Issues / Notes</Label>
                <Textarea
                  name="basic_issues"
                  value={form.basic_issues}
                  onChange={handleChange}
                  rows={3}
                  placeholder="e.g., AC not working, oil leak..."
                />
              </div>
            </div>
          </div>

          {/* Section: Address */}
          <div>
            <h2 className="text-lg font-semibold mb-4 border-b pb-1">Address</h2>
            <Textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              placeholder="Full customer address"
            />
          </div>

          {/* Section: Financial Info */}
          <div>
            <h2 className="text-lg font-semibold mb-4 border-b pb-1">Financial Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Opening Balance"
                name="opening_balance"
                value={form.opening_balance}
                onChange={handleChange}
                type="number"
              />
              <SelectField
                label="Balance Type"
                name="balance_type"
                value={form.balance_type}
                onChange={handleChange}
                options={["Cr", "Dr"]}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Save Customer"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable field components

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = ""
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: any) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  disabled = false
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: any) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
