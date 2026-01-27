const { ethers } = require('ethers');
const express = require('express');
const logger = require('./utils/logger');

/**
 * ConsensusMonitor Service
 * @description Monitors 7-node IBFT 2.0 consensus health every 10 seconds
 * @dscsa Ensures system resilience; alerts on consensus stall
 */
class ConsensusMonitor {
    constructor() {
        this.providers = [];
        this.consensusHealthy = true;
        this.lastBlockTime = null;
        this.lastBlockNumber = null;
        this.maxBlockTime = 30000; // 30 seconds
        this.minHealthyValidators = 5; // 7 nodes, need 5+ healthy
        this.monitorInterval = null;
        this.healthHistory = [];
        this.app = null;
    }

    /**
     * Initialize providers for all 7 validators
     */
    initializeProviders() {
        const validatorUrls = [
            process.env.VALIDATOR_1_RPC || 'http://validator-1:8545',
            process.env.VALIDATOR_2_RPC || 'http://validator-2:8545',
            process.env.VALIDATOR_3_RPC || 'http://validator-3:8545',
            process.env.VALIDATOR_4_RPC || 'http://validator-4:8545',
            process.env.VALIDATOR_5_RPC || 'http://validator-5:8545',
            process.env.VALIDATOR_6_RPC || 'http://validator-6:8545',
            process.env.VALIDATOR_7_RPC || 'http://validator-7:8545',
        ];

        this.providers = validatorUrls.map((url) => 
            new ethers.JsonRpcProvider(url)
        );

        logger.info(`ConsensusMonitor initialized with ${this.providers.length} validators`);
    }

    /**
     * Start monitoring consensus health
     */
    startMonitoring() {
        logger.info('Starting Besu IBFT 2.0 consensus health monitor...');

        this.monitorInterval = setInterval(async () => {
            try {
                const results = await this._checkValidatorHealth();
                const analysis = this._analyzeHealth(results);

                // Store in history
                this.healthHistory.push({
                    timestamp: new Date(),
                    analysis: analysis
                });

                // Keep last 1000 entries
                if (this.healthHistory.length > 1000) {
                    this.healthHistory.shift();
                }

                // Check if consensus is still healthy
                if (analysis.healthyValidators < this.minHealthyValidators) {
                    logger.error(`CONSENSUS_CRITICAL: Only ${analysis.healthyValidators}/7 validators healthy`, analysis);
                    this.consensusHealthy = false;
                    await this._alertOperators('CONSENSUS_CRITICAL', analysis);
                } else if (analysis.blockDivergence > 3) {
                    logger.warn(`CONSENSUS_DIVERGENCE: Block height divergence of ${analysis.blockDivergence}`, analysis);
                    await this._alertOperators('CONSENSUS_DIVERGENCE', analysis);
                } else if (analysis.blockTimeExceeded) {
                    logger.error(`CONSENSUS_STALL: No blocks in ${analysis.timeSinceLastBlock}ms`, analysis);
                    await this._alertOperators('CONSENSUS_STALL', analysis);
                } else {
                    this.consensusHealthy = true;
                }

            } catch (error) {
                logger.error('ConsensusMonitor error:', error);
            }
        }, 10000); // Check every 10 seconds
    }

    /**
     * Check health of all validators
     */
    async _checkValidatorHealth() {
        return Promise.all(
            this.providers.map(async (provider, index) => {
                try {
                    const blockNumber = await provider.getBlockNumber();
                    const block = await provider.getBlock(blockNumber);
                    const networkStatus = await provider.getNetwork();

                    return {
                        validatorId: index + 1,
                        blockNumber: blockNumber,
                        timestamp: block.timestamp,
                        healthy: true,
                        chainId: networkStatus.chainId,
                        error: null
                    };
                } catch (error) {
                    return {
                        validatorId: index + 1,
                        healthy: false,
                        error: error.message,
                        blockNumber: 0,
                        timestamp: 0
                    };
                }
            })
        );
    }

    /**
     * Analyze validator health results
     */
    _analyzeHealth(results) {
        const healthyResults = results.filter(r => r.healthy);
        const blockNumbers = healthyResults.map(r => r.blockNumber);
        const timestamps = healthyResults.map(r => r.timestamp);

        const maxBlock = Math.max(...blockNumbers);
        const minBlock = Math.min(...blockNumbers);
        const blockDivergence = maxBlock - minBlock;

        const latestBlock = healthyResults.reduce((a, b) =>
            a.blockNumber > b.blockNumber ? a : b
        );

        let timeSinceLastBlock = 0;
        let blockTimeExceeded = false;

        if (this.lastBlockTime) {
            timeSinceLastBlock = Math.floor(Date.now() / 1000) - this.lastBlockTime;
            blockTimeExceeded = timeSinceLastBlock > 30; // 30 seconds
        }

        this.lastBlockTime = Math.floor(Date.now() / 1000);
        this.lastBlockNumber = latestBlock.blockNumber;

        return {
            timestamp: new Date().toISOString(),
            healthyValidators: healthyResults.length,
            totalValidators: results.length,
            blockDivergence: blockDivergence,
            latestBlockNumber: maxBlock,
            latestBlockTime: Math.max(...timestamps),
            timeSinceLastBlock: timeSinceLastBlock,
            blockTimeExceeded: blockTimeExceeded,
            consensusHealthy: healthyResults.length >= this.minHealthyValidators,
            validatorDetails: results
        };
    }

    /**
     * Alert operators of critical consensus issues
     */
    async _alertOperators(alertType, analysis) {
        const message = {
            severity: alertType === 'CONSENSUS_CRITICAL' ? 'CRITICAL' : 'WARNING',
            alert: alertType,
            details: analysis,
            timestamp: new Date().toISOString(),
            recommendation: this._getRecommendation(alertType, analysis)
        };

        // Log to persistent log
        logger.alert(JSON.stringify(message, null, 2));

        // TODO: Integrate with:
        // - Slack: POST to webhook_url
        // - PagerDuty: Create incident
        // - CloudWatch: PutMetricAlarm
        // - Email: Send to on-call engineer

        console.error('\n\n=== PHARBIT CONSENSUS ALERT ===');
        console.error(JSON.stringify(message, null, 2));
        console.error('================================\n\n');
    }

    /**
     * Get recommended action based on alert type
     */
    _getRecommendation(alertType, analysis) {
        const recommendations = {
            'CONSENSUS_CRITICAL': `
                IMMEDIATE ACTION REQUIRED:
                - Only ${analysis.healthyValidators}/7 validators responding
                - Consensus cannot proceed (need 5+ validators)
                - ACTIONS: 
                  1. Check validator logs for errors
                  2. Verify network connectivity between regions
                  3. Restart unhealthy validators
                  4. Contact cloud provider if infrastructure issue
                - ESCALATION: Page on-call engineer immediately
            `,
            'CONSENSUS_DIVERGENCE': `
                Block height divergence of ${analysis.blockDivergence} blocks detected
                - Validators may be experiencing transient network partition
                - ACTIONS:
                  1. Monitor for next 2-3 minutes
                  2. Check inter-region network latency
                  3. Review firewall rules for validator P2P ports
                - If divergence persists > 5 minutes, escalate to CRITICAL
            `,
            'CONSENSUS_STALL': `
                No new blocks in ${analysis.timeSinceLastBlock}s
                - Consensus may be temporarily stalled
                - ACTIONS:
                  1. Check transaction pool (mempool full?)
                  2. Verify all validators are connected to network
                  3. Check CPU/memory usage on validators
                  4. Monitor block interval - should return to normal within 30s
                - If stall persists > 60s, escalate to CRITICAL
            `
        };

        return recommendations[alertType] || 'Unknown alert type';
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            logger.info('ConsensusMonitor stopped');
        }
    }

    /**
     * Check if consensus is currently healthy
     */
    isHealthy() {
        return this.consensusHealthy;
    }

    /**
     * Get latest health status
     */
    getStatus() {
        if (this.healthHistory.length === 0) {
            return { status: 'INITIALIZING', message: 'Monitor not yet ready' };
        }

        const latest = this.healthHistory[this.healthHistory.length - 1];
        return {
            status: latest.analysis.consensusHealthy ? 'HEALTHY' : 'UNHEALTHY',
            analysis: latest.analysis,
            lastUpdate: latest.timestamp
        };
    }

    /**
     * Get health history
     */
    getHistory(minutes = 60) {
        const cutoffTime = Date.now() - (minutes * 60 * 1000);
        return this.healthHistory.filter(h => h.timestamp.getTime() > cutoffTime);
    }

    /**
     * Start Express server for monitoring endpoints
     */
    startServer(port = 3001) {
        this.app = express();

        // Health endpoint
        this.app.get('/health', (req, res) => {
            const status = this.getStatus();
            const statusCode = status.status === 'HEALTHY' ? 200 : 503;
            res.status(statusCode).json(status);
        });

        // Full status endpoint
        this.app.get('/status', (req, res) => {
            res.json(this.getStatus());
        });

        // History endpoint
        this.app.get('/history', (req, res) => {
            const minutes = req.query.minutes ? parseInt(req.query.minutes) : 60;
            res.json({
                duration_minutes: minutes,
                entries: this.getHistory(minutes)
            });
        });

        // Consensus ready check
        this.app.get('/consensus/ready', (req, res) => {
            const status = this.getStatus();
            if (status.status === 'HEALTHY') {
                res.status(200).json({ ready: true, message: 'Consensus operational' });
            } else {
                res.status(503).json({
                    ready: false,
                    message: 'Consensus unhealthy',
                    details: status.analysis
                });
            }
        });

        // Live endpoint for load balancer health checks
        this.app.get('/live', (req, res) => {
            res.status(200).json({ live: true });
        });

        this.app.listen(port, () => {
            logger.info(`ConsensusMonitor REST API listening on port ${port}`);
        });
    }
}

// Initialize and start
const monitor = new ConsensusMonitor();
monitor.initializeProviders();
monitor.startMonitoring();
monitor.startServer(process.env.MONITOR_PORT || 3001);

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down ConsensusMonitor...');
    monitor.stopMonitoring();
    process.exit(0);
});

module.exports = monitor;
