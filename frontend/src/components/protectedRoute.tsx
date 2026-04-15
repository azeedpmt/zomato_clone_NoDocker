


import { useAppData } from "../contexts/AppContext"
import { Navigate, Outlet, useLocation } from "react-router-dom"

const ProtectedRoute = () => {
    const { isAuth, user, loading } = useAppData();
    const location = useLocation();
    
    if (loading) return null;

    if (!isAuth) {
        return <Navigate to={'/login'} replace />;
    }

    // Admin has full access to all routes
    if (user?.role === "admin") {
        return <Outlet />;
    }

    // Check if user has a role - if not, redirect to select-role
    const hasRole = user?.role && user.role !== null && user.role !== "";
    
    if (!hasRole && location.pathname !== "/select-role") {
        console.log("No role found, redirecting to select-role");
        return <Navigate to={'/select-role'} replace />;
    } 
    
    // If user has role and tries to go to select-role, redirect based on role
    if (hasRole && location.pathname === "/select-role") {
        if (user?.role === "seller") {
            return <Navigate to={'/restaurant'} replace />;
        } else if (user?.role === "rider") {
            return <Navigate to={'/rider'} replace />;
        } else {
            return <Navigate to={'/'} replace />;
        }
    }

    // Protect rider route - only riders can access
    if (location.pathname === "/rider" && user?.role !== "rider") {
        console.log("Non-rider trying to access rider page, redirecting to home");
        return <Navigate to={'/'} replace />;
    }

    // Protect restaurant route - only sellers can access
    if (location.pathname === "/restaurant" && user?.role !== "seller") {
        console.log("Non-seller trying to access restaurant page, redirecting to home");
        return <Navigate to={'/'} replace />;
    }
    
    return <Outlet />
}; 

export default ProtectedRoute;
