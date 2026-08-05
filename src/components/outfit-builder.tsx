import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type ClosetCategory = "Shirts" | "Pants" | "Shoes" | "Jackets" | "Accessories";
type OutfitSlotKey = "top" | "bottom" | "shoes" | "jacket" | "accessory";

type ClothingItem = {
  id: string;
  name: string;
  category: ClosetCategory;
  thumbnail?: string;
};

type OutfitSelection = Record<OutfitSlotKey, ClothingItem | null>;

type SavedOutfit = {
  id: string;
  name: string;
  items: OutfitSelection;
};

type SlotDefinition = {
  key: OutfitSlotKey;
  label: string;
  category: ClosetCategory;
  placeholder: string;
};

const SAVED_OUTFITS_STORAGE_KEY = "lookup.myLocker.savedOutfits";
const EMPTY_SELECTION: OutfitSelection = {
  top: null,
  bottom: null,
  shoes: null,
  jacket: null,
  accessory: null,
};

const slots: SlotDefinition[] = [
  { key: "top", label: "Top", category: "Shirts", placeholder: "👕" },
  { key: "bottom", label: "Bottom", category: "Pants", placeholder: "👖" },
  { key: "shoes", label: "Shoes", category: "Shoes", placeholder: "👟" },
  { key: "jacket", label: "Jacket", category: "Jackets", placeholder: "🧥" },
  { key: "accessory", label: "Accessory", category: "Accessories", placeholder: "⌚" },
];

// This will be populated by the closet data source when clothing creation is implemented.
const closetItems: ClothingItem[] = [];

function createEmptySelection(): OutfitSelection {
  return { ...EMPTY_SELECTION };
}

export function OutfitBuilder() {
  const [activeSlot, setActiveSlot] = useState<SlotDefinition | null>(null);
  const [outfitName, setOutfitName] = useState("");
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [selection, setSelection] = useState<OutfitSelection>(createEmptySelection);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(SAVED_OUTFITS_STORAGE_KEY)
      .then((storedOutfits) => {
        if (!isMounted || !storedOutfits) return;
        const parsed: unknown = JSON.parse(storedOutfits);
        if (Array.isArray(parsed)) setSavedOutfits(parsed as SavedOutfit[]);
      })
      .catch((error) => console.warn("Unable to load saved outfits", error));

    return () => {
      isMounted = false;
    };
  }, []);

  const matchingItems = useMemo(
    () => closetItems.filter((item) => item.category === activeSlot?.category),
    [activeSlot],
  );
  const hasSelectedItems = Object.values(selection).some(Boolean);

  const selectItem = (item: ClothingItem) => {
    if (!activeSlot) return;
    setSelection((current) => ({ ...current, [activeSlot.key]: item }));
    setActiveSlot(null);
  };

  const clearActiveSlot = () => {
    if (!activeSlot) return;
    setSelection((current) => ({ ...current, [activeSlot.key]: null }));
    setActiveSlot(null);
  };

  const clearOutfit = () => {
    setSelection(createEmptySelection());
    setOutfitName("");
  };

  const saveOutfit = async () => {
    if (!hasSelectedItems) return;

    const savedOutfit: SavedOutfit = {
      id: `${Date.now()}`,
      name: outfitName.trim() || `Outfit ${savedOutfits.length + 1}`,
      items: { ...selection },
    };
    const nextOutfits = [savedOutfit, ...savedOutfits];
    setSavedOutfits(nextOutfits);
    clearOutfit();

    try {
      await AsyncStorage.setItem(SAVED_OUTFITS_STORAGE_KEY, JSON.stringify(nextOutfits));
    } catch (error) {
      console.warn("Unable to save outfit", error);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👤 Outfit Builder</Text>
      <Text style={styles.sectionSubtitle}>Build a look from items in your digital closet.</Text>

      <View style={styles.builderCard}>
        <View style={styles.mannequinStage}>
          <View style={styles.mannequinHead} />
          <View style={styles.mannequinBody}>
            <View style={styles.mannequinArmLeft} />
            <View style={styles.mannequinTorso} />
            <View style={styles.mannequinArmRight} />
          </View>
          <View style={styles.mannequinLegs}>
            <View style={styles.mannequinLeg} />
            <View style={styles.mannequinLeg} />
          </View>

          {slots.map((slot) => {
            const item = selection[slot.key];
            if (!item) return null;
            return (
              <View key={slot.key} style={[styles.mannequinItem, styles[`${slot.key}Item`]]}>
                <Text style={styles.mannequinItemIcon}>{item.thumbnail ?? slot.placeholder}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.slotGrid}>
          {slots.map((slot) => {
            const item = selection[slot.key];
            return (
              <Pressable
                accessibilityRole="button"
                key={slot.key}
                onPress={() => setActiveSlot(slot)}
                style={({ pressed }) => [styles.slotCard, pressed && styles.pressed]}>
                <Text style={styles.slotLabel}>{slot.placeholder} {slot.label}</Text>
                <Text numberOfLines={1} style={styles.slotValue}>
                  {item?.name ?? "Choose an item"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          maxLength={60}
          onChangeText={setOutfitName}
          placeholder="Name this outfit…"
          placeholderTextColor="#64748b"
          selectionColor="#38bdf8"
          style={styles.nameInput}
          value={outfitName}
        />

        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            disabled={!hasSelectedItems}
            onPress={saveOutfit}
            style={({ pressed }) => [
              styles.saveButton,
              !hasSelectedItems && styles.disabledButton,
              pressed && hasSelectedItems && styles.pressed,
            ]}>
            <Text style={styles.saveButtonText}>Save Outfit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={clearOutfit}
            style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
            <Text style={styles.clearButtonText}>Clear Outfit</Text>
          </Pressable>
        </View>
        {!hasSelectedItems && (
          <Text style={styles.builderHint}>Add clothing to your closet, then choose an item for a slot.</Text>
        )}
      </View>

      <Text style={styles.savedTitle}>Saved Outfits</Text>
      {savedOutfits.length === 0 ? (
        <View style={styles.savedEmptyCard}>
          <Text style={styles.savedEmptyTitle}>No saved outfits yet.</Text>
          <Text style={styles.savedEmptyText}>Your saved combinations will appear here.</Text>
        </View>
      ) : (
        savedOutfits.map((outfit) => (
          <View key={outfit.id} style={styles.savedOutfitCard}>
            <Text style={styles.savedOutfitName}>{outfit.name}</Text>
            {slots.map((slot) => {
              const item = outfit.items[slot.key];
              if (!item) return null;
              return (
                <Text key={slot.key} style={styles.savedOutfitItem}>
                  {slot.placeholder} {slot.label}: {item.name}
                </Text>
              );
            })}
          </View>
        ))
      )}

      <Modal
        animationType="fade"
        onRequestClose={() => setActiveSlot(null)}
        transparent
        visible={activeSlot !== null}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose {activeSlot?.label}</Text>
            <ScrollView style={styles.itemList}>
              {matchingItems.length === 0 ? (
                <Text style={styles.noItemsText}>No items available in this category yet.</Text>
              ) : (
                matchingItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => selectItem(item)}
                    style={({ pressed }) => [styles.itemOption, pressed && styles.pressed]}>
                    <Text style={styles.itemOptionIcon}>{item.thumbnail ?? activeSlot?.placeholder}</Text>
                    <Text style={styles.itemOptionName}>{item.name}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              onPress={clearActiveSlot}
              style={({ pressed }) => [styles.clearSelectionButton, pressed && styles.pressed]}>
              <Text style={styles.clearSelectionText}>Clear selected item</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveSlot(null)}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const mannequinItemPositions = StyleSheet.create({
  topItem: { top: 72 },
  bottomItem: { top: 132 },
  shoesItem: { top: 215 },
  jacketItem: { right: 33, top: 93 },
  accessoryItem: { left: 35, top: 42 },
});

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  sectionTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 6 },
  sectionSubtitle: { color: "#94a3b8", fontSize: 14, marginBottom: 14 },
  builderCard: {
    backgroundColor: "#1e293b",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  mannequinStage: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(15,23,42,0.72)",
    borderColor: "rgba(56,189,248,0.16)",
    borderRadius: 22,
    borderWidth: 1,
    height: 270,
    justifyContent: "flex-start",
    marginBottom: 16,
    maxWidth: 300,
    paddingTop: 22,
    position: "relative",
    width: "100%",
  },
  mannequinHead: { backgroundColor: "#64748b", borderRadius: 24, height: 46, width: 46 },
  mannequinBody: { alignItems: "flex-start", flexDirection: "row", marginTop: 7 },
  mannequinArmLeft: {
    backgroundColor: "#475569",
    borderRadius: 10,
    height: 105,
    marginRight: 5,
    transform: [{ rotate: "8deg" }],
    width: 18,
  },
  mannequinTorso: { backgroundColor: "#64748b", borderRadius: 16, height: 112, width: 76 },
  mannequinArmRight: {
    backgroundColor: "#475569",
    borderRadius: 10,
    height: 105,
    marginLeft: 5,
    transform: [{ rotate: "-8deg" }],
    width: 18,
  },
  mannequinLegs: { flexDirection: "row", gap: 8, marginTop: -4 },
  mannequinLeg: { backgroundColor: "#475569", borderRadius: 10, height: 82, width: 25 },
  mannequinItem: {
    alignItems: "center",
    backgroundColor: "rgba(37,99,235,0.9)",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 54,
    position: "absolute",
  },
  ...mannequinItemPositions,
  mannequinItemIcon: { fontSize: 24 },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minWidth: 130,
    padding: 12,
  },
  slotLabel: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  slotValue: { color: "#94a3b8", fontSize: 12, marginTop: 5 },
  nameInput: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderColor: "rgba(56,189,248,0.28)",
    borderRadius: 12,
    borderWidth: 1,
    color: "#fff",
    fontSize: 15,
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  controls: { flexDirection: "row", gap: 10, marginTop: 12 },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    flex: 1,
    paddingVertical: 13,
  },
  saveButtonText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  clearButton: {
    alignItems: "center",
    borderColor: "rgba(148,163,184,0.42)",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 13,
  },
  clearButtonText: { color: "#B8C5D6", fontSize: 14, fontWeight: "bold" },
  disabledButton: { opacity: 0.42 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  builderHint: { color: "#64748b", fontSize: 12, marginTop: 10, textAlign: "center" },
  savedTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 10, marginTop: 18 },
  savedEmptyCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 16,
  },
  savedEmptyTitle: { color: "#B8C5D6", fontSize: 15, fontWeight: "bold" },
  savedEmptyText: { color: "#64748b", fontSize: 13, marginTop: 4 },
  savedOutfitCard: { backgroundColor: "#1e293b", borderRadius: 14, marginBottom: 10, padding: 16 },
  savedOutfitName: { color: "#fff", fontSize: 17, fontWeight: "bold", marginBottom: 8 },
  savedOutfitItem: { color: "#B8C5D6", fontSize: 13, lineHeight: 20 },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.76)",
    flex: 1,
    justifyContent: "center",
    padding: 22,
  },
  modalCard: {
    backgroundColor: "#1e293b",
    borderColor: "rgba(56,189,248,0.2)",
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: "80%",
    maxWidth: 440,
    padding: 20,
    width: "100%",
  },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  itemList: { maxHeight: 280 },
  noItemsText: { color: "#94a3b8", fontSize: 15, lineHeight: 22, paddingVertical: 18 },
  itemOption: { alignItems: "center", flexDirection: "row", paddingVertical: 12 },
  itemOptionIcon: { fontSize: 24, marginRight: 12 },
  itemOptionName: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  clearSelectionButton: {
    alignItems: "center",
    borderColor: "rgba(56,189,248,0.35)",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    paddingVertical: 12,
  },
  clearSelectionText: { color: "#7dd3fc", fontSize: 14, fontWeight: "bold" },
  cancelButton: { alignItems: "center", marginTop: 8, paddingVertical: 12 },
  cancelText: { color: "#B8C5D6", fontSize: 14, fontWeight: "bold" },
});
