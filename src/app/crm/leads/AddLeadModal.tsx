"use client";

import { useState } from "react";
import { createLead } from "./utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const ISSUES = [
  "General Service",
  "Car Washing",
  "Electrical Work",
  "Free Check Up",
  "Accident Repair",
  "Tyre & Brake Issue",
  "Battery Problem",
  "Engine Diagnostics",
  "Other",
];

const VEHICLE_TYPES = ["Bike", "Car", "Auto", "Truck"];

const TIME_SLOTS = [
  "09:00 AM – 10:00 AM",
  "10:00 AM – 11:00 AM",
  "11:00 AM – 12:00 PM",
  "12:00 PM – 01:00 PM",
  "01:00 PM – 02:00 PM",
  "02:00 PM – 03:00 PM",
  "03:00 PM – 04:00 PM",
  "04:00 PM – 05:00 PM",
  "05:00 PM – 06:00 PM",
  "06:00 PM – 07:00 PM",
];

export default function AddLeadModal({ open, onClose, onAdded }: AddLeadModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [issue, setIssue] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setPhone("");
    setIssue("");
    setVehicle("");
    setDate("");
    setTime("");
  };

  const handleSubmit = async () => {
    if (!name || !phone || !issue || !vehicle || !date || !time) {
      alert("Please fill all fields");
      return;
    }

    if (phone.length !== 10) {
      alert("Phone number must be 10 digits");
      return;
    }

    setLoading(true);
    try {
      await createLead({
        name,
        phone,
        city: "Bhopal",
        vehicle,
        issue,
        date,
        time,
        source: "Website",
        remark: "",
      });
      resetForm();
      onAdded();
      onClose();
    } catch (err) {
      console.error("Error creating lead:", err);
      alert("Failed to add lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              if (digits.length <= 10) setPhone(digits);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            maxLength={10}
            required
          />
          <select
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            required
          >
            <option value="">Select Issue</option>
            {ISSUES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>

          <select
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            required
          >
            <option value="">Select Vehicle Type</option>
            {VEHICLE_TYPES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            required
          />

          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            required
          >
            <option value="">Select Time Slot</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Lead"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
