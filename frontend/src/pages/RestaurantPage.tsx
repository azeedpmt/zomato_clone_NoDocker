import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { IMenuItem, IRestaurant } from "../types";
import { restaurantService } from "../main";
import axios from "axios";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";

const RestaurantPage = () => {
  const { id } = useParams();

  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);

  const fetchRestaurant = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log("Restaurant data:", data); 
      setRestaurant(data || null);
      setError(null);
    } catch (error: any) {
      console.error("Error fetching restaurant:", error);
      setError(error?.response?.data?.message || "Failed to fetch restaurant");
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    setMenuLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Try different possible endpoints
      let data;
      let success = false;
      
      // Try the original endpoint first
      try {
        const response = await axios.get(
          `${restaurantService}/api/items/restaurant/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        data = response.data;
        success = true;
      } catch (err: any) {
        console.log("First endpoint failed, trying alternative...");
        
        // Try alternative endpoint
        try {
          const response = await axios.get(
            `${restaurantService}/api/menu/restaurant/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          data = response.data;
          success = true;
        } catch (err2: any) {
          console.log("Second endpoint failed, trying third alternative...");
          
          // Try another alternative endpoint
          try {
            const response = await axios.get(
              `${restaurantService}/api/items/all/${id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            data = response.data;
            success = true;
          } catch (err3: any) {
            console.error("All endpoints failed:", err3);
            throw err3;
          }
        }
      }
      
      if (success && data) {
        console.log("Menu items response:", data);
        
        // Handle different response structures
        if (data.items && Array.isArray(data.items)) {
          setMenuItems(data.items);
        } else if (data.menuItems && Array.isArray(data.menuItems)) {
          setMenuItems(data.menuItems);
        } else if (Array.isArray(data)) {
          setMenuItems(data);
        } else {
          setMenuItems([]);
          console.warn("Unexpected data structure:", data);
        }
      } else {
        setMenuItems([]);
      }
    } catch (err: any) {
      console.error("ERROR fetching menu items:", err?.response || err);
      setMenuItems([]);
      // Don't show error to user for menu items, just show empty state
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRestaurant();
      fetchMenuItems();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-gray-500">Loading restaurant...</p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">
            {error || "No restaurant with this id"}
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-blue-500 hover:text-blue-600 underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-6">
      <RestaurantProfile 
        restaurant={restaurant} 
        onUpdate={setRestaurant} 
        isSeller={false}
      />
      <div className="rounded-xl bg-white shadow-sm p-4">
        {menuLoading ? (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">Loading menu items...</p>
          </div>
        ) : (
          <MenuItems 
            isSeller={false} 
            items={menuItems} 
            onItemDeleted={() => {}} 
          />
        )}
      </div>
    </div>
  );
};

export default RestaurantPage;
