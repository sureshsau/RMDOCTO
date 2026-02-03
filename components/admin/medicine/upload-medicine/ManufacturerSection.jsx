import InputField from "./ui/InputField";
import SectionCard from "./ui/SectionCard";

export default function ManufacturerSection({ data, onChange }) {
  return (
    <SectionCard title="Manufacturer">
      <InputField
        label="Manufacturer Name"
        value={data.name}
        onChangeText={(v) => onChange("name", v)}
      />

      <InputField
        label="License Number"
        value={data.licenseNumber}
        onChangeText={(v) => onChange("licenseNumber", v)}
      />

      <InputField
        label="Address"
        multiline
        value={data.address}
        onChangeText={(v) => onChange("address", v)}
      />
    </SectionCard>
  );
}
