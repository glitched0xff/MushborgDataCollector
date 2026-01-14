require('dotenv').config();
const express = require('express');
require('./mqtt/client');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const sensorRoutes = require('./api/sensors.routes');

app.use('/api/', sensorRoutes);

app.get('/',async (req,res)=>{
  res.status(200).json({message:"Broker Mushborg Data Collector"})
})

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
  
});

module.exports = app;
