import dotenv from 'dotenv';
dotenv.config();

import app from './services/app.js';

const PORT = process.env.PORT || 5010;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  VR4Web Admin Backend Server Running on Port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  API Base: http://localhost:${PORT}/api`);
  console.log(`  Auth Login: http://localhost:${PORT}/api/auth/login`);
  console.log(`=======================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Keep server running in development
});

