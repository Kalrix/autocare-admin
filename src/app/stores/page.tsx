"use client";

import Sidebar from "@/components/ui/Sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type StoreType = "hub" | "garage";

type Store = {
  id: string;
  name: string;
  type: StoreType;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  manager_name: string;
  manager_number: string;
};

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchStores = async () => {
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from("stores")
      .select(
        "id, name, type, city, address, latitude, longitude, manager_name, manager_number"
      );

    if (error) {
      console.error("Error fetching stores:", error.message);
      setErrorMsg(error.message);
      setStores([]);
    } else if (!data || data.length === 0) {
      console.log("No stores found in database.");
      setStores([]);
    } else {
      console.log("Fetched stores:", data);
      setStores(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const openConfirm = (id: string) => setConfirmDeleteId(id);
  const closeConfirm = () => setConfirmDeleteId(null);

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId) return;

    try {
      // Delete related rows here if needed
      // await supabase.from("store_task_capacities").delete().eq("store_id", confirmDeleteId);
      // await supabase.from("garage_hub_tags").delete().eq("garage_id", confirmDeleteId);

      const { error } = await supabase.from("stores").delete().eq("id", confirmDeleteId);
      if (error) {
        alert("❌ Failed to delete store: " + error.message);
      } else {
        alert("✅ Store deleted successfully");
        fetchStores();
      }
    } catch (err) {
      alert("❌ Unexpected error deleting store");
      console.error(err);
    }
    closeConfirm();
  };

  return (
    <>
      <div className="min-h-screen flex bg-gray-100">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Stores</h1>
            <button
              onClick={() => router.push("/stores/new")}
              className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              + Create Store
            </button>
          </div>

          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-100 text-xs uppercase text-gray-500 border-b">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Manager</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-6 text-gray-400">
                      Loading stores...
                    </td>
                  </tr>
                ) : errorMsg ? (
                  <tr>
                    <td colSpan={7} className="text-center p-6 text-red-500">
                      Error: {errorMsg}
                    </td>
                  </tr>
                ) : stores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-6 text-gray-400">
                      No stores found.
                    </td>
                  </tr>
                ) : (
                  stores.map((store) => (
                    <tr key={store.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{store.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            store.type === "hub"
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {store.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">{store.city}</td>
                      <td className="px-4 py-3">{store.manager_name}</td>
                      <td className="px-4 py-3">{store.manager_number}</td>
                      <td className="px-4 py-3 text-xs">
                        <div>{store.address}</div>
                        <div className="text-gray-400">
                          ({store.latitude}, {store.longitude})
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => router.push(`/stores/${store.id}`)}
                          className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openConfirm(store.id)}
                          className="px-3 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={closeConfirm}
        >
          <div
            className="bg-white p-6 rounded shadow-lg max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete this store? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeConfirm}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
