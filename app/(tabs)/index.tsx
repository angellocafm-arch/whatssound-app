/**
 * WhatsSound — Index redirect
 * Redirects to the Chats tab (main screen like WhatsApp)
 */

import { Redirect } from 'expo-router';

export default function IndexRedirect() {
  return <Redirect href="/(tabs)/chats" />;
}
