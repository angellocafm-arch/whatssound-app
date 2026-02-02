import React from 'react';
import { View, Platform, Dimensions } from 'react-native';
import { Slot } from 'expo-router';
import AdminSidebar from './_sidebar';

const isWide = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth > 768 : true) : Dimensions.get('window').width > 768;

export default function AdminLayout() {
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
