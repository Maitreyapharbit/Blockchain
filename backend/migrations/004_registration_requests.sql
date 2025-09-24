-- Create registration requests table
CREATE TABLE registration_requests (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    role VARCHAR(20) NOT NULL,
    company_name TEXT NOT NULL,
    company_details TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_role CHECK (role IN ('MANUFACTURER', 'DISTRIBUTOR')),
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT valid_eth_address CHECK (wallet_address ~* '^0x[a-fA-F0-9]{40}$')
);

-- Create index for querying by wallet address
CREATE INDEX idx_registration_requests_wallet_address ON registration_requests(wallet_address);

-- Create index for status queries
CREATE INDEX idx_registration_requests_status ON registration_requests(status);

-- RLS policies for registration requests
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Admins can see all requests
CREATE POLICY "Admins can see all registration requests"
    ON registration_requests
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Users can see their own requests
CREATE POLICY "Users can see their own registration requests"
    ON registration_requests
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Only admins can update registration requests
CREATE POLICY "Only admins can update registration requests"
    ON registration_requests
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Anyone authenticated can create a request
CREATE POLICY "Authenticated users can create registration requests"
    ON registration_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Function to handle registration request approval
CREATE OR REPLACE FUNCTION handle_registration_approval()
    RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'APPROVED' AND OLD.status = 'PENDING' THEN
        -- Set processed timestamp
        NEW.processed_at = CURRENT_TIMESTAMP;
        -- Set processor
        NEW.processed_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for registration approval
CREATE TRIGGER on_registration_approval
    BEFORE UPDATE ON registration_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_registration_approval();