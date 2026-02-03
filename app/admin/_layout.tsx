import React, { useState, useEffect } from 'react';
import { View, Text, Platform, Dimensions, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import AdminSidebar from './_sidebar';
import { colors } from '../../src/theme/colors';

const isWide = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth > 768 : true) : Dimensions.get('window').width > 768;

// Only kike and angel can access the dashboard
const ALLOWED_ADMINS = ['kike', 'angel', 'enrique', 'leo'];

function getAdminUser(): string | null {
  if (Platform.OS !== 'web') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const admin = params.get('admin')?.toLowerCase().trim();
    if (admin && ALLOWED_ADMINS.includes(admin)) {
      localStorage.setItem('ws_admin_user', admin);
      return admin;
    }
    return localStorage.getItem('ws_admin_user');
  } catch { return null; }
}

export default function AdminLayout() {
  const [admin, setAdmin] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const user = getAdminUser();
    setAdmin(user);
    setChecked(true);
  }, []);

  if (!checked) return null;

  if (!admin) {
    return (
      <View style={gs.denied}>
        <Text style={gs.deniedIcon}>🔒</Text>
        <Text style={gs.deniedTitle}>Acceso restringido</Text>
        <Text style={gs.deniedText}>Dashboard exclusivo para administradores.{'\n'}Usa ?admin=tunombre en la URL.</Text>
      </View>
    );
  }

  return (
    <View style={{
      flex: 1,
      flexDirection: 'row',
      backgroundColor: '#0a0f1a',
      ...(Platform.OS === 'web' ? { position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 } : {}),
    }}>
      {isWide && <AdminSidebar />}
      <Slot />
    </View>
  );
}

const gs = StyleSheet.create({
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0f1a', padding: 40 },
  deniedIcon: { fontSize: 64, marginBottom: 16 },
  deniedTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  deniedText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
