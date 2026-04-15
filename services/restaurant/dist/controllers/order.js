import TryCatch from "../middlewares/trycatch.js";
import Address from "../models/Address.js";
import Cart from "../models/Cart.js";
import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import axios from "axios";
import { publishEvent } from "../config/order.publisher.js";
export const createOrder = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            message: "unauthorized",
        });
    }
    const { paymentMethod, addressId } = req.body;
    if (!addressId) {
        return res.status(400).json({
            message: "Address is required",
        });
    }
    const address = await Address.findOne({
        _id: addressId,
        userId: user._id,
    });
    if (!address) {
        return res.status(404).json({
            message: "Address not found"
        });
    }
    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return +(R * c).toFixed(2);
    };
    const cartItems = await Cart.find({ userId: user._id })
        .populate("itemId")
        .populate("restaurantId");
    if (cartItems.length === 0) {
        return res.status(400).json({ message: "cart is empty" });
    }
    const firstCartItem = cartItems[0];
    if (!firstCartItem || !firstCartItem.restaurantId) {
        return res.status(400).json({
            message: "Invalid Cart Data",
        });
    }
    const restaurantId = firstCartItem.restaurantId._id;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
        return res.status(404).json({
            message: "No restaurant with this id",
        });
    }
    if (!restaurant.isOpen) {
        return res.status(404).json({
            message: "Sorry this restaurant is closed for now",
        });
    }
    const distance = getDistanceKm(address.location.coordinates[1], address.location.coordinates[0], restaurant.autoLocation.coordinates[1], restaurant.autoLocation.coordinates[0]);
    let subtotal = 0;
    const orderItems = cartItems.map((Cart) => {
        const item = Cart.itemId;
        if (!item) {
            throw new Error("Invalid cart item");
        }
        const itemTotal = item.price * Cart.quauntity;
        subtotal += itemTotal;
        return {
            itemId: item._id.toString(),
            name: item.name,
            price: item.price,
            quauntity: Cart.quauntity,
        };
    });
    const deliveryFee = subtotal < 250 ? 49 : 0;
    const platformFee = 7;
    const totalAmount = subtotal + deliveryFee + platformFee;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const [longitude, latitude] = address.location.coordinates;
    const riderAmount = Math.ceil(distance) * 17;
    const order = await Order.create({
        userId: user._id.toString(),
        restaurantId: restaurantId.toString(),
        restaurantName: restaurant.name,
        riderId: null,
        distance,
        riderAmount,
        items: orderItems,
        subtotal,
        deliveryFee, platformFee,
        totalAmount, addressId: address._id.toString(),
        deliveryAddress: {
            formattedAddress: address.formattedAddress,
            mobile: address.mobile,
            latitude, longitude,
        },
        paymentMethod,
        paymentStatus: "pending",
        status: "placed",
        expiresAt,
    });
    await Cart.deleteMany({ userId: user._id });
    res.json({
        message: "Order created successfully",
        orderId: order._id.toString(),
        amount: totalAmount,
    });
});
export const fetchOrderForPayment = TryCatch(async (req, res) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
            message: "Forbidden",
        });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
        return res.status(404).json({
            message: "order not found",
        });
    }
    if (order.paymentStatus !== "pending") {
        return res.status(400).json({
            message: "order already paid",
        });
    }
    res.json({
        orderId: order._id,
        amount: order.totalAmount,
        currency: "INR",
    });
});
export const fecthRestaurantOrders = TryCatch(async (req, res) => {
    const user = req.user;
    const { restaurantId } = req.params;
    if (!user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
    if (!restaurantId) {
        return res.status(400).json({
            message: "Restaurant id is required",
        });
    }
    const { limit } = req.query.limit ? Number(req.query.limit) : 0;
    const orders = await Order.find({
        restaurantId,
        paymentStatus: "paid",
    }).sort({ createdAt: -1 }).limit(limit);
    return res.json({
        success: true,
        count: orders.length,
        orders,
    });
});
// Add this constant at the top
const ALLOWED_STATUSES = ["accepted", "preparing", "ready_for_rider"];
export const updateOrderStatus = TryCatch(async (req, res) => {
    const user = req.user;
    const { orderId } = req.params;
    const { status } = req.body;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid order status" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }
    if (order.paymentStatus !== "paid") {
        return res.status(404).json({ message: "Order not paid" });
    }
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
    }
    if (restaurant.ownerId.toString() !== user._id.toString()) {
        return res.status(401).json({ message: "You are not allowed to update this order" });
    }
    order.status = status;
    await order.save();
    console.log(`Order ${orderId} status updated to: ${status}`);
    // Notify customer
    await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:update",
        room: `user:${order.userId}`,
        payload: {
            orderId: order._id,
            status: order.status,
        }
    }, {
        headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        }
    });
    // If order is ready for rider, publish to queue
    if (status === "ready_for_rider") {
        console.log(`📢 Order ${order._id} ready for rider. Publishing to queue...`);
        await publishEvent("ORDER_READY_FOR_RIDER", {
            orderId: order._id.toString(),
            restaurantId: restaurant._id.toString(),
            location: {
                type: "Point",
                coordinates: restaurant.autoLocation.coordinates
            },
        });
        console.log(`✅ Event published for order ${order._id}`);
    }
    res.json({
        message: "Order status updated successfully",
        order,
    });
});
export const getMyOrders = TryCatch(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
    const order = await Order.find({
        userId: req.user._id.toString(),
        paymentStatus: "paid",
    }).sort({ createdAt: -1 });
    res.json({ order });
});
export const fetchSingleOrder = TryCatch(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
        return res.status(404).json({
            message: "Order not found",
        });
    }
    if (order.userId !== req.user._id.toString()) {
        return res.status(401).json({
            message: "you are not allowed to view this order",
        });
    }
    res.json(order);
});
export const assignRiderToOrder = TryCatch(async (req, res) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
            message: "Forbidden",
        });
    }
    const { orderId, riderId, riderName, riderPhone } = req.body;
    // Check if rider already has an active order
    const orderAvailable = await Order.findOne({
        riderId,
        status: { $nin: ["delivered", "cancelled"] },
    });
    if (orderAvailable) {
        return res.status(400).json({
            message: "You already have an active order",
        });
    }
    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({
            message: "Order not found",
        });
    }
    if (order.riderId !== null) {
        return res.status(400).json({
            message: "Order already taken",
        });
    }
    const orderUpdated = await Order.findOneAndUpdate({ _id: orderId, riderId: null }, {
        riderId,
        riderName,
        riderPhone,
        status: "rider_assigned",
    }, { new: true });
    // Notify user
    await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:rider_assigned",
        room: `user:${order.userId}`,
        payload: {
            orderId: order._id,
            status: orderUpdated?.status,
        }
    }, {
        headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        }
    });
    // Notify restaurant
    await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:rider_assigned",
        room: `restaurant:${order.restaurantId}`,
        payload: orderUpdated,
    }, {
        headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        }
    });
    res.json({
        message: "Rider assigned successfully",
        success: true,
        order: orderUpdated,
    });
});
export const getCurrentOrderForRider = TryCatch(async (req, res) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
            message: "Forbidden",
        });
    }
    const { riderId } = req.query;
    if (!riderId) {
        return res.status(400).json({
            message: "Rider id is required",
        });
    }
    console.log("Getting current order for rider:", riderId);
    // Find active order (not delivered or cancelled)
    const order = await Order.findOne({
        riderId: riderId,
        status: { $nin: ["delivered", "cancelled"] }
    }).sort({ createdAt: -1 });
    if (!order) {
        return res.json({
            order: null
        });
    }
    // Get restaurant name if not already set
    if (!order.restaurantName) {
        const restaurant = await Restaurant.findById(order.restaurantId);
        if (restaurant) {
            order.restaurantName = restaurant.name;
        }
    }
    // Ensure deliveryAddress exists
    if (!order.deliveryAddress && order.addressId) {
        const address = await Address.findById(order.addressId);
        if (address) {
            order.deliveryAddress = {
                formattedAddress: address.formattedAddress,
                mobile: address.mobile,
                latitude: address.location.coordinates[1],
                longitude: address.location.coordinates[0],
            };
            await order.save();
        }
    }
    res.json(order);
});
export const updateOrderStatusRider = TryCatch(async (req, res) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
            message: "Forbidden",
        });
    }
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({
            message: "Order not found",
        });
    }
    let newStatus = "";
    if (order.status === "rider_assigned") {
        newStatus = "picked_up";
    }
    else if (order.status === "picked_up") {
        newStatus = "delivered";
    }
    else {
        return res.status(400).json({
            message: `Cannot update order from status: ${order.status}`,
        });
    }
    order.status = newStatus;
    await order.save();
    console.log(`Order ${orderId} status updated by rider to: ${newStatus}`);
    // Notify restaurant
    await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:update",
        room: `restaurant:${order.restaurantId}`,
        payload: {
            orderId: order._id,
            status: order.status,
        }
    }, {
        headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        }
    });
    // Notify customer
    await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:update",
        room: `user:${order.userId}`,
        payload: {
            orderId: order._id,
            status: order.status,
        }
    }, {
        headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        }
    });
    res.json({
        message: "Order updated successfully",
        order,
    });
});
