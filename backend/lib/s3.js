const AWS = require('aws-sdk');
const crypto = require('crypto');

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function uploadBufferToS3(buffer, originalName, contentType) {
  const key = `uploads/${Date.now()}_${crypto.randomBytes(6).toString('hex')}_${originalName}`;
  await s3.putObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType || 'application/octet-stream',
    ACL: 'private'
  }).promise();
  return {
    s3Key: key,
    s3Uri: `s3://${process.env.AWS_S3_BUCKET}/${key}`
  };
}

function getPresignedUrl(key, expiresSeconds = 900) {
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Expires: expiresSeconds
  });
}

module.exports = { uploadBufferToS3, getPresignedUrl };
