import { useState, useEffect } from "react";
import type { IRestaurant } from "../types";
import { restaurantService } from "../main";
import axios from "axios";
import { useAppData } from "../contexts/AppContext";
import toast from "react-hot-toast";
import { BiMapPin, BiEdit, BiSave } from "react-icons/bi";

interface Props {
  restaurant: IRestaurant;
  isSeller: boolean;
  onUpdate: (restaurant: IRestaurant) => void;
}

const RestaurantProfile = ({ restaurant, isSeller, onUpdate }: Props) => {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description);
  const [isOpen, setIsOpen] = useState(restaurant.isOpen);
  const [loading, setLoading] = useState(false);

  const { location, fetchLocation, loadingLocation } = useAppData();

  useEffect(() => {
    setName(restaurant.name);
    setDescription(restaurant.description);
    setIsOpen(restaurant.isOpen);
  }, [restaurant]);

  const toggleOpenStatus = async () => {
    try {
      const { data } = await axios.put(
        `${restaurantService}/api/restaurant/status`,
        { status: !isOpen },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(data.message);
      setIsOpen(data.restaurant.isOpen);
    } catch (error: any) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Server Error");
    }
  };

  const saveChanges = async () => {
    try {
      setLoading(true);
      const payload = { name, description };

      const { data } = await axios.put(
        `${restaurantService}/api/restaurant/edit`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      onUpdate(data.restaurant);
      setEditMode(false);
      toast.success(data.message || "Restaurant updated successfully");
    } catch (error: any) {
      console.error(error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };
  const {setIsAuth ,setUser}=useAppData();
  

  const logoutHandler=async()=>{
    await axios.put(
        `${restaurantService}/api/restaurant/status`,
        { status: false },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
    localStorage.setItem("token","");
    setIsAuth(false)
    setUser(null)
    toast.success("loggedout successfully")
  }
  // Display location - prioritize user's current location if available
  const displayLocation = location?.formattedAddress || 
                          restaurant.formattedAddress || 
                          "Location unavailable";

  return (
    <div className="mx-auto max-w-xl rounded-xl bg-white shadow-sm overflow-hidden">
      {restaurant.image && (
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="h-48 w-full object-cover"
        />
      )}
      <div className="p-5 space-y-4">
        
          <div className="flex items-start justify-between">
            <div className="flex flex-col w-full">
              {editMode ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border px-2 py-1 text-lg font-semibold"
                />
              ) : (
                <h2 className="text-xl font-semibold">{restaurant.name}</h2>
              )}

              {/* <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <BiMapPin className="h-4 w-4 text-red-500" />
                <span>
                  {loadingLocation ? "Loading location..." : displayLocation}
                </span>
              </div> */}


                {/* Location display - shows text address */}
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
  <BiMapPin className="h-4 w-4 text-red-500" />
  <span>
    {restaurant.formattedAddress 
      ? restaurant.formattedAddress 
      : "Address not available"}
  </span>
</div>

              {!location && (
                <button
                  onClick={fetchLocation}
                  className="text-sm text-blue-600 hover:underline mt-1 text-left"
                  disabled={loadingLocation}
                >
                  {loadingLocation ? "📍 Getting location..." : "📍 Get My Location"}
                </button>
              )}
            </div>
{isSeller&&(
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-gray-500 hover:text-black ml-2"
            >
              <BiEdit size={18} />
            </button>)}
          </div>
      
       
        {editMode ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
            rows={3}
          />
        ) : (
          <p className="text-sm text-gray-600">
            {restaurant.description || "No description added"}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <span
            className={`text-sm font-medium ${
              isOpen ? "text-green-600" : "text-red-500"
            }`}
          >
            {isOpen ? "OPEN" : "CLOSED"}
          </span>

          <div className="flex gap-3">
            {editMode && (
              <button
                onClick={saveChanges}
                disabled={loading}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <BiSave size={16} />
                Save
              </button>
            )}

            {isSeller && (
              <button
                onClick={toggleOpenStatus}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium text-white ${
                  isOpen
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isOpen ? "Close Restaurant" : "Open Restaurant"}
              </button>
            )}



              {isSeller && (
              <button
                onClick={logoutHandler}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700
                `}
              >
               Logout
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Created on {new Date(restaurant.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default RestaurantProfile;


