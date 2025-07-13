export const STATUS_ORDER = ["new", "contacted", "interested", "converted", "lost"];

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  converted: "Converted",
  lost: "Lost",
};

export const STATUS_COLORS: Record<string, string> = {
  new: "bg-yellow-100",
  contacted: "bg-blue-100",
  interested: "bg-purple-100",
  converted: "bg-green-100",
  lost: "bg-red-100",
};

export const REMARK_SUGGESTIONS: Record<string, string[]> = {
  new: ["Need to contact", "Verify phone", "Check city availability"],
  contacted: ["Follow up", "Waiting for response", "Send quote"],
  interested: ["Negotiate", "Confirm time", "Ask for address"],
  converted: ["Mark as paid", "Assign to garage", "Schedule appointment"],
  lost: ["Not interested", "Switched provider", "Invalid lead"],
};
