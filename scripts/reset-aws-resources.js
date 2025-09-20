const { S3Client, DeleteBucketCommand, DeleteObjectCommand, ListObjectsV2Command, CreateBucketCommand } = require('@aws-sdk/client-s3');
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');

async function emptyAndDeleteBucket(s3Client, bucketName) {
    try {
        console.log(`\nEmptying bucket: ${bucketName}`);
        // First, delete all objects in the bucket
        const listParams = {
            Bucket: bucketName
        };
        
        const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));
        if (listedObjects.Contents) {
            for (const object of listedObjects.Contents) {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: object.Key
                }));
                console.log(`Deleted object: ${object.Key}`);
            }
        }

        // Then delete the bucket
        console.log(`Deleting bucket: ${bucketName}`);
        await s3Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
        console.log(`Successfully deleted bucket: ${bucketName}`);
    } catch (error) {
        console.error(`Error with bucket ${bucketName}:`, error.message);
    }
}

async function resetAWSResources() {
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    const ec2Client = new EC2Client({ region: process.env.AWS_REGION });
    
    try {
        // Delete existing buckets
        await emptyAndDeleteBucket(s3Client, 'pharbit-bucket');
        await emptyAndDeleteBucket(s3Client, 'pharbit-blockchain-server');
        
        // Create new bucket
        const newBucketName = 'pharbit-blockchain-server';
        console.log(`\nCreating new bucket: ${newBucketName}`);
        await s3Client.send(new CreateBucketCommand({
            Bucket: newBucketName,
            CreateBucketConfiguration: {
                LocationConstraint: process.env.AWS_REGION
            }
        }));
        console.log('New bucket created successfully!');

        // Get EC2 instance information
        console.log('\nFetching EC2 instance details...');
        const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({}));
        const instances = Reservations.flatMap(r => r.Instances || []);
        
        // Find the pharbit-blockchain-server instance
        const serverInstance = instances.find(i => 
            i.Tags?.some(tag => tag.Key === 'Name' && tag.Value.includes('blockchain-server')) ||
            i.InstanceId === 'i-0ea98f672fd8536d9' // This is the c7i-flex.large instance we saw earlier
        );

        if (serverInstance) {
            console.log('\nBlockchain Server Instance Details:');
            console.log(`Instance ID: ${serverInstance.InstanceId}`);
            console.log(`Instance Type: ${serverInstance.InstanceType}`);
            console.log(`State: ${serverInstance.State.Name}`);
            console.log(`Public DNS: ${serverInstance.PublicDnsName}`);
            console.log(`Public IP: ${serverInstance.PublicIpAddress}`);
        } else {
            console.log('\nWarning: Could not find the blockchain server instance');
        }

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

resetAWSResources();