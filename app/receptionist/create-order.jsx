import StaffOrderForm from "../../components/shared/orders/StaffOrderForm";

export default function ReceptionistCreateOrder() {
  return <StaffOrderForm ordersHref="/receptionist/(tabs)/medicineorder" />;
}
