/**
 * WhatsSound — GoldenBoostButton
 * Botón para dar Golden Boost a un DJ
 * 
 * Mecánica:
 * - Long press para confirmar (evita toques accidentales)
 * - Animación de brillo cuando está disponible
 * - Estado visual de cooldown cuando no hay disponibles
 * - Confetti dorado al dar
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Modal,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import GoldenBoostAnimation from './GoldenBoostAnimation';

interface GoldenBoostButtonProps {
  /** ID del DJ que recibe el boost */
  djId: string;
  /** Nombre del DJ para mostrar en confirmación */
  djName: string;
  /** ID de la sesión actual (opcional) */
  sessionId?: string;
  /** Callback cuando se da el boost exitosamente */
  onBoostGiven?: () => void;
  /** Tamaño del botón */
  size?: 'small' | 'medium' | 'large';
  /** Mostrar solo icono sin texto */
  iconOnly?: boolean;
}

const LONG_PRESS_DURATION = 800; // ms para activar

export function GoldenBoostButton({
  djId,
  djName,
  sessionId,
  onBoostGiven,
  size = 'medium',
  iconOnly = false,
}: GoldenBoostButtonProps) {
  const { user } = useAuth();
  const [available, setAvailable] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isGiving, setIsGiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animaciones
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pressProgress = useRef(new Animated.Value(0)).current;
  
  // Tamaños según prop
  const sizes = {
    small: { icon: 20, padding: 8, fontSize: 12 },
    medium: { icon: 28, padding: 12, fontSize: 14 },
    large: { icon: 36, padding: 16, fontSize: 16 },
  };
  const s = sizes[size];

  // Cargar disponibilidad al montar
  useEffect(() => {
    if (!user) return;
    loadAvailability();
  }, [user]);

  // Animación de pulso cuando está disponible
  useEffect(() => {
    if (available > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      );
      
      pulse.start();
      glow.start();
      
      return () => {
        pulse.stop();
        glow.stop();
      };
    }
  }, [available]);

  const loadAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('ws_profiles')
        .select('golden_boost_available')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      setAvailable(data?.golden_boost_available ?? 0);
    } catch (err) {
      console.error('[GoldenBoost] Error cargando disponibilidad:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePressIn = () => {
    if (available < 1 || isGiving) return;
    
    // Vibración suave al empezar a presionar
    if (Platform.OS !== 'web') {
      Vibration.vibrate(10);
    }
    
    // Animar progreso del long press
    Animated.timing(pressProgress, {
      toValue: 1,
      duration: LONG_PRESS_DURATION,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    // Cancelar si soltó antes de tiempo
    pressProgress.stopAnimation();
    Animated.timing(pressProgress, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleLongPress = () => {
    if (available < 1 || isGiving) return;
    
    // Vibración de confirmación
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 50, 50, 50]);
    }
    
    setShowConfirm(true);
  };

  const giveGoldenBoost = async () => {
    if (!user || isGiving) return;
    
    setIsGiving(true);
    setError(null);
    setShowConfirm(false);
    
    try {
      const { error } = await supabase
        .from('ws_golden_boosts')
        .insert({
          from_user_id: user.id,
          to_dj_id: djId,
          session_id: sessionId || null,
        });
      
      if (error) throw error;
      
      // Actualizar disponibilidad local
      setAvailable(prev => prev - 1);
      
      // Mostrar animación de celebración
      setShowAnimation(true);
      
      // Vibración de éxito
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 100, 50, 100, 50, 200]);
      }
      
      // Callback
      onBoostGiven?.();
      
      // Ocultar animación después de 4 segundos
      setTimeout(() => setShowAnimation(false), 4000);
      
    } catch (err: any) {
      console.error('[GoldenBoost] Error:', err);
      setError(err.message || 'Error al dar Golden Boost');
    } finally {
      setIsGiving(false);
    }
  };

  // No mostrar si es el mismo usuario o no está autenticado
  if (!user || user.id === djId) {
    return null;
  }

  const isDisabled = available < 1 || isGiving || isLoading;
  
  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.6)'],
  });

  const progressWidth = pressProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: pulseAnim }],
            shadowColor: available > 0 ? '#FFD700' : '#666',
            shadowOpacity: available > 0 ? 0.5 : 0,
          },
        ]}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={handleLongPress}
          delayLongPress={LONG_PRESS_DURATION}
          disabled={isDisabled}
          style={({ pressed }) => [
            styles.button,
            {
              padding: s.padding,
              backgroundColor: isDisabled ? '#333' : '#1a1a1a',
              opacity: pressed && !isDisabled ? 0.8 : 1,
            },
          ]}
        >
          {/* Barra de progreso del long press */}
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
                backgroundColor: '#FFD700',
              },
            ]}
          />
          
          {/* Contenido del botón */}
          <View style={styles.content}>
            <Ionicons
              name="trophy"
              size={s.icon}
              color={isDisabled ? '#666' : '#FFD700'}
            />
            {!iconOnly && (
              <Text
                style={[
                  styles.text,
                  {
                    fontSize: s.fontSize,
                    color: isDisabled ? '#666' : '#FFD700',
                  },
                ]}
              >
                {isLoading ? '...' : available > 0 ? `${available}` : '0'}
              </Text>
            )}
          </View>
          
          {/* Indicador de mantener presionado */}
          {available > 0 && !iconOnly && (
            <Text style={styles.hint}>Mantén presionado</Text>
          )}
        </Pressable>
      </Animated.View>

      {/* Modal de confirmación */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="trophy" size={60} color="#FFD700" />
            <Text style={styles.modalTitle}>¿Dar Golden Boost?</Text>
            <Text style={styles.modalSubtitle}>
              Darás tu Golden Boost a{'\n'}
              <Text style={styles.djName}>{djName}</Text>
            </Text>
            <Text style={styles.modalWarning}>
              Solo tienes {available} disponible{available !== 1 ? 's' : ''}
            </Text>
            
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.confirmButton}
                onPress={giveGoldenBoost}
              >
                <Ionicons name="trophy" size={20} color="#000" />
                <Text style={styles.confirmText}>¡Darlo!</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Animación de celebración */}
      {showAnimation && (
        <GoldenBoostAnimation
          djName={djName}
          onComplete={() => setShowAnimation(false)}
        />
      )}

      {/* Toast de error */}
      {error && (
        <View style={styles.errorToast}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 5,
  },
  button: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    opacity: 0.3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  text: {
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 9,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    maxWidth: 320,
    width: '100%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 15,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  djName: {
    fontWeight: 'bold',
    color: '#FFD700',
  },
  modalWarning: {
    fontSize: 14,
    color: '#888',
    marginTop: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 25,
    gap: 15,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    backgroundColor: '#333',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    backgroundColor: '#FFD700',
  },
  confirmText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Error toast
  errorToast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 10,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
  },
});

export default GoldenBoostButton;
