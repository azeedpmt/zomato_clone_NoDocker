import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../main";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useAppData } from "../contexts/AppContext";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  

const {setUser,setIsAuth,logout}=useAppData()

// useState(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       // Clear old session to ensure fresh login
//       logout();
//     }
//   });//just keepted testing 
  // const responseGoogle = async (authResult: any) => {
  // setLoading(true);

  // try {
  //   const result = await axios.post(`${authService}/api/auth/login`, {
  //     code: authResult.code,
  //   });

  //   localStorage.setItem("token", result.data.token);

  //   console.log("Login response user:", result.data.user);
      
  //     setUser(result.data.user);
  //     setIsAuth(true);
  //     toast.success(result.data.message || "Login successful");
  //     setTimeout(() => {
  //     // Check if user has a role
  //     if (!result.data.user?.role || result.data.user.role === null || result.data.user.role === ""){
  //       console.log("No role found, redirecting to select-role");
  //       navigate("/select-role", { replace: true });
  //     } else {
  //       // User has role, redirect based on role
  //       if (result.data.user.role === "seller") {
  //         navigate("/restaurant", { replace: true });
  //       } else if (result.data.user.role === "rider") {
  //         navigate("/rider", { replace: true });
  //       } else {
  //         navigate("/", { replace: true });
  //       }
  //     }
  //   }, 100);

  //   // toast.success(result.data.message || "Login successful");
  //   // setLoading(false);
  //   // setUser(result.data.user);
  //   // setIsAuth(true);
  //   // navigate("/");
  // } catch (error) {
  //   console.log(error);
  //   toast.error("Problem while login");
  //   setLoading(false);
  // }

  // setLoading(false);
  // };

  // In the responseGoogle function, update the navigation logic:

const responseGoogle = async (authResult: any) => {
  setLoading(true);

  try {
    const result = await axios.post(`${authService}/api/auth/login`, {
      code: authResult.code,
    });

    localStorage.setItem("token", result.data.token);

    console.log("Login response user:", result.data.user);
      
    setUser(result.data.user);
    setIsAuth(true);
    toast.success(result.data.message || "Login successful");
    
    setTimeout(() => {
      // Check for admin role first
      if (result.data.user?.role === "admin") {
        navigate("/admin", { replace: true });
      }
      // Check if user has a role
      else if (!result.data.user?.role || result.data.user.role === null || result.data.user.role === "") {
        console.log("No role found, redirecting to select-role");
        navigate("/select-role", { replace: true });
      } else {
        // User has role, redirect based on role
        if (result.data.user.role === "seller") {
          navigate("/restaurant", { replace: true });
        } else if (result.data.user.role === "rider") {
          navigate("/rider", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    }, 100);

  } catch (error) {
    console.log(error);
    toast.error("Problem while login");
    setLoading(false);
  }

  setLoading(false);
};
  const googleLogin = useGoogleLogin({
  flow: "auth-code",   // very important
  onSuccess: responseGoogle,
  onError: (error) => {
    console.log(error);
    toast.error("Google login failed");
  },
});

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-6">
        
        <h1 className="text-center text-3xl font-bold text-[#E23774]">
          Zomato
        </h1>

        <p className="text-center text-sm text-gray-500">
          Log in or sign up to continue
        </p>

        <button
          onClick={() => googleLogin()}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 hover:bg-gray-50"
        >
          <FcGoogle size={20} />
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="text-center text-xs text-gray-400">
          By continuing, you agree with our{" "}
          <span className="text-[#E23774] cursor-pointer">Terms of Service</span>{" "}
          &{" "}
          <span className="text-[#E23774] cursor-pointer">Privacy Policy</span>
        </p>

      </div>
    </div>
  );
};

export default Login;
