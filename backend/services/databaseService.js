const { createClient } = require('@supabase/supabase-js');
const config = require('../config/env');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.supabase = createClient(
      config.database.supabaseUrl,
      config.database.supabaseServiceRoleKey
    );
    this.anonClient = createClient(
      config.database.supabaseUrl,
      config.database.supabaseAnonKey
    );
  }

  /**
   * Get Supabase client with user context
   * @param {string} accessToken - User access token
   * @returns {Object} Supabase client
   */
  getUserClient(accessToken) {
    return createClient(
      config.database.supabaseUrl,
      config.database.supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    );
  }

  /**
   * Execute database query with retry logic
   * @param {Function} queryFn - Query function
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<Object>} Query result
   */
  async executeWithRetry(queryFn, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await queryFn();
      } catch (error) {
        lastError = error;
        logger.warn(`Database query attempt ${attempt} failed`, {
          error: error.message,
          attempt
        });

        if (attempt < maxRetries) {
          await this.delay(1000 * attempt); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==================== USER OPERATIONS ====================

  /**
   * Create user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getUserById(userId) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User data
   */
  async getUserByEmail(email) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updateData) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Delete success
   */
  async deleteUser(userId) {
    return this.executeWithRetry(async () => {
      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      return true;
    });
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Create batch
   * @param {Object} batchData - Batch data
   * @returns {Promise<Object>} Created batch
   */
  async createBatch(batchData) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('batches')
        .insert([batchData])
        .select(`
          *,
          manufacturer:manufacturer_id(*),
          current_owner:current_owner_id(*)
        `)
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Get batch by ID
   * @param {string} batchId - Batch ID
   * @returns {Promise<Object>} Batch data
   */
  async getBatchById(batchId) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('batches')
        .select(`
          *,
          manufacturer:manufacturer_id(*),
          current_owner:current_owner_id(*),
          batch_files(
            file_id(*)
          )
        `)
        .eq('id', batchId)
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Get batch by batch_id
   * @param {string} batchId - Batch ID string
   * @returns {Promise<Object>} Batch data
   */
  async getBatchByBatchId(batchId) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('batches')
        .select(`
          *,
          manufacturer:manufacturer_id(*),
          current_owner:current_owner_id(*)
        `)
        .eq('batch_id', batchId)
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Get batches with pagination and filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Batches and pagination info
   */
  async getBatches(options = {}) {
    return this.executeWithRetry(async () => {
      const {
        page = 1,
        limit = 10,
        status = null,
        manufacturerId = null,
        ownerId = null,
        search = null,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      let query = this.supabase
        .from('batches')
        .select(`
          *,
          manufacturer:manufacturer_id(*),
          current_owner:current_owner_id(*)
        `, { count: 'exact' });

      // Apply filters
      if (status) query = query.eq('status', status);
      if (manufacturerId) query = query.eq('manufacturer_id', manufacturerId);
      if (ownerId) query = query.eq('current_owner_id', ownerId);
      if (search) {
        query = query.or(`drug_name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        batches: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    });
  }

  /**
   * Update batch
   * @param {string} batchId - Batch ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated batch
   */
  async updateBatch(batchId, updateData) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('batches')
        .update(updateData)
        .eq('id', batchId)
        .select(`
          *,
          manufacturer:manufacturer_id(*),
          current_owner:current_owner_id(*)
        `)
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Delete batch
   * @param {string} batchId - Batch ID
   * @returns {Promise<boolean>} Delete success
   */
  async deleteBatch(batchId) {
    return this.executeWithRetry(async () => {
      const { error } = await this.supabase
        .from('batches')
        .delete()
        .eq('id', batchId);

      if (error) throw error;
      return true;
    });
  }

  // ==================== COMPLIANCE OPERATIONS ====================

  /**
   * Create compliance log
   * @param {Object} complianceData - Compliance data
   * @returns {Promise<Object>} Created compliance log
   */
  async createComplianceLog(complianceData) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('compliance_logs')
        .insert([complianceData])
        .select(`
          *,
          auditor:auditor_id(*),
          batch:batch_id(*)
        `)
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Get compliance logs for batch
   * @param {string} batchId - Batch ID
   * @returns {Promise<Array>} Compliance logs
   */
  async getComplianceLogs(batchId) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('compliance_logs')
        .select(`
          *,
          auditor:auditor_id(*),
          compliance_files(
            file_id(*)
          )
        `)
        .eq('batch_id', batchId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Update compliance log
   * @param {string} complianceId - Compliance log ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated compliance log
   */
  async updateComplianceLog(complianceId, updateData) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('compliance_logs')
        .update(updateData)
        .eq('id', complianceId)
        .select(`
          *,
          auditor:auditor_id(*),
          batch:batch_id(*)
        `)
        .single();

      if (error) throw error;
      return data;
    });
  }

  // ==================== FILE OPERATIONS ====================

  /**
   * Create file record
   * @param {Object} fileData - File data
   * @returns {Promise<Object>} Created file record
   */
  async createFile(fileData) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('files')
        .insert([fileData])
        .select(`
          *,
          uploaded_by:uploaded_by(*)
        `)
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Get file by ID
   * @param {string} fileId - File ID
   * @returns {Promise<Object>} File data
   */
  async getFileById(fileId) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('files')
        .select(`
          *,
          uploaded_by:uploaded_by(*)
        `)
        .eq('id', fileId)
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Link file to batch
   * @param {string} batchId - Batch ID
   * @param {string} fileId - File ID
   * @param {Object} options - Link options
   * @returns {Promise<Object>} Link result
   */
  async linkFileToBatch(batchId, fileId, options = {}) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('batch_files')
        .insert([{ batch_id: batchId, file_id: fileId, ...options }])
        .select('*')
        .single();
      if (error) throw error;
      return data;
    });
  }

  /**
   * Link file to compliance log
   * @param {string} complianceId - Compliance log ID
   * @param {string} fileId - File ID
   * @returns {Promise<Object>} Link result
   */
  async linkFileToCompliance(complianceId, fileId) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('compliance_files')
        .insert([{
          compliance_log_id: complianceId,
          file_id: fileId
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }

  // ==================== BATCH OWNERSHIP OPERATIONS ====================

  /**
   * Create batch ownership record
   * @param {Object} ownershipData - Ownership data
   * @returns {Promise<Object>} Created ownership record
   */
  async createBatchOwnership(ownershipData) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('batch_ownership_history')
        .insert([ownershipData])
        .select(`
          *,
          from_owner:from_owner_id(*),
          to_owner:to_owner_id(*)
        `)
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Get batch ownership history
   * @param {string} batchId - Batch ID
   * @returns {Promise<Array>} Ownership history
   */
  async getBatchOwnershipHistory(batchId) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('batch_ownership_history')
        .select(`
          *,
          from_owner:from_owner_id(*),
          to_owner:to_owner_id(*)
        `)
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    });
  }

  // ==================== STATISTICS OPERATIONS ====================

  /**
   * Get batch statistics
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} Batch statistics
   */
  async getBatchStatistics(userId = null) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .rpc('get_batch_statistics', { p_user_id: userId });

      if (error) throw error;
      return data[0] || {};
    });
  }

  /**
   * Get compliance statistics
   * @param {string} batchId - Batch ID (optional)
   * @returns {Promise<Object>} Compliance statistics
   */
  async getComplianceStatistics(batchId = null) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .rpc('get_compliance_statistics', { p_batch_id: batchId });

      if (error) throw error;
      return data[0] || {};
    });
  }

  // ==================== SEARCH OPERATIONS ====================

  /**
   * Search batches
   * @param {Object} searchOptions - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchBatches(searchOptions = {}) {
    return this.executeWithRetry(async () => {
      const {
        searchTerm = '',
        status = null,
        manufacturerId = null,
        ownerId = null,
        drugName = '',
        limit = 50,
        offset = 0
      } = searchOptions;

      const { data, error } = await this.supabase
        .rpc('search_batches', {
          p_search_term: searchTerm,
          p_status: status,
          p_manufacturer_id: manufacturerId,
          p_owner_id: ownerId,
          p_drug_name: drugName,
          p_limit: limit,
          p_offset: offset
        });

      if (error) throw error;
      return data || [];
    });
  }

  // ==================== AUDIT OPERATIONS ====================

  /**
   * Create audit log
   * @param {Object} auditData - Audit data
   * @returns {Promise<Object>} Created audit log
   */
  async createAuditLog(auditData) {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('audit_logs')
        .insert([auditData])
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Get audit logs
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Audit logs
   */
  async getAuditLogs(options = {}) {
    return this.executeWithRetry(async () => {
      const {
        userId = null,
        action = null,
        resourceType = null,
        page = 1,
        limit = 50
      } = options;

      let query = this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (userId) query = query.eq('user_id', userId);
      if (action) query = query.eq('action', action);
      if (resourceType) query = query.eq('resource_type', resourceType);

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        logs: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    });
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Check database connection
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const { error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) throw error;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected'
      };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      };
    }
  }
}

module.exports = new DatabaseService();
