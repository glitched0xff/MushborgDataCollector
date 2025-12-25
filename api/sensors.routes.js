const express = require('express');
const db = require("../db");

const router = express.Router();

router.get('/latest', async (req, res) => {
  const limit = Number(req.query.limit || 50);

  const data = await db.sensorData.findAll({
    order: [['created_at', 'DESC']],
    limit
  });

  res.json(data);
});

router.get('/device/:deviceId', async (req, res) => {
  const data = await db.sensorData.findAll({
    where: { deviceId: req.params.deviceId },
    order: [['created_at', 'DESC']]
  });

  res.json(data);
});

module.exports = router;
