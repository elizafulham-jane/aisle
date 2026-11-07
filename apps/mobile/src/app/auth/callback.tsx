import { Screen, Text } from '@aisle/ui/native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { completeSignInFromUrl } from '@/lib/auth';
import { t } from '@/lib/i18n';

/** Landing screen for aisle://auth/callback (magic links and OAuth on Android). */
export default function AuthCallback() {
  const url = Linking.useLinkingURL();

  useEffect(() => {
    if (!url) return;
    void completeSignInFromUrl(url).then(() => router.replace('/'));
  }, [url]);

  return (
    <Screen style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <ActivityIndicator />
      <Text tone="muted">{t('common.loading')}</Text>
    </Screen>
  );
}
