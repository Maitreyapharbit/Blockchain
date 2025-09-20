const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');

async function testConnections() {
    // Initialize clients
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    const ec2Client = new EC2Client({ region: process.env.AWS_REGION });

    console.log('Testing AWS Connections...');
    
    try {
        // Test S3
        console.log('\nTesting S3 connection...');
        const s3Response = await s3Client.send(new ListBucketsCommand({}));
        console.log('S3 Buckets:', s3Response.Buckets?.map(b => b.Name));
        
        // Test EC2
        console.log('\nTesting EC2 connection...');
        const ec2Response = await ec2Client.send(new DescribeInstancesCommand({}));
        const instances = ec2Response.Reservations?.flatMap(r => r.Instances || []) || [];
        console.log('EC2 Instances:', instances.map(i => ({
            InstanceId: i.InstanceId,
            State: i.State?.Name,
            Type: i.InstanceType
        })));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testConnections();