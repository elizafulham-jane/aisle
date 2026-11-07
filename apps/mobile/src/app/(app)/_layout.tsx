import { Stack } from 'expo-router';

/**
 * Signed-in area. Phase 1 replaces this stack with the bottom tabs from the spec:
 * Home, Plan, Guests, Vendors, Budget.
 */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
