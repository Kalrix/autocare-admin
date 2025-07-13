"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import { supabase } from "@/lib/supabase";

interface TaskType {
  id: string;
  name: string;
  slot_type: "per_hour" | "max_per_day";
  count: number;
  allowed_in_hub: boolean;
  allowed_in_garage: boolean;
}

export default function CreateStorePage() {
  const [step, setStep] = useState(1);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [storeData, setStoreData] = useState({
    name: "AutoCare24 - ",
    city: "",
    address: "",
    latitude: "",
    longitude: "",
    manager_name: "",
    manager_number: "",
    type: "hub" as "hub" | "garage",
  });
  const [taskCapacities, setTaskCapacities] = useState<{ [taskId: string]: number }>({});
  const [hubs, setHubs] = useState<{ id: string; name: string }[]>([]);
  const [selectedHubIds, setSelectedHubIds] = useState<string[]>([]);
  const [hubSearch, setHubSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: taskData, error: taskError } = await supabase
        .from("task_types")
        .select("id, name, count, slot_type, allowed_in_hub, allowed_in_garage");
      if (taskError) {
        alert("❌ Failed to load task types: " + taskError.message);
        return;
      }
      setTaskTypes(taskData || []);

      const initialCapacities: { [taskId: string]: number } = {};
      (taskData || []).forEach((task) => {
        initialCapacities[task.id] = task.count;
      });
      setTaskCapacities(initialCapacities);

      const { data: hubsData, error: hubsError } = await supabase
        .from("store_admin")
        .select("id, name")
        .eq("type", "hub");
      if (hubsError) {
        alert("❌ Failed to load hubs: " + hubsError.message);
        return;
      }
      setHubs(hubsData || []);
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    const nameWithPrefix = storeData.name.startsWith("AutoCare24 - ") ? storeData.name : `AutoCare24 - ${storeData.name}`;

    const insertStore = await supabase
      .from("store_admin")
      .insert([{ ...storeData, name: nameWithPrefix }])
      .select();

    if (insertStore.error || !insertStore.data || !insertStore.data[0]) {
      alert("❌ Failed to create store: " + insertStore.error?.message);
      return;
    }

    const createdStore = insertStore.data[0];
    const storeId = createdStore.id;

    const taskPayload = taskTypes
      .filter((task) => (storeData.type === "hub" ? task.allowed_in_hub : task.allowed_in_garage))
      .map((task) => ({
        store_id: storeId,
        task_type_id: task.id,
        capacity: taskCapacities[task.id] !== undefined ? taskCapacities[task.id] : task.count,
      }));

    if (taskPayload.length) {
      const taskInsert = await supabase.from("store_task_capacities").insert(taskPayload);
      if (taskInsert.error) {
        alert("❌ Failed to insert task capacities: " + taskInsert.error.message);
        return;
      }
    }

    if (storeData.type === "garage" && selectedHubIds.length > 0) {
      const tagPayload = selectedHubIds.map((hubId) => ({
        garage_id: storeId,
        hub_id: hubId,
      }));

      const tagInsert = await supabase.from("garage_hub_tags").insert(tagPayload);
      if (tagInsert.error) {
        alert("❌ Failed to tag hubs: " + tagInsert.error.message);
        return;
      }
    }

    alert("✅ Store created successfully!");
    window.location.href = "/stores";
  };

  const filteredHubs = hubs.filter(
    (hub) => hub.name.toLowerCase().includes(hubSearch.toLowerCase()) && !selectedHubIds.includes(hub.id)
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
          <h1 className="text-xl font-bold mb-4">Create New Store</h1>

          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded">
              <input type="text" placeholder="Store Name" className="border p-2 rounded" value={storeData.name} onChange={(e) => setStoreData({ ...storeData, name: e.target.value })} />
              <input type="text" placeholder="City" className="border p-2 rounded" value={storeData.city} onChange={(e) => setStoreData({ ...storeData, city: e.target.value })} />
              <input type="text" placeholder="Latitude" className="border p-2 rounded" value={storeData.latitude} onChange={(e) => setStoreData({ ...storeData, latitude: e.target.value })} />
              <input type="text" placeholder="Longitude" className="border p-2 rounded" value={storeData.longitude} onChange={(e) => setStoreData({ ...storeData, longitude: e.target.value })} />
              <input type="text" placeholder="Manager Name" className="border p-2 rounded" value={storeData.manager_name} onChange={(e) => setStoreData({ ...storeData, manager_name: e.target.value })} />
              <input type="text" placeholder="Manager Number" className="border p-2 rounded" value={storeData.manager_number} onChange={(e) => setStoreData({ ...storeData, manager_number: e.target.value })} />
              <textarea placeholder="Full Address" className="border p-2 rounded col-span-2" value={storeData.address} onChange={(e) => setStoreData({ ...storeData, address: e.target.value })} />
              <div className="col-span-2 flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input type="radio" value="hub" checked={storeData.type === "hub"} onChange={() => setStoreData({ ...storeData, type: "hub" })} /> Hub
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" value="garage" checked={storeData.type === "garage"} onChange={() => setStoreData({ ...storeData, type: "garage" })} /> Garage
                </label>
              </div>
              <div className="col-span-2 flex justify-between">
                <button onClick={() => window.history.back()} className="text-gray-600 px-4 py-2 rounded hover:underline">Back</button>
                <button onClick={() => setStep(2)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Next</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-md font-semibold mb-4">Task Type Capacities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {taskTypes
                  .filter((task) => (storeData.type === "hub" ? task.allowed_in_hub : task.allowed_in_garage))
                  .map((task) => (
                    <div key={task.id} className="border p-3 rounded">
                      <div className="font-medium mb-1">{task.name}</div>
                      <div className="text-xs text-gray-500 mb-2">Default: {task.count} ({task.slot_type.replace("_", " ")})</div>
                      <input type="number" min={0} className="border p-2 rounded w-full" value={taskCapacities[task.id] ?? task.count} onChange={(e) => setTaskCapacities({ ...taskCapacities, [task.id]: parseInt(e.target.value) || 0 })} />
                    </div>
                  ))}
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(1)} className="text-gray-600 px-4 py-2 rounded hover:underline">Back</button>
                <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Next</button>
              </div>
            </div>
          )}

          {step === 3 && storeData.type === "garage" && (
            <div>
              <label className="block font-medium mb-1">Tag to Hubs</label>
              <input type="text" className="border p-2 rounded w-full mb-2" placeholder="Search and add hub" value={hubSearch} onChange={(e) => setHubSearch(e.target.value)} />
              {filteredHubs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {filteredHubs.map((hub) => (
                    <button key={hub.id} onClick={() => { setSelectedHubIds([...selectedHubIds, hub.id]); setHubSearch(""); }} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">+ {hub.name}</button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedHubIds.map((id) => {
                  const hub = hubs.find((h) => h.id === id);
                  return hub ? (
                    <span key={id} className="bg-gray-200 px-2 py-1 rounded text-sm">
                      {hub.name} <button onClick={() => setSelectedHubIds((prev) => prev.filter((x) => x !== id))}>×</button>
                    </span>
                  ) : null;
                })}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-gray-600 px-4 py-2 rounded hover:underline">Back</button>
                <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Create Store</button>
              </div>
            </div>
          )}

          {step === 3 && storeData.type === "hub" && (
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="text-gray-600 px-4 py-2 rounded hover:underline">Back</button>
              <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Create Store</button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
