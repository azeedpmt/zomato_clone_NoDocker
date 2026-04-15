

// src/utils/orderflow.ts

export const ORDER_ACTIONS: Record<string, string[]> = {
  placed: ["accepted"],
  accepted: ["preparing"],
  preparing: ["ready_for_rider"],
  ready_for_rider: ["picked_up"],
  rider_assigned: ["picked_up"],
  picked_up: ["delivered"],
  delivered: [],
  cancelled: [],
};

// Status colors for UI
export const STATUS_COLORS: Record<string, string> = {
  placed: "bg-yellow-100 text-yellow-700",
  accepted: "bg-orange-100 text-orange-700",
  preparing: "bg-blue-100 text-blue-700",
  ready_for_rider: "bg-indigo-100 text-indigo-700",
  rider_assigned: "bg-purple-100 text-purple-700",
  picked_up: "bg-pink-100 text-pink-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};