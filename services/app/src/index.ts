import express from 'express';
import { startTokenUpdater } from './jobs/tokenUpdater';
import webhookRoutes from './routes/webhook';
import tokenRoutes from './routes/tokens';

const app = express();
const port = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Use routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/tokens', tokenRoutes);

// Start the token updater job
startTokenUpdater();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
