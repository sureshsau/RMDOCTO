import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/axios";

const RMCreditContext = createContext();

export const RMCreditProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);

  const [wallet, setWallet] = useState({
    balance: 0,
    totalCredit: 0,
    usedCredit: 0,
    expiryDate: null,
    revokeOtp: null,
    revokeOtpExpiresAt: null,
    revokeAmount: null,
  });

  const [transactions, setTransactions] = useState([]);

  const fetchRMCredit = async () => {
    try {
      setLoading(true);

      const res = await api.get("/rmcredit/my");

      setWallet(
        res.data?.data?.wallet || {
          balance: 0,
          totalCredit: 0,
          usedCredit: 0,
          expiryDate: null,
          revokeOtp: null,
          revokeOtpExpiresAt: null,
          revokeAmount: null,
        }
      );

      setTransactions(res.data?.data?.transactions || []);
    } catch {
      setWallet({
        balance: 0,
        totalCredit: 0,
        usedCredit: 0,
        expiryDate: null,
        revokeOtp: null,
        revokeOtpExpiresAt: null,
        revokeAmount: null,
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRMCredit();
  }, []);

  return (
    <RMCreditContext.Provider
      value={{
        wallet,
        transactions,
        loading,
        refreshRMCredit: fetchRMCredit,
      }}
    >
      {children}
    </RMCreditContext.Provider>
  );
};

export const useRMCredit = () => useContext(RMCreditContext);
