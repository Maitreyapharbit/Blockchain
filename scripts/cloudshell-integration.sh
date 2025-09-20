#!/bin/bash

# Variables
INSTANCE_ID="i-0ea98f672fd8536d9"
REGION="eu-north-1"
BUCKET_NAME="pharbit-blockchain-server"
APP_DIR="/var/www/blockchain"

echo "Starting Project Integration..."

# 1. Configure S3 bucket CORS for web access
echo "Configuring S3 CORS..."
aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration '{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": ["ETag"]
        }
    ]
}'

# 2. Create deployment script
echo "Creating deployment script..."
cat << 'EOF' > ~/deploy.sh
#!/bin/bash
# Sync project files to EC2
aws s3 sync . s3://$BUCKET_NAME/deploy/
aws s3 cp s3://$BUCKET_NAME/deploy/ $APP_DIR --recursive

# Install dependencies
cd $APP_DIR
npm install

# Start application using PM2
pm2 start backend/index.js --name blockchain-server
pm2 save

# Configure Nginx
cat << 'NGINX' > /etc/nginx/sites-available/blockchain
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/blockchain /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
EOF

# Make deployment script executable
chmod +x ~/deploy.sh

# 3. Create backup script
echo "Creating backup script..."
cat << 'EOF' > ~/backup.sh
#!/bin/bash
# Backup application data
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
aws s3 sync $APP_DIR s3://$BUCKET_NAME/backups/$TIMESTAMP/
EOF

chmod +x ~/backup.sh

# 4. Create monitoring script
echo "Creating monitoring script..."
cat << 'EOF' > ~/monitor.sh
#!/bin/bash
# Check instance health
aws ec2 describe-instance-status --instance-id $INSTANCE_ID

# Check application status
pm2 status

# Check disk usage
df -h

# Check memory usage
free -h

# Check S3 bucket usage
aws s3 ls s3://$BUCKET_NAME --recursive --human-readable --summarize
EOF

chmod +x ~/monitor.sh

# 5. Set up CloudWatch monitoring
echo "Setting up CloudWatch monitoring..."
aws cloudwatch put-metric-alarm \
    --alarm-name pharbit-blockchain-cpu \
    --alarm-description "CPU utilization threshold exceeded" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --dimensions Name=InstanceId,Value=$INSTANCE_ID \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --statistic Average

echo "Integration complete!"
echo ""
echo "Available management scripts:"
echo "1. ~/deploy.sh  - Deploy application updates"
echo "2. ~/backup.sh  - Backup application data"
echo "3. ~/monitor.sh - Monitor system status"
echo ""
echo "To deploy your application:"
echo "1. Connect to your EC2 instance"
echo "2. Run: ~/deploy.sh"
echo ""
echo "To monitor your application:"
echo "1. Run: ~/monitor.sh"
echo ""
echo "To create a backup:"
echo "1. Run: ~/backup.sh"