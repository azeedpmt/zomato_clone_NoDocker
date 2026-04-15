

// frontend/src/pages/Orders.tsx

import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { restaurantService } from "../main";
import { useSocket } from "../contexts/SocketContext";

const ACTIVE_STATUSES = ["placed", "accepted", "preparing", "ready_for_rider", "rider_assigned", "picked_up"];

const Orders = () => {
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { socket } = useSocket();

    const fetchOrders = async () => {
        try {
            const { data } = await axios.get(`${restaurantService}/api/order/myorder`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            console.log("Fetched orders:", data);
            // Handle different response structures
            const ordersData = data.order || data.orders || data || [];
            setOrders(ordersData);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        if (!socket) return;
        
        const onOrderUpdate = () => {
            console.log("Order update received via socket");
            fetchOrders();
        };
        
        const onOrderAssigned = () => {
            console.log("Order assigned received via socket");
            fetchOrders();
        };
        
        socket.on("order:update", onOrderUpdate);
        socket.on("order:rider_assigned", onOrderAssigned);
        
        return () => {
            socket.off("order:update", onOrderUpdate);
            socket.off("order:rider_assigned", onOrderAssigned);
        };
    }, [socket]);

    if (loading) {
        return <p className="text-center text-gray-500">Loading your orders...</p>;
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">No orders yet</p>
                    <button
                        onClick={() => navigate("/")}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Browse Restaurants
                    </button>
                </div>
            </div>
        );
    }

    const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    const completedOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
            <h1 className="text-2xl font-bold">My Orders</h1>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold">Active Orders ({activeOrders.length})</h2>
                {activeOrders.length === 0 ? (
                    <p className="text-gray-500">No active orders</p>
                ) : (
                    activeOrders.map((order) => (
                        <OrderRow
                            key={order._id}
                            order={order}
                            onClick={() => navigate(`/order/${order._id}`)}
                        />
                    ))
                )}
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold">Completed Orders ({completedOrders.length})</h2>
                {completedOrders.length === 0 ? (
                    <p className="text-gray-500">No completed orders</p>
                ) : (
                    completedOrders.map((order) => (
                        <OrderRow
                            key={order._id}
                            order={order}
                            onClick={() => navigate(`/order/${order._id}`)}
                        />
                    ))
                )}
            </section>
        </div>
    );
};

export default Orders;

const OrderRow = ({ order, onClick }: { order: IOrder; onClick: () => void }) => {
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            placed: "bg-yellow-100 text-yellow-700",
            accepted: "bg-orange-100 text-orange-700",
            preparing: "bg-blue-100 text-blue-700",
            ready_for_rider: "bg-indigo-100 text-indigo-700",
            rider_assigned: "bg-purple-100 text-purple-700",
            picked_up: "bg-pink-100 text-pink-700",
            delivered: "bg-green-100 text-green-700",
            cancelled: "bg-red-100 text-red-700",
        };
        return colors[status] || "bg-gray-100 text-gray-700";
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, " ");
    };

    return (
        <div
            className="cursor-pointer rounded-xl bg-white p-4 shadow-sm hover:bg-gray-50 transition"
            onClick={onClick}
        >
            <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Order #{order._id.slice(-6)}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                    {formatStatus(order.status)}
                </span>
            </div>

            <div className="mt-2 text-sm text-gray-600">
                <p className="font-medium">{order.restaurantName || "Restaurant"}</p>
                <div className="mt-1">
                    {order.items.map((item, i) => (
                        <span key={i}>
                            {item.name} x {item.quauntity}
                            {i < order.items.length - 1 && ", "}
                        </span>
                    ))}
                </div>
            </div>

            <div className="mt-2 flex justify-between text-sm font-medium">
                <span>Total</span>
                <span>₹{order.totalAmount}</span>
            </div>
        </div>
    );
};