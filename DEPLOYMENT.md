# THFF Frontend Deployment Guide

## Overview
The THFF frontend has been migrated from AWS CodePipeline/Elastic Beanstalk to GitHub Actions for automated deployment to AWS S3 and CloudFront.

## Architecture
- **Hosting**: AWS S3 + CloudFront
- **CI/CD**: GitHub Actions
- **Build**: Angular CLI
- **Node Version**: 18

## Prerequisites
1. AWS CLI configured with appropriate permissions
2. S3 bucket created for static hosting
3. CloudFront distribution configured (optional)
4. GitHub repository secrets configured

## Required GitHub Secrets
- `AWS_ACCESS_KEY_ID`: AWS access key with S3 and CloudFront permissions
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID (optional)

## Deployment Process

### 1. S3 Bucket Setup
```bash
# Create S3 bucket for static hosting
aws s3 mb s3://thff-fuse2-static --region us-east-1

# Configure bucket for static website hosting
aws s3 website s3://thff-fuse2-static --index-document index.html --error-document index.html
```

### 2. CloudFront Setup (Optional)
1. Go to CloudFront console
2. Create new distribution
3. Set origin to your S3 bucket
4. Configure caching behaviors
5. Note the distribution ID for GitHub secrets

### 3. Environment Configuration
Update `src/environments/environment.prod.ts` with production API URL:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-app-runner-url.com'
};
```

### 4. Automatic Deployment
The GitHub Actions workflow will automatically:
1. Install dependencies
2. Build Angular application
3. Deploy to S3
4. Invalidate CloudFront cache (if configured)

## Manual Deployment
```bash
# Install dependencies
npm ci

# Build for production
npm run build

# Deploy to S3
aws s3 sync dist/fuse/ s3://thff-fuse2-static --delete

# Invalidate CloudFront (if using)
aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
```

## Build Configuration
The application uses Angular CLI with the following configurations:
- **Development**: `ng build --configuration development`
- **Production**: `ng build --configuration production`

## Environment Variables
Configure these in your deployment environment:
- `NODE_ENV`: `production`
- `BE_API`: Backend API URL (for `/backend` endpoint)

## Monitoring
- S3 access logs can be enabled for monitoring
- CloudWatch metrics available for CloudFront
- GitHub Actions provides build and deployment logs

## Rollback
To rollback to a previous version:
1. Go to S3 console
2. Navigate to your bucket
3. Use versioning to restore previous files
4. Invalidate CloudFront cache if needed

## Troubleshooting
- Check GitHub Actions workflow logs
- Verify S3 bucket permissions
- Ensure CloudFront distribution is properly configured
- Check Angular build logs for compilation errors
- Verify environment configuration files

## Performance Optimization
- Enable S3 transfer acceleration
- Configure CloudFront caching policies
- Use Angular's production build optimizations
- Implement proper cache headers
