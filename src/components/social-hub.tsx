import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { isTabletWidth } from '@/constants/layout';
import {
  MOCK_SOCIAL_ACCOUNTS,
  MOCK_SOCIAL_LIVE_UPDATES,
  MOCK_SOCIAL_MESSAGES,
  MOCK_SOCIAL_UPDATES,
  type SocialPlatform,
} from '@/services/social-hub';

const PLATFORM_MARKS: Record<SocialPlatform, string> = {
  Instagram: 'IG',
  X: 'X',
  Facebook: 'f',
  Threads: '@',
  TikTok: 'TT',
};

export function SocialHub() {
  const { width } = useWindowDimensions();
  const tablet = isTabletWidth(width);
  const [connected, setConnected] = useState<SocialPlatform[]>(() =>
    MOCK_SOCIAL_ACCOUNTS
      .filter((account) => account.initiallyConnected)
      .map((account) => account.platform),
  );
  const [postText, setPostText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['Instagram']);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const canPreparePost = postText.trim().length > 0 && selectedPlatforms.length > 0;
  const connectedSet = useMemo(() => new Set(connected), [connected]);

  const connect = (platform: SocialPlatform) => {
    setConnected((current) => current.includes(platform) ? current : [...current, platform]);
  };

  const togglePlatform = (platform: SocialPlatform) => {
    setSelectedPlatforms((current) => current.includes(platform)
      ? current.filter((item) => item !== platform)
      : [...current, platform]);
    setConfirmation(null);
  };

  const preparePost = () => {
    if (!canPreparePost) return;
    const names = selectedPlatforms.length === 1
      ? selectedPlatforms[0]
      : `${selectedPlatforms.slice(0, -1).join(', ')} and ${selectedPlatforms.at(-1)}`;
    setConfirmation(`Demo post prepared for ${names}. Nothing was sent externally.`);
    setPostText('');
  };

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>SOCIAL · DEMO</Text>
          <Text style={styles.title}>Social Hub</Text>
          <Text style={styles.subtitle}>One place for your future social connections and conversations.</Text>
        </View>
        <View style={styles.demoBadge}><Text style={styles.demoBadgeText}>LOCAL MOCK</Text></View>
      </View>

      <Text style={styles.groupTitle}>Connected Accounts</Text>
      <View style={styles.accountGrid}>
        {MOCK_SOCIAL_ACCOUNTS.map((account) => {
          const isConnected = connectedSet.has(account.platform);
          return (
            <View key={account.id} style={[styles.accountCard, tablet ? styles.accountCardTablet : styles.accountCardPhone]}>
              <View style={styles.platformMark}><Text style={styles.platformMarkText}>{PLATFORM_MARKS[account.platform]}</Text></View>
              <View style={styles.accountCopy}><Text numberOfLines={1} style={styles.platformName}>{account.platform}</Text><Text style={[styles.connectionState, isConnected && styles.connectedState]}>{isConnected ? 'Connected' : 'Not connected'}</Text></View>
              <Pressable
                accessibilityLabel={isConnected ? `${account.platform} connected` : `Connect ${account.platform}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: isConnected }}
                disabled={isConnected}
                onPress={() => connect(account.platform)}
                style={({ pressed }) => [styles.connectButton, isConnected && styles.connectedButton, pressed && styles.pressed]}>
                <Text style={[styles.connectText, isConnected && styles.connectedText]}>{isConnected ? 'Connected' : 'Connect'}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={[styles.twoColumn, tablet && styles.twoColumnTablet]}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Social Updates</Text>
          {MOCK_SOCIAL_UPDATES.map((update) => <SocialRow key={update.id} platform={update.platform} copy={update.summary} />)}
        </View>
        <View style={styles.panel}>
          <View style={styles.panelHeading}><Text style={styles.panelTitle}>Messages</Text><Text style={styles.mockLabel}>DEMO PREVIEW</Text></View>
          {MOCK_SOCIAL_MESSAGES.map((message) => <SocialRow key={message.id} platform={message.platform} copy={message.preview} />)}
        </View>
      </View>

      <View style={styles.composer}>
        <Text style={styles.panelTitle}>Quick Post</Text>
        <Text style={styles.helper}>Prepare a local demo post. No social network receives this content.</Text>
        <TextInput
          accessibilityLabel="Demo social post"
          multiline
          onChangeText={(value) => { setPostText(value); setConfirmation(null); }}
          placeholder="What’s on your mind?"
          placeholderTextColor="#778391"
          style={styles.composerInput}
          value={postText}
        />
        <View style={styles.chipRow}>
          {MOCK_SOCIAL_ACCOUNTS.map(({ platform }) => {
            const selected = selectedPlatforms.includes(platform);
            return <Pressable accessibilityLabel={`Select ${platform} for demo post`} accessibilityRole="button" accessibilityState={{ selected }} key={platform} onPress={() => togglePlatform(platform)} style={({ pressed }) => [styles.platformChip, selected && styles.platformChipActive, pressed && styles.pressed]}><Text style={[styles.platformChipText, selected && styles.platformChipTextActive]}>{platform}</Text></Pressable>;
          })}
        </View>
        <View style={styles.composerFooter}>
          <Text accessibilityLiveRegion="polite" style={styles.confirmation}>{confirmation ?? 'Demo only · Nothing will be published.'}</Text>
          <Pressable accessibilityLabel="Prepare demo post" accessibilityRole="button" accessibilityState={{ disabled: !canPreparePost }} disabled={!canPreparePost} onPress={preparePost} style={({ pressed }) => [styles.postButton, !canPreparePost && styles.postButtonDisabled, pressed && styles.pressed]}><Text style={styles.postButtonText}>Post</Text></Pressable>
        </View>
      </View>

      <View style={styles.livePanel}>
        <View style={styles.liveHeading}><View style={styles.liveDot} /><Text style={styles.panelTitle}>Live Updates</Text><Text style={styles.mockLabel}>SIMULATED</Text></View>
        <View style={[styles.liveGrid, tablet && styles.liveGridTablet]}>
          {MOCK_SOCIAL_LIVE_UPDATES.map((item) => <View key={item.id} style={styles.liveItem}><Text style={styles.liveLabel}>{item.label}</Text><Text style={styles.liveCopy}>{item.summary}</Text></View>)}
        </View>
      </View>
    </View>
  );
}

function SocialRow({ platform, copy }: { platform: SocialPlatform; copy: string }) {
  return <View style={styles.socialRow}><View style={styles.rowMark}><Text style={styles.rowMarkText}>{PLATFORM_MARKS[platform]}</Text></View><View style={styles.rowCopy}><Text style={styles.rowPlatform}>{platform}</Text><Text numberOfLines={1} style={styles.rowSummary}>{copy}</Text></View><Text style={styles.rowArrow}>›</Text></View>;
}

const styles = StyleSheet.create({
  section: { backgroundColor: '#111820', borderColor: '#2B3947', borderRadius: 22, borderWidth: 1, marginBottom: 52, overflow: 'hidden', padding: 16 },
  headingRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between', marginBottom: 14 },
  headingCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#69E08C', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '900', letterSpacing: -0.45, marginTop: 3 },
  subtitle: { color: '#8C99A7', fontSize: 12, lineHeight: 16, marginTop: 3, maxWidth: 620 },
  demoBadge: { backgroundColor: '#182630', borderColor: '#2D4858', borderRadius: 9, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 4 },
  demoBadgeText: { color: '#8EACBD', fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  groupTitle: { color: '#DCE4EB', fontSize: 13, fontWeight: '900', marginBottom: 7 },
  accountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
  accountCard: { alignItems: 'center', backgroundColor: '#171F28', borderColor: '#2A3541', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 6, minHeight: 50, padding: 7 },
  accountCardPhone: { width: '48.5%' },
  accountCardTablet: { width: '32.4%' },
  platformMark: { alignItems: 'center', backgroundColor: '#22303C', borderRadius: 9, height: 26, justifyContent: 'center', width: 26 },
  platformMarkText: { color: '#EAF2F7', fontSize: 10, fontWeight: '900' },
  accountCopy: { flex: 1, minWidth: 0 },
  platformName: { color: '#F3F6F8', fontSize: 11, fontWeight: '900' },
  connectionState: { color: '#758392', fontSize: 8, marginTop: 1 },
  connectedState: { color: '#69E08C' },
  connectButton: { backgroundColor: '#69E08C', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 5 },
  connectedButton: { backgroundColor: '#1A3025' },
  connectText: { color: '#09140E', fontSize: 8, fontWeight: '900' },
  connectedText: { color: '#69E08C' },
  twoColumn: { gap: 8, marginBottom: 8 },
  twoColumnTablet: { flexDirection: 'row' },
  panel: { backgroundColor: '#171F28', borderColor: '#2A3541', borderRadius: 14, borderWidth: 1, flex: 1, minWidth: 0, padding: 11 },
  panelHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  panelTitle: { color: '#F1F5F8', fontSize: 14, fontWeight: '900' },
  mockLabel: { color: '#6F7F8F', fontSize: 7, fontWeight: '900', letterSpacing: 0.6 },
  socialRow: { alignItems: 'center', borderBottomColor: '#26323D', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 8, minHeight: 40 },
  rowMark: { alignItems: 'center', backgroundColor: '#22313D', borderRadius: 7, height: 24, justifyContent: 'center', width: 24 },
  rowMarkText: { color: '#A9BBC8', fontSize: 8, fontWeight: '900' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowPlatform: { color: '#AEBBC6', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  rowSummary: { color: '#E6EBEF', fontSize: 11, marginTop: 1 },
  rowArrow: { color: '#69E08C', fontSize: 17 },
  composer: { backgroundColor: '#171F28', borderColor: '#2A3541', borderRadius: 14, borderWidth: 1, marginBottom: 8, padding: 11 },
  helper: { color: '#7F8D9B', fontSize: 10, lineHeight: 14, marginTop: 4 },
  composerInput: { backgroundColor: '#10161D', borderColor: '#2B3742', borderRadius: 12, borderWidth: 1, color: '#F4F7F9', fontSize: 13, height: 66, marginTop: 8, paddingHorizontal: 11, paddingVertical: 8, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  platformChip: { backgroundColor: '#202A34', borderColor: '#303D49', borderRadius: 13, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  platformChipActive: { backgroundColor: '#173224', borderColor: '#69E08C' },
  platformChipText: { color: '#8E9AA6', fontSize: 9, fontWeight: '800' },
  platformChipTextActive: { color: '#69E08C' },
  composerFooter: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between', marginTop: 8 },
  confirmation: { color: '#80909D', flex: 1, fontSize: 9, lineHeight: 13 },
  postButton: { backgroundColor: '#69E08C', borderRadius: 13, paddingHorizontal: 16, paddingVertical: 7 },
  postButtonDisabled: { opacity: 0.36 },
  postButtonText: { color: '#09140E', fontSize: 10, fontWeight: '900' },
  livePanel: { backgroundColor: '#151D25', borderColor: '#293641', borderRadius: 14, borderWidth: 1, padding: 11 },
  liveHeading: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  liveDot: { backgroundColor: '#69E08C', borderRadius: 4, height: 7, width: 7 },
  liveGrid: { gap: 7, marginTop: 8 },
  liveGridTablet: { flexDirection: 'row' },
  liveItem: { backgroundColor: '#1B252E', borderRadius: 10, flex: 1, minWidth: 0, padding: 9 },
  liveLabel: { color: '#DCE5EB', fontSize: 10, fontWeight: '900' },
  liveCopy: { color: '#7F8D99', fontSize: 9, lineHeight: 13, marginTop: 2 },
  pressed: { opacity: 0.68 },
});
