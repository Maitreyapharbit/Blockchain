import { supabase } from '../config/supabase';

const API_BASE = process.env.REACT_APP_API_URL || '';

export async function getAuthHeaders() {
  try {
    const { data: { session } = {} } = await supabase.auth.getSession();
    if (session && session.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch (e) {
    // ignore
  }
  return {};
}

export async function authFetch(path, options = {}) {
  const headers = options.headers || {};
  const auth = await getAuthHeaders();
  const mergedHeaders = { ...headers, ...auth };

  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  return fetch(url, { ...options, headers: mergedHeaders });
}

export default { authFetch, getAuthHeaders };
