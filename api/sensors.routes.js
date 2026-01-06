const express = require('express');
const mqttClient = require('../mqtt/client');
const db = require("../db");
const ALLOWED_PREFIX = 'sensors/';
const router = express.Router();

/**
 * Latest message
 */
router.get('/latest', async (req, res) => {
  const limit = Number(req.query.limit || 50);

  const data = await db.sensorData.findAll({
    order: [['createdAt', 'DESC']],
    limit:50  
  }).catch(err=>{console.log(err)});

  res.json(data);
});

/**
 * Message per device
 */
router.get('/device/:deviceId', async (req, res) => {
  const data = await db.sensorData.findAll({
    where: { deviceId: req.params.deviceId },
    order: [['created_at', 'DESC']]
  });

  res.json(data);
});

/** Send message */
router.get('/sendMessage', (req, res) => {
  const { topic, message } = req.query;

  if (!topic || !message) {
    return res.status(400).json({
      error: 'Missing topic or message'
    });
  }

  if (!topic.startsWith(ALLOWED_PREFIX)) {
    return res.status(403).json({ error: 'Topic not allowed' });
  }
  mqttClient.publish(topic, message, { qos: 1 }, err => {
    if (err) {
      console.error('MQTT publish error:', err.message);
      return res.status(500).json({ error: 'MQTT publish failed' });
    }

    console.log(`MQTT sent → ${topic}: ${message}`);

    res.json({
      status: 'ok',
      topic,
      message
    });
  });
});

module.exports = router;
