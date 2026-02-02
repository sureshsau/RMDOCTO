import InputField from "./ui/InputField";
import SectionCard from "./ui/SectionCard";

export default function BasicInfoSection({ data, onChange }) {
  return (
    <SectionCard title="Basic Information">
      <InputField
        label="Medicine Name"
        placeholder="Paracetamol 500mg"
        value={data.name}
        onChangeText={(v) => onChange("name", v)}
      />

      <InputField
        label="Brand Name"
        placeholder="Cipla / Sun Pharma"
        value={data.brandName}
        onChangeText={(v) => onChange("brandName", v)}
      />

      <InputField
        label="Description"
        multiline
        value={data.description}
        onChangeText={(v) => onChange("description", v)}
      />
    </SectionCard>
  );
}
