"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/ui/Sidebar";
import { supabase } from "@/lib/supabase";
import LeadsTable from "./LeadsTable";
import LeadsKanban from "./LeadsKanban";
import { Lead } from "./utils";
import AddLeadModal from "./AddLeadModal";


export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"kanban" | "table">("table"); // default = table
  const [showModal, setShowModal] = useState(false); // 👈 new state

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setLeads(data || []);
    else console.error("Error fetching leads:", error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Leads</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-1 rounded ${
                view === "kanban" ? "bg-blue-600 text-white" : "bg-white border"
              }`}
            >
              Kanban View
            </button>
            <button
              onClick={() => setView("table")}
              className={`px-3 py-1 rounded ${
                view === "table" ? "bg-blue-600 text-white" : "bg-white border"
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setShowModal(true)} // 👈 open modal
              className="ml-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Add Lead
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 p-10">
            <Loader2 className="animate-spin mx-auto mb-2" />
            Loading leads...
          </div>
        ) : view === "kanban" ? (
          <LeadsKanban leads={leads} setLeads={setLeads} />
        ) : (
          <LeadsTable leads={leads} setLeads={setLeads} />
        )}

        {/* ✅ Modal */}
        <AddLeadModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onAdded={fetchLeads}
        />
      </main>
    </div>
  );
}
