/**
 * WhatsSound — Edge Function: Notify DJ Live
 * 
 * Cuando un DJ inicia una sesión, esta función:
 * 1. Obtiene los seguidores del DJ
 * 2. Busca sus push tokens activos
 * 3. Envía push notifications via Expo Push API
 * 4. Registra las notificaciones en ws_notifications_log
 * 
 * Llamar via POST con body: { djId, sessionId, sessionName }
 * 
 * Se puede invocar desde el cliente o como webhook de Supabase Realtime
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { djId, sessionId, sessionName } = await req.json();

    if (!djId || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'djId and sessionId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Obtener info del DJ
    const { data: dj } = await supabase
      .from('ws_profiles')
      .select('dj_name, display_name')
      .eq('id', djId)
      .single();

    const djName = dj?.dj_name || dj?.display_name || 'DJ';
    const title = `${djName} está en vivo! 🎵`;
    const body = sessionName
      ? `Únete a "${sessionName}" ahora`
      : 'Únete a la sesión ahora';

    // 2. Obtener seguidores del DJ
    const { data: followers } = await supabase
      .from('ws_follows')
      .select('follower_id')
      .eq('following_id', djId);

    if (!followers || followers.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'DJ has no followers' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const followerIds = followers.map((f: { follower_id: string }) => f.follower_id);

    // 3. Registrar notificaciones en BD
    const notifications = followerIds.map((userId: string) => ({
      user_id: userId,
      type: 'dj_live',
      title,
      body,
      data: { sessionId, djId, action: 'open_session' },
      status: 'pending',
    }));

    await supabase.from('ws_notifications_log').insert(notifications);

    // 4. Obtener push tokens activos de los seguidores
    const { data: tokens } = await supabase
      .from('ws_push_tokens')
      .select('expo_push_token')
      .in('user_id', followerIds)
      .eq('is_active', true);

    let pushSent = 0;

    if (tokens && tokens.length > 0) {
      // 5. Enviar push via Expo Push API
      const messages = tokens.map((t: { expo_push_token: string }) => ({
        to: t.expo_push_token,
        title,
        body,
        data: { sessionId, djId, action: 'open_session' },
        sound: 'default',
        channelId: 'default',
      }));

      // Enviar en batches de 100
      for (let i = 0; i < messages.length; i += 100) {
        const chunk = messages.slice(i, i + 100);
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        if (response.ok) {
          pushSent += chunk.length;
        } else {
          console.error('Expo Push API error:', await response.text());
        }
      }

      // Actualizar estado a 'sent' para los que tenían token
      const usersWithTokens = tokens.map((t: { expo_push_token: string }) => t.expo_push_token);
      await supabase
        .from('ws_notifications_log')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('type', 'dj_live')
        .eq('status', 'pending')
        .in('user_id', followerIds);
    }

    return new Response(
      JSON.stringify({
        sent: pushSent,
        followers: followerIds.length,
        tokensFound: tokens?.length || 0,
        djName,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in notify-dj-live:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
