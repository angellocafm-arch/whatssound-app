/**
 * WhatsSound — GoldenBoostShare
 * Componente para compartir Golden Boosts en redes sociales
 * Genera una imagen/historia para Instagram, TikTok, etc.
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { GoldenBoostEvent } from '../hooks/useGoldenBoostRealtime';

interface GoldenBoostShareProps {
  /** Evento del Golden Boost */
  boost: GoldenBoostEvent;
  /** Callback al compartir */
  onShare?: () => void;
  /** Tipo de share card */
  variant?: 'received' | 'given';
}

export function GoldenBoostShare({ 
  boost, 
  onShare,
  variant = 'received',
}: GoldenBoostShareProps) {
  const cardRef = useRef<View>(null);

  const handleShare = async () => {
    try {
      // Texto para compartir
      const text = variant === 'received'
        ? `🏆 ¡He recibido un Golden Boost de ${boost.fromUserName} en WhatsSound! ¡Gracias por el reconocimiento! 🎵`
        : `🏆 ¡Le he dado un Golden Boost a ${boost.toDjName} en WhatsSound! ¡Un DJ increíble! 🎵`;

      // En web, usar Share API nativa
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: '🏆 Golden Boost - WhatsSound',
            text,
            url: 'https://whatssound.app',
          });
        } else {
          // Fallback: copiar al portapapeles
          await navigator.clipboard.writeText(`${text}\n\nhttps://whatssound.app`);
          Alert.alert('Copiado', 'Texto copiado al portapapeles');
        }
      } else {
        // En nativo, intentar capturar imagen primero
        if (cardRef.current && await Sharing.isAvailableAsync()) {
          try {
            const uri = await captureRef(cardRef, {
              format: 'png',
              quality: 1,
            });
            
            await Sharing.shareAsync(uri, {
              mimeType: 'image/png',
              dialogTitle: 'Compartir Golden Boost',
            });
          } catch (captureError) {
            // Si falla la captura, compartir solo texto
            await Share.share({
              message: `${text}\n\nhttps://whatssound.app`,
            });
          }
        } else {
          await Share.share({
            message: `${text}\n\nhttps://whatssound.app`,
          });
        }
      }

      onShare?.();
    } catch (error) {
      console.error('[GoldenBoostShare] Error:', error);
    }
  };

  const handleShareInstagram = async () => {
    // Instagram Stories requiere la app de Instagram
    const instagramUrl = `instagram://story-camera`;
    
    try {
      // Capturar imagen
      if (cardRef.current) {
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1,
        });
        
        // En iOS, usar el share sheet con la imagen
        // Instagram lo detectará automáticamente
        if (Platform.OS !== 'web') {
          await Share.share({
            url: uri,
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir en Instagram');
    }
  };

  return (
    <View style={styles.container}>
      {/* Card para captura */}
      <View ref={cardRef} style={styles.card} collapsable={false}>
        <View style={styles.cardBackground}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <Ionicons name="trophy" size={60} color="#FFD700" />
            <Text style={styles.cardTitle}>GOLDEN BOOST</Text>
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            {variant === 'received' ? (
              <>
                <Text style={styles.cardLabel}>Recibido de</Text>
                <Text style={styles.cardName}>{boost.fromUserName}</Text>
              </>
            ) : (
              <>
                <Text style={styles.cardLabel}>Dado a</Text>
                <Text style={styles.cardName}>{boost.toDjName}</Text>
              </>
            )}
            
            {boost.message && (
              <Text style={styles.cardMessage}>"{boost.message}"</Text>
            )}
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.cardBrand}>WhatsSound</Text>
            <Text style={styles.cardUrl}>whatssound.app</Text>
          </View>

          {/* Decorations */}
          <View style={[styles.sparkle, styles.sparkle1]}>
            <Ionicons name="star" size={16} color="#FFD700" />
          </View>
          <View style={[styles.sparkle, styles.sparkle2]}>
            <Ionicons name="star" size={12} color="#FFD700" />
          </View>
          <View style={[styles.sparkle, styles.sparkle3]}>
            <Ionicons name="star" size={20} color="#FFD700" />
          </View>
        </View>
      </View>

      {/* Share buttons */}
      <View style={styles.buttons}>
        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text style={styles.shareButtonText}>Compartir</Text>
        </Pressable>

        <Pressable 
          style={[styles.shareButton, styles.instagramButton]} 
          onPress={handleShareInstagram}
        >
          <Ionicons name="logo-instagram" size={20} color="#fff" />
          <Text style={styles.shareButtonText}>Stories</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Botón simple de compartir para usar en la notificación del boost
 */
export function GoldenBoostShareButton({
  boost,
  variant = 'received',
}: Pick<GoldenBoostShareProps, 'boost' | 'variant'>) {
  const handleQuickShare = async () => {
    const text = variant === 'received'
      ? `🏆 ¡He recibido un Golden Boost de ${boost.fromUserName} en WhatsSound!`
      : `🏆 ¡Le he dado un Golden Boost a ${boost.toDjName} en WhatsSound!`;

    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({
          text,
          url: 'https://whatssound.app',
        });
      } else {
        await Share.share({
          message: `${text}\n\nhttps://whatssound.app`,
        });
      }
    } catch (error) {
      // Usuario canceló
    }
  };

  return (
    <Pressable style={styles.quickShareButton} onPress={handleQuickShare}>
      <Ionicons name="share-outline" size={18} color="#FFD700" />
      <Text style={styles.quickShareText}>Compartir</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardBackground: {
    backgroundColor: '#1a1a1a',
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
    borderRadius: 20,
    position: 'relative',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 10,
    letterSpacing: 2,
  },
  cardContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  cardName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  cardMessage: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
  cardFooter: {
    alignItems: 'center',
  },
  cardBrand: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#25D366',
  },
  cardUrl: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sparkle: {
    position: 'absolute',
    opacity: 0.6,
  },
  sparkle1: {
    top: 20,
    left: 20,
  },
  sparkle2: {
    top: 40,
    right: 30,
  },
  sparkle3: {
    bottom: 30,
    left: 40,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  instagramButton: {
    backgroundColor: '#E1306C',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD70020',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD70040',
  },
  quickShareText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GoldenBoostShare;
