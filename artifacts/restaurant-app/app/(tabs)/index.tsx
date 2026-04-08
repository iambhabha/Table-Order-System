import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TableCard } from "@/components/TableCard";
import { useRestaurant } from "@/context/RestaurantContext";
import { useColors } from "@/hooks/useColors";
import { TableStatus } from "@/context/RestaurantContext";

const FILTERS: { label: string; value: TableStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Available", value: "available" },
  { label: "Occupied", value: "occupied" },
  { label: "Reserved", value: "reserved" },
  { label: "Cleaning", value: "cleaning" },
];

export default function TablesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tables, getTableOrder, getTotalAmount } = useRestaurant();
  const [filter, setFilter] = useState<TableStatus | "all">("all");

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
          Floor Plan
        </Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          {stats.occupied} of {stats.total} occupied
        </Text>
      </View>

      <View
        style={[
          styles.statsBar,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <StatChip label="Available" value={stats.available} color="#27AE60" />
        <StatChip label="Occupied" value={stats.occupied} color="#C0392B" />
        <StatChip label="Reserved" value={stats.reserved} color="#2980B9" />
      </View>

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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
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
            <Feather
              name="grid"
              size={48}
              color={colors.mutedForeground}
              style={{ marginBottom: 12 }}
            />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No tables match this filter
            </Text>
          </View>
        }
      />
    </View>
  );
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  statsBar: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 24,
  },
  stat: { alignItems: "center" },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  filterBar: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  filterList: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  grid: { padding: 12, paddingTop: 14 },
  row: { gap: 12, justifyContent: "space-between" },
  cardWrapper: { flex: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
