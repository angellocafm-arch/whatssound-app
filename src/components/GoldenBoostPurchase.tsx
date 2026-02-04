/**
 * WhatsSound — GoldenBoostPurchase
 * Modal para comprar Golden Boosts adicionales
 * 
 * Precios:
 * - 1 Golden Boost: €4.99
 * - Pack 3: €9.99
 * - Permanente (nombre siempre visible): €19.99
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

interface GoldenBoostPurchaseProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseComplete?: () => void;
}

interface PurchaseOption {
  id: string;
  title: string;
  description: string;
  price: string;
  priceId: string; // Stripe Price ID
  quantity: number;
  isPermanent?: boolean;
  popular?: boolean;
}

const PURCHASE_OPTIONS: PurchaseOption[] = [
  {
    id: 'single',
    title: '1 Golden Boost',
    description: 'Da reconocimiento a tu DJ favorito',
    price: '€4.99',
    priceId: 'price_golden_boost_single', // Configurar en Stripe
    quantity: 1,
  },
  {
    id: 'pack3',
    title: 'Pack 3 Golden Boosts',
    description: 'Ahorra 33% comprando pack',
    price: '€9.99',
    priceId: 'price_golden_boost_pack3',
    quantity: 3,
    popular: true,
  },
  {
    id: 'permanent',
    title: 'Golden Boost Permanente',
    description: 'Tu nombre aparece siempre en el perfil del DJ',
    price: '€19.99',
    priceId: 'price_golden_boost_permanent',
    quantity: 1,
    isPermanent: true,
  },
];

export function GoldenBoostPurchase({
  visible,
  onClose,
  onPurchaseComplete,
}: GoldenBoostPurchaseProps) {
  const { user } = useAuthStore();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (option: PurchaseOption) => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para comprar');
      return;
    }

    setSelectedOption(option.id);
    setIsProcessing(true);

    try {
      // Llamar a la Edge Function que crea la sesión de Stripe
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: option.priceId,
          quantity: option.quantity,
          metadata: {
            type: 'golden_boost',
            userId: user.id,
            isPermanent: option.isPermanent || false,
          },
          successUrl: `${window.location.origin}/profile/golden-history?success=true`,
          cancelUrl: `${window.location.origin}/profile/golden-history?canceled=true`,
        },
      });

      if (error) throw error;

      // Redirigir a Stripe Checkout
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('[GoldenBoostPurchase] Error:', error);
      Alert.alert('Error', 'No se pudo procesar la compra. Inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
      setSelectedOption(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="trophy" size={40} color="#FFD700" />
            <Text style={styles.title}>Comprar Golden Boosts</Text>
            <Text style={styles.subtitle}>
              Reconoce a los DJs que te encantan
            </Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#888" />
            </Pressable>
          </View>

          {/* Opciones */}
          <View style={styles.options}>
            {PURCHASE_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.option,
                  option.popular && styles.optionPopular,
                  selectedOption === option.id && styles.optionSelected,
                ]}
                onPress={() => handlePurchase(option)}
                disabled={isProcessing}
              >
                {option.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MÁS POPULAR</Text>
                  </View>
                )}
                
                <View style={styles.optionContent}>
                  <View style={styles.optionIcon}>
                    {option.isPermanent ? (
                      <Ionicons name="infinite" size={28} color="#FFD700" />
                    ) : (
                      <>
                        <Ionicons name="trophy" size={24} color="#FFD700" />
                        {option.quantity > 1 && (
                          <Text style={styles.quantityBadge}>x{option.quantity}</Text>
                        )}
                      </>
                    )}
                  </View>
                  
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  
                  <View style={styles.optionPrice}>
                    {isProcessing && selectedOption === option.id ? (
                      <ActivityIndicator size="small" color="#FFD700" />
                    ) : (
                      <Text style={styles.priceText}>{option.price}</Text>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
            <Text style={styles.footerText}>
              Pago seguro con Stripe
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 5,
  },
  options: {
    paddingHorizontal: 20,
    gap: 12,
  },
  option: {
    backgroundColor: '#252525',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#333',
    overflow: 'hidden',
  },
  optionPopular: {
    borderColor: '#FFD700',
  },
  optionSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#2a2500',
  },
  popularBadge: {
    backgroundColor: '#FFD700',
    paddingVertical: 4,
    alignItems: 'center',
  },
  popularText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 15,
  },
  optionIcon: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  quantityBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFD700',
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  optionDescription: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  optionPrice: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#888',
  },
});

export default GoldenBoostPurchase;
