/* ─────────────────────────────────────────────
   SHARED UTILITIES & SUPABASE INIT
───────────────────────────────────────────── */

const IRONCLAD_LOGO = 'https://qjomrnguhbqfluzwuntz.supabase.co/storage/v1/object/public/logos/Ironclad.png';

const SUPABASE_URL = 'https://qjomrnguhbqfluzwuntz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EkuLnkxIC-nZue4ss2NyJw_jmuXcpd_';

// Initialize Supabase globally
export const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export let MEET = null; // Global variable to hold the active meet object

export function safeGet(id) {
  const el = document.getElementById(id);
  if (!el) console.warn("[FEP] Missing element:", id);
  return el;
}

export function log(msg) {
  console.log('[FEP Debug]', msg);
  const el = document.getElementById('debug'); // Assuming a debug element exists for display
  if (el) {
    el.style.display = 'block';
    el.innerHTML += '→ ' + msg + '<br>';
  }
}

export async function getActiveMeet() {
  console.log("[FEP] getActiveMeet: Checking for active meet...");
  try {
    let meetData = null;
    let meetIdFromUrl = null;

    // 1. Check URL parameters first (highest priority for initial load)
    const params = new URLSearchParams(window.location.search);
    meetIdFromUrl = params.get('meet');
    if (meetIdFromUrl) {
      meetData = { id: meetIdFromUrl };
      console.log("[FEP] getActiveMeet: Found meet ID in URL:", meetIdFromUrl);
    }

    // 2. Check sessionStorage
    const stored = sessionStorage.getItem('fep_meet');
    if (stored) {
      const parsedStored = JSON.parse(stored);
      // If URL has an ID, and stored data matches that ID, use stored data
      // Otherwise, if no URL ID, or URL ID doesn't match, use stored data if it's more complete
      if (meetIdFromUrl && parsedStored.id === meetIdFromUrl) {
        meetData = parsedStored;
        console.log("[FEP] getActiveMeet: Found matching meet in sessionStorage:", meetData.id);
      } else if (!meetIdFromUrl && parsedStored.id) { // If no URL ID, just use stored
        meetData = parsedStored;
        console.log("[FEP] getActiveMeet: Found meet in sessionStorage (no URL ID):", meetData.id);
      }
    }

    // 3. Check localStorage
    const local = localStorage.getItem('fep_meet');
    if (local) {
      const parsedLocal = JSON.parse(local);
      // If we still don't have complete meetData (e.g., only ID from URL, or nothing yet)
      // and localStorage has a matching or more complete record
      if ((!meetData || !meetData.name) && (meetIdFromUrl && parsedLocal.id === meetIdFromUrl || !meetIdFromUrl && parsedLocal.id)) {
        meetData = parsedLocal;
        console.log("[FEP] getActiveMeet: Found meet in localStorage:", meetData.id);
      }
    }

    // If we have only an ID (e.g., from URL) but not full details, fetch from Supabase
    if (meetData && meetData.id && !meetData.name) {
      console.log("[FEP] getActiveMeet: Fetching full meet details from Supabase for ID:", meetData.id);
      const { data: fullMeetDetails, error } = await sb
        .from("meets")
        .select("*")
        .eq("id", meetData.id)
        .single();

      if (error) {
        console.error("[FEP] getActiveMeet: Error fetching full meet details:", error.message);
        meetData = null; // Invalidate meetData if fetch fails
      } else if (fullMeetDetails) {
        meetData = fullMeetDetails;
        console.log("[FEP] getActiveMeet: Successfully fetched full meet details.", meetData);
        // Persist full details to session storage for consistency
        sessionStorage.setItem('fep_meet', JSON.stringify(meetData));
      }
    }

    if (!meetData || !meetData.id) {
      console.warn("[FEP] getActiveMeet: No valid meet found.");
      const currentPath = window.location.pathname;
      const isHomeOrAdmin = currentPath.endsWith("index.html") || currentPath.endsWith("admin.html") || currentPath === "/";
      if (!isHomeOrAdmin) {
        console.log("[FEP] getActiveMeet: Redirecting to index.html.");
        window.location.href = 'index.html';
        return null; 
      }
      MEET = null; 
      return null;
    }

    MEET = meetData; 
    console.log("[FEP] getActiveMeet: Active MEET set to:", MEET);
    return MEET;
  } catch (e) {
    console.error('[FEP] getActiveMeet: Meet parse error or unexpected issue:', e);
    MEET = null;
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
  console.log("[FEP] applyMeetBranding: Applying branding for meet:", meet.name || meet.id);
  const topLogo = safeGet('topLogo');
  if (topLogo) {
    topLogo.src = meet.logo_url || IRONCLAD_LOGO;
  }
  const topMeetName = safeGet('topMeetName');
  if (topMeetName) {
    topMeetName.textContent = meet.name || 'Current Meet';
  }
}

// Placeholder for page-specific initialization (to be called by individual pages)
window.initPage = async () => {
  log('initPage() placeholder called. This should be overridden by the specific page.');
};

// Global DOMContentLoaded handler to ensure page-specific init runs after DOM is ready
window.addEventListener('DOMContentLoaded', async () => {
  console.log("[FEP] DOMContentLoaded triggered. Calling window.initPage()...");
  await window.initPage();
});
