import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image, type ImageSource } from "expo-image";
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
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import {
  type ClosetCategory,
  type ClothingItem,
  DEVELOPMENT_STARTER_WARDROBE,
} from "@/constants/starter-wardrobe";

type OutfitSlotKey = "top" | "jacket" | "bottom" | "shoes" | "accessory";
type OutfitSelection = Record<OutfitSlotKey, ClothingItem | null>;

type SavedOutfit = {
  createdAt?: string;
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

type OutfitBuilderProps = {
  onAddClothing: () => void;
  onWardrobeCountChange?: (count: number) => void;
};

const WARDROBE_STORAGE_KEY = "lookup.myLocker.wardrobe.v1";
const SAVED_OUTFITS_STORAGE_KEY = "lookup.myLocker.savedOutfits";
const slots: SlotDefinition[] = [
  { key: "top", label: "Top", category: "Shirts", placeholder: "👕" },
  { key: "jacket", label: "Jacket", category: "Jackets", placeholder: "🧥" },
  { key: "bottom", label: "Bottom", category: "Pants", placeholder: "👖" },
  { key: "shoes", label: "Shoes", category: "Shoes", placeholder: "👟" },
  { key: "accessory", label: "Accessory", category: "Accessories", placeholder: "⌚" },
];
const leftSlots = slots.filter((slot) => ["top", "bottom", "shoes"].includes(slot.key));
const rightSlots = slots.filter((slot) => ["jacket", "accessory"].includes(slot.key));
const closetFilters: Array<"All Items" | ClosetCategory> = [
  "All Items",
  "Shirts",
  "Pants",
  "Shoes",
  "Jackets",
  "Accessories",
];

const emptySelection = (): OutfitSelection => ({
  top: null,
  jacket: null,
  bottom: null,
  shoes: null,
  accessory: null,
});

const clothingColors: Record<string, string> = {
  Black: "#171717",
  Blue: "#2563eb",
  Brown: "#7c4a2d",
  Gray: "#64748b",
  Khaki: "#b6a06a",
  Navy: "#172554",
  Silver: "#cbd5e1",
  White: "#f8fafc",
};

const mannequinSource = require("@/assets/images/my-locker/prototype/mannequin-base.png");
const prototypeLayerSources: Record<string, ImageSource> = {
  "sample-shirt-white-tee": require("@/assets/images/my-locker/prototype/white-tee-layer.png"),
  "sample-shirt-black-polo": require("@/assets/images/my-locker/prototype/black-polo-layer.png"),
  "sample-pants-blue-jeans": require("@/assets/images/my-locker/prototype/blue-jeans-layer.png"),
  "sample-shoes-white-sneakers": require("@/assets/images/my-locker/prototype/white-sneakers-layer.png"),
  "sample-jacket-denim": require("@/assets/images/my-locker/prototype/denim-jacket-layer.png"),
  "sample-accessory-watch": require("@/assets/images/my-locker/prototype/silver-watch-layer.png"),
};

function PrototypeClothingLayer({
  item,
  slot,
  zIndex,
}: {
  item: ClothingItem;
  slot: OutfitSlotKey;
  zIndex: number;
}) {
  const source = prototypeLayerSources[item.id];
  if (!source) return <ClothingLayer item={item} slot={slot} />;

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)} style={[styles.prototypeCanvas, { zIndex }]}>
      <Image
        contentFit="contain"
        onError={() => console.warn(`Unable to load prototype clothing asset: ${item.name}`)}
        source={source}
        style={styles.prototypeCanvas}
      />
    </Animated.View>
  );
}

function ClothingLayer({ item, slot }: { item: ClothingItem; slot: OutfitSlotKey }) {
  const color = clothingColors[item.primaryColor] ?? "#2563eb";
  const animatedProps = { entering: FadeIn.duration(180), exiting: FadeOut.duration(140) };

  if (slot === "top") {
    return (
      <Animated.View {...animatedProps} style={styles.topLayer}>
        <View style={[styles.topSleeve, styles.topSleeveLeft, { backgroundColor: color }]} />
        <View style={[styles.topBody, { backgroundColor: color }]} />
        <View style={[styles.topSleeve, styles.topSleeveRight, { backgroundColor: color }]} />
      </Animated.View>
    );
  }

  if (slot === "jacket") {
    return (
      <Animated.View {...animatedProps} style={styles.jacketLayer}>
        <View style={[styles.jacketSleeve, styles.jacketSleeveLeft, { backgroundColor: color }]} />
        <View style={[styles.jacketBody, { borderColor: color }]}>
          <View style={[styles.jacketPanel, { backgroundColor: color }]} />
          <View style={[styles.jacketPanel, { backgroundColor: color }]} />
        </View>
        <View style={[styles.jacketSleeve, styles.jacketSleeveRight, { backgroundColor: color }]} />
      </Animated.View>
    );
  }

  if (slot === "bottom") {
    const isShorts = item.name.includes("Shorts");
    return (
      <Animated.View {...animatedProps} style={styles.bottomLayer}>
        <View style={[styles.waistband, { backgroundColor: color }]} />
        <View style={styles.pantLegRow}>
          <View style={[styles.pantLeg, isShorts && styles.shortLeg, { backgroundColor: color }]} />
          <View style={[styles.pantLeg, isShorts && styles.shortLeg, { backgroundColor: color }]} />
        </View>
      </Animated.View>
    );
  }

  if (slot === "shoes") {
    return (
      <Animated.View {...animatedProps} style={styles.shoesLayer}>
        <View style={[styles.shoe, styles.leftShoe, { backgroundColor: color }]} />
        <View style={[styles.shoe, styles.rightShoe, { backgroundColor: color }]} />
      </Animated.View>
    );
  }

  if (item.name.includes("Sunglasses")) {
    return (
      <Animated.View {...animatedProps} style={styles.glassesLayer}>
        <View style={styles.glassesLens} />
        <View style={styles.glassesBridge} />
        <View style={styles.glassesLens} />
      </Animated.View>
    );
  }

  if (item.name.includes("Cap")) {
    return (
      <Animated.View {...animatedProps} style={[styles.capLayer, { backgroundColor: color }]}>
        <View style={[styles.capBrim, { backgroundColor: color }]} />
      </Animated.View>
    );
  }

  if (item.name.includes("Belt")) {
    return (
      <Animated.View {...animatedProps} style={[styles.beltLayer, { backgroundColor: color }]}>
        <View style={styles.beltBuckle} />
      </Animated.View>
    );
  }

  return (
    <Animated.View {...animatedProps} style={styles.watchLayer}>
      <View style={[styles.watchBand, { backgroundColor: color }]} />
      <View style={styles.watchFace} />
    </Animated.View>
  );
}

export function OutfitBuilder({ onAddClothing, onWardrobeCountChange }: OutfitBuilderProps) {
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 900;
  const [activeSlot, setActiveSlot] = useState<SlotDefinition | null>(null);
  const [activeClosetFilter, setActiveClosetFilter] = useState<(typeof closetFilters)[number]>("All Items");
  const [bannerVisible, setBannerVisible] = useState(true);
  const [helpVisible, setHelpVisible] = useState(false);
  const [outfitName, setOutfitName] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [selection, setSelection] = useState<OutfitSelection>(emptySelection);
  const [resetSelection, setResetSelection] = useState<OutfitSelection>(emptySelection);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [wardrobeReady, setWardrobeReady] = useState(false);
  const [mannequinAssetFailed, setMannequinAssetFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function restoreLockerData() {
      try {
        const [storedWardrobe, storedOutfits] = await Promise.all([
          AsyncStorage.getItem(WARDROBE_STORAGE_KEY),
          AsyncStorage.getItem(SAVED_OUTFITS_STORAGE_KEY),
        ]);

        let nextWardrobe: ClothingItem[];
        if (storedWardrobe === null) {
          nextWardrobe = DEVELOPMENT_STARTER_WARDROBE;
          await AsyncStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(nextWardrobe));
        } else {
          const parsedWardrobe: unknown = JSON.parse(storedWardrobe);
          nextWardrobe = Array.isArray(parsedWardrobe) ? (parsedWardrobe as ClothingItem[]) : [];
        }

        const parsedOutfits: unknown = storedOutfits ? JSON.parse(storedOutfits) : [];
        if (!isMounted) return;
        setWardrobe(nextWardrobe);
        setSavedOutfits(Array.isArray(parsedOutfits) ? (parsedOutfits as SavedOutfit[]) : []);
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
      activeClosetFilter === "All Items"
        ? wardrobe
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
  const favoriteCategory = wardrobe.find((item) => item.favorite)?.category ?? wardrobe[0]?.category ?? "—";

  const persistWardrobe = async (nextWardrobe: ClothingItem[]) => {
    setWardrobe(nextWardrobe);
    try {
      await AsyncStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(nextWardrobe));
    } catch (error) {
      console.warn("Unable to save wardrobe", error);
    }
  };

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
    const nextWardrobe = wardrobe.map((item) =>
      item.id === itemId ? { ...item, favorite: !item.favorite } : item,
    );
    void persistWardrobe(nextWardrobe);
  };

  const saveOutfit = async () => {
    if (!hasSelectedItems) return;
    const savedOutfit: SavedOutfit = {
      createdAt: new Date().toISOString(),
      id: `${Date.now()}`,
      name: outfitName.trim() || "Untitled Outfit",
      items: { ...selection },
    };
    const nextOutfits = [savedOutfit, ...savedOutfits];
    setSavedOutfits(nextOutfits);
    setOutfitName("");
    setSaveMessage(`“${savedOutfit.name}” saved successfully.`);
    try {
      await AsyncStorage.setItem(SAVED_OUTFITS_STORAGE_KEY, JSON.stringify(nextOutfits));
    } catch (error) {
      console.warn("Unable to save outfit", error);
    }
  };

  const deleteOutfit = async (outfitId: string) => {
    const nextOutfits = savedOutfits.filter((outfit) => outfit.id !== outfitId);
    setSavedOutfits(nextOutfits);
    try {
      await AsyncStorage.setItem(SAVED_OUTFITS_STORAGE_KEY, JSON.stringify(nextOutfits));
    } catch (error) {
      console.warn("Unable to delete outfit", error);
    }
  };

  const loadOutfit = (outfit: SavedOutfit) => {
    setSelection({ ...outfit.items });
    setResetSelection({ ...outfit.items });
    setOutfitName(outfit.name);
    setSaveMessage(`“${outfit.name}” loaded.`);
  };

  const selectClosetItem = (item: ClothingItem) => {
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
          {isWideLayout && <View style={styles.sideColumn}>{leftSlots.map(renderSlotCard)}</View>}
          <View style={styles.centerColumn}>
            <View style={styles.mannequinDisplayCard}>
              <Text style={styles.displayEyebrow}>LOOK PREVIEW</Text>
              <View style={styles.mannequinStage}>
              <View style={styles.mannequinFrame}>
                {!mannequinAssetFailed ? (
                  <Image
                    contentFit="contain"
                    onError={() => {
                      console.warn("Unable to load prototype mannequin asset; using development fallback.");
                      setMannequinAssetFailed(true);
                    }}
                    source={mannequinSource}
                    style={[styles.prototypeCanvas, styles.mannequinAsset]}
                  />
                ) : (
                  <View style={styles.fallbackMannequin}>
                    <View style={styles.fallbackHead} />
                    <View style={styles.fallbackBody} />
                    <View style={styles.fallbackLegs} />
                  </View>
                )}
                {selection.top && <PrototypeClothingLayer key={selection.top.id} item={selection.top} slot="top" zIndex={10} />}
                {selection.bottom && <PrototypeClothingLayer key={selection.bottom.id} item={selection.bottom} slot="bottom" zIndex={20} />}
                {selection.shoes && <PrototypeClothingLayer key={selection.shoes.id} item={selection.shoes} slot="shoes" zIndex={30} />}
                {selection.jacket && <PrototypeClothingLayer key={selection.jacket.id} item={selection.jacket} slot="jacket" zIndex={40} />}
                {selection.accessory && <PrototypeClothingLayer key={selection.accessory.id} item={selection.accessory} slot="accessory" zIndex={50} />}
              </View>
            </View>
            </View>
            <View style={styles.quickControls}>
              <Pressable onPress={shuffleOutfit} style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}>
                <Text style={styles.quickButtonText}>Randomize</Text>
              </Pressable>
              <Pressable onPress={resetOutfit} style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}>
                <Text style={styles.quickButtonText}>↺ Reset</Text>
              </Pressable>
            </View>
          </View>
          {isWideLayout && <View style={styles.sideColumn}>{rightSlots.map(renderSlotCard)}</View>}
        </View>

        {!isWideLayout && <View style={styles.slotGrid}>{slots.map(renderSlotCard)}</View>}

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
            disabled={!hasSelectedItems}
            onPress={saveOutfit}
            style={({ pressed }) => [styles.saveButton, !hasSelectedItems && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.saveButtonText}>Save Look</Text>
          </Pressable>
          <Pressable onPress={clearOutfit} style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
            <Text style={styles.clearButtonText}>Clear Look</Text>
          </Pressable>
        </View>
        {saveMessage ? <Text style={styles.successText}>{saveMessage}</Text> : null}
      </Animated.View>

      <View style={styles.currentLookCard}>
        <Text style={styles.savedTitle}>Current Look</Text>
        <View style={styles.currentLookGrid}>
          {(["top", "bottom", "shoes", "accessory"] as OutfitSlotKey[]).map((key) => (
            <View key={key} style={styles.currentLookItem}>
              <Text style={styles.currentLookLabel}>{slots.find((slot) => slot.key === key)?.label}</Text>
              <Text numberOfLines={1} style={styles.currentLookValue}>{selection[key]?.name ?? "Not selected"}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.savedTitle}>Saved Looks</Text>
      {savedOutfits.length === 0 ? (
        <View style={styles.savedEmptyCard}>
          <Text style={styles.savedEmptyTitle}>No saved looks yet.</Text>
          <Text style={styles.savedEmptyText}>Your saved combinations will appear here.</Text>
        </View>
      ) : (
        <View style={styles.savedGrid}>
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
        </View>
      )}

      <View style={styles.closetHeader}>
        <View>
          <Text style={styles.savedTitle}>Clothing</Text>
          <Text style={styles.sectionSubtitle}>{wardrobe.length} items ready to style</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {closetFilters.map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setActiveClosetFilter(filter)}
            style={[styles.filterButton, activeClosetFilter === filter && styles.filterButtonActive]}>
            <Text style={[styles.filterText, activeClosetFilter === filter && styles.filterTextActive]}>
              {({ "All Items": "All", Shirts: "Tops", Pants: "Bottoms", Shoes: "Shoes", Jackets: "Outerwear", Accessories: "Accessories" } as Record<string, string>)[filter]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {wardrobe.length === 0 ? (
        <View style={styles.closetEmptyState}>
          <Text style={styles.closetEmptyTitle}>👕 Your wardrobe is waiting.</Text>
          <Text style={styles.closetEmptyText}>Add your first clothing item to begin building your AI-powered digital closet.</Text>
        </View>
      ) : (
        <ScrollView horizontal contentContainerStyle={styles.closetCarousel} showsHorizontalScrollIndicator={false}>
          {filteredClosetItems.map((item) => (
            <View key={item.id} style={[styles.closetCard, selectedIds.has(item.id) && styles.closetCardSelected]}>
              <Pressable onPress={() => selectClosetItem(item)} style={({ pressed }) => [styles.closetMain, pressed && styles.pressed]}>
              <View style={styles.closetVisual}><Text style={styles.closetVisualText}>{item.thumbnail}</Text></View>
              <Text numberOfLines={2} style={styles.closetItemName}>{item.name}</Text>
              <Text style={styles.closetItemMeta}>{item.primaryColor} · {item.brand}</Text>
              </Pressable>
              <Pressable
                onPress={() => toggleFavorite(item.id)}
                style={styles.closetFavorite}>
                <Text style={styles.favoriteIcon}>{item.favorite ? "★" : "☆"}</Text>
              </Pressable>
              {selectedIds.has(item.id) && <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>✓</Text></View>}
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.insightsCard}>
        <Text style={styles.savedTitle}>Style Insights</Text>
        <View style={styles.insightsRow}>
          <View style={styles.insight}><Text style={styles.insightLabel}>Most worn color</Text><Text style={styles.insightValue}>{mostWornColor}</Text></View>
          <View style={styles.insight}><Text style={styles.insightLabel}>Favorite category</Text><Text style={styles.insightValue}>{favoriteCategory}</Text></View>
          <View style={styles.insight}><Text style={styles.insightLabel}>Recent look</Text><Text numberOfLines={1} style={styles.insightValue}>{savedOutfits[0]?.name ?? "No saved look"}</Text></View>
        </View>
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
  builderCard: { backgroundColor: "#101713", borderColor: "rgba(74,222,128,0.18)", borderRadius: 24, borderWidth: 1, padding: 20 },
  builderHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  builderHeaderText: { flex: 1, paddingRight: 12 },
  helpButton: { borderColor: "rgba(139,92,246,0.5)", borderRadius: 10, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  helpButtonText: { color: "#c4b5fd", fontSize: 12, fontWeight: "bold" },
  helpText: { backgroundColor: "rgba(139,92,246,0.09)", borderRadius: 10, color: "#cbd5e1", fontSize: 12, lineHeight: 18, marginBottom: 14, padding: 11 },
  builderLayout: { alignItems: "center", flexDirection: "row", gap: 14, justifyContent: "center" },
  builderLayoutMobile: { flexDirection: "column" },
  sideColumn: { flex: 1, gap: 12, maxWidth: 220, minWidth: 170 },
  centerColumn: { alignItems: "center", flex: 1, maxWidth: 340, minWidth: 250 },
  mannequinDisplayCard: { alignItems: "center", backgroundColor: "#0b110d", borderColor: "rgba(74,222,128,0.22)", borderRadius: 24, borderWidth: 1, minHeight: 410, padding: 16, width: "100%" },
  displayEyebrow: { alignSelf: "flex-start", color: "#4ade80", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 10 },
  mannequinStage: { alignItems: "center", alignSelf: "center", backgroundColor: "rgba(15,23,42,0.72)", borderColor: "rgba(56,189,248,0.16)", borderRadius: 22, borderWidth: 1, height: 360, justifyContent: "center", marginBottom: 16, maxWidth: 340, overflow: "hidden", width: "100%" },
  mannequinFrame: { aspectRatio: 512 / 768, height: 330, position: "relative" },
  prototypeCanvas: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  mannequinAsset: { zIndex: 1 },
  fallbackMannequin: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0, zIndex: 1 },
  fallbackHead: { backgroundColor: "#4b5563", borderRadius: 18, height: 40, left: 90, position: "absolute", top: 18, width: 34 },
  fallbackBody: { backgroundColor: "#4b5563", borderRadius: 20, height: 140, left: 70, position: "absolute", top: 60, width: 74 },
  fallbackLegs: { backgroundColor: "#4b5563", borderRadius: 14, height: 120, left: 78, position: "absolute", top: 194, width: 58 },
  mannequinHead: { backgroundColor: "#4b5563", borderColor: "#64748b", borderRadius: 18, borderWidth: 1, height: 44, left: 83, position: "absolute", top: 5, width: 34, zIndex: 1 },
  mannequinNeck: { backgroundColor: "#4b5563", borderRadius: 5, height: 18, left: 94, position: "absolute", top: 45, width: 12, zIndex: 1 },
  mannequinShoulders: { backgroundColor: "#4b5563", borderRadius: 14, height: 25, left: 57, position: "absolute", top: 58, width: 86, zIndex: 1 },
  mannequinChest: { backgroundColor: "#4b5563", borderRadius: 16, height: 82, left: 68, position: "absolute", top: 66, width: 64, zIndex: 1 },
  mannequinWaist: { backgroundColor: "#4b5563", borderRadius: 10, height: 37, left: 77, position: "absolute", top: 135, width: 46, zIndex: 1 },
  mannequinHips: { backgroundColor: "#4b5563", borderRadius: 16, height: 43, left: 68, position: "absolute", top: 158, width: 64, zIndex: 1 },
  mannequinUpperArm: { backgroundColor: "#4b5563", borderRadius: 9, height: 78, position: "absolute", top: 68, width: 15, zIndex: 1 },
  mannequinUpperArmLeft: { left: 50, transform: [{ rotate: "5deg" }] },
  mannequinUpperArmRight: { right: 50, transform: [{ rotate: "-5deg" }] },
  mannequinForearm: { backgroundColor: "#4b5563", borderRadius: 8, height: 70, position: "absolute", top: 137, width: 13, zIndex: 1 },
  mannequinForearmLeft: { left: 43, transform: [{ rotate: "2deg" }] },
  mannequinForearmRight: { right: 43, transform: [{ rotate: "-2deg" }] },
  mannequinHand: { backgroundColor: "#4b5563", borderRadius: 8, height: 19, position: "absolute", top: 201, width: 13, zIndex: 1 },
  mannequinHandLeft: { left: 42 },
  mannequinHandRight: { right: 42 },
  mannequinThigh: { backgroundColor: "#4b5563", borderRadius: 12, height: 88, position: "absolute", top: 190, width: 27, zIndex: 1 },
  mannequinThighLeft: { left: 70, transform: [{ rotate: "1deg" }] },
  mannequinThighRight: { right: 70, transform: [{ rotate: "-1deg" }] },
  mannequinCalf: { backgroundColor: "#4b5563", borderRadius: 10, height: 66, position: "absolute", top: 270, width: 20, zIndex: 1 },
  mannequinCalfLeft: { left: 74 },
  mannequinCalfRight: { right: 74 },
  mannequinFoot: { backgroundColor: "#4b5563", borderRadius: 8, height: 15, position: "absolute", top: 330, width: 35, zIndex: 1 },
  mannequinFootLeft: { left: 61, transform: [{ rotate: "-2deg" }] },
  mannequinFootRight: { right: 61, transform: [{ rotate: "2deg" }] },
  topLayer: { height: 103, left: 50, position: "absolute", top: 61, width: 100, zIndex: 10 },
  topBody: { borderColor: "rgba(15,23,42,0.65)", borderRadius: 12, borderWidth: 1, height: 101, left: 20, position: "absolute", width: 60 },
  topSleeve: { borderColor: "rgba(15,23,42,0.65)", borderRadius: 9, borderWidth: 1, height: 49, position: "absolute", top: 5, width: 27 },
  topSleeveLeft: { left: 2, transform: [{ rotate: "8deg" }] },
  topSleeveRight: { right: 2, transform: [{ rotate: "-8deg" }] },
  jacketLayer: { height: 119, left: 44, position: "absolute", top: 58, width: 112, zIndex: 40 },
  jacketBody: { borderRadius: 13, borderWidth: 2, flexDirection: "row", height: 116, left: 23, overflow: "hidden", position: "absolute", width: 66 },
  jacketPanel: { borderColor: "rgba(255,255,255,0.12)", borderRightWidth: 1, flex: 1 },
  jacketSleeve: { borderColor: "rgba(15,23,42,0.7)", borderRadius: 9, borderWidth: 1, height: 91, position: "absolute", top: 6, width: 25 },
  jacketSleeveLeft: { left: 3, transform: [{ rotate: "6deg" }] },
  jacketSleeveRight: { right: 3, transform: [{ rotate: "-6deg" }] },
  bottomLayer: { height: 171, left: 65, position: "absolute", top: 160, width: 70, zIndex: 20 },
  waistband: { borderColor: "rgba(15,23,42,0.7)", borderRadius: 5, borderWidth: 1, height: 16, width: 70 },
  pantLegRow: { flexDirection: "row", gap: 4 },
  pantLeg: { borderColor: "rgba(15,23,42,0.7)", borderRadius: 8, borderWidth: 1, height: 155, width: 33 },
  shortLeg: { height: 54 },
  shoesLayer: { flexDirection: "row", height: 24, left: 59, position: "absolute", top: 327, width: 82, zIndex: 30 },
  shoe: { borderColor: "rgba(15,23,42,0.75)", borderRadius: 8, borderWidth: 1, height: 18, position: "absolute", top: 2, width: 38 },
  leftShoe: { left: 0, transform: [{ rotate: "-2deg" }] },
  rightShoe: { right: 0, transform: [{ rotate: "2deg" }] },
  glassesLayer: { alignItems: "center", flexDirection: "row", left: 78, position: "absolute", top: 23, zIndex: 50 },
  glassesLens: { backgroundColor: "#0f172a", borderColor: "#94a3b8", borderRadius: 8, borderWidth: 1, height: 13, width: 18 },
  glassesBridge: { backgroundColor: "#94a3b8", height: 2, width: 5 },
  capLayer: { borderRadius: 16, height: 20, left: 81, position: "absolute", top: 2, width: 38, zIndex: 50 },
  capBrim: { borderRadius: 4, height: 5, position: "absolute", right: -8, top: 15, width: 24 },
  beltLayer: { borderColor: "rgba(255,255,255,0.2)", borderRadius: 3, borderWidth: 1, height: 10, left: 65, position: "absolute", top: 163, width: 70, zIndex: 50 },
  beltBuckle: { borderColor: "#f8fafc", borderRadius: 2, borderWidth: 1, height: 8, left: 24, position: "absolute", top: 0, width: 9 },
  watchLayer: { alignItems: "center", height: 23, position: "absolute", right: 39, top: 160, width: 15, zIndex: 50 },
  watchBand: { borderRadius: 3, height: 23, position: "absolute", width: 7 },
  watchFace: { backgroundColor: "#e2e8f0", borderColor: "#475569", borderRadius: 6, borderWidth: 1, height: 12, position: "absolute", top: 5, width: 12 },
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
  nameInput: { backgroundColor: "rgba(15,23,42,0.8)", borderColor: "rgba(56,189,248,0.28)", borderRadius: 12, borderWidth: 1, color: "#fff", fontSize: 15, marginTop: 14, paddingHorizontal: 13, paddingVertical: 12 },
  controls: { flexDirection: "row", gap: 10, marginTop: 12 },
  saveButton: { alignItems: "center", backgroundColor: "#22c55e", borderRadius: 12, flex: 1, paddingVertical: 13 },
  saveButtonText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  clearButton: { alignItems: "center", borderColor: "rgba(148,163,184,0.42)", borderRadius: 12, borderWidth: 1, flex: 1, paddingVertical: 13 },
  clearButtonText: { color: "#B8C5D6", fontSize: 14, fontWeight: "bold" },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  successText: { color: "#86efac", fontSize: 13, marginTop: 10, textAlign: "center" },
  currentLookCard: { backgroundColor: "#101713", borderColor: "rgba(255,255,255,0.08)", borderRadius: 20, borderWidth: 1, marginTop: 24, padding: 18 },
  currentLookGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  currentLookItem: { backgroundColor: "#171e19", borderRadius: 12, flexBasis: 150, flexGrow: 1, padding: 12 },
  currentLookLabel: { color: "#7c8b81", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  currentLookValue: { color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 5 },
  savedTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 10, marginTop: 18 },
  savedEmptyCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 16 },
  savedEmptyTitle: { color: "#B8C5D6", fontSize: 15, fontWeight: "bold" },
  savedEmptyText: { color: "#64748b", fontSize: 13, marginTop: 4 },
  savedGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  savedOutfitCard: { backgroundColor: "#1e293b", borderColor: "rgba(96,165,250,0.14)", borderRadius: 14, borderWidth: 1, flexGrow: 1, marginBottom: 10, minWidth: 240, padding: 16 },
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
  closetHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  filterScroll: { marginBottom: 14 },
  filterButton: { borderColor: "rgba(148,163,184,0.25)", borderRadius: 999, borderWidth: 1, marginRight: 8, paddingHorizontal: 13, paddingVertical: 8 },
  filterButtonActive: { backgroundColor: "#22c55e", borderColor: "#4ade80" },
  filterText: { color: "#94a3b8", fontSize: 12, fontWeight: "bold" },
  filterTextActive: { color: "#fff" },
  closetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  closetCarousel: { gap: 12, paddingBottom: 4, paddingRight: 16 },
  closetCard: { backgroundColor: "#171e19", borderColor: "rgba(255,255,255,0.09)", borderRadius: 16, borderWidth: 1, height: 196, padding: 12, position: "relative", width: 152 },
  closetCardSelected: { borderColor: "#4ade80", borderWidth: 2 },
  closetMain: { flex: 1 },
  closetVisual: { alignItems: "center", backgroundColor: "rgba(15,23,42,0.7)", borderRadius: 11, height: 72, justifyContent: "center", marginBottom: 10 },
  closetVisualText: { fontSize: 38 },
  closetItemName: { color: "#fff", fontSize: 13, fontWeight: "bold", paddingRight: 22 },
  closetItemMeta: { color: "#94a3b8", fontSize: 11, marginTop: 5 },
  closetFavorite: { padding: 8, position: "absolute", right: 4, top: 78 },
  selectedBadge: { alignItems: "center", backgroundColor: "#22c55e", borderRadius: 12, height: 24, justifyContent: "center", position: "absolute", right: 8, top: 8, width: 24 },
  selectedBadgeText: { color: "#071109", fontSize: 13, fontWeight: "900" },
  insightsCard: { backgroundColor: "#101713", borderColor: "rgba(74,222,128,0.16)", borderRadius: 20, borderWidth: 1, marginTop: 28, padding: 18 },
  insightsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  insight: { backgroundColor: "#171e19", borderRadius: 12, flexBasis: 180, flexGrow: 1, padding: 14 },
  insightLabel: { color: "#7c8b81", fontSize: 11, fontWeight: "700" },
  insightValue: { color: "#fff", fontSize: 15, fontWeight: "800", marginTop: 5 },
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
