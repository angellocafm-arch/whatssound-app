/**
 * WhatsSound — LiveActivityFeed
 * Feed de actividad en tiempo real simulado
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

const NAMES = ['María', 'Carlos', 'Ana', 'Javi', 'Laura', 'Pablo', 'Sara', 'Luis', 'Elena', 'Diego'];
const DJS = ['DJ Carlos', 'Luna DJ', 'MC Raúl', 'Sarah B', 'Paco Techno', 'DJ Marta'];
const ACTIONS = [
  { type: 'dB', template: (name: string, dj: string, amount: number) => `${name} dio ${amount} dB a ${dj}` },
  { type: 'join', template: (name: string, dj: string) => `${name} se unió a la sesión de ${dj}` },
  { type: 'boost', template: (name: string, dj: string) => `${name} dio Golden Boost a ${dj} 🏆` },
];

interface Activity {
  id: number;
  text: string;
  type: string;
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const generateActivity = (): Activity => {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const dj = DJS[Math.floor(Math.random() * DJS.length)];
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const amount = Math.floor(Math.random() * 20) + 5;

    return {
      id: Date.now(),
      text: action.type === 'dB' 
        ? action.template(name, dj, amount)
        : action.template(name, dj, 0),
      type: action.type,
    };
  };

  useEffect(() => {
    // Initial activities
    setActivities([generateActivity(), generateActivity()]);

    const interval = setInterval(() => {
      const newActivity = generateActivity();
      
      // Fade animation
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setActivities(prev => [newActivity, prev[0]].filter(Boolean));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>En vivo</Text>
      </View>

      <View style={styles.feed}>
        {activities.map((activity, idx) => (
          <Animated.View
            key={activity.id}
            style={[
              styles.activityRow,
              idx === 0 && { opacity: fadeAnim },
            ]}
          >
            <Text style={styles.activityText}>{activity.text}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  liveText: {
    ...typography.captionBold,
    color: colors.error,
    fontSize: 11,
  },
  feed: {
    gap: spacing.xs,
  },
  activityRow: {
    paddingVertical: spacing.xs,
  },
  activityText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
  },
});

export default LiveActivityFeed;
