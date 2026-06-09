import { StyleSheet, Text, View } from "react-native";

import { Brand } from "@/constants/theme";

export type NetworkId =
  | "CellC"
  | "Telkom"
  | "MTN"
  | "Vodacom"
  | "StandardBank";

export const NETWORKS: { id: NetworkId; label: string }[] = [
  { id: "CellC", label: "CellC" },
  { id: "Telkom", label: "Telkom Mob..." },
  { id: "MTN", label: "MTN" },
  { id: "Vodacom", label: "Vodacom" },
  { id: "StandardBank", label: "Standard B..." },
];

export function networkDisplay(id: NetworkId): string {
  if (id === "StandardBank") return "Standard Bank";
  if (id === "Telkom") return "Telkom Mobile";
  if (id === "CellC") return "Cell C";
  return id;
}

type Props = { id: NetworkId; size?: number };

export function NetworkLogo({ id, size = 44 }: Props) {
  const s = StyleSheet.create({
    base: {
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    inner: {
      width: size * 0.55,
      height: size * 0.55,
      borderRadius: (size * 0.55) / 2,
      borderWidth: size * 0.08,
      alignItems: "center",
      justifyContent: "center",
    },
  });

  if (id === "Vodacom") {
    return (
      <View style={[s.base, { backgroundColor: "#E60000" }]}>
        <View
          style={[s.inner, { borderColor: Brand.white, position: "relative" }]}
        >
          <View
            style={{
              position: "absolute",
              top: -size * 0.1,
              right: -size * 0.1,
              width: size * 0.25,
              height: size * 0.25,
              borderRadius: (size * 0.25) / 2,
              backgroundColor: Brand.white,
            }}
          />
        </View>
      </View>
    );
  }

  if (id === "MTN") {
    return (
      <View
        style={[
          s.base,
          {
            backgroundColor: "#FFCB05",
            borderWidth: 1,
            borderColor: "#1A1A1A",
          },
        ]}
      >
        <Text
          style={{
            color: "#1A1A1A",
            fontSize: size * 0.28,
            fontWeight: "900",
            fontStyle: "italic",
          }}
        >
          MTN
        </Text>
      </View>
    );
  }

  if (id === "CellC") {
    return (
      <View style={[s.base, { backgroundColor: "#1A1A1A" }]}>
        <Text
          style={{
            color: "#E5651F",
            fontSize: size * 0.3,
            fontWeight: "900",
            fontStyle: "italic",
          }}
        >
          Cell
          <Text style={{ color: Brand.white }}>C</Text>
        </Text>
      </View>
    );
  }

  if (id === "Telkom") {
    return (
      <View
        style={[
          s.base,
          {
            backgroundColor: Brand.white,
            borderWidth: 1,
            borderColor: Brand.cardBorder,
          },
        ]}
      >
        <Text
          style={{
            color: "#0098DB",
            fontSize: size * 0.26,
            fontWeight: "700",
          }}
        >
          Telkom
        </Text>
      </View>
    );
  }

  return (
    <View style={[s.base, { backgroundColor: Brand.blueDeep }]}>
      <Text
        style={{ color: Brand.white, fontSize: size * 0.42, fontWeight: "900" }}
      >
        S
      </Text>
    </View>
  );
}
