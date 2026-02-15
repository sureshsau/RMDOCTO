"use client";

import { createContext, useContext, useMemo, useState } from "react";
import RazorpayCheckout from "react-native-razorpay";
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

  const placeOrder = async ({ isAgent, paymentMode }) => {
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
          ...deliveryAddress,
          location: {
            type: "Point",
            coordinates: deliveryAddress.location.coordinates,
          },
        },
        paymentMode,
        allowSpecialPrice: !!isAgent,
      };

      /* ===== COD & RM CREDIT ===== */

      if (paymentMode === "COD" || paymentMode === "RM_CREDIT") {
        const res = await api.post("/medicine/order", payload);
        clearCart();
        return { success: true, data: res.data };
      }

      /* ===== ONLINE PAYMENT ===== */

      const orderRes = await api.post("/medicine/order", payload);

      const orderId =
        orderRes?.data?.data?._id ||
        orderRes?.data?._id;

      if (!orderId) throw new Error("Order ID missing");

      const razorRes = await api.post(
        "/medicine/order/payments/razorpay/create",
        { orderId }
      );

      const { razorpayOrderId, amount, currency, key, user } =
        razorRes.data.data;

     const options = {
  description: "Medicine Order Payment",
  currency,
  key,
  amount,
  name: "RM Doctor",
  order_id: razorpayOrderId,

  prefill: {
    name: user?.name || "",
    contact: user?.phone || "",
  },

  theme: { color: "#14b8a6" },

  method: {
    card: true,
    netbanking: true,
    wallet: true,
    upi: true,
    paylater: true,
  },

  config: {
    display: {
      blocks: {
        upi: {
          name: "UPI",
          instruments: [
            { method: "upi" }
          ]
        },
        card: {
          name: "Cards",
          instruments: [
            { method: "card" }
          ]
        },
        netbanking: {
          name: "Netbanking",
          instruments: [
            { method: "netbanking" }
          ]
        }
      },
      sequence: ["block.upi", "block.card", "block.netbanking"],
      preferences: {
        show_default_blocks: true
      }
    }
  }
};


      const payment = await RazorpayCheckout.open(options);

      await api.post(
        "/medicine/order/payments/razorpay/verify",
        {
          orderId,
          razorpay_order_id: payment.razorpay_order_id,
          razorpay_payment_id: payment.razorpay_payment_id,
          razorpay_signature: payment.razorpay_signature,
        }
      );

      clearCart();
      return { success: true };

    } catch (err) {
      console.log(err);
      const msg =
        err?.response?.data?.message ||
        err?.description ||
        "Payment failed";

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
  if (!ctx)
    throw new Error("Must use inside provider");
  return ctx;
};
