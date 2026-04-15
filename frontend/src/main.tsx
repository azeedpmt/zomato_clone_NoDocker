

// main.tsx
import {StrictMode} from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { AppProvider } from "./contexts/AppContext.tsx";
import App from './App.tsx'
import "leaflet/dist/leaflet.css";
import { SocketProvider } from "./contexts/SocketContext.tsx";

export const authService = "http://localhost:5000";
export const restaurantService = "http://localhost:5001";
export const utilsService = "http://localhost:5002";
export const realtimeService = "http://localhost:5004";
export const riderService = "http://localhost:5005";
export const adminService="http://localhost:5006";

console.log("Auth Service URL:", authService);
console.log("Restaurant Service URL:", restaurantService);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="766076324918-7c261udks7b3ttgfprusso1sej4hntiu.apps.googleusercontent.com">
      <AppProvider>
        <SocketProvider> <App/></SocketProvider>
      </AppProvider>
    </GoogleOAuthProvider>
  </StrictMode>
)
