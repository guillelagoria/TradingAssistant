import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { authenticate } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth.routes';
import tradeRoutes from './routes/trade.routes';
import strategyRoutes from './routes/strategy.routes';
import userRoutes from './routes/user.routes';
import statsRoutes from './routes/stats.routes';
import analysisRoutes from './routes/analysis.routes';
import marketRoutes from './routes/market.routes';
import accountRoutes from './routes/account.routes';
import uploadRoutes from './routes/upload.routes';
import economicEventsRoutes from './routes/economicEvents.routes';
import dataCapabilitiesRoutes from './routes/dataCapabilities.routes';
import tradeOptimizationRoutes from './routes/tradeOptimization.routes';
import nt8ImportV2Routes from './routes/nt8ImportV2.routes';
import importRoutes from './routes/import.routes';

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 3001;

// Initialize capabilities cache cleanup
import { dataCapabilitiesService } from './services/dataCapabilities.service';
dataCapabilitiesService.startCacheCleanup();

// Middleware - CORS configuration (simplified for development)
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests from localhost with any port during development
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:5178',
      'http://localhost:5179',
      'http://localhost:3000',
      'http://localhost:3001'
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in our allowed list or is localhost
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
}));
// Increase payload limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware to log ALL incoming requests
app.use((req, res, next) => {
  console.log(`\n=== INCOMING REQUEST ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Headers:`, req.headers);
  console.log(`Body:`, req.body);
  console.log(`========================\n`);
  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
// Protected routes - require authentication
app.use('/api/accounts', authenticate, accountRoutes);
// TODO: Re-enable authentication when auth system is fully implemented
app.use('/api/trades', tradeRoutes); // Temporarily bypassing auth for development
app.use('/api/strategies', authenticate, strategyRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/stats', authenticate, statsRoutes);
app.use('/api/analysis', authenticate, analysisRoutes);
app.use('/api/markets', authenticate, marketRoutes);
app.use('/api/uploads', uploadRoutes);
// Economic Events routes (public - no auth required for market data)
app.use('/api/economic-events', economicEventsRoutes);

// Data Capabilities routes (require authentication)
app.use('/api/data-capabilities', authenticate, dataCapabilitiesRoutes);

// Trade Optimization routes (require authentication)
app.use('/api/optimization', authenticate, tradeOptimizationRoutes);

// NinjaTrader 8 Import V2 routes (require authentication)
app.use('/api/nt8-import-v2', nt8ImportV2Routes);

// Import session management routes (require authentication)
app.use('/api/import', importRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();