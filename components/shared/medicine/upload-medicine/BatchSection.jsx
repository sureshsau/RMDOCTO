import InputField from "./ui/InputField";
import SectionCard from "./ui/SectionCard";

export default function BatchSection({ data, onChange }) {
  return (
    <SectionCard title="Batch & Expiry">
      <InputField
        label="Batch Number"
        value={data.batchNumber}
        onChangeText={(v) => onChange("batchNumber", v)}
      />

      <InputField
        label="Expiry Date"
        placeholder="YYYY-MM-DD"
        value={data.expiryDate}
        onChangeText={(v) => onChange("expiryDate", v)}
      />

      <InputField
        label="Batch Quantity"
        keyboard="numeric"
        value={data.quantity}
        onChangeText={(v) => onChange("quantity", v)}
      />
    </SectionCard>
  );
}
