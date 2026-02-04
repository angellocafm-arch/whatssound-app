/**
 * WhatsSound — usePayments Hook
 * Hook para gestionar pagos desde la UI
 */

import { useState, useCallback } from 'react';
import {
  createTip,
  purchaseGoldenBoost,
  purchasePermanentSponsor,
  formatCents,
  MIN_TIP_CENTS,
  MAX_TIP_CENTS,
  GOLDEN_BOOST_CENTS,
  PERMANENT_SPONSOR_CENTS,
  Transaction,
} from '../lib/payments';
import { useAuthStore } from '../stores/authStore';

interface UsePaymentsReturn {
  // Estado
  isLoading: boolean;
  error: string | null;
  lastTransaction: Transaction | null;
  
  // Acciones
  sendTip: (toDjId: string, amountCents: number, message?: string, sessionId?: string) => Promise<boolean>;
  buyGoldenBoost: () => Promise<boolean>;
  buyPermanentSponsor: (toDjId: string, message?: string) => Promise<boolean>;
  clearError: () => void;
  
  // Constantes
  minTip: number;
  maxTip: number;
  boostPrice: number;
  sponsorPrice: number;
  formatAmount: (cents: number) => string;
}

export function usePayments(): UsePaymentsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  
  const { user } = useAuthStore();

  const sendTip = useCallback(async (
    toDjId: string,
    amountCents: number,
    message?: string,
    sessionId?: string
  ): Promise<boolean> => {
    if (!user?.id) {
      setError('Debes iniciar sesión');
      return false;
    }

    setIsLoading(true);
    setError(null);

    const result = await createTip(user.id, toDjId, amountCents, message, sessionId);

    setIsLoading(false);

    if (result.success && result.transaction) {
      setLastTransaction(result.transaction);
      return true;
    } else {
      setError(result.error || 'Error desconocido');
      return false;
    }
  }, [user?.id]);

  const buyGoldenBoost = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setError('Debes iniciar sesión');
      return false;
    }

    setIsLoading(true);
    setError(null);

    const result = await purchaseGoldenBoost(user.id);

    setIsLoading(false);

    if (result.success && result.transaction) {
      setLastTransaction(result.transaction);
      return true;
    } else {
      setError(result.error || 'Error desconocido');
      return false;
    }
  }, [user?.id]);

  const buyPermanentSponsor = useCallback(async (
    toDjId: string,
    message?: string
  ): Promise<boolean> => {
    if (!user?.id) {
      setError('Debes iniciar sesión');
      return false;
    }

    setIsLoading(true);
    setError(null);

    const result = await purchasePermanentSponsor(user.id, toDjId, message);

    setIsLoading(false);

    if (result.success && result.transaction) {
      setLastTransaction(result.transaction);
      return true;
    } else {
      setError(result.error || 'Error desconocido');
      return false;
    }
  }, [user?.id]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    lastTransaction,
    sendTip,
    buyGoldenBoost,
    buyPermanentSponsor,
    clearError,
    minTip: MIN_TIP_CENTS,
    maxTip: MAX_TIP_CENTS,
    boostPrice: GOLDEN_BOOST_CENTS,
    sponsorPrice: PERMANENT_SPONSOR_CENTS,
    formatAmount: formatCents,
  };
}
