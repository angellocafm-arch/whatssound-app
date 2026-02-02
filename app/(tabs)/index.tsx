/**
 * WhatsSound — Index redirect
 * Redirects to the Live tab (main screen)
 */

import { Redirect } from 'expo-router';

export default function IndexRedirect() {
  return <Redirect href="/(tabs)/live" />;
}
