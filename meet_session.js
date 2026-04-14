/* =============================================
   FEP SHARED CORE - CLEAN ARCHITECTURE
============================================= */

const IRONCLAD_LOGO =
  'https://qjomrnguhbqfluzwuntz.supabase.co/storage/v1/object/public/logos/Ironclad.png';

const SUPABASE_URL = 'https://qjomrnguhbqfluzwuntz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EkuLnkxIC-nZue4ss2NyJw_jmuXcpd_';

/* SINGLE supabase client (GLOBAL SOURCE OF TRUTH) */
export const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export let MEET = null;

/* -----------------------------
   SAFE HELPERS
------------------------------*/
export function safeGet(id) {
  return document.getElementById(id);
}

export function log(msg) {
  console.log('[FEP]', msg);
  const el = document.getElementById('debug');
  if (el) {
    el.style.display = 'block';
    el.innerHTML += `→ ${msg}<br>`;
  }
}

/* -----------------------------
   MEET LOADER (NO SIDE EFFECTS)
------------------------------*/
export async function getActiveMeet() {
  try {
    const cached = sessionStorage.getItem('fep_meet');
    if (cached) {
      MEET = JSON.parse(cached);
      return MEET;
    }

    const params = new URLSearchParams(window.location.search);
    const meetId = params.get('meet');

    if (meetId) {
      const { data, error } = await sb
        .from('meets')
        .select('*')
        .eq('id', meetId)
        .single();

      if (error) throw error;

      MEET = data;
      sessionStorage.setItem('fep_meet', JSON.stringify(data));
      return MEET;
    }

    return null;
  } catch (e) {
    console.error('[FEP] getActiveMeet error:', e);
    return null;
  }
}

/* -----------------------------
   BRANDING
------------------------------*/
export function applyMeetBranding(meet) {
  if (!meet) return;

  const logo = safeGet('topLogo');
  if (logo) logo.src = meet.logo_url || IRONCLAD_LOGO;

  const name = safeGet('topMeetName');
  if (name) name.textContent = meet.name || 'Current Meet';
}

/* -----------------------------
   OFFLINE BANNER
------------------------------*/
export function updateBanners() {
  const banner = safeGet('offlineBanner');
  if (!banner) return;

  const toggle = () =>
    banner.classList.toggle('show', !navigator.onLine);

  toggle();
  window.addEventListener('online', toggle);
  window.addEventListener('offline', toggle);
}

/* -----------------------------
   PAGE INIT (ONLY CALL THIS)
------------------------------*/
export async function initPage() {
  log('initPage() starting');

  const meet = await getActiveMeet();
  if (!meet) {
    log('No meet found');
    return null;
  }

  applyMeetBranding(meet);
  updateBanners();

  return meet;
}