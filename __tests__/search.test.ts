/**
 * WhatsSound — Tests de Búsqueda
 * Verifica la lógica de búsqueda de canciones y DJs
 */

describe('Search Logic', () => {
  describe('Query Validation', () => {
    const validateQuery = (query: string): { valid: boolean; cleaned: string } => {
      const cleaned = query.trim().toLowerCase();
      
      if (cleaned.length < 2) {
        return { valid: false, cleaned: '' };
      }
      
      if (cleaned.length > 100) {
        return { valid: false, cleaned: '' };
      }
      
      // Remove special characters except spaces and accents
      const sanitized = cleaned.replace(/[^\w\sáéíóúñü]/gi, '');
      
      return { valid: true, cleaned: sanitized };
    };

    test('acepta búsqueda válida', () => {
      const result = validateQuery('Bad Bunny');
      expect(result.valid).toBe(true);
      expect(result.cleaned).toBe('bad bunny');
    });

    test('rechaza búsqueda muy corta', () => {
      expect(validateQuery('a').valid).toBe(false);
      expect(validateQuery('').valid).toBe(false);
    });

    test('sanitiza caracteres especiales', () => {
      const result = validateQuery('Bad <script>Bunny</script>');
      expect(result.cleaned).not.toContain('<');
      expect(result.cleaned).not.toContain('>');
    });

    test('mantiene acentos', () => {
      const result = validateQuery('Música Española');
      expect(result.cleaned).toContain('ú');
      expect(result.cleaned).toContain('ñ');
    });
  });

  describe('Result Filtering', () => {
    interface Track {
      id: string;
      title: string;
      artist: string;
      hasPreview: boolean;
      explicit: boolean;
    }

    const filterResults = (tracks: Track[], options: { allowExplicit: boolean; requirePreview: boolean }): Track[] => {
      return tracks.filter(track => {
        if (options.requirePreview && !track.hasPreview) return false;
        if (!options.allowExplicit && track.explicit) return false;
        return true;
      });
    };

    test('filtra sin preview cuando requerido', () => {
      const tracks: Track[] = [
        { id: '1', title: 'Song A', artist: 'Artist', hasPreview: true, explicit: false },
        { id: '2', title: 'Song B', artist: 'Artist', hasPreview: false, explicit: false },
      ];
      const filtered = filterResults(tracks, { allowExplicit: true, requirePreview: true });
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe('Song A');
    });

    test('filtra explícitas cuando no permitidas', () => {
      const tracks: Track[] = [
        { id: '1', title: 'Clean Song', artist: 'Artist', hasPreview: true, explicit: false },
        { id: '2', title: 'Explicit Song', artist: 'Artist', hasPreview: true, explicit: true },
      ];
      const filtered = filterResults(tracks, { allowExplicit: false, requirePreview: false });
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe('Clean Song');
    });
  });

  describe('Duplicate Detection', () => {
    interface Song {
      title: string;
      artist: string;
    }

    const isDuplicate = (song: Song, existing: Song[]): boolean => {
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      return existing.some(e => 
        normalize(e.title) === normalize(song.title) &&
        normalize(e.artist) === normalize(song.artist)
      );
    };

    test('detecta duplicado exacto', () => {
      const existing = [{ title: 'Pepas', artist: 'Farruko' }];
      expect(isDuplicate({ title: 'Pepas', artist: 'Farruko' }, existing)).toBe(true);
    });

    test('detecta duplicado con diferente capitalización', () => {
      const existing = [{ title: 'PEPAS', artist: 'FARRUKO' }];
      expect(isDuplicate({ title: 'pepas', artist: 'farruko' }, existing)).toBe(true);
    });

    test('detecta duplicado con espacios extra', () => {
      const existing = [{ title: 'Pepas', artist: 'Farruko' }];
      expect(isDuplicate({ title: '  Pepas  ', artist: '  Farruko  ' }, existing)).toBe(true);
    });

    test('no marca como duplicado canciones diferentes', () => {
      const existing = [{ title: 'Pepas', artist: 'Farruko' }];
      expect(isDuplicate({ title: 'Dakiti', artist: 'Bad Bunny' }, existing)).toBe(false);
    });
  });

  describe('Recent Searches', () => {
    const MAX_RECENT = 10;

    const addRecentSearch = (searches: string[], newSearch: string): string[] => {
      // Remove if already exists
      const filtered = searches.filter(s => s.toLowerCase() !== newSearch.toLowerCase());
      // Add to beginning
      const updated = [newSearch, ...filtered];
      // Limit to max
      return updated.slice(0, MAX_RECENT);
    };

    test('añade búsqueda al principio', () => {
      const searches = ['old search'];
      const updated = addRecentSearch(searches, 'new search');
      expect(updated[0]).toBe('new search');
    });

    test('elimina duplicados', () => {
      const searches = ['search 1', 'search 2'];
      const updated = addRecentSearch(searches, 'search 1');
      expect(updated.length).toBe(2);
      expect(updated[0]).toBe('search 1');
    });

    test('limita a 10 búsquedas', () => {
      const searches = Array(10).fill('').map((_, i) => `search ${i}`);
      const updated = addRecentSearch(searches, 'new search');
      expect(updated.length).toBe(10);
      expect(updated[0]).toBe('new search');
      expect(updated).not.toContain('search 9');
    });
  });
});
