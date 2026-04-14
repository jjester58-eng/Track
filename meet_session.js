// meet-session.js — include on scoring.html and results.html
// Reads active meet from sessionStorage, applies logo + meet name.
// If no meet in session, redirects to index.html.

const IRONCLAD_LOGO = 'https://qjomrnguhbqfluzwuntz.supabase.co/storage/v1/object/public/logos/Ironclad.png';

function getActiveMeet() {
  const raw = sessionStorage.getItem('fep_meet');
  if (!raw) { window.location.href = 'index.html'; return null; }
  try { return JSON.parse(raw); }
  catch { window.location.href = 'index.html'; return null; }
}

function applyMeetBranding(meet) {
  // Logo: meet's uploaded logo if set, otherwise Ironclad
  const logo = document.getElementById('topLogo');
  if (logo) logo.src = meet.logo_url || IRONCLAD_LOGO;

  // Meet name pill
  const pill = document.getElementById('topMeetName');
  if (pill) pill.textContent = meet.name;
}