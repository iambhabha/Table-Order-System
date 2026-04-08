import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

export type OrderStatus = "pending" | "preparing" | "ready" | "served" | "paid";

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  emoji: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
  status: OrderStatus;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  serverName: string;
  guestCount: number;
  customerMobile: string;
}

export interface Table {
  id: string;
  number: number;
  customLabel: string;
  capacity: number;
  status: TableStatus;
  currentOrderId: string | null;
  location: string;
  isCustom: boolean;
}

interface RestaurantContextType {
  tables: Table[];
  orders: Order[];
  menu: MenuItem[];
  getTable: (id: string) => Table | undefined;
  getOrder: (id: string) => Order | undefined;
  getTableOrder: (tableId: string) => Order | undefined;
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  createOrder: (
    tableId: string,
    serverName: string,
    guestCount: number,
    customerMobile: string
  ) => Order;
  addItemToOrder: (orderId: string, item: MenuItem, notes?: string) => void;
  removeItemFromOrder: (orderId: string, itemIndex: number) => void;
  updateItemQuantity: (
    orderId: string,
    itemIndex: number,
    quantity: number
  ) => void;
  updateItemStatus: (
    orderId: string,
    itemIndex: number,
    status: OrderStatus
  ) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  closeTable: (tableId: string) => void;
  getTotalAmount: (orderId: string) => number;
  completedOrders: Order[];
  transferOrder: (fromTableId: string, toTableId: string) => void;
  addTable: (label: string, capacity: number, location: string) => Table;
  removeTable: (tableId: string) => void;
  getTableDisplayName: (table: Table) => string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: "m1", name: "Caesar Salad", category: "Starters", price: 12.5, description: "Romaine lettuce, croutons, parmesan", emoji: "🥗" },
  { id: "m2", name: "Bruschetta", category: "Starters", price: 9.0, description: "Tomato, basil, garlic on grilled bread", emoji: "🍞" },
  { id: "m3", name: "Soup of the Day", category: "Starters", price: 8.5, description: "Chef's daily creation", emoji: "🍲" },
  { id: "m4", name: "Grilled Salmon", category: "Mains", price: 28.0, description: "Atlantic salmon with lemon butter sauce", emoji: "🐟" },
  { id: "m5", name: "Ribeye Steak", category: "Mains", price: 42.0, description: "12oz USDA Prime, choice of sides", emoji: "🥩" },
  { id: "m6", name: "Pasta Carbonara", category: "Mains", price: 18.5, description: "Spaghetti, pancetta, egg, parmesan", emoji: "🍝" },
  { id: "m7", name: "Margherita Pizza", category: "Mains", price: 16.0, description: "San Marzano tomato, buffalo mozzarella", emoji: "🍕" },
  { id: "m8", name: "Chicken Piccata", category: "Mains", price: 24.0, description: "Pan-seared chicken with capers & lemon", emoji: "🍗" },
  { id: "m9", name: "Tiramisu", category: "Desserts", price: 9.5, description: "Classic Italian dessert", emoji: "☕" },
  { id: "m10", name: "Chocolate Lava Cake", category: "Desserts", price: 10.5, description: "Warm chocolate cake, vanilla ice cream", emoji: "🍫" },
  { id: "m11", name: "Sparkling Water", category: "Drinks", price: 4.0, description: "San Pellegrino 750ml", emoji: "💧" },
  { id: "m12", name: "House Wine", category: "Drinks", price: 9.0, description: "Red or White, 175ml glass", emoji: "🍷" },
  { id: "m13", name: "Craft Beer", category: "Drinks", price: 7.5, description: "Local IPA on tap", emoji: "🍺" },
  { id: "m14", name: "Espresso", category: "Drinks", price: 3.5, description: "Double shot", emoji: "☕" },
];

const INITIAL_TABLES: Table[] = [
  { id: "t1", number: 1, customLabel: "", capacity: 2, status: "available", currentOrderId: null, location: "Window", isCustom: false },
  { id: "t2", number: 2, customLabel: "", capacity: 4, status: "available", currentOrderId: null, location: "Window", isCustom: false },
  { id: "t3", number: 3, customLabel: "", capacity: 4, status: "available", currentOrderId: null, location: "Center", isCustom: false },
  { id: "t4", number: 4, customLabel: "", capacity: 6, status: "available", currentOrderId: null, location: "Center", isCustom: false },
  { id: "t5", number: 5, customLabel: "", capacity: 2, status: "available", currentOrderId: null, location: "Bar", isCustom: false },
  { id: "t6", number: 6, customLabel: "", capacity: 8, status: "available", currentOrderId: null, location: "Private", isCustom: false },
  { id: "t7", number: 7, customLabel: "", capacity: 4, status: "available", currentOrderId: null, location: "Patio", isCustom: false },
  { id: "t8", number: 8, customLabel: "", capacity: 4, status: "available", currentOrderId: null, location: "Patio", isCustom: false },
  { id: "t9", number: 9, customLabel: "", capacity: 2, status: "available", currentOrderId: null, location: "Bar", isCustom: false },
  { id: "t10", number: 10, customLabel: "", capacity: 6, status: "available", currentOrderId: null, location: "Center", isCustom: false },
];

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedTables, storedOrders] = await Promise.all([
          AsyncStorage.getItem("restaurant_tables_v2"),
          AsyncStorage.getItem("restaurant_orders_v2"),
        ]);
        if (storedTables) setTables(JSON.parse(storedTables));
        if (storedOrders) setOrders(JSON.parse(storedOrders));
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("restaurant_tables_v2", JSON.stringify(tables)).catch(() => {});
  }, [tables]);

  useEffect(() => {
    AsyncStorage.setItem("restaurant_orders_v2", JSON.stringify(orders)).catch(() => {});
  }, [orders]);

  const getTableDisplayName = useCallback((table: Table) => {
    if (table.customLabel) return table.customLabel;
    return `Table ${table.number}`;
  }, []);

  const getTable = useCallback(
    (id: string) => tables.find((t) => t.id === id),
    [tables]
  );

  const getOrder = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders]
  );

  const getTableOrder = useCallback(
    (tableId: string) => {
      const table = tables.find((t) => t.id === tableId);
      if (!table?.currentOrderId) return undefined;
      return orders.find((o) => o.id === table.currentOrderId);
    },
    [tables, orders]
  );

  const updateTableStatus = useCallback(
    (tableId: string, status: TableStatus) => {
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status } : t))
      );
    },
    []
  );

  const createOrder = useCallback(
    (tableId: string, serverName: string, guestCount: number, customerMobile: string): Order => {
      const order: Order = {
        id: generateId(),
        tableId,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "pending",
        serverName,
        guestCount,
        customerMobile,
      };
      setOrders((prev) => [...prev, order]);
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? { ...t, status: "occupied", currentOrderId: order.id }
            : t
        )
      );
      return order;
    },
    []
  );

  const transferOrder = useCallback((fromTableId: string, toTableId: string) => {
    const fromTable = tables.find((t) => t.id === fromTableId);
    if (!fromTable?.currentOrderId) return;
    const orderId = fromTable.currentOrderId;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === fromTableId) return { ...t, status: "cleaning" as TableStatus, currentOrderId: null };
        if (t.id === toTableId) return { ...t, status: "occupied" as TableStatus, currentOrderId: orderId };
        return t;
      })
    );
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, tableId: toTableId, updatedAt: new Date().toISOString() }
          : o
      )
    );
    setTimeout(() => {
      setTables((prev) =>
        prev.map((t) =>
          t.id === fromTableId && t.status === "cleaning"
            ? { ...t, status: "available" as TableStatus }
            : t
        )
      );
    }, 3000);
  }, [tables]);

  const addItemToOrder = useCallback(
    (orderId: string, item: MenuItem, notes = "") => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const existingIdx = o.items.findIndex(
            (i) => i.menuItem.id === item.id && i.notes === notes
          );
          if (existingIdx >= 0) {
            const newItems = [...o.items];
            newItems[existingIdx] = {
              ...newItems[existingIdx],
              quantity: newItems[existingIdx].quantity + 1,
            };
            return { ...o, items: newItems, updatedAt: new Date().toISOString() };
          }
          return {
            ...o,
            items: [
              ...o.items,
              { menuItem: item, quantity: 1, notes, status: "pending" as OrderStatus },
            ],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  const removeItemFromOrder = useCallback(
    (orderId: string, itemIndex: number) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const newItems = o.items.filter((_, i) => i !== itemIndex);
          return { ...o, items: newItems, updatedAt: new Date().toISOString() };
        })
      );
    },
    []
  );

  const updateItemQuantity = useCallback(
    (orderId: string, itemIndex: number, quantity: number) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          if (quantity <= 0) {
            const newItems = o.items.filter((_, i) => i !== itemIndex);
            return { ...o, items: newItems, updatedAt: new Date().toISOString() };
          }
          const newItems = o.items.map((item, i) =>
            i === itemIndex ? { ...item, quantity } : item
          );
          return { ...o, items: newItems, updatedAt: new Date().toISOString() };
        })
      );
    },
    []
  );

  const updateItemStatus = useCallback(
    (orderId: string, itemIndex: number, status: OrderStatus) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const newItems = o.items.map((item, i) =>
            i === itemIndex ? { ...item, status } : item
          );
          return { ...o, items: newItems, updatedAt: new Date().toISOString() };
        })
      );
    },
    []
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status, updatedAt: new Date().toISOString() }
            : o
        )
      );
    },
    []
  );

  const closeTable = useCallback((tableId: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, status: "cleaning" as TableStatus, currentOrderId: null }
          : t
      )
    );
    setTimeout(() => {
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId ? { ...t, status: "available" as TableStatus } : t
        )
      );
    }, 3000);
  }, []);

  const getTotalAmount = useCallback(
    (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return 0;
      return order.items.reduce(
        (sum, item) => sum + item.menuItem.price * item.quantity,
        0
      );
    },
    [orders]
  );

  const addTable = useCallback((label: string, capacity: number, location: string): Table => {
    const newTable: Table = {
      id: generateId(),
      number: 0,
      customLabel: label,
      capacity,
      status: "available",
      currentOrderId: null,
      location,
      isCustom: true,
    };
    setTables((prev) => [...prev, newTable]);
    return newTable;
  }, []);

  const removeTable = useCallback((tableId: string) => {
    setTables((prev) => {
      const table = prev.find((t) => t.id === tableId);
      if (!table || table.status === "occupied") return prev;
      return prev.filter((t) => t.id !== tableId);
    });
  }, []);

  const completedOrders = orders.filter((o) => o.status === "paid");

  return (
    <RestaurantContext.Provider
      value={{
        tables,
        orders,
        menu: MENU_ITEMS,
        getTable,
        getOrder,
        getTableOrder,
        updateTableStatus,
        createOrder,
        addItemToOrder,
        removeItemFromOrder,
        updateItemQuantity,
        updateItemStatus,
        updateOrderStatus,
        closeTable,
        getTotalAmount,
        completedOrders,
        transferOrder,
        addTable,
        removeTable,
        getTableDisplayName,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error("useRestaurant must be used within RestaurantProvider");
  return ctx;
}
