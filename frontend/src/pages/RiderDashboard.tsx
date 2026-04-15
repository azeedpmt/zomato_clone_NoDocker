// import { useEffect, useRef, useState } from "react";
// import { useAppData } from "../contexts/AppContext";
// import {useSocket} from "../contexts/SocketContext";
// import axios from 'axios';
// import { riderService } from "../main";
// import toast from "react-hot-toast";
// import { BiUpload } from "react-icons/bi";
// import type { IOrder } from "../types";
// import audio from '../assets/faaah.mp3';
// import RiderOrderRequest from "../components/RiderOrderRequest";
// import RiderCurrentOrder from "../components/RiderCurrentOrder";
// import { useNavigate } from "react-router-dom";

// interface IRider {
//     _id:string,
//     phoneNumber:string;
//     aadharNumber:string;
//     drivingLicenseNumber:string;
//     picture:string;
//     isVerified:boolean;
//     isAvailable:boolean;
// }


// const RiderDashboard = () => {
//     const {user}=useAppData()
//     const {socket}=useSocket()

//     const [profile,setProfile]=useState<IRider |null>(null)

//     const [loading,setLoading]=useState(true)

//     const [toggling,setToggling]=useState(false);
//     const [incomingOrders,setIncomingOrders]=useState<string[]>([])
//     const [currentOrder,setCurrentOrder]=useState<IOrder|null>(null);
//     const [audioUnlocked,setAudioUnlocked]=useState(false);
    
//     const audioRef = useRef<HTMLAudioElement | null>(null)

//       useEffect(()=>{
//     audioRef.current=new Audio(audio);
//     audioRef.current.preload="auto";
//   },[]);

//   const unlockAudio= async()=>{
//     try {
//         if(!audioRef.current) return;
//         await audioRef.current.play();
//         audioRef.current.pause();
//         audioRef.current.currentTime=0;
//         setAudioUnlocked(true)
//         toast.success("Sound Enabled")
//     } catch (error) {
//         toast.error("Tap again to enable sound");
//     }
//   }

//   useEffect(()=>{
//     if(!socket) return;

//     const onOrderAvailable =({orderId}:{orderId:string})=>{
//         setIncomingOrders((prev)=> prev.includes(orderId)?prev :[...prev,orderId]);

//         if(audioUnlocked&&audioRef.current){
//             audioRef.current.currentTime=0;
//             audioRef.current.play().catch(()=>{});
//         }

//         setTimeout(()=>{
//             setIncomingOrders((prev)=>prev.filter((id)=>id !==orderId));
//         },10000)
//     }

//     socket.on("order:available",onOrderAvailable);

//     return ()=>{
//        socket.off("order:available",onOrderAvailable); 
//     }
//   },[socket,audioUnlocked])
//     const fetchProfile=async()=>{
//         try {
//             const {data} = await axios.get(`${riderService}/api/rider/myprofile`,{
//                 headers:{
//                     Authorization: `Bearer ${localStorage.getItem("token")}`,
//                 }
//             });
//             setProfile(data||null)
//         } catch (error) {
//             setProfile(null)
//         }finally{
//             setLoading(false)
//         }
//     }

//     useEffect(()=>{
//         if(user?.role==="rider") fetchProfile();
//         else setLoading(false);
//     },[user])

//     const fetchCurrentOrder = async()=>{
//         try {
//             const {data} = await axios.get(`${riderService}/api/rider/order/current`,{
//                 headers:{
//                     Authorization: `Bearer ${localStorage.getItem("token")}`,
//                 }
//             });

//             setCurrentOrder(data.order)
//         } catch (error) {
//             console.log(error);
//             setCurrentOrder(null);
//         }
//     };
//     useEffect(()=>{
//         fetchCurrentOrder()
//     },[])

//     const toggleAvailibility=async()=>{
//         if(!navigator.geolocation){
//             toast.error("Location access required");
//             return;
//         }

//         setToggling(true);

//         navigator.geolocation.getCurrentPosition(async(pos)=>{
//             try {
//                 await axios.patch(`${riderService}/api/rider/toggle`,{isAvailable:!profile?.isAvailable,latitude:pos.coords.latitude,longitude:pos.coords.longitude},{
//                     headers:{
//                         Authorization:  `Bearer ${localStorage.getItem("token")}`,
//                     }
//                 })
//                 toast.success(profile?.isAvailable?"you are offline":"you are online");
//                 fetchProfile();
//             } catch (error:any) {
//                 toast.error(error.response.data.message)
//             }finally{
//                 setToggling(false);
//             }
//         })
//     }


//     const [phoneNumber,setPhoneNumber]=useState("")
//     const [aadharNumber,setaadharNumber]=useState("")
//     const [drivingLicenseNumber,setDrivingLicenseNumber]=useState("")   
//     const [image,setImage]=useState<File |null>(null)
//     const [submitting,setSubmitting]=useState(false)
//     const handleSubmit=async()=>{
//          if(!navigator.geolocation){
//             toast.error("Location access required");
//             return;
//         }

//         setSubmitting(true);

//         navigator.geolocation.getCurrentPosition(async(pos)=>{
//             const formData = new FormData()
//             formData.append("phoneNumber",phoneNumber);
//             formData.append("aadharNumber",aadharNumber);
//             formData.append("drivingLicenseNumber",drivingLicenseNumber);
//             formData.append("latitude",pos.coords.latitude.toString());
//             formData.append("longitude",pos.coords.longitude.toString());
//             if(image){
//                 formData.append("file",image);
//             }
//             try {
//                const {data}= await axios.post(`${riderService}/api/rider/new`,formData,{
//                     headers:{
//                         Authorization:  `Bearer ${localStorage.getItem("token")}`,
                    
//                     }
//                 })
//                 toast.success(data.message);
//                 fetchProfile();
//             } catch (error:any) {
//                 toast.error(error.response.data.message)
//             }finally{
//                 setSubmitting(false);
//             }
//         })
//     };
 
//    if (user?.role !== "rider") {
//     return (
//         <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
//             You are not registered as a rider
//         </div>
//     );
// }

// // With this (add useNavigate):
// // import { useNavigate } from "react-router-dom";

// // Inside the component, after useAppData():
// const navigate = useNavigate();

// // Then replace the role check with:
// if (user?.role !== "rider") {
//   navigate("/", { replace: true });
//   return null;
// }
// if (loading) {
//     return (
//         <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
//             Loading rider details...
//         </div>
//     );
// }
//     if(!profile)
//       return <div className="min-h-screen bg-gray-50 px-4 py-6">
//             <div className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow-sm space-y-5">
//                 <h1 className="text-xl font-semibold">Add your Profile</h1>
//                 <input type="number" placeholder="Aadhar Number" value={aadharNumber} onChange={e=>setaadharNumber(e.target.value)} className="w-full rounded-lg border px-4 py-2 text-sm outline-none"/>
//                 <input type="number" placeholder="Contant Number" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} className="w-full rounded-lg border px-4 py-2 text-sm outline-none"/>
//                 <input type="text" placeholder="driving License" value={drivingLicenseNumber} onChange={e=>setDrivingLicenseNumber(e.target.value)} className="w-full rounded-lg border px-4 py-2 text-sm outline-none"/>

//                 <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm text-gray-600 hover:bg-gray-50"><BiUpload className="h-5 w-5 text-red-500"/>
//                 {image?image.name:"Upload your image"}
//                 <input type="file" accept="image/*" hidden onChange={e=>setImage(e.target.files?.[0]||null)}/>            
//                 </label>
                
//                 <button className="w-full rounded-lg py-3 text-sm font-semibold text-white bg-[#e23744]" disabled={submitting} onClick={handleSubmit}>{submitting?"submitting....":"Add profile"}</button>
//             </div>
//         </div>;
//   return (
//     <div className="space-y-4">
//         <div className="mx-auto max-w-md px-4 py-4">
//             <div className="rounded-xl bg-white p-4 shadow space-y-3">
//                 <img src={profile.picture} alt="" className="mx-auto h-24 w-24 rounded-full object-cover" />
//             <p className="text-center font-semibold">{user?.name}</p>
//             <p className="text-center text-sm text-gray-500">
//                 {profile.phoneNumber}
//             </p>
//             <div className="flex justify-center gap-2">
//                 <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">{profile.isVerified?"verified":"Pending"}</span>

//                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">{profile.isAvailable?"Online":"OFFline"}</span>
//             </div>

//             <div>
//                 <p className="text-blue-400">please be with in a 500 m radius of any restaurant (which we call a hotspot) before going online as a rider to receive orders</p>
//             </div>
//             {
//                 profile.isVerified && !currentOrder && <button onClick={toggleAvailibility} disabled={toggling} className={`w-full py-2 rounded-lg text-white font-semibold ${toggling?"bg-gray-400":profile.isAvailable?"bg-gray-600":"bg-[#e23744]"}`}>
//                     {toggling?"Updating...":profile.isAvailable?"Go Offline":"Go Online"}
//                 </button>
//             }
//             </div>
//         </div>

//         {!audioUnlocked &&<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <span className="text-2xl">🔔</span>
//           <div>
//             <p className="font-medium text-blue-900">Enable Sound Notification</p>
//              <p className="text-sm text-blue-700">Get Notified when new orders arrive</p>           
//           </div>
//         </div>
//         <button onClick={unlockAudio} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">enable sound</button>
//         </div>}

//         {profile.isAvailable && incomingOrders.length >0 &&(
//             <div className="mx-auto max-w-md px-4 space-y-3">
//                 <h3 className="font-semibold text-gray-700">Incoming Orders</h3>
//                 {
//                     incomingOrders.map((id)=>(
                        
//                         <RiderOrderRequest key={id} orderId={id} onAccepted={()=>{
//                             fetchProfile();
//                             fetchCurrentOrder();}}/>
//                     ))
//                 }
//             </div>
//         )}

//         {currentOrder && <div className="mx-auto max-w-md px-4 space-y-4"><RiderCurrentOrder order={currentOrder} onStatusUpdate={fetchCurrentOrder}/></div>}
//     </div>
//   )
  
// }


// export default RiderDashboard


import { useEffect, useRef, useState, useCallback } from "react";
import { useAppData } from "../contexts/AppContext";
import { useSocket } from "../contexts/SocketContext";
import axios from 'axios';
import { riderService } from "../main";
import toast from "react-hot-toast";
import { BiUpload } from "react-icons/bi";
import type { IOrder } from "../types";
import audio from '../assets/faaah.mp3';
import RiderOrderRequest from "../components/RiderOrderRequest";
import RiderCurrentOrder from "../components/RiderCurrentOrder";
import { useNavigate } from "react-router-dom";
import RiderOrderMap from "../components/RiderOrderMap";

interface IRider {
    _id: string;
    phoneNumber: string;
    aadharNumber: string;
    drivingLicenseNumber: string;
    picture: string;
    isVerified: boolean;
    isAvailable: boolean;
}

export const RiderDashboard = () => {
    const { user } = useAppData();
    const { socket } = useSocket();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<IRider | null>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [incomingOrders, setIncomingOrders] = useState<string[]>([]);
    const [currentOrder, setCurrentOrder] = useState<IOrder | null>(null);
    const [audioUnlocked, setAudioUnlocked] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Check if user is rider - redirect if not
    useEffect(() => {
        if (user && user.role !== "rider") {
            navigate("/", { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        audioRef.current = new Audio(audio);
        audioRef.current.preload = "auto";
    }, []);

    const unlockAudio = async () => {
        try {
            if (!audioRef.current) return;
            await audioRef.current.play();
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setAudioUnlocked(true);
            toast.success("Sound Enabled");
        } catch (error) {
            toast.error("Tap again to enable sound");
        }
    }

    useEffect(() => {
        if (!socket) return;

        const onOrderAvailable = ({ orderId }: { orderId: string }) => {
            setIncomingOrders((prev) => prev.includes(orderId) ? prev : [...prev, orderId]);

            if (audioUnlocked && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
            }

            setTimeout(() => {
                setIncomingOrders((prev) => prev.filter((id) => id !== orderId));
            }, 10000);
        }

        socket.on("order:available", onOrderAvailable);

        return () => {
            socket.off("order:available", onOrderAvailable);
        }
    }, [socket, audioUnlocked]);

    const fetchProfile = async () => {
        try {
            const { data } = await axios.get(`${riderService}/api/rider/myprofile`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });
            setProfile(data || null);
        } catch (error) {
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }

    const fetchCurrentOrder = async () => {
        try {
            const { data } = await axios.get(`${riderService}/api/rider/order/current`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });
            
            // Only update if order actually changed
            const orderData = data.order || data;
            
            if (orderData && orderData._id) {
                if (!currentOrder || currentOrder._id !== orderData._id) {
                    console.log("New order received:", orderData._id);
                    setCurrentOrder(orderData);
                }
            } else {
                if (currentOrder !== null) {
                    console.log("No active order");
                    setCurrentOrder(null);
                }
            }
        } catch (error) {
            console.log("Error fetching current order:", error);
            if (currentOrder !== null) {
                setCurrentOrder(null);
            }
        }
    };


    useEffect(() => {
    // Fetch current order when component mounts and when order status changes
    if (profile?.isVerified) {
        fetchCurrentOrder();
        
        // Set up polling for current order every 15 seconds
        const interval = setInterval(() => {
            fetchCurrentOrder();
        }, 15000);
        
        return () => clearInterval(interval);
    }
}, [profile?.isVerified, profile?._id]);

// Also add socket listener for order updates
useEffect(() => {
    if (!socket) return;
    
    const onOrderUpdate = () => {
        console.log("Order update received, refreshing...");
        fetchCurrentOrder();
        fetchProfile();
    };
    
    socket.on("order:update", onOrderUpdate);
    socket.on("order:rider_assigned", onOrderUpdate);
    
    return () => {
        socket.off("order:update", onOrderUpdate);
        socket.off("order:rider_assigned", onOrderUpdate);
    };
}, [socket]);
    // Fetch profile on mount - only once
    useEffect(() => {
        if (user?.role === "rider") {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [user]); // Empty dependency array - only runs when user changes

    // Set up polling for current order only when profile is loaded and rider is verified
    useEffect(() => {
        if (!profile || !profile.isVerified) {
            // Clear interval if exists
            if (fetchIntervalRef.current) {
                clearInterval(fetchIntervalRef.current);
                fetchIntervalRef.current = null;
            }
            return;
        }

        // Fetch immediately
        fetchCurrentOrder();
        
        // Set up polling every 10 seconds
        fetchIntervalRef.current = setInterval(() => {
            fetchCurrentOrder();
        }, 10000);
        
        // Cleanup on unmount or when profile changes
        return () => {
            if (fetchIntervalRef.current) {
                clearInterval(fetchIntervalRef.current);
                fetchIntervalRef.current = null;
            }
        };
    }, [profile?.isVerified, profile?._id]); // Only re-run when verification status changes

    const toggleAvailibility = async () => {
        if (!navigator.geolocation) {
            toast.error("Location access required");
            return;
        }

        setToggling(true);

        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                await axios.patch(`${riderService}/api/rider/toggle`, {
                    isAvailable: !profile?.isAvailable,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    }
                });
                toast.success(profile?.isAvailable ? "You are offline" : "You are online");
                await fetchProfile();
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Failed to toggle status");
            } finally {
                setToggling(false);
            }
        }, () => {
            toast.error("Unable to get your location");
            setToggling(false);
        });
    }

    const [phoneNumber, setPhoneNumber] = useState("");
    const [aadharNumber, setaadharNumber] = useState("");
    const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!navigator.geolocation) {
            toast.error("Location access required");
            return;
        }

        setSubmitting(true);

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const formData = new FormData();
            formData.append("phoneNumber", phoneNumber);
            formData.append("aadharNumber", aadharNumber);
            formData.append("drivingLicenseNumber", drivingLicenseNumber);
            formData.append("latitude", pos.coords.latitude.toString());
            formData.append("longitude", pos.coords.longitude.toString());
            if (image) {
                formData.append("file", image);
            }
            try {
                const { data } = await axios.post(`${riderService}/api/rider/new`, formData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    }
                });
                toast.success(data.message);
                await fetchProfile();
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Failed to create profile");
            } finally {
                setSubmitting(false);
            }
        }, () => {
            toast.error("Unable to get your location");
            setSubmitting(false);
        });
    };

    // Handle order acceptance - refresh current order and clear incoming
    const handleOrderAccepted = async () => {
        await fetchProfile();
        await fetchCurrentOrder();
        setIncomingOrders([]);
    };

    // Handle order status update
    const handleOrderUpdate = async () => {
        await fetchCurrentOrder();
        await fetchProfile();
    };

    if (user?.role !== "rider") {
        return null;
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                    Loading rider details...
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 px-4 py-6">
                <div className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow-sm space-y-5">
                    <h1 className="text-xl font-semibold">Complete Your Rider Profile</h1>
                    <p className="text-sm text-gray-500">Please provide the following details to start delivering</p>
                    
                    <input 
                        type="tel" 
                        placeholder="Phone Number *" 
                        value={phoneNumber} 
                        onChange={e => setPhoneNumber(e.target.value)} 
                        className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <input 
                        type="text" 
                        placeholder="Aadhar Number *" 
                        value={aadharNumber} 
                        onChange={e => setaadharNumber(e.target.value)} 
                        className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <input 
                        type="text" 
                        placeholder="Driving License Number *" 
                        value={drivingLicenseNumber} 
                        onChange={e => setDrivingLicenseNumber(e.target.value)} 
                        className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                    />

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm text-gray-600 hover:bg-gray-50">
                        <BiUpload className="h-5 w-5 text-red-500" />
                        {image ? image.name : "Upload your profile picture *"}
                        <input 
                            type="file" 
                            accept="image/*" 
                            hidden 
                            onChange={e => setImage(e.target.files?.[0] || null)}
                        />
                    </label>

                    <button 
                        className="w-full rounded-lg py-3 text-sm font-semibold text-white bg-[#e23744] hover:bg-red-600 transition disabled:opacity-50" 
                        disabled={submitting || !phoneNumber || !aadharNumber || !drivingLicenseNumber || !image} 
                        onClick={handleSubmit}
                    >
                        {submitting ? "Submitting..." : "Submit for Verification"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            {/* Profile Section */}
            <div className="mx-auto max-w-md px-4 py-4">
                <div className="rounded-xl bg-white p-4 shadow space-y-3">
                    <img 
                        src={profile.picture} 
                        alt="Profile" 
                        className="mx-auto h-24 w-24 rounded-full object-cover border-4 border-red-100" 
                    />
                    <p className="text-center font-semibold text-lg">{user?.name}</p>
                    <p className="text-center text-sm text-gray-500">
                        📞 {profile.phoneNumber}
                    </p>
                    <div className="flex justify-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${profile.isVerified ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                            {profile.isVerified ? "✓ Verified" : "⏳ Pending Verification"}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${profile.isAvailable ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}>
                            {profile.isAvailable ? "🟢 Online" : "⚫ Offline"}
                        </span>
                    </div>

                    {!profile.isVerified && (
                        <div className="bg-yellow-50 p-3 rounded-lg">
                            <p className="text-yellow-700 text-xs text-center">
                                ⏳ Your profile is under review. This usually takes 24-48 hours.
                            </p>
                        </div>
                    )}

                    {profile.isVerified && !currentOrder && (
                        <button 
                            onClick={toggleAvailibility} 
                            disabled={toggling} 
                            className={`w-full py-2 rounded-lg text-white font-semibold transition ${toggling ? "bg-gray-400" : profile.isAvailable ? "bg-gray-600 hover:bg-gray-700" : "bg-[#e23744] hover:bg-red-600"}`}
                        >
                            {toggling ? "Updating..." : profile.isAvailable ? "Go Offline" : "Go Online"}
                        </button>
                    )}
                </div>
            </div>

            {/* Sound Notification - Only show for verified riders */}
            {!audioUnlocked && profile.isVerified && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between mx-auto max-w-md">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔔</span>
                        <div>
                            <p className="font-medium text-blue-900">Enable Sound Notification</p>
                            <p className="text-sm text-blue-700">Get notified when new orders arrive</p>
                        </div>
                    </div>
                    <button 
                        onClick={unlockAudio} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                        Enable
                    </button>
                </div>
            )}

            {/* Incoming Orders - Only for available verified riders with no current order */}
            {profile.isVerified && profile.isAvailable && !currentOrder && incomingOrders.length > 0 && (
                <div className="mx-auto max-w-md px-4 space-y-3">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        🆕 New Delivery Requests ({incomingOrders.length})
                    </h3>
                    {incomingOrders.map((id) => (
                        <RiderOrderRequest 
                            key={id} 
                            orderId={id} 
                            onAccepted={handleOrderAccepted}
                        />
                    ))}
                </div>
            )}

            {/* Current Order - Show if rider has an active order */}
            {currentOrder && (
                <div className="mx-auto max-w-md px-4 space-y-4">
                    <RiderCurrentOrder 
                        order={currentOrder} 
                        onStatusUpdate={handleOrderUpdate}
                    />

                    <RiderOrderMap order={currentOrder}/>
                </div>
            )}

            {/* No Active Order Message - Only for available verified riders */}
            {profile.isVerified && profile.isAvailable && !currentOrder && incomingOrders.length === 0 && (
                <div className="mx-auto max-w-md px-4">
                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                        <div className="text-6xl mb-4">🛵</div>
                        <p className="text-gray-600 font-medium">Waiting for delivery requests...</p>
                        <p className="text-sm text-gray-400 mt-2">Stay near restaurants to get more orders</p>
                        <div className="mt-4 text-xs text-gray-400">
                            <p>💡 Tip: Move closer to restaurants to receive orders faster</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Offline Message */}
            {profile.isVerified && !profile.isAvailable && !currentOrder && (
                <div className="mx-auto max-w-md px-4">
                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                        <div className="text-6xl mb-4">😴</div>
                        <p className="text-gray-600 font-medium">You are offline</p>
                        <p className="text-sm text-gray-400 mt-2">Go online to start receiving delivery requests</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RiderDashboard;