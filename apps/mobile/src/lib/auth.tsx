import type { Session } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

/**
 * Deep link the auth server returns to: aisle://auth/callback?next=/
 * It always carries a query string so the magic-link email template can append
 * `&token_hash=…&type=email` for both web and mobile (see README).
 */
export const redirectTo = Linking.createURL('auth/callback', { queryParams: { next: '/' } });

interface AuthState {
  session: Session | null;
  /** True until the stored session has been read on launch. */
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true });

  useEffect(() => {
    void supabase.auth
      .getSession()
      .then(({ data }) => setState({ session: data.session, loading: false }));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setState({ session, loading: false }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => state, [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/** Complete sign-in from a deep link (magic link or OAuth). Returns true on success. */
export async function completeSignInFromUrl(url: string): Promise<boolean> {
  const { queryParams } = Linking.parse(url);
  const code = typeof queryParams?.code === 'string' ? queryParams.code : null;
  const tokenHash = typeof queryParams?.token_hash === 'string' ? queryParams.token_hash : null;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return !error;
  }
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
    return !error;
  }
  return false;
}

export async function sendMagicLink(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
  });
}

/** OAuth through the system browser (Google everywhere; Apple on Android and web). */
async function signInWithBrowser(provider: 'google' | 'apple'): Promise<{ error: string | null }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) return { error: error?.message ?? 'Could not start sign-in' };
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return { error: null }; // cancelled
  return (await completeSignInFromUrl(result.url)) ? { error: null } : { error: 'Sign-in failed' };
}

export function signInWithGoogle() {
  return signInWithBrowser('google');
}

/** Native Sign in with Apple on iOS; browser flow elsewhere. */
export async function signInWithApple(): Promise<{ error: string | null }> {
  if (Platform.OS !== 'ios') return signInWithBrowser('apple');
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) return { error: 'Apple did not return an identity token' };
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) return { error: error.message };
    // Apple only shares the name on first sign-in; keep it.
    const name = [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean)
      .join(' ');
    if (name) await supabase.auth.updateUser({ data: { full_name: name } });
    return { error: null };
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'ERR_REQUEST_CANCELED')
      return { error: null };
    return { error: 'Sign in with Apple failed' };
  }
}

export function signOut() {
  return supabase.auth.signOut();
}
