const s3Service = require('../backend/services/s3Service');

async function testS3Operations() {
    try {
        // Test file upload
        console.log('\nTesting file upload...');
        const testData = {
            message: 'Test data',
            timestamp: new Date().toISOString()
        };
        const uploadResult = await s3Service.uploadFile(
            'test/sample.json',
            JSON.stringify(testData)
        );
        console.log('Upload successful:', uploadResult);

        // Test file retrieval
        console.log('\nTesting file retrieval...');
        const retrievedData = await s3Service.getFile('test/sample.json');
        console.log('Retrieved data:', retrievedData);

        // Test presigned URL generation
        console.log('\nTesting presigned URL generation...');
        const presignedUrl = await s3Service.getPresignedUrl('test/sample.json');
        console.log('Presigned URL:', presignedUrl);

        // Test listing files
        console.log('\nTesting file listing...');
        const files = await s3Service.listFiles('test/');
        console.log('Files in test directory:', files);

        // Test file deletion
        console.log('\nTesting file deletion...');
        const deleteResult = await s3Service.deleteFile('test/sample.json');
        console.log('Deletion successful:', deleteResult);

        console.log('\nAll S3 operations completed successfully!');
    } catch (error) {
        console.error('Error during S3 operations:', error);
    }
}

testS3Operations();