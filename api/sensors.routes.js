const express = require('express');
const mqttClient = require('../mqtt/client');
const db = require("../db");
const ALLOWED_PREFIX = 'sensors/';
const router = express.Router();
const ecowittConfig=require("../ecowitt.config.json")
const sender=require("../mqtt/sender") //MQTT
const lastSentMap = new Map();
const DEBOUNCE_TIME = 120 * 1000; // 240 secondi
/** Function for debounch/throttle server side */
function canSend(deviceId) {
  const now = Date.now();
  const last = lastSentMap.get(deviceId) || 0;

  if (now - last >= DEBOUNCE_TIME) {
    lastSentMap.set(deviceId, now);
    return true;
  }
  return false;
}

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


router.post('/rxEcowitt',async (req,res)=>{
  let ecowittData = req.body;
  for (const dev of ecowittConfig.devices) {
    if (ecowittData.PASSKEY !== dev.passkey) continue;
    if (!canSend(dev.cod_device)) {
      console.log(`SKIP ${dev.cod_device} (debounce)`);
      continue;
    }
    if (dev.temp[1] === "F" && ecowittData[dev.temp[0]]) {
      ecowittData[dev.temp[0]] =
        ((ecowittData[dev.temp[0]] - 32) * 5) / 9;
    }
    let payload = {
      cod_device: dev.cod_device,
      type: dev.type,
      temp: ecowittData[dev.temp[0]] ? parseFloat(ecowittData[dev.temp[0]]) : null,
      hume: ecowittData[dev.hume[0]] ? parseFloat(ecowittData[dev.hume[0]]) : null,
      hums: ecowittData[dev.hums] ? parseFloat(ecowittData[dev.hums]) : null,
      wind: ecowittData[dev.wind] ? parseFloat(ecowittData[dev.wind]) : null,
      levl: ecowittData[dev.levl] ? parseFloat(ecowittData[dev.levl]) : null,
      ligh: ecowittData[dev.ligh] ? parseFloat(ecowittData[dev.ligh]) : null,
      co2: ecowittData[dev.co2] ? parseFloat(ecowittData[dev.co2]) : null
    };
    // pulizia payload
    Object.keys(payload).forEach(k => payload[k] == null && delete payload[k]);
    console.log("Ecowitt", dev.cod_device, payload);
    await sender(dev.topic, payload);
  }
  res.status(200).json({ ok: true });
})

module.exports = router;
