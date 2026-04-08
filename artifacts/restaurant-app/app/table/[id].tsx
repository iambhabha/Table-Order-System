import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
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
import { MenuItemCard } from "@/components/MenuItemCard";
import { OrderItemRow } from "@/components/OrderItemRow";
import { useRestaurant } from "@/context/RestaurantContext";
import { MenuItem, OrderStatus } from "@/context/RestaurantContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["Starters", "Mains", "Desserts", "Drinks"];

export default function TableDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    getTable,
    getTableOrder,
    createOrder,
    addItemToOrder,
    removeItemFromOrder,
    updateItemQuantity,
    updateItemStatus,
    updateOrderStatus,
    updateTableStatus,
    closeTable,
    getTotalAmount,
    menu,
  } = useRestaurant();

  const table = getTable(id ?? "");
  const order = getTableOrder(id ?? "");

  const [showMenu, setShowMenu] = useState(false);
  const [menuCategory, setMenuCategory] = useState("Starters");
  const [showStartModal, setShowStartModal] = useState(false);
  const [serverName, setServerName] = useState("");
  const [guestCount, setGuestCount] = useState("2");

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const handleStartOrder = useCallback(() => {
    if (!serverName.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }
    const count = parseInt(guestCount) || 1;
    createOrder(id!, serverName.trim(), count);
    setShowStartModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [id, serverName, guestCount, createOrder]);

  const handleAddItem = useCallback(
    (item: MenuItem) => {
      if (!order) return;
      addItemToOrder(order.id, item);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [order, addItemToOrder]
  );

  const handlePayAndClose = useCallback(() => {
    if (!order || !table) return;
    Alert.alert(
      "Close Table",
      `Confirm payment of $${getTotalAmount(order.id).toFixed(2)} and close Table ${table.number}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Payment",
          style: "default",
          onPress: () => {
            updateOrderStatus(order.id, "paid");
            closeTable(table.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  }, [order, table, getTotalAmount, updateOrderStatus, closeTable]);

  const handleMarkReserved = useCallback(() => {
    if (!table) return;
    updateTableStatus(table.id, table.status === "reserved" ? "available" : "reserved");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [table, updateTableStatus]);

  if (!table) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Table not found</Text>
      </View>
    );
  }

  const total = order ? getTotalAmount(order.id) : 0;
  const filteredMenu = menu.filter((m) => m.category === menuCategory);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: topPad + 10,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Table {table.number}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {table.location} · {table.capacity} seats
          </Text>
        </View>
        {table.status === "available" && (
          <TouchableOpacity onPress={handleMarkReserved} style={styles.headerBtn}>
            <Feather name="bookmark" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
        {table.status === "reserved" && (
          <TouchableOpacity onPress={handleMarkReserved} style={styles.headerBtn}>
            <Feather name="bookmark" size={20} color={colors.accent} />
          </TouchableOpacity>
        )}
      </View>

      {/* No Order State */}
      {!order && (
        <View style={styles.emptyState}>
          {table.status === "cleaning" ? (
            <>
              <Feather name="refresh-cw" size={52} color={colors.warning} style={{ marginBottom: 16 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Table Cleaning
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                This table will be ready shortly
              </Text>
            </>
          ) : table.status === "reserved" ? (
            <>
              <Feather name="bookmark" size={52} color={colors.accent} style={{ marginBottom: 16 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Reserved
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Tap to start the order when guests arrive
              </Text>
              <TouchableOpacity
                onPress={() => setShowStartModal(true)}
                style={[styles.startBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={18} color="#fff" />
                <Text style={styles.startBtnText}>Start Order</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Feather name="users" size={52} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Table Available
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Seat guests and start taking their order
              </Text>
              <TouchableOpacity
                onPress={() => setShowStartModal(true)}
                style={[styles.startBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={18} color="#fff" />
                <Text style={styles.startBtnText}>Seat Guests & Start Order</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Active Order */}
      {order && (
        <>
          <View
            style={[
              styles.orderMeta,
              { backgroundColor: colors.muted, borderBottomColor: colors.border },
            ]}
          >
            <View>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
                Server
              </Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>
                {order.serverName}
              </Text>
            </View>
            <View>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
                Guests
              </Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>
                {order.guestCount}
              </Text>
            </View>
            <View>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
                Items
              </Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>
                {order.items.reduce((s, i) => s + i.quantity, 0)}
              </Text>
            </View>
            <View>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
                Total
              </Text>
              <Text style={[styles.metaValue, { color: colors.primary }]}>
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>

          <FlatList
            data={order.items}
            keyExtractor={(_, i) => i.toString()}
            contentContainerStyle={[
              styles.itemsList,
              { paddingBottom: bottomPad + 160 },
            ]}
            ListHeaderComponent={
              order.items.length === 0 ? null : (
                <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                  ORDER ITEMS
                </Text>
              )
            }
            renderItem={({ item, index }) => (
              <OrderItemRow
                item={item}
                index={index}
                onIncrement={() =>
                  updateItemQuantity(order.id, index, item.quantity + 1)
                }
                onDecrement={() =>
                  updateItemQuantity(order.id, index, item.quantity - 1)
                }
                onRemove={() => removeItemFromOrder(order.id, index)}
                onStatusChange={(status: OrderStatus) =>
                  updateItemStatus(order.id, index, status)
                }
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyOrder}>
                <Feather name="shopping-cart" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyOrderText, { color: colors.mutedForeground }]}>
                  No items yet. Add from menu below.
                </Text>
              </View>
            }
          />

          {/* Bottom Action Bar */}
          <View
            style={[
              styles.actionBar,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                paddingBottom: bottomPad + 10,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowMenu(true)}
              style={[styles.addBtn, { backgroundColor: colors.secondary }]}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add Items</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePayAndClose}
              disabled={order.items.length === 0}
              style={[
                styles.payBtn,
                {
                  backgroundColor:
                    order.items.length === 0
                      ? colors.muted
                      : colors.primary,
                },
              ]}
              activeOpacity={0.85}
            >
              <Feather
                name="credit-card"
                size={18}
                color={order.items.length === 0 ? colors.mutedForeground : "#fff"}
              />
              <Text
                style={[
                  styles.payBtnText,
                  {
                    color:
                      order.items.length === 0
                        ? colors.mutedForeground
                        : "#fff",
                  },
                ]}
              >
                Pay ${total.toFixed(2)}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Start Order Modal */}
      <Modal
        visible={showStartModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowStartModal(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <TouchableOpacity onPress={() => setShowStartModal(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Start Order — Table {table.number}
            </Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>
              Your Name
            </Text>
            <TextInput
              value={serverName}
              onChangeText={setServerName}
              placeholder="e.g. Alex"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              autoFocus
            />

            <Text
              style={[
                styles.inputLabel,
                { color: colors.foreground, marginTop: 16 },
              ]}
            >
              Number of Guests
            </Text>
            <View style={styles.guestRow}>
              {["1", "2", "3", "4", "5", "6"].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setGuestCount(n)}
                  style={[
                    styles.guestChip,
                    {
                      backgroundColor:
                        guestCount === n ? colors.primary : colors.muted,
                      borderColor:
                        guestCount === n ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.guestChipText,
                      {
                        color:
                          guestCount === n
                            ? "#fff"
                            : colors.foreground,
                      },
                    ]}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
              <TextInput
                value={guestCount}
                onChangeText={setGuestCount}
                keyboardType="number-pad"
                placeholder="+"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.guestInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              onPress={handleStartOrder}
              style={[
                styles.confirmBtn,
                { backgroundColor: colors.primary },
              ]}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>Start Order</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMenu(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <TouchableOpacity onPress={() => setShowMenu(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Add Items
            </Text>
            <View style={{ width: 22 }} />
          </View>

          {/* Category tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.catScroll, { borderBottomColor: colors.border }]}
            contentContainerStyle={styles.catList}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setMenuCategory(cat)}
                style={[
                  styles.catChip,
                  menuCategory === cat
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.muted },
                ]}
              >
                <Text
                  style={[
                    styles.catText,
                    {
                      color:
                        menuCategory === cat
                          ? "#fff"
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredMenu}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.menuList}
            renderItem={({ item }) => (
              <MenuItemCard item={item} onAdd={handleAddItem} />
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  headerBtn: { padding: 4 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  startBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  orderMeta: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  metaLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginBottom: 3, textTransform: "uppercase" },
  metaValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  itemsList: { padding: 16 },
  emptyOrder: { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyOrderText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  addBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  payBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  payBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalContainer: { flex: 1 },
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
  inputLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  guestRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  guestChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  guestChipText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  guestInput: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  confirmBtn: {
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  catScroll: { borderBottomWidth: 1, paddingVertical: 10 },
  catList: { paddingHorizontal: 16, gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  catText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  menuList: { padding: 16 },
});
