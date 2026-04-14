/* ─────────────────────────────────────────────
   SHARED UTILITIES & SUPABASE INIT (DEBUG VERSION)
───────────────────────────────────────────── */

const IRONCLAD_LOGO = 'https://qjomrnguhbqfluzwuntz.supabase.co/storage/v1/object/public/logos/Ironclad.png';

const SUPABASE_URL = 'https://qjomrnguhbqfluzwuntz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EkuLnkxIC-nZue4ss2NyJw_jmuXcpd_';

// Initialize Supabase globally
export const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export let MEET = null;

export function safeGet(id) {
  const el = document.getElementById(id);
  if (!el) console.warn("[FEP] Missing element:", id);
  return el;
}

export function log(msg) {
  console.log('[FEP Debug]', msg);
  const el = document.getElementById('debug');
  if (el) {
    el.style.display = 'block';
    el.innerHTML += '→ ' + msg + '<br>';
  }
}

export function getActiveMeet() {
  console.log("[FEP] Checking for active meet...");
  try {
    let meetData = null;
    const stored = sessionStorage.getItem('fep_meet');
    if (stored) {
      meetData = JSON.parse(stored);
      console.log("[FEP] Found meet in sessionStorage:", meetData.id);
    }

    if (!meetData) {
      const local = localStorage.getItem('fep_meet');
      if (local) {
        meetData = JSON.parse(local);
        console.log("[FEP] Found meet in localStorage:", meetData.id);
      }
    }

    if (!meetData) {
      const params = new URLSearchParams(window.location.search);
      const meetId = params.get('meet');
      if (meetId) {
        meetData = { id: meetId };
        console.log("[FEP] Found meet ID in URL:", meetId);
      }
    }

    if (!meetData) {
      console.warn("[FEP] No meet found. Redirecting to index.html...");
      const isHome = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";
      if (!isHome) {
        window.location.href = 'index.html';
      }
      return null;
    }

    MEET = meetData;
    return MEET;
  } catch (e) {
    console.error('[FEP] Meet parse error:', e);
    return null;
  }
}

export function updateBanners() {
  const banner = safeGet('offlineBanner');
  if (!banner) return;
  const toggle = () => banner.classList.toggle('show', !navigator.onLine);
  toggle();
  window.addEventListener('online',  toggle);
  window.addEventListener('offline', toggle);
}

export function applyMeetBranding(meet) {
  console.log("[FEP] Applying branding for meet:", meet.name || meet.id);
  const topLogo = safeGet('topLogo');
  if (topLogo) {
    topLogo.src = meet.logo_url || IRONCLAD_LOGO;
  }
  const topMeetName = safeGet('topMeetName');
  if (topMeetName) {
    topMeetName.textContent = meet.name || 'Current Meet';
  }
}

// Page-specific init placeholder
export async function initPage() {
  log('initPage() placeholder called.');
}

// Auto-run on load
window.addEventListener('DOMContentLoaded', async () => {
  console.log("[FEP] DOMContentLoaded triggered.");
  // Make functions globally available for inline event handlers (like onchange)
  window.loadEvent = (await import('./index.html')).loadEvent; 
  // Note: This is tricky with modules. Better to attach to window in the page script.
  
  if (typeof window.initPage === 'function') {
    await window.initPage();
  }
});
