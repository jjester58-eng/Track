/**
 * Field Events Pro — Meet Sessions & Shared Configuration
 * Centralized Supabase client, auth helpers, utilities, and session management
 * 
 * Usage: import { sb, formatDate, saveMeetSession } from './meet_sessions.js';
 */

// ── SUPABASE CONFIG ───────────────────────────────────────
const SUPABASE_URL = 'https://qjomrnguhbqfluzwuntz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EkuLnkxIC-nZue4ss2NyJw_jmuXcpd_'; // ✅ Corrected key with trailing underscore

export const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── GLOBALS ───────────────────────────────────────────────
export let MEET = null;
export let CURRENT_USER = null;

const DEBUG = true;
const IRONCLAD_LOGO = 'https://qjomrnguhbqfluzwuntz.supabase.co/storage/v1/object/public/logos/Ironclad.png';

// ── LOGGING ───────────────────────────────────────────────
export function log(msg, level = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '→';
  
  if (DEBUG) {
    console.log(`[FEP ${timestamp}] ${prefix} ${msg}`);
  }
  
  const debugEl = document.getElementById('debug');
  if (debugEl) {
    debugEl.innerHTML += `<div style="color:${level === 'error' ? '#e05252' : '#7ec8f7'}">${prefix} ${msg}</div>`;
  }
}

// ── MEET SESSION MANAGEMENT ───────────────────────────────
/**
 * Get active meet from sessionStorage
 * @returns {Object|null} Meet object with id, name, date, logo_url
 */
export async function getActiveMeet() {
  try {
    const raw = sessionStorage.getItem('fep_meet');
    if (!raw) {
      log('No active meet in session', 'warn');
      return null;
    }

    MEET = JSON.parse(raw);
    
    // Validate required fields
    if (!MEET.id || !MEET.name) {
      throw new Error('Invalid meet session structure');
    }
    
    return MEET;
  } catch (e) {
    log(`Session error: ${e.message}`, 'error');
    sessionStorage.removeItem('fep_meet');
    return null;
  }
}

/**
 * Save meet to sessionStorage for use in other pages
 * @param {Object} meet - Meet object from database
 */
export function saveMeetSession(meet) {
  try {
    const session = {
      id: meet.id,
      name: meet.name,
      date: meet.date || null,
      logo_url: meet.logo_url || null,
      timestamp: Date.now()
    };
    sessionStorage.setItem('fep_meet', JSON.stringify(session));
    MEET = session;
    log(`Meet session saved: ${meet.name}`);
  } catch (e) {
    log(`Failed to save meet session: ${e.message}`, 'error');
  }
}

/**
 * Clear meet session (call on logout or navigation back)
 */
export function clearMeetSession() {
  sessionStorage.removeItem('fep_meet');
  MEET = null;
  log('Meet session cleared');
}

// ── AUTH HELPERS ──────────────────────────────────────────
/**
 * Initialize auth state and get current user
 * @returns {Object|null} Current user object or null if not authenticated
 */
export async function initAuth() {
  try {
    const { data: { session } } = await sb.auth.getSession();
    
    if (session?.user) {
      CURRENT_USER = session.user;
      log(`Auth: Logged in as ${CURRENT_USER.email}`);
      return CURRENT_USER;
    }
    
    // Try to refresh if session exists but is stale
    const { data: refreshed } = await sb.auth.refreshSession();
    if (refreshed?.session?.user) {
      CURRENT_USER = refreshed.session.user;
      log(`Auth: Refreshed session for ${CURRENT_USER.email}`);
      return CURRENT_USER;
    }
    
    log('Auth: Not authenticated', 'warn');
    return null;
  } catch (e) {
    log(`Auth initialization error: ${e.message}`, 'error');
    return null;
  }
}

/**
 * Check if current user is a super admin (checks backend table with RLS)
 * @returns {boolean}
 */
export async function isSuperAdmin() {
  if (!CURRENT_USER) return false;
  
  try {
    const { data, error } = await sb.from('admin_profiles')
      .select('role')
      .eq('user_id', CURRENT_USER.id)
      .single();
    
    if (error || !data) {
      log('Admin profile not found', 'warn');
      return false;
    }
    
    return data.role === 'super' || data.role === 'super_admin';
  } catch (e) {
    log(`Admin check error: ${e.message}`, 'error');
    return false;
  }
}

/**
 * Check if user is admin for a specific meet
 * @param {string} meetId - Meet ID to check
 * @returns {boolean}
 */
export async function isMeetAdmin(meetId) {
  if (!CURRENT_USER) return false;
  
  try {
    const { data, error } = await sb.from('meets')
      .select('owner_id')
      .eq('id', meetId)
      .single();
    
    if (error || !data) return false;
    
    // Meet owner or super admin
    return data.owner_id === CURRENT_USER.id || (await isSuperAdmin());
  } catch (e) {
    log(`Meet admin check error: ${e.message}`, 'error');
    return false;
  }
}

/**
 * Logout current user
 */
export async function logout() {
  try {
    await sb.auth.signOut();
    CURRENT_USER = null;
    clearMeetSession();
    log('Logged out successfully');
  } catch (e) {
    log(`Logout error: ${e.message}`, 'error');
  }
}

// ── FORMATTING HELPERS ────────────────────────────────────
/**
 * Format date consistently across app
 * @param {string} dateStr - ISO date string (YYYY-MM-DD) or null
 * @returns {string} Formatted date or 'Date TBD'
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'Date TBD';
  
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    log(`Date format error: ${e.message}`, 'error');
    return dateStr;
  }
}

/**
 * Get full logo URL from storage path or existing URL
 * @param {string} logoUrl - Either full URL or filename
 * @returns {string|null} Full URL or null
 */
export function getLogoUrl(logoUrl) {
  if (!logoUrl) return null;
  
  // Already a full URL
  if (logoUrl.startsWith('http')) {
    return logoUrl;
  }
  
  // Just a filename, construct full path
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${logoUrl}`;
}

/**
 * Get Ironclad default logo
 * @returns {string} URL to Ironclad logo
 */
export function getDefaultLogo() {
  return IRONCLAD_LOGO;
}

// ── BRANDING ──────────────────────────────────────────────
/**
 * Apply meet branding to page elements
 * Updates topbar logo and meet name
 * @param {Object} meet - Meet object or null for default Ironclad
 */
export function applyMeetBranding(meet = null) {
  const logoEl = document.getElementById('topLogo');
  const nameEl = document.getElementById('topMeetName');
  
  if (meet) {
    const logoUrl = getLogoUrl(meet.logo_url);
    if (logoEl) {
      logoEl.src = logoUrl || getDefaultLogo();
      logoEl.alt = meet.name || 'Meet Logo';
    }
    if (nameEl) {
      nameEl.textContent = meet.name || 'Meet';
      nameEl.title = formatDate(meet.date);
    }
    log(`Applied branding: ${meet.name}`);
  } else {
    // Reset to default
    if (logoEl) {
      logoEl.src = getDefaultLogo();
      logoEl.alt = 'Field Events Pro';
    }
    if (nameEl) {
      nameEl.textContent = 'Field Events Pro';
      nameEl.title = '';
    }
    log('Reset branding to default');
  }
}

// ── PIN VALIDATION ────────────────────────────────────────
/**
 * Validate PIN format (4-6 digits, numeric only)
 * @param {string} pin - PIN to validate
 * @returns {boolean}
 */
export function isValidPin(pin) {
  return /^\d{4,6}$/.test(pin);
}

/**
 * Check PIN attempts with client-side rate limiting
 * @param {string} meetId - Meet ID for tracking
 * @param {number} maxAttempts - Max attempts allowed (default 5)
 * @returns {Object} {allowed: boolean, remaining: number}
 */
export function checkPinAttempts(meetId, maxAttempts = 5) {
  const key = `pin_attempts_${meetId}`;
  const timestamp = `pin_ts_${meetId}`;
  
  const lastAttempt = parseInt(sessionStorage.getItem(timestamp) || '0');
  const now = Date.now();
  const TIMEOUT = 5 * 60 * 1000; // 5 minutes
  
  // Reset if timeout exceeded
  if (now - lastAttempt > TIMEOUT) {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(timestamp);
    return { allowed: true, remaining: maxAttempts };
  }
  
  const attempts = parseInt(sessionStorage.getItem(key) || '0');
  const remaining = maxAttempts - attempts;
  
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining)
  };
}

/**
 * Record a PIN attempt for rate limiting
 * @param {string} meetId - Meet ID for tracking
 */
export function recordPinAttempt(meetId) {
  const key = `pin_attempts_${meetId}`;
  const timestamp = `pin_ts_${meetId}`;
  const attempts = parseInt(sessionStorage.getItem(key) || '0');
  
  sessionStorage.setItem(key, attempts + 1);
  sessionStorage.setItem(timestamp, Date.now());
  
  log(`PIN attempt recorded (${attempts + 1})`, 'warn');
}

/**
 * Clear PIN attempts (call after successful verification)
 * @param {string} meetId - Meet ID to clear
 */
export function clearPinAttempts(meetId) {
  sessionStorage.removeItem(`pin_attempts_${meetId}`);
  sessionStorage.removeItem(`pin_ts_${meetId}`);
  log(`PIN attempts cleared for meet ${meetId}`);
}

// ── PAGE INITIALIZATION ───────────────────────────────────
/**
 * Full page initialization:
 * 1. Check authentication
 * 2. Load active meet from session
 * 3. Apply branding
 * @returns {Object} {user: Object|null, meet: Object|null}
 */
export async function initPage() {
  try {
    // Step 1: Auth
    const user = await initAuth();
    
    // Step 2: Meet session
    const meet = await getActiveMeet();
    
    // Step 3: Branding
    applyMeetBranding(meet);
    
    log(`Page initialized: user=${user?.email || 'anonymous'}, meet=${meet?.name || 'none'}`);
    
    return { user, meet };
  } catch (e) {
    log(`Page initialization error: ${e.message}`, 'error');
    return { user: null, meet: null };
  }
}

// ── EXPORT CONSTANTS ──────────────────────────────────────
export const CONSTANTS = {
  SUPABASE_URL,
  SUPABASE_KEY,
  DEBUG,
  IRONCLAD_LOGO
};