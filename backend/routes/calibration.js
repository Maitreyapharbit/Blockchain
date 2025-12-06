const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const supabase = require('../supabase/client');
const { ethers } = require('ethers');
const { getAllContracts } = require('../utils/contract-loader');
const QRCode = require('qrcode');

// Helper function to get signer
async function getSigner() {
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb476cadcccea5d0f6d2e10b6c5d5';
    return new ethers.Wallet(privateKey, provider);
}

// POST /equipment - Register new equipment
router.post('/equipment', [
    body('equipment_name').notEmpty().withMessage('Equipment name required'),
    body('equipment_type').notEmpty().withMessage('Equipment type required'),
    body('calibration_frequency_days').isNumeric().withMessage('Frequency must be numeric'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { equipment_name, equipment_type, calibration_frequency_days, blockchain_record } = req.body;
        const user_id = req.user?.id || 'anonymous';
        const equipment_id = `EQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Generate QR code for equipment
        const qr_data = JSON.stringify({
            equipment_id,
            equipment_name,
            created_at: new Date().toISOString()
        });
        const qr_code = await QRCode.toDataURL(qr_data);

        // Record on blockchain
        let tx_hash = null;
        if (blockchain_record) {
            const signer = await getSigner();
            const contracts = await getAllContracts(signer);
            const calibrationContract = contracts.EquipmentCalibrationLedger;

            if (calibrationContract) {
                const tx = await calibrationContract.registerEquipment(
                    ethers.id(equipment_id),
                    equipment_name,
                    equipment_type,
                    calibration_frequency_days
                );
                await tx.wait();
                tx_hash = tx.hash;
            }
        }

        // Calculate next calibration date
        const next_calibration_date = new Date();
        next_calibration_date.setDate(next_calibration_date.getDate() + parseInt(calibration_frequency_days));

        // Insert into database
        const { data, error } = await supabase
            .from('manufacturing_equipment')
            .insert({
                equipment_id,
                equipment_name,
                equipment_type,
                calibration_frequency_days,
                qr_code,
                next_calibration_date: next_calibration_date.toISOString(),
                registered_by: user_id,
                blockchain_tx_hash: tx_hash,
                created_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;

        res.json({
            success: true,
            data: data[0],
            qr_code,
            blockchain_tx: tx_hash
        });
    } catch (error) {
        console.error('Error registering equipment:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /equipment - List all equipment
router.get('/equipment', async (req, res) => {
    try {
        const { equipment_type, status } = req.query;
        let query = supabase.from('manufacturing_equipment').select('*');

        if (equipment_type) {
            query = query.eq('equipment_type', equipment_type);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /equipment/:equipmentId - Get equipment details
router.get('/equipment/:equipmentId', async (req, res) => {
    try {
        const { equipmentId } = req.params;

        const { data, error } = await supabase
            .from('manufacturing_equipment')
            .select('*')
            .eq('equipment_id', equipmentId)
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /calibration-record - Log equipment calibration
router.post('/calibration-record', [
    body('equipment_id').notEmpty(),
    body('actual_reading').notEmpty(),
    body('expected_reading').notEmpty(),
    body('passed').isBoolean(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            equipment_id,
            actual_reading,
            expected_reading,
            deviation_basis_points,
            certificate_hash,
            passed,
            correction_action,
            blockchain_record
        } = req.body;
        const user_id = req.user?.id || 'anonymous';

        // Calculate deviation
        const actual = parseFloat(actual_reading);
        const expected = parseFloat(expected_reading);
        const deviation = Math.abs((actual - expected) / expected * 10000);

        // Record on blockchain
        let tx_hash = null;
        if (blockchain_record) {
            const signer = await getSigner();
            const contracts = await getAllContracts(signer);
            const calibrationContract = contracts.EquipmentCalibrationLedger;

            if (calibrationContract) {
                const tx = await calibrationContract.recordCalibration(
                    ethers.id(equipment_id),
                    actual_reading,
                    expected_reading,
                    Math.ceil(deviation),
                    certificate_hash || '',
                    passed,
                    ethers.id(certificate_hash || equipment_id)
                );
                await tx.wait();
                tx_hash = tx.hash;
            }
        }

        // Insert calibration record
        const { data, error } = await supabase
            .from('equipment_calibration_ledger')
            .insert({
                equipment_id,
                actual_reading,
                expected_reading,
                deviation_percent: (deviation / 100).toFixed(2),
                certificate_hash,
                passed,
                correction_action: correction_action || null,
                recorded_by: user_id,
                blockchain_tx_hash: tx_hash,
                created_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;

        // Update equipment next calibration date
        const equipment = await supabase
            .from('manufacturing_equipment')
            .select('calibration_frequency_days')
            .eq('equipment_id', equipment_id)
            .single();

        if (equipment.data) {
            const next_date = new Date();
            next_date.setDate(next_date.getDate() + equipment.data.calibration_frequency_days);

            await supabase
                .from('manufacturing_equipment')
                .update({
                    last_calibration_date: new Date().toISOString(),
                    next_calibration_date: next_date.toISOString()
                })
                .eq('equipment_id', equipment_id);
        }

        res.json({
            success: true,
            data: data[0],
            blockchain_tx: tx_hash
        });
    } catch (error) {
        console.error('Error recording calibration:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /calibration-history/:equipmentId - Get calibration history
router.get('/calibration-history/:equipmentId', async (req, res) => {
    try {
        const { equipmentId } = req.params;
        const { limit } = req.query;

        let query = supabase
            .from('equipment_calibration_ledger')
            .select('*')
            .eq('equipment_id', equipmentId)
            .order('created_at', { ascending: false });

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Error fetching calibration history:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /calibration-schedule - Get upcoming calibrations
router.get('/calibration-schedule', async (req, res) => {
    try {
        const { status, days_until } = req.query;

        const { data, error } = await supabase
            .from('manufacturing_equipment')
            .select('*')
            .order('next_calibration_date', { ascending: true });

        if (error) throw error;

        // Filter by status if provided
        let filtered = data;
        if (status) {
            const now = new Date();
            if (status === 'overdue') {
                filtered = data.filter(e => new Date(e.next_calibration_date) < now);
            } else if (status === 'due_soon') {
                const soonDate = new Date();
                soonDate.setDate(soonDate.getDate() + (parseInt(days_until) || 7));
                filtered = data.filter(e => {
                    const dueDate = new Date(e.next_calibration_date);
                    return dueDate >= now && dueDate <= soonDate;
                });
            }
        }

        res.json({
            success: true,
            data: filtered,
            count: filtered.length
        });
    } catch (error) {
        console.error('Error fetching calibration schedule:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /calibration-schedule - Schedule calibration
router.post('/calibration-schedule', [
    body('equipment_id').notEmpty(),
    body('scheduled_date').isISO8601(),
    body('technician_id').notEmpty(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { equipment_id, scheduled_date, technician_id, notes } = req.body;
        const user_id = req.user?.id || 'anonymous';

        const { data, error } = await supabase
            .from('calibration_schedule')
            .insert({
                equipment_id,
                scheduled_date,
                technician_id,
                notes: notes || null,
                scheduled_by: user_id,
                status: 'scheduled',
                created_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;

        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error scheduling calibration:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /calibration-analytics/:equipmentId - Predictive maintenance
router.get('/calibration-analytics/:equipmentId', async (req, res) => {
    try {
        const { equipmentId } = req.params;

        // Get calibration history
        const { data: history, error: historyError } = await supabase
            .from('equipment_calibration_ledger')
            .select('*')
            .eq('equipment_id', equipmentId)
            .order('created_at', { ascending: true });

        if (historyError) throw historyError;

        // Calculate trends
        let failureCount = 0;
        let totalDeviation = 0;
        let deviationTrend = [];
        let passTrend = [];

        for (let i = 0; i < history.length; i++) {
            const record = history[i];
            totalDeviation += parseFloat(record.deviation_percent || 0);
            deviationTrend.push(record.deviation_percent);
            passTrend.push(record.passed ? 1 : 0);

            if (!record.passed) {
                failureCount++;
            }
        }

        // Calculate failure rate
        const failureRate = history.length > 0 ? (failureCount / history.length * 100).toFixed(2) : 0;
        const avgDeviation = history.length > 0 ? (totalDeviation / history.length).toFixed(3) : 0;

        // Predictive risk calculation
        let riskScore = 0;
        if (history.length >= 3) {
            // Look at trend in recent calibrations
            const recentRecords = history.slice(-5);
            const recentFailures = recentRecords.filter(r => !r.passed).length;
            const recentDeviations = recentRecords.map(r => parseFloat(r.deviation_percent || 0));
            
            riskScore = (recentFailures * 20) + (Math.max(...recentDeviations) / 100) * 60;
        }

        res.json({
            success: true,
            analytics: {
                total_calibrations: history.length,
                failure_rate_percent: failureRate,
                average_deviation_percent: avgDeviation,
                failure_count: failureCount,
                pass_count: history.length - failureCount,
                predictive_risk_score: Math.min(100, riskScore).toFixed(2),
                recommendations: riskScore > 60 
                    ? ['Schedule immediate calibration', 'Inspect equipment for wear', 'Review maintenance logs']
                    : riskScore > 30
                    ? ['Schedule calibration within 2 weeks', 'Monitor deviation trends']
                    : ['Equipment performing normally', 'Continue regular schedule']
            },
            trends: {
                deviation_history: deviationTrend,
                pass_history: passTrend
            }
        });
    } catch (error) {
        console.error('Error calculating analytics:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /audit-report - Generate FDA calibration audit report
router.post('/audit-report', [
    body('equipment_id').notEmpty(),
], async (req, res) => {
    try {
        const { equipment_id, from_date, to_date } = req.body;
        const user_id = req.user?.id || 'anonymous';

        // Get equipment details
        const { data: equipment, error: equipError } = await supabase
            .from('manufacturing_equipment')
            .select('*')
            .eq('equipment_id', equipment_id)
            .single();

        if (equipError) throw equipError;

        // Get calibration history for period
        let query = supabase
            .from('equipment_calibration_ledger')
            .select('*')
            .eq('equipment_id', equipment_id);

        if (from_date) query = query.gte('created_at', from_date);
        if (to_date) query = query.lte('created_at', to_date);

        const { data: history, error: historyError } = await query.order('created_at', { ascending: true });

        if (historyError) throw historyError;

        // Generate report
        const failureRecords = history.filter(r => !r.passed);
        const allPassed = failureRecords.length === 0;

        const reportData = {
            report_id: `FDA-${equipment_id}-${Date.now()}`,
            equipment_id,
            equipment_name: equipment.equipment_name,
            equipment_type: equipment.equipment_type,
            report_date: new Date().toISOString(),
            period_start: from_date || 'All time',
            period_end: to_date || new Date().toISOString(),
            total_calibrations: history.length,
            passed_calibrations: history.filter(r => r.passed).length,
            failed_calibrations: failureRecords.length,
            compliance_status: allPassed ? 'COMPLIANT' : 'NON-COMPLIANT',
            failure_details: failureRecords.map(r => ({
                date: r.created_at,
                deviation: r.deviation_percent,
                action_taken: r.correction_action,
                certificate: r.certificate_hash
            })),
            generated_by: user_id,
            signature_required: true
        };

        // Store report
        const { data: report, error: reportError } = await supabase
            .from('calibration_audit_reports')
            .insert(reportData)
            .select();

        if (reportError) throw reportError;

        res.json({
            success: true,
            report: report[0]
        });
    } catch (error) {
        console.error('Error generating audit report:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /audit-reports - List audit reports
router.get('/audit-reports', async (req, res) => {
    try {
        const { equipment_id, compliance_status } = req.query;
        let query = supabase.from('calibration_audit_reports').select('*');

        if (equipment_id) query = query.eq('equipment_id', equipment_id);
        if (compliance_status) query = query.eq('compliance_status', compliance_status);

        const { data, error } = await query.order('report_date', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data, count: data.length });
    } catch (error) {
        console.error('Error fetching audit reports:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
