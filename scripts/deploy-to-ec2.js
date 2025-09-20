const { EC2Client, DescribeInstancesCommand, StartInstancesCommand } = require('@aws-sdk/client-ec2');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function deployToEC2() {
    try {
        // Initialize EC2 client
        const ec2Client = new EC2Client({ region: process.env.AWS_REGION });

        // Check instance status
        const describeCommand = new DescribeInstancesCommand({
            InstanceIds: [process.env.EC2_INSTANCE_ID]
        });
        
        console.log('Checking EC2 instance status...');
        const { Reservations } = await ec2Client.send(describeCommand);
        const instance = Reservations[0].Instances[0];

        // Start instance if it's stopped
        if (instance.State.Name === 'stopped') {
            console.log('Starting EC2 instance...');
            await ec2Client.send(new StartInstancesCommand({
                InstanceIds: [process.env.EC2_INSTANCE_ID]
            }));
            console.log('Waiting for instance to start...');
            await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60s
        }

        // Create SSH key file
        const sshKeyPath = path.join(__dirname, 'blockchain-server.pem');
        const sshKeyContent = `-----BEGIN RSA PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END RSA PRIVATE KEY-----`;
        
        await fs.writeFile(sshKeyPath, sshKeyContent, { mode: 0o600 });

        // Set up SSH command
        const sshOptions = [
            '-o StrictHostKeyChecking=no',
            '-o UserKnownHostsFile=/dev/null',
            '-i', sshKeyPath
        ];

        // Deploy commands
        const deployCommands = [
            'cd /home/ubuntu/blockchain',
            'git pull origin main',
            'npm install',
            'pm2 restart all'
        ];

        // Execute deployment
        console.log('Deploying to EC2...');
        const sshCommand = `ssh ${sshOptions.join(' ')} ubuntu@${process.env.EC2_PUBLIC_DNS} '${deployCommands.join(' && ')}'`;
        
        const { stdout, stderr } = await execAsync(sshCommand);
        console.log('Deployment stdout:', stdout);
        if (stderr) console.error('Deployment stderr:', stderr);

        // Clean up
        await fs.unlink(sshKeyPath);
        
        console.log('Deployment completed successfully!');
        
    } catch (error) {
        console.error('Deployment failed:', error.message);
        process.exit(1);
    }
}

deployToEC2();