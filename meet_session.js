const SUPABASE_URL = 'https://qjomrnguhbqfluzwuntz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EkuLnkxIC-nZue4ss2NyJw_jmuXcpd';

export const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export let MEET = null;

function log(msg) {
  console.log('[FEP]', msg);
  const el = document.getElementById('debug');
  if (el) el.innerHTML += `→ ${msg}<br>`;
}

export async function getActiveMeet() {
  try {
    const raw = sessionStorage.getItem('fep_meet');
    if (!raw) return null;

    MEET = JSON.parse(raw);
    return MEET;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function applyMeetBranding(meet) {
  if (!meet) return;

  const logo = document.getElementById('topLogo');
  const name = document.getElementById('topMeetName');

  if (logo) logo.src = meet.logo_url || '';
  if (name) name.textContent = meet.name || 'Meet';
}

export async function initPage() {
  MEET = await getActiveMeet();
  if (!MEET) {
    log("No active meet");
    return null;
  }

  applyMeetBranding(MEET);
  return MEET;
}