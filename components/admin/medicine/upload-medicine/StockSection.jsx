import InputField from "./ui/InputField";
import SectionCard from "./ui/SectionCard";

export default function StockSection({ data, onChange }) {
  return (
    <SectionCard title="Stock">
      <InputField
        label="Total Quantity"
        keyboard="numeric"
        value={data.totalQuantity}
        onChangeText={(v) => onChange("totalQuantity", v)}
      />

      <InputField
        label="Min Alert Quantity"
        keyboard="numeric"
        value={data.minAlertQuantity}
        onChangeText={(v) => onChange("minAlertQuantity", v)}
      />
    </SectionCard>
  );
}
