"use client";

import { createContext, useContext, useMemo, useState } from "react";
import api from "../services/axios";

const MedicineCartContext = createContext(null);

export const MedicineCartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ================= CART ================= */

  const addMedicine = (medicine) => {
    setItems((prev) => {
      const existing = prev.find((i) => i._id === medicine._id);
      if (existing) {
        return prev.map((i) =>
          i._id === medicine._id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...medicine, quantity: 1 }];
    });
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeMedicine(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i._id === id ? { ...i, quantity } : i
      )
    );
  };

  const removeMedicine = (id) => {
    setItems((prev) => prev.filter((i) => i._id !== id));
  };

  const clearCart = () => {
    setItems([]);
    setDeliveryAddress(null);
    setError(null);
  };

  /* ================= PLACE ORDER ================= */

  const placeOrder = async ({ isAgent }) => {
    if (!deliveryAddress) {
      setError("Please select delivery address");
      return { success: false };
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        items: items.map((i) => ({
          medicineId: i._id,
          quantity: i.quantity,
        })),

        deliveryAddress: {
          fullName: deliveryAddress.fullName,
          phone: deliveryAddress.phone,
          addressLine1: deliveryAddress.addressLine1,
          addressLine2: deliveryAddress.addressLine2 || "",
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          pincode: deliveryAddress.pincode,
          location: {
            type: "Point",
            coordinates: deliveryAddress.location.coordinates,
          },
        },

        paymentMode: "COD",
        allowSpecialPrice: !!isAgent,
      };
      console.log(payload);
      const res = await api.post("/medicine/order", payload);

      clearCart();
      return { success: true, data: res.data };

    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to place order";

      setError(msg);
      return { success: false, error: msg };

    } finally {
      setLoading(false);
    }
  };

  /* ================= DERIVED ================= */

  const totalItems = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () =>
      items.reduce(
        (s, i) =>
          s + i.quantity * (i.cartPrice ?? i.price ?? 0),
        0
      ),
    [items]
  );

  return (
    <MedicineCartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,

        deliveryAddress,
        setDeliveryAddress,

        loading,
        error,

        addMedicine,
        updateQuantity,
        removeMedicine,
        clearCart,
        placeOrder,
      }}
    >
      {children}
    </MedicineCartContext.Provider>
  );
};

export const useMedicineCart = () => {
  const ctx = useContext(MedicineCartContext);
  if (!ctx) {
    throw new Error(
      "useMedicineCart must be used inside MedicineCartProvider"
    );
  }
  return ctx;
};
