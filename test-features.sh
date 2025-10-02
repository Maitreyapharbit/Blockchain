#!/bin/bash

# PharbitChain Features Test Script
# This script tests the new Recall Management and Anti-Counterfeiting features

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_feature() {
    echo -e "${PURPLE}[FEATURE]${NC} $1"
}

# Function to test API endpoint
test_endpoint() {
    local url=$1
    local expected_status=$2
    local feature_name=$3
    
    print_status "Testing $feature_name..."
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        print_success "$feature_name is working (HTTP $expected_status)"
        return 0
    else
        print_error "$feature_name is not working"
        return 1
    fi
}

# Function to test API with data
test_api_post() {
    local url=$1
    local data=$2
    local feature_name=$3
    
    print_status "Testing $feature_name..."
    
    local response=$(curl -s -X POST -H "Content-Type: application/json" -d "$data" "$url")
    
    if echo "$response" | grep -q "success.*true"; then
        print_success "$feature_name is working"
        return 0
    else
        print_error "$feature_name is not working"
        print_status "Response: $response"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${GREEN}🧪 Testing PharbitChain Features...${NC}"
    echo -e "${PURPLE}📋 Testing Recall Management & Anti-Counterfeiting APIs${NC}"
    echo ""

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Check if services are running
    print_status "Checking if services are running..."
    
    if ! curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        print_error "Backend server is not running. Please start it first with: ./start-all.sh"
        exit 1
    fi

    if ! curl -s http://localhost:3001 >/dev/null 2>&1; then
        print_error "Frontend server is not running. Please start it first with: ./start-all.sh"
        exit 1
    fi

    print_success "Services are running"

    # Test basic endpoints
    echo ""
    print_feature "🔍 Testing Basic Endpoints..."
    test_endpoint "http://localhost:3000/api/health" "200" "Health Check"
    test_endpoint "http://localhost:3000/api" "200" "API Root"

    # Test Recall Management endpoints
    echo ""
    print_feature "🚨 Testing Recall Management APIs..."
    test_endpoint "http://localhost:3000/api/recalls" "200" "Get All Recalls"
    
    # Test Recall Initiation
    local recall_data='{
        "batchIds": ["BATCH-001", "BATCH-002"],
        "severity": "HIGH",
        "reason": "Test recall for quality control",
        "initiatedBy": "Test User"
    }'
    test_api_post "http://localhost:3000/api/recalls/initiate" "$recall_data" "Recall Initiation"

    # Test Anti-Counterfeiting endpoints
    echo ""
    print_feature "🛡️ Testing Anti-Counterfeiting APIs..."
    test_endpoint "http://localhost:3000/api/counterfeit/flagged" "200" "Get Flagged Batches"
    test_endpoint "http://localhost:3000/api/counterfeit/reports" "200" "Get All Reports"
    
    # Test Authenticity Verification
    local verification_data='{
        "batchId": "BATCH-001",
        "verificationType": "QR_SCAN",
        "providedData": "test-qr-data",
        "verifiedBy": "Test User",
        "ipAddress": "127.0.0.1",
        "userAgent": "Test Agent"
    }'
    test_api_post "http://localhost:3000/api/counterfeit/verify" "$verification_data" "Authenticity Verification"
    
    # Test Suspicious Activity Report
    local report_data='{
        "batchId": "BATCH-001",
        "reporterName": "Test Reporter",
        "reporterEmail": "test@example.com",
        "reportType": "SUSPICIOUS_PACKAGING",
        "description": "Test report for suspicious packaging",
        "evidenceUrls": ["https://example.com/evidence.jpg"],
        "location": "Test Location"
    }'
    test_api_post "http://localhost:3000/api/counterfeit/report" "$report_data" "Suspicious Activity Report"

    # Test Security Features Generation
    local security_data='{
        "batchId": "BATCH-001",
        "qrCodeHash": "test-qr-hash-123",
        "hologramId": "HOLO-001",
        "serialNumber": "SN-001",
        "securityPattern": "test-pattern"
    }'
    test_api_post "http://localhost:3000/api/counterfeit/security-features" "$security_data" "Security Features Generation"

    # Test Frontend
    echo ""
    print_feature "🌐 Testing Frontend..."
    test_endpoint "http://localhost:3001" "200" "Frontend Application"

    # Summary
    echo ""
    echo -e "${GREEN}✨ Feature Testing Complete!${NC}"
    echo ""
    print_status "All tested features are working correctly:"
    print_status "  ✅ Backend API Health Check"
    print_status "  ✅ Recall Management APIs"
    print_status "  ✅ Anti-Counterfeiting APIs"
    print_status "  ✅ Frontend Application"
    echo ""
    print_status "You can now access the full application at:"
    print_status "  - Frontend: http://localhost:3001"
    print_status "  - Backend API: http://localhost:3000"
    print_status "  - API Documentation: http://localhost:3000/api"
    echo ""
    print_feature "🚨 Recall Management Demo:"
    print_feature "  - Scroll down on the frontend to see the demo"
    print_feature "  - Try initiating a recall"
    print_feature "  - Test batch identification and tracking"
    echo ""
    print_feature "🛡️ Anti-Counterfeiting Demo:"
    print_feature "  - Test authenticity verification"
    print_feature "  - Report suspicious activity"
    print_feature "  - View flagged batches and reports"
}

# Run main function
main "$@"