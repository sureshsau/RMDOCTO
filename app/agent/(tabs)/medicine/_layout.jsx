import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useMedicineCart } from "../../../../context/MedicineCartContext";
import { useMedicine } from "../../../../context/MedicineContext";

/* ================= SEARCH HEADER (INDEX ONLY) ================= */

function MedicineSearchHeader() {
  const { searchQuery, setSearchQuery } = useMedicine();
  const [value, setValue] = useState(searchQuery);

  // 🔥 Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(value);
    }, 400);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 42,
        width: "100%",
        marginRight: 8,
      }}
    >
      <Ionicons name="search" size={18} color="#14b8a6" />

      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Search medicines"
        placeholderTextColor="#94a3b8"
        autoCorrect={false}
        autoCapitalize="none"
        style={{
          flex: 1,
          marginLeft: 8,
          fontSize: 14,
          color: "#0f172a",
          paddingVertical: 0,
        }}
      />

      {/* ❌ CLEAR BUTTON */}
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            setValue("");
            setSearchQuery("");
          }}
        >
          <Ionicons
            name="close-circle"
            size={18}
            color="#94a3b8"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ================= CART BUTTON (ALL PAGES) ================= */

function CartButton() {
  const { totalItems } = useMedicineCart();

  return (
    <TouchableOpacity
      onPress={() => router.push("/agent/(tabs)/medicine/checkOut")}
      style={{
        marginRight: 12,
        paddingRight: 2,   // ✅ extra space so badge doesn’t clip
      }}
      hitSlop={10}
    >
      <View
        style={{
          width: 34,
          height: 34,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons
          name="cart-outline"
          size={28}
          color="#ffffff"
        />

        {/* 🔴 BADGE */}
        {totalItems > 0 && (
          <View
            style={{
              position: "absolute",
              top: -0,          // ✅ no longer outside container
              right: -2,
              backgroundColor: "#dc2626",
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 11,
                fontWeight: "800",
                lineHeight: 14,
              }}
            >
              {totalItems}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}


/* ================= LAYOUT ================= */

export default function MedicineLayout() {
  return (

      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#14b8a6",
          },
          headerTintColor: "#ffffff",
          headerTitleAlign: "center",
          headerShadowVisible: false,

          // 🛒 Cart visible on ALL pages
          headerRight: () => <CartButton />,
        }}
      >
        {/* ================= INDEX ================= */}
        <Stack.Screen
          name="index"
          options={{
            // 🔍 Search ONLY on index
            headerTitle: () => <MedicineSearchHeader />,
          }}
        />

        {/* ================= DETAILS ================= */}
        <Stack.Screen
          name="details"
          options={{
            title: "Medicine Details",
          }}
        />
         <Stack.Screen
          name="checkOut"
          options={{
            title: "Medicine Details",
            headerRight:()=>null
          }}
        />
      </Stack>
  );
}
