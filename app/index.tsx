/**
 * WhatsSound — Index Route
 * Redirige siempre a welcome como página inicial
 */

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/welcome" />;
}
