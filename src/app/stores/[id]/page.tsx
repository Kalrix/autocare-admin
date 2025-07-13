"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function ViewEditStorePage() {
  const [store, setStore] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const params = useParams();
  const storeId = params?.id;

  useEffect(() => {
    const fetchStore = async () => {
      if (!storeId) return;

      const { data: storeData, error } = await supabase.from("stores").select("*").eq("id", storeId).single();
      if (error) {
        console.error("Failed to fetch store:", error.message);
        return;
      }
      console.log("✅ Store fetched:", storeData);
      setStore(storeData);
    };
    fetchStore();
  }, [storeId]);

  const handleChange = (key: string, value: string) => {
    setStore((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!storeId || !store) return;

    const allowedKeys = [
      "name",
      "city",
      "latitude",
      "longitude",
      "manager_name",
      "manager_number",
      "address",
      "type",
      "hub_id"
    ];
    const cleanedStore: any = {};
    allowedKeys.forEach((key) => {
      if (store[key] !== undefined) {
        cleanedStore[key] = store[key];
      }
    });

    console.log("🧭 storeId:", storeId);
    console.log("📦 Cleaned store object:", cleanedStore);

    const { data, error } = await supabase
      .from("stores")
      .update(cleanedStore)
      .eq("id", storeId)
      .select("*");

    if (error) {
      console.error("❌ Store update failed:", error.message);
      alert("❌ Update failed: " + error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.warn("⚠️ Update returned no records. Double-check if the row was matched.");
    } else {
      console.log("✅ Store updated. Supabase response:", data);
    }

    setStore(data?.[0] ?? store);
    setIsEditing(false);
    alert("✅ Store saved successfully");
  };

  if (!store) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto bg-white p-6 rounded shadow">
          <h1 className="text-2xl font-bold mb-6">View / Edit Store</h1>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="general">Store Info</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["name", "city", "latitude", "longitude", "manager_name", "manager_number", "address"].map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1 capitalize">{key.replace("_", " ")}</label>
                    {key === "address" ? (
                      <Textarea
                        value={store[key] || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        disabled={!isEditing}
                      />
                    ) : (
                      <Input
                        value={store[key] || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        disabled={!isEditing}
                      />
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={() => router.back()}>Back</Button>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit</Button>
            ) : (
              <Button onClick={handleSave} className="bg-green-600 text-white">Save Changes</Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
