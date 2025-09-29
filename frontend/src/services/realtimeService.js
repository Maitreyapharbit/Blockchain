import { supabase, realtimeConfig } from '../config/supabase';

class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.maxSubscriptions = realtimeConfig.maxSubscriptions;
  }

  // Subscribe to shipment changes
  subscribeToShipment(shipmentId, callback) {
    if (this.subscriptions.size >= this.maxSubscriptions) {
      console.warn('Maximum subscriptions reached. Unsubscribe from some channels first.');
      return null;
    }

    const channel = supabase
      .channel(`shipment-${shipmentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
          filter: `id=eq.${shipmentId}`
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(`shipment-${shipmentId}`, channel);
    return channel;
  }

  // Subscribe to shipment events
  subscribeToShipmentEvents(shipmentId, callback) {
    if (this.subscriptions.size >= this.maxSubscriptions) {
      console.warn('Maximum subscriptions reached. Unsubscribe from some channels first.');
      return null;
    }

    const channel = supabase
      .channel(`shipment-events-${shipmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipment_events',
          filter: `shipment_id=eq.${shipmentId}`
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(`shipment-events-${shipmentId}`, channel);
    return channel;
  }

  // Subscribe to alerts for a shipment
  subscribeToAlerts(shipmentId, callback) {
    if (this.subscriptions.size >= this.maxSubscriptions) {
      console.warn('Maximum subscriptions reached. Unsubscribe from some channels first.');
      return null;
    }

    const channel = supabase
      .channel(`shipment-alerts-${shipmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipment_alerts',
          filter: `shipment_id=eq.${shipmentId}`
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(`shipment-alerts-${shipmentId}`, channel);
    return channel;
  }

  // Subscribe to temperature readings
  subscribeToTemperatureReadings(shipmentId, callback) {
    if (this.subscriptions.size >= this.maxSubscriptions) {
      console.warn('Maximum subscriptions reached. Unsubscribe from some channels first.');
      return null;
    }

    const channel = supabase
      .channel(`temperature-${shipmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'temperature_readings',
          filter: `shipment_id=eq.${shipmentId}`
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(`temperature-${shipmentId}`, channel);
    return channel;
  }

  // Subscribe to all alerts for a user
  subscribeToUserAlerts(userId, callback) {
    if (this.subscriptions.size >= this.maxSubscriptions) {
      console.warn('Maximum subscriptions reached. Unsubscribe from some channels first.');
      return null;
    }

    const channel = supabase
      .channel(`user-alerts-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipment_alerts'
        },
        (payload) => {
          // Filter alerts for this user's shipments
          if (payload.new && payload.new.shipment_id) {
            // We'll need to check if this shipment belongs to the user
            // This is handled by RLS policies, but we can add additional filtering here
            callback(payload);
          }
        }
      )
      .subscribe();

    this.subscriptions.set(`user-alerts-${userId}`, channel);
    return channel;
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelName) {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.subscriptions.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }

  // Get active subscriptions count
  getActiveSubscriptionsCount() {
    return this.subscriptions.size;
  }

  // Batch multiple subscriptions for efficiency (free tier optimization)
  batchSubscribe(shipmentId, callbacks) {
    if (this.subscriptions.size >= this.maxSubscriptions) {
      console.warn('Maximum subscriptions reached. Unsubscribe from some channels first.');
      return null;
    }

    const channel = supabase
      .channel(`shipment-batch-${shipmentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
          filter: `id=eq.${shipmentId}`
        },
        callbacks.shipment || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipment_events',
          filter: `shipment_id=eq.${shipmentId}`
        },
        callbacks.events || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipment_alerts',
          filter: `shipment_id=eq.${shipmentId}`
        },
        callbacks.alerts || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'temperature_readings',
          filter: `shipment_id=eq.${shipmentId}`
        },
        callbacks.temperature || (() => {})
      )
      .subscribe();

    this.subscriptions.set(`shipment-batch-${shipmentId}`, channel);
    return channel;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;