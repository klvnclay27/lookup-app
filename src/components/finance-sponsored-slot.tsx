import { StyleSheet, Text, View } from 'react-native';

import type { FinanceSponsoredPlacement } from '@/services/finance-sponsorship';

type FinanceSponsoredSlotProps = {
  placement: FinanceSponsoredPlacement;
};

export function FinanceSponsoredSlot({ placement }: FinanceSponsoredSlotProps) {
  return (
    <View accessibilityLabel={`${placement.sponsoredLabel}: ${placement.headline}`} style={styles.slot}>
      <View style={styles.labelRow}><Text style={styles.label}>{placement.sponsoredLabel.toUpperCase()}</Text><View style={styles.labelLine} /></View>
      <View style={styles.content}><View style={styles.mark}><Text style={styles.markText}>LU</Text></View><View style={styles.copy}><Text style={styles.headline}>{placement.headline}</Text><Text style={styles.description}>{placement.shortDescription}</Text></View></View>
      <Text style={styles.note}>Paid placements are separate from LookUP education, provider discovery, and professional verification.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { backgroundColor: '#121820', borderColor: '#34404B', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, marginBottom: 34, paddingHorizontal: 15, paddingVertical: 13 },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  label: { color: '#9B8BB7', fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  labelLine: { backgroundColor: '#312B3C', flex: 1, height: StyleSheet.hairlineWidth },
  content: { alignItems: 'center', flexDirection: 'row', gap: 11, marginTop: 10 },
  mark: { alignItems: 'center', backgroundColor: '#24202E', borderRadius: 13, height: 36, justifyContent: 'center', width: 36 },
  markText: { color: '#A998C4', fontSize: 9, fontWeight: '900' },
  copy: { flex: 1, minWidth: 0 },
  headline: { color: '#E7E9ED', fontSize: 12, fontWeight: '900' },
  description: { color: '#7F8994', fontSize: 9, lineHeight: 14, marginTop: 3 },
  note: { color: '#626D78', fontSize: 8, lineHeight: 12, marginTop: 9 },
});
