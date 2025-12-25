require('dotenv').config();
const express = require('express');
require('./mqtt/client');

const sensorRoutes = require('./api/sensors.routes');

const app = express();
app.use(express.json());

app.use('/api/sensors', sensorRoutes);

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
