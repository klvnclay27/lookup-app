import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { isTabletWidth } from '@/constants/layout';
import type { FinancialProfessionalDiscoveryContext } from '@/services/finance';
import {
  formatProfessionalSearchLocation,
  PROFESSIONAL_VERIFICATION_DESTINATIONS,
  requestApproximateDeviceLocation,
  searchFinancialProfessionals,
  type ProfessionalSearchLocation,
  type ProfessionalSearchResult,
} from '@/services/financial-professionals';

type FinanceProfessionalDiscoveryProps = {
  context: FinancialProfessionalDiscoveryContext | null;
  onClose: () => void;
};

const FUTURE_RESULT_FIELDS = [
  'Name and firm',
  'Verified credentials',
  'Specialty',
  'Approximate distance',
  'Contact information and website',
  'Fee information when available',
  'Verification links when available',
];

export function FinanceProfessionalDiscovery({ context, onClose }: FinanceProfessionalDiscoveryProps) {
  const { width } = useWindowDimensions();
  const tablet = isTabletWidth(width);
  const [location, setLocation] = useState<ProfessionalSearchLocation | null>(null);
  const [searchResult, setSearchResult] = useState<ProfessionalSearchResult | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [manualEntryVisible, setManualEntryVisible] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const resetLocationState = () => {
    setLocation(null);
    setSearchResult(null);
    setRequestingLocation(false);
    setManualEntryVisible(false);
    setLocationMessage('');
    setCity('');
    setState('');
    setPostalCode('');
  };

  useEffect(() => {
    if (!context) resetLocationState();
  }, [context]);

  const runSearch = async (nextLocation: ProfessionalSearchLocation) => {
    if (!context) return;
    setLocation(nextLocation);
    setSearchResult(await searchFinancialProfessionals({
      location: nextLocation,
      searchRadiusMiles: 25,
      specialties: context.specialties,
      topic: { topicId: context.topicId, topicTitle: context.topicTitle },
    }));
  };

  const findNearMe = async () => {
    setRequestingLocation(true);
    setLocationMessage('');
    setSearchResult(null);
    const result = await requestApproximateDeviceLocation();
    setRequestingLocation(false);
    if (result.status === 'granted') {
      setManualEntryVisible(false);
      await runSearch(result.location);
      return;
    }
    setLocationMessage(result.message);
    setManualEntryVisible(true);
  };

  const submitManualLocation = async () => {
    const normalizedCity = city.trim();
    const normalizedState = state.trim().toUpperCase();
    const normalizedPostalCode = postalCode.trim();
    if (!normalizedPostalCode && (!normalizedCity || !normalizedState)) {
      setLocationMessage('Enter a ZIP code or both a city and state.');
      return;
    }
    setLocationMessage('');
    await runSearch({
      city: normalizedCity || undefined,
      state: normalizedState || undefined,
      postalCode: normalizedPostalCode || undefined,
      source: 'manual',
    });
  };

  const close = () => {
    resetLocationState();
    onClose();
  };

  const openVerificationDestination = (url: string) => {
    void Linking.openURL(url).catch(() => Alert.alert('Unable to open link', 'Please try again later.'));
  };

  return (
    <Modal animationType="fade" onRequestClose={close} transparent visible={context !== null}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.headerCopy}><Text style={styles.eyebrow}>PROFESSIONAL DISCOVERY · MVP</Text><Text style={styles.title}>Find Professional Help</Text></View>
            <Pressable accessibilityLabel="Close professional discovery" onPress={close} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}><Text style={styles.closeText}>×</Text></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={[styles.primaryGrid, !tablet && styles.primaryGridPhone]}>
              <View style={styles.contextCard}>
                <Text style={styles.label}>TOPIC</Text><Text style={styles.value}>{context?.topicTitle}</Text>
                <Text style={[styles.label, styles.spacedLabel]}>LOOKING FOR HELP WITH</Text>
                <View style={styles.specialties}>{context?.specialties.map((specialty) => <View key={specialty} style={styles.specialtyChip}><Text style={styles.specialtyText}>{specialty}</Text></View>)}</View>
              </View>

              <View style={styles.locationCard}>
                <Text style={styles.label}>LOCATION</Text>
                <Text style={styles.locationTitle}>LookUP uses your approximate location to find financial professionals near you.</Text>
                <Text style={styles.locationCopy}>Location is requested only when you press the button and is cleared when this panel closes.</Text>
                <Pressable accessibilityRole="button" disabled={requestingLocation} onPress={() => { void findNearMe(); }} style={({ pressed }) => [styles.locationButton, requestingLocation && styles.buttonDisabled, pressed && styles.pressed]}>{requestingLocation ? <ActivityIndicator color="#09140E" size="small" /> : <Text style={styles.locationButtonText}>Find Near Me</Text>}</Pressable>
              </View>
            </View>

            {locationMessage ? <Text style={styles.locationMessage}>{locationMessage}</Text> : null}

            {manualEntryVisible ? <View style={styles.manualCard}><Text style={styles.manualTitle}>Enter a location instead</Text><View style={[styles.manualFields, !tablet && styles.manualFieldsPhone]}><TextInput accessibilityLabel="City" autoCapitalize="words" onChangeText={setCity} placeholder="City" placeholderTextColor="#6F7B87" style={styles.locationInput} value={city} /><TextInput accessibilityLabel="State" autoCapitalize="characters" maxLength={2} onChangeText={setState} placeholder="State" placeholderTextColor="#6F7B87" style={[styles.locationInput, styles.stateInput]} value={state} /><TextInput accessibilityLabel="ZIP code" inputMode="numeric" maxLength={10} onChangeText={setPostalCode} placeholder="ZIP code" placeholderTextColor="#6F7B87" style={styles.locationInput} value={postalCode} /></View><Pressable onPress={() => { void submitManualLocation(); }} style={({ pressed }) => [styles.manualButton, pressed && styles.pressed]}><Text style={styles.manualButtonText}>Use This Location</Text></Pressable></View> : null}

            {location && searchResult ? <View style={styles.readyCard}><Text style={styles.label}>SEARCH LOCATION</Text><Text style={styles.readyLocation}>{formatProfessionalSearchLocation(location)}</Text><Text style={styles.readyMessage}>{searchResult.message}</Text><Text style={styles.readyCopy}>No approved structured professional directory is connected, so LookUP is not displaying unverified listings.</Text><View style={styles.verificationActions}>{PROFESSIONAL_VERIFICATION_DESTINATIONS.map((destination) => <Pressable key={destination.id} onPress={() => openVerificationDestination(destination.url)} style={({ pressed }) => [styles.verificationButton, pressed && styles.pressed]}><Text style={styles.verificationButtonText}>{destination.label}</Text><Text style={styles.externalMark}>↗</Text></Pressable>)}</View></View> : null}

            <View style={styles.trustCard}><Text style={styles.trustTitle}>What future verified results may include</Text><View style={styles.fieldGrid}>{FUTURE_RESULT_FIELDS.map((field) => <View key={field} style={styles.fieldRow}><View style={styles.fieldMarker} /><Text style={styles.fieldText}>{field}</Text></View>)}</View><Text style={styles.trustNote}>Credentials such as CFP, CFA, CPA, Registered Investment Adviser, or Investment Adviser Representative should only appear when supported by verification data.</Text></View>

            <View style={styles.trustSummary}><Text style={styles.trustSummaryTitle}>Discover, then verify</Text><Text style={styles.trustSummaryText}>LookUP helps you discover and verify financial professionals. LookUP does not endorse individual professionals. Check credentials, registration status, disciplinary history, services, and fees before choosing someone.</Text></View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(2,6,10,0.78)', flex: 1, justifyContent: 'center', padding: 18 },
  panel: { backgroundColor: '#11171E', borderColor: '#303A45', borderRadius: 22, borderWidth: 1, maxHeight: '90%', maxWidth: 760, overflow: 'hidden', width: '100%' },
  header: { alignItems: 'flex-start', borderBottomColor: '#28313A', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 14, justifyContent: 'space-between', padding: 19 },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#69E08C', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#F6F8FA', fontSize: 22, fontWeight: '900', letterSpacing: -0.4, marginTop: 6 },
  closeButton: { alignItems: 'center', backgroundColor: '#222A33', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  closeText: { color: '#AAB4BE', fontSize: 20, lineHeight: 22 },
  content: { gap: 12, padding: 16 },
  primaryGrid: { flexDirection: 'row', gap: 12 },
  primaryGridPhone: { flexDirection: 'column' },
  contextCard: { backgroundColor: '#182029', borderRadius: 15, flex: 1, padding: 15 },
  label: { color: '#74818E', fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  spacedLabel: { marginTop: 16 },
  value: { color: '#F0F4F7', fontSize: 17, fontWeight: '900', marginTop: 6 },
  specialties: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  specialtyChip: { backgroundColor: 'rgba(105,224,140,0.1)', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 },
  specialtyText: { color: '#75E596', fontSize: 9, fontWeight: '800' },
  locationCard: { backgroundColor: '#182029', borderRadius: 15, flex: 1, padding: 15 },
  locationTitle: { color: '#DCE2E8', fontSize: 12, fontWeight: '800', lineHeight: 18, marginTop: 7 },
  locationCopy: { color: '#7E8A96', fontSize: 9, lineHeight: 14, marginTop: 4 },
  locationButton: { alignItems: 'center', backgroundColor: '#69E08C', borderRadius: 14, minHeight: 38, justifyContent: 'center', marginTop: 13, paddingHorizontal: 14, paddingVertical: 9 },
  locationButtonText: { color: '#09140E', fontSize: 10, fontWeight: '900' },
  buttonDisabled: { opacity: 0.65 },
  locationMessage: { color: '#E6A66A', fontSize: 10, lineHeight: 15, paddingHorizontal: 4 },
  manualCard: { backgroundColor: '#182029', borderRadius: 15, padding: 15 },
  manualTitle: { color: '#E8EDF1', fontSize: 13, fontWeight: '900' },
  manualFields: { flexDirection: 'row', gap: 8, marginTop: 11 },
  manualFieldsPhone: { flexDirection: 'column' },
  locationInput: { backgroundColor: '#11171E', borderColor: '#303A45', borderRadius: 11, borderWidth: 1, color: '#EEF2F5', flex: 1, fontSize: 11, minHeight: 40, paddingHorizontal: 11, paddingVertical: 8 },
  stateInput: { flex: 0.45 },
  manualButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#27323C', borderRadius: 12, marginTop: 10, paddingHorizontal: 13, paddingVertical: 9 },
  manualButtonText: { color: '#DDE4E9', fontSize: 10, fontWeight: '900' },
  readyCard: { backgroundColor: '#17221D', borderColor: 'rgba(105,224,140,0.25)', borderRadius: 15, borderWidth: 1, padding: 15 },
  readyLocation: { color: '#F0F5F2', fontSize: 17, fontWeight: '900', marginTop: 6 },
  readyMessage: { color: '#75E596', fontSize: 11, fontWeight: '800', lineHeight: 17, marginTop: 9 },
  readyCopy: { color: '#86928C', fontSize: 9, lineHeight: 14, marginTop: 4 },
  verificationActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  verificationButton: { alignItems: 'center', backgroundColor: '#233029', borderRadius: 12, flexDirection: 'row', gap: 7, paddingHorizontal: 10, paddingVertical: 8 },
  verificationButtonText: { color: '#8BE9A5', fontSize: 9, fontWeight: '900' },
  externalMark: { color: '#69E08C', fontSize: 11, fontWeight: '900' },
  trustCard: { backgroundColor: '#151C23', borderRadius: 15, padding: 15 },
  trustTitle: { color: '#E8EDF1', fontSize: 13, fontWeight: '900' },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 12 },
  fieldRow: { alignItems: 'center', flexDirection: 'row', gap: 7, minWidth: 190 },
  fieldMarker: { backgroundColor: '#69E08C', borderRadius: 3, height: 5, width: 5 },
  fieldText: { color: '#9BA6B1', fontSize: 10 },
  trustNote: { color: '#77838F', fontSize: 9, lineHeight: 14, marginTop: 14 },
  trustSummary: { backgroundColor: '#151C23', borderRadius: 15, padding: 15 },
  trustSummaryTitle: { color: '#DDE3E8', fontSize: 11, fontWeight: '900' },
  trustSummaryText: { color: '#7D8994', fontSize: 9, lineHeight: 15, marginTop: 5 },
  pressed: { opacity: 0.68 },
});
