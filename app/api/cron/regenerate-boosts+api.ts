/**
 * WhatsSound — Cron: Regenerar Golden Boosts
 * Ejecutar cada VIERNES a las 18:00 UTC (19:00 España)
 * Justo antes del fin de semana = máximo engagement
 * 
 * Vercel Cron: vercel.json → crons
 * URL: /api/cron/regenerate-boosts
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Necesita service role para actualizar todos
);

export async function GET(request: Request) {
  // Verificar que es llamada de cron (Vercel añade este header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // En desarrollo permitimos sin auth
    if (process.env.NODE_ENV === 'production') {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  try {
    const results = {
      usersUpdated: 0,
      bonusGiven: 0,
      errors: [] as string[],
    };

    // 1. Regenerar boost base (todos los usuarios activos)
    const { data: users, error: fetchError } = await supabase
      .from('ws_profiles')
      .select('id, golden_boosts_available, sessions_this_week')
      .eq('is_active', true);

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`);
    }

    for (const user of users || []) {
      let newBoosts = 1; // Base: 1 boost por semana
      let bonus = 0;

      // Bonus: +1 si escuchó 5+ sesiones esta semana
      if (user.sessions_this_week >= 5) {
        bonus = 1;
        newBoosts += bonus;
      }

      // Actualizar usuario
      const { error: updateError } = await supabase
        .from('ws_profiles')
        .update({
          golden_boosts_available: newBoosts,
          sessions_this_week: 0, // Reset contador semanal
          last_boost_regen: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        results.errors.push(`User ${user.id}: ${updateError.message}`);
      } else {
        results.usersUpdated++;
        if (bonus > 0) results.bonusGiven++;
      }
    }

    // 2. Log de ejecución
    await supabase.from('ws_audit_log').insert({
      action: 'cron_regenerate_boosts',
      metadata: {
        users_updated: results.usersUpdated,
        bonus_given: results.bonusGiven,
        errors_count: results.errors.length,
        executed_at: new Date().toISOString(),
      },
    });

    // 3. Enviar notificaciones a usuarios con bonus
    // (opcional - descomentar si quieres notificar)
    /*
    if (results.bonusGiven > 0) {
      await supabase.from('ws_notifications_log').insert(
        users
          .filter(u => u.sessions_this_week >= 5)
          .map(u => ({
            user_id: u.id,
            type: 'boost_available',
            title: '¡Bonus de Golden Boost! ⭐',
            body: 'Por escuchar 5+ sesiones, tienes 2 boosts esta semana',
            status: 'pending',
          }))
      );
    }
    */

    return new Response(
      JSON.stringify({
        success: true,
        message: `Regeneración completada: ${results.usersUpdated} usuarios, ${results.bonusGiven} bonus`,
        ...results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Cron] Regenerate boosts error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
