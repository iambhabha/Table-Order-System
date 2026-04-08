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
  { label: string; color: string; icon: keyof typeof Feather.glyphMap }
> = {
  available: { label: "Available", color: "#27AE60", icon: "check-circle" },
  occupied: { label: "Occupied", color: "#C0392B", icon: "users" },
  reserved: { label: "Reserved", color: "#2980B9", icon: "clock" },
  cleaning: { label: "Cleaning", color: "#F39C12", icon: "refresh-cw" },
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
        <View
          style={[
            styles.tableNumber,
            { backgroundColor: table.isCustom ? colors.accent + "20" : "#2C3E5015" },
          ]}
        >
          <Text
            style={[styles.numberText, { color: colors.foreground }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {displayName}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: config.color + "20" },
          ]}
        >
          <Feather name={config.icon} size={10} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Feather name="users" size={12} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            {table.capacity} seats
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]} numberOfLines={1}>
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
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  numberText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
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
    paddingVertical: 8,
  },
  orderRow: {
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
