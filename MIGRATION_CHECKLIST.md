# Migration Checklist: CodePipeline/Elastic Beanstalk → GitHub Actions + S3

## Pre-Migration Setup
- [ ] Create S3 bucket for static hosting
- [ ] Configure S3 bucket for static website hosting
- [ ] Set up CloudFront distribution (optional but recommended)
- [ ] Configure GitHub repository secrets:
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `CLOUDFRONT_DISTRIBUTION_ID` (if using CloudFront)
- [ ] Test Angular build locally: `npm run build`
- [ ] Verify build output in `dist/fuse/` directory

## Migration Steps
- [x] Create GitHub Actions workflow for deployment
- [x] Create Dockerfile (optional, for App Runner deployment)
- [x] Create .dockerignore file
- [x] Remove old buildspec configuration
- [x] Create deployment documentation

## Post-Migration Verification
- [ ] Deploy to S3 using GitHub Actions
- [ ] Verify application is accessible via S3/CloudFront URL
- [ ] Test all frontend functionality
- [ ] Verify API calls to backend work correctly
- [ ] Test routing and navigation
- [ ] Check browser console for errors
- [ ] Verify static assets load correctly
- [ ] Test responsive design on different devices

## Environment Configuration
- [ ] Update `src/environments/environment.prod.ts` with production backend URL
- [ ] Verify `/backend` endpoint returns correct API URL
- [ ] Test version endpoint `/version`

## Cleanup
- [ ] Delete old Elastic Beanstalk environment
- [ ] Delete old CodePipeline
- [ ] Remove old IAM roles and policies
- [ ] Update DNS records if needed
- [ ] Remove old build artifacts

## Rollback Plan
If issues occur:
1. Keep old Elastic Beanstalk environment running during transition
2. Update DNS to point back to old environment
3. Investigate and fix issues
4. Re-deploy to S3 once issues are resolved

## Performance Optimization
- [ ] Enable S3 transfer acceleration
- [ ] Configure CloudFront caching policies
- [ ] Set up proper cache headers
- [ ] Optimize Angular build for production
- [ ] Implement proper error handling
