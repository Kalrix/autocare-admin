import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project-id.supabase.co', // replace with your project URL
  'your-anon-or-service-role-key'       // replace with anon or service role key
);

const testUpdate = async () => {
  const { error } = await supabase
    .from("carwash")
    .update({ status: "confirmed" })
    .eq("id", "replace-with-valid-booking-id");

  if (error) {
    console.error("❌ Update failed:", error);
  } else {
    console.log("✅ Status updated successfully");
  }
};

testUpdate();
