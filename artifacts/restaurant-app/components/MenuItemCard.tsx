import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MenuItem } from "@/context/RestaurantContext";

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.left}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <View style={styles.text}>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {item.name}
          </Text>
          <Text
            style={[styles.description, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {item.description}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.price, { color: colors.foreground }]}>
          ${item.price.toFixed(2)}
        </Text>
        <TouchableOpacity
          onPress={() => onAdd(item)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  emoji: {
    fontSize: 28,
    width: 36,
    textAlign: "center",
  },
  text: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  right: {
    alignItems: "flex-end",
    gap: 8,
    marginLeft: 10,
  },
  price: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
