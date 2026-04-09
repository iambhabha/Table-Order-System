import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { OrderItem, OrderStatus } from "@/context/RestaurantContext";

interface OrderItemRowProps {
  item: OrderItem;
  index: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onNotesChange?: (notes: string) => void;
  onStatusChange?: (status: OrderStatus) => void;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   "#7A7068",
  preparing: "#E67E22",
  ready:     "#27AE60",
  served:    "#2980B9",
  paid:      "#9B59B6",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:   "Pending",
  preparing: "Preparing",
  ready:     "Ready",
  served:    "Served",
  paid:      "Paid",
};

export function OrderItemRow({
  item,
  index,
  onIncrement,
  onDecrement,
  onRemove,
  onNotesChange,
  onStatusChange,
}: OrderItemRowProps) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[item.status];
  const [editingNotes, setEditingNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState(item.notes);

  const handleDelete = () => {
    Alert.alert(
      "Remove Item",
      `Remove ${item.menuItem.name} from the order?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: onRemove },
      ]
    );
  };

  const handleSaveNotes = () => {
    onNotesChange?.(draftNotes);
    setEditingNotes(false);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: statusColor + "55" },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.nameSection}>
          <Text style={[styles.emoji]}>{item.menuItem.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {item.menuItem.name}
            </Text>
            {editingNotes ? (
              <View style={styles.notesEdit}>
                <TextInput
                  value={draftNotes}
                  onChangeText={setDraftNotes}
                  placeholder="Add note..."
                  placeholderTextColor={colors.mutedForeground}
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  autoFocus
                  multiline
                  onSubmitEditing={handleSaveNotes}
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity
                    onPress={handleSaveNotes}
                    style={[styles.notesSaveBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.notesSaveTxt}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setDraftNotes(item.notes); setEditingNotes(false); }}
                    style={[styles.notesCancelBtn, { backgroundColor: colors.muted }]}
                  >
                    <Text style={[styles.notesCancelTxt, { color: colors.mutedForeground }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : item.notes ? (
              <Text style={[styles.notes, { color: colors.mutedForeground }]}>
                {item.notes}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: colors.foreground }]}>
            ${(item.menuItem.price * item.quantity).toFixed(2)}
          </Text>
          <Text style={[styles.unitPrice, { color: colors.mutedForeground }]}>
            ${item.menuItem.price.toFixed(2)} ea
          </Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            onPress={onDecrement}
            style={[styles.qtyBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          >
            <Feather name="minus" size={13} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.qty, { color: colors.foreground }]}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={onIncrement}
            style={[styles.qtyBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          >
            <Feather name="plus" size={13} color={colors.foreground} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setDraftNotes(item.notes); setEditingNotes(true); }}
            style={[styles.actionBtn, { backgroundColor: colors.secondary + "18" }]}
          >
            <Feather name="edit-2" size={13} color={colors.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            style={[styles.actionBtn, { backgroundColor: "#C0392B18" }]}
          >
            <Feather name="trash-2" size={13} color="#C0392B" />
          </TouchableOpacity>
        </View>

        {onStatusChange && (
          <View style={styles.statusSection}>
            <View style={[styles.statusPill, { backgroundColor: statusColor + "20" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABELS[item.status]}
              </Text>
            </View>
            <View style={styles.statusActions}>
              {item.status === "pending" && (
                <TouchableOpacity
                  onPress={() => onStatusChange("preparing")}
                  style={[styles.statusBtn, { backgroundColor: "#E67E2220" }]}
                >
                  <Text style={[styles.statusBtnText, { color: "#E67E22" }]}>Start</Text>
                </TouchableOpacity>
              )}
              {item.status === "preparing" && (
                <TouchableOpacity
                  onPress={() => onStatusChange("ready")}
                  style={[styles.statusBtn, { backgroundColor: "#27AE6020" }]}
                >
                  <Text style={[styles.statusBtnText, { color: "#27AE60" }]}>Ready</Text>
                </TouchableOpacity>
              )}
              {item.status === "ready" && (
                <TouchableOpacity
                  onPress={() => onStatusChange("served")}
                  style={[styles.statusBtn, { backgroundColor: "#2980B920" }]}
                >
                  <Text style={[styles.statusBtnText, { color: "#2980B9" }]}>Served</Text>
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
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 8,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  nameSection: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  emoji: {
    fontSize: 22,
    marginTop: 1,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  notes: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginTop: 2,
  },
  notesEdit: {
    marginTop: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 6,
  },
  notesActions: {
    flexDirection: "row",
    gap: 6,
  },
  notesSaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  notesSaveTxt: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  notesCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  notesCancelTxt: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  priceSection: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  unitPrice: {
    fontSize: 10,
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
    gap: 6,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qty: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    minWidth: 18,
    textAlign: "center",
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  statusActions: {
    flexDirection: "row",
    gap: 5,
  },
  statusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBtnText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
});
