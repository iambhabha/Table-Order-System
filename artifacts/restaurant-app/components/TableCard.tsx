import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { Table, TableStatus } from "@/context/RestaurantContext";

interface TableCardProps {
  table: Table;
  displayName: string;
  onPress: () => void;
  orderItemCount?: number;
  totalAmount?: number;
}

const STATUS_CONFIG: Record<
  TableStatus,
  { label: string; color: string; bg: string; icon: keyof typeof Feather.glyphMap }
> = {
  available: { label: "Available", color: "#27AE60", bg: "#27AE6022", icon: "check-circle" },
  occupied:  { label: "Occupied",  color: "#C0392B", bg: "#C0392B22", icon: "users" },
  reserved:  { label: "Reserved",  color: "#2980B9", bg: "#2980B922", icon: "clock" },
  cleaning:  { label: "Cleaning",  color: "#F39C12", bg: "#F39C1222", icon: "refresh-cw" },
};

export function TableCard({
  table,
  displayName,
  onPress,
  orderItemCount,
  totalAmount,
}: TableCardProps) {
  const colors = useColors();
  const config = STATUS_CONFIG[table.status];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[
        styles.card,
        {
          backgroundColor: config.bg,
          borderColor: config.color + "55",
          borderWidth: 1.5,
          ...(Platform.OS !== "web"
            ? {
                shadowColor: config.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 3,
              }
            : {}),
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.tableNumber,
            { backgroundColor: config.color + "25" },
          ]}
        >
          <Text
            style={[styles.numberText, { color: config.color }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {displayName}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: config.color + "30" },
          ]}
        >
          <Feather name={config.icon} size={10} color={config.color} />
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Feather name="users" size={11} color={config.color + "99"} />
          <Text style={[styles.infoText, { color: config.color + "cc" }]}>
            {table.capacity} seats
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={11} color={config.color + "99"} />
          <Text style={[styles.infoText, { color: config.color + "cc" }]} numberOfLines={1}>
            {table.location}
          </Text>
        </View>
      </View>

      {table.status === "occupied" && orderItemCount != null && (
        <View
          style={[
            styles.orderInfo,
            { borderTopColor: config.color + "30", backgroundColor: config.color + "15" },
          ]}
        >
          <Text style={[styles.orderLabel, { color: config.color + "bb" }]}>
            {orderItemCount} item{orderItemCount !== 1 ? "s" : ""}
          </Text>
          <Text style={[styles.orderAmount, { color: config.color }]}>
            ${totalAmount?.toFixed(2)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    paddingBottom: 6,
  },
  tableNumber: {
    minWidth: 38,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    flex: 1,
    marginRight: 6,
  },
  numberText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  statusBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  orderInfo: {
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  orderAmount: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
});
