const { S3Client, CreateBucketCommand, ListBucketsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

async function setupBuckets() {
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    
    try {
        // List existing buckets
        console.log('Checking existing buckets...');
        const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
        console.log('Existing buckets:', Buckets.map(b => b.Name));

        // Create new bucket if it doesn't exist
        const newBucketName = 'pharbit-blockchain-server';
        if (!Buckets.find(b => b.Name === newBucketName)) {
            console.log(`\nCreating new bucket: ${newBucketName}`);
            await s3Client.send(new CreateBucketCommand({
                Bucket: newBucketName,
                CreateBucketConfiguration: {
                    LocationConstraint: process.env.AWS_REGION
                }
            }));
            console.log('Bucket created successfully!');
        } else {
            console.log(`\nBucket ${newBucketName} already exists`);
        }

        // Test uploading a small test file to both buckets
        const testContent = 'Test file content - ' + new Date().toISOString();
        
        console.log('\nTesting upload to pharbit-bucket...');
        await s3Client.send(new PutObjectCommand({
            Bucket: 'pharbit-bucket',
            Key: 'test.txt',
            Body: testContent
        }));
        console.log('Successfully uploaded to pharbit-bucket');

        console.log('\nTesting upload to pharbit-blockchain-server...');
        await s3Client.send(new PutObjectCommand({
            Bucket: newBucketName,
            Key: 'test.txt',
            Body: testContent
        }));
        console.log('Successfully uploaded to pharbit-blockchain-server');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

setupBuckets();