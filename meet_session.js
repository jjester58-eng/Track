// supabase.js
// Shared FEP utilities. Loaded via <script src="supabase.js"> (NOT type="module"),
// so all exports become globals on window instead of ES module exports.
// Any page that includes this file gets: sb, MEET, FEP_SESSION_KEY,
// getActiveMeet(), applyMeetBranding(), initPage()

const SUPABASE_URL    = 'https://qjomrnguhbqfluzwuntz.supabase.co';
const SUPABASE_KEY    = 'sb_publishable_EkuLnkxIC-nZue4ss2NyJw_jmuXcpd_';

// ── Supabase client (shared across all pages) ─────────────────────────────
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Session key — must match index.html and admin.html ────────────────────
const FEP_SESSION_KEY = 'fep_meet';

// ── Active meet (populated by getActiveMeet / initPage) ───────────────────
let MEET = null;

// ── Shared helpers ────────────────────────────────────────────────────────

/** HTML-escape a value before inserting into a template string. */
function esc(s) {
  return (s || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Format a YYYY-MM-DD date string for display. */
function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });
}

/** Generate a collision-safe random 32-char hex ID (no UUID truncation). */
function genId() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

function log(msg) {
  console.log('[FEP]', msg);
  const el = document.getElementById('debug');
  if (el) el.innerHTML += `→ ${msg}<br>`;
}

// ── Meet session helpers ──────────────────────────────────────────────────

async function getActiveMeet() {
  try {
    const raw = sessionStorage.getItem(FEP_SESSION_KEY);
    if (!raw) return null;
    MEET = JSON.parse(raw);
    return MEET;
  } catch (e) {
    console.error('[FEP] getActiveMeet:', e);
    return null;
  }
}

function applyMeetBranding(meet) {
  if (!meet) return;
  const logo = document.getElementById('topLogo');
  const name = document.getElementById('topMeetName');
  if (logo) logo.src = meet.logo_url || '';
  if (name) name.textContent = meet.name || 'Meet';
}

async function initPage() {
  MEET = await getActiveMeet();
  if (!MEET) {
    log('No active meet — redirecting to index');
    // Uncomment to auto-redirect pages that require a meet:
    // window.location.href = 'index.html';
    return null;
  }
  applyMeetBranding(MEET);
  return MEET;
}