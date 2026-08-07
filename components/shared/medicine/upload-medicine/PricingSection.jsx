import InputField from "./ui/InputField";
import SectionCard from "./ui/SectionCard";

export default function PricingSection({ data, onChange }) {
  return (
    <SectionCard title="Pricing">
      <InputField
        label="MRP (₹)"
        keyboard="numeric"
        value={data.mrp}
        onChangeText={(v) => onChange("mrp", v)}
      />

      <InputField
        label="Selling Price (₹)"
        keyboard="numeric"
        value={data.normalUserPrice}
        onChangeText={(v) => onChange("normalUserPrice", v)}
      />

      <InputField
        label="special price for RM Member(₹)"
        keyboard="numeric"
        value={data.marketingAgentPrice}
        onChangeText={(v) => onChange("marketingAgentPrice", v)}
      />

      <InputField
        label="GST (%)"
        keyboard="numeric"
        value={data.gstPercentage}
        onChangeText={(v) => onChange("gstPercentage", v)}
      />
    </SectionCard>
  );
}
