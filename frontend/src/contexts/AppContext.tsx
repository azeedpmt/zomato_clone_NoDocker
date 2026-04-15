

import { createContext, useState, useEffect, ReactNode, useContext } from "react";
import axios from "axios";
import { restaurantService } from "../main";
import type { ICart } from "../types";

interface User {
  name?: string;
  email?: string;
  picture?: string;
  role?: string;
   _id?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface AppContextType {
  user: User | null;
  isAuth: boolean;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  location: LocationData | null;
  loadingLocation: boolean;
  city: string;
  Cart: ICart[];
  subTotal: number;
  quauntity: number;
  fetchCart: () => Promise<void>;
  fetchLocation: () => void;
  logout: () => void;
}

interface AppProviderProps {
  children: ReactNode;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [city, setCity] = useState("Select Location");

  const [Cart, setCart] = useState<ICart[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [quauntity, setQuauntity] = useState(0);

  const authService = "http://localhost:5000";

  // ================= LOGOUT FUNCTION =================
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuth(false);
    setCart([]);
    setSubTotal(0);
    setQuauntity(0);
    // Don't clear location, keep it for next login
  };


  // ================= USER =================
  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const { data } = await axios.get(`${authService}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Fetched user:", data);
      setUser(data);
      setIsAuth(true);
    } catch (err) {
      console.log("User fetch error:", err);
      localStorage.removeItem("token");
      setUser(null);
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  };

  // ================= CART =================
  const fetchCart = async () => {
    if (!user || user.role !== "customer") return;

    try {
      const { data } = await axios.get(`${restaurantService}/api/cart/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setCart(data.cart || []);
      setSubTotal(data.subtotal || 0);
      setQuauntity(data.cartLength || 0);
    } catch (error) {
      console.log("Cart error:", error);
    }
  };

  useEffect(() => {
    if (user?.role === "customer") {
      fetchCart();
    }
  }, [user]);

  // ================= LOCATION =================
  const getLocationFromBrowser = (): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      console.log("Trying browser geolocation...");

      if (!navigator.geolocation) {
        console.log("Geolocation not supported");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("SUCCESS location:", position.coords);
          resolve(position);
        },
        (error) => {
          console.log("ERROR location:", error.message);
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  const getLocationFromIP = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();

      if (data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city,
          address: `${data.city}, ${data.country_name}`,
        };
      }
    } catch (err) {
      console.log("IP location error:", err);
    }
    return null;
  };

  // const fetchLocation = async () => {
  //   setLoadingLocation(true);
  //   console.log("Fetching location...");

  //   try {
  //     // 1. Browser location
  //     const browserLocation = await getLocationFromBrowser();

  //     if (browserLocation) {
  //       const { latitude, longitude } = browserLocation.coords;

  //       setLocation({
  //         latitude,
  //         longitude,
  //         formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
  //       });

  //       setCity("Current Location");
  //       return;
  //     }

  //     // 2. Fallback to IP
  //     console.log("Falling back to IP location...");

  //     const ipLocation = await getLocationFromIP();

  //     if (ipLocation) {
  //       setLocation({
  //         latitude: ipLocation.latitude,
  //         longitude: ipLocation.longitude,
  //         formattedAddress: ipLocation.address,
  //       });

  //       setCity(ipLocation.city);
  //     } else {
  //       setCity("Location unavailable");
  //       setLocation(null);
  //     }
  //   } catch (err) {
  //     console.log("Location error:", err);
  //     setCity("Location error");
  //   } finally {
  //     setLoadingLocation(false);
  //   }
  // };

  // ================= EFFECTS =================
  
  // REMOVED ipapi.co - using browser geolocation only
  const fetchLocation = async () => {
    setLoadingLocation(true);
    console.log("Fetching location from browser...");

    try {
      const browserLocation = await getLocationFromBrowser();

      if (browserLocation) {
        const { latitude, longitude } = browserLocation.coords;

        // Try to get address from OpenStreetMap (free, no API key needed)
        let formattedAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const geoData = await geoRes.json();
          if (geoData.display_name) {
            formattedAddress = geoData.display_name;
            // Extract city from address
            const cityComponent = geoData.address?.city || 
                                  geoData.address?.town || 
                                  geoData.address?.village || 
                                  "Current Location";
            setCity(cityComponent);
          } else {
            setCity("Current Location");
          }
        } catch (err) {
          console.log("Reverse geocoding failed:", err);
          setCity("Current Location");
        }

        setLocation({
          latitude,
          longitude,
          formattedAddress,
        });
      } else {
        console.log("No location available");
        setCity("Location unavailable");
        setLocation(null);
      }
    } catch (err) {
      console.log("Location error:", err);
      setCity("Location error");
      setLocation(null);
    } finally {
      setLoadingLocation(false);
    }
  };
  
  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
     if (isAuth) {
      fetchLocation();
    }
    
     // ✅ FIXED
  }, [isAuth]);

  useEffect(() => {
    console.log("Location updated:", location);
  }, [location]);

  return (
    <AppContext.Provider
      value={{
        user,
        isAuth,
        loading,
        setUser,
        setIsAuth,
        setLoading,
        location,
        loadingLocation,
        city,
        fetchLocation,
        Cart,
        fetchCart,
        quauntity,
        subTotal,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// ================= HOOK =================
export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }
  return context;
};