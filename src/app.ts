import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import policyRoutes from './routes/policies';
import claimRoutes from './routes/claims';
import dashboardRoutes from './routes/dashboard';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

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

export default app;