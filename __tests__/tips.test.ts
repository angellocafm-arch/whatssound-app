/**
 * WhatsSound — Tests de Propinas
 * Verifica la lógica de envío y cálculo de propinas
 */

describe('Tips Logic', () => {
  describe('Amount Validation', () => {
    const validateTipAmount = (amount: number): { valid: boolean; error?: string } => {
      if (amount < 1) {
        return { valid: false, error: 'Mínimo 1€' };
      }
      if (amount > 500) {
        return { valid: false, error: 'Máximo 500€' };
      }
      if (!Number.isFinite(amount)) {
        return { valid: false, error: 'Cantidad inválida' };
      }
      return { valid: true };
    };

    test('acepta propina válida', () => {
      expect(validateTipAmount(5).valid).toBe(true);
      expect(validateTipAmount(1).valid).toBe(true);
      expect(validateTipAmount(100).valid).toBe(true);
    });

    test('rechaza propina menor a 1€', () => {
      expect(validateTipAmount(0).valid).toBe(false);
      expect(validateTipAmount(0.5).valid).toBe(false);
      expect(validateTipAmount(-5).valid).toBe(false);
    });

    test('rechaza propina mayor a 500€', () => {
      expect(validateTipAmount(501).valid).toBe(false);
      expect(validateTipAmount(1000).valid).toBe(false);
    });

    test('rechaza valores inválidos', () => {
      expect(validateTipAmount(NaN).valid).toBe(false);
      expect(validateTipAmount(Infinity).valid).toBe(false);
    });
  });

  describe('Fee Calculation', () => {
    const PLATFORM_FEE = 0.15; // 15%
    const STRIPE_FEE = 0.029; // 2.9%
    const STRIPE_FIXED = 0.25; // 0.25€

    const calculateFees = (amount: number): { djReceives: number; platformFee: number; stripeFee: number } => {
      const stripeFee = amount * STRIPE_FEE + STRIPE_FIXED;
      const afterStripe = amount - stripeFee;
      const platformFee = afterStripe * PLATFORM_FEE;
      const djReceives = afterStripe - platformFee;

      return {
        djReceives: Math.round(djReceives * 100) / 100,
        platformFee: Math.round(platformFee * 100) / 100,
        stripeFee: Math.round(stripeFee * 100) / 100,
      };
    };

    test('calcula fees para propina de 10€', () => {
      const result = calculateFees(10);
      expect(result.stripeFee).toBeCloseTo(0.54, 1); // 10 * 0.029 + 0.25
      expect(result.djReceives).toBeGreaterThan(7); // DJ recibe >70%
      expect(result.djReceives + result.platformFee + result.stripeFee).toBeCloseTo(10, 1);
    });

    test('calcula fees para propina de 100€', () => {
      const result = calculateFees(100);
      expect(result.djReceives).toBeGreaterThan(80); // DJ recibe >80%
    });

    test('DJ siempre recibe más de 70%', () => {
      const amounts = [1, 5, 10, 50, 100, 500];
      for (const amount of amounts) {
        const result = calculateFees(amount);
        const djPercentage = result.djReceives / amount;
        expect(djPercentage).toBeGreaterThan(0.70);
      }
    });
  });

  describe('Golden Boost Logic', () => {
    const GOLDEN_BOOST_THRESHOLD = 5; // €5 = 1 Golden Boost

    const calculateGoldenBoosts = (tipAmount: number): number => {
      return Math.floor(tipAmount / GOLDEN_BOOST_THRESHOLD);
    };

    test('5€ = 1 Golden Boost', () => {
      expect(calculateGoldenBoosts(5)).toBe(1);
    });

    test('10€ = 2 Golden Boosts', () => {
      expect(calculateGoldenBoosts(10)).toBe(2);
    });

    test('4.99€ = 0 Golden Boosts', () => {
      expect(calculateGoldenBoosts(4.99)).toBe(0);
    });

    test('25€ = 5 Golden Boosts', () => {
      expect(calculateGoldenBoosts(25)).toBe(5);
    });
  });

  describe('Leaderboard Ranking', () => {
    interface DJ {
      id: string;
      name: string;
      totalTips: number;
      goldenBoosts: number;
    }

    const rankDJs = (djs: DJ[]): DJ[] => {
      return [...djs].sort((a, b) => {
        // Primary: Golden Boosts
        if (b.goldenBoosts !== a.goldenBoosts) {
          return b.goldenBoosts - a.goldenBoosts;
        }
        // Secondary: Total tips
        return b.totalTips - a.totalTips;
      });
    };

    test('ordena por Golden Boosts', () => {
      const djs: DJ[] = [
        { id: '1', name: 'DJ A', totalTips: 1000, goldenBoosts: 5 },
        { id: '2', name: 'DJ B', totalTips: 500, goldenBoosts: 10 },
        { id: '3', name: 'DJ C', totalTips: 2000, goldenBoosts: 3 },
      ];
      const ranked = rankDJs(djs);
      expect(ranked[0].name).toBe('DJ B');
      expect(ranked[2].name).toBe('DJ C');
    });

    test('desempata por total tips', () => {
      const djs: DJ[] = [
        { id: '1', name: 'DJ A', totalTips: 100, goldenBoosts: 5 },
        { id: '2', name: 'DJ B', totalTips: 200, goldenBoosts: 5 },
      ];
      const ranked = rankDJs(djs);
      expect(ranked[0].name).toBe('DJ B');
    });
  });
});
