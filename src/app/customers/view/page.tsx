"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/ui/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";

interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_pincode: string;
  address_lat: string;
  address_lng: string;
  opening_balance: number;
  balance_type: "Cr" | "Dr";
}

interface Vehicle {
  id?: string;
  customer_id?: string;
  vehicle_number: string;
  vehicle_type: string;
  vehicle_subtype: string;
  vehicle_name: string;
  odo_reading: number;
  last_service_date: string;
  basic_issues: string;
}

export default function EditCustomerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Partial<Customer>>({});
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    const id = searchParams.get("id");
    setCustomerId(id);
    if (!id) return;

    const fetchCustomer = async () => {
      const { data: cust } = await supabase.from("customers").select("*").eq("id", id).single();
      const { data: vehs } = await supabase.from("customer_vehicles").select("*").eq("customer_id", id);
      if (cust) setCustomer(cust);
      if (vehs) setVehicles(vehs);
      setLoading(false);
    };

    fetchCustomer();
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleVehicleChange = (index: number, name: keyof Vehicle, value: string) => {
    const updated = [...vehicles];
    if (name === "odo_reading") {
      updated[index][name] = parseInt(value) || 0;
    } else {
      updated[index][name] = value as never;
    }
    setVehicles(updated);
  };

  const addVehicle = () => {
    setVehicles((prev) => [
      ...prev,
      {
        vehicle_number: "",
        vehicle_type: "",
        vehicle_subtype: "",
        vehicle_name: "",
        odo_reading: 0,
        last_service_date: "",
        basic_issues: "",
      },
    ]);
  };

  const removeVehicle = (index: number) => {
    const updated = [...vehicles];
    updated.splice(index, 1);
    setVehicles(updated);
  };

  const saveChanges = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      await supabase.from("customers").update(customer).eq("id", customerId);
      for (const vehicle of vehicles) {
        if (vehicle.id) {
          await supabase.from("customer_vehicles").update(vehicle).eq("id", vehicle.id);
        } else {
          await supabase.from("customer_vehicles").insert({ ...vehicle, customer_id: customerId });
        }
      }
      toast.success("Customer updated successfully");
      router.push("/customers");
    } catch (err) {
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Customer</h1>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">Customer Info</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicle Info</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {["name", "phone", "whatsapp", "address_street", "address_city", "address_state", "address_pincode", "address_lat", "address_lng", "opening_balance"].map((field) => (
                <div className="flex flex-col" key={field}>
                  <Label className="capitalize">{field.replace(/_/g, " ")}</Label>
                  <Input
                    name={field}
                    value={(customer[field as keyof Customer] ?? "") as string | number}
                    onChange={handleChange}
                  />
                </div>
              ))}
              <div className="flex flex-col">
                <Label>Balance Type</Label>
                <select
                  name="balance_type"
                  value={customer.balance_type || "Cr"}
                  onChange={handleChange}
                  className="border rounded p-2"
                >
                  <option value="Cr">Credit (Cr)</option>
                  <option value="Dr">Debit (Dr)</option>
                </select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vehicles">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Vehicles ({vehicles.length})</h2>
              <Button variant="outline" size="sm" onClick={addVehicle}>
                + Add Vehicle
              </Button>
            </div>
            <div className="space-y-4">
              {vehicles.map((v, i) => (
                <div key={v.id || i} className="bg-white border rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Vehicle {i + 1}</h3>
                    <Button variant="ghost" size="sm" onClick={() => removeVehicle(i)}>
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["vehicle_number", "vehicle_type", "vehicle_subtype", "vehicle_name", "odo_reading", "last_service_date"].map((field) => (
                      <div className="flex flex-col" key={field}>
                        <Label className="capitalize">{field.replace(/_/g, " ")}</Label>
                        <Input
                          name={field}
                          value={(v[field as keyof Vehicle] ?? "") as string | number}
                          onChange={(e) => handleVehicleChange(i, field as keyof Vehicle, e.target.value)}
                        />
                      </div>
                    ))}
                    <div className="flex flex-col md:col-span-3">
                      <Label>Basic Issues</Label>
                      <Textarea
                        value={v.basic_issues || ""}
                        onChange={(e) => handleVehicleChange(i, "basic_issues", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="bg-gray-100 border rounded p-4 text-gray-600 text-center">
              <p className="text-sm">Order section coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Button onClick={saveChanges} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
