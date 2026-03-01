import { createContext, useContext, useState } from "react";
import Toast from "react-native-toast-message";
import api from "../services/axios";

const AppointmentContext = createContext();

export const AppointmentProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("today");

  const LIMIT = 10;

  /* ================= FETCH ================= */

  const fetchAppointments = async (
    page = 1,
    type = "today",
    isRefresh = false
  ) => {
    try {
      // 🛑 Prevent unnecessary fetch
      if (
        !isRefresh &&
        page === 1 &&
        appointments.length > 0 &&
        filterType === type
      ) {
        return;
      }

      if (page === 1) setLoading(true);

      const res = await api.get(
        `/appointment/bookings?page=${page}&limit=${LIMIT}&type=${type}`
      );

      if (!res.data.success) throw new Error("Failed");
      const newData = res.data.data || [];

      if (page === 1 || isRefresh) {
        setAppointments(newData);
      } else {
        setAppointments((prev) => [...prev, ...newData]);
      }

      setPagination({
        page,
        totalPages: res.data.pagination?.totalPages || 1,
      });

      setFilterType(type);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Failed to load appointments",
        text2:
          err?.response?.data?.message ||
          "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESET (For Filter Change) ================= */

  const resetAppointments = () => {
    setAppointments([]);
    setPagination({ page: 1, totalPages: 1 });
  };

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        pagination,
        loading,
        fetchAppointments,
        resetAppointments,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = () =>
  useContext(AppointmentContext);
