import type { IOrder } from "../types";
import { useEffect, useRef, useState } from "react";
import {useSocket} from "../contexts/SocketContext";
import audio from "../assets/quack.mp3";
import axios from 'axios';
import { restaurantService } from "../main";
import { divIcon } from "leaflet";
import OrderCard from "./OrderCard";

const ACTIVE_STATUSES=["placed", "accepted","preparing","ready_for_rider","rider_assigned","picked_up"]

const RestaurantOrders = ({restaurantId}:{restaurantId:string}) => {
  const [orders,setOrders]=useState<IOrder[]>([]);
  const [loading,setLoading]=useState(true);
  const [audioUnlocked,setAudioUnlocked]=useState(false);

  const {socket}=useSocket()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(()=>{
    audioRef.current=new Audio(audio);
    audioRef.current.load();
  },[]);

  const unlockAudio=()=>{
    if(audioRef.current){
      audioRef.current.play().then(()=>{
        audioRef.current!.pause();
        audioRef.current!.currentTime=0;
        setAudioUnlocked(true);
        console.log("Audio unloacked");
      }).catch((err)=>{
          console.log("Failed to unlock audio: ",err);
      })
    }
  }

  const fetchOrders = async()=>{
    try{
      const {data} = await axios.get(`${restaurantService}/api/order/restaurant/${restaurantId}`,{
        headers:{
          Authorization:`Bearer ${localStorage.getItem("token")}`,
        }
      })
      console.log("Fetched orders:", data);
      setOrders(data.orders||[]);
    }catch(error){
      console.log(error);
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{
     if(restaurantId) {
      fetchOrders();
    }
  },[restaurantId]);

    
    useEffect(() => {
  if (!socket) return;

  const onNewOrder = () => {
    console.log("New Order received socket");

    if (audioUnlocked && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.error("Audio play failed:", err);
      });
    }

    fetchOrders();
  };

  socket.on("order:new", onNewOrder); // listen event

  return () => {
    socket.off("order:new", onNewOrder); // cleanup
  };
}, [socket, audioUnlocked]);

useEffect(()=>{
  if(!socket) return;

  const onUpdateOrder=()=>{
    fetchOrders()
  }

  socket.on("order:rider_assigned",onUpdateOrder);

  return ()=>{
    socket.off("order:rider_assigned",onUpdateOrder)
  }
},[socket])

if(loading){
  return <p className="text-gray-500">Loading Orders</p>;
}
const activeOrders = orders.filter((o)=>ACTIVE_STATUSES.includes(o.status));
const completedOrders = orders.filter(
  (o)=>!ACTIVE_STATUSES.includes(o.status)
);
  return (
    <div className="space-y-6">
      {!audioUnlocked &&<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div>
            <p className="font-medium text-blue-900">Enable Sound Notification</p>
             <p className="text-sm text-blue-700">Get Notified when new orders arrive</p>           
          </div>
        </div>
        <button onClick={unlockAudio} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">enable sound</button>
        </div>}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Active Orders</h3>
          {
            activeOrders.length===0?<p className="text-sm text-gray-500">No Active orders</p>: <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {
                activeOrders.map((order)=>(
                  <OrderCard key={order._id} order={order} onStatusUpdate={fetchOrders}/>
                ))
              }
            </div>
          }
        </div>

        <div className="space-y-3">
        <h3 className="text-lg font-semibold">Completed Orders({completedOrders.length})</h3>
          {
            completedOrders.length===0?<p className="text-sm text-gray-500">No Completed orders</p>: <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {
                completedOrders.map((order)=>(
          <OrderCard key={order._id} order={order} onStatusUpdate={fetchOrders}/>
                ))
              }
            </div>
          }
        </div>


    </div>
  )
}

export default RestaurantOrders;