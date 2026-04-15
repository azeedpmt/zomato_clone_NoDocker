

import { useEffect, useState } from "react";
import { useAppData } from "../contexts/AppContext";
import { restaurantService, utilsService } from "../main";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import type { ICart, IMenuItem, IRestaurant } from "../types";
import toast from "react-hot-toast";
import { BiCreditCard, BiLoader } from "react-icons/bi";
import {loadStripe} from '@stripe/stripe-js'

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

interface Restaurant {
  _id: string;
  name: string;
  description: string;
  image: string;
  autoLocation: {
    type: string;
    coordinates: [number, number];
    formattedAddress: string;
  };
}

const Checkout = () => {
  const { Cart, subTotal, quauntity, location, city,} = useAppData();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );

  const [loadingAddress, setLoadingAddress] = useState(true);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  const [loadingRazorpay,setLoadingRazorpay]=useState(false);
  const [loadingStripe,setLoadingStripe]=useState(false);
  const [creatingOrder,setCreatingOrder]=useState(false);

  // Fetch addresses regardless of cart
  useEffect(() => {
    const fetchAddresses = async () => {
      console.log("Fetching addresses...");

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No user token found, cannot fetch addresses");
          setAddresses([]);
          setLoadingAddress(false);
          return;
        }

        const { data } = await axios.get(`${restaurantService}/api/address/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("RAW API RESPONSE:", data);

        if (!data || data.length === 0) {
          console.log("No addresses found");
          setAddresses([]);
        } else {
          setAddresses(data);
        }
      } catch (error) {
        console.log("Error fetching addresses:", error);
        setAddresses([]);
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddresses();
  }, []);

  // Log addresses
  useEffect(() => {
    if (addresses.length > 0) {
      console.log("UPDATED ADDRESSES:");
      addresses.forEach((addr) => {
        console.log("ID:", addr._id);
        console.log("Address:", addr.formattedAddress);
        console.log("Mobile:", addr.mobile);
      });
    }
  }, [addresses]);

  // Fetch restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      console.log("Fetching restaurants...");
      try {
        const { data } = await axios.get(`${restaurantService}/api/restaurants`);
        console.log("RAW RESTAURANTS RESPONSE:", data);
        setRestaurants(data || []);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        setRestaurants([]);
      } finally {
        setLoadingRestaurants(false);
      }
    };

    fetchRestaurants();
  }, [Cart]);

  // Log user location
  useEffect(() => {
    if (location) {
      console.log("USER LOCATION:");
      console.log("Latitude:", location.latitude);
      console.log("Longitude:", location.longitude);
      console.log("Formatted Address:", location.formattedAddress);
      console.log("City:", city);
      console.log("--------------------------");
    }
  }, [location, city]);

  const navigate=useNavigate();
  if(!Cart ||Cart.length===0){
    return(
      <div className="flex min-h-[60vh] item-center justify-center">
        <p className="text-gray-500 text-lg">your cart is empty</p>
      </div>
    );
  }   

  const restaurant=Cart[0].restaurantId as IRestaurant;

  const deliveryFee=subTotal<250?49:0;

  const platformFee=7;

  const grandTotal=subTotal+deliveryFee+platformFee;

  const createOrder=async(paymentMethod:"razorpay"|"stripe")=>{
    if(!selectedAddressId) return null;

    setCreatingOrder(true);
    try {
      const {data}=await axios.post(
        `${restaurantService}/api/order/new`,
        {
          paymentMethod,
          addressId:selectedAddressId,
        },
        {
          headers:{
            Authorization:`Bearer ${localStorage.getItem("token")}`,
          }
        }
      )
      return data;
    } catch (error) {
      toast.error("Failed to create order");
    }finally{
      setCreatingOrder(false);
    }
  };

  // Add this function in your Checkout component
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Check if script already exists
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      resolve(true);
      return;
    }
    
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

  // const payWithRazorpay=async()=>{
  //   try{
  //     setLoadingRazorpay(true)

  //     const order = await createOrder("razorpay");
  //     if(!order) return;
  //     const {orderId,amount}=order;
  //     const {data}=await axios.post(`${utilsService}/api/payment/create`,{
  //       orderId,
  //     });

  //     const {razorpayOrderId,key}=data;
  //     const options={
  //       key,
  //       amount:amount*100,
  //        currency: "INR",
  //   name: "Zomato", //your business name
  //   description:"Food orderPayment",
  //   order_id: "razorpayOrderId", // This is a sample Order ID. Pass the `id` obtained in the response of Step 1
  //   handler:async(response:any)=>{
  //     try{
  //       await axios.post(`${utilsService}/api/payment/verify`,{
  //         razorpay_order_id:response.razorpay_order_id,
  //         razorpay_payment_id:response.razorpay_payment_id,
  //         razorpay_signature:response.razorpay_signature,
  //         orderId,
  //       });

  //       toast.success("Payment succesfully done",);
  //       navigate('/paymentsuccess'+response.razorpay_payment_id);
  //     }catch(error){
  //       toast.error("payment verification FAilws....X")
  //     }
  //   },
  //   theme: {
  //       color: "#E23744"
  //   }
  //     }
  //     const razorpay=new (window as any).Razorpay(options);
  //     razorpay.open()
  //   }catch(error){
  //     console.log(error);
  //     toast.error("payment failed please refresh page")
  //   }finally{
  //     setLoadingRazorpay(false);
  //   }
  // }
  const payWithRazorpay = async () => {
  try {
    setLoadingRazorpay(true);

    // ✅ Load Razorpay script first
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      toast.error("Failed to load payment gateway. Please refresh and try again.");
      setLoadingRazorpay(false);
      return;
    }

    // ✅ Small delay to ensure script is fully initialized
    await new Promise(resolve => setTimeout(resolve, 100));

    const order = await createOrder("razorpay");
    if (!order) return;
    
    const { orderId, amount } = order;
    
    const { data } = await axios.post(`${utilsService}/api/payment/create`, {
      orderId,
    });

    const options = {
      key: data.key,
      amount: amount * 100,
      currency: "INR",
      name: "Tomato",
      description: "Food order payment",
      order_id: data.razorpayOrderId,
      handler: async (response) => {
        try {
          await axios.post(`${utilsService}/api/payment/verify`, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId,
          });
          toast.success("Payment successful!");
          navigate('/paymentsuccess/' + response.razorpay_payment_id);
          
        } catch (error) {
          toast.error("Payment verification failed");
        }
      },
      modal: {
        ondismiss: function() {
          toast.error("Payment cancelled");
          setLoadingRazorpay(false);
        }
      },
      theme: {
        color: "#E23744"
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
    
  } catch (error) {
    console.log(error);
    toast.error("Payment failed. Please refresh and try again.");
  } finally {
    setLoadingRazorpay(false);
  }
};

const stripePromise=loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

  const payWithStripe=async()=>{
    try{
      setLoadingStripe(true)
      const order=await createOrder("stripe")
      if(!order) return;
      const {orderId}=order;
      try {
        const stripe=await stripePromise;

        const {data}=await axios.post(`${utilsService}/api/payment/stripe/create`,{
          orderId,
        })
        if(data.url){
          window.location.href=data.url
        }else{
          toast.error("failed to create payment session")
        }
      } catch (error) {
        toast.error("payment failed");
      }
    }catch(error){
      console.log(error);
      toast.error("payment failed");
    }finally{
      setLoadingStripe(false);
    }
  }
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <div className="rounded-xl bg-white p-4 shadow-sm">
         <h2 className="text-lg font-semibold">{restaurant.name}</h2>
         <p className="text-sm-text-gray-500">
          {restaurant.autoLocation.formattedAddress}
         </p>
      </div>
    {/* <div className="rounded-xl-bg-white-p-4-shadow-sm-space-y-3">
      <h3 className="font-semibold">delivery Address</h3>
      {
        loadingAddress?<p className="text-sm text-gray-500">loading address.....</p>:addresses.length===0?<p className="text-sm text-gray-500">
          no address found please add one
        </p>:addresses.map((add)=>(
          <label key={add._id} className={`flex gap-3 rounded-ld border p-3 cursor-pointer transition ${selectedAddressId===add._id?"border-[#e23744] bg-red-50":"hover: bg-gray-50"}`}>

          <input type="radio" checked={selectedAddressId===add._id} onChange={()=>setSelectedAddressId(add._id)}/>

          <div>
            <p className="text-sm font-medium">{add.formattedAddress}</p>
            <p className="text-xs text-gray-500">{add.mobile}</p>
          </div>
          </label>
        ))
      }
      <div className="rounded-xl bg-white p-4 shadow-sm space-y-4">
        <h3 className="font-semibold">order summary</h3>
        {
          Cart.map((cartItem: ICart)=>{
            const item =cartItem.itemId as IMenuItem;

            return <div className="flex justify-between text-sm"key={cartItem._id}>
              <span>
                {item.name} X {cartItem.quauntity}
              </span>
              <span>
                ${item.price * cartItem.quauntity}
              </span>
            </div>
          })
        }

        <hr />
        <div className="flex justify-between text-sm">
          <span>Item ({quauntity})</span>
          <span>${subTotal}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Delivery Fee</span>
          <span>{deliveryFee===0?"Free":`$ ${deliveryFee}`}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Platform fee</span>
          <span>${platformFee}</span>
        </div>

        {subTotal<250 &&(
          <p className="text-xs text-gray-500">Add Item worth ${250-subTotal} more to get free delivery</p>
        )}

        <div className="flex justify-between text-base font-semibold border-t pt-2">
          <span>grand total</span>
          <span>${grandTotal}</span>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <h3 className="font-semibold">payment Method</h3>

        <button disabled={!selectedAddressId||loadingRazorpay||creatingOrder} onClick={payWithRazorpay} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2D7FF9] py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">{loadingRazorpay?<BiLoader size={18} className="animate-spin"/>:<BiCreditCard size={18}/>}Pay With RazorPay</button>

        <button disabled={!selectedAddressId||loadingRazorpay||creatingOrder} onClick={payWithStripe} className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">{loadingRazorpay?<BiLoader size={18} className="animate-spin"/>:<BiCreditCard size={18}/>}Pay With stripe</button>

      </div>
    </div> */}
       
       {/* Delivery Address Section */}
<div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
  <h3 className="font-semibold">Delivery Address</h3>
  {loadingAddress ? (
    <p className="text-sm text-gray-500">Loading address.....</p>
  ) : addresses.length === 0 ? (
    <p className="text-sm text-gray-500">
      No address found. Please add one in{" "}
      <button 
        onClick={() => navigate("/address")} 
        className="text-[#e23744] underline"
      >
        Address Book
      </button>
    </p>
  ) : (
    addresses.map((add) => (
      <label 
        key={add._id} 
        className={`flex gap-3 rounded-lg border p-3 cursor-pointer transition ${
          selectedAddressId === add._id ? "border-[#e23744] bg-red-50" : "hover:bg-gray-50"
        }`}
      >
        <input 
          type="radio" 
          checked={selectedAddressId === add._id} 
          onChange={() => setSelectedAddressId(add._id)}
        />
        <div>
          <p className="text-sm font-medium">{add.formattedAddress}</p>
          <p className="text-xs text-gray-500">📞 {add.mobile}</p>
        </div>
      </label>
    ))
  )}
</div>

{/* Payment Method Section - Button enabled only when address selected */}
<div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
  <h3 className="font-semibold">Payment Method</h3>

  <button 
    disabled={!selectedAddressId || loadingRazorpay || creatingOrder} 
    onClick={payWithRazorpay} 
    className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition ${
      !selectedAddressId 
        ? "bg-gray-300 cursor-not-allowed" 
        : "bg-[#2D7FF9] hover:bg-blue-700"
    }`}
  >
    {loadingRazorpay ? <BiLoader size={18} className="animate-spin"/> : <BiCreditCard size={18}/>}
    Pay With RazorPay
  </button>

  <button 
    disabled={!selectedAddressId || loadingStripe || creatingOrder} 
    onClick={payWithStripe} 
    className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition ${
      !selectedAddressId 
        ? "bg-gray-300 cursor-not-allowed" 
        : "bg-black hover:bg-gray-800"
    }`}
  >
    {loadingStripe ? <BiLoader size={18} className="animate-spin"/> : <BiCreditCard size={18}/>}
    Pay With Stripe
  </button>
</div>

    </div>
  );
};

export default Checkout;