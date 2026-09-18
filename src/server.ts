import { connectToDatabase } from './config/db';
import app from './app';

const port = Number(process.env.PORT) || 4000;
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('Error: JWT_SECRET environment variable is required');
  process.exit(1);
}

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
