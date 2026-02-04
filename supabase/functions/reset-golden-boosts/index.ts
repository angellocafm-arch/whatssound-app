/**
 * WhatsSound — Reset Golden Boosts (Edge Function)
 * 
 * Ejecutar cada VIERNES a las 12:00 CET (antes de comer)
 * Timing perfecto: la gente sale de fiesta viernes/sábado
 * 
 * Configura con pg_cron o Supabase scheduled functions:
 * SELECT cron.schedule('reset-golden-boosts', '0 11 * * 5', ...); -- 11:00 UTC = 12:00 CET
 * 
 * curl -X POST https://xxx.supabase.co/functions/v1/reset-golden-boosts \
 *   -H "Authorization: Bearer SERVICE_ROLE_KEY"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autorización (solo service role o cron)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.includes('Bearer')) {
      throw new Error('No autorizado');
    }

    // Crear cliente con service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ejecutar reset
    const { data, error } = await supabase.rpc('reset_weekly_golden_boosts');
    
    if (error) {
      throw error;
    }

    // Contar usuarios afectados
    const { count } = await supabase
      .from('ws_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('golden_boost_available', 1);

    console.log(`[ResetGoldenBoosts] Reset completado. ${count} usuarios con Golden Boost disponible.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Golden Boosts reseteados para la semana',
        usersReset: count,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[ResetGoldenBoosts] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
