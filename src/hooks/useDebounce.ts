import { useCallback, useRef } from 'react';

/**
 * Hook personalizado para debounce
 * @param callback Función a ejecutar
 * @param delay Delay en milisegundos
 * @returns Función debounced
 */
export function useDebounce<T extends any[]>(
  callback: (...args: T) => void | Promise<void>,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: T) => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Crear nuevo timeout
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}