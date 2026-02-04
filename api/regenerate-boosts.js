const { createClient } = require('@supabase/supabase-js');

/**
 * WhatsSound — Cron: Regenerar Golden Boosts
 * Vercel Serverless Function
 * Ejecutar cada VIERNES a las 11:00 UTC (12:00 CET)
 */

module.exports = async function handler(req, res) {
  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar autorización en producción
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Ejecutar la función SQL existente de reset
    const { error: resetError } = await supabase.rpc('reset_weekly_golden_boosts');
    
    if (resetError) {
      console.error('[Cron] Error en reset_weekly_golden_boosts:', resetError);
    }

    // 2. Contar usuarios con boost disponible
    const { count: usersWithBoost } = await supabase
      .from('ws_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('golden_boost_available', 1);

    // 3. Verificar aceleradores (+1 boost si 5+ sesiones)
    const { data: eligibleUsers } = await supabase
      .from('ws_profiles')
      .select('id, golden_boost_available, sessions_listened_this_week')
      .gte('sessions_listened_this_week', 5);

    let bonusGiven = 0;
    for (const user of eligibleUsers || []) {
      const { error } = await supabase
        .from('ws_profiles')
        .update({
          golden_boost_available: user.golden_boost_available + 1,
        })
        .eq('id', user.id);
      
      if (!error) bonusGiven++;
    }

    // 4. Log de auditoría
    await supabase.from('ws_audit_log').insert({
      action: 'cron_regenerate_boosts',
      metadata: {
        users_with_boost: usersWithBoost || 0,
        bonus_given: bonusGiven,
        executed_at: new Date().toISOString(),
        day: 'Friday',
        time_utc: '11:00',
      },
    });

    console.log(`[Cron] Golden Boosts regenerados. ${usersWithBoost} usuarios, ${bonusGiven} bonus.`);

    return res.status(200).json({
      success: true,
      message: '¡Golden Boosts regenerados! Viernes antes de comer 🎉',
      usersWithBoost: usersWithBoost || 0,
      bonusGiven,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error:', error);
    
    return res.status(500).json({ 
      success: false, 
      error: String(error),
      timestamp: new Date().toISOString(),
    });
  }
};
