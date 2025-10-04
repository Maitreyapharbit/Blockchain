import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key'

// Check if we're using placeholder values
const isPlaceholder = supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key'

if (isPlaceholder) {
  console.warn('⚠️ Using placeholder Supabase configuration. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file')
  console.info('ℹ️ Supabase features will be disabled until proper configuration is provided')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Realtime configuration for free tier optimization
export const realtimeConfig = {
  maxSubscriptions: 5,
  batchEvents: true,
  timeout: 30000
}