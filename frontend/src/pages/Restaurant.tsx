

import { useEffect, useState } from "react";
import type { IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import AddRestaurant from "../components/AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import AddMenuItem from "../components/AddMenuItem";
import RestaurantOrders from "../components/RestaurantOrders";

type SellerTab = "menu" | "add-item" | "sales";

const Restaurant = () => {
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SellerTab>("menu");
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [error, setError] = useState<string>("");

  // -----------------------------
  // ✅ Fetch the logged-in seller's restaurant
  // -----------------------------
  const fetchMyRestaurant = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please log in.");

      console.log("Fetching my restaurant with token:", token);

      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/my`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Restaurant data received:", data);

      setRestaurant(data.restaurant || null);

      if (data.token) localStorage.setItem("token", data.token);
    } catch (err: any) {
      console.error("Error fetching restaurant:", err);
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // ✅ Fetch menu items for a given restaurant
  // -----------------------------
  // const fetchMenuItems = async (restaurantId: string) => {
  //   if (!restaurantId) {
  //     console.warn("Cannot fetch menu items: restaurantId is missing");
  //     setMenuItems([]);
  //     return;
  //   }

  //   try {
  //     const token = localStorage.getItem("token");
  //     if (!token) throw new Error("No token found. Please log in.");

  //     console.log("Fetching menu items for restaurant:", restaurantId);

  //     const { data } = await axios.get(
  //       `${restaurantService}/api/items/all/${restaurantId}`,
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );

  //     console.log("Menu items received:", data);

  //     if (Array.isArray(data)) setMenuItems(data);
  //     else if (data.items) setMenuItems(data.items);
  //     else setMenuItems([]);
  //   } catch (err: any) {
  //     console.error("Error fetching menu items:", err?.response?.data || err.message);
  //     setError(err?.response?.data?.error || "Failed to fetch menu items.");
  //     setMenuItems([]);
  //   }
  // };

  const fetchMenuItems = async (restaurantId: string) => {
  if (!restaurantId) {
    console.warn("No restaurant ID");
    setMenuItems([]);
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const { data } = await axios.get(
      `${restaurantService}/api/items/restaurant/${restaurantId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Menu items response:", data);

    if (data?.items) {
      setMenuItems(data.items);
    } else {
      setMenuItems([]);
    }
  } catch (err: any) {
    console.error("ERROR:", err?.response || err);

    setError(
      err?.response?.data?.error || "Failed to fetch menu items"
    );

    setMenuItems([]);
  }
};

  // -----------------------------
  // ✅ Load restaurant on mount
  // -----------------------------
  useEffect(() => {
    fetchMyRestaurant();
  }, []);

  // -----------------------------
  // ✅ Load menu items when restaurant is available
  // -----------------------------
  // useEffect(() => {
  //   console.log("Restaurant state changed:", restaurant);
  //   if (restaurant?._id) fetchMenuItems(restaurant._id);
  //   else console.warn("Restaurant ID not available yet, skipping menu fetch");
  // }, [restaurant]);
useEffect(() => {
  if (!restaurant?._id) return;

  console.log("Fetching menu for restaurant:", restaurant._id);
  fetchMenuItems(restaurant._id);
}, [restaurant?._id]);
  // -----------------------------
  // ✅ Loading state
  // -----------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading your restaurant...</p>
      </div>
    );
  }

  // -----------------------------
  // ✅ No restaurant exists
  // -----------------------------
  if (!restaurant) {
    return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />;
  }

  // -----------------------------
  // ✅ Render restaurant profile + tabs
  // -----------------------------
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-6">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <RestaurantProfile
        restaurant={restaurant}
        onUpdate={setRestaurant}
        isSeller={true}
      />

      <RestaurantOrders restaurantId={restaurant._id}/>

      <div className="rounded-xl bg-white shadow-sm">
        {/* Tabs */}
        <div className="flex border-b">
          {[
            { key: "menu", label: "Menu Items" },
            { key: "add-item", label: "Add Item" },
            { key: "sales", label: "Sales" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as SellerTab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                tab === t.key
                  ? "border-b-2 border-red-500 text-red-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {tab === "menu" && (
            <MenuItems
              items={menuItems}
              onItemDeleted={() => fetchMenuItems(restaurant._id)}
              isSeller={true}
            />
          )}

          {tab === "add-item" && (
            <AddMenuItem onItemAdded={() => fetchMenuItems(restaurant._id)} />
          )}

          {tab === "sales" && <p>Sales Page</p>}
        </div>
      </div>
    </div>
  );
};

export default Restaurant;
