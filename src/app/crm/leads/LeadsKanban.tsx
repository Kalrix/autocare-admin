"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { GripVertical, Edit, Save, X } from "lucide-react";
import { format } from "date-fns";

import { Lead, updateLeadStatus } from "./utils";
import { STATUS_LABELS, STATUS_COLORS, STATUS_ORDER, REMARK_SUGGESTIONS } from "./config";

export default function LeadsKanban({
  leads,
  setLeads,
}: {
  leads: Lead[];
  setLeads: Function;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [activeTab, setActiveTab] = useState<"all" | string>("all");
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<Lead> | null>(null);
  const [remarkModalState, setRemarkModalState] = useState<{
    isOpen: boolean;
    lead: Lead | null;
    newStatus: string | null;
  }>({ isOpen: false, lead: null, newStatus: null });

  const filteredLeads =
    activeTab === "all" ? leads : leads.filter((l) => l.status === activeTab);

  const statusCounts = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = leads.filter((l) => l.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || editingLeadId) return;

    const dragged = leads.find((l) => l.id === active.id);
    const newStatus = over.id.toString();

    if (dragged && dragged.status !== newStatus) {
      setRemarkModalState({
        isOpen: true,
        lead: dragged,
        newStatus,
      });
    }
  };

  const handleRemarkSelectForStatusChange = async (remark: string) => {
    const { lead, newStatus } = remarkModalState;
    if (lead && newStatus) {
      await updateLeadStatus(lead.id, newStatus, remark, setLeads);
    }
    setRemarkModalState({ isOpen: false, lead: null, newStatus: null });
  };

  const handleEditClick = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setEditedData({ ...lead });
  };

  const handleCancelClick = () => {
    setEditingLeadId(null);
    setEditedData(null);
  };

  const handleSaveClick = async () => {
    if (!editingLeadId || !editedData?.status) return;
    await updateLeadStatus(
      editingLeadId,
      editedData.status,
      editedData.remark || "",
      setLeads
    );
    setEditingLeadId(null);
    setEditedData(null);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "status") {
      const newRemark = REMARK_SUGGESTIONS[value]?.[0] || "";
      setEditedData((prev) =>
        prev ? { ...prev, status: value, remark: newRemark } : null
      );
    } else {
      setEditedData((prev) =>
        prev ? { ...prev, [name]: value } : null
      );
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {/* Tabs */}
      <div className="flex gap-2 border-b p-4 bg-gray-50 text-sm font-medium mb-4 rounded">
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

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            id={status}
            className={`bg-gray-100/60 rounded-lg shadow-sm p-2 flex flex-col ${
              activeTab !== "all" && activeTab !== status ? "hidden" : ""
            }`}
          >
            <h2
              className={`text-sm font-bold uppercase mb-2 px-2 py-1 rounded text-center ${STATUS_COLORS[status]}`}
            >
              {STATUS_LABELS[status]}
            </h2>
            <div className="space-y-2 min-h-[100px] flex-grow">
              {filteredLeads
                .filter((l) => l.status === status)
                .map((lead) => (
                  <div
                    key={lead.id}
                    id={lead.id}
                    className="bg-white border rounded-md shadow-sm p-3 relative"
                  >
                    {editingLeadId === lead.id && editedData ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600">
                            Change Status
                          </label>
                          <select
                            name="status"
                            value={editedData.status || ""}
                            onChange={handleSelectChange}
                            className="w-full border rounded px-2 py-1 text-sm bg-white"
                          >
                            {STATUS_ORDER.map((statusKey) => (
                              <option key={statusKey} value={statusKey}>
                                {STATUS_LABELS[statusKey]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">
                            Change Remark
                          </label>
                          <select
                            name="remark"
                            value={editedData.remark || ""}
                            onChange={handleSelectChange}
                            className="w-full border rounded px-2 py-1 text-sm bg-white"
                          >
                            <option value="">No Remark</option>
                            {(REMARK_SUGGESTIONS[editedData.status || ""] || []).map(
                              (suggestion) => (
                                <option key={suggestion} value={suggestion}>
                                  {suggestion}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                        <div className="flex justify-end items-center space-x-2 pt-2">
                          <button onClick={handleCancelClick} className="p-1 text-gray-500 hover:text-gray-800">
                            <X size={18} />
                          </button>
                          <button onClick={handleSaveClick} className="p-1 text-blue-600 hover:text-blue-800">
                            <Save size={18} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            <span className="font-medium text-gray-800">{lead.name}</span>
                            <div className="text-xs text-gray-500 mb-1">{lead.phone}</div>
                          </div>
                          <div className="flex items-center text-gray-400">
                            <button onClick={() => handleEditClick(lead)} className="p-1 hover:text-gray-700">
                              <Edit size={14} />
                            </button>
                            <GripVertical className="cursor-grab" size={14} />
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded my-1">{lead.issue}</p>
                        <div className="text-[10px] text-gray-400 mb-1">
                          {format(new Date(lead.created_at), "dd MMM yyyy, hh:mm a")}
                        </div>
                        {lead.remark && (
                          <div className="text-xs text-blue-600 italic border-l-2 border-blue-200 pl-2 mt-2">
                            “{lead.remark}”
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Remark Modal for Drag */}
      {remarkModalState.isOpen && remarkModalState.lead && remarkModalState.newStatus && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">
              Move to "{STATUS_LABELS[remarkModalState.newStatus]}"
            </h3>
            <p className="mb-4 text-sm text-gray-600">Select a remark:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(REMARK_SUGGESTIONS[remarkModalState.newStatus] || []).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleRemarkSelectForStatusChange(suggestion)}
                  className="w-full text-left p-2 rounded-md bg-gray-100 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setRemarkModalState({ isOpen: false, lead: null, newStatus: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}
