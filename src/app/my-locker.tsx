import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OutfitBuilder } from "@/components/outfit-builder";

const LOCKER_NAME_STORAGE_KEY = "lookup.myLocker.name";
const aiFeatures = [
  { icon: "🤖", title: "AI Clothing Recognition", description: "Automatically identifies clothing." },
  { icon: "🎨", title: "Color Detection", description: "Detects dominant colors." },
  { icon: "🏷️", title: "Brand Detection", description: "Recognizes clothing brands." },
  { icon: "👔", title: "Outfit Generator", description: "Creates outfits from your closet." },
  { icon: "🌦️", title: "Weather Matching", description: "Suggests what to wear." },
  {
    icon: "🛍️",
    title: "Wishlist Matching",
    description: "Finds clothing that complements your wardrobe.",
  },
];

export default function MyLockerScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [lockerName, setLockerName] = useState("My Locker");
  const [lockerNameDraft, setLockerNameDraft] = useState("My Locker");
  const [clothingItemCount, setClothingItemCount] = useState(0);
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.94)).current;
  const renameOpacity = useRef(new Animated.Value(0)).current;
  const renameScale = useRef(new Animated.Value(0.94)).current;
  const isClosetEmpty = clothingItemCount === 0;

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(LOCKER_NAME_STORAGE_KEY)
      .then((savedName) => {
        if (isMounted && savedName) {
          setLockerName(savedName);
          setLockerNameDraft(savedName);
        }
      })
      .catch((error) => console.warn("Unable to load locker name", error));

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAddModalVisible) return;

    modalOpacity.setValue(0);
    modalScale.setValue(0.94);
    Animated.parallel([
      Animated.timing(modalOpacity, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(modalScale, {
        damping: 18,
        mass: 0.8,
        stiffness: 180,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isAddModalVisible, modalOpacity, modalScale]);

  useEffect(() => {
    if (!isRenameModalVisible) return;

    renameOpacity.setValue(0);
    renameScale.setValue(0.94);
    Animated.parallel([
      Animated.timing(renameOpacity, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(renameScale, {
        damping: 18,
        stiffness: 180,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isRenameModalVisible, renameOpacity, renameScale]);

  const closeAddModal = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, { duration: 150, toValue: 0, useNativeDriver: true }),
      Animated.timing(modalScale, { duration: 150, toValue: 0.96, useNativeDriver: true }),
    ]).start(() => setIsAddModalVisible(false));
  };

  const openRenameModal = () => {
    setLockerNameDraft(lockerName);
    setIsRenameModalVisible(true);
  };

  const closeRenameModal = () => {
    Animated.parallel([
      Animated.timing(renameOpacity, { duration: 150, toValue: 0, useNativeDriver: true }),
      Animated.timing(renameScale, { duration: 150, toValue: 0.96, useNativeDriver: true }),
    ]).start(() => setIsRenameModalVisible(false));
  };

  const saveLockerName = async () => {
    const nextName = lockerNameDraft.trim() || "My Locker";
    setLockerName(nextName);
    setLockerNameDraft(nextName);
    closeRenameModal();

    try {
      await AsyncStorage.setItem(LOCKER_NAME_STORAGE_KEY, nextName);
    } catch (error) {
      console.warn("Unable to save locker name", error);
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 32 },
        ]}>
        <View style={[styles.pageContent, { paddingHorizontal: width >= 768 ? 30 : 20 }]}>
        <Text style={styles.eyebrow}>YOUR DIGITAL WARDROBE</Text>
        <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
        <View style={styles.lockerTitleRow}>
          <Text style={styles.title}>👕 {lockerName}</Text>
          <Pressable
            accessibilityLabel="Rename locker"
            accessibilityRole="button"
            onPress={openRenameModal}
            style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}>
            <Text style={styles.editButtonText}>✏️</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Build your look.</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Profile" accessibilityRole="button" style={({ pressed }) => [styles.roundButton, pressed && styles.buttonPressed]}><Text style={styles.profileText}>LU</Text></Pressable>
          <Pressable accessibilityLabel="Locker settings" accessibilityRole="button" onPress={openRenameModal} style={({ pressed }) => [styles.roundButton, pressed && styles.buttonPressed]}><Text style={styles.settingsText}>⚙</Text></Pressable>
        </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsAddModalVisible(true)}
          style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}>
          <Text style={styles.addButtonText}>+ Add Clothing</Text>
        </Pressable>

        <OutfitBuilder
          onAddClothing={() => setIsAddModalVisible(true)}
          onWardrobeCountChange={setClothingItemCount}
        />

        </View>
      </ScrollView>

      <Modal
        animationType="none"
        onRequestClose={closeAddModal}
        transparent
        visible={isAddModalVisible}>
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.modalCard,
              { opacity: modalOpacity, transform: [{ scale: modalScale }] },
            ]}>
            <ScrollView
              bounces={false}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitleIcon}>👕</Text>
              <Text style={styles.modalTitle}>
                {isClosetEmpty ? "Add to My Locker" : "Add Another Item"}
              </Text>
            </View>

            {isClosetEmpty && (
              <Text style={styles.emptyStateText}>
                Start building your digital wardrobe by adding your first clothing item.
              </Text>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={closeAddModal}
              onPointerEnter={() => setHoveredAction("camera")}
              onPointerLeave={() => setHoveredAction(null)}
              style={({ pressed }) => [
                styles.modalOption,
                hoveredAction === "camera" && styles.buttonHovered,
                pressed && styles.modalButtonPressed,
              ]}>
              <Text style={styles.modalOptionText}>📷 Take Photo</Text>
              <Text style={styles.modalOptionHint}>Camera integration coming soon</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={closeAddModal}
              onPointerEnter={() => setHoveredAction("library")}
              onPointerLeave={() => setHoveredAction(null)}
              style={({ pressed }) => [
                styles.modalOption,
                hoveredAction === "library" && styles.buttonHovered,
                pressed && styles.modalButtonPressed,
              ]}>
              <Text style={styles.modalOptionText}>🖼️ Upload Photo</Text>
              <Text style={styles.modalOptionHint}>Photo library integration coming soon</Text>
            </Pressable>

            <View style={styles.aiPreview}>
              <Text style={styles.aiPreviewTitle}>AI wardrobe intelligence</Text>
              <View style={styles.featureList}>
                {aiFeatures.map((feature) => (
                  <View key={feature.title} style={styles.featureCard}>
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={closeAddModal}
              onPointerEnter={() => setHoveredAction("cancel")}
              onPointerLeave={() => setHoveredAction(null)}
              style={({ pressed }) => [
                styles.cancelButton,
                hoveredAction === "cancel" && styles.cancelButtonHovered,
                pressed && styles.modalButtonPressed,
              ]}>
              <Text style={styles.cancelButtonText}>❌ Cancel</Text>
            </Pressable>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        animationType="none"
        onRequestClose={closeRenameModal}
        transparent
        visible={isRenameModalVisible}>
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.renameModalCard,
              { opacity: renameOpacity, transform: [{ scale: renameScale }] },
            ]}>
            <Text style={styles.renameTitle}>✏️ Rename Locker</Text>
            <TextInput
              autoFocus
              maxLength={40}
              onChangeText={setLockerNameDraft}
              onSubmitEditing={saveLockerName}
              placeholder="Enter a locker name..."
              placeholderTextColor="#64748b"
              returnKeyType="done"
              selectionColor="#38bdf8"
              style={styles.renameInput}
              value={lockerNameDraft}
            />
            <View style={styles.renameActions}>
              <Pressable
                accessibilityRole="button"
                onPress={saveLockerName}
                style={({ pressed }) => [styles.renameSaveButton, pressed && styles.modalButtonPressed]}>
                <Text style={styles.renameSaveText}>✔ Save</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={closeRenameModal}
                style={({ pressed }) => [styles.renameCancelButton, pressed && styles.modalButtonPressed]}>
                <Text style={styles.renameCancelText}>❌ Cancel</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  contentContainer: {
    paddingTop: 0,
  },
  pageContent: { alignSelf: "center", maxWidth: 1160, paddingTop: 32, width: "100%" },
  eyebrow: { color: "#4ade80", fontSize: 12, fontWeight: "800", letterSpacing: 1.6, marginBottom: 8 },
  headerRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  headerCopy: { flex: 1, paddingRight: 18 },
  headerActions: { gap: 10 },
  roundButton: { alignItems: "center", backgroundColor: "#171e19", borderColor: "rgba(255,255,255,0.1)", borderRadius: 22, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  profileText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  settingsText: { color: "#cbd5e1", fontSize: 18 },
  lockerTitleRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  title: {
    color: "#fff",
    flexShrink: 1,
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 6,
  },
  editButton: {
    alignItems: "center",
    borderRadius: 10,
    justifyContent: "center",
    marginBottom: 6,
    marginLeft: 8,
    minHeight: 40,
    minWidth: 40,
  },
  editButtonText: {
    fontSize: 18,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 17,
    marginBottom: 24,
  },
  addButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#22c55e",
    borderRadius: 12,
    marginBottom: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  addButtonText: {
    color: "#071109",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#1e293b",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 18,
  },
  categoryCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 16,
  },
  closetEmptyState: {
    backgroundColor: "rgba(37,99,235,0.1)",
    borderColor: "rgba(56,189,248,0.24)",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
  },
  closetEmptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  closetEmptyText: {
    color: "#B8C5D6",
    fontSize: 14,
    lineHeight: 21,
  },
  categoryTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardText: {
    color: "#B8C5D6",
    fontSize: 15,
    lineHeight: 23,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  modalCard: {
    backgroundColor: "rgba(20,30,48,0.96)",
    borderColor: "rgba(125,211,252,0.2)",
    borderRadius: 24,
    borderWidth: 1,
    elevation: 18,
    maxHeight: "92%",
    maxWidth: 480,
    shadowColor: "#0284c7",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    width: "100%",
  },
  modalContent: {
    padding: 24,
  },
  modalTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitleIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
  },
  emptyStateText: {
    color: "#B8C5D6",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
    paddingHorizontal: 8,
    textAlign: "center",
  },
  modalOption: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 16,
    elevation: 8,
    experimental_backgroundImage: "linear-gradient(135deg, #38bdf8, #2563eb 55%, #1d4ed8)",
    marginBottom: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
    shadowColor: "#38bdf8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalOptionText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  modalOptionHint: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 4,
  },
  buttonHovered: {
    shadowOpacity: 0.55,
    transform: [{ translateY: -2 }],
  },
  modalButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  aiPreview: {
    backgroundColor: "rgba(15,23,42,0.72)",
    borderColor: "rgba(56,189,248,0.14)",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
    padding: 14,
  },
  aiPreviewTitle: {
    color: "#7dd3fc",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  featureList: {
    gap: 8,
  },
  featureCard: {
    alignItems: "center",
    backgroundColor: "rgba(56,189,248,0.08)",
    borderColor: "rgba(56,189,248,0.18)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    padding: 10,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: "#e0f2fe",
    fontSize: 12,
    fontWeight: "bold",
  },
  featureDescription: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  cancelButton: {
    alignItems: "center",
    borderColor: "rgba(148,163,184,0.42)",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 13,
  },
  cancelButtonHovered: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cancelButtonText: {
    color: "#B8C5D6",
    fontSize: 16,
    fontWeight: "bold",
  },
  renameModalCard: {
    backgroundColor: "rgba(20,30,48,0.98)",
    borderColor: "rgba(125,211,252,0.2)",
    borderRadius: 22,
    borderWidth: 1,
    elevation: 18,
    maxWidth: 440,
    padding: 24,
    shadowColor: "#0284c7",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    width: "100%",
  },
  renameTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  renameInput: {
    backgroundColor: "rgba(15,23,42,0.82)",
    borderColor: "rgba(56,189,248,0.35)",
    borderRadius: 12,
    borderWidth: 1,
    color: "#fff",
    fontSize: 16,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  renameActions: {
    flexDirection: "row",
    gap: 10,
  },
  renameSaveButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    experimental_backgroundImage: "linear-gradient(135deg, #38bdf8, #2563eb 60%, #1d4ed8)",
    flex: 1,
    paddingVertical: 13,
  },
  renameSaveText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  renameCancelButton: {
    alignItems: "center",
    borderColor: "rgba(148,163,184,0.42)",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 13,
  },
  renameCancelText: {
    color: "#B8C5D6",
    fontSize: 15,
    fontWeight: "bold",
  },
});
