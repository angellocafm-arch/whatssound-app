/**
 * WhatsSound — GoldenBoostAnimation
 * Animación de celebración cuando alguien recibe un Golden Boost
 * 
 * Efectos:
 * - Confetti dorado cayendo
 * - Trofeo central brillante
 * - Texto con nombre del DJ
 * - Partículas brillantes
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  StyleSheet,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { playGoldenBoostSound } from '../../lib/sounds';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GoldenBoostAnimationProps {
  /** Nombre del DJ que recibe el boost */
  djName: string;
  /** Nombre de quien da el boost (opcional) */
  giverName?: string;
  /** Callback cuando termina la animación */
  onComplete?: () => void;
  /** Duración en ms */
  duration?: number;
}

// Colores dorados para el confetti
const GOLDEN_COLORS = [
  '#FFD700', // Gold
  '#FFC107', // Amber
  '#FFB300', // Orange Gold
  '#FFCA28', // Light Gold
  '#FFA000', // Deep Gold
  '#FFE082', // Pale Gold
  '#D4AF37', // Metallic Gold
];

// Partícula de confetti individual
function ConfettiPiece({ delay, startX }: { delay: number; startX: number }) {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  
  const color = GOLDEN_COLORS[Math.floor(Math.random() * GOLDEN_COLORS.length)];
  const size = 8 + Math.random() * 12;
  const isSquare = Math.random() > 0.5;
  
  useEffect(() => {
    const drift = (Math.random() - 0.5) * 100;
    
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT + 50,
          duration: 3000 + Math.random() * 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: startX + drift,
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3),
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 4000,
          delay: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);
  
  const spin = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });
  
  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          width: size,
          height: isSquare ? size : size * 0.6,
          backgroundColor: color,
          borderRadius: isSquare ? 2 : size / 2,
          transform: [
            { translateY },
            { translateX },
            { rotate: spin },
          ],
          opacity,
        },
      ]}
    />
  );
}

// Partícula brillante (sparkle)
function Sparkle({ delay, x, y }: { delay: number; x: number; y: number }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.delay(300),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);
  
  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          left: x,
          top: y,
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      <Ionicons name="star" size={20} color="#FFD700" />
    </Animated.View>
  );
}

export function GoldenBoostAnimation({
  djName,
  giverName,
  onComplete,
  duration = 4000,
}: GoldenBoostAnimationProps) {
  const [confettiPieces] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      delay: Math.random() * 500,
      startX: Math.random() * SCREEN_WIDTH,
    }))
  );
  
  const [sparkles] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      delay: 200 + i * 150,
      x: SCREEN_WIDTH / 2 - 100 + Math.random() * 200,
      y: SCREEN_HEIGHT / 2 - 150 + Math.random() * 150,
    }))
  );
  
  // Animaciones principales
  const fadeIn = useRef(new Animated.Value(0)).current;
  const trophyScale = useRef(new Animated.Value(0)).current;
  const trophyRotate = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(50)).current;
  const glowPulse = useRef(new Animated.Value(0.5)).current;
  
  useEffect(() => {
    // Reproducir sonido épico
    playGoldenBoostSound();
    
    // Fade in del overlay
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Trofeo aparece con bounce
    Animated.spring(trophyScale, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();
    
    // Trofeo se balancea
    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyRotate, {
          toValue: 10,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(trophyRotate, {
          toValue: -10,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(trophyRotate, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Texto aparece desde abajo
    Animated.spring(textSlide, {
      toValue: 0,
      friction: 6,
      delay: 300,
      useNativeDriver: true,
    }).start();
    
    // Pulso del glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Auto-cerrar después de la duración
    const timer = setTimeout(() => {
      Animated.timing(fadeIn, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onComplete?.());
    }, duration);
    
    return () => clearTimeout(timer);
  }, []);
  
  const trophySpin = trophyRotate.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });
  
  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      {/* Confetti */}
      {confettiPieces.map((piece) => (
        <ConfettiPiece key={piece.id} delay={piece.delay} startX={piece.startX} />
      ))}
      
      {/* Sparkles */}
      {sparkles.map((sparkle) => (
        <Sparkle
          key={sparkle.id}
          delay={sparkle.delay}
          x={sparkle.x}
          y={sparkle.y}
        />
      ))}
      
      {/* Contenido central */}
      <View style={styles.centerContent}>
        {/* Glow detrás del trofeo */}
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowPulse,
              transform: [{ scale: glowPulse.interpolate({
                inputRange: [0.5, 1],
                outputRange: [1, 1.3],
              })}],
            },
          ]}
        />
        
        {/* Trofeo */}
        <Animated.View
          style={[
            styles.trophyContainer,
            {
              transform: [
                { scale: trophyScale },
                { rotate: trophySpin },
              ],
            },
          ]}
        >
          <Ionicons name="trophy" size={100} color="#FFD700" />
        </Animated.View>
        
        {/* Texto */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              transform: [{ translateY: textSlide }],
              opacity: fadeIn,
            },
          ]}
        >
          <Text style={styles.title}>🏆 GOLDEN BOOST 🏆</Text>
          <Text style={styles.djName}>{djName}</Text>
          {giverName && (
            <Text style={styles.giverText}>de {giverName}</Text>
          )}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 9999,
  },
  confetti: {
    position: 'absolute',
    top: 0,
  },
  sparkle: {
    position: 'absolute',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 50,
  },
  trophyContainer: {
    zIndex: 1,
  },
  textContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  djName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  giverText: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
  },
});

export default GoldenBoostAnimation;
