import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { PremiumMannequinPreview, type MannequinType } from "@/components/premium-mannequin-preview";
import { TABLET_MIN_WIDTH } from "@/constants/layout";
import {
  type ClosetCategory,
} from "@/constants/starter-wardrobe";
import {
  DEFAULT_CLOSET_ID,
  DEFAULT_LOCKER_SCOPE,
  getOutfits,
  getWardrobeItems,
  LOCAL_STARTER_WARDROBE,
  removeOutfit as removeStoredOutfit,
  saveOutfit as saveStoredOutfit,
  updateWardrobeItem,
  type Outfit as SavedOutfit,
  type OutfitSelection,
  type OutfitSlotKey,
  type WardrobeItem,
} from "@/services/my-locker";

type SlotDefinition = {
  key: OutfitSlotKey;
  label: string;
  category: ClosetCategory;
  placeholder: string;
};

type OutfitBuilderProps = {
  onAddClothing: () => void;
  onWardrobeCountChange?: (count: number) => void;
};

const slots: SlotDefinition[] = [
  { key: "top", label: "Top", category: "Shirts", placeholder: "👕" },
  { key: "jacket", label: "Jacket", category: "Jackets", placeholder: "🧥" },
  { key: "bottom", label: "Bottom", category: "Pants", placeholder: "👖" },
  { key: "shoes", label: "Shoes", category: "Shoes", placeholder: "👟" },
  { key: "accessory", label: "Accessory", category: "Accessories", placeholder: "⌚" },
];
const leftSlots = slots.filter((slot) => ["top", "bottom", "shoes"].includes(slot.key));
const rightSlots = slots.filter((slot) => ["jacket", "accessory"].includes(slot.key));
type ClosetFilter = ClosetCategory | "Favorites";
const closetFilters: ClosetFilter[] = [
  "Shirts",
  "Pants",
  "Shoes",
  "Jackets",
  "Accessories",
  "Favorites",
];

const emptySelection = (): OutfitSelection => ({
  top: null,
  jacket: null,
  bottom: null,
  shoes: null,
  accessory: null,
});

function ClothingCarouselCard({
  item,
  selected,
  onSelect,
  onToggleFavorite,
}: {
  item: WardrobeItem;
  selected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withTiming(selected ? 1.025 : 1, { duration: 170 });
  }, [scale, selected]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.closetCard, selected && styles.closetCardSelected, animatedStyle]}>
      <Pressable onPress={onSelect} style={({ pressed }) => [styles.closetMain, pressed && styles.pressed]}>
        <View style={styles.closetVisual}><Text style={styles.closetVisualText}>{item.thumbnail}</Text></View>
        <Text style={styles.closetBrand}>{item.brand}</Text>
        <Text numberOfLines={2} style={styles.closetItemName}>{item.name}</Text>
      </Pressable>
      <Pressable onPress={onToggleFavorite} style={styles.closetFavorite}>
        <Text style={styles.favoriteIcon}>{item.favorite ? "★" : "☆"}</Text>
      </Pressable>
      {selected && <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>✓</Text></View>}
    </Animated.View>
  );
}

export function OutfitBuilder({ onAddClothing, onWardrobeCountChange }: OutfitBuilderProps) {
  const { width } = useWindowDimensions();
  const isWideLayout = width >= TABLET_MIN_WIDTH;
  const [activeSlot, setActiveSlot] = useState<SlotDefinition | null>(null);
  const [activeClosetFilter, setActiveClosetFilter] = useState<ClosetFilter>("Shirts");
  const [bannerVisible, setBannerVisible] = useState(true);
  const [helpVisible, setHelpVisible] = useState(false);
  const [outfitName, setOutfitName] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [mannequinType, setMannequinType] = useState<MannequinType>("male");
  const [selection, setSelection] = useState<OutfitSelection>(() => ({
    ...emptySelection(),
    top: LOCAL_STARTER_WARDROBE.find((item) => item.id === "sample-shirt-black-polo") ?? null,
    bottom: LOCAL_STARTER_WARDROBE.find((item) => item.id === "sample-pants-blue-jeans") ?? null,
  }));
  const [resetSelection, setResetSelection] = useState<OutfitSelection>(emptySelection);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [wardrobeReady, setWardrobeReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function restoreLockerData() {
      try {
        const [wardrobeResult, outfitsResult] = await Promise.all([
          getWardrobeItems(),
          getOutfits(),
        ]);
        if (!isMounted) return;
        setWardrobe(wardrobeResult.data ?? []);
        setSavedOutfits(outfitsResult.data ?? []);
      } catch (error) {
        console.warn("Unable to restore outfit builder data", error);
      } finally {
        if (isMounted) setWardrobeReady(true);
      }
    }

    restoreLockerData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (wardrobeReady) onWardrobeCountChange?.(wardrobe.length);
  }, [onWardrobeCountChange, wardrobe.length, wardrobeReady]);

  const matchingItems = useMemo(
    () => wardrobe.filter((item) => item.category === activeSlot?.category),
    [activeSlot, wardrobe],
  );
  const hasSelectedItems = Object.values(selection).some(Boolean);
  const hasSampleItems = wardrobe.some((item) => item.isSample);
  const filteredClosetItems = useMemo(
    () =>
      activeClosetFilter === "Favorites"
        ? wardrobe.filter((item) => item.favorite)
        : wardrobe.filter((item) => item.category === activeClosetFilter),
    [activeClosetFilter, wardrobe],
  );
  const selectedIds = useMemo(
    () => new Set(Object.values(selection).filter(Boolean).map((item) => item!.id)),
    [selection],
  );
  const mostWornColor = useMemo(() => {
    const counts = wardrobe.reduce<Record<string, number>>((result, item) => {
      result[item.primaryColor] = (result[item.primaryColor] ?? 0) + 1;
      return result;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  }, [wardrobe]);
  const favoriteBrand = wardrobe.find((item) => item.favorite)?.brand ?? wardrobe[0]?.brand ?? "—";

  const selectItem = (item: WardrobeItem) => {
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
    setSelection(emptySelection());
    setOutfitName("");
    setSaveMessage("");
  };

  const shuffleOutfit = () => {
    const nextSelection = emptySelection();
    slots.forEach((slot) => {
      const options = wardrobe.filter((item) => item.category === slot.category);
      if (options.length > 0) {
        nextSelection[slot.key] = options[Math.floor(Math.random() * options.length)];
      }
    });
    setSelection(nextSelection);
    setSaveMessage("");
  };

  const resetOutfit = () => {
    setSelection({ ...resetSelection });
    setOutfitName("");
    setSaveMessage("");
  };

  const toggleFavorite = (itemId: string) => {
    const item = wardrobe.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const updated = { ...item, favorite: !item.favorite };
    setWardrobe((current) => current.map((candidate) => candidate.id === itemId ? updated : candidate));
    void updateWardrobeItem(updated).then((result) => {
      if (result.data) setWardrobe(result.data);
    });
  };

  const saveOutfit = async () => {
    if (!hasSelectedItems) return;
    const savedOutfit: SavedOutfit = {
      createdAt: new Date().toISOString(),
      id: `${Date.now()}`,
      name: outfitName.trim() || "Untitled Outfit",
      items: { ...selection },
      userId: DEFAULT_LOCKER_SCOPE.userId,
      closetId: DEFAULT_CLOSET_ID,
      mannequinType,
      updatedAt: new Date().toISOString(),
    };
    const nextOutfits = [savedOutfit, ...savedOutfits];
    setSavedOutfits(nextOutfits);
    setOutfitName("");
    setSaveMessage(`“${savedOutfit.name}” saved successfully.`);
    const result = await saveStoredOutfit(savedOutfit);
    if (result.data) setSavedOutfits(result.data);
  };

  const deleteOutfit = async (outfitId: string) => {
    const nextOutfits = savedOutfits.filter((outfit) => outfit.id !== outfitId);
    setSavedOutfits(nextOutfits);
    const result = await removeStoredOutfit(outfitId);
    if (result.data) setSavedOutfits(result.data);
  };

  const loadOutfit = (outfit: SavedOutfit) => {
    setSelection({ ...outfit.items });
    setResetSelection({ ...outfit.items });
    setOutfitName(outfit.name);
    setSaveMessage(`“${outfit.name}” loaded.`);
  };

  const selectClosetItem = (item: WardrobeItem) => {
    const slotKey: OutfitSlotKey =
      item.category === "Shirts"
        ? "top"
        : item.category === "Pants"
          ? "bottom"
          : item.category === "Shoes"
            ? "shoes"
            : item.category === "Jackets"
              ? "jacket"
              : "accessory";
    setSelection((current) => ({ ...current, [slotKey]: item }));
    setSaveMessage(`${item.name} added to ${slots.find((slot) => slot.key === slotKey)?.label}.`);
  };

  const openAddClothing = () => {
    setActiveSlot(null);
    onAddClothing();
  };

  const renderSlotCard = (slot: SlotDefinition) => {
    const item = selection[slot.key];
    return (
      <View key={slot.key} style={styles.slotCard}>
        <Pressable onPress={() => setActiveSlot(slot)} style={({ pressed }) => pressed && styles.pressed}>
        <View style={styles.slotCardTopRow}>
          <Text style={styles.slotLabel}>{slot.placeholder} {slot.label}</Text>
          <Text style={styles.slotChevron}>›</Text>
        </View>
        <View style={styles.slotItemRow}>
          <View style={styles.slotThumbnail}>
            <Text style={styles.slotThumbnailText}>{item?.thumbnail ?? slot.placeholder}</Text>
          </View>
          <Text numberOfLines={2} style={styles.slotValue}>{item?.name ?? "Choose an item"}</Text>
        </View>
          <Text style={styles.slotActionText}>{item ? "Replace" : "Choose"}</Text>
        </Pressable>
        {item && (
          <Pressable onPress={() => setSelection((current) => ({ ...current, [slot.key]: null }))} style={styles.removeAction}>
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.section}>
      {hasSampleItems && bannerVisible && (
        <View style={styles.sampleBadge}>
          <View style={styles.sampleBadgeContent}>
            <Text style={styles.sampleBadgeTitle}>Development Starter Wardrobe</Text>
            <Text style={styles.sampleBadgeText}>Sample clothing items are loaded so you can explore features.</Text>
            <Text style={styles.sampleBadgeText}>Add your own items anytime!</Text>
          </View>
          <Pressable onPress={() => setBannerVisible(false)} style={({ pressed }) => pressed && styles.pressed}>
            <Text style={styles.dismissText}>×</Text>
          </Pressable>
        </View>
      )}

      <Animated.View entering={FadeIn.duration(220)} style={styles.builderCard}>
        <View style={styles.builderHeader}>
          <View style={styles.builderHeaderText}>
            <Text style={styles.sectionTitle}>👤 Outfit Builder</Text>
            <Text style={styles.sectionSubtitle}>Create, mix, and save outfits from your closet.</Text>
          </View>
          <Pressable onPress={() => setHelpVisible((current) => !current)} style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}>
            <Text style={styles.helpButtonText}>How it works</Text>
          </Pressable>
        </View>
        {helpVisible && (
          <Text style={styles.helpText}>Choose pieces around the mannequin, shuffle for inspiration, then name and save your outfit.</Text>
        )}

        <View style={[styles.builderLayout, !isWideLayout && styles.builderLayoutMobile]}>
          <View style={styles.mannequinColumn}>
            <PremiumMannequinPreview mannequinType={mannequinType} onMannequinTypeChange={setMannequinType} />
          </View>
          <View style={styles.lookPanel}>
            <Text style={styles.panelEyebrow}>CURRENT OUTFIT</Text>
            <Text style={styles.panelTitle}>Current Look</Text>
            <View style={styles.currentLookGrid}>
              {(["top", "bottom", "shoes"] as OutfitSlotKey[]).map((key) => (
                <Pressable key={key} onPress={() => setActiveSlot(slots.find((slot) => slot.key === key) ?? null)} style={({ pressed }) => [styles.currentLookItem, pressed && styles.pressed]}>
                  <Text style={styles.currentLookLabel}>{slots.find((slot) => slot.key === key)?.label}</Text>
                  <Text numberOfLines={1} style={styles.currentLookValue}>{selection[key]?.name ?? "Not selected"}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              maxLength={60}
              onChangeText={setOutfitName}
              placeholder="Name this look…"
              placeholderTextColor="#64748b"
              selectionColor="#69E08C"
              style={styles.nameInput}
              value={outfitName}
            />
            <View style={styles.controls}>
              <Pressable disabled={!hasSelectedItems} onPress={saveOutfit} style={({ pressed }) => [styles.saveButton, !hasSelectedItems && styles.disabled, pressed && styles.pressed]}>
                <Text style={styles.saveButtonText}>Save Look</Text>
              </Pressable>
              <Pressable onPress={shuffleOutfit} style={({ pressed }) => [styles.randomButton, pressed && styles.pressed]}>
                <Text style={styles.randomButtonText}>Randomize Outfit</Text>
              </Pressable>
              <Pressable onPress={clearOutfit} style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
            </View>
            {saveMessage ? <Text style={styles.successText}>{saveMessage}</Text> : null}
          </View>
        </View>

        <View style={styles.clothingSection}>
          <View style={styles.closetHeader}>
            <View><Text style={styles.clothingTitle}>Choose a piece</Text><Text style={styles.sectionSubtitle}>{wardrobe.length} items ready to style</Text></View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent} style={styles.filterScroll}>
            {closetFilters.map((filter) => (
              <Pressable key={filter} onPress={() => setActiveClosetFilter(filter)} style={[styles.filterButton, activeClosetFilter === filter && styles.filterButtonActive]}>
                <Text style={[styles.filterText, activeClosetFilter === filter && styles.filterTextActive]}>{({ Shirts: "Tops", Pants: "Bottoms", Shoes: "Shoes", Jackets: "Outerwear", Accessories: "Accessories", Favorites: "Favorites" } as Record<string, string>)[filter]}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {filteredClosetItems.length === 0 ? (
            <View style={styles.categoryEmpty}><Text style={styles.categoryEmptyText}>{activeClosetFilter === "Favorites" ? "Favorite clothing will appear here." : "No clothing in this category yet."}</Text></View>
          ) : (
            <ScrollView horizontal contentContainerStyle={styles.closetCarousel} showsHorizontalScrollIndicator={false}>
              {filteredClosetItems.map((item) => (
                <ClothingCarouselCard key={item.id} item={item} selected={selectedIds.has(item.id)} onSelect={() => selectClosetItem(item)} onToggleFavorite={() => toggleFavorite(item.id)} />
              ))}
            </ScrollView>
          )}
        </View>
      </Animated.View>

      <Text style={styles.savedTitle}>Saved Looks</Text>
      {savedOutfits.length === 0 ? (
        <View style={styles.savedEmptyCard}>
          <Text style={styles.savedEmptyTitle}>No saved looks yet.</Text>
          <Text style={styles.savedEmptyText}>Your saved combinations will appear here.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedGrid}>
        {savedOutfits.map((outfit) => (
          <View key={outfit.id} style={[styles.savedOutfitCard, isWideLayout && styles.savedOutfitCardWide]}>
            <Text style={styles.savedOutfitName}>{outfit.name}</Text>
            <Text style={styles.savedDate}>{outfit.createdAt ? new Date(outfit.createdAt).toLocaleDateString() : "Previously saved"}</Text>
            <View style={styles.savedThumbnails}>
              {slots.map((slot) => (
                <View key={slot.key} style={styles.savedThumbnail}>
                  <Text style={styles.savedThumbnailText}>{outfit.items[slot.key]?.thumbnail ?? slot.placeholder}</Text>
                </View>
              ))}
            </View>
            <View style={styles.savedActions}>
              <Pressable onPress={() => loadOutfit(outfit)} style={({ pressed }) => [styles.loadButton, pressed && styles.pressed]}>
                <Text style={styles.loadButtonText}>Load Outfit</Text>
              </Pressable>
              <Pressable onPress={() => deleteOutfit(outfit.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
        </ScrollView>
      )}

      <View style={styles.insightsCard}>
        <Text style={styles.savedTitle}>Style Insights</Text>
        <View style={styles.insightsRow}>
          <View style={styles.insight}><Text style={styles.insightLabel}>Most worn color</Text><Text style={styles.insightValue}>{mostWornColor}</Text></View>
          <View style={styles.insight}><Text style={styles.insightLabel}>Favorite brand</Text><Text style={styles.insightValue}>{favoriteBrand}</Text></View>
          <View style={styles.insight}><Text style={styles.insightLabel}>Recent look</Text><Text numberOfLines={1} style={styles.insightValue}>{savedOutfits[0]?.name ?? "No saved look"}</Text></View>
        </View>
      </View>

      <View style={styles.comingSoonSection}>
        <Text style={styles.savedTitle}>Coming Soon</Text>
        <Text style={styles.comingSoonCopy}>A preview of what is next for your wardrobe.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.comingSoonRow}>
          {[
            ["✦", "AI Stylist"],
            ["☁", "Weather Outfit Suggestions"],
            ["⌁", "Smart Shopping"],
            ["▥", "Wardrobe Analytics"],
            ["★", "Outfit Rating"],
          ].map(([icon, title]) => (
            <View key={title} style={styles.comingSoonCard}>
              <View style={styles.comingSoonIcon}><Text style={styles.comingSoonIconText}>{icon}</Text></View>
              <Text style={styles.comingSoonTitle}>{title}</Text>
              <Text style={styles.comingSoonLabel}>COMING SOON</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <Modal animationType="fade" onRequestClose={() => setActiveSlot(null)} transparent visible={activeSlot !== null}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose {activeSlot?.label}</Text>
            <ScrollView style={styles.itemList}>
              {matchingItems.length === 0 ? (
                <Text style={styles.noItemsText}>No items available in this category yet.</Text>
              ) : (
                matchingItems.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <Pressable onPress={() => selectItem(item)} style={({ pressed }) => [styles.itemMain, pressed && styles.pressed]}>
                      <Text style={styles.itemIcon}>{item.thumbnail}</Text>
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemMeta}>{item.primaryColor} · {item.brand}</Text>
                        {item.isSample && <Text style={styles.sampleItemText}>Sample item</Text>}
                      </View>
                    </Pressable>
                    <Pressable onPress={() => toggleFavorite(item.id)} style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}>
                      <Text style={styles.favoriteIcon}>{item.favorite ? "★" : "☆"}</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
            <Pressable onPress={openAddClothing} style={({ pressed }) => [styles.addClothingButton, pressed && styles.pressed]}>
              <Text style={styles.addClothingText}>Add Clothing</Text>
            </Pressable>
            <Pressable onPress={clearActiveSlot} style={({ pressed }) => [styles.clearSelectionButton, pressed && styles.pressed]}>
              <Text style={styles.clearSelectionText}>Clear Selection</Text>
            </Pressable>
            <Pressable onPress={() => setActiveSlot(null)} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  sectionTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 6 },
  sectionSubtitle: { color: "#94a3b8", fontSize: 14, marginBottom: 12 },
  sampleBadge: { alignItems: "flex-start", backgroundColor: "rgba(37,99,235,0.12)", borderColor: "rgba(139,92,246,0.28)", borderRadius: 14, borderWidth: 1, flexDirection: "row", marginBottom: 14, padding: 14 },
  sampleBadgeContent: { flex: 1 },
  sampleBadgeTitle: { color: "#7dd3fc", fontSize: 13, fontWeight: "bold" },
  sampleBadgeText: { color: "#94a3b8", fontSize: 12, marginTop: 3 },
  dismissText: { color: "#c4b5fd", fontSize: 24, lineHeight: 24, marginLeft: 12 },
  builderCard: { backgroundColor: "#0F1411", borderColor: "rgba(105,224,140,0.15)", borderRadius: 26, borderWidth: 1, padding: 22 },
  builderHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  builderHeaderText: { flex: 1, paddingRight: 12 },
  helpButton: { borderColor: "rgba(139,92,246,0.5)", borderRadius: 10, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  helpButtonText: { color: "#c4b5fd", fontSize: 12, fontWeight: "bold" },
  helpText: { backgroundColor: "rgba(139,92,246,0.09)", borderRadius: 10, color: "#cbd5e1", fontSize: 12, lineHeight: 18, marginBottom: 14, padding: 11 },
  builderLayout: { alignItems: "stretch", flexDirection: "row", gap: 22 },
  builderLayoutMobile: { flexDirection: "column" },
  sideColumn: { flex: 1, gap: 12, maxWidth: 220, minWidth: 170 },
  centerColumn: { alignItems: "center", flex: 1, maxWidth: 340, minWidth: 250 },
  mannequinColumn: { flex: 1.15, minWidth: 0 },
  lookPanel: { backgroundColor: "#151B17", borderColor: "rgba(255,255,255,0.075)", borderRadius: 22, borderWidth: 1, flex: 0.85, justifyContent: "center", maxWidth: 430, minWidth: 300, padding: 24 },
  panelEyebrow: { color: "#69E08C", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  panelTitle: { color: "#FFFFFF", fontSize: 25, fontWeight: "900", letterSpacing: -0.5, marginBottom: 16, marginTop: 6 },
  quickControls: { flexDirection: "row", gap: 10, justifyContent: "center", marginBottom: 12, marginTop: -4 },
  quickButton: { backgroundColor: "rgba(139,92,246,0.12)", borderColor: "rgba(139,92,246,0.35)", borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  quickButtonText: { color: "#c4b5fd", fontSize: 12, fontWeight: "bold" },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotCard: { backgroundColor: "rgba(30,41,59,0.92)", borderColor: "rgba(139,92,246,0.24)", borderRadius: 14, borderWidth: 1, flexBasis: "47%", flexGrow: 1, minWidth: 140, padding: 12 },
  slotCardTopRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  slotChevron: { color: "#60a5fa", fontSize: 24, lineHeight: 24 },
  slotItemRow: { alignItems: "center", flexDirection: "row", marginTop: 8 },
  slotThumbnail: { alignItems: "center", backgroundColor: "rgba(139,92,246,0.12)", borderRadius: 9, height: 38, justifyContent: "center", marginRight: 9, width: 38 },
  slotThumbnailText: { fontSize: 21 },
  slotLabel: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  slotValue: { color: "#cbd5e1", flex: 1, fontSize: 12 },
  slotActions: { flexDirection: "row", gap: 14, marginTop: 9 },
  removeAction: { alignSelf: "flex-start", marginTop: 9, paddingVertical: 3 },
  slotActionText: { color: "#38bdf8", fontSize: 12, fontWeight: "bold" },
  removeText: { color: "#fca5a5", fontSize: 12, fontWeight: "bold" },
  nameInput: { backgroundColor: "#0D120F", borderColor: "rgba(105,224,140,0.2)", borderRadius: 12, borderWidth: 1, color: "#fff", fontSize: 14, marginTop: 16, paddingHorizontal: 13, paddingVertical: 12 },
  controls: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 12 },
  saveButton: { alignItems: "center", backgroundColor: "#69E08C", borderRadius: 12, flexGrow: 1, minWidth: 105, paddingVertical: 13 },
  saveButtonText: { color: "#07120C", fontSize: 13, fontWeight: "900" },
  randomButton: { alignItems: "center", backgroundColor: "#202923", borderColor: "rgba(105,224,140,0.22)", borderRadius: 12, borderWidth: 1, flexGrow: 1, minWidth: 105, paddingVertical: 13 },
  randomButtonText: { color: "#BCECC9", fontSize: 13, fontWeight: "800" },
  clearButton: { alignItems: "center", borderColor: "rgba(148,163,184,0.28)", borderRadius: 12, borderWidth: 1, flexGrow: 1, minWidth: 80, paddingVertical: 13 },
  clearButtonText: { color: "#B8C5D6", fontSize: 14, fontWeight: "bold" },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  successText: { color: "#86efac", fontSize: 13, marginTop: 10, textAlign: "center" },
  currentLookGrid: { borderTopColor: "rgba(255,255,255,0.07)", borderTopWidth: 1 },
  currentLookItem: { borderBottomColor: "rgba(255,255,255,0.07)", borderBottomWidth: 1, paddingVertical: 14 },
  currentLookLabel: { color: "#7c8b81", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  currentLookValue: { color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 5 },
  savedTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 10, marginTop: 18 },
  savedEmptyCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 16 },
  savedEmptyTitle: { color: "#B8C5D6", fontSize: 15, fontWeight: "bold" },
  savedEmptyText: { color: "#64748b", fontSize: 13, marginTop: 4 },
  savedGrid: { gap: 14, paddingBottom: 4, paddingRight: 24 },
  savedOutfitCard: { backgroundColor: "#151B17", borderColor: "rgba(255,255,255,0.08)", borderRadius: 17, borderWidth: 1, padding: 16, width: 285 },
  savedOutfitCardWide: { flexBasis: "47%" },
  savedOutfitName: { color: "#fff", fontSize: 17, fontWeight: "bold", marginBottom: 8 },
  savedDate: { color: "#64748b", fontSize: 11, marginBottom: 10 },
  savedThumbnails: { flexDirection: "row", gap: 7 },
  savedThumbnail: { alignItems: "center", backgroundColor: "rgba(139,92,246,0.1)", borderRadius: 8, height: 34, justifyContent: "center", width: 34 },
  savedThumbnailText: { fontSize: 18 },
  savedOutfitItem: { color: "#B8C5D6", fontSize: 13, lineHeight: 20 },
  savedActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  loadButton: { alignItems: "center", backgroundColor: "#2563eb", borderRadius: 10, flex: 1, paddingVertical: 10 },
  loadButtonText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  deleteButton: { alignItems: "center", borderColor: "rgba(248,113,113,0.45)", borderRadius: 10, borderWidth: 1, flex: 1, paddingVertical: 10 },
  deleteButtonText: { color: "#fca5a5", fontSize: 13, fontWeight: "bold" },
  clothingSection: { borderTopColor: "rgba(255,255,255,0.07)", borderTopWidth: 1, marginTop: 26, paddingTop: 22 },
  clothingTitle: { color: "#FFFFFF", fontSize: 21, fontWeight: "900" },
  closetHeader: { flexDirection: "row", justifyContent: "space-between" },
  filterScroll: { marginBottom: 16 },
  filterContent: { gap: 8, paddingRight: 20 },
  filterButton: { borderColor: "rgba(148,163,184,0.25)", borderRadius: 999, borderWidth: 1, marginRight: 8, paddingHorizontal: 13, paddingVertical: 8 },
  filterButtonActive: { backgroundColor: "#22c55e", borderColor: "#4ade80" },
  filterText: { color: "#94a3b8", fontSize: 12, fontWeight: "bold" },
  filterTextActive: { color: "#fff" },
  closetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  closetCarousel: { gap: 14, paddingBottom: 8, paddingHorizontal: 4, paddingRight: 20 },
  closetCard: { backgroundColor: "#171E19", borderColor: "rgba(255,255,255,0.08)", borderRadius: 17, borderWidth: 1, height: 210, padding: 12, position: "relative", width: 168 },
  closetCardSelected: { borderColor: "#4ade80", borderWidth: 2 },
  closetMain: { flex: 1 },
  closetVisual: { alignItems: "center", backgroundColor: "#0C120E", borderRadius: 12, height: 104, justifyContent: "center", marginBottom: 10 },
  closetVisualText: { fontSize: 42 },
  closetBrand: { color: "#69E08C", fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginBottom: 5, textTransform: "uppercase" },
  closetItemName: { color: "#fff", fontSize: 13, fontWeight: "bold", paddingRight: 22 },
  closetItemMeta: { color: "#94a3b8", fontSize: 11, marginTop: 5 },
  closetFavorite: { alignItems: "center", backgroundColor: "rgba(15,20,17,0.88)", borderRadius: 14, height: 28, justifyContent: "center", position: "absolute", right: 8, top: 84, width: 28 },
  selectedBadge: { alignItems: "center", backgroundColor: "#22c55e", borderRadius: 12, height: 24, justifyContent: "center", position: "absolute", right: 8, top: 8, width: 24 },
  selectedBadgeText: { color: "#071109", fontSize: 13, fontWeight: "900" },
  categoryEmpty: { alignItems: "center", backgroundColor: "#131A15", borderRadius: 15, justifyContent: "center", minHeight: 110, padding: 20 },
  categoryEmptyText: { color: "#7E8982", fontSize: 13 },
  insightsCard: { backgroundColor: "#101713", borderColor: "rgba(74,222,128,0.16)", borderRadius: 20, borderWidth: 1, marginTop: 28, padding: 18 },
  insightsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  insight: { backgroundColor: "#171e19", borderRadius: 12, flexBasis: 180, flexGrow: 1, padding: 14 },
  insightLabel: { color: "#7c8b81", fontSize: 11, fontWeight: "700" },
  insightValue: { color: "#fff", fontSize: 15, fontWeight: "800", marginTop: 5 },
  comingSoonSection: { marginTop: 30 },
  comingSoonCopy: { color: "#748078", fontSize: 12, marginBottom: 14, marginTop: -4 },
  comingSoonRow: { gap: 12, paddingBottom: 4, paddingRight: 24 },
  comingSoonCard: { backgroundColor: "#121713", borderColor: "rgba(255,255,255,0.065)", borderRadius: 17, borderWidth: 1, height: 142, justifyContent: "space-between", opacity: 0.72, padding: 15, width: 190 },
  comingSoonIcon: { alignItems: "center", backgroundColor: "rgba(105,224,140,0.09)", borderRadius: 16, height: 32, justifyContent: "center", width: 32 },
  comingSoonIconText: { color: "#69E08C", fontSize: 14, fontWeight: "900" },
  comingSoonTitle: { color: "#DCE4DE", fontSize: 13, fontWeight: "800" },
  comingSoonLabel: { color: "#657069", fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  closetEmptyState: { backgroundColor: "rgba(37,99,235,0.1)", borderColor: "rgba(56,189,248,0.24)", borderRadius: 16, borderWidth: 1, padding: 18 },
  closetEmptyTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  closetEmptyText: { color: "#B8C5D6", fontSize: 14, lineHeight: 21 },
  modalBackdrop: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.76)", flex: 1, justifyContent: "center", padding: 22 },
  modalCard: { backgroundColor: "#1e293b", borderColor: "rgba(56,189,248,0.2)", borderRadius: 20, borderWidth: 1, maxHeight: "84%", maxWidth: 480, padding: 20, width: "100%" },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 14 },
  itemList: { maxHeight: 330 },
  noItemsText: { color: "#94a3b8", fontSize: 15, lineHeight: 22, paddingVertical: 18 },
  itemCard: { alignItems: "center", borderBottomColor: "rgba(255,255,255,0.08)", borderBottomWidth: 1, flexDirection: "row" },
  itemMain: { alignItems: "center", flex: 1, flexDirection: "row", paddingVertical: 12 },
  itemIcon: { fontSize: 28, marginRight: 12 },
  itemDetails: { flex: 1 },
  itemName: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  itemMeta: { color: "#94a3b8", fontSize: 12, marginTop: 3 },
  sampleItemText: { color: "#38bdf8", fontSize: 10, marginTop: 3 },
  favoriteButton: { padding: 12 },
  favoriteIcon: { color: "#facc15", fontSize: 25 },
  addClothingButton: { alignItems: "center", backgroundColor: "#2563eb", borderRadius: 12, marginTop: 14, paddingVertical: 12 },
  addClothingText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  clearSelectionButton: { alignItems: "center", borderColor: "rgba(56,189,248,0.35)", borderRadius: 12, borderWidth: 1, marginTop: 9, paddingVertical: 11 },
  clearSelectionText: { color: "#7dd3fc", fontSize: 14, fontWeight: "bold" },
  cancelButton: { alignItems: "center", marginTop: 5, paddingVertical: 11 },
  cancelText: { color: "#B8C5D6", fontSize: 14, fontWeight: "bold" },
});
