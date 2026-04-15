import { useState } from "react"
import { useAppData } from "../contexts/AppContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { authService } from "../main"
import toast from "react-hot-toast"

type Role="customer"|"rider"|"seller"
const SelectRole = () => {
    const [role,setRole]=useState<Role|null>(null)
    const [loading, setLoading] = useState(false)
    const {setUser,setIsAuth, user}=useAppData()
    const navigate=useNavigate()
    const roles: Role[]=["customer","rider","seller"]

      // If user already has a role, redirect
    if (user?.role && user.role !== null && user.role !== "") {
        if (user.role === "seller") {
            navigate("/restaurant", { replace: true });
        } else if (user.role === "rider") {
            navigate("/rider", { replace: true });
        } else {
            navigate("/", { replace: true });
        }
        return null;
    }

    const addRole = async()=>{
        if (!role) {
            toast.error("Please select a role");
            return;
        }
        
        setLoading(true);
        try{
            const {data}=await axios.put(`${authService}/api/auth/add/role`,{role},{
                headers:{
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
            });

            localStorage.setItem("token",data.token);
            setUser(data.user)
            setIsAuth(true);
            toast.success(`Welcome! You are now a ${role}`);
            // Navigate based on role
            if (role === "seller") {
                navigate("/restaurant", { replace: true });
            } else if (role === "rider") {
                navigate("/rider", { replace: true });
            } else {
                navigate("/", { replace: true });
            }
            // navigate("/",{replace:true});
        }catch(error:any){
            alert("Something went wrong");
            console.log(error);
             console.error("Role selection error:", error);
            toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
        }finally {
            setLoading(false);
        }
    };
  return (
  <div className="flex min-h-screen items-center justify-center bg-white px-4">
    <div className="w-full max-w-sm spacey-6">
        <h1 className="text-center text-2xl font-bold"> choose your role</h1>
        <div className="space-y-4">
            {
                roles.map((r)=>(
                    <button key={r} onClick={()=>setRole(r)} className={`
                    w-full rounded-xl border px-4 py-3 text-sm font-medium capitalize transition ${
                        role===r?"border-[#E23744] bg-[#E23744] text-white":"border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }
                    `}>
                        contionue as {r}
                    </button>
                ))}
        </div>
        <button disabled={!role|| loading} onClick={addRole} className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
            role && !loading? "border-[#E23744] bg-[#E23744] text-white hover:bg[#d32f3a]":"bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}> {loading ? "Processing..." : "Next"}</button>
    </div>
  </div>
  );

};

export default SelectRole;

