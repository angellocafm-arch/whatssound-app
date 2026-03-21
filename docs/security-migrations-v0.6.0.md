# Security Migrations — v0.6.0-security-fix

Applied: 2026-03-21

## Database Migrations Applied (via Supabase Management API)

### 1. ws_audit_log — RLS Policies
- `audit_log_user_read`: Users can SELECT their own audit entries (auth.uid() = user_id)
- `audit_log_service_insert`: Only service_role can INSERT
- No UPDATE/DELETE allowed (immutable audit trail)

### 2. ws_notifications_log — RLS Policies
- `notif_log_user_read`: Users can SELECT their own notifications
- `notif_log_service_insert`: Only service_role can INSERT
- `notif_log_service_update`: Only service_role can UPDATE (mark as sent)

### 3. Functions — search_path Fix
All 4 functions recreated with `SET search_path = public`:
- `generate_session_code` — Session code generator trigger
- `handle_new_user` — Auto-create profile on signup (ALSO fixed: now inserts into `ws_profiles` instead of old `profiles`)
- `update_song_vote_count` — Vote count trigger
- `update_updated_at` — Timestamp trigger

### 4. ws_admin_settings — RLS Fix
- REMOVED: "Admin settings writable" (USING true, ALL operations, public role) — CRITICAL
- ADDED: `admin_settings_read` — Public SELECT (app reads settings)
- ADDED: `admin_settings_write` — ALL only for service_role or users with is_admin=true

### 5. ws_profiles — RLS Fix
- REMOVED: "Allow test user creation" (WITH CHECK true, INSERT) — allowed anyone to create arbitrary profiles
- ADDED: `profiles_insert_own` — INSERT only when auth.uid() = id

### 6. ws_dj_stripe_accounts — New Table
- Created with proper RLS from the start
- `dj_read_own_stripe`: DJs can SELECT their own account
- `service_role_manage_stripe`: service_role manages all operations

### Not Applied
- **HIBP (Leaked Password Protection)**: Requires Supabase Pro plan. To activate after upgrade:
  ```bash
  curl -X PATCH https://api.supabase.com/v1/projects/xyehncvvvprrqwnsefcr/config/auth \
    -H "Authorization: Bearer <token>" \
    -d '{"password_hibp_enabled": true}'
  ```
