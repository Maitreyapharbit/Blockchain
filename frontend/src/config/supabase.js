import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10, // Optimize for free tier
    },
  },
});

// Realtime configuration for free tier optimization
export const realtimeConfig = {
  // Limit concurrent subscriptions
  maxSubscriptions: 5,
  // Batch events to reduce API calls
  batchEvents: true,
  // Connection timeout
  timeout: 30000,
};