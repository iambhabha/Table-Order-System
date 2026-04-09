import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TableCard } from "@/components/TableCard";
import { useRestaurant } from "@/context/RestaurantContext";
import { useColors } from "@/hooks/useColors";
import { Table, TableStatus } from "@/context/RestaurantContext";

type TransferType = "table" | "kot" | "items";

const STATUS_CONFIG_FLOOR: Record<string, { color: string; bg: string }> = {
  available: { color: "#27AE60", bg: "#27AE6022" },
  occupied:  { color: "#C0392B", bg: "#C0392B22" },
  reserved:  { color: "#2980B9", bg: "#2980B922" },
  cleaning:  { color: "#F39C12", bg: "#F39C1222" },
};

const FILTERS: { label: string; value: TableStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Available", value: "available" },
  { label: "Occupied", value: "occupied" },
  { label: "Reserved", value: "reserved" },
  { label: "Cleaning", value: "cleaning" },
];

const LOCATIONS = ["Window", "Center", "Bar", "Private", "Patio", "Outdoor", "VIP", "Other"];

export default function TablesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tables, getTableOrder, getTotalAmount, transferOrder, transferKOT, addTable, removeTable, getTableDisplayName } = useRestaurant();
  const [filter, setFilter] = useState<TableStatus | "all">("all");

  // Transfer modal
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferFrom, setTransferFrom] = useState<Table | null>(null);
  const [transferType, setTransferType] = useState<TransferType | null>(null);
  const [transferTo, setTransferTo] = useState<Table | null>(null);

  // Add table modal
  const [showAddTable, setShowAddTable] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCapacity, setNewCapacity] = useState("4");
  const [newLocation, setNewLocation] = useState("Center");

  const stats = useMemo(() => {
    const available = tables.filter((t) => t.status === "available").length;
    const occupied = tables.filter((t) => t.status === "occupied").length;
    const reserved = tables.filter((t) => t.status === "reserved").length;
    return { available, occupied, reserved, total: tables.length };
  }, [tables]);

  const filtered = useMemo(() => {
    if (filter === "all") return tables;
    return tables.filter((t) => t.status === filter);
  }, [tables, filter]);

  const occupiedTables = useMemo(() => tables.filter((t) => t.status === "occupied"), [tables]);
  const availableTables = useMemo(() => tables.filter((t) => t.status === "available"), [tables]);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const resetTransfer = () => {
    setShowTransfer(false);
    setTransferFrom(null);
    setTransferType(null);
    setTransferTo(null);
  };

  const handleTransferConfirm = () => {
    if (!transferFrom || !transferTo || !transferType) return;
    if (transferType === "table") {
      transferOrder(transferFrom.id, transferTo.id);
    } else if (transferType === "kot") {
      transferKOT(transferFrom.id, transferTo.id);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetTransfer();
    Alert.alert(
      "Transfer Complete",
      `Transfer done from ${getTableDisplayName(transferFrom)} to ${getTableDisplayName(transferTo)}.`
    );
  };

  const handleAddTable = () => {
    if (!newLabel.trim()) {
      Alert.alert("Required", "Please enter a table name.");
      return;
    }
    const cap = parseInt(newCapacity) || 4;
    addTable(newLabel.trim(), cap, newLocation);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddTable(false);
    setNewLabel("");
    setNewCapacity("4");
    setNewLocation("Center");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS === "web" ? topPad : 0,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Floor Plan
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {stats.occupied} of {stats.total} occupied
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowTransfer(true)}
            style={[styles.headerBtn, { backgroundColor: colors.secondary + "18" }]}
          >
            <Feather name="shuffle" size={17} color={colors.secondary} />
            <Text style={[styles.headerBtnText, { color: colors.secondary }]}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAddTable(true)}
            style={[styles.headerBtn, { backgroundColor: colors.primary + "18" }]}
          >
            <Feather name="plus" size={17} color={colors.primary} />
            <Text style={[styles.headerBtnText, { color: colors.primary }]}>Table</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats bar */}
      <View
        style={[
          styles.statsBar,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <StatChip label="Available" value={stats.available} color="#27AE60" />
        <StatChip label="Occupied" value={stats.occupied} color="#C0392B" />
        <StatChip label="Reserved" value={stats.reserved} color="#2980B9" />
        <StatChip label="Total" value={stats.total} color={colors.foreground} />
      </View>

      {/* Filter bar */}
      <View
        style={[
          styles.filterBar,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item.value)}
              style={[
                styles.filterChip,
                filter === item.value
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.muted },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      filter === item.value
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 3-column grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={3}
        key="3col"
        contentContainerStyle={[
          styles.grid,
          {
            paddingBottom:
              Platform.OS === "web"
                ? Math.max(insets.bottom, 34) + 84
                : insets.bottom + 84,
          },
        ]}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const order = getTableOrder(item.id);
          const total = order ? getTotalAmount(order.id) : undefined;
          return (
            <View style={styles.cardWrapper}>
              <TableCard
                table={item}
                displayName={getTableDisplayName(item)}
                onPress={() =>
                  router.push({
                    pathname: "/table/[id]",
                    params: { id: item.id },
                  })
                }
                orderItemCount={order?.items.length}
                totalAmount={total}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="grid" size={40} color={colors.mutedForeground} style={{ marginBottom: 10 }} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No tables match this filter
            </Text>
          </View>
        }
      />

      {/* ── TRANSFER MODAL ── */}
      <Modal
        visible={showTransfer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={resetTransfer}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={resetTransfer}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Transfer Order</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Step 1: Pick FROM table */}
            {!transferFrom && (
              <>
                <Text style={[styles.stepLabel, { color: colors.foreground }]}>
                  Select occupied table to transfer FROM
                </Text>
                {occupiedTables.length === 0 ? (
                  <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                    No occupied tables right now.
                  </Text>
                ) : (
                  <View style={styles.tablePickerGrid}>
                    {occupiedTables.map((t) => {
                      const sc = STATUS_CONFIG_FLOOR[t.status];
                      return (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() => { setTransferFrom(t); setTransferType(null); setTransferTo(null); }}
                          style={[styles.pickerChip, { backgroundColor: sc.bg, borderColor: sc.color + "88" }]}
                        >
                          <Text style={[styles.pickerChipText, { color: sc.color }]}>
                            {getTableDisplayName(t)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {/* Step 2: Pick transfer TYPE */}
            {transferFrom && !transferType && (
              <>
                <TouchableOpacity onPress={() => setTransferFrom(null)} style={styles.backRow}>
                  <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.backRowText, { color: colors.mutedForeground }]}>Change table</Text>
                </TouchableOpacity>
                <Text style={[styles.stepLabel, { color: colors.foreground }]}>
                  Select transfer type for {getTableDisplayName(transferFrom)}
                </Text>
                {[
                  { type: "table" as TransferType, icon: "shuffle" as const, title: "Table Transfer", sub: "Move the entire order to another table", color: colors.primary },
                  { type: "kot" as TransferType, icon: "send" as const, title: "KOT Transfer", sub: "Move pending kitchen items to another table", color: "#E67E22" },
                  { type: "items" as TransferType, icon: "list" as const, title: "Item Transfer", sub: "Go to table to select specific items", color: "#27AE60" },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.type}
                    onPress={() => {
                      if (opt.type === "items") {
                        Alert.alert("Item Transfer", "Open the table directly and use the shuffle icon to select specific items.");
                        return;
                      }
                      setTransferType(opt.type);
                    }}
                    style={[styles.transferTypeCard, { backgroundColor: opt.color + "12", borderColor: opt.color + "55" }]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.transferTypeIcon, { backgroundColor: opt.color + "20" }]}>
                      <Feather name={opt.icon} size={20} color={opt.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.transferTypeTitle, { color: colors.foreground }]}>{opt.title}</Text>
                      <Text style={[styles.transferTypeSub, { color: colors.mutedForeground }]}>{opt.sub}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={opt.color} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Step 3: Pick TO table */}
            {transferFrom && transferType && !transferTo && (
              <>
                <TouchableOpacity onPress={() => setTransferType(null)} style={styles.backRow}>
                  <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.backRowText, { color: colors.mutedForeground }]}>Change type</Text>
                </TouchableOpacity>
                <Text style={[styles.stepLabel, { color: colors.foreground }]}>
                  Select destination table
                </Text>
                {(transferType === "table" ? availableTables : tables.filter(t => t.id !== transferFrom.id && t.status !== "cleaning")).length === 0 ? (
                  <Text style={[styles.hintText, { color: colors.mutedForeground }]}>No tables available.</Text>
                ) : (
                  <View style={styles.tablePickerGrid}>
                    {(transferType === "table" ? availableTables : tables.filter(t => t.id !== transferFrom.id && t.status !== "cleaning")).map((t) => {
                      const sc = STATUS_CONFIG_FLOOR[t.status];
                      return (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() => setTransferTo(t)}
                          style={[styles.pickerChip, { backgroundColor: sc.bg, borderColor: sc.color + "88" }]}
                        >
                          <Text style={[styles.pickerChipText, { color: sc.color }]}>
                            {getTableDisplayName(t)}
                          </Text>
                          <Text style={[styles.pickerChipSub, { color: sc.color + "99" }]}>
                            {t.status}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {/* Step 4: Confirm */}
            {transferFrom && transferType && transferTo && (
              <>
                <TouchableOpacity onPress={() => setTransferTo(null)} style={styles.backRow}>
                  <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.backRowText, { color: colors.mutedForeground }]}>Change table</Text>
                </TouchableOpacity>
                <View style={[styles.transferSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.summaryTypeLabel, { color: colors.mutedForeground }]}>
                    {transferType === "table" ? "Table Transfer" : "KOT Transfer"}
                  </Text>
                  <View style={styles.transferRow}>
                    <View style={[styles.transferChip, { backgroundColor: "#C0392B20" }]}>
                      <Text style={[styles.transferChipText, { color: "#C0392B" }]}>
                        {getTableDisplayName(transferFrom)}
                      </Text>
                    </View>
                    <Feather name="arrow-right" size={20} color={colors.mutedForeground} />
                    <View style={[styles.transferChip, { backgroundColor: STATUS_CONFIG_FLOOR[transferTo.status]?.bg }]}>
                      <Text style={[styles.transferChipText, { color: STATUS_CONFIG_FLOOR[transferTo.status]?.color }]}>
                        {getTableDisplayName(transferTo)}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleTransferConfirm}
                  style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.85}
                >
                  <Feather name="check" size={18} color="#fff" />
                  <Text style={styles.confirmBtnText}>Confirm Transfer</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ── ADD TABLE MODAL ── */}
      <Modal
        visible={showAddTable}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowAddTable(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAddTable(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Custom Table</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>
              Table Name / Label
            </Text>
            <TextInput
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="e.g. P1, VIP, John's Party"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              autoFocus
              maxLength={20}
            />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Use any name — table number, party name, room code, etc.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.foreground, marginTop: 16 }]}>
              Capacity (seats)
            </Text>
            <View style={styles.guestRow}>
              {["2", "4", "6", "8", "10", "12"].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setNewCapacity(n)}
                  style={[
                    styles.guestChip,
                    {
                      backgroundColor: newCapacity === n ? colors.primary : colors.muted,
                      borderColor: newCapacity === n ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.guestChipText, { color: newCapacity === n ? "#fff" : colors.foreground }]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
              <TextInput
                value={newCapacity}
                onChangeText={setNewCapacity}
                keyboardType="number-pad"
                placeholder="+"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.guestInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.foreground, marginTop: 16 }]}>
              Location
            </Text>
            <View style={styles.locationGrid}>
              {LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  onPress={() => setNewLocation(loc)}
                  style={[
                    styles.locationChip,
                    {
                      backgroundColor: newLocation === loc ? colors.secondary : colors.muted,
                      borderColor: newLocation === loc ? colors.secondary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.locationText, { color: newLocation === loc ? "#fff" : colors.mutedForeground }]}>
                    {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleAddTable}
              style={[styles.confirmBtn, { backgroundColor: colors.primary, marginTop: 28 }]}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.confirmBtnText}>Add Table</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 1 },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  headerBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  statsBar: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    justifyContent: "space-around",
  },
  stat: { alignItems: "center" },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  filterBar: { borderBottomWidth: 1, paddingVertical: 8 },
  filterList: { paddingHorizontal: 12, gap: 7 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  filterText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  grid: { padding: 10, paddingTop: 12 },
  row: { gap: 8, justifyContent: "flex-start" },
  cardWrapper: { flex: 1 / 3 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  // Modal
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalContent: { padding: 20 },
  stepLabel: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 12 },
  hintText: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 12 },
  tablePickerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  pickerChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 72,
    alignItems: "center",
  },
  pickerChipText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  divider: { height: 1, marginVertical: 20 },
  transferSummary: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  transferRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 10 },
  transferChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  transferChipText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  backRowText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  summaryTypeLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  transferTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  transferTypeIcon: { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  transferTypeTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 2 },
  transferTypeSub: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  pickerChipSub: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2, textTransform: "capitalize" },
  transferNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  confirmBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  // Add Table
  inputLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  hint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 6 },
  guestRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  guestChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  guestChipText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  guestInput: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  locationGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  locationChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  locationText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
