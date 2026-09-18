import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import { connectToDatabase } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import policyRoutes from './routes/policies';
import claimRoutes from './routes/claims';
import dashboardRoutes from './routes/dashboard';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('Error: JWT_SECRET environment variable is required');
  process.exit(1);
}

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server');
    process.exit(1);
  }
};

void startServer();

export default app;
