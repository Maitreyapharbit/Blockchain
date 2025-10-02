# Supabase Database Setup for Recall Management & Anti-Counterfeiting

## 📋 Overview

Your existing Supabase database has a good foundation with `batches`, `users`, `shipments`, and related tables. However, to fully support the new Recall Management and Anti-Counterfeiting features, you need to add several new tables and relationships.

## 🗄️ Required Database Changes

### **New Tables Needed:**

1. **Recall Management Tables:**
   - `recalls` - Main recall records
   - `recall_batches` - Many-to-many relationship between recalls and batches
   - `distribution_tracking` - Track distribution for rapid response
   - `recall_notifications` - Stakeholder notification system

2. **Anti-Counterfeiting Tables:**
   - `security_features` - QR codes, holograms, serial numbers
   - `counterfeit_reports` - Suspicious activity reports
   - `verification_logs` - Authenticity verification attempts
   - `flagged_batches` - Batches flagged for suspicious activity

3. **New Enums:**
   - `recall_severity` - LOW, MEDIUM, HIGH, CRITICAL
   - `recall_status` - ACTIVE, RESOLVED, CANCELLED
   - `verification_type` - QR_SCAN, HOLOGRAM_CHECK, SERIAL_VERIFICATION
   - `report_type` - SUSPICIOUS_PACKAGING, INVALID_QR, MISSING_HOLOGRAM, OTHER
   - `report_status` - PENDING, INVESTIGATING, CONFIRMED, FALSE_ALARM

## 🚀 Quick Setup (Recommended)

### **Step 1: Run the Quick Setup Script**

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-quick-setup.sql`
4. Click **Run** to execute

This will create all necessary tables, enums, indexes, and basic policies.

### **Step 2: Verify Setup**

After running the script, you should see these new tables in your Supabase dashboard:

- ✅ `recalls`
- ✅ `recall_batches`
- ✅ `distribution_tracking`
- ✅ `security_features`
- ✅ `counterfeit_reports`
- ✅ `verification_logs`
- ✅ `flagged_batches`

## 🔧 Advanced Setup (Optional)

If you want more advanced features like automated triggers and complex policies, run the full `supabase-database-updates.sql` script instead.

## 📊 Database Schema Overview

### **Recall Management Flow:**
```
recalls (1) ←→ (many) recall_batches (many) ←→ (1) batches
recalls (1) ←→ (many) recall_notifications
batches (1) ←→ (many) distribution_tracking
```

### **Anti-Counterfeiting Flow:**
```
batches (1) ←→ (1) security_features
batches (1) ←→ (many) counterfeit_reports
batches (1) ←→ (many) verification_logs
batches (1) ←→ (many) flagged_batches
```

## 🔐 Security & Permissions

### **Row Level Security (RLS)**
All new tables have RLS enabled with basic policies. You can customize these based on your security requirements:

- **Manufacturers** can create and manage recalls
- **All users** can view recalls and reports
- **Admins** can update report statuses
- **System** can automatically flag suspicious batches

### **API Access**
The backend services will automatically work with these tables once created. No additional configuration needed.

## 🧪 Testing the Setup

### **1. Test with the Application**
```bash
# Start the application
./start-all.sh

# Test the features
./test-features.sh
```

### **2. Test with Supabase Dashboard**
1. Go to **Table Editor** in Supabase
2. Try inserting sample data into the new tables
3. Verify relationships are working correctly

### **3. Test API Endpoints**
```bash
# Test recall management
curl http://localhost:3000/api/recalls

# Test anti-counterfeiting
curl http://localhost:3000/api/counterfeit/flagged
```

## 📈 Sample Data (Optional)

After setting up the tables, you can insert sample data for testing:

```sql
-- Insert sample recall
INSERT INTO public.recalls (recall_id, severity_level, reason, initiated_by)
VALUES ('REC-2024-001', 'HIGH', 'Quality control issue detected', 
        (SELECT id FROM public.users WHERE role = 'manufacturer' LIMIT 1));

-- Insert sample security features
INSERT INTO public.security_features (batch_id, qr_code_hash, hologram_id, serial_number, security_pattern)
SELECT 
  b.id,
  'qr_hash_' || b.batch_id,
  'holo_' || b.batch_id,
  'SN-' || b.batch_id,
  'pattern_' || b.batch_id
FROM public.batches b
LIMIT 5;
```

## 🔍 Monitoring & Maintenance

### **Key Metrics to Monitor:**
- Number of active recalls
- Flagged batches count
- Verification success rate
- Report resolution time

### **Database Maintenance:**
- Regular cleanup of old verification logs
- Archive resolved recalls
- Monitor table sizes and performance

## 🚨 Troubleshooting

### **Common Issues:**

1. **Permission Denied:**
   - Check RLS policies
   - Verify user roles
   - Ensure service role has proper permissions

2. **Foreign Key Errors:**
   - Ensure referenced tables exist
   - Check data types match
   - Verify relationships are correct

3. **Enum Errors:**
   - Make sure all enums are created before using them
   - Check enum values match exactly

### **Debug Steps:**
1. Check Supabase logs for errors
2. Verify table creation in dashboard
3. Test with simple INSERT statements
4. Check RLS policies are working

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## ✅ Verification Checklist

After running the setup:

- [ ] All new tables created successfully
- [ ] Enums are working
- [ ] Indexes are created
- [ ] RLS policies are active
- [ ] API endpoints are working
- [ ] Frontend can connect to database
- [ ] Sample data can be inserted
- [ ] Relationships are working correctly

## 🎯 Next Steps

1. **Run the quick setup script**
2. **Test the application**
3. **Customize RLS policies** as needed
4. **Add sample data** for testing
5. **Monitor performance** and optimize as needed

Your database will then be fully ready to support the Recall Management and Anti-Counterfeiting features! 🚀