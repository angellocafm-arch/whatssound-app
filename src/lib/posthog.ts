/**
 * WhatsSound — PostHog Analytics
 * Tracking de eventos y analytics
 */

const POSTHOG_API_KEY = 'phc_SuEJFKYjWKGrGW6pMHRla1i4z4cTndZ8zO4HwoydG1Z';
const POSTHOG_HOST = 'https://eu.i.posthog.com';

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  
  if (typeof window === 'undefined') {
    console.log('[PostHog] Not in browser, skipping init');
    return;
  }

  try {
    // Cargar PostHog via script tag
    const script = document.createElement('script');
    script.innerHTML = `
      !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      posthog.init('${POSTHOG_API_KEY}', {
        api_host: '${POSTHOG_HOST}',
        person_profiles: 'identified_only'
      });
    `;
    document.head.appendChild(script);

    initialized = true;
    console.log('[PostHog] ✅ Initialized');
  } catch (error) {
    console.error('[PostHog] ❌ Failed to initialize:', error);
  }
}

// Capturar evento
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined' || !(window as any).posthog) {
    console.log(`[PostHog] Event queued: ${eventName}`);
    return;
  }

  try {
    (window as any).posthog.capture(eventName, properties);
    console.log(`[PostHog] Event tracked: ${eventName}`);
  } catch (error) {
    console.error('[PostHog] Failed to track event:', error);
  }
}

// Identificar usuario
export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (typeof window === 'undefined' || !(window as any).posthog) {
    console.log(`[PostHog] Identify queued: ${userId}`);
    return;
  }

  try {
    (window as any).posthog.identify(userId, traits);
    console.log(`[PostHog] User identified: ${userId}`);
  } catch (error) {
    console.error('[PostHog] Failed to identify user:', error);
  }
}

// Reset (logout)
export function resetUser() {
  if (typeof window === 'undefined' || !(window as any).posthog) return;

  try {
    (window as any).posthog.reset();
    console.log('[PostHog] User reset');
  } catch (error) {
    console.error('[PostHog] Failed to reset user:', error);
  }
}
