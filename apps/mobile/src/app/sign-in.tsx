import { signInWithEmailSchema } from '@aisle/validation';
import { Button, Heading, Notice, Screen, Text, TextField, useTheme } from '@aisle/ui/native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendMagicLink, signInWithApple, signInWithGoogle } from '@/lib/auth';
import { t } from '@/lib/i18n';

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; email: string }
  | { kind: 'error'; message: string; field?: 'email' };

export default function SignIn() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function onSendLink() {
    const parsed = signInWithEmailSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setStatus({ kind: 'error', field: 'email', message: 'Enter a valid email address' });
      return;
    }
    setStatus({ kind: 'sending' });
    const { error } = await sendMagicLink(parsed.data.email);
    setStatus(
      error
        ? { kind: 'error', message: t('auth.signIn.error') }
        : { kind: 'sent', email: parsed.data.email },
    );
  }

  async function onProvider(fn: () => Promise<{ error: string | null }>) {
    const { error } = await fn();
    if (error) setStatus({ kind: 'error', message: t('auth.signIn.error') });
  }

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text
              size="lead"
              tone="accent"
              style={{ fontFamily: theme.fonts.display, marginBottom: 24 }}
            >
              {t('app.name')}
            </Text>
            <Heading level={1}>{t('auth.signIn.promise')}</Heading>
            <View style={{ height: 40 }} />

            <View style={{ gap: 16 }}>
              {status.kind === 'sent' ? (
                <Notice tone="success">{t('auth.signIn.linkSent', { email: status.email })}</Notice>
              ) : (
                <>
                  <TextField
                    label={t('auth.signIn.emailLabel')}
                    placeholder={t('auth.signIn.emailPlaceholder')}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    returnKeyType="send"
                    onSubmitEditing={onSendLink}
                    {...(status.kind === 'error' && status.field === 'email'
                      ? { error: status.message }
                      : {})}
                  />
                  <Button
                    label={
                      status.kind === 'sending'
                        ? t('auth.signIn.sending')
                        : t('auth.signIn.sendLink')
                    }
                    loading={status.kind === 'sending'}
                    onPress={onSendLink}
                  />
                </>
              )}

              {status.kind === 'error' && !status.field ? (
                <Notice tone="danger">{status.message}</Notice>
              ) : null}

              <Text size="caption" tone="muted" style={{ textAlign: 'center', marginVertical: 8 }}>
                {t('auth.signIn.or')}
              </Text>

              {Platform.OS === 'ios' ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={
                    theme.scheme === 'dark'
                      ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                      : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                  }
                  cornerRadius={theme.radius.control}
                  style={{ height: 48 }}
                  onPress={() => onProvider(signInWithApple)}
                />
              ) : (
                <Button
                  variant="secondary"
                  label={t('auth.signIn.withApple')}
                  onPress={() => onProvider(signInWithApple)}
                />
              )}
              <Button
                variant="secondary"
                label={t('auth.signIn.withGoogle')}
                onPress={() => onProvider(signInWithGoogle)}
              />
            </View>

            <Text size="caption" tone="muted" style={{ marginTop: 32 }}>
              {t('auth.signIn.legal')}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}
