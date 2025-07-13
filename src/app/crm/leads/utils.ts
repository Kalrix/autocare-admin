import { supabase } from "@/lib/supabase";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  city: string;
  vehicle: string;
  issue: string;
  date: string | null;
  time: string | null;
  source: string;
  remark: string | null;
  status: string;
  created_at: string;
};

export async function updateLeadStatus(
  id: string,
  status: string,
  remark: string,
  setLeads: Function
) {
  const { error } = await supabase.from("leads").update({ status, remark }).eq("id", id);
  if (!error) {
    setLeads((prev: Lead[]) =>
      prev.map((l) => (l.id === id ? { ...l, status, remark } : l))
    );
  }
}

export async function createLead(payload: Omit<Lead, "id" | "created_at" | "status">) {
  const { data, error } = await supabase.from("leads").insert([
    {
      ...payload,
      status: "new", // default
      city: "Bhopal", // forced
      source: "Website", // forced
    },
  ]);

  if (error) throw new Error(error.message);
  return data?.[0];
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const { error } = await supabase
    .from("carwash")
    .update({ status })
    .eq("id", bookingId);

  if (error) {
    console.error("Failed to update booking status:", error.message);
    return false;
  }
  return true;
}