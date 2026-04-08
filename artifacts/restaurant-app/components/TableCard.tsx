import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
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
  onPress: () => void;
  orderItemCount?: number;
  totalAmount?: number;
}

const STATUS_CONFIG: Record<
  TableStatus,
  { label: string; color: string; icon: keyof typeof Feather.glyphMap }
> = {
  available: { label: "Available", color: "#27AE60", icon: "check-circle" },
  occupied: { label: "Occupied", color: "#C0392B", icon: "users" },
  reserved: { label: "Reserved", color: "#2980B9", icon: "clock" },
  cleaning: { label: "Cleaning", color: "#F39C12", icon: "refresh-cw" },
};

export function TableCard({
  table,
  onPress,
  orderItemCount,
  totalAmount,
}: TableCardProps) {
  const colors = useColors();
  const config = STATUS_CONFIG[table.status];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor:
            table.status === "occupied" ? colors.primary : colors.border,
          borderWidth: table.status === "occupied" ? 2 : 1,
          ...(Platform.OS !== "web"
            ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 3,
              }
            : {}),
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.tableNumber}>
          <Text style={[styles.numberText, { color: colors.foreground }]}>
            {table.number}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: config.color + "20" },
          ]}
        >
          <Feather name={config.icon} size={11} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Feather name="users" size={13} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            {table.capacity} seats
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={13} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            {table.location}
          </Text>
        </View>
      </View>

      {table.status === "occupied" && orderItemCount != null && (
        <View
          style={[
            styles.orderInfo,
            { borderTopColor: colors.border, backgroundColor: colors.surface2 },
          ]}
        >
          <View style={styles.orderRow}>
            <Text style={[styles.orderLabel, { color: colors.mutedForeground }]}>
              {orderItemCount} item{orderItemCount !== 1 ? "s" : ""}
            </Text>
            <Text style={[styles.orderAmount, { color: colors.primary }]}>
              ${totalAmount?.toFixed(2)}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    paddingBottom: 10,
  },
  tableNumber: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2C3E5015",
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  info: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  orderInfo: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  orderAmount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
