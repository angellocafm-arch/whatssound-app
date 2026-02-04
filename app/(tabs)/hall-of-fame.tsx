/**
 * WhatsSound — Hall of Fame
 * Ranking semanal de DJs con más Golden Boosts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { formatDistanceToNow, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

interface DJRanking {
  id: string;
  displayName: string;
  avatarUrl?: string;
  goldenBoostsReceived: number;
  goldenBoostsThisWeek: number;
  badge: string;
  rank: number;
}

const BADGE_ICONS: Record<string, string> = {
  none: '',
  rising_star: '🌟',
  fan_favorite: '⭐',
  verified: '✓',
  hall_of_fame: '🏆',
};

export default function HallOfFameScreen() {
  const [rankings, setRankings] = useState<DJRanking[]>([]);
  const [weeklyRankings, setWeeklyRankings] = useState<DJRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'weekly' | 'alltime'>('weekly');

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      // Ranking de todos los tiempos
      const { data: allTimeData, error: allTimeError } = await supabase
        .from('ws_profiles')
        .select('id, display_name, avatar_url, golden_boosts_received, golden_badge')
        .gt('golden_boosts_received', 0)
        .order('golden_boosts_received', { ascending: false })
        .limit(50);

      if (allTimeError) throw allTimeError;

      const allTimeRankings: DJRanking[] = (allTimeData || []).map((dj, index) => ({
        id: dj.id,
        displayName: dj.display_name || 'DJ',
        avatarUrl: dj.avatar_url,
        goldenBoostsReceived: dj.golden_boosts_received,
        goldenBoostsThisWeek: 0,
        badge: dj.golden_badge || 'none',
        rank: index + 1,
      }));

      setRankings(allTimeRankings);

      // Ranking de esta semana
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Lunes
      
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('ws_golden_boosts')
        .select(`
          to_dj_id,
          receiver:ws_profiles!to_dj_id(
            id,
            display_name,
            avatar_url,
            golden_boosts_received,
            golden_badge
          )
        `)
        .gte('created_at', weekStart.toISOString());

      if (weeklyError) throw weeklyError;

      // Agrupar por DJ
      const djCounts: Record<string, { dj: any; count: number }> = {};
      (weeklyData || []).forEach((boost) => {
        const djId = boost.to_dj_id;
        if (!djCounts[djId]) {
          djCounts[djId] = { dj: boost.receiver, count: 0 };
        }
        djCounts[djId].count++;
      });

      // Convertir a array y ordenar
      const weeklyRankingsData: DJRanking[] = Object.entries(djCounts)
        .map(([id, data], index) => ({
          id,
          displayName: (data.dj as any)?.display_name || 'DJ',
          avatarUrl: (data.dj as any)?.avatar_url,
          goldenBoostsReceived: (data.dj as any)?.golden_boosts_received || 0,
          goldenBoostsThisWeek: data.count,
          badge: (data.dj as any)?.golden_badge || 'none',
          rank: 0, // Se asignará después de ordenar
        }))
        .sort((a, b) => b.goldenBoostsThisWeek - a.goldenBoostsThisWeek)
        .map((dj, index) => ({ ...dj, rank: index + 1 }));

      setWeeklyRankings(weeklyRankingsData);
    } catch (error) {
      console.error('[HallOfFame] Error cargando rankings:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRankings();
  };

  const currentRankings = activeTab === 'weekly' ? weeklyRankings : rankings;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Hall of Fame',
          headerStyle: { backgroundColor: '#0B141A' },
          headerTintColor: '#FFD700',
        }}
      />

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FFD700"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="trophy" size={48} color="#FFD700" />
          <Text style={styles.headerTitle}>Hall of Fame</Text>
          <Text style={styles.headerSubtitle}>
            Los DJs más reconocidos por la comunidad
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
            onPress={() => setActiveTab('weekly')}
          >
            <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>
              Esta Semana
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'alltime' && styles.tabActive]}
            onPress={() => setActiveTab('alltime')}
          >
            <Text style={[styles.tabText, activeTab === 'alltime' && styles.tabTextActive]}>
              Todos los Tiempos
            </Text>
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
        ) : currentRankings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>
              {activeTab === 'weekly'
                ? 'Aún no hay Golden Boosts esta semana'
                : 'Aún no hay Golden Boosts'}
            </Text>
          </View>
        ) : (
          <>
            {/* Podio (Top 3) */}
            {currentRankings.length >= 3 && (
              <View style={styles.podium}>
                {/* Segundo lugar */}
                <PodiumItem dj={currentRankings[1]} position={2} tab={activeTab} />
                {/* Primer lugar */}
                <PodiumItem dj={currentRankings[0]} position={1} tab={activeTab} />
                {/* Tercer lugar */}
                <PodiumItem dj={currentRankings[2]} position={3} tab={activeTab} />
              </View>
            )}

            {/* Lista del resto */}
            <View style={styles.list}>
              {currentRankings.slice(3).map((dj) => (
                <Pressable
                  key={dj.id}
                  style={styles.listItem}
                  onPress={() => router.push(`/profile/${dj.id}`)}
                >
                  <Text style={styles.listRank}>#{dj.rank}</Text>
                  
                  {dj.avatarUrl ? (
                    <Image source={{ uri: dj.avatarUrl }} style={styles.listAvatar} />
                  ) : (
                    <View style={styles.listAvatarPlaceholder}>
                      <Ionicons name="person" size={20} color="#888" />
                    </View>
                  )}
                  
                  <View style={styles.listInfo}>
                    <View style={styles.listNameRow}>
                      <Text style={styles.listName}>{dj.displayName}</Text>
                      {BADGE_ICONS[dj.badge] && (
                        <Text style={styles.listBadge}>{BADGE_ICONS[dj.badge]}</Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.listCount}>
                    <Ionicons name="trophy" size={16} color="#FFD700" />
                    <Text style={styles.listCountText}>
                      {activeTab === 'weekly' ? dj.goldenBoostsThisWeek : dj.goldenBoostsReceived}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.infoText}>
            🏆 Los DJs reciben Golden Boosts de sus fans{'\n'}
            Cada usuario puede dar 1 Golden Boost por semana
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

function PodiumItem({ 
  dj, 
  position, 
  tab 
}: { 
  dj: DJRanking; 
  position: 1 | 2 | 3;
  tab: 'weekly' | 'alltime';
}) {
  const isFirst = position === 1;
  const colors = {
    1: '#FFD700', // Gold
    2: '#C0C0C0', // Silver
    3: '#CD7F32', // Bronze
  };
  const height = { 1: 120, 2: 90, 3: 80 };

  return (
    <Pressable
      style={[styles.podiumItem, { marginTop: isFirst ? 0 : 30 }]}
      onPress={() => router.push(`/profile/${dj.id}`)}
    >
      {/* Avatar */}
      {dj.avatarUrl ? (
        <Image
          source={{ uri: dj.avatarUrl }}
          style={[
            styles.podiumAvatar,
            {
              width: isFirst ? 80 : 60,
              height: isFirst ? 80 : 60,
              borderRadius: isFirst ? 40 : 30,
              borderColor: colors[position],
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.podiumAvatarPlaceholder,
            {
              width: isFirst ? 80 : 60,
              height: isFirst ? 80 : 60,
              borderRadius: isFirst ? 40 : 30,
              borderColor: colors[position],
            },
          ]}
        >
          <Ionicons name="person" size={isFirst ? 36 : 28} color="#888" />
        </View>
      )}
      
      {/* Medal */}
      <View style={[styles.medal, { backgroundColor: colors[position] }]}>
        <Text style={styles.medalText}>{position}</Text>
      </View>
      
      {/* Name */}
      <Text style={styles.podiumName} numberOfLines={1}>
        {dj.displayName}
      </Text>
      
      {/* Badge */}
      {BADGE_ICONS[dj.badge] && (
        <Text style={styles.podiumBadge}>{BADGE_ICONS[dj.badge]}</Text>
      )}
      
      {/* Count */}
      <View style={styles.podiumCount}>
        <Ionicons name="trophy" size={14} color="#FFD700" />
        <Text style={styles.podiumCountText}>
          {tab === 'weekly' ? dj.goldenBoostsThisWeek : dj.goldenBoostsReceived}
        </Text>
      </View>
      
      {/* Pedestal */}
      <View style={[styles.pedestal, { height: height[position], backgroundColor: colors[position] + '40' }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B141A',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FFD70020',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
  },
  tabTextActive: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  podiumItem: {
    alignItems: 'center',
    width: 100,
  },
  podiumAvatar: {
    borderWidth: 3,
  },
  podiumAvatarPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  medal: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -12,
    zIndex: 1,
  },
  medalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    maxWidth: 90,
  },
  podiumBadge: {
    fontSize: 14,
    marginTop: 2,
  },
  podiumCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  podiumCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  pedestal: {
    width: 80,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: 10,
  },
  list: {
    paddingHorizontal: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  listRank: {
    width: 40,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
  },
  listAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  listAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  listBadge: {
    fontSize: 14,
  },
  listCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listCountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  info: {
    padding: 20,
    marginTop: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
