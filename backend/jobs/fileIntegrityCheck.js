const crypto = require('crypto');
const AWS = require('aws-sdk');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * File Integrity Verification Job
 * @description ALCOA+ compliance: Daily verification that S3 files have not been tampered with
 * @dscsa Ensures supply chain documents cannot be altered
 */

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Verify integrity of all files in S3
 * @returns {Object} Summary of verification results
 */
async function verifyFileIntegrity() {
    logger.info('=== Starting daily file integrity verification ===');

    const startTime = Date.now();
    let totalFiles = 0;
    let validFiles = 0;
    let corruptedFiles = [];
    let erroredFiles = [];

    try {
        // Fetch all files from database
        const { data: files, error: fetchError } = await supabase
            .from('files')
            .select('*')
            .order('created_at', { ascending: false });

        if (fetchError) {
            logger.error('Failed to fetch files from database:', fetchError);
            return {
                success: false,
                error: fetchError.message,
                timestamp: new Date().toISOString()
            };
        }

        totalFiles = files.length;
        logger.info(`Verifying ${totalFiles} files from S3...`);

        // Verify each file
        for (const file of files) {
            try {
                // Download file from S3
                const s3Params = {
                    Bucket: file.s3_bucket,
                    Key: file.s3_key
                };

                logger.debug(`Downloading ${file.filename} from S3...`);
                const s3Object = await s3.getObject(s3Params).promise();

                // Calculate SHA-256 hash of downloaded content
                const calculatedHash = crypto
                    .createHash('sha256')
                    .update(s3Object.Body)
                    .digest('hex');

                // Compare with stored hash
                const isValid = calculatedHash === file.file_hash;

                if (!isValid) {
                    logger.error(`FILE TAMPERING DETECTED: ${file.filename}`, {
                        fileId: file.id,
                        storedHash: file.file_hash,
                        calculatedHash: calculatedHash,
                        s3Key: file.s3_key
                    });

                    corruptedFiles.push({
                        id: file.id,
                        filename: file.filename,
                        storedHash: file.file_hash,
                        calculatedHash: calculatedHash,
                        s3Bucket: file.s3_bucket,
                        s3Key: file.s3_key
                    });

                    // Alert compliance team immediately
                    await alertComplianceTeam(file, calculatedHash);
                } else {
                    validFiles++;
                    logger.debug(`✓ Verified: ${file.filename}`);
                }

                // Record the integrity check in database
                const { error: insertError } = await supabase
                    .from('file_integrity_checks')
                    .insert({
                        file_id: file.id,
                        stored_hash: file.file_hash,
                        computed_hash: calculatedHash,
                        is_valid: isValid,
                        checked_at: new Date().toISOString()
                    });

                if (insertError) {
                    logger.error(`Failed to record integrity check for ${file.filename}:`, insertError);
                }

            } catch (error) {
                logger.error(`Failed to verify file ${file.filename}:`, error);
                erroredFiles.push({
                    id: file.id,
                    filename: file.filename,
                    error: error.message
                });
            }
        }

    } catch (error) {
        logger.error('File integrity verification failed:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }

    const duration = Date.now() - startTime;

    const summary = {
        success: true,
        timestamp: new Date().toISOString(),
        duration_ms: duration,
        results: {
            totalFiles: totalFiles,
            validFiles: validFiles,
            corruptedFiles: corruptedFiles.length,
            erroredFiles: erroredFiles.length,
            corruptionRate: totalFiles > 0 ? (corruptedFiles.length / totalFiles * 100).toFixed(2) + '%' : 'N/A'
        },
        details: {
            corruptedFiles: corruptedFiles,
            erroredFiles: erroredFiles
        }
    };

    logger.info('=== File integrity verification complete ===');
    logger.info(JSON.stringify(summary, null, 2));

    // Log summary to database
    await logVerificationSummary(summary);

    return summary;
}

/**
 * Alert compliance team of file tampering
 */
async function alertComplianceTeam(file, calculatedHash) {
    try {
        const alert = {
            severity: 'CRITICAL',
            type: 'FILE_TAMPERING',
            fileId: file.id,
            filename: file.filename,
            s3Bucket: file.s3_bucket,
            s3Key: file.s3_key,
            storedHash: file.file_hash,
            calculatedHash: calculatedHash,
            timestamp: new Date().toISOString(),
            action: 'QUARANTINE FILE - File integrity compromised'
        };

        // Log alert to database
        const { error } = await supabase
            .from('security_alerts')
            .insert({
                alert_type: 'FILE_TAMPERING',
                severity: 'CRITICAL',
                message: `File tampering detected: ${file.filename}`,
                details: alert,
                created_at: new Date().toISOString()
            });

        if (error) {
            logger.error('Failed to log security alert:', error);
        }

        // TODO: Send alerts to:
        // - Slack webhook
        // - Email to compliance@company.com
        // - PagerDuty incident
        // - AWS CloudWatch alarm

        console.error('\n\n=== PHARBIT FILE INTEGRITY ALERT ===');
        console.error(JSON.stringify(alert, null, 2));
        console.error('=====================================\n\n');

    } catch (error) {
        logger.error('Failed to alert compliance team:', error);
    }
}

/**
 * Log verification summary to database
 */
async function logVerificationSummary(summary) {
    try {
        const { error } = await supabase
            .from('file_integrity_logs')
            .insert({
                summary: summary,
                checked_at: new Date().toISOString()
            });

        if (error) {
            logger.error('Failed to log verification summary:', error);
        }
    } catch (error) {
        logger.error('Error logging verification summary:', error);
    }
}

/**
 * Schedule daily integrity check (2 AM UTC)
 */
function scheduleDaily() {
    const schedule = require('node-schedule');

    // Run daily at 2 AM UTC
    const job = schedule.scheduleJob('0 2 * * *', async () => {
        logger.info('Scheduled file integrity verification triggered');
        await verifyFileIntegrity();
    });

    logger.info('File integrity verification scheduled for daily 2 AM UTC');

    // Also allow manual trigger via API
    return job;
}

/**
 * Export functions for use in express app
 */
module.exports = {
    verifyFileIntegrity,
    scheduleDaily,
    alertComplianceTeam,
    logVerificationSummary
};

// If running as standalone job
if (require.main === module) {
    verifyFileIntegrity().then((result) => {
        console.log('Verification complete:', result);
        process.exit(result.success ? 0 : 1);
    }).catch((error) => {
        console.error('Verification failed:', error);
        process.exit(1);
    });
}
