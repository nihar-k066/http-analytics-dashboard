# HTTP Analytics Dashboard

A real-time HTTP status code monitoring and analytics dashboard built with React and WebSocket technology.

## Features

- Real-time monitoring of HTTP status codes
- Interactive data visualization with pie charts
- Historical data analysis with date range filtering
- Live alerts for error status codes
- Secure authentication system
- Responsive design for all devices

## Tech Stack

- Frontend:
  - React
  - TanStack Query
  - Recharts for data visualization
  - Tailwind CSS & shadcn/ui for styling
  - WebSocket for real-time updates

- Backend:
  - Express.js
  - WebSocket Server
  - In-memory storage (can be extended to use PostgreSQL)
  - Passport.js for authentication

## Getting Started

1. Clone the repository
```bash
git clone [your-repo-url]
cd http-analytics-dashboard
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

- `/client` - Frontend React application
  - `/src/components` - Reusable UI components
  - `/src/hooks` - Custom React hooks
  - `/src/pages` - Page components
  - `/src/lib` - Utility functions and configurations

- `/server` - Backend Express application
  - `routes.ts` - API routes
  - `auth.ts` - Authentication setup
  - `storage.ts` - Data storage interface

- `/shared` - Shared types and schemas

## License

MIT
