import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRestaurant } from "@/context/RestaurantContext";
import { useColors } from "@/hooks/useColors";
import { Order, OrderStatus } from "@/context/RestaurantContext";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#7A7068",
  preparing: "#E67E22",
  ready: "#27AE60",
  served: "#2980B9",
  paid: "#9B59B6",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? "1 hr ago" : `${hrs} hrs ago`;
}

function OrderCard({ order, displayName, total, onPress }: {
  order: Order;
  displayName: string;
  total: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[order.status];
  const pendingCount = order.items.filter(i => i.status === "pending").length;
  const readyCount = order.items.filter(i => i.status === "ready").length;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.orderCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.tableInfo}>
          <Text style={[styles.tableNum, { color: colors.foreground }]}>
            {displayName}
          </Text>
          <Text style={[styles.server, { color: colors.mutedForeground }]}>
            {order.serverName} · {order.guestCount} guests
          </Text>
        </View>
        <View style={styles.rightInfo}>
          <Text style={[styles.total, { color: colors.primary }]}>
            ${total.toFixed(2)}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {timeAgo(order.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>
        <View style={styles.itemCounts}>
          <Text style={[styles.itemCount, { color: colors.mutedForeground }]}>
            {order.items.length} items
          </Text>
          {pendingCount > 0 && (
            <View style={[styles.alertBadge, { backgroundColor: "#E67E2220" }]}>
              <Text style={{ color: "#E67E22", fontSize: 11, fontFamily: "Inter_600SemiBold" }}>
                {pendingCount} pending
              </Text>
            </View>
          )}
          {readyCount > 0 && (
            <View style={[styles.alertBadge, { backgroundColor: "#27AE6020" }]}>
              <Text style={{ color: "#27AE60", fontSize: 11, fontFamily: "Inter_600SemiBold" }}>
                {readyCount} ready
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, tables, getTotalAmount, getTableDisplayName } = useRestaurant();

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "paid"),
    [orders]
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Live Orders
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: "#fff" }]}>
            {activeOrders.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={activeOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom:
              Platform.OS === "web"
                ? Math.max(insets.bottom, 34) + 84
                : insets.bottom + 84,
          },
        ]}
        renderItem={({ item }) => {
          const table = tables.find((t) => t.id === item.tableId);
          return (
            <OrderCard
              order={item}
              displayName={table ? getTableDisplayName(table) : "Table"}
              total={getTotalAmount(item.id)}
              onPress={() =>
                router.push({
                  pathname: "/table/[id]",
                  params: { id: item.tableId },
                })
              }
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather
              name="clipboard"
              size={48}
              color={colors.mutedForeground}
              style={{ marginBottom: 12 }}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No active orders
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              All tables are clear right now
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  list: { padding: 16, gap: 12 },
  orderCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  tableInfo: { flex: 1 },
  tableNum: { fontSize: 17, fontFamily: "Inter_700Bold" },
  server: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  rightInfo: { alignItems: "flex-end" },
  total: { fontSize: 16, fontFamily: "Inter_700Bold" },
  time: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  itemCounts: { flexDirection: "row", gap: 6, alignItems: "center" },
  itemCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  alertBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 6 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
