const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize } = require('./models');
const busRoutes = require('./routes/busRoutes');
const stopRoutes = require('./routes/stopRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/routes', busRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Bus Tracker API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function startServer() {
  try {
    console.log('Conneting to database...');
    await sequelize.authenticate();
    console.log('Database connection established');

    console.log('Synchronizing database models...');
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('Database models synchronized');

    app.listen(PORT, HOST, () => {
      console.log('\nBus Tracker API');
      console.log(`Running on: http://${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
      console.log('Server is ready');;
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

// shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down..');
  await sequelize.close();
  process.exit(0);
});

startServer();
