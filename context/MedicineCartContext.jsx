"use client";

import { createContext, useContext, useMemo, useState } from "react";
import api from "../services/axios";

const MedicineCartContext = createContext(null);

export const MedicineCartProvider = ({ children }) => {

  const [items, setItems] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingOrderId, setPendingOrderId] = useState(null);

  /* ================= CART ================= */

  const addMedicine = (medicine) => {
    setPendingOrderId(null); // Invalidate pending order if cart changes
    setItems(prev => {
      const existing = prev.find(i => i._id === medicine._id);
      if (existing) {
        return prev.map(i =>
          i._id === medicine._id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...medicine, quantity: 1 }];
    });
  };

  const updateQuantity = (id, quantity) => {
    setPendingOrderId(null); // Invalidate pending order if cart changes
    if (typeof quantity === 'number' && quantity <= 0) return removeMedicine(id);
    setItems(prev =>
      prev.map(i =>
        i._id === id ? { ...i, quantity } : i
      )
    );
  };

  const removeMedicine = (id) => {
    setPendingOrderId(null); // Invalidate pending order if cart changes
    setItems(prev => prev.filter(i => i._id !== id));
  };

  const clearCart = () => {
    setItems([]);
    setDeliveryAddress(null);
    setError(null);
    setPendingOrderId(null);
  };

  /* ================= GST + AGENT PRICE ================= */

  const calculatePricing = (isAgent = false) => {

    let subtotal = 0;
    let gstTotal = 0;

    items.forEach(item => {

      const unitPrice = isAgent
        ? (item.specialPrice ?? item.price ?? 0)
        : (item.price ?? 0);

      const quantityStr = item.quantity;
      const quantity = (quantityStr === '' || isNaN(quantityStr)) ? 1 : Number(quantityStr);
      const gstPercent = item.gstPercentage ?? 0;

      const itemSubtotal = Number((unitPrice * quantity).toFixed(2));
      const itemGST = Number(((itemSubtotal * gstPercent) / 100).toFixed(2));

      subtotal += itemSubtotal;
      gstTotal += itemGST;
    });

    const deliveryCharge = 0;
    subtotal = Number(subtotal.toFixed(2));
    gstTotal = Number(gstTotal.toFixed(2));
    const payableAmount = Number((subtotal + gstTotal + deliveryCharge).toFixed(2));

    return {
      subtotal,
      gstTotal,
      deliveryCharge,
      payableAmount
    };
  };

  /* ================= PLACE ORDER ================= */

  const placeOrder = async ({ isAgent, paymentMode }) => {

    if (
      !deliveryAddress?.fullName ||
      !deliveryAddress?.phone ||
      !deliveryAddress?.addressLine1 ||
      !deliveryAddress?.location?.coordinates
    ) {
      setError("Please complete delivery address");
      return { success: false };
    }

    try {

      setLoading(true);
      setError(null);

      const pricing = calculatePricing(isAgent);

      const payload = {
        items: items.map(i => ({
          medicineId: i._id,
          quantity: i.quantity,
        })),
        deliveryAddress: {
          ...deliveryAddress,
          location: {
            type: "Point",
            coordinates: deliveryAddress.location.coordinates
          }
        },
        pricing,
        paymentMode,
        allowSpecialPrice: !!isAgent
      };

      /* ===== COD / RM CREDIT ===== */

      if (paymentMode !== "ONLINE") {
        const res = await api.post("/medicine/order", payload);
        clearCart();
        return { success: true, data: res.data };
      }

      /* ===== ONLINE ===== */

      let orderId = pendingOrderId;

      if (!orderId) {
        const orderRes = await api.post("/medicine/order", payload);
        orderId = orderRes?.data?.data?._id || orderRes?.data?._id;
        
        if (!orderId) throw new Error("Order ID missing");
        
        setPendingOrderId(orderId);
      }

      const razorRes = await api.post(
        "/medicine/order/payments/razorpay/create",
        { orderId }
      );

      const {
        razorpayOrderId,
        amount,
        currency,
        key,
        user
      } = razorRes.data.data;

      const options = {
        key,
        amount,
        currency,
        name: "RM Doctor",
        description: "Medicine Order",
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name || "",
          contact: user?.phone || "",
        },
        theme: { color: "#14b8a6" },
      };

      // Lazy-load razorpay only at point-of-use so Expo Go doesn't crash
      const RazorpayCheckout = (await import("react-native-razorpay")).default;
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
    () => items.length,
    [items]
  );

  return (
    <MedicineCartContext.Provider
      value={{
        items,
        totalItems,
        deliveryAddress,
        setDeliveryAddress,
        loading,
        error,
        addMedicine,
        updateQuantity,
        removeMedicine,
        clearCart,
        placeOrder,
        calculatePricing
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