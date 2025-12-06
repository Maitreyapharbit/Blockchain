const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const supabase = require('../supabase/client');
const { ethers } = require('ethers');
const { getAllContracts } = require('../utils/contract-loader');

// Validation middleware
const validatePricingData = [
    body('batch_id').notEmpty().withMessage('Batch ID required'),
    body('drug_name').notEmpty().withMessage('Drug name required'),
    body('manufacturer_price').isNumeric().withMessage('Price must be numeric'),
];

const validateCheckpoint = [
    body('batch_id').notEmpty().withMessage('Batch ID required'),
    body('participant_type').isIn(['manufacturer', 'wholesaler', 'pharmacy', 'pbm', 'insurance']),
    body('price').isNumeric().withMessage('Price must be numeric'),
];

// Helper function to get signer
async function getSigner() {
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb476cadcccea5d0f6d2e10b6c5d5';
    return new ethers.Wallet(privateKey, provider);
}

// POST /pricing-ledger - Create initial drug pricing record
router.post('/pricing-ledger', validatePricingData, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { batch_id, drug_name, manufacturer_price, is_public, blockchain_record } = req.body;
        const user_id = req.user?.id || 'anonymous';

        // Record on blockchain if requested
        let tx_hash = null;
        if (blockchain_record) {
            const signer = await getSigner();
            const contracts = await getAllContracts(signer);
            const pricingContract = contracts.DrugPricingLedger;

            if (pricingContract) {
                const tx = await pricingContract.recordManufacturerPrice(
                    ethers.id(batch_id),
                    drug_name,
                    ethers.parseUnits(manufacturer_price.toString(), 2),
                    is_public || false
                );
                await tx.wait();
                tx_hash = tx.hash;
            }
        }

        // Insert into database
        const { data, error } = await supabase
            .from('drug_pricing_ledger')
            .insert({
                batch_id,
                drug_name,
                manufacturer_price,
                is_public: is_public || false,
                created_by: user_id,
                blockchain_tx_hash: tx_hash,
                created_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;

        res.json({
            success: true,
            data: data[0],
            blockchain_tx: tx_hash
        });
    } catch (error) {
        console.error('Error creating pricing record:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /pricing-ledger/:batchId/checkpoint - Add supply chain checkpoint
router.post('/pricing-ledger/:batchId/checkpoint', validateCheckpoint, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { batchId } = req.params;
        const { participant_type, price, notes, blockchain_record } = req.body;
        const user_id = req.user?.id || 'anonymous';

        // Record on blockchain
        let tx_hash = null;
        if (blockchain_record) {
            const signer = await getSigner();
            const contracts = await getAllContracts(signer);
            const pricingContract = contracts.DrugPricingLedger;

            if (pricingContract) {
                const tx = await pricingContract.addPriceCheckpoint(
                    ethers.id(batchId),
                    participant_type,
                    ethers.parseUnits(price.toString(), 2),
                    notes || ''
                );
                await tx.wait();
                tx_hash = tx.hash;
            }
        }

        // Insert checkpoint
        const { data, error } = await supabase
            .from('drug_pricing_ledger')
            .insert({
                batch_id: batchId,
                participant_type,
                participant_price: price,
                notes,
                recorded_by: user_id,
                blockchain_tx_hash: tx_hash,
                created_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;

        res.json({
            success: true,
            data: data[0],
            blockchain_tx: tx_hash
        });
    } catch (error) {
        console.error('Error adding checkpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /pricing-ledger/:batchId - Get full pricing chain
router.get('/pricing-ledger/:batchId', async (req, res) => {
    try {
        const { batchId } = req.params;

        const { data, error } = await supabase
            .from('drug_pricing_ledger')
            .select('*')
            .eq('batch_id', batchId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data.length === 0) {
            return res.status(404).json({ error: 'Pricing record not found' });
        }

        // Calculate statistics
        const prices = data.map(d => d.participant_price || d.manufacturer_price).filter(p => p);
        const finalPrice = prices[prices.length - 1];
        const initialPrice = data[0].manufacturer_price;
        const totalMarkup = finalPrice - initialPrice;
        const markupPercent = ((totalMarkup / initialPrice) * 100).toFixed(2);

        res.json({
            success: true,
            chain: data,
            summary: {
                drug_name: data[0].drug_name,
                initial_price: initialPrice,
                final_price: finalPrice,
                total_markup: totalMarkup,
                markup_percent: markupPercent,
                checkpoints: data.length - 1
            }
        });
    } catch (error) {
        console.error('Error fetching pricing chain:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /cash-price-comparison - Add pharmacy price data
router.post('/cash-price-comparison', [
    body('batch_id').notEmpty(),
    body('pharmacy_id').notEmpty(),
    body('cash_price').isNumeric(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { batch_id, pharmacy_id, cash_price, insurance_covered_price } = req.body;
        const user_id = req.user?.id || 'anonymous';

        const { data, error } = await supabase
            .from('cash_price_comparison')
            .insert({
                batch_id,
                pharmacy_id,
                cash_price,
                insurance_covered_price: insurance_covered_price || null,
                recorded_by: user_id,
                created_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;

        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error adding cash price:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /cash-prices/:batchId - Compare prices across pharmacies
router.get('/cash-prices/:batchId', async (req, res) => {
    try {
        const { batchId } = req.params;

        const { data, error } = await supabase
            .from('cash_price_comparison')
            .select('*')
            .eq('batch_id', batchId)
            .order('cash_price', { ascending: false });

        if (error) throw error;

        // Calculate statistics
        const prices = data.map(d => d.cash_price);
        const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceVariance = ((maxPrice - minPrice) / minPrice * 100).toFixed(2);

        res.json({
            success: true,
            prices: data,
            statistics: {
                average_price: avgPrice,
                lowest_price: minPrice,
                highest_price: maxPrice,
                price_variance_percent: priceVariance,
                pharmacy_count: data.length,
                potential_savings: maxPrice - minPrice
            }
        });
    } catch (error) {
        console.error('Error fetching cash prices:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /pricing-reports/transparency - Generate transparency report
router.post('/pricing-reports/transparency', [
    body('batch_id').notEmpty(),
], async (req, res) => {
    try {
        const { batch_id } = req.body;

        // Get pricing chain
        const { data: chainData, error: chainError } = await supabase
            .from('drug_pricing_ledger')
            .select('*')
            .eq('batch_id', batch_id)
            .order('created_at', { ascending: true });

        if (chainError) throw chainError;

        // Get cash prices
        const { data: cashPrices, error: priceError } = await supabase
            .from('cash_price_comparison')
            .select('*')
            .eq('batch_id', batch_id);

        if (priceError) throw priceError;

        // Calculate hidden markups (suspicious: >200% markup)
        let hiddenMarkups = [];
        for (let i = 1; i < chainData.length; i++) {
            const prevPrice = chainData[i-1].participant_price || chainData[i-1].manufacturer_price;
            const currentPrice = chainData[i].participant_price;
            const markup = ((currentPrice - prevPrice) / prevPrice * 100);
            
            if (markup > 200) {
                hiddenMarkups.push({
                    from: chainData[i-1].participant_type,
                    to: chainData[i].participant_type,
                    markup_percent: markup.toFixed(2),
                    notes: 'Suspicious markup detected'
                });
            }
        }

        res.json({
            success: true,
            report: {
                batch_id,
                pricing_chain: chainData,
                cash_price_comparison: cashPrices,
                hidden_markups: hiddenMarkups,
                transparency_metrics: {
                    chain_checkpoints: chainData.length,
                    pharmacy_price_variance: cashPrices.length > 0 ? 'Calculated' : 'N/A',
                    suspicious_markups_detected: hiddenMarkups.length,
                    report_generated_at: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
