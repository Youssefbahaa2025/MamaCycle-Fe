# MamaCycle Frontend

This is the frontend for the MamaCycle application, built with Angular.

## Features

- User authentication and authorization
- E-commerce functionality for renting/selling baby products
- Community forum for parents
- Multi-language support (English & Arabic)
- Responsive design with Tailwind CSS
- Cloudinary integration for image handling

## Prerequisites

- Node.js (v18 or higher)
- Angular CLI

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run start
   ```
4. Open your browser and navigate to `http://localhost:4200`

## Environment Configuration

- `src/environments/environment.ts`: Development environment configuration
- `src/environments/environment.prod.ts`: Production environment configuration

## Deployment to Vercel

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Configure your project:
   ```
   vercel init
   ```

4. Deploy your application:
   ```
   vercel --prod
   ```

5. Set environment variables in the Vercel dashboard:
   - `NODE_ENV`: `production`

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Testing

Run `ng test` to execute the unit tests via Karma.

## License

This project is licensed under the MIT License 