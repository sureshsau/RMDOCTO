"use client";

import { createContext, useContext, useMemo, useState } from "react";

const MedicineCartContext = createContext(null);

export const MedicineCartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  /* ================= ADD ================= */

  const addMedicine = (medicine) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i._id === medicine._id
      );

      if (existing) {
        return prev.map((i) =>
          i._id === medicine._id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [
        ...prev,
        {
          ...medicine,
          quantity: 1,
        },
      ];
    });
  };

  /* ================= UPDATE ================= */

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

  /* ================= REMOVE ================= */

  const removeMedicine = (id) => {
    setItems((prev) =>
      prev.filter((i) => i._id !== id)
    );
  };

  /* ================= DERIVED ================= */

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () =>
      items.reduce(
        (sum, i) =>
          sum + i.quantity * (i.pricing?.price || 0),
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

        addMedicine,
        updateQuantity,
        removeMedicine,
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
