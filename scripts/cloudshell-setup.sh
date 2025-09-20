#!/bin/bash

# Variables
INSTANCE_ID="i-0ea98f672fd8536d9"
REGION="eu-north-1"
BUCKET_NAME="pharbit-blockchain-server"
NEW_KEY_NAME="pharbit-blockchain-key-new"

echo "Starting AWS Configuration..."

# 1. Create new key pair
echo "Creating new key pair..."
aws ec2 create-key-pair \
    --key-name $NEW_KEY_NAME \
    --query 'KeyMaterial' \
    --output text > ~/$NEW_KEY_NAME.pem

chmod 400 ~/$NEW_KEY_NAME.pem

# 2. Configure S3 bucket
echo "Setting up S3 bucket..."
# Delete old bucket if exists
aws s3 rb s3://$BUCKET_NAME --force || true

# Create new bucket
aws s3api create-bucket \
    --bucket $BUCKET_NAME \
    --region $REGION \
    --create-bucket-configuration LocationConstraint=$REGION

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled

# 3. Add necessary instance permissions
echo "Configuring instance IAM role..."
# Create IAM role for EC2
aws iam create-role \
    --role-name pharbit-blockchain-role \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "ec2.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }'

# Attach S3 access policy
aws iam put-role-policy \
    --role-name pharbit-blockchain-role \
    --policy-name S3Access \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:ListBucket",
                    "s3:DeleteObject"
                ],
                "Resource": [
                    "arn:aws:s3:::'$BUCKET_NAME'",
                    "arn:aws:s3:::'$BUCKET_NAME'/*"
                ]
            }
        ]
    }'

# Create instance profile and add role
aws iam create-instance-profile --instance-profile-name pharbit-blockchain-profile
aws iam add-role-to-instance-profile \
    --instance-profile-name pharbit-blockchain-profile \
    --role-name pharbit-blockchain-role

# Attach profile to instance
aws ec2 associate-iam-instance-profile \
    --instance-id $INSTANCE_ID \
    --iam-instance-profile Name=pharbit-blockchain-profile

# 4. Configure security group
echo "Configuring security group..."
SG_ID=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' \
    --output text)

# Update security group rules
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# 5. Install required software on instance
echo "Installing required software on instance..."
# Create user data script
cat << 'EOF' > ~/userdata.sh
#!/bin/bash
apt-get update
apt-get install -y nginx nodejs npm
systemctl enable nginx
systemctl start nginx

# Install AWS CLI
apt-get install -y awscli

# Install PM2
npm install -g pm2

# Create app directory
mkdir -p /var/www/blockchain
EOF

# Send user data script to instance
aws ec2 create-image \
    --instance-id $INSTANCE_ID \
    --name "pharbit-blockchain-$(date +%Y%m%d)" \
    --description "Pharbit Blockchain Server with updated configuration"

echo "Configuration complete!"
echo "New key pair saved as: ~/$NEW_KEY_NAME.pem"
echo "Copy this file to your local machine using CloudShell's file download feature"
echo ""
echo "Next steps:"
echo "1. Download the $NEW_KEY_NAME.pem file"
echo "2. Use it to connect to your instance:"
echo "   ssh -i $NEW_KEY_NAME.pem ubuntu@$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicDnsName' \
    --output text)"