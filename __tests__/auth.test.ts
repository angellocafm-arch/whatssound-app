/**
 * WhatsSound — Tests de Autenticación
 * Verifica la lógica del flujo de registro y login
 */

describe('Auth Flow', () => {
  describe('Phone Validation', () => {
    const validatePhone = (phone: string): boolean => {
      const cleaned = phone.replace(/\D/g, '');
      return cleaned.length >= 9 && cleaned.length <= 15;
    };

    test('acepta número español válido', () => {
      expect(validatePhone('612345678')).toBe(true);
      expect(validatePhone('912345678')).toBe(true);
    });

    test('acepta número con prefijo', () => {
      expect(validatePhone('+34612345678')).toBe(true);
      expect(validatePhone('0034612345678')).toBe(true);
    });

    test('rechaza número muy corto', () => {
      expect(validatePhone('12345')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });

    test('rechaza número muy largo', () => {
      expect(validatePhone('1234567890123456789')).toBe(false);
    });
  });

  describe('OTP Validation', () => {
    const validateOTP = (code: string): boolean => {
      return /^\d{6}$/.test(code);
    };

    test('acepta código de 6 dígitos', () => {
      expect(validateOTP('123456')).toBe(true);
      expect(validateOTP('000000')).toBe(true);
    });

    test('rechaza código con letras', () => {
      expect(validateOTP('12345a')).toBe(false);
      expect(validateOTP('abcdef')).toBe(false);
    });

    test('rechaza código de longitud incorrecta', () => {
      expect(validateOTP('12345')).toBe(false);
      expect(validateOTP('1234567')).toBe(false);
    });
  });

  describe('Profile Validation', () => {
    const validateProfile = (profile: { displayName: string; genres: string[] }): { valid: boolean; error?: string } => {
      if (!profile.displayName || profile.displayName.trim().length < 2) {
        return { valid: false, error: 'Nombre muy corto' };
      }
      if (profile.displayName.length > 30) {
        return { valid: false, error: 'Nombre muy largo' };
      }
      if (profile.genres.length === 0) {
        return { valid: false, error: 'Selecciona al menos un género' };
      }
      return { valid: true };
    };

    test('acepta perfil válido', () => {
      const result = validateProfile({ displayName: 'DJ Carlos', genres: ['reggaeton'] });
      expect(result.valid).toBe(true);
    });

    test('rechaza nombre vacío', () => {
      const result = validateProfile({ displayName: '', genres: ['pop'] });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Nombre muy corto');
    });

    test('rechaza sin géneros', () => {
      const result = validateProfile({ displayName: 'DJ Carlos', genres: [] });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Selecciona al menos un género');
    });

    test('rechaza nombre muy largo', () => {
      const result = validateProfile({ displayName: 'A'.repeat(50), genres: ['pop'] });
      expect(result.valid).toBe(false);
    });
  });

  describe('Test Mode Detection', () => {
    const TEST_PHONES = ['666666666', '666666661', '666666662', '123456789'];
    
    const isTestPhone = (phone: string): boolean => {
      const cleaned = phone.replace(/\D/g, '').slice(-9);
      return TEST_PHONES.includes(cleaned);
    };

    test('detecta teléfonos de prueba', () => {
      expect(isTestPhone('666666666')).toBe(true);
      expect(isTestPhone('+34666666666')).toBe(true);
      expect(isTestPhone('123456789')).toBe(true);
    });

    test('no marca teléfonos reales como test', () => {
      expect(isTestPhone('612345678')).toBe(false);
      expect(isTestPhone('912345678')).toBe(false);
    });
  });
});
