

import { useEffect, useState } from "react";
import { adminService } from "../main";
import axios from 'axios';
import AdminRestaurantCard from "../components/AdminRestaurantCard";
import RiderAdmin from "../components/RiderAdmin";
import { useAppData } from "../contexts/AppContext";
import { useNavigate } from "react-router-dom";

const Admin = () => {
    const { user, isAuth, loading: authLoading } = useAppData();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState<any[]>([]);
    const [riders, setRiders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"restaurant" | "rider">("restaurant");

    // Check if user is admin
    useEffect(() => {
        if (!authLoading) {
            if (!isAuth) {
                navigate("/login", { replace: true });
            } else if (user?.role !== "admin") {
                navigate("/", { replace: true });
            }
        }
    }, [isAuth, authLoading, user, navigate]);

    const fetchData = async () => {
        try {
            const { data } = await axios.get(`${adminService}/api/v1/admin/restaurant/pending`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });
            const response = await axios.get(`${adminService}/api/v1/admin/rider/pending`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });

            setRestaurant(data.restaurants || []);
            setRiders(response.data.riders || []);
        } catch (error: any) {
            console.log(error);
            if (error.response?.status === 401) {
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user?.role === "admin") {
            fetchData();
        }
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <p className="text-gray-500">Loading admin panel...</p>
            </div>
        );
    }

    // Show nothing while checking auth
    if (!isAuth || user?.role !== "admin") {
        return null;
    }

    return (
        <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome, {user?.name || "Admin"}</p>

            <div className="flex gap-4">
                <button 
                    onClick={() => setTab("restaurant")} 
                    className={`px-4 py-2 rounded ${tab === "restaurant" ? "bg-red-500 text-white" : "bg-gray-200"}`}
                >
                    Restaurants ({restaurant.length})
                </button>
                <button 
                    onClick={() => setTab("rider")} 
                    className={`px-4 py-2 rounded ${tab === "rider" ? "bg-red-500 text-white" : "bg-gray-200"}`}
                >
                    Riders ({riders.length})
                </button>
            </div>

            {tab === 'restaurant' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {restaurant.length === 0 ? 
                        <p className="text-gray-500 col-span-2 text-center py-8">No pending restaurants</p> : 
                        restaurant.map((r) => (
                            <AdminRestaurantCard key={r._id} restaurant={r} onVerify={fetchData} />
                        ))
                    }
                </div>
            )}

            {tab === 'rider' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {riders.length === 0 ? 
                        <p className="text-gray-500 col-span-2 text-center py-8">No pending riders</p> : 
                        riders.map((r) => (
                            <RiderAdmin key={r._id} rider={r} onVerify={fetchData} />
                        ))
                    }
                </div>
            )}
        </div>
    )
}

export default Admin;