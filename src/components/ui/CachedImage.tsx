/**
 * WhatsSound — CachedImage
 * Imagen con caché, skeleton mientras carga, y fallback
 */

import React, { useState } from 'react';
import {
  Image,
  View,
  StyleSheet,
  Animated,
  ImageSourcePropType,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';

interface CachedImageProps {
  source: { uri: string } | ImageSourcePropType;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  fallback?: ImageSourcePropType;
  showSkeleton?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export function CachedImage({
  source,
  style,
  containerStyle,
  fallback,
  showSkeleton = true,
  resizeMode = 'cover',
}: CachedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

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

  const imageSource = error && fallback ? fallback : source;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Skeleton mientras carga */}
      {loading && showSkeleton && (
        <Animated.View style={[styles.skeleton, style as ViewStyle]}>
          <View style={styles.shimmer} />
        </Animated.View>
      )}

      {/* Imagen */}
      <Animated.Image
        source={imageSource}
        style={[style, { opacity: fadeAnim }]}
        resizeMode={resizeMode}
        onLoad={handleLoad}
        onError={handleError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  skeleton: {
    position: 'absolute',
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  shimmer: {
    flex: 1,
    backgroundColor: colors.border,
    opacity: 0.3,
  },
});

export default CachedImage;
