-- ============================================================
-- WhatsSound — Seed Data (Demo)
-- Datos realistas para demo a inversores
-- ============================================================

-- ============================================================
-- PROFILES (DJs y usuarios)
-- ============================================================
-- Note: These use fixed UUIDs so we can reference them consistently.
-- In production, IDs come from auth.users.

INSERT INTO ws_profiles (id, phone, display_name, username, bio, is_dj, dj_name, dj_bio, genres, is_verified, last_seen) VALUES
  -- DJs
  ('d0000001-0000-0000-0000-000000000001', '+34600000001', 'Carlos Mendoza', 'carlosmadrid', 'Amante de la música y DJ amateur 🎧', true, 'DJ Carlos Madrid', 'Reggaetón, Latin House y buena vibra desde Madrid 🇪🇸🔥', ARRAY['reggaeton','latin','electrónica'], true, NOW()),
  ('d0000001-0000-0000-0000-000000000002', '+34600000002', 'Luna Martínez', 'lunadj', 'Music is life 🎵', true, 'Luna DJ', 'Chill beats, lo-fi y sesiones para estudiar y relajarse 🌙', ARRAY['lo-fi','chill','ambient'], true, NOW()),
  ('d0000001-0000-0000-0000-000000000003', '+34600000003', 'Sarah Blanco', 'sarahb', 'Deep house lover 🏖️', true, 'Sarah B', 'Deep house, sunset sessions y tropical vibes 🌅', ARRAY['deep house','tropical','tech house'], true, NOW()),
  ('d0000001-0000-0000-0000-000000000004', '+34600000004', 'Paco Ruiz', 'pacotechno', 'Underground techno 🖤', true, 'Paco Techno', 'Techno underground desde Barcelona. Raves & warehouses 🏭', ARRAY['techno','industrial','minimal'], false, NOW()),
  ('d0000001-0000-0000-0000-000000000005', '+34600000005', 'Alejandro Torres', 'djalex', 'Mezclo de todo 🎶', true, 'DJ Alex', 'Mix ecléctico: pop, indie, rock alternativo y sorpresas 🎸', ARRAY['pop','indie','rock'], false, NOW()),
  -- Usuarios
  ('u0000001-0000-0000-0000-000000000001', '+34600000011', 'María García', 'mariagarcia', 'Aquí por la música 💃', false, null, null, ARRAY['reggaeton','pop'], false, NOW()),
  ('u0000001-0000-0000-0000-000000000002', '+34600000012', 'Pablo Rodríguez', 'pablorod', 'Siempre pidiendo canciones 🎵', false, null, null, ARRAY['reggaeton','latin'], false, NOW()),
  ('u0000001-0000-0000-0000-000000000003', '+34600000013', 'Laura García', 'lauragarcia', 'Top tipper 💸', false, null, null, ARRAY['pop','indie'], false, NOW()),
  ('u0000001-0000-0000-0000-000000000004', '+34600000014', 'Carlos Ruiz', 'carlosruiz', 'Melómano empedernido 🎹', false, null, null, ARRAY['techno','electrónica'], false, NOW()),
  ('u0000001-0000-0000-0000-000000000005', '+34600000015', 'Ana Martín', 'anamartin', 'Bailando siempre 💃', false, null, null, ARRAY['reggaeton','bachata'], false, NOW()),
  ('u0000001-0000-0000-0000-000000000006', '+34600000016', 'Pedro López', 'pedrolopez', 'Buen rollo y buena música 🤙', false, null, null, ARRAY['chill','lo-fi'], false, NOW()),
  ('u0000001-0000-0000-0000-000000000007', '+34600000017', 'Sofía Vega', 'sofiavega', 'Descubriendo nueva música 🔍', false, null, null, ARRAY['indie','alternativo'], false, NOW()),
  ('u0000001-0000-0000-0000-000000000008', '+34600000018', 'Miguel Torres', 'migueltorres', 'DJ wannabe 😅', false, null, null, ARRAY['techno','house'], false, NOW()),
  ('u0000001-0000-0000-0000-000000000009', '+34600000019', 'Diego Fernández', 'diegof', 'Aquí desde el día 1 🚀', false, null, null, ARRAY['pop','reggaeton'], false, NOW()),
  ('u0000001-0000-0000-0000-000000000010', '+34600000020', 'Elena Sánchez', 'elenasanchez', 'La música me salva ❤️', false, null, null, ARRAY['indie','folk'], false, NOW());

-- ============================================================
-- SESSIONS (activas y finalizadas)
-- ============================================================

INSERT INTO ws_sessions (id, code, name, description, genres, is_active, tips_enabled, dj_id, started_at, ended_at) VALUES
  -- Active sessions
  ('s0000001-0000-0000-0000-000000000001', 'VL2026', 'Viernes Latino 🔥', 'Reggaetón, latin y buena vibra toda la noche', ARRAY['reggaeton','latin'], true, true, 'd0000001-0000-0000-0000-000000000001', NOW() - INTERVAL '1 hour 23 minutes', null),
  ('s0000001-0000-0000-0000-000000000002', 'CHILL1', 'Chill & Study Beats', 'Lo-fi beats para concentrarte y relajarte', ARRAY['lo-fi','chill'], true, true, 'd0000001-0000-0000-0000-000000000002', NOW() - INTERVAL '3 hours 12 minutes', null),
  ('s0000001-0000-0000-0000-000000000003', 'DEEP01', 'Deep House Sunset', 'Deep house para atardecer en la terraza', ARRAY['deep house','tropical'], true, true, 'd0000001-0000-0000-0000-000000000003', NOW() - INTERVAL '2 hours 45 minutes', null),
  ('s0000001-0000-0000-0000-000000000004', 'TECH99', 'Techno Underground', 'Solo techno puro y duro. Sin compromisos.', ARRAY['techno','industrial'], true, true, 'd0000001-0000-0000-0000-000000000004', NOW() - INTERVAL '1 hour 55 minutes', null),
  -- Ended session
  ('s0000001-0000-0000-0000-000000000005', 'FNM01', 'Friday Night Mix', 'Mix ecléctico de viernes noche', ARRAY['pop','indie','rock'], false, true, 'd0000001-0000-0000-0000-000000000005', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '2 hours');

-- ============================================================
-- SESSION MEMBERS
-- ============================================================

-- Viernes Latino (45 listeners) — add key users
INSERT INTO ws_session_members (session_id, user_id, role) VALUES
  ('s0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'dj'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000001', 'vip'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', 'listener'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000003', 'listener'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000005', 'moderator'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000009', 'listener');

-- Chill & Study (203 listeners)
INSERT INTO ws_session_members (session_id, user_id, role) VALUES
  ('s0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000002', 'dj'),
  ('s0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000006', 'listener'),
  ('s0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000007', 'listener'),
  ('s0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000010', 'vip');

-- Deep House Sunset
INSERT INTO ws_session_members (session_id, user_id, role) VALUES
  ('s0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000003', 'dj'),
  ('s0000001-0000-0000-0000-000000000003', 'u0000001-0000-0000-0000-000000000004', 'listener'),
  ('s0000001-0000-0000-0000-000000000003', 'u0000001-0000-0000-0000-000000000008', 'listener');

-- Techno Underground
INSERT INTO ws_session_members (session_id, user_id, role) VALUES
  ('s0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000004', 'dj'),
  ('s0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000004', 'listener'),
  ('s0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000008', 'vip');

-- ============================================================
-- SONGS (cola de canciones)
-- ============================================================

-- Viernes Latino songs
INSERT INTO ws_songs (id, session_id, user_id, external_id, title, artist, duration_ms, status, vote_count, played_at) VALUES
  ('song0001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000001', 'deezer:2309870', 'Dakiti', 'Bad Bunny, Jhay Cortez', 205000, 'playing', 24, null),
  ('song0001-0000-0000-0000-000000000002', 's0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', 'deezer:1547834', 'Titi Me Preguntó', 'Bad Bunny', 243000, 'queued', 19, null),
  ('song0001-0000-0000-0000-000000000003', 's0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000003', 'deezer:1876234', 'Pepas', 'Farruko', 289000, 'queued', 15, null),
  ('song0001-0000-0000-0000-000000000004', 's0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000005', 'deezer:1234567', 'Yonaguni', 'Bad Bunny', 207000, 'queued', 12, null),
  ('song0001-0000-0000-0000-000000000005', 's0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000009', 'deezer:9876543', 'La Noche de Anoche', 'Bad Bunny, Rosalía', 191000, 'queued', 9, null),
  ('song0001-0000-0000-0000-000000000006', 's0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000001', 'deezer:5432167', 'Callaíta', 'Bad Bunny', 256000, 'played', 8, NOW() - INTERVAL '45 minutes'),
  ('song0001-0000-0000-0000-000000000007', 's0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', 'deezer:7654321', 'Gasolina', 'Daddy Yankee', 197000, 'played', 22, NOW() - INTERVAL '30 minutes');

-- Chill & Study songs
INSERT INTO ws_songs (id, session_id, user_id, external_id, title, artist, duration_ms, status, vote_count) VALUES
  ('song0002-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000006', 'deezer:3456789', 'Snowman', 'WYS', 180000, 'playing', 34),
  ('song0002-0000-0000-0000-000000000002', 's0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000007', 'deezer:4567890', 'Coffee', 'beabadoobee', 210000, 'queued', 28),
  ('song0002-0000-0000-0000-000000000003', 's0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000010', 'deezer:5678901', 'Sunset Lover', 'Petit Biscuit', 238000, 'queued', 21);

-- ============================================================
-- NOW PLAYING
-- ============================================================

INSERT INTO ws_now_playing (session_id, song_id, progress_ms, is_playing) VALUES
  ('s0000001-0000-0000-0000-000000000001', 'song0001-0000-0000-0000-000000000001', 72000, true),
  ('s0000001-0000-0000-0000-000000000002', 'song0002-0000-0000-0000-000000000001', 95000, true);

-- ============================================================
-- TIPS
-- ============================================================

INSERT INTO ws_tips (session_id, sender_id, receiver_id, song_id, amount, platform_fee, net_amount, message, status) VALUES
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000001', 'song0001-0000-0000-0000-000000000001', 5.00, 0.50, 4.50, '¡Gran sesión!', 'completed'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000001', null, 10.00, 1.00, 9.00, 'Temazo!!', 'completed'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000001', 'song0001-0000-0000-0000-000000000002', 2.00, 0.20, 1.80, null, 'completed'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000009', 'd0000001-0000-0000-0000-000000000001', null, 5.00, 0.50, 4.50, 'Ponla de nuevo!', 'completed'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', null, 1.00, 0.10, 0.90, null, 'completed'),
  ('s0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000006', 'd0000001-0000-0000-0000-000000000002', null, 3.00, 0.30, 2.70, 'Perfecto para estudiar', 'completed');

-- ============================================================
-- MESSAGES (Viernes Latino chat)
-- ============================================================

INSERT INTO ws_messages (session_id, author_id, type, content, created_at) VALUES
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000001', 'system', 'María García se unió a la sesión', NOW() - INTERVAL '1 hour 20 minutes'),
  ('s0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'dj_announce', '¡Bienvenidos al Viernes Latino! 🔥 Pedid canciones y votad vuestras favoritas', NOW() - INTERVAL '1 hour 15 minutes'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000001', 'text', 'Qué buena vibra! 💃🔥', NOW() - INTERVAL '1 hour'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', 'text', 'Ponme Gasolina porfa 🙏', NOW() - INTERVAL '55 minutes'),
  ('s0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'text', 'Sale! La pongo después de esta 🎵', NOW() - INTERVAL '54 minutes'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000003', 'tip_announce', 'Laura García envió €5 de propina 🎉', NOW() - INTERVAL '40 minutes'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000005', 'text', 'Temazoooo 🔥🔥🔥', NOW() - INTERVAL '30 minutes'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000009', 'text', '@carlos ponla de nuevo!', NOW() - INTERVAL '20 minutes'),
  ('s0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'text', 'Jaja venga va, para la gente 🙌', NOW() - INTERVAL '19 minutes'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000001', 'text', 'Súbele volumen!! 🔊', NOW() - INTERVAL '10 minutes'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', 'text', 'Esto es increíble, mejor que salir de fiesta 😂', NOW() - INTERVAL '5 minutes'),
  ('s0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000003', 'text', 'La pedí yo! 🎉', NOW() - INTERVAL '2 minutes');

-- ============================================================
-- FOLLOWS
-- ============================================================

INSERT INTO ws_follows (follower_id, following_id) VALUES
  ('u0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001'),
  ('u0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001'),
  ('u0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000001'),
  ('u0000001-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000001'),
  ('u0000001-0000-0000-0000-000000000009', 'd0000001-0000-0000-0000-000000000001'),
  ('u0000001-0000-0000-0000-000000000006', 'd0000001-0000-0000-0000-000000000002'),
  ('u0000001-0000-0000-0000-000000000007', 'd0000001-0000-0000-0000-000000000002'),
  ('u0000001-0000-0000-0000-000000000010', 'd0000001-0000-0000-0000-000000000002'),
  ('u0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000003'),
  ('u0000001-0000-0000-0000-000000000008', 'd0000001-0000-0000-0000-000000000004');

-- ============================================================
-- USER SETTINGS (defaults for all users)
-- ============================================================

INSERT INTO ws_user_settings (user_id) VALUES
  ('d0000001-0000-0000-0000-000000000001'),
  ('d0000001-0000-0000-0000-000000000002'),
  ('d0000001-0000-0000-0000-000000000003'),
  ('u0000001-0000-0000-0000-000000000001'),
  ('u0000001-0000-0000-0000-000000000002'),
  ('u0000001-0000-0000-0000-000000000003'),
  ('u0000001-0000-0000-0000-000000000006');
