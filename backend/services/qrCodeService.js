const QRCode = require('qrcode');

class QRCodeService {
    /**
     * Generate a QR code for a batch containing all its information
     * @param {Object} batch - The batch object containing all batch information
     * @returns {Promise<string>} - Base64 encoded QR code image
     */
    async generateBatchQRCode(batch) {
        try {
            // Create a comprehensive data object with all batch information
            const batchData = {
                batchId: batch.id,
                name: batch.name,
                manufacturer: batch.manufacturer,
                manufacturingDate: batch.manufacturingDate,
                expiryDate: batch.expiryDate,
                quantity: batch.quantity,
                location: batch.location,
                transactionHash: batch.transactionHash, // Blockchain transaction hash
                status: batch.status,
                blockchainId: batch.blockchainId, // ID on the blockchain
                // Add any other relevant batch information
            };

            // Convert the batch data to a JSON string
            const batchString = JSON.stringify(batchData);

            // Generate QR code as base64 string
            const qrCodeBase64 = await QRCode.toDataURL(batchString, {
                errorCorrectionLevel: 'H', // Highest error correction level
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                width: 300 // Size of QR code
            });

            return qrCodeBase64;
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('Failed to generate QR code for batch');
        }
    }

    /**
     * Generate a QR code with custom data
     * @param {Object} data - Custom data to encode in QR code
     * @returns {Promise<string>} - Base64 encoded QR code image
     */
    async generateCustomQRCode(data) {
        try {
            const dataString = JSON.stringify(data);
            const qrCodeBase64 = await QRCode.toDataURL(dataString, {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                width: 300
            });

            return qrCodeBase64;
        } catch (error) {
            console.error('Error generating custom QR code:', error);
            throw new Error('Failed to generate custom QR code');
        }
    }
}

module.exports = new QRCodeService();