const mqtt = require('mqtt');
const handleMessage = require('./handler');

const client = mqtt.connect(process.env.MQTT_BROKER, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
});

client.on('connect', () => {
  console.log('✔️ MQTT connected');
  client.subscribe(process.env.MQTT_TOPIC);
});

client.on('message', (topic, payload) => {
  handleMessage(topic, payload.toString());
});

client.on('error', err => {
  console.error('❗ MQTT error:', err.message);
});

module.exports = client;
