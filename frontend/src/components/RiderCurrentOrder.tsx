

import toast from "react-hot-toast";
import { riderService } from "../main";
import type { IOrder } from "../types"
import axios from 'axios';
import { useState } from "react";

interface Props {
    order: IOrder;
    onStatusUpdate: () => void;
}

const RiderCurrentOrder = ({ order, onStatusUpdate }: Props) => {
    const [updating, setUpdating] = useState(false);

    const updateStatus = async () => {
        let nextStatus = "";
        
        if (order.status === "rider_assigned") {
            nextStatus = "picked_up";
        } else if (order.status === "picked_up") {
            nextStatus = "delivered";
        } else {
            toast.error("Cannot update order status from current state");
            return;
        }

        setUpdating(true);
        try {
            const response = await axios.put(
                `${riderService}/api/rider/order/update/${order._id}`,
                { status: nextStatus },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.data.success || response.status === 200) {
                toast.success(`Order ${nextStatus === "picked_up" ? "picked up" : "delivered"} successfully!`);
                onStatusUpdate();
            } else {
                toast.error(response.data?.message || "Failed to update status");
            }
        } catch (error: any) {
            console.error("Status update error:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to update status");
        } finally {
            setUpdating(false);
        }
    }

    if (!order.deliveryAddress || !order.deliveryAddress.formattedAddress) {
        return (
            <div className="rounded-xl bg-white shadow-sm p-4 space-y-4">
                <h1 className="font-semibold text-gray-800">Current Order</h1>
                <div className="text-red-500 text-center py-4">
                    ⚠️ Delivery address not available for this order
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                    <p><b>Order ID:</b> {order._id.slice(-6)}</p>
                    <p><b>Restaurant:</b> {order.restaurantName || "Unknown"}</p>
                    <p><b>Status:</b> <span className="capitalize">{order.status?.replace(/_/g, " ") || "Unknown"}</span></p>
                </div>
            </div>
        );
    }

    const deliveryAddress = order.deliveryAddress;
    const restaurantName = order.restaurantName || "Restaurant";
    const formattedAddress = deliveryAddress.formattedAddress;
    const customerMobile = deliveryAddress.mobile;
    const customerLatitude = deliveryAddress.latitude;
    const customerLongitude = deliveryAddress.longitude;
    const totalAmount = order.totalAmount || 0;
    const riderAmount = order.riderAmount || 0;
    const status = order.status || "unknown";

    const openGoogleMaps = () => {
        if (customerLatitude && customerLongitude) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${customerLatitude},${customerLongitude}`;
            window.open(url, '_blank');
        } else {
            const encodedAddress = encodeURIComponent(formattedAddress);
            const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
            window.open(url, '_blank');
        }
    };

    return (
        <div className="rounded-xl bg-white shadow-sm p-4 space-y-4">
            <h1 className="font-semibold text-gray-800">Current Order</h1>

            {/* Restaurant Pickup Info */}
            <div className="rounded-lg bg-orange-50 p-3 border border-orange-200">
                <p className="text-xs text-orange-600 font-semibold mb-1">📍 PICKUP FROM</p>
                <p className="font-medium text-gray-800">{restaurantName}</p>
            </div>

            {/* Customer Delivery Info */}
            <div className="rounded-lg bg-green-50 p-3 border border-green-200">
                <p className="text-xs text-green-600 font-semibold mb-1">🏠 DELIVER TO</p>
                <p className="font-medium text-gray-800">{formattedAddress}</p>
                {customerLatitude && customerLongitude && (
                    <p className="text-xs text-gray-500 mt-1">
                        📍 Lat: {customerLatitude.toFixed(4)}, Lng: {customerLongitude.toFixed(4)}
                    </p>
                )}
                <button 
                    onClick={openGoogleMaps}
                    className="mt-2 text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center gap-1"
                >
                    🗺️ Open in Google Maps
                </button>
            </div>

            {/* Customer Contact */}
            {customerMobile && (
                <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold mb-1">📞 CUSTOMER CONTACT</p>
                    <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-800">{customerMobile}</p>
                        <a 
                            href={`tel:${customerMobile}`} 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                        >
                            Call Now
                        </a>
                    </div>
                </div>
            )}

            {/* Order Details */}
            <div className="border-t pt-3 space-y-2">
                <h3 className="font-semibold text-gray-700">Order Details</h3>
                
                <div className="space-y-1 max-h-40 overflow-y-auto">
                    {order.items && order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <span>{item.name} x {item.quauntity}</span>
                            <span>₹{item.price * item.quauntity}</span>
                        </div>
                    ))}
                </div>

                <div className="border-t pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>₹{order.subtotal || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Delivery Fee:</span>
                        <span>₹{order.deliveryFee || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Platform Fee:</span>
                        <span>₹{order.platformFee || 0}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1">
                        <span>Total:</span>
                        <span>₹{totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Your Earning:</span>
                        <span>₹{riderAmount}</span>
                    </div>
                </div>
            </div>

            {/* Order Status */}
            <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Current Status:</span>
                    <span className={`capitalize px-2 py-1 rounded-full text-xs font-semibold ${
                        status === "rider_assigned" ? "bg-yellow-100 text-yellow-700" :
                        status === "picked_up" ? "bg-purple-100 text-purple-700" :
                        status === "delivered" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-700"
                    }`}>
                        {status.replace(/_/g, " ")}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
                {status === "rider_assigned" && (
                    <button 
                        onClick={updateStatus} 
                        disabled={updating}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg py-3 font-semibold transition disabled:opacity-50"
                    >
                        {updating ? "Processing..." : "✅ Pick Up Order"}
                    </button>
                )}

                {status === "picked_up" && (
                    <button 
                        onClick={updateStatus} 
                        disabled={updating}
                        className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-3 font-semibold transition disabled:opacity-50"
                    >
                        {updating ? "Processing..." : "🚚 Mark as Delivered"}
                    </button>
                )}
                
                {status === "delivered" && (
                    <div className="text-center text-green-600 font-semibold py-2">
                        ✅ Order Completed
                    </div>
                )}
            </div>

            <div className="text-xs text-gray-400 text-center border-t pt-3">
                <p>⚠️ Please handle the order with care</p>
                <p>📞 Contact customer if you have trouble finding the address</p>
            </div>
        </div>
    )
}

export default RiderCurrentOrder;