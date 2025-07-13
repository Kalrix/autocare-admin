"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/ui/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

// ✅ Add missing Vehicle type
type Vehicle = {
  vehicle_type: string;
  vehicle_subtype: string;
  vehicle_name: string;
  odo_reading: string;
  last_service_date: string;
  basic_issues: string;
  vehicle_number: string;
};

const vehicleSubcategories: Record<string, string[]> = {
  Car: ["Hatchback", "Sedan", "SUV", "Compact SUV"],
  Auto: ["Passenger Auto", "Goods Auto"],
  Truck: ["Mini Truck", "Heavy Truck", "Container Truck"],
  Bike: ["Scooter", "Motorbike", "Cruiser"],
};

export default function CreateCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [customerExists, setCustomerExists] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_pincode: "",
    address_lat: "",
    address_lng: "",
    opening_balance: "",
    balance_type: "Cr",
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      vehicle_type: "",
      vehicle_subtype: "",
      vehicle_name: "",
      odo_reading: "",
      last_service_date: "",
      basic_issues: "",
      vehicle_number: "",
    },
  ]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneBlur = async () => {
    if (!/^\d{10}$/.test(form.phone)) return;
    const { data } = await supabase.from("customers").select("id").eq("phone", form.phone);
    const exists = (data?.length || 0) > 0;
    setCustomerExists(exists);
    if (exists) toast.error("Customer already exists.");
  };

  const handleVehicleChange = (index: number, name: string, value: string) => {
    const updated = [...vehicles];
    updated[index][name as keyof Vehicle] = value;
    if (name === "vehicle_type") updated[index]["vehicle_subtype"] = "";
    setVehicles(updated);
  };

  const addVehicle = () => {
    setVehicles((prev) => [
      ...prev,
      {
        vehicle_type: "",
        vehicle_subtype: "",
        vehicle_name: "",
        odo_reading: "",
        last_service_date: "",
        basic_issues: "",
        vehicle_number: "",
      },
    ]);
  };

  const removeVehicle = (index: number) => {
    if (vehicles.length > 1) {
      const updated = [...vehicles];
      updated.splice(index, 1);
      setVehicles(updated);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || vehicles.length === 0) {
      toast.error("Fill all required fields and add at least one vehicle.");
      return;
    }

    setLoading(true);
    try {
      const { data: existing } = await supabase.from("customers").select("id").eq("phone", form.phone);
      if (existing?.length) {
        toast.error("Phone already registered.");
        return;
      }

      const { data: customer, error } = await supabase
        .from("customers")
        .insert([
          {
            name: form.name,
            phone: form.phone,
            whatsapp: form.whatsapp || form.phone,
            address_street: form.address_street,
            address_city: form.address_city,
            address_state: form.address_state,
            address_pincode: form.address_pincode,
            address_lat: form.address_lat,
            address_lng: form.address_lng,
            opening_balance: parseFloat(form.opening_balance) || 0,
            balance_type: form.balance_type,
          },
        ])
        .select()
        .single();

      if (error || !customer?.id) throw error || new Error("Customer insert failed.");

      const vehiclesToInsert = vehicles.map((v) => ({
        customer_id: customer.id,
        vehicle_type: v.vehicle_type,
        vehicle_subtype: v.vehicle_subtype,
        vehicle_name: v.vehicle_name,
        vehicle_number: v.vehicle_number,
        odo_reading: v.odo_reading ? parseInt(v.odo_reading) : null,
        last_service_date: v.last_service_date || null,
        basic_issues: v.basic_issues,
      }));

      const { error: vehicleError } = await supabase.from("customer_vehicles").insert(vehiclesToInsert);

      if (vehicleError) throw vehicleError;

      toast.success("Customer registered successfully!");
      router.push("/customers");
    } catch (err: any) {
      console.error("Registration Error:", err);
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center mb-4 md:mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Register Customer</h1>
        </div>

        <div className="bg-white p-4 md:p-6 rounded shadow-sm">
          <Tabs value={`step-${step}`} onValueChange={(val) => setStep(Number(val.split("-")[1]))} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4 bg-gray-50">
              {["Customer", "Vehicle(s)", "Address", "Balance"].map((label, idx) => (
                <TabsTrigger
                  key={label}
                  value={`step-${idx}`}
                  disabled={idx > step}
                  className={idx > step ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="step-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <Label className="mb-1">Name *</Label>
                  <Input name="name" value={form.name} onChange={handleChange} />
                </div>
                <div className="flex flex-col">
                  <Label className="mb-1">Phone *</Label>
                  <Input
                    name="phone"
                    maxLength={10}
                    value={form.phone}
                    onChange={handleChange}
                    onBlur={handlePhoneBlur}
                  />
                  {customerExists && <p className="text-xs text-red-600">Customer already exists</p>}
                </div>
                <div className="flex flex-col">
                  <Label className="mb-1">WhatsApp</Label>
                  <Input
                    name="whatsapp"
                    maxLength={10}
                    value={form.whatsapp}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="step-1">
              {vehicles.map((v, idx) => (
                <div key={idx} className="mb-6 p-4 border rounded bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Vehicle {idx + 1}</h4>
                    {vehicles.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeVehicle(idx)}>
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <Label className="mb-1">Vehicle Number</Label>
                      <Input
                        value={v.vehicle_number}
                        onChange={(e) => handleVehicleChange(idx, "vehicle_number", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label className="mb-1">Type</Label>
                      <select
                        className="w-full border rounded p-2"
                        value={v.vehicle_type}
                        onChange={(e) => handleVehicleChange(idx, "vehicle_type", e.target.value)}
                      >
                        <option value="">Select Type</option>
                        {Object.keys(vehicleSubcategories).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <Label className="mb-1">Subtype</Label>
                      <select
                        className="w-full border rounded p-2"
                        value={v.vehicle_subtype}
                        disabled={!v.vehicle_type}
                        onChange={(e) => handleVehicleChange(idx, "vehicle_subtype", e.target.value)}
                      >
                        <option value="">Select Subtype</option>
                        {vehicleSubcategories[v.vehicle_type]?.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <Label className="mb-1">Name</Label>
                      <Input
                        value={v.vehicle_name}
                        onChange={(e) => handleVehicleChange(idx, "vehicle_name", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label className="mb-1">Odometer</Label>
                      <Input
                        type="number"
                        value={v.odo_reading}
                        onChange={(e) => handleVehicleChange(idx, "odo_reading", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label className="mb-1">Last Service</Label>
                      <Input
                        type="date"
                        value={v.last_service_date}
                        onChange={(e) => handleVehicleChange(idx, "last_service_date", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col md:col-span-3">
                      <Label className="mb-1">Known Issues</Label>
                      <Textarea
                        rows={2}
                        value={v.basic_issues}
                        onChange={(e) => handleVehicleChange(idx, "basic_issues", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addVehicle}>
                + Add Vehicle
              </Button>
            </TabsContent>

            <TabsContent value="step-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Street", name: "address_street" },
                  { label: "City", name: "address_city" },
                  { label: "State", name: "address_state" },
                  { label: "Pincode", name: "address_pincode" },
                  { label: "Latitude", name: "address_lat" },
                  { label: "Longitude", name: "address_lng" },
                ].map(({ label, name }) => (
                  <div key={name} className="flex flex-col">
                    <Label className="mb-1">{label}</Label>
                    <Input name={name} placeholder={label} onChange={handleChange} value={form[name as keyof typeof form]} />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="step-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <Label className="mb-1">Opening Balance</Label>
                  <Input
                    name="opening_balance"
                    type="number"
                    placeholder="Opening Balance"
                    value={form.opening_balance}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex flex-col">
                  <Label className="mb-1">Balance Type</Label>
                  <select
                    name="balance_type"
                    value={form.balance_type}
                    onChange={handleChange}
                    className="border rounded p-2"
                  >
                    <option value="Cr">Credit (Cr)</option>
                    <option value="Dr">Debit (Dr)</option>
                  </select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-between">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || customerExists}>
                {loading ? "Registering..." : "Register Customer"}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
