// frontend/src/pages/Home.tsx - Complete updated file

import { useSearchParams } from "react-router-dom";
import { useAppData } from "../contexts/AppContext";
import { useEffect, useState } from "react";
import type { IRestaurant } from "../types";
import { restaurantService } from "../main";
import axios from "axios";
import RestaurantCard from "../components/RestaurantCard";

const Home = () => {
  const { location, loadingLocation, fetchLocation } = useAppData();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  
  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState(false);

  // Calculate distance in km between two coordinates
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c).toFixed(2);
  };

  // Fetch restaurants after location is ready
  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!location?.latitude || !location?.longitude) {
        if (!loadingLocation && !location) {
          setLocationError(true);
          setError("Location not available. Please enable location access.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setLocationError(false);
        
        const token = localStorage.getItem("token");
        
        console.log("Fetching restaurants for location:", location.latitude, location.longitude);
        
        const { data } = await axios.get(`${restaurantService}/api/restaurant/all`, {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 10000, // 10km radius
            search: search || undefined,
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        console.log("Restaurants API response:", data);

        // Handle multiple possible response formats
        let restaurantsData = [];
        if (data?.restaurants) restaurantsData = data.restaurants;
        else if (data?.data) restaurantsData = data.data;
        else if (data?.result) restaurantsData = data.result;
        else if (Array.isArray(data)) restaurantsData = data;
        else restaurantsData = [];

        setRestaurants(restaurantsData);
      } catch (err: any) {
        console.error("Fetch restaurants error:", err);
        setError(err?.response?.data?.message || "Failed to load restaurants");
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [location, search, loadingLocation]);

  // Retry location
  const retryLocation = () => {
    setLocationError(false);
    setError(null);
    fetchLocation();
  };

  // Show loading states
  if (loadingLocation || (loading && !location)) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-gray-500">
          {loadingLocation ? "Getting your location..." : "Loading restaurants..."}
        </p>
      </div>
    );
  }

  // Show error if location is not available
  if (locationError || (!location && !loadingLocation)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Unable to get your location</p>
        <button
          onClick={retryLocation}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={retryLocation}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Main render: restaurant cards
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {restaurants.length > 0 ? (
        <>
          {search && (
            <p className="mb-4 text-gray-600">
              Showing results for: "{search}"
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {restaurants.map((res) => {
              if (!res.autoLocation?.coordinates || !location) return null;

              const [lng, lat] = res.autoLocation.coordinates;
              const distance = getDistanceKm(
                location.latitude,
                location.longitude,
                lat,
                lng
              );

              return (
                <RestaurantCard
                  key={res._id}
                  id={res._id}
                  name={res.name}
                  image={res.image || ""}
                  distance={`${distance} km`}
                  isOpen={res.isOpen}
                />
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-center text-gray-500 mb-4">
            {search ? `No restaurants found for "${search}"` : "No restaurants found near you"}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Try moving to a different location or increasing your search radius
          </p>
          {search && (
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;


