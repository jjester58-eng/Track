/* =============================================
   FEP SHARED UTILITIES - meet-session.js
   ============================================= */

const IRONCLAD_LOGO = 'https://qjomrnguhbqfluzwuntz.supabase.co/storage/v1/object/public/logos/Ironclad.png';

const SUPABASE_URL = 'https://qjomrnguhbqfluzwuntz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EkuLnkxIC-nZue4ss2NyJw_jmuXcpd_';

export const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export let MEET = null;   // Active meet object

/* Safe element getter */
export function safeGet(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`[FEP] Element not found: #${id}`);
  return el;
}

/* Simple logger */
export function log(msg) {
  console.log('[FEP]', msg);
  const debugEl = document.getElementById('debug');
  if (debugEl) {
    debugEl.style.display = 'block';
    debugEl.innerHTML += `→ ${msg}<br>`;
  }
}

/* Get active meet from sessionStorage / URL */
export async function getActiveMeet() {
  try {
    // 1. Check sessionStorage (most common)
    let meet = sessionStorage.getItem('fep_meet');
    if (meet) {
      MEET = JSON.parse(meet);
      log(`Active meet loaded from session: ${MEET.name || MEET.id}`);
      return MEET;
    }

    // 2. Check URL parameter as fallback
    const params = new URLSearchParams(window.location.search);
    const meetId = params.get('meet');
    if (meetId) {
      const { data, error } = await sb
        .from('meets')
        .select('*')
        .eq('id', meetId)
        .single();

      if (error) {
        log("Error fetching meet from URL: " + error.message);
        return null;
      }
      MEET = data;
      sessionStorage.setItem('fep_meet', JSON.stringify(data));
      log(`Meet loaded from URL parameter: ${MEET.name}`);
      return MEET;
    }

    log("No active meet found");
    return null;
  } catch (e) {
    console.error("[FEP] getActiveMeet error:", e);
    return null;
  }
}

/* Apply meet branding (logo + name) */
export function applyMeetBranding(meet) {
  if (!meet) return;
  const logoEl = safeGet('topLogo');
  if (logoEl) logoEl.src = meet.logo_url || IRONCLAD_LOGO;

  const nameEl = safeGet('topMeetName');
  if (nameEl) nameEl.textContent = meet.name || 'Current Meet';
}

/* Offline banner */
export function updateBanners() {
  const banner = safeGet('offlineBanner');
  if (!banner) return;

  const toggle = () => banner.classList.toggle('show', !navigator.onLine);
  toggle();
  window.addEventListener('online', toggle);
  window.addEventListener('offline', toggle);
}

/* Global init helper for each page */
export async function initPage() {
  log("Common initPage started");
  MEET = await getActiveMeet();
  if (MEET) applyMeetBranding(MEET);
  updateBanners();
  return MEET;
}

// Auto-run init when imported as module
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    console.log("[FEP] DOM ready - running common init");
    initPage();
  });
}