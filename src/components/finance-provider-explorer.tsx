import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { isTabletWidth } from '@/constants/layout';
import type { FinanceEducationTopic } from '@/services/finance';
import { getFinancialInstitutionsForTopic, type FinancialInstitution } from '@/services/financial-institutions';

type FinanceProviderExplorerProps = {
  onClose: () => void;
  topic: FinanceEducationTopic | null;
};

export function FinanceProviderExplorer({ onClose, topic }: FinanceProviderExplorerProps) {
  const { width } = useWindowDimensions();
  const tablet = isTabletWidth(width);
  const providers = topic ? getFinancialInstitutionsForTopic(topic.id) : [];

  const openOfficialSite = (provider: FinancialInstitution) => {
    void Linking.openURL(provider.officialWebsite).catch(() => Alert.alert('Unable to open site', 'Please try again later.'));
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={topic !== null}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.panel}>
          <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.eyebrow}>FINANCIAL LITERACY DEPARTMENT</Text><Text style={styles.title}>Explore Providers</Text><Text style={styles.subtitle}>Explore established institutions that offer products or services related to what you’re learning about.</Text></View><Pressable accessibilityLabel="Close provider explorer" onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}><Text style={styles.closeText}>×</Text></Pressable></View>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.topicCard}><Text style={styles.label}>CURRENT TOPIC</Text><Text style={styles.topicTitle}>{topic?.title}</Text></View>
            <View style={[styles.providerGrid, !tablet && styles.providerGridPhone]}>{providers.map((provider) => <ProviderCard key={provider.id} onVisit={() => openOfficialSite(provider)} provider={provider} tablet={tablet} topicId={topic?.id ?? ''} />)}</View>
            <View style={styles.disclosureCard}><Text style={styles.disclosureTitle}>Research your options</Text><Text style={styles.disclosure}>LookUP does not recommend or endorse any financial institution. Providers are shown for educational and discovery purposes so you can research your options.</Text><Text style={styles.disclosureSecondary}>Verify product availability, eligibility, services, account minimums, and fees directly with the institution before making a decision.</Text></View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function providerCategory(provider: FinancialInstitution): string {
  if (provider.institutionType === 'Brokerage') return 'Brokerage & Investment Services';
  if (provider.institutionType === 'Retirement services provider') return 'Retirement & Investment Services';
  return 'Investment & Retirement Services';
}

function topicProducts(topicId: FinanceEducationTopic['id']): string[] {
  if (topicId === 'roth-ira') return ['Roth IRA', 'Retirement accounts'];
  if (topicId === 'traditional-ira') return ['Traditional IRA', 'Retirement accounts'];
  if (topicId === 'roth-vs-traditional-ira') return ['Roth IRA', 'Traditional IRA'];
  if (topicId === 'stocks') return ['Stocks', 'Brokerage accounts'];
  if (topicId === 'etfs') return ['ETFs', 'Brokerage accounts'];
  if (topicId === 'index-funds') return ['Index funds', 'Fund access'];
  if (topicId === 'bonds') return ['Bonds', 'Fixed-income access'];
  return [];
}

function ProviderCard({ onVisit, provider, tablet, topicId }: { onVisit: () => void; provider: FinancialInstitution; tablet: boolean; topicId: FinanceEducationTopic['id'] }) {
  const products = topicProducts(topicId);
  return <View style={[styles.providerCard, tablet && styles.providerCardTablet]}><View><Text style={styles.providerName}>{provider.name}</Text><Text style={styles.providerType}>{providerCategory(provider)}</Text></View><View style={styles.productList}>{products.map((product, index) => <View key={product} style={styles.productItem}><Text style={styles.productText}>{product}</Text>{index < products.length - 1 ? <View style={styles.productSeparator} /> : null}</View>)}</View><Pressable onPress={onVisit} style={({ pressed }) => [styles.visitButton, pressed && styles.pressed]}><Text style={styles.visitButtonText}>Visit Official Site</Text><Text style={styles.externalMark}>→</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(2,6,10,0.78)', flex: 1, justifyContent: 'center', padding: 18 },
  panel: { backgroundColor: '#11171E', borderColor: '#303A45', borderRadius: 22, borderWidth: 1, maxHeight: '90%', maxWidth: 820, overflow: 'hidden', width: '100%' },
  header: { alignItems: 'flex-start', borderBottomColor: '#28313A', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 14, justifyContent: 'space-between', padding: 19 },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#69E08C', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#F6F8FA', fontSize: 22, fontWeight: '900', letterSpacing: -0.4, marginTop: 6 },
  subtitle: { color: '#818D99', fontSize: 10, lineHeight: 15, marginTop: 5, maxWidth: 600 },
  closeButton: { alignItems: 'center', backgroundColor: '#222A33', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  closeText: { color: '#AAB4BE', fontSize: 20, lineHeight: 22 },
  content: { gap: 12, padding: 16 },
  topicCard: { backgroundColor: '#17221D', borderColor: 'rgba(105,224,140,0.2)', borderRadius: 14, borderWidth: 1, padding: 14 },
  label: { color: '#74818E', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  topicTitle: { color: '#F0F5F2', fontSize: 17, fontWeight: '900', marginTop: 6 },
  providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  providerGridPhone: { flexDirection: 'column' },
  providerCard: { backgroundColor: '#182029', borderRadius: 14, gap: 11, justifyContent: 'space-between', minHeight: 148, padding: 13, width: '100%' },
  providerCardTablet: { width: '48%' },
  providerName: { color: '#F5F7F9', fontSize: 17, fontWeight: '900', letterSpacing: -0.25 },
  providerType: { color: '#8F9BA7', fontSize: 9, fontWeight: '700', marginTop: 4 },
  productList: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  productItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  productText: { color: '#74818D', fontSize: 8, fontWeight: '700' },
  productSeparator: { backgroundColor: '#53606D', borderRadius: 2, height: 3, width: 3 },
  visitButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(105,224,140,0.11)', borderRadius: 12, flexDirection: 'row', gap: 7, paddingHorizontal: 11, paddingVertical: 8 },
  visitButtonText: { color: '#69E08C', fontSize: 9, fontWeight: '900' },
  externalMark: { color: '#69E08C', fontSize: 11, fontWeight: '900' },
  disclosureCard: { backgroundColor: '#151C23', borderRadius: 15, padding: 15 },
  disclosureTitle: { color: '#E2E7EB', fontSize: 11, fontWeight: '900' },
  disclosure: { color: '#8A96A1', fontSize: 9, lineHeight: 15, marginTop: 5 },
  disclosureSecondary: { color: '#707C87', fontSize: 9, lineHeight: 14, marginTop: 6 },
  pressed: { opacity: 0.68 },
});
