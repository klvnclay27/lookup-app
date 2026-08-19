import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/auth-provider';
import { recoverEmailSession, recoverPasswordSession, requestPasswordReset, requestUsernameRecovery, signInWithIdentifier, signOut, signUpWithEmail, updateRecoveredPassword } from '@/services/auth';
import { getCurrentUserProfile, updateCurrentUserProfile } from '@/services/backend-client';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const linkingUrl = Linking.useURL();
  const { recovery, usernameRecovery } = useLocalSearchParams<{ recovery?: string; usernameRecovery?: string }>();
  const { configured, loading: sessionLoading, session } = useAuth();
  const authenticatedUserId = session?.user.id;
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [accountUsername, setAccountUsername] = useState<string | undefined>();
  const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'available' | 'error'>('idle');
  const [createMode, setCreateMode] = useState(false);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(recovery === 'true');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const processedRecoveryUrl = useRef<string | null>(null);

  const loadAccountProfile = useCallback(async () => {
    if (!authenticatedUserId) return;

    setProfileStatus('loading');
    try {
      const result = await getCurrentUserProfile();
      if (result.state !== 'available') {
        setProfileStatus('error');
        return;
      }

      setAccountUsername(result.data.username);
      setUsername(result.data.username ?? '');
      setProfileStatus('available');
    } catch {
      setProfileStatus('error');
    }
  }, [authenticatedUserId]);

  useEffect(() => {
    if (!authenticatedUserId) {
      setAccountUsername(undefined);
      setProfileStatus('idle');
      return;
    }
    void loadAccountProfile();
  }, [authenticatedUserId, loadAccountProfile]);

  useEffect(() => {
    if (!linkingUrl || processedRecoveryUrl.current === linkingUrl) return;
    const isUsernameRecovery = usernameRecovery === 'true' || linkingUrl.includes('usernameRecovery=true');
    const hasRecoveryCredentials = linkingUrl.includes('type=recovery')
      || linkingUrl.includes('token_hash=')
      || linkingUrl.includes('code=')
      || linkingUrl.includes('access_token=');
    if (!hasRecoveryCredentials) return;

    processedRecoveryUrl.current = linkingUrl;
    if (isUsernameRecovery) {
      setSubmitting(true);
      setMessage(null);
      void recoverEmailSession(linkingUrl).then((error) => {
        setSubmitting(false);
        setMessage(error ?? 'Email verified. Your username is shown below.');
        router.replace('/sign-in');
      });
      return;
    }
    setRecoveryMode(true);
    setSubmitting(true);
    setMessage(null);
    void recoverPasswordSession(linkingUrl).then((result) => {
      setSubmitting(false);
      if (result.error) {
        setRecoveryMode(false);
        setMessage(result.error);
        router.replace('/sign-in');
        return;
      }
      setRecoveryMode(true);
      router.replace({ pathname: '/sign-in', params: { recovery: 'true' } });
    });
  }, [linkingUrl, usernameRecovery]);

  const submit = async (mode: 'sign-in' | 'sign-up') => {
    setSubmitting(true);
    setMessage(null);
    const result = mode === 'sign-in'
      ? await signInWithIdentifier(email, password)
      : await signUpWithEmail(email, password, username);
    setSubmitting(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }
    if (result.session) router.replace('/');
    else setMessage('Check your email to confirm your account, then sign in.');
  };

  const handleCreateAccount = () => {
    if (!createMode) {
      setCreateMode(true);
      setMessage(null);
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username.trim())) {
      setMessage('Username must be 3–24 characters using letters, numbers, or underscores.');
      return;
    }
    void submit('sign-up');
  };

  const handleForgotUsername = async () => {
    if (!email.trim() || !email.includes('@')) {
      setMessage('Enter your email address first.');
      return;
    }
    setSubmitting(true);
    await requestUsernameRecovery(email);
    setSubmitting(false);
    setMessage('If an account matches that email, username recovery instructions have been sent.');
  };

  const handleSaveUsername = async () => {
    const normalized = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(normalized)) {
      setMessage('Username must be 3–24 characters using letters, numbers, or underscores.');
      return;
    }
    setSubmitting(true);
    const result = await updateCurrentUserProfile({ username: normalized });
    if (result.state !== 'available') {
      setSubmitting(false);
      setMessage(result.error.statusCode === 409 ? 'That username is unavailable.' : result.error.message);
      return;
    }
    const refreshed = await getCurrentUserProfile();
    setSubmitting(false);
    const profile = refreshed.state === 'available' ? refreshed.data : result.data;
    setAccountUsername(profile.username);
    setUsername(profile.username ?? '');
    setMessage('Username saved.');
  };

  const handleSignOut = async () => {
    setSubmitting(true);
    const error = await signOut();
    setSubmitting(false);
    setMessage(error ?? 'You are signed out.');
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      setMessage('Enter your email address first.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    const error = await requestPasswordReset(email);
    setSubmitting(false);
    setMessage(error ?? 'Check your email for a password reset link.');
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      setMessage('Use at least 8 characters for your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('The passwords do not match.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    const error = await updateRecoveredPassword(newPassword);
    if (error) {
      setSubmitting(false);
      setMessage(error);
      return;
    }

    await signOut();
    setSubmitting(false);
    setRecoveryMode(false);
    setNewPassword('');
    setConfirmPassword('');
    setMessage('Password updated. Sign in with your new password.');
    router.replace('/sign-in');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32, paddingTop: insets.top + 32 }]} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>Back</Text></Pressable>
        <View style={styles.wordmark}><Text style={styles.look}>look</Text><Text style={styles.up}>UP</Text></View>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>LOOKUP ACCOUNT</Text>
          <Text style={styles.title}>{recoveryMode ? 'Choose a new password' : session ? 'Your account' : 'Welcome to LookUP'}</Text>
          <Text style={styles.subtitle}>{recoveryMode ? 'Enter and confirm your new LookUP password.' : session ? `Signed in as ${session.user.email ?? 'LookUP user'}` : createMode ? 'Create your friends-beta account.' : 'Sign in for your friends-beta account.'}</Text>

          {!configured ? <Text style={styles.message}>Supabase Auth is not configured for this build.</Text> : sessionLoading || (submitting && recoveryMode && !session) ? <ActivityIndicator color="#1FA968" /> : recoveryMode ? (
            <>
              <TextInput autoCapitalize="none" autoComplete="new-password" onChangeText={setNewPassword} placeholder="New password" placeholderTextColor="#8290A2" secureTextEntry style={styles.input} value={newPassword} />
              <TextInput autoCapitalize="none" autoComplete="new-password" onChangeText={setConfirmPassword} onSubmitEditing={handleUpdatePassword} placeholder="Confirm new password" placeholderTextColor="#8290A2" secureTextEntry style={styles.input} value={confirmPassword} />
              {message ? <Text style={styles.message}>{message}</Text> : null}
              <Pressable disabled={submitting || !newPassword || !confirmPassword} onPress={handleUpdatePassword} style={({ pressed }) => [styles.primaryButton, (submitting || !newPassword || !confirmPassword) && styles.disabled, pressed && styles.pressed]}>{submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Update password</Text>}</Pressable>
            </>
          ) : session ? (
            <>
              {profileStatus === 'idle' || profileStatus === 'loading' ? (
                <View accessibilityLiveRegion="polite" style={styles.profileState}>
                  <ActivityIndicator color="#1FA968" />
                  <Text style={styles.profileStateText}>Loading your account…</Text>
                </View>
              ) : profileStatus === 'error' ? (
                <View accessibilityLiveRegion="polite" style={styles.profileState}>
                  <Text style={styles.profileErrorText}>We couldn’t load your account details. Please try again.</Text>
                  <Pressable accessibilityRole="button" onPress={loadAccountProfile} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Retry</Text></Pressable>
                </View>
              ) : (
                <>
                  <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={setUsername} placeholder="Choose a username" placeholderTextColor="#8290A2" style={styles.input} value={username} />
                  <Pressable disabled={submitting || username.trim().toLowerCase() === accountUsername} onPress={handleSaveUsername} style={({ pressed }) => [styles.primaryButton, (submitting || username.trim().toLowerCase() === accountUsername) && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>{accountUsername ? 'Update username' : 'Set username'}</Text></Pressable>
                </>
              )}
              <Pressable disabled={submitting} onPress={handleSignOut} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Sign out</Text></Pressable>
            </>
          ) : (
            <>
              <TextInput autoCapitalize="none" autoComplete={createMode ? 'email' : undefined} autoCorrect={false} keyboardType={createMode ? 'email-address' : 'default'} onChangeText={setEmail} placeholder={createMode ? 'Email' : 'Email or username'} placeholderTextColor="#8290A2" style={styles.input} value={email} />
              {createMode ? <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={setUsername} placeholder="Username" placeholderTextColor="#8290A2" style={styles.input} value={username} /> : null}
              <TextInput autoCapitalize="none" autoComplete="password" onChangeText={setPassword} placeholder="Password" placeholderTextColor="#8290A2" secureTextEntry style={styles.input} value={password} />
              {!createMode ? <View style={styles.forgotRow}><Pressable accessibilityRole="button" disabled={submitting} onPress={handleForgotUsername} style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}><Text style={styles.forgotText}>Forgot username?</Text></Pressable><Pressable accessibilityRole="button" disabled={submitting} onPress={handleForgotPassword} style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}><Text style={styles.forgotText}>Forgot password?</Text></Pressable></View> : null}
              {message ? <Text style={styles.message}>{message}</Text> : null}
              {!createMode ? <Pressable disabled={submitting || !email.trim() || !password} onPress={() => submit('sign-in')} style={({ pressed }) => [styles.primaryButton, (submitting || !email.trim() || !password) && styles.disabled, pressed && styles.pressed]}>{submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Sign in</Text>}</Pressable> : null}
              <Pressable disabled={submitting || (createMode && (!email.trim() || !username.trim() || !password))} onPress={handleCreateAccount} style={({ pressed }) => [styles.secondaryButton, (submitting || (createMode && (!email.trim() || !username.trim() || !password))) && styles.disabled, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Create account</Text></Pressable>
              {createMode ? <Pressable onPress={() => { setCreateMode(false); setMessage(null); }} style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}><Text style={styles.forgotText}>Back to sign in</Text></Pressable> : null}
            </>
          )}
          {session && message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#A4B6C9', flex: 1 },
  content: { alignSelf: 'center', flexGrow: 1, justifyContent: 'center', maxWidth: 520, paddingHorizontal: 22, width: '100%' },
  backButton: { alignSelf: 'flex-start', marginBottom: 24, paddingVertical: 8 },
  backText: { color: '#30445E', fontSize: 14, fontWeight: '700' },
  wordmark: { alignItems: 'baseline', alignSelf: 'center', flexDirection: 'row', marginBottom: 22 },
  look: { color: '#14243A', fontSize: 34, fontWeight: '900', letterSpacing: -2 },
  up: { color: '#1FA968', fontSize: 34, fontWeight: '900', letterSpacing: -2 },
  card: { backgroundColor: '#E3E9F0', borderColor: 'rgba(70,92,118,0.16)', borderRadius: 24, borderWidth: 1, gap: 14, padding: 26 },
  eyebrow: { color: '#1FA968', fontSize: 11, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: '#14243A', fontSize: 28, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { color: '#66758A', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  input: { backgroundColor: '#F7FAFD', borderColor: '#C9D5E1', borderRadius: 14, borderWidth: 1, color: '#14243A', fontSize: 15, height: 50, paddingHorizontal: 15 },
  primaryButton: { alignItems: 'center', backgroundColor: '#1FA968', borderRadius: 14, height: 50, justifyContent: 'center', marginTop: 4 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', borderColor: '#9EADBD', borderRadius: 14, borderWidth: 1, height: 50, justifyContent: 'center' },
  secondaryButtonText: { color: '#30445E', fontSize: 15, fontWeight: '800' },
  profileState: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  profileStateText: { color: '#66758A', fontSize: 14, lineHeight: 20 },
  profileErrorText: { color: '#5B3B3B', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  retryButton: { alignItems: 'center', borderColor: '#9EADBD', borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 42, paddingHorizontal: 24 },
  forgotButton: { alignSelf: 'flex-end', marginTop: -5, paddingVertical: 4 },
  forgotRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  forgotText: { color: '#1B7C54', fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  message: { color: '#5B3B3B', fontSize: 13, lineHeight: 18 },
});
