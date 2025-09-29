-- Shipment tracking tables for pharmaceutical supply chain
-- Optimized for Supabase free tier limits

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'delayed', 'damaged', 'lost')),
    origin_location VARCHAR(255) NOT NULL,
    destination_location VARCHAR(255) NOT NULL,
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    temperature_min DECIMAL(5,2),
    temperature_max DECIMAL(5,2),
    current_temperature DECIMAL(5,2),
    humidity_min DECIMAL(5,2),
    humidity_max DECIMAL(5,2),
    current_humidity DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Product journey events table
CREATE TABLE IF NOT EXISTS shipment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'created', 'dispatched', 'in_transit', 'temperature_check', 
        'location_update', 'delay', 'delivered', 'damaged', 'lost'
    )),
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    location VARCHAR(255),
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Alerts table for temperature excursions, delays, and anomalies
CREATE TABLE IF NOT EXISTS shipment_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'temperature_excursion', 'delay', 'anomaly', 'humidity_excursion',
        'location_anomaly', 'delivery_delay', 'damage_detected'
    )),
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    alert_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Temperature readings table for detailed monitoring
CREATE TABLE IF NOT EXISTS temperature_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    temperature DECIMAL(5,2) NOT NULL,
    humidity DECIMAL(5,2),
    location VARCHAR(255),
    sensor_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_anomaly BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance optimization (free tier friendly)
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at);
CREATE INDEX IF NOT EXISTS idx_shipments_batch_id ON shipments(batch_id);

CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id ON shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_type ON shipment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_shipment_events_timestamp ON shipment_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_shipment_alerts_shipment_id ON shipment_alerts(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_alerts_type ON shipment_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_shipment_alerts_severity ON shipment_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_shipment_alerts_resolved ON shipment_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_shipment_alerts_created_at ON shipment_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_temperature_readings_shipment_id ON temperature_readings(shipment_id);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_timestamp ON temperature_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_anomaly ON temperature_readings(is_anomaly);

-- Row Level Security (RLS) policies
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperature_readings ENABLE ROW LEVEL SECURITY;

-- RLS policies for shipments
CREATE POLICY "Users can view shipments they created" ON shipments
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create shipments" ON shipments
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their shipments" ON shipments
    FOR UPDATE USING (created_by = auth.uid());

-- RLS policies for shipment events
CREATE POLICY "Users can view events for their shipments" ON shipment_events
    FOR SELECT USING (
        shipment_id IN (
            SELECT id FROM shipments WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create events for their shipments" ON shipment_events
    FOR INSERT WITH CHECK (
        shipment_id IN (
            SELECT id FROM shipments WHERE created_by = auth.uid()
        )
    );

-- RLS policies for alerts
CREATE POLICY "Users can view alerts for their shipments" ON shipment_alerts
    FOR SELECT USING (
        shipment_id IN (
            SELECT id FROM shipments WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create alerts for their shipments" ON shipment_alerts
    FOR INSERT WITH CHECK (
        shipment_id IN (
            SELECT id FROM shipments WHERE created_by = auth.uid()
        )
    );

-- RLS policies for temperature readings
CREATE POLICY "Users can view temperature readings for their shipments" ON temperature_readings
    FOR SELECT USING (
        shipment_id IN (
            SELECT id FROM shipments WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create temperature readings for their shipments" ON temperature_readings
    FOR INSERT WITH CHECK (
        shipment_id IN (
            SELECT id FROM shipments WHERE created_by = auth.uid()
        )
    );

-- Functions for real-time updates
CREATE OR REPLACE FUNCTION update_shipment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_shipment_updated_at();

-- Function to create temperature excursion alerts
CREATE OR REPLACE FUNCTION check_temperature_excursion()
RETURNS TRIGGER AS $$
DECLARE
    shipment_record shipments%ROWTYPE;
    alert_exists BOOLEAN;
BEGIN
    -- Get shipment details
    SELECT * INTO shipment_record FROM shipments WHERE id = NEW.shipment_id;
    
    -- Check if temperature is outside acceptable range
    IF (shipment_record.temperature_min IS NOT NULL AND NEW.temperature < shipment_record.temperature_min) OR
       (shipment_record.temperature_max IS NOT NULL AND NEW.temperature > shipment_record.temperature_max) THEN
        
        -- Check if alert already exists for this excursion
        SELECT EXISTS(
            SELECT 1 FROM shipment_alerts 
            WHERE shipment_id = NEW.shipment_id 
            AND alert_type = 'temperature_excursion' 
            AND is_resolved = FALSE
            AND created_at > NOW() - INTERVAL '1 hour'
        ) INTO alert_exists;
        
        -- Create alert if it doesn't exist
        IF NOT alert_exists THEN
            INSERT INTO shipment_alerts (
                shipment_id, 
                alert_type, 
                severity,
                title,
                description,
                alert_data
            ) VALUES (
                NEW.shipment_id,
                'temperature_excursion',
                CASE 
                    WHEN ABS(NEW.temperature - COALESCE(shipment_record.temperature_min, shipment_record.temperature_max)) > 5 
                    THEN 'critical'
                    WHEN ABS(NEW.temperature - COALESCE(shipment_record.temperature_min, shipment_record.temperature_max)) > 2 
                    THEN 'high'
                    ELSE 'medium'
                END,
                'Temperature Excursion Detected',
                'Temperature reading ' || NEW.temperature || '°C is outside acceptable range (' || 
                COALESCE(shipment_record.temperature_min::text, 'N/A') || '°C - ' || 
                COALESCE(shipment_record.temperature_max::text, 'N/A') || '°C)',
                jsonb_build_object(
                    'temperature', NEW.temperature,
                    'min_temp', shipment_record.temperature_min,
                    'max_temp', shipment_record.temperature_max,
                    'location', NEW.location
                )
            );
        END IF;
        
        -- Mark reading as anomaly
        NEW.is_anomaly = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for temperature excursion detection
CREATE TRIGGER check_temperature_excursion_trigger
    BEFORE INSERT ON temperature_readings
    FOR EACH ROW
    EXECUTE FUNCTION check_temperature_excursion();

-- Function to check for delivery delays
CREATE OR REPLACE FUNCTION check_delivery_delay()
RETURNS TRIGGER AS $$
DECLARE
    alert_exists BOOLEAN;
BEGIN
    -- Check if shipment is delayed (past expected delivery date and not delivered)
    IF NEW.expected_delivery_date IS NOT NULL 
       AND NEW.status != 'delivered' 
       AND NEW.expected_delivery_date < NOW() THEN
        
        -- Check if delay alert already exists
        SELECT EXISTS(
            SELECT 1 FROM shipment_alerts 
            WHERE shipment_id = NEW.id 
            AND alert_type = 'delivery_delay' 
            AND is_resolved = FALSE
        ) INTO alert_exists;
        
        -- Create delay alert if it doesn't exist
        IF NOT alert_exists THEN
            INSERT INTO shipment_alerts (
                shipment_id, 
                alert_type, 
                severity,
                title,
                description,
                alert_data
            ) VALUES (
                NEW.id,
                'delivery_delay',
                CASE 
                    WHEN NEW.expected_delivery_date < NOW() - INTERVAL '2 days' THEN 'critical'
                    WHEN NEW.expected_delivery_date < NOW() - INTERVAL '1 day' THEN 'high'
                    ELSE 'medium'
                END,
                'Delivery Delay Detected',
                'Shipment is ' || EXTRACT(EPOCH FROM (NOW() - NEW.expected_delivery_date))/3600 || ' hours past expected delivery date',
                jsonb_build_object(
                    'expected_delivery', NEW.expected_delivery_date,
                    'current_status', NEW.status,
                    'delay_hours', EXTRACT(EPOCH FROM (NOW() - NEW.expected_delivery_date))/3600
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for delivery delay detection
CREATE TRIGGER check_delivery_delay_trigger
    AFTER UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION check_delivery_delay();