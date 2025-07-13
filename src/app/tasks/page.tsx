"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import { supabase } from "@/lib/supabase";

type Task = {
  id: string;
  name: string;
  allowed_in_hub: boolean;
  allowed_in_garage: boolean;
  slot_type: "per_hour" | "max_per_day";
  count: number | null;
};

export default function TaskTypesPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    name: "",
    allowed_in_hub: false,
    allowed_in_garage: false,
    slot_type: "per_hour" as "per_hour" | "max_per_day",
    count: 0,
  });

  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase.from("task_types").select("*");
      if (error) {
        console.error(error);
      } else {
        const safeData = (data || []).map((task) => ({
          ...task,
          count: task.count ?? 0,
        }));
        setTasks(safeData);
      }
      setLoading(false);
    };

    fetchTasks();
  }, []);

  const handleAddTask = async () => {
    const { data, error } = await supabase
      .from("task_types")
      .insert([newTask])
      .select();

    if (error) return alert("Failed to add task");

    const safeData = (data || []).map((task) => ({
      ...task,
      count: task.count ?? 0,
    }));

    setTasks((prev) => [...prev, ...safeData]);
    setNewTask({
      name: "",
      allowed_in_hub: false,
      allowed_in_garage: false,
      slot_type: "per_hour",
      count: 0,
    });

    setSuccessMsg(`✅ Task "${safeData[0].name}" added`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleFieldChange = (id: string, field: keyof Task, value: any) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, [field]: value } : task
      )
    );
  };

  const handleUpdate = async (task: Task) => {
    const { error } = await supabase
      .from("task_types")
      .update({
        name: task.name,
        allowed_in_hub: task.allowed_in_hub,
        allowed_in_garage: task.allowed_in_garage,
        slot_type: task.slot_type,
        count: task.count ?? 0,
      })
      .eq("id", task.id);

    if (error) {
      console.error("Update error:", error.message);
      alert("Update failed: " + error.message);
    } else {
      setSuccessMsg(`✅ Task "${task.name}" updated`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Task Types</h1>

          {successMsg && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-800 rounded">
              {successMsg}
            </div>
          )}

          {/* Add New Task Form */}
          <div className="bg-white p-5 rounded shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New Task</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Task Name"
                value={newTask.name}
                onChange={(e) =>
                  setNewTask({ ...newTask, name: e.target.value })
                }
                className="border p-2 rounded"
              />
              <select
                value={newTask.slot_type}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    slot_type: e.target.value as "per_hour" | "max_per_day",
                  })
                }
                className="border p-2 rounded"
              >
                <option value="per_hour">Per Hour</option>
                <option value="max_per_day">Max Per Day</option>
              </select>
              <input
                type="number"
                placeholder="Default Count"
                value={newTask.count}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    count: Number(e.target.value) || 0,
                  })
                }
                className="border p-2 rounded"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newTask.allowed_in_hub}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      allowed_in_hub: e.target.checked,
                    })
                  }
                />
                Allowed in Hub
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newTask.allowed_in_garage}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      allowed_in_garage: e.target.checked,
                    })
                  }
                />
                Allowed in Garage
              </label>
            </div>
            <button
              onClick={handleAddTask}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Task
            </button>
          </div>

          {/* Task Table */}
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-100 text-xs uppercase text-gray-500 border-b">
                <tr>
                  <th className="px-4 py-3">Task Name</th>
                  <th className="px-4 py-3 text-center">Hub</th>
                  <th className="px-4 py-3 text-center">Garage</th>
                  <th className="px-4 py-3">Slot Type</th>
                  <th className="px-4 py-3">Default Count</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-6">
                      Loading...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-6 text-gray-400">
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <input
                          value={task.name}
                          onChange={(e) =>
                            handleFieldChange(task.id, "name", e.target.value)
                          }
                          className="border p-1 rounded w-full"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={task.allowed_in_hub}
                          onChange={(e) =>
                            handleFieldChange(
                              task.id,
                              "allowed_in_hub",
                              e.target.checked
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={task.allowed_in_garage}
                          onChange={(e) =>
                            handleFieldChange(
                              task.id,
                              "allowed_in_garage",
                              e.target.checked
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={task.slot_type}
                          onChange={(e) =>
                            handleFieldChange(
                              task.id,
                              "slot_type",
                              e.target.value
                            )
                          }
                          className="border p-1 rounded"
                        >
                          <option value="per_hour">Per Hour</option>
                          <option value="max_per_day">Max Per Day</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={task.count ?? 0}
                          onChange={(e) =>
                            handleFieldChange(
                              task.id,
                              "count",
                              Number(e.target.value) || 0
                            )
                          }
                          className="border p-1 rounded w-24"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleUpdate(task)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
