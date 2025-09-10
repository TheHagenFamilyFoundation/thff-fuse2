# THFF Frontend

Hagen Family Foundation frontend application built with Angular and Fuse admin template.

## Architecture
- **Framework**: Angular 13
- **Template**: Fuse Admin Template
- **Hosting**: AWS S3 + CloudFront
- **CI/CD**: GitHub Actions
- **Styling**: Tailwind CSS + SCSS

## Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Build
```bash
# Build for production
npm run build
# or
ng build --configuration production
```

The build artifacts will be stored in the `dist/fuse/` directory.

## Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Migration
See [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md) for migration from CodePipeline/Elastic Beanstalk.

## Development

### Code Scaffolding
Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Testing
```bash
# Run unit tests
npm test
# or
ng test

# Run linting
npm run lint
# or
ng lint
```

## Environment Configuration
- Development: `src/environments/environment.ts`
- Production: `src/environments/environment.prod.ts`

## API Integration
The frontend communicates with the backend API. The backend URL is configured in the environment files and can be retrieved via the `/backend` endpoint.

## Further Help
- [Angular CLI Documentation](https://angular.io/cli)
- [Fuse Documentation](https://fuse-angular-material.withinpixels.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
