"use client"; // This component uses client-side features like useState and useEffect

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase'; // Import Supabase client

// --- Shadcn UI Components (Simplified for direct use) ---
// In a real Next.js app, these would be imported from your shadcn/ui components directory.
const Label = ({ htmlFor, children, className = '' }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 ${className}`}>
    {children}
  </label>
);

const Input = ({ id, type = 'text', value, onChange, placeholder, className = '', ...props }) => (
  <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${className}`}
    {...props}
  />
);

const Select = ({ id, value, onChange, children, className = '', ...props }) => (
  <select
    id={id}
    value={value}
    onChange={onChange}
    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${className}`}
    {...props}
  >
    {children}
  </select>
);

const Button = ({ children, onClick, type = 'button', className = '', disabled = false, ...props }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    {...props}
  >
    {children}
  </button>
);

const Textarea = ({ id, value, onChange, placeholder, className = '', ...props }) => (
  <textarea
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={3}
    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${className}`}
    {...props}
  />
);

// --- Lucide React Icons (Simplified for direct use) ---
const Loader2 = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="animate-spin"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const CheckCircle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XCircle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

// --- Main Component ---
export default function CreateStorePage() {
  const [step, setStep] = useState(1);
  const [storeData, setStoreData] = useState({
    name: "AutoCare24 - ",
    city: "",
    address: "",
    latitude: "",
    longitude: "",
    manager_name: "",
    manager_number: "",
    type: "hub" as "hub" | "garage",
    // hub_id is handled by selectedHubIds for multi-tagging in Supabase context
  });
  const [taskTypes, setTaskTypes] = useState<any[]>([]); // All available task types from Supabase
  const [taskCapacities, setTaskCapacities] = useState<{ [taskId: string]: number }>({}); // { taskId: capacity } for the new store
  const [hubs, setHubs] = useState<any[]>([]); // List of existing hubs from Supabase
  const [selectedHubIds, setSelectedHubIds] = useState<string[]>([]); // For tagging multiple hubs to a garage
  const [hubSearch, setHubSearch] = useState(""); // For searching hubs to tag

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch hubs and task types on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch existing hubs
        const { data: hubsData, error: hubsError } = await supabase
          .from("store_admin")
          .select("id, name, city")
          .eq("type", "hub");

        if (hubsError) {
          throw new Error(hubsError.message);
        }
        setHubs(hubsData || []);

        // Fetch task types
        const { data: taskData, error: taskError } = await supabase
          .from("task_types")
          .select("id, name, count, slot_type, allowed_in_hub, allowed_in_garage");

        if (taskError) {
          throw new Error(taskError.message);
        }
        setTaskTypes(taskData || []);

        // Initialize taskCapacities with default counts from fetched task types
        const initialCapacities: { [taskId: string]: number } = {};
        (taskData || []).forEach((task) => {
          initialCapacities[task.id] = task.count || 0;
        });
        setTaskCapacities(initialCapacities);

      } catch (error: any) {
        console.error("Error fetching data:", error);
        setMessage({ type: 'error', text: `Failed to load data: ${error.message}` });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Run only once on component mount

  // Filter task types based on storeType for display in Step 2
  const filteredTaskTypes = taskTypes.filter(task => {
    if (storeData.type === 'hub') {
      return task.allowed_in_hub;
    } else if (storeData.type === 'garage') {
      return task.allowed_in_garage;
    }
    return false;
  });

  // Filter hubs for search and selection in Step 3
  const filteredHubs = hubs.filter(
    (hub) =>
      hub.name.toLowerCase().includes(hubSearch.toLowerCase()) &&
      !selectedHubIds.includes(hub.id)
  );

  // Handle changes for task capacity inputs
  const handleTaskCapacityChange = (taskId: string, capacity: string) => {
    setTaskCapacities(prev => ({
      ...prev,
      [taskId]: parseInt(capacity, 10) || 0, // Ensure it's a number, default to 0 if invalid
    }));
  };

  // Handle form field changes for storeData
  const handleStoreDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setStoreData(prev => ({ ...prev, [id]: value }));
  };

  // Handle store type change (radio buttons)
  const handleStoreTypeChange = (type: "hub" | "garage") => {
    setStoreData(prev => ({
      ...prev,
      type: type,
    }));
    // When changing type, clear selected hubs if switching from garage
    if (type === 'hub') {
      setSelectedHubIds([]);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    setMessage({ type: '', text: '' }); // Clear previous messages

    try {
      // Validate required fields
      if (!storeData.name || !storeData.city || !storeData.type) {
        setMessage({ type: 'error', text: 'Please fill in all required fields (Store Name, City, Type).' });
        setSubmitting(false);
        return;
      }

      if (storeData.type === 'garage' && selectedHubIds.length === 0) {
        setMessage({ type: 'error', text: 'Please select at least one Associated Hub for the Garage.' });
        setSubmitting(false);
        return;
      }

      // Add "AutoCare24 - " prefix if not already present
      const finalStoreName = storeData.name.startsWith("AutoCare24 - ") ? storeData.name : `AutoCare24 - ${storeData.name}`;

      const newStorePayload = {
        name: finalStoreName,
        city: storeData.city,
        address: storeData.address || null,
        latitude: storeData.latitude || null,
        longitude: storeData.longitude || null,
        manager_name: storeData.manager_name || null,
        manager_number: storeData.manager_number || null,
        type: storeData.type,
        // hub_id is not directly set here, handled by garage_hub_tags table
      };

      // Insert the new store into the 'store_admin' table
      const { data: insertStoreData, error: insertStoreError } = await supabase
        .from("store_admin")
        .insert([newStorePayload])
        .select(); // Use .select() to get the inserted data back

      if (insertStoreError || !insertStoreData || insertStoreData.length === 0) {
        throw new Error(insertStoreError?.message || "Failed to create store: No data returned.");
      }

      const createdStore = insertStoreData[0];
      const storeId = createdStore.id;

      // Prepare and insert task capacities
      const taskPayload = filteredTaskTypes
        .map((task) => ({
          store_id: storeId,
          task_type_id: task.id,
          capacity: taskCapacities[task.id] !== undefined ? taskCapacities[task.id] : task.count,
        }))
        .filter(task => task.capacity > 0); // Only insert tasks with capacity > 0

      if (taskPayload.length > 0) {
        const { error: taskInsertError } = await supabase.from("store_task_capacities").insert(taskPayload);
        if (taskInsertError) {
          throw new Error(taskInsertError.message);
        }
      }

      // If it's a garage, insert into 'garage_hub_tags'
      if (storeData.type === "garage" && selectedHubIds.length > 0) {
        const tagPayload = selectedHubIds.map((hubId) => ({
          garage_id: storeId,
          hub_id: hubId,
        }));

        const { error: tagInsertError } = await supabase.from("garage_hub_tags").insert(tagPayload);
        if (tagInsertError) {
          throw new Error(tagInsertError.message);
        }
      }

      setMessage({ type: 'success', text: 'Store created successfully!' });
      // Redirect to stores page after successful submission
      window.location.href = "/stores";

    } catch (error: any) {
      console.error("Error creating store:", error);
      setMessage({ type: 'error', text: `Failed to create store: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-10 w-10 text-indigo-600" />
        <p className="ml-3 text-lg text-gray-700">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100 font-sans">
      {/* Removed Sidebar as it's an external component not provided */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create New Store</h1>

          {message.text && (
            <div className={`flex items-center p-3 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
              {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
              <p>{message.text}</p>
            </div>
          )}

          {/* Step 1: Store Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Store Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={storeData.name}
                    onChange={handleStoreDataChange}
                    placeholder="e.g., Central Hub"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                  <Input
                    id="city"
                    value={storeData.city}
                    onChange={handleStoreDataChange}
                    placeholder="e.g., New York"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={storeData.address}
                    onChange={handleStoreDataChange}
                    placeholder="e.g., 123 Main St"
                  />
                </div>
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    value={storeData.latitude}
                    onChange={handleStoreDataChange}
                    placeholder="e.g., 34.0522"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    value={storeData.longitude}
                    onChange={handleStoreDataChange}
                    placeholder="e.g., -118.2437"
                  />
                </div>
                <div>
                  <Label htmlFor="manager_name">Manager Name</Label>
                  <Input
                    id="manager_name"
                    value={storeData.manager_name}
                    onChange={handleStoreDataChange}
                    placeholder="e.g., Jane Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="manager_number">Manager Number</Label>
                  <Input
                    id="manager_number"
                    type="tel"
                    value={storeData.manager_number}
                    onChange={handleStoreDataChange}
                    placeholder="e.g., +1234567890"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-6">
                  <Label>Store Type <span className="text-red-500">*</span></Label>
                  <label className="flex items-center gap-2 text-gray-700">
                    <input
                      type="radio"
                      value="hub"
                      checked={storeData.type === "hub"}
                      onChange={() => handleStoreTypeChange("hub")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    /> Hub
                  </label>
                  <label className="flex items-center gap-2 text-gray-700">
                    <input
                      type="radio"
                      value="garage"
                      checked={storeData.type === "garage"}
                      onChange={() => handleStoreTypeChange("garage")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    /> Garage
                  </label>
                </div>
              </div>

              <div className="pt-5 flex justify-between">
                <Button onClick={() => { /* No back action for step 1 */ }} className="bg-gray-400 hover:bg-gray-500" disabled>Back</Button>
                <Button onClick={() => setStep(2)}>Next</Button>
              </div>
            </div>
          )}

          {/* Step 2: Task Capabilities */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Task Capabilities</h2>
              <p className="text-gray-600 mb-4">Set the capacity for tasks relevant to a <span className="font-medium text-indigo-600">{storeData.type}</span>.</p>
              {filteredTaskTypes.length === 0 ? (
                <p className="text-gray-500">No task types available for this store type or still loading.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTaskTypes.map(task => (
                    <div key={task.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                      <Label htmlFor={`task-${task.id}`} className="font-medium text-gray-800">
                        {task.name} ({task.slot_type === 'per_hour' ? 'Per Hour' : 'Max Per Day'})
                      </Label>
                      <Input
                        id={`task-${task.id}`}
                        type="number"
                        min="0"
                        value={taskCapacities[task.id] ?? 0} // Use 0 if undefined
                        onChange={(e) => handleTaskCapacityChange(task.id, e.target.value)}
                        className="mt-2"
                        placeholder="Enter capacity"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-5 flex justify-between">
                <Button onClick={() => setStep(1)} className="bg-gray-600 hover:bg-gray-700">Back</Button>
                {storeData.type === "garage" ? (
                  <Button onClick={() => setStep(3)}>Next</Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Store...
                      </span>
                    ) : (
                      'Create Store'
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Tag to Hubs (only for Garage type) */}
          {step === 3 && storeData.type === "garage" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Associate with Hubs</h2>
              <p className="text-gray-600 mb-4">Search and select hubs to associate this garage with.</p>
              <div>
                <Label htmlFor="hubSearch">Search Hubs</Label>
                <Input
                  id="hubSearch"
                  type="text"
                  value={hubSearch}
                  onChange={(e) => setHubSearch(e.target.value)}
                  placeholder="Search and add hub"
                  className="mb-2"
                />
                {filteredHubs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 p-2 border rounded-md bg-gray-50 max-h-40 overflow-y-auto">
                    {filteredHubs.map((hub) => (
                      <button
                        key={hub.id}
                        onClick={() => {
                          setSelectedHubIds([...selectedHubIds, hub.id]);
                          setHubSearch(""); // Clear search after selection
                        }}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors duration-200"
                      >
                        + {hub.name} ({hub.city})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedHubIds.length > 0 && (
                <div className="mt-4">
                  <Label>Selected Hubs:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedHubIds.map((id) => {
                      const hub = hubs.find((h) => h.id === id);
                      return hub ? (
                        <span key={id} className="bg-gray-200 px-3 py-1 rounded-full text-sm flex items-center">
                          {hub.name}
                          <button
                            onClick={() => setSelectedHubIds((prev) => prev.filter((x) => x !== id))}
                            className="ml-2 text-gray-600 hover:text-gray-800"
                          >
                            &times;
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {selectedHubIds.length === 0 && (
                <p className="text-red-500 text-sm">Please select at least one hub.</p>
              )}


              <div className="pt-5 flex justify-between">
                <Button onClick={() => setStep(2)} className="bg-gray-600 hover:bg-gray-700">Back</Button>
                <Button onClick={handleSubmit} disabled={submitting || selectedHubIds.length === 0}>
                  {submitting ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Store...
                    </span>
                  ) : (
                    'Create Store'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
