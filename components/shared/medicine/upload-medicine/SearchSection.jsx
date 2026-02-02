import InputField from "./ui/InputField";
import SectionCard from "./ui/SectionCard";

export default function SearchSection({ data, onChange }) {
  return (
    <SectionCard title="Search & Discovery">
      <InputField
        label="Tags"
        placeholder="fever, pain"
        value={data.tags}
        onChangeText={(v) => onChange("tags", v)}
      />

      <InputField
        label="Therapeutic Use"
        placeholder="Pain & fever relief"
        value={data.therapeuticUse}
        onChangeText={(v) => onChange("therapeuticUse", v)}
      />
    </SectionCard>
  );
}
