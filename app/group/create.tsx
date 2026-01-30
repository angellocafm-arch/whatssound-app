/**
 * WhatsSound — Crear Grupo
 * Conectado a Supabase: selecciona contactos reales, crea grupo en DB
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Avatar } from '../../src/components/ui/Avatar';

// Ionicons web font fix
if (Platform.OS === 'web') {
  const s = document.createElement('style');
  s.textContent = '@font-face{font-family:"Ionicons";src:url("/Ionicons.ttf") format("truetype")}';
  if (!document.querySelector('style[data-ionicons-grp]')) {
    s.setAttribute('data-ionicons-grp', '1');
    document.head.appendChild(s);
  }
}

const SB = 'https://xyehncvvvprrqwnsefcr.supabase.co/rest/v1';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTA4OTgsImV4cCI6MjA4NTIyNjg5OH0.VEaTmqpMA7XdUa-tZ7mXib1ciweD7y5UU4dFGZq3EtQ';

function getHeaders() {
  let token = '';
  try { token = JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').access_token || ''; } catch {}
  return { 'apikey': ANON, 'Authorization': `Bearer ${token || ANON}`, 'Content-Type': 'application/json' };
}

function getCurrentUserId() {
  try { return JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').user?.id || ''; } catch { return ''; }
}

function getCurrentUserName() {
  try { return JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').user?.user_metadata?.display_name || 'Usuario'; } catch { return 'Usuario'; }
}

interface Profile {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  is_dj: boolean;
  dj_name: string | null;
}

export default function CreateGroupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const userId = getCurrentUserId();
      const headers = getHeaders();
      let url = `${SB}/profiles?select=id,display_name,username,avatar_url,is_dj,dj_name&order=display_name.asc`;
      if (userId) url += `&id=neq.${userId}`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (Array.isArray(data)) setProfiles(data);
    } catch (e) {
      console.error('Error fetching profiles:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = profiles.filter(c =>
    (c.display_name || c.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0 || creating) return;
    setCreating(true);
    try {
      const headers = getHeaders();
      const userId = getCurrentUserId();

      // 1. Create the chat
      const chatRes = await fetch(`${SB}/chats`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ type: 'group', name: name.trim(), created_by: userId || null }),
      });
      const chats = await chatRes.json();
      if (!Array.isArray(chats) || chats.length === 0) throw new Error('Failed to create chat');
      const chatId = chats[0].id;

      // 2. Add members (creator as admin + selected as member)
      const members: any[] = [];
      if (userId) members.push({ chat_id: chatId, user_id: userId, role: 'admin' });
      selected.forEach(uid => members.push({ chat_id: chatId, user_id: uid, role: 'member' }));

      await fetch(`${SB}/chat_members`, {
        method: 'POST',
        headers,
        body: JSON.stringify(members),
      });

      // 3. System message
      let creatorName = getCurrentUserName();
      // Try to get display_name from profiles
      if (userId) {
        const profRes = await fetch(`${SB}/profiles?id=eq.${userId}&select=display_name`, { headers });
        const profs = await profRes.json();
        if (profs?.[0]?.display_name) creatorName = profs[0].display_name;
      }

      await fetch(`${SB}/chat_messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ chat_id: chatId, user_id: userId || null, content: `${creatorName} creó el grupo`, is_system: true }),
      });

      // Navigate to the new group
      router.replace(`/group/${chatId}`);
    } catch (e: any) {
      console.error('Error creating group:', e);
      if (Platform.OS === 'web') {
        alert('Error al crear el grupo: ' + (e.message || e));
      } else {
        Alert.alert('Error', 'No se pudo crear el grupo');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear grupo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Group info */}
        <View style={styles.groupInfo}>
          <TouchableOpacity style={styles.photoBtn}>
            <Ionicons name="camera" size={28} color={colors.textMuted} />
          </TouchableOpacity>
          <Input
            placeholder="Nombre del grupo"
            value={name}
            onChangeText={setName}
            maxLength={25}
          />
        </View>

        {/* Selected chips */}
        {selected.length > 0 && (
          <View style={styles.selectedRow}>
            {selected.map(id => {
              const c = profiles.find(x => x.id === id);
              if (!c) return null;
              return (
                <TouchableOpacity key={id} style={styles.selectedChip} onPress={() => toggle(id)}>
                  <Avatar name={c.display_name || c.username} size="xs" />
                  <Text style={styles.selectedName}>{c.display_name || c.username}</Text>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Search */}
        <Input
          placeholder="Buscar contactos..."
          value={search}
          onChangeText={setSearch}
          icon={<Ionicons name="search" size={18} color={colors.textMuted} />}
        />

        {/* Contact list */}
        <Text style={styles.sectionLabel}>CONTACTOS EN WHATSSOUND</Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>No se encontraron contactos</Text>
        ) : (
          filtered.map(contact => (
            <TouchableOpacity
              key={contact.id}
              style={styles.contactItem}
              onPress={() => toggle(contact.id)}
            >
              <Avatar name={contact.display_name || contact.username} size="md" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.display_name || contact.username}</Text>
                <Text style={styles.contactStatus}>
                  {contact.is_dj ? `DJ ${contact.dj_name || ''} ✓` : contact.username || ''}
                </Text>
              </View>
              <View style={[styles.checkbox, selected.includes(contact.id) && styles.checkboxSelected]}>
                {selected.includes(contact.id) && (
                  <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom button */}
      <View style={styles.bottom}>
        <Button
          title={creating ? 'Creando...' : `Crear grupo${selected.length > 0 ? ` (${selected.length})` : ''}`}
          onPress={handleCreate}
          fullWidth
          size="lg"
          disabled={!name.trim() || selected.length === 0 || creating}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  content: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
  groupInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  photoBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  selectedChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  selectedName: { ...typography.caption, color: colors.textPrimary },
  sectionLabel: { ...typography.captionBold, color: colors.textMuted, letterSpacing: 0.5, marginTop: spacing.lg, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  contactItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.divider,
  },
  contactInfo: { flex: 1, gap: 2 },
  contactName: { ...typography.bodyBold, color: colors.textPrimary },
  contactStatus: { ...typography.caption, color: colors.textMuted },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  bottom: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
});
