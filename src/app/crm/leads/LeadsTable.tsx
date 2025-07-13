// /src/app/crm/leads/LeadsTable.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { STATUS_LABELS, STATUS_ORDER, REMARK_SUGGESTIONS } from "./config";
import { Lead, updateLeadStatus } from "./utils";

export default function LeadsTable({ leads, setLeads }: { leads: Lead[]; setLeads: Function }) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredLeads =
    activeTab === "all" ? leads : leads.filter((lead) => lead.status === activeTab);

  // Count leads per status
  const statusCounts = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = leads.filter((l) => l.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white rounded shadow overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-2 border-b p-4 bg-gray-50 text-sm font-medium">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1 rounded ${
            activeTab === "all" ? "bg-blue-600 text-white" : "text-gray-700"
          }`}
        >
          All ({leads.length})
        </button>
        {STATUS_ORDER.map((status) => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            className={`px-3 py-1 rounded capitalize ${
              activeTab === status ? "bg-blue-600 text-white" : "text-gray-700"
            }`}
          >
            {STATUS_LABELS[status]} ({statusCounts[status] || 0})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-xs uppercase text-gray-500 border-b">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Issue</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Remark</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{lead.name}</td>
                <td className="px-4 py-2">{lead.phone}</td>
                <td className="px-4 py-2">{lead.city}</td>
                <td className="px-4 py-2">{lead.issue}</td>

                <td className="px-4 py-2 capitalize">
                  <select
                    className="bg-transparent"
                    value={lead.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      const defaultRemark = lead.remark || REMARK_SUGGESTIONS[newStatus]?.[0] || "";
                      await updateLeadStatus(lead.id, newStatus, defaultRemark, setLeads);
                    }}
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-2">
                  <select
                    className="bg-transparent text-blue-600 italic"
                    value={lead.remark || ""}
                    onChange={async (e) => {
                      await updateLeadStatus(lead.id, lead.status, e.target.value, setLeads);
                    }}
                  >
                    <option value="">No Remark</option>
                    {(REMARK_SUGGESTIONS[lead.status] || []).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-2 text-xs">{lead.source}</td>
                <td className="px-4 py-2 text-xs text-gray-400">
                  {format(new Date(lead.created_at), "dd MMM yyyy")}
                </td>
              </tr>
            ))}

            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-400 italic">
                  No leads in this status
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
