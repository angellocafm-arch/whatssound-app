/**
 * WhatsSound — AlbumCover
 * Carátula de álbum con skeleton y fallback de nota musical
 */

import React, { useState } from 'react';
import {
  Image,
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

interface AlbumCoverProps {
  uri?: string | null;
  size?: number;
  style?: ViewStyle;
  borderRadiusSize?: number;
}

export function AlbumCover({
  uri,
  size = 56,
  style,
  borderRadiusSize = borderRadius.md,
}: AlbumCoverProps) {
  const [loading, setLoading] = useState(!!uri);
  const [error, setError] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Pulse animation for skeleton
  React.useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [loading]);

  const handleLoad = () => {
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: borderRadiusSize,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...style,
  };

  // No URI or error: show fallback icon
  if (!uri || error) {
    return (
      <View style={[containerStyle, styles.fallback]}>
        <Ionicons 
          name="musical-notes" 
          size={size * 0.4} 
          color={colors.textMuted} 
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {/* Skeleton while loading */}
      {loading && (
        <Animated.View 
          style={[
            styles.skeleton, 
            { opacity: pulseAnim }
          ]}
        >
          <Ionicons 
            name="musical-notes" 
            size={size * 0.3} 
            color={colors.textMuted} 
          />
        </Animated.View>
      )}

      {/* Image */}
      <Animated.Image
        source={{ uri }}
        style={[
          styles.image,
          { 
            width: size, 
            height: size,
            opacity: fadeAnim,
          }
        ]}
        resizeMode="cover"
        onLoad={handleLoad}
        onError={handleError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
  },
  skeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default AlbumCover;
