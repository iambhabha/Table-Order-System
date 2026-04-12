import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRestaurant } from "@/context/RestaurantContext";
import { useColors } from "@/hooks/useColors";
import { Order } from "@/context/RestaurantContext";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function HistoryCard({ order, displayName, total }: {
  order: Order;
  displayName: string;
  total: number;
}) {
  const colors = useColors();
  const totalQty = order.kots.reduce((s, k) => s + k.items.reduce((s2, i) => s2 + i.quantity, 0), 0);
  const kotCount = order.kots.length;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tableNum, { color: colors.foreground }]}>{displayName}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {order.serverName} · {order.guestCount} guests
          </Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{formatDate(order.createdAt)}</Text>
          <View style={styles.kotRow}>
            {order.kots.map((kot) => (
              <View
                key={kot.id}
                style={[styles.kotChip, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <Text style={[styles.kotChipText, { color: colors.mutedForeground }]}>
                  KOT #{kot.kotNumber} · {kot.items.reduce((s, i) => s + i.quantity, 0)} items
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.rightCol}>
          <Text style={[styles.total, { color: colors.primary }]}>${total.toFixed(2)}</Text>
          <View style={[styles.paidBadge, { backgroundColor: "#9B59B620" }]}>
            <Text style={{ color: "#9B59B6", fontSize: 11, fontFamily: "Inter_600SemiBold" }}>Paid</Text>
          </View>
          <Text style={[styles.items, { color: colors.mutedForeground }]}>
            {kotCount} KOT{kotCount !== 1 ? "s" : ""} · {totalQty} items
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completedOrders, tables, getTotalAmount, getTableDisplayName } = useRestaurant();

  const totalRevenue = useMemo(
    () => completedOrders.reduce((sum, o) => sum + getTotalAmount(o.id), 0),
    [completedOrders, getTotalAmount]
  );

  const totalKOTs = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.kots.length, 0),
    [completedOrders]
  );

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>History</Text>
      </View>

      {completedOrders.length > 0 && (
        <View
          style={[
            styles.revenueBar,
            { backgroundColor: colors.primary + "15", borderBottomColor: colors.border },
          ]}
        >
          <View>
            <Text style={[styles.revenueLabel, { color: colors.mutedForeground }]}>Total Revenue</Text>
            <Text style={[styles.revenueAmount, { color: colors.primary }]}>${totalRevenue.toFixed(2)}</Text>
          </View>
          <View>
            <Text style={[styles.revenueLabel, { color: colors.mutedForeground }]}>Tables Served</Text>
            <Text style={[styles.revenueAmount, { color: colors.foreground }]}>{completedOrders.length}</Text>
          </View>
          <View>
            <Text style={[styles.revenueLabel, { color: colors.mutedForeground }]}>Total KOTs</Text>
            <Text style={[styles.revenueAmount, { color: colors.foreground }]}>{totalKOTs}</Text>
          </View>
          <View>
            <Text style={[styles.revenueLabel, { color: colors.mutedForeground }]}>Avg. Check</Text>
            <Text style={[styles.revenueAmount, { color: colors.foreground }]}>
              ${completedOrders.length > 0 ? (totalRevenue / completedOrders.length).toFixed(2) : "0.00"}
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={[...completedOrders].reverse()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: Platform.OS === "web"
              ? Math.max(insets.bottom, 34) + 84
              : insets.bottom + 84,
          },
        ]}
        renderItem={({ item }) => {
          const table = tables.find((t) => t.id === item.tableId);
          return (
            <HistoryCard
              order={item}
              displayName={table ? getTableDisplayName(table) : "Table"}
              total={getTotalAmount(item.id)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="clock" size={48} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No history yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Completed orders will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  revenueBar: {
    flexDirection: "row", justifyContent: "space-around",
    paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, flexWrap: "wrap", gap: 8,
  },
  revenueLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  revenueAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  tableNum: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 3 },
  meta: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  date: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 8 },
  kotRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  kotChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
  },
  kotChipText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  rightCol: { alignItems: "flex-end", gap: 6 },
  total: { fontSize: 18, fontFamily: "Inter_700Bold" },
  paidBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  items: { fontSize: 11, fontFamily: "Inter_400Regular" },
  empty: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100,
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 6 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
