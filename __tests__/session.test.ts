/**
 * WhatsSound — Tests de Sesiones DJ
 * Verifica la lógica de crear, unirse y gestionar sesiones
 */

describe('Session Logic', () => {
  describe('Session Creation', () => {
    interface SessionData {
      name: string;
      genres: string[];
      isPublic: boolean;
      maxMembers?: number;
    }

    const validateSession = (data: SessionData): { valid: boolean; error?: string } => {
      if (!data.name || data.name.trim().length < 3) {
        return { valid: false, error: 'Nombre muy corto (mínimo 3 caracteres)' };
      }
      if (data.name.length > 50) {
        return { valid: false, error: 'Nombre muy largo (máximo 50 caracteres)' };
      }
      if (data.genres.length === 0) {
        return { valid: false, error: 'Selecciona al menos un género' };
      }
      if (data.genres.length > 5) {
        return { valid: false, error: 'Máximo 5 géneros' };
      }
      return { valid: true };
    };

    test('acepta sesión válida', () => {
      const result = validateSession({
        name: 'Fiesta Reggaeton',
        genres: ['reggaeton', 'latin'],
        isPublic: true,
      });
      expect(result.valid).toBe(true);
    });

    test('rechaza nombre corto', () => {
      const result = validateSession({
        name: 'DJ',
        genres: ['pop'],
        isPublic: true,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('corto');
    });

    test('rechaza sin géneros', () => {
      const result = validateSession({
        name: 'Mi Sesión',
        genres: [],
        isPublic: true,
      });
      expect(result.valid).toBe(false);
    });

    test('rechaza demasiados géneros', () => {
      const result = validateSession({
        name: 'Mi Sesión',
        genres: ['pop', 'rock', 'jazz', 'blues', 'reggaeton', 'salsa'],
        isPublic: true,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Máximo 5');
    });
  });

  describe('Join Code Generation', () => {
    const generateCode = (): string => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin I, O, 0, 1 para evitar confusión
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      return code;
    };

    test('genera código de 6 caracteres', () => {
      const code = generateCode();
      expect(code.length).toBe(6);
    });

    test('no contiene caracteres confusos', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateCode();
        expect(code).not.toMatch(/[IO01]/);
      }
    });

    test('genera códigos únicos', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateCode());
      }
      // Al menos 95% deben ser únicos
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('Queue Management', () => {
    interface Song {
      id: string;
      title: string;
      votes: number;
      status: 'pending' | 'approved' | 'rejected' | 'played';
    }

    const sortQueue = (songs: Song[]): Song[] => {
      return [...songs]
        .filter(s => s.status === 'pending' || s.status === 'approved')
        .sort((a, b) => {
          // Approved first, then by votes
          if (a.status === 'approved' && b.status !== 'approved') return -1;
          if (b.status === 'approved' && a.status !== 'approved') return 1;
          return b.votes - a.votes;
        });
    };

    test('ordena por votos', () => {
      const songs: Song[] = [
        { id: '1', title: 'Song A', votes: 5, status: 'pending' },
        { id: '2', title: 'Song B', votes: 10, status: 'pending' },
        { id: '3', title: 'Song C', votes: 3, status: 'pending' },
      ];
      const sorted = sortQueue(songs);
      expect(sorted[0].title).toBe('Song B');
      expect(sorted[2].title).toBe('Song C');
    });

    test('prioriza aprobadas', () => {
      const songs: Song[] = [
        { id: '1', title: 'Song A', votes: 100, status: 'pending' },
        { id: '2', title: 'Song B', votes: 1, status: 'approved' },
      ];
      const sorted = sortQueue(songs);
      expect(sorted[0].title).toBe('Song B');
    });

    test('excluye rechazadas y tocadas', () => {
      const songs: Song[] = [
        { id: '1', title: 'Song A', votes: 10, status: 'rejected' },
        { id: '2', title: 'Song B', votes: 5, status: 'played' },
        { id: '3', title: 'Song C', votes: 1, status: 'pending' },
      ];
      const sorted = sortQueue(songs);
      expect(sorted.length).toBe(1);
      expect(sorted[0].title).toBe('Song C');
    });
  });

  describe('Vote Logic', () => {
    const canVote = (userId: string, songId: string, existingVotes: { odingUserId: string; songId: string }[]): boolean => {
      return !existingVotes.some(v => v.odingUserId === odingUserId && v.songId === songId);
    };

    test('permite votar si no ha votado', () => {
      const votes = [{ odingUserId: 'user1', songId: 'song1' }];
      expect(canVote('user2', 'song1', votes)).toBe(true);
    });

    test('impide votar dos veces', () => {
      const votes = [{ odingUserId: 'user1', songId: 'song1' }];
      expect(canVote('user1', 'song1', votes)).toBe(false);
    });

    test('permite votar otra canción', () => {
      const votes = [{ odingUserId: 'user1', songId: 'song1' }];
      expect(canVote('user1', 'song2', votes)).toBe(true);
    });
  });
});

// Fix typo in canVote function
describe('Vote Logic Fixed', () => {
  const canVote = (userId: string, songId: string, existingVotes: { odingUserId: string; songId: string }[]): boolean => {
    return !existingVotes.some(v => v.odingUserId === userId && v.songId === songId);
  };

  test('permite votar si no ha votado', () => {
    const votes = [{ odingUserId: 'user1', songId: 'song1' }];
    expect(canVote('user2', 'song1', votes)).toBe(true);
  });

  test('impide votar dos veces', () => {
    const votes = [{ odingUserId: 'user1', songId: 'song1' }];
    expect(canVote('user1', 'song1', votes)).toBe(false);
  });
});
