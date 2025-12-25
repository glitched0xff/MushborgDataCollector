const { z } = require('zod');
const db = require("../db");

const schema = z.object({
    cod_device:z.string(),
    temp:z.number().optional(),
    hum:z.number().optional(),
    co2:z.number().optional(),
});

module.exports = async function handleMessage(topic, message) {
  try {
    console.log(message)
    console.log(topic)
    const data = schema.parse(JSON.parse(message));
    console.log(data)
  //  await db.sensorData.create(data);
    console.log(`✔️ Saved data from ${data.deviceId}`);
  } catch (err) {
    console.error('❗ Invalid MQTT payload:', err.message);
  }
};
