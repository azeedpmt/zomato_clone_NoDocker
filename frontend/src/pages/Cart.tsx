

import { useNavigate } from "react-router-dom";
import { useAppData } from "../contexts/AppContext";
import { useState } from "react";
import type { ICart, IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { VscLoading } from "react-icons/vsc";
import { BiMinus, BiPlus } from "react-icons/bi";
import { TbTrash } from "react-icons/tb";

const Cart = () => {
  const { Cart, subTotal, quauntity, fetchCart } = useAppData();
  const navigate = useNavigate();
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [clearingCart, setClearingCart] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [removingItems, setRemovingItems] = useState<string[]>([]);

  if (!Cart || Cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500 text-lg">Your cart is empty</p>
      </div>
    );
  }
  
  const restaurant = Cart[0].restaurantId as IRestaurant;

  const deliveryFee = subTotal < 250 ? 49 : 0;
  const platformFee = 7;
  const grandTotal = subTotal + deliveryFee + platformFee;

  const increaseQty = async (itemId: string) => {
    try {
      setLoadingItemId(itemId);
      await axios.put(
        `${restaurantService}/api/cart/inc`,
        { itemId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      await fetchCart();
      toast.success("Quantity updated");
    } catch (error: any) {
      console.error("Error increasing quantity:", error);
      toast.error(error?.response?.data?.message || "Failed to update quantity");
    } finally {
      setLoadingItemId(null);
    }
  };

  const decreaseQty = async (itemId: string) => {
  try {
    setLoadingItemId(itemId);
    const response = await axios.put(
      `${restaurantService}/api/cart/dec`,
      { itemId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    await fetchCart();
    if (response.data.removed) {
      toast.success("Item removed from cart");
    } else {
      toast.success("Quantity updated");
    }
  } catch (error: any) {
    console.error("Error decreasing quantity:", error);
    toast.error(error?.response?.data?.message || "Failed to update quantity");
  } finally {
    setLoadingItemId(null);
  }
};

  // Remove single item from cart
  const removeItem = async (itemId: string) => {
    const confirm = window.confirm("Remove this item from cart?");
    if (!confirm) return;
    
    try {
      setRemovingItems(prev => [...prev, itemId]);
      
      // Try different endpoints for removing single item
      let success = false;
      
      // Try endpoint 1: /api/cart/remove
      try {
        await axios.delete(`${restaurantService}/api/cart/remove`, {
          data: { itemId },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        success = true;
      } catch (err: any) {
        console.log("Endpoint /api/cart/remove failed, trying alternative...");
        
        // Try endpoint 2: /api/cart/item
        try {
          await axios.delete(`${restaurantService}/api/cart/item`, {
            data: { itemId },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          success = true;
        } catch (err2: any) {
          console.log("Endpoint /api/cart/item failed, trying alternative...");
          
          // Try endpoint 3: /api/cart with itemId as param
          try {
            await axios.delete(`${restaurantService}/api/cart`, {
              data: { itemId },
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            });
            success = true;
          } catch (err3: any) {
            console.error("All remove item endpoints failed:", err3);
            toast.error("Could not remove item. Please try again later.");
            return;
          }
        }
      }
      
      if (success) {
        await fetchCart();
        toast.success("Item removed from cart");
      }
    } catch (error: any) {
      console.error("Error removing item:", error);
      toast.error(error?.response?.data?.message || "Failed to remove item");
    } finally {
      setRemovingItems(prev => prev.filter(id => id !== itemId));
    }
  };

  // Clear cart by removing items one by one
  const clearCart = async () => {
    const confirm = window.confirm("Are you sure you want to clear your cart? This will remove all items.");
    if (!confirm) return;
    
    if (!Cart || Cart.length === 0) {
      toast.error("Cart is already empty");
      return;
    }
    
    try {
      setClearingCart(true);
      toast.loading("Clearing cart...", { id: "clearing-cart" });
      
      let successCount = 0;
      let failCount = 0;
      
      // Try to remove each item individually
      for (const cartItem of Cart) {
        const item = cartItem.itemId as IMenuItem;
        try {
          // Try different endpoints for removing single item
          let removed = false;
          
          // Try endpoint 1: /api/cart/remove
          try {
            await axios.delete(`${restaurantService}/api/cart/remove`, {
              data: { itemId: item._id },
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            });
            removed = true;
          } catch (err) {
            // Try endpoint 2: /api/cart/item
            try {
              await axios.delete(`${restaurantService}/api/cart/item`, {
                data: { itemId: item._id },
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              });
              removed = true;
            } catch (err2) {
              // Try endpoint 3: setting quantity to 0
              try {
                await axios.put(
                  `${restaurantService}/api/cart/dec`,
                  { itemId: item._id, quantity: cartItem.quauntity },
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                  }
                );
                removed = true;
              } catch (err3) {
                console.error(`Failed to remove item ${item._id}:`, err3);
              }
            }
          }
          
          if (removed) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Error removing item ${item._id}:`, error);
          failCount++;
        }
      }
      
      // Refresh cart after all removal attempts
      await fetchCart();
      
      toast.dismiss("clearing-cart");
      
      if (failCount === 0) {
        toast.success(`Cart cleared successfully! Removed ${successCount} items.`);
      } else if (successCount > 0) {
        toast.success(`Partially cleared: ${successCount} items removed, ${failCount} items failed.`);
      } else {
        toast.error("Failed to clear cart. Please try removing items individually.");
      }
      
    } catch (error: any) {
      console.error("Error clearing cart:", error);
      toast.dismiss("clearing-cart");
      toast.error(error?.response?.data?.message || "Failed to clear cart. Please try removing items individually.");
    } finally {
      setClearingCart(false);
    }
  };

  const checkout = () => {
    if (!restaurant.isOpen) {
      toast.error("Restaurant is currently closed");
      return;
    }
    
    if (Cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    
    setIsCheckingOut(true);
    try {
      navigate("/checkout");
    } catch (error) {
      toast.error("Failed to proceed to checkout");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">{restaurant.name}</h2>
        <p className="text-sm text-gray-500">
          {restaurant.autoLocation?.formattedAddress || restaurant.address || "Address not available"}
        </p>
        {!restaurant.isOpen && (
          <p className="text-sm text-red-500 mt-2">⚠️ Restaurant is currently closed</p>
        )}
      </div>
      
      <div className="space-y-4">
        {Cart.map((cartItem: ICart) => {
          const item = cartItem.itemId as IMenuItem;
          const isLoading = loadingItemId === item._id;
          const isRemoving = removingItems.includes(item._id);

          return (
            <div key={item._id} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
              <img 
                src={item.image} 
                alt={item.name} 
                className="h-20 w-20 rounded object-cover" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/80x80?text=No+Image";
                }}
              />

              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-500">${item.price}</p>
              </div>

              {/* <div className="flex items-center gap-3">
                <button 
                  className="rounded-full border p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={isLoading || cartItem.quauntity <= 1} 
                  onClick={() => decreaseQty(item._id)}
                >
                  {isLoading ? (
                    <VscLoading size={16} className="animate-spin" />
                  ) : (
                    <BiMinus size={16} />
                  )}
                </button>
                <span className="font-medium min-w-[30px] text-center">{cartItem.quauntity}</span>
                <button 
                  className="rounded-full border p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={isLoading} 
                  onClick={() => increaseQty(item._id)}
                >
                  {isLoading ? (
                    <VscLoading size={16} className="animate-spin" />
                  ) : (
                    <BiPlus size={16} />
                  )}
                </button>
              </div> */}

                <div className="flex items-center gap-3">
  <button 
    className={`rounded-full border p-2 transition ${
      isLoading || cartItem.quauntity <= 0 
        ? "opacity-50 cursor-not-allowed bg-gray-100" 
        : "hover:bg-gray-100 cursor-pointer"
    }`} 
    disabled={isLoading || cartItem.quauntity <= 0} 
    onClick={() => decreaseQty(item._id)}
  >
    {isLoading ? (
      <VscLoading size={16} className="animate-spin" />
    ) : (
      <BiMinus size={16} />
    )}
  </button>
  <span className="font-medium min-w-[30px] text-center">{cartItem.quauntity}</span>
  <button 
    className={`rounded-full border p-2 transition ${
      isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 cursor-pointer"
    }`} 
    disabled={isLoading} 
    onClick={() => increaseQty(item._id)}
  >
    {isLoading ? (
      <VscLoading size={16} className="animate-spin" />
    ) : (
      <BiPlus size={16} />
    )}
  </button>
</div>

              <div className="flex items-center gap-4">
                <p className="font-medium min-w-[80px] text-right">
                  ${(item.price * cartItem.quauntity).toFixed(2)}
                </p>
                <button
                  onClick={() => removeItem(item._id)}
                  disabled={isRemoving}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                  title="Remove item"
                >
                  {isRemoving ? (
                    <VscLoading size={16} className="animate-spin" />
                  ) : (
                    <TbTrash size={18} />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="rounded bg-white p-4 shadow-sm space-y-3">
        <div className="flex justify-between text-sm">
          <span>Total Items</span>
          <span>{quauntity}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>${subTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery fee</span>
          <span>{deliveryFee === 0 ? "Free" : `$${deliveryFee.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Platform fee</span>
          <span>${platformFee.toFixed(2)}</span>
        </div>
        
        {subTotal < 250 && (
          <p className="text-xs text-gray-500">
            Add items worth ${(250 - subTotal).toFixed(2)} more to get free delivery
          </p>
        )}

        <div className="flex justify-between text-base font-semibold border-t pt-2">
          <span>Grand Total</span>
          <span>${grandTotal.toFixed(2)}</span>
        </div>

        <button 
          onClick={checkout}
          className={`mt-3 w-full rounded-lg bg-[#E23744] py-3 text-sm font-semibold text-white transition-colors ${
            !restaurant.isOpen ? "opacity-50 cursor-not-allowed bg-gray-400" : "hover:bg-red-800"
          }`} 
          disabled={!restaurant.isOpen || isCheckingOut}
        >
          {isCheckingOut ? (
            <div className="flex items-center justify-center gap-2">
              <VscLoading size={18} className="animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            !restaurant.isOpen ? "Restaurant is closed" : "Proceed to checkout"
          )}
        </button>

        <button 
          onClick={clearCart}
          className="mt-3 w-full rounded-lg bg-[#232222] py-3 text-sm font-semibold text-white hover:bg-gray-900 transition-colors flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={clearingCart || Cart.length === 0}
        >
          {clearingCart ? (
            <>
              <VscLoading size={16} className="animate-spin" />
              <span>Removing items...</span>
            </>
          ) : (
            <>
              Clear cart
              <TbTrash size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Cart;