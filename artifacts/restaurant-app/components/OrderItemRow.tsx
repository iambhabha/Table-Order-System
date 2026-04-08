import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { OrderItem, OrderStatus } from "@/context/RestaurantContext";

interface OrderItemRowProps {
  item: OrderItem;
  index: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onStatusChange?: (status: OrderStatus) => void;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#7A7068",
  preparing: "#E67E22",
  ready: "#27AE60",
  served: "#2980B9",
  paid: "#9B59B6",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  paid: "Paid",
};

export function OrderItemRow({
  item,
  index,
  onIncrement,
  onDecrement,
  onRemove,
  onStatusChange,
}: OrderItemRowProps) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[item.status];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.nameSection}>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {item.menuItem.name}
          </Text>
          {item.notes ? (
            <Text style={[styles.notes, { color: colors.mutedForeground }]}>
              {item.notes}
            </Text>
          ) : null}
        </View>
        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: colors.foreground }]}>
            ${(item.menuItem.price * item.quantity).toFixed(2)}
          </Text>
          <Text style={[styles.unitPrice, { color: colors.mutedForeground }]}>
            ${item.menuItem.price.toFixed(2)} each
          </Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            onPress={onDecrement}
            style={[
              styles.qtyBtn,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <Feather name="minus" size={14} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.qty, { color: colors.foreground }]}>
            {item.quantity}
          </Text>
          <TouchableOpacity
            onPress={onIncrement}
            style={[
              styles.qtyBtn,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <Feather name="plus" size={14} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
            <Feather name="trash-2" size={14} color={colors.destructive} />
          </TouchableOpacity>
        </View>

        {onStatusChange && (
          <View style={styles.statusSection}>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: statusColor + "20" },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABELS[item.status]}
              </Text>
            </View>
            <View style={styles.statusActions}>
              {item.status === "pending" && (
                <TouchableOpacity
                  onPress={() => onStatusChange("preparing")}
                  style={[
                    styles.statusBtn,
                    { backgroundColor: "#E67E2220" },
                  ]}
                >
                  <Text style={[styles.statusBtnText, { color: "#E67E22" }]}>
                    Start
                  </Text>
                </TouchableOpacity>
              )}
              {item.status === "preparing" && (
                <TouchableOpacity
                  onPress={() => onStatusChange("ready")}
                  style={[
                    styles.statusBtn,
                    { backgroundColor: "#27AE6020" },
                  ]}
                >
                  <Text style={[styles.statusBtnText, { color: "#27AE60" }]}>
                    Ready
                  </Text>
                </TouchableOpacity>
              )}
              {item.status === "ready" && (
                <TouchableOpacity
                  onPress={() => onStatusChange("served")}
                  style={[
                    styles.statusBtn,
                    { backgroundColor: "#2980B920" },
                  ]}
                >
                  <Text style={[styles.statusBtnText, { color: "#2980B9" }]}>
                    Served
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  nameSection: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  notes: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  priceSection: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  unitPrice: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qty: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    minWidth: 20,
    textAlign: "center",
  },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  statusSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  statusActions: {
    flexDirection: "row",
    gap: 6,
  },
  statusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBtnText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
