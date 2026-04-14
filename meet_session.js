/* ─────────────────────────────────────────────
   SHARED UTILITIES & SUPABASE INIT
   (Designed to be included in both scoring and admin pages)
───────────────────────────────────────────── */

// Constants
const IRONCLAD_LOGO = 'https://qjomrnguhbqfluzwuntz.supabase.co/storage/v1/object/public/logos/Ironclad.png';

// Supabase Client Initialization
const SUPABASE_URL = 'https://qjomrnguhbqfluzwuntz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EkuLnkxIC-nZue4ss2NyJw_jmuXcpd_';
export const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Global Meet Object (initialized by getActiveMeet or loadMeets)
export let MEET = null;

// Safe DOM Element Retrieval
export function safeGet(id) {
  const el = document.getElementById(id);
  if (!el) console.warn("Missing element:", id);
  return el;
}

// Debug Logging
export function log(msg) {
  console.log('[FEP App]', msg);
  // Optional: Add a debug display element if needed for specific pages
  const el = document.getElementById('debug');
  if (el) {
    el.style.display = 'block';
    el.innerHTML += '→ ' + msg + '<br>';
  }
}

// Meet Session Loader
export function getActiveMeet() {
  try {
    let meetData = null;

    // 1. Check sessionStorage
    const stored = sessionStorage.getItem('fep_meet');
    if (stored) {
      meetData = JSON.parse(stored);
    }

    // 2. Check localStorage if not found in sessionStorage
    if (!meetData) {
      const local = localStorage.getItem('fep_meet');
      if (local) {
        meetData = JSON.parse(local);
      }
    }

    // 3. Check URL parameters if not found in either storage
    if (!meetData) {
      const params = new URLSearchParams(window.location.search);
      const meetId = params.get('meet');
      if (meetId) {
        meetData = { id: meetId }; // Only ID is known initially from URL
      }
    }

    // If no meet is found after all checks, redirect to index.html
    if (!meetData) {
      if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
        // Already on index.html or root, don't redirect again
        MEET = null;
        return null;
      } else {
        window.location.href = 'index.html';
        return null; // Stop further execution on this page
      }
    }

    MEET = meetData;
    return MEET;
  } catch (e) {
    console.error('Meet parse error:', e);
    // If parsing fails, redirect to index.html
    if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
      MEET = null;
      return null;
    } else {
      window.location.href = 'index.html';
      return null;
    }
  }
}

// Online/Offline Banner
export function updateBanners() {
  const banner = safeGet('offlineBanner');
  if (!banner) return;

  const toggle = () => banner.classList.toggle('show', !navigator.onLine);
  toggle();

  window.addEventListener('online',  toggle);
  window.addEventListener('offline', toggle);
}

// Meet Branding Application
export function applyMeetBranding(meet) {
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
export async function initPage() {
  // This function will be overridden by each page (e.g., scoring.html, admin.html)
  // to perform its specific setup after meet-session.js has loaded.
  log('initPage() placeholder called. This should be overridden by the specific page.');
}

// Global onload handler to ensure meet-session.js is fully loaded before page-specific init
window.addEventListener('DOMContentLoaded', async () => {
  // Perform any global setup here if necessary before page-specific init
  await initPage(); // Call the page-specific initialization function
});
