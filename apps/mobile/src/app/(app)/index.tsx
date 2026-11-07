import { Button, Heading, Notice, Screen, Text, useTheme } from '@aisle/ui/native';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { signOut } from '@/lib/auth';
import { t } from '@/lib/i18n';

const ROLE_KEY = {
  owner: 'home.weddings.role.owner',
  editor: 'home.weddings.role.editor',
  contributor: 'home.weddings.role.contributor',
  viewer: 'home.weddings.role.viewer',
} as const;

export default function Home() {
  const theme = useTheme();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api.me.query() });
  const weddings = useQuery({ queryKey: ['weddings'], queryFn: () => api.wedding.list.query() });

  const loading = me.isPending || weddings.isPending;
  const failed = me.isError || weddings.isError;

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingVertical: 24, gap: 32 }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text size="lead" tone="accent" style={{ fontFamily: theme.fonts.display }}>
              {t('app.name')}
            </Text>
            <Button variant="quiet" label={t('auth.signOut')} onPress={() => void signOut()} />
          </View>

          {loading ? <ActivityIndicator accessibilityLabel={t('common.loading')} /> : null}

          {failed ? (
            <View style={{ gap: 12 }}>
              <Notice tone="danger">{t('common.error.body')}</Notice>
              <Button
                variant="secondary"
                label={t('common.retry')}
                onPress={() => {
                  void me.refetch();
                  void weddings.refetch();
                }}
              />
            </View>
          ) : null}

          {me.data ? (
            <Heading level={1}>{t('home.welcome', { name: me.data.display_name ?? '' })}</Heading>
          ) : null}

          {weddings.data && weddings.data.length === 0 ? (
            <View style={{ gap: 8 }}>
              <Heading level={2}>{t('home.noWedding.title')}</Heading>
              <Text tone="muted">{t('home.noWedding.body')}</Text>
            </View>
          ) : null}

          {weddings.data && weddings.data.length > 0 ? (
            <View>
              <Heading level={3}>{t('home.weddings.title')}</Heading>
              {weddings.data.map((w) => (
                <View
                  key={w.id}
                  style={{
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderColor: theme.color.border,
                    gap: 4,
                  }}
                >
                  <Text size="lead" style={{ fontFamily: theme.fonts.display }}>
                    {[w.partner_a_name, w.partner_b_name].filter(Boolean).join(' & ')}
                  </Text>
                  <Text size="small" tone="muted">
                    {t(ROLE_KEY[w.role as keyof typeof ROLE_KEY])}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}
