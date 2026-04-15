

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/protectedRoute";
import PublicRoute from "./components/publicRoute";
import SelectRole from "./pages/SelectRole";
import Navbar from "./components/navbar";
import Account from "./pages/Account";
import { useAppData } from "./contexts/AppContext";
import Restaurant from "./pages/Restaurant";
import RestaurantPage from "./pages/RestaurantPage";
import Cart from "./pages/Cart";
import AddAddressPage from "./pages/Address";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import OrderPage from "./pages/OrderPage";
import RiderDashboard from "./pages/RiderDashboard";
import Admin from "./pages/Admin";


// In App.tsx, update the routes section:

const App = () => {
  const { user, loading } = useAppData();

  // Don't auto-redirect to admin - let routes handle it
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading ...</p>
      </div>
    );
  }

  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/paymentsuccess/:paymentId" element={<PaymentSuccess />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order/:id" element={<OrderPage />} />
            <Route path="/ordersuccess" element={<OrderSuccess />} />
            <Route path="/address" element={<AddAddressPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/account" element={<Account />} />
            <Route path="/rider" element={<RiderDashboard />} />
            <Route path="/restaurant" element={<Restaurant />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
};
// const App = () => {
//   const { user, loading } = useAppData();

//   if(user &&user.role==="admin"){
//     return <Admin/>
//   }
//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center">
//         <p className="text-gray-500">Loading ...</p>
//       </div>
//     );
//   }

//   return (
//     <>
//     <BrowserRouter>
//       <Navbar />
//       {/* <Toaster /> */}
//       <Routes>
//         {/* Public Routes */}
//         <Route element={<PublicRoute />}>
//           <Route path="/login" element={<Login />} />
//         </Route>

//         {/* Protected Routes */}
//         <Route element={<ProtectedRoute />}>
//           <Route path="/" element={<Home />} />
//           <Route path="/paymentsuccess/:paymentId" element={<PaymentSuccess/>}/>
//           <Route path="/orders" element={<Orders/>}/>
//           <Route path="/order/:id" element={<OrderPage/>}/>
//           <Route path="/ordersuccess" element={<OrderSuccess/>}/>
//           <Route path="/address" element={<AddAddressPage />} />
//           <Route path="/checkout" element={<Checkout />} />
//           <Route path="/restaurant/:id" element={<RestaurantPage />} />
//           <Route path="/cart" element={<Cart />} />
//           <Route path="/select-role" element={<SelectRole />} />
//           <Route path="/account" element={<Account />} />
//           <Route path="/rider" element={<RiderDashboard />} />
//           <Route path="/restaurant" element={<Restaurant />} />
//           {/* <Route
//             path="/restaurant"
//             element={user?.role === "seller" ? <Restaurant /> : <Navigate to="/" />}
//           /> */}
//         </Route>
//       </Routes>
//     </BrowserRouter>
//     <Toaster />  
//     </>
//   );
// };

export default App;
