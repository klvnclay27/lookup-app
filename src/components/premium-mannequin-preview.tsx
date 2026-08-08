import { Image } from "expo-image";
import { Pressable, useWindowDimensions, View, StyleSheet, Text } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import type { ClothingItem } from "@/constants/starter-wardrobe";

export type MannequinType = "male" | "female";

type PremiumMannequinPreviewProps = {
  bottom: ClothingItem | null;
  mannequinType: MannequinType;
  onMannequinTypeChange: (value: MannequinType) => void;
  shoes: ClothingItem | null;
  top: ClothingItem | null;
};

const femaleAssets = {
  model: require("../../assets/images/my-locker/fitting-room/fitting-model-v1.png"),
  top: require("../../assets/images/my-locker/fitting-room/black-polo-v1.png"),
  bottom: require("../../assets/images/my-locker/fitting-room/blue-jeans-v1.png"),
  shoes: require("../../assets/images/my-locker/fitting-room/white-sneakers-v1.png"),
};

const maleAssets = {
  model: require("../../assets/images/my-locker/fitting-room/male-model-v1.png"),
  top: require("../../assets/images/my-locker/fitting-room/male-black-polo-v1.png"),
  bottom: require("../../assets/images/my-locker/fitting-room/male-blue-jeans-v1.png"),
  shoes: require("../../assets/images/my-locker/fitting-room/male-white-sneakers-v1.png"),
};

function GarmentLayer({ source, style }: { source: number; style: object }) {
  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)} style={[styles.garmentLayer, style]}>
      <Image contentFit="contain" source={source} style={styles.fill} />
    </Animated.View>
  );
}

export function PremiumMannequinPreview({ top, bottom, shoes, mannequinType, onMannequinTypeChange }: PremiumMannequinPreviewProps) {
  const { width } = useWindowDimensions();
  const compact = width < 600;
  const assets = mannequinType === "male" ? maleAssets : femaleAssets;
  const male = mannequinType === "male";

  return (
    <View style={[styles.previewCard, compact && styles.previewCardCompact]}>
      <View style={styles.previewHeader}>
        <Text style={styles.eyebrow}>VIRTUAL FITTING ROOM</Text>
        <View accessibilityRole="radiogroup" style={styles.typeSelector}>
          {(["male", "female"] as MannequinType[]).map((type) => {
            const selected = mannequinType === type;
            return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} key={type} onPress={() => onMannequinTypeChange(type)} style={({ pressed }) => [styles.typeButton, selected && styles.typeButtonActive, pressed && styles.pressed]}><Text style={[styles.typeText, selected && styles.typeTextActive]}>{type === "male" ? "Male" : "Female"}</Text></Pressable>;
          })}
        </View>
      </View>
      <View style={[styles.studio, compact && styles.studioCompact]}>
        <View style={styles.spotlight} />
        <View style={styles.spotlightCore} />
        <View style={styles.floorShadow} />
        <View style={[styles.figureFrame, compact && styles.figureFrameCompact]}>
          <Image contentFit="contain" source={assets.model} style={styles.fill} />
          {top ? <GarmentLayer source={assets.top} style={male ? styles.maleTopLayer : styles.femaleTopLayer} /> : null}
          {bottom ? <GarmentLayer source={assets.bottom} style={male ? styles.maleBottomLayer : styles.femaleBottomLayer} /> : null}
          {shoes ? <GarmentLayer source={assets.shoes} style={male ? styles.maleShoesLayer : styles.femaleShoesLayer} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    alignItems: "center",
    backgroundColor: "#0B1017",
    borderColor: "rgba(148,163,184,0.16)",
    borderRadius: 24,
    borderWidth: 1,
    experimental_backgroundImage: "linear-gradient(150deg, #202A36 0%, #121923 48%, #080D13 100%)",
    minHeight: 500,
    overflow: "hidden",
    padding: 22,
    width: "100%",
  },
  previewCardCompact: { minHeight: 470, paddingHorizontal: 14 },
  previewHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 10, width: "100%" },
  eyebrow: { color: "#69E08C", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  typeSelector: { backgroundColor: "rgba(6,10,15,0.72)", borderColor: "rgba(148,163,184,0.15)", borderRadius: 16, borderWidth: 1, flexDirection: "row", padding: 3 },
  typeButton: { alignItems: "center", borderRadius: 12, minWidth: 65, paddingHorizontal: 12, paddingVertical: 8 },
  typeButtonActive: { backgroundColor: "#69E08C" },
  typeText: { color: "#87939F", fontSize: 11, fontWeight: "800" },
  typeTextActive: { color: "#07120C" },
  pressed: { opacity: 0.72 },
  studio: { alignItems: "center", backgroundColor: "rgba(8,13,20,0.5)", borderColor: "rgba(148,163,184,0.11)", borderRadius: 22, borderWidth: 1, height: 430, justifyContent: "center", maxWidth: 420, overflow: "hidden", width: "100%" },
  studioCompact: { height: 405 },
  spotlight: { backgroundColor: "rgba(126,145,166,0.08)", borderRadius: 210, height: 430, position: "absolute", top: -36, transform: [{ scaleX: 0.72 }], width: 340 },
  spotlightCore: { backgroundColor: "rgba(226,235,243,0.035)", borderRadius: 160, height: 330, position: "absolute", top: 8, width: 220 },
  floorShadow: { backgroundColor: "rgba(0,0,0,0.58)", borderRadius: 80, bottom: 14, height: 18, position: "absolute", transform: [{ scaleX: 1.7 }], width: 92 },
  figureFrame: { aspectRatio: 2 / 3, height: 420, position: "relative" },
  figureFrameCompact: { height: 390 },
  fill: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  garmentLayer: { position: "absolute" },
  femaleTopLayer: { height: "30%", left: "24%", top: "14.5%", width: "52%", zIndex: 3 },
  femaleBottomLayer: { height: "49%", left: "30%", top: "39%", width: "40%", zIndex: 4 },
  femaleShoesLayer: { height: "10%", left: "24%", top: "87%", width: "52%", zIndex: 5 },
  maleTopLayer: { height: "32%", left: "19%", top: "14%", width: "62%", zIndex: 3 },
  maleBottomLayer: { height: "49%", left: "29%", top: "39%", width: "42%", zIndex: 4 },
  maleShoesLayer: { height: "9.5%", left: "24%", top: "87.5%", width: "52%", zIndex: 5 },
});
