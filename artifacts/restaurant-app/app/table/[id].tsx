import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import { KOT, MenuItem, OrderStatus, Table } from "@/context/RestaurantContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["Starters", "Mains", "Desserts", "Drinks"];

const OPEN_ITEM_CATEGORIES: { label: string; emoji: string; color: string }[] = [
  { label: "Food",      emoji: "🍽️", color: "#C0392B" },
  { label: "Liquor",    emoji: "🍾", color: "#8E44AD" },
  { label: "Beverages", emoji: "🥤", color: "#2980B9" },
];

type TransferType = "table" | "kot" | "items";

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  available: { color: "#27AE60", bg: "#27AE6022" },
  occupied:  { color: "#C0392B", bg: "#C0392B22" },
  reserved:  { color: "#2980B9", bg: "#2980B922" },
  cleaning:  { color: "#F39C12", bg: "#F39C1222" },
};

type CartItem = { menuItem: MenuItem; quantity: number; notes: string };

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function TableDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    tables,
    getTable,
    getTableOrder,
    createOrder,
    addKOT,
    removeItemFromKOT,
    updateKOTItem,
    updateOrderStatus,
    updateTableStatus,
    closeTable,
    getTotalAmount,
    menu,
    transferOrder,
    transferKOT,
    transferItems,
    getTableDisplayName,
  } = useRestaurant();

  const table = getTable(id ?? "");
  const order = getTableOrder(id ?? "");

  // ── Cart (items being built before placing a KOT) ──────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);

  const [showMenu, setShowMenu] = useState(false);
  const [menuCategory, setMenuCategory] = useState("Starters");
  const [menuSearch, setMenuSearch] = useState("");
  const [showOpenItem, setShowOpenItem] = useState(false);

  const [openItemName, setOpenItemName] = useState("");
  const [openItemCategory, setOpenItemCategory] = useState(OPEN_ITEM_CATEGORIES[0]);
  const [openItemPrice, setOpenItemPrice] = useState("");
  const [openItemQty, setOpenItemQty] = useState(1);

  const [showStartModal, setShowStartModal] = useState(false);
  const [serverName, setServerName] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [customerMobile, setCustomerMobile] = useState("");

  const [showTransferTypeModal, setShowTransferTypeModal] = useState(false);
  const [selectedTransferType, setSelectedTransferType] = useState<TransferType | null>(null);
  const [transferTo, setTransferTo] = useState<Table | null>(null);
  const [selectedKOTItems, setSelectedKOTItems] = useState<{ kotId: string; itemIndex: number }[]>([]);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const allTables = tables.filter((t) => t.id !== id);
  const availableTables = tables.filter((t) => t.status === "available" && t.id !== id);
  const anyTables = tables.filter((t) => t.id !== id && t.status !== "cleaning");

  const filteredMenu = useMemo(() => {
    if (menuSearch.trim()) {
      return menu.filter(
        (m) =>
          m.name.toLowerCase().includes(menuSearch.trim().toLowerCase()) ||
          m.description.toLowerCase().includes(menuSearch.trim().toLowerCase())
      );
    }
    return menu.filter((m) => m.category === menuCategory);
  }, [menu, menuSearch, menuCategory]);

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const cartTotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const addToCart = useCallback((item: MenuItem) => {
    if (!order) return;
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.menuItem.id === item.id && c.notes === "");
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { menuItem: item, quantity: 1, notes: "" }];
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [order]);

  const updateCartQty = (idx: number, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((_, i) => i !== idx);
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: qty };
      return next;
    });
  };

  const updateCartNotes = (idx: number, notes: string) => {
    setCart((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], notes };
      return next;
    });
  };

  const handlePlaceKOT = useCallback(() => {
    if (!order || cart.length === 0) return;
    addKOT(order.id, cart);
    setCart([]);
    setShowMenu(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [order, cart, addKOT]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleStartOrder = useCallback(() => {
    if (!serverName.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }
    const count = parseInt(guestCount) || 1;
    createOrder(id!, serverName.trim(), count, customerMobile.trim());
    setShowStartModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [id, serverName, guestCount, customerMobile, createOrder]);

  const resetOpenItem = () => {
    setOpenItemName("");
    setOpenItemCategory(OPEN_ITEM_CATEGORIES[0]);
    setOpenItemPrice("");
    setOpenItemQty(1);
    setShowOpenItem(false);
  };

  const handleAddOpenItem = useCallback(() => {
    if (!order) return;
    if (!openItemName.trim()) {
      Alert.alert("Required", "Please enter an item name.");
      return;
    }
    const price = parseFloat(openItemPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price greater than 0.");
      return;
    }
    const openMenuItem: MenuItem = {
      id: `open_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: openItemName.trim(),
      category: openItemCategory.label,
      price,
      description: `Open Item · ${openItemCategory.label}`,
      emoji: openItemCategory.emoji,
    };
    setCart((prev) => [...prev, { menuItem: openMenuItem, quantity: openItemQty, notes: "" }]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetOpenItem();
  }, [order, openItemName, openItemCategory, openItemPrice, openItemQty]);

  const handlePayAndClose = useCallback(() => {
    if (!order || !table) return;
    const displayName = getTableDisplayName(table);
    Alert.alert(
      "Close Table",
      `Confirm payment of $${getTotalAmount(order.id).toFixed(2)} and close ${displayName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Payment",
          onPress: () => {
            updateOrderStatus(order.id, "paid");
            closeTable(table.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  }, [order, table, getTotalAmount, updateOrderStatus, closeTable, getTableDisplayName]);

  const handleMarkReserved = useCallback(() => {
    if (!table) return;
    updateTableStatus(table.id, table.status === "reserved" ? "available" : "reserved");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [table, updateTableStatus]);

  const resetTransferState = () => {
    setShowTransferTypeModal(false);
    setSelectedTransferType(null);
    setTransferTo(null);
    setSelectedKOTItems([]);
  };

  const handleTransferConfirm = useCallback(() => {
    if (!table || !transferTo || !selectedTransferType) return;

    if (selectedTransferType === "table") {
      transferOrder(table.id, transferTo.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetTransferState();
      router.back();
    } else if (selectedTransferType === "kot") {
      transferKOT(table.id, transferTo.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetTransferState();
    } else if (selectedTransferType === "items") {
      if (selectedKOTItems.length === 0) {
        Alert.alert("No items selected", "Please select at least one item to transfer.");
        return;
      }
      transferItems(table.id, transferTo.id, selectedKOTItems);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetTransferState();
    }
  }, [table, transferTo, selectedTransferType, selectedKOTItems, transferOrder, transferKOT, transferItems]);

  const toggleKOTItemSelection = (kotId: string, itemIndex: number) => {
    setSelectedKOTItems((prev) => {
      const existing = prev.findIndex((s) => s.kotId === kotId && s.itemIndex === itemIndex);
      if (existing >= 0) return prev.filter((_, i) => i !== existing);
      return [...prev, { kotId, itemIndex }];
    });
  };

  const isKOTItemSelected = (kotId: string, itemIndex: number) =>
    selectedKOTItems.some((s) => s.kotId === kotId && s.itemIndex === itemIndex);

  if (!table) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Table not found</Text>
      </View>
    );
  }

  const displayName = getTableDisplayName(table);
  const total = order ? getTotalAmount(order.id) : 0;

  // All placed items (flattened) for KOT Transfer count
  const allPlacedItems = order?.kots.flatMap((k) => k.items) ?? [];
  const totalPlacedQty = order?.kots.reduce(
    (s, k) => s + k.items.reduce((s2, i) => s2 + i.quantity, 0), 0
  ) ?? 0;

  const transferTargetTables = selectedTransferType === "table" ? availableTables : anyTables;

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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{displayName}</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {table.location} · {table.capacity} seats
          </Text>
        </View>
        <View style={styles.headerRight}>
          {table.status === "occupied" && (
            <TouchableOpacity
              onPress={() => setShowTransferTypeModal(true)}
              style={[styles.headerIconBtn, { backgroundColor: colors.secondary + "18" }]}
            >
              <Feather name="shuffle" size={17} color={colors.secondary} />
            </TouchableOpacity>
          )}
          {table.status === "available" && (
            <TouchableOpacity onPress={handleMarkReserved} style={styles.headerIconBtn}>
              <Feather name="bookmark" size={19} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          {table.status === "reserved" && (
            <TouchableOpacity onPress={handleMarkReserved} style={styles.headerIconBtn}>
              <Feather name="bookmark" size={19} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* No Order State */}
      {!order && (
        <View style={styles.emptyState}>
          {table.status === "cleaning" ? (
            <>
              <Feather name="refresh-cw" size={52} color={colors.warning} style={{ marginBottom: 16 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Table Cleaning</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>This table will be ready shortly</Text>
            </>
          ) : table.status === "reserved" ? (
            <>
              <Feather name="bookmark" size={52} color={colors.accent} style={{ marginBottom: 16 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Reserved</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Tap to start the order when guests arrive</Text>
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
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Table Available</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Seat guests and start taking their order</Text>
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
          {/* Order meta strip */}
          <View
            style={[
              styles.orderMeta,
              { backgroundColor: colors.muted, borderBottomColor: colors.border },
            ]}
          >
            <View>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Server</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>{order.serverName}</Text>
            </View>
            <View>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Guests</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>{order.guestCount}</Text>
            </View>
            {order.customerMobile ? (
              <View>
                <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Mobile</Text>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>{order.customerMobile}</Text>
              </View>
            ) : null}
            <View>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>KOTs</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>{order.kots.length}</Text>
            </View>
            <View>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Total</Text>
              <Text style={[styles.metaValue, { color: colors.primary }]}>${total.toFixed(2)}</Text>
            </View>
          </View>

          {/* KOT list + cart */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.itemsList, { paddingBottom: bottomPad + 160 }]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Cart (pending, not yet placed) */}
            {cart.length > 0 && (
              <View style={[styles.kotSection, { borderColor: "#E67E2244" }]}>
                <View style={[styles.kotHeader, { backgroundColor: "#E67E2210" }]}>
                  <View style={styles.kotHeaderLeft}>
                    <View style={[styles.kotBadge, { backgroundColor: "#E67E22" }]}>
                      <Text style={styles.kotBadgeText}>PENDING</Text>
                    </View>
                    <Text style={[styles.kotMeta, { color: colors.mutedForeground }]}>
                      {cartCount} item{cartCount !== 1 ? "s" : ""} · ${cartTotal.toFixed(2)} · Not placed
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handlePlaceKOT}
                    style={styles.placeKOTBtn}
                    activeOpacity={0.85}
                  >
                    <Feather name="send" size={13} color="#fff" />
                    <Text style={styles.placeKOTText}>Place KOT</Text>
                  </TouchableOpacity>
                </View>
                {cart.map((cartItem, idx) => (
                  <OrderItemRow
                    key={idx}
                    item={{ menuItem: cartItem.menuItem, quantity: cartItem.quantity, notes: cartItem.notes, status: "pending" }}
                    index={idx}
                    onIncrement={() => updateCartQty(idx, cartItem.quantity + 1)}
                    onDecrement={() => updateCartQty(idx, cartItem.quantity - 1)}
                    onRemove={() => setCart((prev) => prev.filter((_, i) => i !== idx))}
                    onNotesChange={(notes) => updateCartNotes(idx, notes)}
                  />
                ))}
              </View>
            )}

            {/* Placed KOTs */}
            {order.kots.length === 0 && cart.length === 0 && (
              <View style={styles.emptyOrder}>
                <Feather name="shopping-cart" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyOrderText, { color: colors.mutedForeground }]}>
                  No items yet. Tap Add Items below.
                </Text>
              </View>
            )}

            {[...order.kots].reverse().map((kot) => {
              const kotTotal = kot.items.reduce(
                (s, i) => s + i.menuItem.price * i.quantity, 0
              );
              const kotQty = kot.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <View key={kot.id} style={[styles.kotSection, { borderColor: colors.border }]}>
                  <View style={[styles.kotHeader, { backgroundColor: colors.muted }]}>
                    <View style={styles.kotHeaderLeft}>
                      <View style={[styles.kotBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.kotBadgeText}>KOT #{kot.kotNumber}</Text>
                      </View>
                      <Text style={[styles.kotMeta, { color: colors.mutedForeground }]}>
                        {kotQty} item{kotQty !== 1 ? "s" : ""} · ${kotTotal.toFixed(2)} · {formatTime(kot.createdAt)}
                      </Text>
                    </View>
                  </View>
                  {kot.items.map((item, itemIdx) => (
                    <OrderItemRow
                      key={itemIdx}
                      item={item}
                      index={itemIdx}
                      onIncrement={() =>
                        updateKOTItem(order.id, kot.id, itemIdx, { quantity: item.quantity + 1 })
                      }
                      onDecrement={() =>
                        updateKOTItem(order.id, kot.id, itemIdx, { quantity: item.quantity - 1 })
                      }
                      onRemove={() => removeItemFromKOT(order.id, kot.id, itemIdx)}
                      onNotesChange={(notes) =>
                        updateKOTItem(order.id, kot.id, itemIdx, { notes })
                      }
                      onStatusChange={(status: OrderStatus) =>
                        updateKOTItem(order.id, kot.id, itemIdx, { status })
                      }
                    />
                  ))}
                </View>
              );
            })}
          </ScrollView>

          {/* Action bar */}
          <View
            style={[
              styles.actionBar,
              { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 10 },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowMenu(true)}
              style={[styles.addBtn, { backgroundColor: colors.secondary }]}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.addBtnText}>
                Add Items{cartCount > 0 ? ` (${cartCount})` : ""}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePayAndClose}
              disabled={order.kots.length === 0}
              style={[
                styles.payBtn,
                { backgroundColor: order.kots.length === 0 ? colors.muted : colors.primary },
              ]}
              activeOpacity={0.85}
            >
              <Feather
                name="credit-card"
                size={18}
                color={order.kots.length === 0 ? colors.mutedForeground : "#fff"}
              />
              <Text
                style={[
                  styles.payBtnText,
                  { color: order.kots.length === 0 ? colors.mutedForeground : "#fff" },
                ]}
              >
                Pay ${total.toFixed(2)}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── START ORDER MODAL ── */}
      <Modal
        visible={showStartModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowStartModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowStartModal(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Start Order — {displayName}
            </Text>
            <View style={{ width: 22 }} />
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Your Name (Server)</Text>
            <TextInput
              value={serverName}
              onChangeText={setServerName}
              placeholder="e.g. Alex"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              autoFocus
            />
            <Text style={[styles.inputLabel, { color: colors.foreground, marginTop: 16 }]}>
              Customer Mobile{" "}
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12 }}>(optional)</Text>
            </Text>
            <TextInput
              value={customerMobile}
              onChangeText={setCustomerMobile}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
            <Text style={[styles.inputLabel, { color: colors.foreground, marginTop: 16 }]}>Number of Guests</Text>
            <View style={styles.guestRow}>
              {["1", "2", "3", "4", "5", "6"].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setGuestCount(n)}
                  style={[
                    styles.guestChip,
                    {
                      backgroundColor: guestCount === n ? colors.primary : colors.muted,
                      borderColor: guestCount === n ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.guestChipText, { color: guestCount === n ? "#fff" : colors.foreground }]}>
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
                style={[styles.guestInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
            <TouchableOpacity
              onPress={handleStartOrder}
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>Start Order</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── MENU MODAL ── */}
      <Modal
        visible={showMenu}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setShowMenu(false); setMenuSearch(""); resetOpenItem(); }}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setShowMenu(false); setMenuSearch(""); resetOpenItem(); }}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Items</Text>
            <View style={{ width: 22 }} />
          </View>

          {!showOpenItem && (
            <View style={[styles.searchBar, { backgroundColor: colors.muted, borderBottomColor: colors.border }]}>
              <Feather name="search" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                value={menuSearch}
                onChangeText={setMenuSearch}
                placeholder="Search items by name..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground }]}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {menuSearch.length > 0 && (
                <TouchableOpacity onPress={() => setMenuSearch("")} style={{ padding: 4 }}>
                  <Feather name="x-circle" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {!menuSearch.trim() && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.catScroll, { borderBottomColor: colors.border }]}
              contentContainerStyle={styles.catList}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => { setMenuCategory(cat); setShowOpenItem(false); }}
                  style={[
                    styles.catChip,
                    !showOpenItem && menuCategory === cat
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.muted },
                  ]}
                >
                  <Text style={[styles.catText, { color: !showOpenItem && menuCategory === cat ? "#fff" : colors.mutedForeground }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => { setShowOpenItem(true); setMenuSearch(""); }}
                style={[
                  styles.catChip,
                  styles.openItemTab,
                  showOpenItem
                    ? { backgroundColor: "#8E44AD" }
                    : { backgroundColor: "#8E44AD18", borderWidth: 1.5, borderColor: "#8E44AD55" },
                ]}
              >
                <Feather name="edit-3" size={12} color={showOpenItem ? "#fff" : "#8E44AD"} />
                <Text style={[styles.catText, { color: showOpenItem ? "#fff" : "#8E44AD" }]}>Open Item</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {menuSearch.trim() && (
            <View style={[styles.searchResultsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <Text style={[styles.searchResultCount, { color: colors.mutedForeground }]}>
                {filteredMenu.length} result{filteredMenu.length !== 1 ? "s" : ""} for "{menuSearch.trim()}"
              </Text>
            </View>
          )}

          {/* ── OPEN ITEM FORM ── */}
          {showOpenItem ? (
            <ScrollView contentContainerStyle={styles.openItemContainer} keyboardShouldPersistTaps="handled">
              <View style={[styles.openItemBanner, { backgroundColor: "#8E44AD15", borderColor: "#8E44AD44" }]}>
                <Feather name="edit-3" size={16} color="#8E44AD" />
                <Text style={[styles.openItemBannerText, { color: "#8E44AD" }]}>
                  Open Item — for custom or special orders not in the menu
                </Text>
              </View>

              <Text style={[styles.openItemLabel, { color: colors.foreground }]}>Item Name</Text>
              <TextInput
                value={openItemName}
                onChangeText={setOpenItemName}
                placeholder="e.g. Special Mix, Chef's Platter, Custom Cocktail"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.openItemInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                autoFocus
                maxLength={60}
              />

              <Text style={[styles.openItemLabel, { color: colors.foreground, marginTop: 20 }]}>Category</Text>
              <View style={styles.openCatRow}>
                {OPEN_ITEM_CATEGORIES.map((cat) => {
                  const selected = openItemCategory.label === cat.label;
                  return (
                    <TouchableOpacity
                      key={cat.label}
                      onPress={() => setOpenItemCategory(cat)}
                      style={[
                        styles.openCatChip,
                        {
                          backgroundColor: selected ? cat.color : cat.color + "12",
                          borderColor: selected ? cat.color : cat.color + "55",
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.openCatEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.openCatText, { color: selected ? "#fff" : cat.color }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.openItemLabel, { color: colors.foreground, marginTop: 20 }]}>Price (per unit)</Text>
              <View style={[styles.priceInputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.currencySign, { color: colors.mutedForeground }]}>$</Text>
                <TextInput
                  value={openItemPrice}
                  onChangeText={setOpenItemPrice}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="decimal-pad"
                  style={[styles.priceInput, { color: colors.foreground }]}
                />
              </View>

              <Text style={[styles.openItemLabel, { color: colors.foreground, marginTop: 20 }]}>Quantity</Text>
              <View style={styles.openQtyRow}>
                <TouchableOpacity
                  onPress={() => setOpenItemQty((q) => Math.max(1, q - 1))}
                  style={[styles.openQtyBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
                  <Feather name="minus" size={18} color={colors.foreground} />
                </TouchableOpacity>
                <View style={[styles.openQtyDisplay, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.openQtyText, { color: colors.foreground }]}>{openItemQty}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setOpenItemQty((q) => Math.min(99, q + 1))}
                  style={[styles.openQtyBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
                  <Feather name="plus" size={18} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {openItemName.trim() && openItemPrice && (
                <View style={[styles.openItemPreview, { backgroundColor: openItemCategory.color + "12", borderColor: openItemCategory.color + "44" }]}>
                  <Text style={styles.openItemPreviewEmoji}>{openItemCategory.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.openItemPreviewName, { color: colors.foreground }]}>{openItemName.trim()}</Text>
                    <Text style={[styles.openItemPreviewMeta, { color: colors.mutedForeground }]}>
                      {openItemCategory.label} · x{openItemQty} · ${(parseFloat(openItemPrice || "0") * openItemQty).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={handleAddOpenItem}
                style={[styles.openItemAddBtn, { backgroundColor: openItemCategory.color }]}
                activeOpacity={0.85}
              >
                <Feather name="plus-circle" size={18} color="#fff" />
                <Text style={styles.openItemAddBtnText}>
                  Add to Cart · {openItemQty}x ${(parseFloat(openItemPrice || "0") * openItemQty).toFixed(2)}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <FlatList
              data={filteredMenu}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.menuList, { paddingBottom: cartCount > 0 ? 100 : 20 }]}
              renderItem={({ item }) => <MenuItemCard item={item} onAdd={addToCart} />}
              ListEmptyComponent={
                <View style={styles.emptyOrder}>
                  <Feather name="search" size={32} color={colors.mutedForeground} />
                  <Text style={[styles.emptyOrderText, { color: colors.mutedForeground }]}>No items match your search</Text>
                </View>
              }
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* Cart footer inside menu modal */}
          {cartCount > 0 && (
            <View style={[styles.cartFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <View style={styles.cartFooterLeft}>
                <View style={[styles.cartCountBadge, { backgroundColor: "#E67E22" }]}>
                  <Text style={styles.cartCountText}>{cartCount}</Text>
                </View>
                <Text style={[styles.cartFooterMeta, { color: colors.foreground }]}>
                  item{cartCount !== 1 ? "s" : ""} · ${cartTotal.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handlePlaceKOT}
                style={[styles.placeKOTLargeBtn, { backgroundColor: "#E67E22" }]}
                activeOpacity={0.85}
              >
                <Feather name="send" size={16} color="#fff" />
                <Text style={styles.placeKOTLargeText}>Place KOT</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ── TRANSFER MODAL ── */}
      <Modal
        visible={showTransferTypeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={resetTransferState}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={resetTransferState}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Transfer — {displayName}
            </Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">

            {/* Step 1: pick transfer type */}
            {!selectedTransferType && (
              <>
                <Text style={[styles.stepLabel, { color: colors.foreground }]}>Select transfer type</Text>
                <TransferTypeOption
                  icon="shuffle"
                  title="Table Transfer"
                  subtitle="Move entire order (all KOTs) to another available table"
                  color={colors.primary}
                  onPress={() => setSelectedTransferType("table")}
                />
                <TransferTypeOption
                  icon="send"
                  title="KOT Transfer"
                  subtitle={`Move all placed items (${allPlacedItems.length}) to another table as a new KOT`}
                  color="#E67E22"
                  onPress={() => {
                    if (allPlacedItems.length === 0) {
                      Alert.alert("No Placed Items", "There are no placed KOT items to transfer.");
                      return;
                    }
                    setSelectedTransferType("kot");
                  }}
                  disabled={allPlacedItems.length === 0}
                />
                <TransferTypeOption
                  icon="list"
                  title="Item Transfer"
                  subtitle="Select specific items from any KOT to move to another table"
                  color="#27AE60"
                  onPress={() => setSelectedTransferType("items")}
                  disabled={allPlacedItems.length === 0}
                />
              </>
            )}

            {/* Item transfer: select items */}
            {selectedTransferType === "items" && !transferTo && (
              <>
                <TouchableOpacity onPress={() => setSelectedTransferType(null)} style={styles.backRow}>
                  <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.backRowText, { color: colors.mutedForeground }]}>Change type</Text>
                </TouchableOpacity>
                <Text style={[styles.stepLabel, { color: colors.foreground }]}>Select items to transfer</Text>
                {order?.kots.map((kot) => (
                  <View key={kot.id} style={{ marginBottom: 16 }}>
                    <Text style={[styles.transferKotLabel, { color: colors.mutedForeground }]}>
                      KOT #{kot.kotNumber} · {formatTime(kot.createdAt)}
                    </Text>
                    {kot.items.map((item, itemIdx) => {
                      const selected = isKOTItemSelected(kot.id, itemIdx);
                      return (
                        <TouchableOpacity
                          key={itemIdx}
                          onPress={() => toggleKOTItemSelection(kot.id, itemIdx)}
                          style={[
                            styles.itemPickerRow,
                            {
                              backgroundColor: selected ? "#27AE6018" : colors.card,
                              borderColor: selected ? "#27AE60" : colors.border,
                            },
                          ]}
                        >
                          <View style={[styles.checkbox, { borderColor: selected ? "#27AE60" : colors.border, backgroundColor: selected ? "#27AE60" : "transparent" }]}>
                            {selected && <Feather name="check" size={12} color="#fff" />}
                          </View>
                          <Text style={styles.itemPickerEmoji}>{item.menuItem.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.itemPickerName, { color: colors.foreground }]}>{item.menuItem.name}</Text>
                            <Text style={[styles.itemPickerMeta, { color: colors.mutedForeground }]}>
                              x{item.quantity} · ${(item.menuItem.price * item.quantity).toFixed(2)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
                {selectedKOTItems.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setTransferTo(null)}
                    style={[styles.confirmBtn, { backgroundColor: "#27AE60", marginTop: 8 }]}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.confirmBtnText}>
                      Select Destination Table ({selectedKOTItems.length} item{selectedKOTItems.length !== 1 ? "s" : ""})
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Table / KOT transfer: pick target table */}
            {selectedTransferType && selectedTransferType !== "items" && !transferTo && (
              <>
                <TouchableOpacity onPress={() => setSelectedTransferType(null)} style={styles.backRow}>
                  <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.backRowText, { color: colors.mutedForeground }]}>Change type</Text>
                </TouchableOpacity>
                <Text style={[styles.stepLabel, { color: colors.foreground }]}>Select destination table</Text>
                {transferTargetTables.length === 0 ? (
                  <Text style={[styles.hintText, { color: colors.mutedForeground }]}>No available tables.</Text>
                ) : (
                  <View style={styles.tablePickerGrid}>
                    {transferTargetTables.map((t) => {
                      const sc = STATUS_CONFIG[t.status];
                      return (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() => setTransferTo(t)}
                          style={[styles.pickerChip, { backgroundColor: sc.bg, borderColor: sc.color + "88" }]}
                        >
                          <Text style={[styles.pickerChipText, { color: sc.color }]}>{getTableDisplayName(t)}</Text>
                          <Text style={[styles.pickerChipSub, { color: sc.color + "99" }]}>{t.status}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {/* Item transfer: pick target table */}
            {selectedTransferType === "items" && selectedKOTItems.length > 0 && !transferTo && (
              <>
                <TouchableOpacity onPress={() => setSelectedKOTItems([])} style={styles.backRow}>
                  <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.backRowText, { color: colors.mutedForeground }]}>Change items</Text>
                </TouchableOpacity>
                <Text style={[styles.stepLabel, { color: colors.foreground }]}>Select destination table</Text>
                {anyTables.length === 0 ? (
                  <Text style={[styles.hintText, { color: colors.mutedForeground }]}>No tables available.</Text>
                ) : (
                  <View style={styles.tablePickerGrid}>
                    {anyTables.map((t) => {
                      const sc = STATUS_CONFIG[t.status] ?? { color: "#888", bg: "#88888822" };
                      return (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() => setTransferTo(t)}
                          style={[styles.pickerChip, { backgroundColor: sc.bg, borderColor: sc.color + "88" }]}
                        >
                          <Text style={[styles.pickerChipText, { color: sc.color }]}>{getTableDisplayName(t)}</Text>
                          <Text style={[styles.pickerChipSub, { color: sc.color + "99" }]}>{t.status}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {/* Confirm */}
            {selectedTransferType && transferTo && (
              <>
                <TouchableOpacity onPress={() => setTransferTo(null)} style={styles.backRow}>
                  <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.backRowText, { color: colors.mutedForeground }]}>Change table</Text>
                </TouchableOpacity>
                <View style={[styles.transferSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                    {selectedTransferType === "table" && "Table Transfer"}
                    {selectedTransferType === "kot" && `KOT Transfer · ${allPlacedItems.length} items`}
                    {selectedTransferType === "items" && `Item Transfer · ${selectedKOTItems.length} item${selectedKOTItems.length !== 1 ? "s" : ""}`}
                  </Text>
                  <View style={styles.transferRow}>
                    <View style={[styles.transferChip, { backgroundColor: colors.primary + "20" }]}>
                      <Text style={[styles.transferChipText, { color: colors.primary }]}>{displayName}</Text>
                    </View>
                    <Feather name="arrow-right" size={20} color={colors.mutedForeground} />
                    <View style={[styles.transferChip, { backgroundColor: STATUS_CONFIG[transferTo.status]?.bg ?? "#88888822" }]}>
                      <Text style={[styles.transferChipText, { color: STATUS_CONFIG[transferTo.status]?.color ?? "#888" }]}>
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
    </View>
  );
}

function TransferTypeOption({
  icon, title, subtitle, color, onPress, disabled,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.transferTypeCard,
        {
          backgroundColor: disabled ? colors.muted : color + "12",
          borderColor: disabled ? colors.border : color + "55",
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <View style={[styles.transferTypeIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.transferTypeTitle, { color: disabled ? colors.mutedForeground : colors.foreground }]}>
          {title}
        </Text>
        <Text style={[styles.transferTypeSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      {!disabled && <Feather name="chevron-right" size={18} color={color} />}
    </TouchableOpacity>
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
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  headerRight: { flexDirection: "row", gap: 6 },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  emptyState: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32, gap: 8,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  startBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 20, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
  },
  startBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  orderMeta: {
    flexDirection: "row", justifyContent: "space-around",
    paddingVertical: 12, borderBottomWidth: 1,
    flexWrap: "wrap", rowGap: 6, paddingHorizontal: 8,
  },
  metaLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginBottom: 3, textTransform: "uppercase" },
  metaValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  itemsList: { padding: 14, gap: 0 },
  // KOT sections
  kotSection: {
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 14,
  },
  kotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  kotHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    flexWrap: "wrap",
  },
  kotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  kotBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  kotMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  placeKOTBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#E67E22",
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
  },
  placeKOTText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  emptyOrder: { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyOrderText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  actionBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", gap: 10,
    paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1,
  },
  addBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  addBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  payBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  payBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalContent: { padding: 20, paddingBottom: 40 },
  inputLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  input: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: "Inter_400Regular",
  },
  guestRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  guestChip: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  guestChipText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  guestInput: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    textAlign: "center", fontSize: 16, fontFamily: "Inter_600SemiBold",
  },
  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 28,
  },
  confirmBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  // Menu
  searchBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", paddingVertical: 0 },
  searchResultsBar: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  searchResultCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  catScroll: { borderBottomWidth: 1, paddingVertical: 10 },
  catList: { paddingHorizontal: 16, gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  catText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  openItemTab: { flexDirection: "row", alignItems: "center", gap: 5 },
  menuList: { padding: 16 },
  // Cart footer inside menu modal
  cartFooter: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, gap: 12,
  },
  cartFooterLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  cartCountBadge: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  cartCountText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  cartFooterMeta: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  placeKOTLargeBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14,
  },
  placeKOTLargeText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  // Open item form
  openItemContainer: { padding: 20, paddingBottom: 50 },
  openItemBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 22,
  },
  openItemBannerText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1, lineHeight: 18 },
  openItemLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
  openItemInput: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 16, fontFamily: "Inter_400Regular",
  },
  openCatRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  openCatChip: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5,
    flex: 1, minWidth: 90, justifyContent: "center",
  },
  openCatEmoji: { fontSize: 18 },
  openCatText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  priceInputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4,
  },
  currencySign: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginRight: 4 },
  priceInput: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", paddingVertical: 8 },
  openQtyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  openQtyBtn: {
    width: 46, height: 46, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  openQtyDisplay: {
    width: 64, height: 46, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  openQtyText: { fontSize: 22, fontFamily: "Inter_700Bold" },
  openItemPreview: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 22,
  },
  openItemPreviewEmoji: { fontSize: 28 },
  openItemPreviewName: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 3 },
  openItemPreviewMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  openItemAddBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 9, paddingVertical: 15, borderRadius: 14, marginTop: 20,
  },
  openItemAddBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  // Transfer
  stepLabel: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 16 },
  hintText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  backRowText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  transferTypeCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 14, borderWidth: 1.5, marginBottom: 12,
  },
  transferTypeIcon: {
    width: 46, height: 46, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  transferTypeTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
  transferTypeSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  transferKotLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase", letterSpacing: 0.5,
    marginBottom: 8,
  },
  tablePickerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pickerChip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5,
    minWidth: 80, alignItems: "center",
  },
  pickerChipText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  pickerChipSub: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2, textTransform: "capitalize" },
  itemPickerRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 8,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  itemPickerEmoji: { fontSize: 22 },
  itemPickerName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemPickerMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  transferSummary: {
    borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 4, gap: 12,
  },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  transferRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
  },
  transferChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  transferChipText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
