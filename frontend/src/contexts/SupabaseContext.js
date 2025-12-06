import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { realtimeService } from '../services/realtimeService';
import { alertService } from '../services/alertService';

const SupabaseContext = createContext();

// API Base URL - use environment variable or construct from current location
const getAPIBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    // If running inside a GitHub Codespaces/browser preview, prefer relative
    // API paths to allow the dev-server proxy to handle requests and avoid
    // preview auth redirects or CORS issues.
    try {
      if (typeof window !== 'undefined' && window.location && window.location.hostname &&
          window.location.hostname.includes('.app.github.dev') && process.env.REACT_APP_API_URL.includes('.app.github.dev')) {
        return '/api';
      }
    } catch (e) {
      // ignore and fall back to env value
    }
    return process.env.REACT_APP_API_URL;
  }
  
  // In Codespaces or similar preview environments, construct the API URL
  if (typeof window !== 'undefined' && window.location.hostname) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // For Codespaces preview URLs: replace -3000 with -3001 in the domain
    // e.g., cuddly-disco-wrj7prq54q5pfgxxq-3000.app.github.dev → cuddly-disco-wrj7prq54q5pfgxxq-3001.app.github.dev
    if (hostname.includes('app.github.dev')) {
      const apiHost = hostname.replace('-3000.app.github.dev', '-3001.app.github.dev');
      return `${protocol}//${apiHost}/api`;
    }
    
    // For localhost: replace port 3000 with 3001
    const apiHost = hostname.replace(':3000', ':3001');
    return `${protocol}//${apiHost}/api`;
  }
  
  // Default fallback
  return '/api';
};

const API_BASE_URL = getAPIBaseURL();

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

export const SupabaseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl === 'https://placeholder.supabase.co' || 
        supabaseAnonKey === 'placeholder-key') {
      console.warn('Supabase not configured, skipping authentication');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.warn('Supabase session error:', error);
      setLoading(false);
    });

    // Listen for auth changes
    let subscription;
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          // User signed in, fetch their data
          await fetchUserData();
          setupRealtimeSubscriptions();
        } else {
          // User signed out, clear data
          setShipments([]);
          setAlerts([]);
          realtimeService.unsubscribeAll();
        }
      });
      subscription = sub;
    } catch (error) {
      console.warn('Supabase auth state change error:', error);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch shipments from the backend API instead of Supabase directly
      const response = await fetch(`${API_BASE_URL}/shipments`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shipments');
      }

      const result = await response.json();
      setShipments(result.data || []);

      // Fetch user's alerts
      const alertsData = await alertService.getUnresolvedAlerts();
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Check if Supabase is properly configured
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl === 'https://placeholder.supabase.co' || 
        supabaseAnonKey === 'placeholder-key') {
      console.warn('Supabase not configured, skipping realtime subscriptions');
      return;
    }

    try {
      // Subscribe to user's alerts
      realtimeService.subscribeToUserAlerts(user.id, (payload) => {
        console.log('New alert received:', payload);
        const newAlert = payload.new;
        setAlerts(prev => [newAlert, ...prev]);
        alertService.processAlert(newAlert);
      });
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
    }
  };

  const signUp = async (email, password, userData = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setUser(null);
      setSession(null);
      setShipments([]);
      setAlerts([]);
      realtimeService.unsubscribeAll();
      
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const createShipment = async (shipmentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(shipmentData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create shipment');
      }

      // Add to local state
      setShipments(prev => [result.data, ...prev]);
      
      return { data: result.data, error: null };
    } catch (error) {
      console.error('Create shipment error:', error);
      return { data: null, error };
    }
  };

  const updateShipmentStatus = async (shipmentId, status, additionalData = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shipments/${shipmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status, ...additionalData })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update shipment status');
      }

      // Update local state
      setShipments(prev => 
        prev.map(shipment => 
          shipment.id === shipmentId 
            ? { ...shipment, ...result.data }
            : shipment
        )
      );
      
      return { data: result.data, error: null };
    } catch (error) {
      console.error('Update shipment status error:', error);
      return { data: null, error };
    }
  };

  const addTemperatureReading = async (shipmentId, temperature, additionalData = {}) => {
    try {
      const response = await fetch(`/api/shipments/${shipmentId}/temperature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ temperature, ...additionalData })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to record temperature');
      }
      
      return { data: result.data, error: null };
    } catch (error) {
      console.error('Add temperature reading error:', error);
      return { data: null, error };
    }
  };

  const addLocationUpdate = async (shipmentId, location, additionalData = {}) => {
    try {
      const response = await fetch(`/api/shipments/${shipmentId}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ location, ...additionalData })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update location');
      }
      
      return { data: result.data, error: null };
    } catch (error) {
      console.error('Add location update error:', error);
      return { data: null, error };
    }
  };

  const resolveAlert = async (alertId, notes = '') => {
    try {
      const response = await fetch(`/api/shipments/alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ notes })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to resolve alert');
      }

      // Update local state
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, is_resolved: true, resolved_at: result.data.resolved_at }
            : alert
        )
      );
      
      return { data: result.data, error: null };
    } catch (error) {
      console.error('Resolve alert error:', error);
      return { data: null, error };
    }
  };

  const refreshShipments = async () => {
    if (!user) return;
    await fetchUserData();
  };

  const getShipmentById = (shipmentId) => {
    return shipments.find(shipment => shipment.id === shipmentId);
  };

  const getAlertsByShipmentId = (shipmentId) => {
    return alerts.filter(alert => alert.shipment_id === shipmentId);
  };

  const getUnresolvedAlerts = () => {
    return alerts.filter(alert => !alert.is_resolved);
  };

  const value = {
    // Auth
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    
    // Shipments
    shipments,
    createShipment,
    updateShipmentStatus,
    addTemperatureReading,
    addLocationUpdate,
    refreshShipments,
    getShipmentById,
    
    // Alerts
    alerts,
    resolveAlert,
    getAlertsByShipmentId,
    getUnresolvedAlerts,
    
    // Realtime
    realtimeService,
    alertService
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export default SupabaseContext;