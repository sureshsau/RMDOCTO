import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

import BasicInfoSection from "../../../components/shared/medicine/upload-medicine/BasicInfoSection";
import BatchSection from "../../../components/shared/medicine/upload-medicine/BatchSection";
import CompositionSection from "../../../components/shared/medicine/upload-medicine/CompositionSection.jsx";
import DosageSection from "../../../components/shared/medicine/upload-medicine/DosageSection";
import ManufacturerSection from "../../../components/shared/medicine/upload-medicine/ManufacturerSection";
import MedicineImagesSection from "../../../components/shared/medicine/upload-medicine/MedicineImagesSection";
import PricingSection from "../../../components/shared/medicine/upload-medicine/PricingSection";
import SearchSection from "../../../components/shared/medicine/upload-medicine/SearchSection";
import StatusSection from "../../../components/shared/medicine/upload-medicine/StatusSection";
import StockSection from "../../../components/shared/medicine/upload-medicine/StockSection";

import { useMedicine } from "../../../context/MedicineContext"; // ✅

export default function UploadMedicine() {
  const { addMedicine, loading } = useMedicine(); // ✅

  const [images, setImages] = useState([]);

  const [basic, setBasic] = useState({
    name: "",
    brandName: "",
    description: "",
  });

  const [search, setSearch] = useState({
    tags: "",
    therapeuticUse: "",
  });

  const [composition, setComposition] = useState([
    { ingredient: "", strength: "" },
  ]);

  const [dosage, setDosage] = useState({
    dosageForm: "",
    prescriptionType: "RX",
  });

  const [pricing, setPricing] = useState({
    mrp: "",
    normalUserPrice: "",
    marketingAgentPrice: "",
    gstPercentage: "",
  });

  const [stock, setStock] = useState({
    totalQuantity: "",
    minAlertQuantity: "",
  });

  const [batch, setBatch] = useState({
    batchNumber: "",
    expiryDate: "",
    quantity: "",
  });

  const [manufacturer, setManufacturer] = useState({
    name: "",
    licenseNumber: "",
    address: "",
  });

  const [status, setStatus] = useState({ isActive: true });

  /* ================= VALIDATION ================= */

  const isFormValid = useMemo(() => {
    return (
      basic.name.trim() !== "" &&
      dosage.dosageForm.trim() !== "" &&
      pricing.mrp !== "" &&
      pricing.normalUserPrice !== "" &&
      pricing.marketingAgentPrice !== ""
    );
  }, [basic, dosage, pricing]);

  /* ================= SUBMIT ================= */

  const submitHandler = async () => {
    try {
      const fd = new FormData();

      // BASIC
      fd.append("name", basic.name);
      fd.append("brandName", basic.brandName);
      fd.append("description", basic.description);
      fd.append("therapeuticUse", search.therapeuticUse);
      fd.append("prescriptionType", dosage.prescriptionType);
      fd.append("dosageForm", dosage.dosageForm);

      // TAGS
      if (search.tags) {
        search.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((tag) => fd.append("tags[]", tag));
      }

      // PRICING
      fd.append("pricing[mrp]", pricing.mrp);
      fd.append("pricing[price]", pricing.normalUserPrice);
      fd.append(
        "pricing[specialPrice]",
        pricing.marketingAgentPrice
      );
      if (pricing.gstPercentage) {
        fd.append("gstPercentage", pricing.gstPercentage);
      }

      // COMPOSITION
      composition.forEach((c, i) => {
        if (c.ingredient && c.strength) {
          fd.append(`composition[${i}][ingredient]`, c.ingredient);
          fd.append(`composition[${i}][strength]`, c.strength);
        }
      });

      // STOCK
      if (stock.totalQuantity)
        fd.append("stock[totalQuantity]", stock.totalQuantity);
      if (stock.minAlertQuantity)
        fd.append("stock[minAlertQuantity]", stock.minAlertQuantity);

      // BATCH
      if (batch.batchNumber || batch.expiryDate || batch.quantity) {
        fd.append("batches[0][batchNumber]", batch.batchNumber);
        fd.append("batches[0][expiryDate]", batch.expiryDate);
        fd.append("batches[0][quantity]", batch.quantity);
      }

      // MANUFACTURER
      Object.entries(manufacturer).forEach(([k, v]) => {
        if (v) fd.append(`manufacturer[${k}]`, v);
      });

      // STATUS
      fd.append("isActive", status.isActive);

      // IMAGES
      images.forEach((uri, i) => {
        fd.append("images", {
          uri,
          name: `medicine_${i}.jpg`,
          type: "image/jpeg",
        });
      });

      // ✅ USE CONTEXT
      const res = await addMedicine(fd);

      if (!res.success) {
        Toast.show({
          type: "error",
          text1: "Save Failed",
          text2: res.error,
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: "Medicine Added",
        text2: "Medicine saved successfully",
      });

      router.back();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Unexpected Error",
        text2: "Something went wrong",
      });
    }
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={styles.scrollContent}
      >
        <MedicineImagesSection images={images} setImages={setImages} />

        <BasicInfoSection
          data={basic}
          onChange={(f, v) => setBasic((p) => ({ ...p, [f]: v }))}
        />

        <PricingSection
          data={pricing}
          onChange={(f, v) =>
            setPricing((p) => ({ ...p, [f]: v }))
          }
        />

        <DosageSection
          data={dosage}
          onChange={(f, v) =>
            setDosage((p) => ({ ...p, [f]: v }))
          }
        />

        <SearchSection
          data={search}
          onChange={(f, v) =>
            setSearch((p) => ({ ...p, [f]: v }))
          }
        />

        <CompositionSection
          data={composition}
          onChange={(i, f, v) =>
            setComposition((p) => {
              const c = [...p];
              c[i] = { ...c[i], [f]: v };
              return c;
            })
          }
          onAdd={() =>
            setComposition((p) => [
              ...p,
              { ingredient: "", strength: "" },
            ])
          }
          onRemove={(index) =>
            setComposition((p) => p.filter((_, i) => i !== index))
          }
        />

        <StockSection
          data={stock}
          onChange={(f, v) =>
            setStock((p) => ({ ...p, [f]: v }))
          }
        />

        <BatchSection
          data={batch}
          onChange={(f, v) =>
            setBatch((p) => ({ ...p, [f]: v }))
          }
        />

        <ManufacturerSection
          data={manufacturer}
          onChange={(f, v) =>
            setManufacturer((p) => ({ ...p, [f]: v }))
          }
        />

        <StatusSection
          isActive={status.isActive}
          onToggle={(v) => setStatus({ isActive: v })}
        />
      </ScrollView>

      {/* SAVE */}
      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!isFormValid || loading}
          onPress={submitHandler}
          style={[
            styles.saveBtn,
            !isFormValid && styles.saveBtnDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveText}>Save Medicine</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================= STYLES (UNCHANGED) ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  scrollContent: { padding: 16, paddingBottom: 120 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    padding: 16,
  },
  saveBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: "#cbd5e1",
  },
  saveText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});
