import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { TABLET_MIN_WIDTH } from '@/constants/layout';
import { getWardrobeItems, type LockerScope, type WardrobeItem } from '@/services/my-locker';
import { getStyleDiscoveryRecommendations } from '@/services/style-discovery';

export function StyleDiscovery({ lockerScope, wardrobeRevision }: { lockerScope: LockerScope | null; wardrobeRevision: number }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;
  const [adventurous, setAdventurous] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (!lockerScope) {
      setWardrobe([]);
      return () => {
        isMounted = false;
      };
    }
    void getWardrobeItems(lockerScope).then((result) => {
      if (isMounted) setWardrobe(result.data ?? []);
    });
    return () => {
      isMounted = false;
    };
  }, [lockerScope?.userId, wardrobeRevision]);

  const recommendations = useMemo(
    () => getStyleDiscoveryRecommendations(wardrobe, { adventurous, limit: 3 }),
    [adventurous, wardrobe],
  );

  return (
    <View style={styles.section}>
      <View style={[styles.header, !isTablet && styles.headerMobile]}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>WARDROBE DISCOVERY</Text>
          <Text style={styles.title}>Discover Your Style</Text>
          <Text style={styles.subtitle}>A few sample pieces that could complement or expand your Locker.</Text>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: adventurous }}
          onPress={() => setAdventurous((current) => !current)}
          style={({ pressed }) => [styles.adventureControl, adventurous && styles.adventureControlActive, pressed && styles.pressed]}>
          <View style={[styles.toggleTrack, adventurous && styles.toggleTrackActive]}>
            <View style={[styles.toggleThumb, adventurous && styles.toggleThumbActive]} />
          </View>
          <View>
            <Text style={styles.adventureLabel}>Be More Adventurous</Text>
            <Text style={styles.adventureHint}>{adventurous ? 'Broader style ideas enabled' : 'Stay close to your current style'}</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {recommendations.map((product) => (
          <View key={product.id} style={[styles.productCard, isTablet && styles.productCardTablet]}>
            <View style={styles.productTopRow}>
              <Text style={styles.reason}>{product.reason}</Text>
              <Text style={styles.price}>${product.samplePrice}</Text>
            </View>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productMeta}>{product.category} · {product.brand}</Text>
            <Text numberOfLines={2} style={styles.productDescription}>{product.description}</Text>
            <Text style={styles.reasonDetail}>{product.reasonDetail}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.disclaimer}>Local sample recommendations and sample prices only. Availability and pricing are not live.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: '#101713', borderColor: 'rgba(105,224,140,0.16)', borderRadius: 22, borderWidth: 1, marginTop: 10, padding: 18 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 20, justifyContent: 'space-between', marginBottom: 16 },
  headerMobile: { alignItems: 'stretch', flexDirection: 'column', gap: 13 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#69E08C', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#89968D', fontSize: 12, lineHeight: 18, marginTop: 4 },
  adventureControl: { alignItems: 'center', alignSelf: 'stretch', borderColor: 'rgba(148,163,184,0.18)', borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  adventureControlActive: { backgroundColor: 'rgba(105,224,140,0.07)', borderColor: 'rgba(105,224,140,0.3)' },
  toggleTrack: { backgroundColor: '#344039', borderRadius: 10, height: 20, padding: 2, width: 36 },
  toggleTrackActive: { backgroundColor: '#69E08C' },
  toggleThumb: { backgroundColor: '#D7DED9', borderRadius: 8, height: 16, width: 16 },
  toggleThumbActive: { alignSelf: 'flex-end', backgroundColor: '#07120C' },
  adventureLabel: { color: '#E2E9E4', fontSize: 12, fontWeight: '800' },
  adventureHint: { color: '#748078', fontSize: 9, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  productCard: { backgroundColor: '#151B17', borderColor: 'rgba(255,255,255,0.07)', borderRadius: 15, borderWidth: 1, padding: 14, width: '100%' },
  productCardTablet: { flexBasis: 240, flexGrow: 1, maxWidth: 360, width: 'auto' },
  productTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  reason: { color: '#69E08C', fontSize: 9, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  price: { color: '#D8E2DB', fontSize: 13, fontWeight: '900' },
  productName: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', marginTop: 9 },
  productMeta: { color: '#859188', fontSize: 10, marginTop: 4 },
  productDescription: { color: '#B5C0B8', fontSize: 11, lineHeight: 16, marginTop: 9 },
  reasonDetail: { borderTopColor: 'rgba(255,255,255,0.06)', borderTopWidth: 1, color: '#819087', fontSize: 10, lineHeight: 15, marginTop: 10, paddingTop: 9 },
  disclaimer: { color: '#68746C', fontSize: 9, lineHeight: 14, marginTop: 12 },
  pressed: { opacity: 0.75 },
});
