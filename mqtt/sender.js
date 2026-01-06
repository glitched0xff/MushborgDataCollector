const mqtt = require('mqtt');

/** Sender MQTT */
module.exports = async function sendMessage(topic, message) {
    await new Promise((resolve, reject) => {
      const mqttClient = mqtt.connect(process.env.MQTT_BROKER, {
          username: process.env.MQTT_USERNAME,
          password: process.env.MQTT_PASSWORD,
          reconnectPeriod: 0
        });
        mqttClient.once('connect', () => {
           mqttClient.publish(topic,JSON.stringify(message),{ qos: 1 },err => {
          if (err) {
            mqttClient.end();
            reject(err);
          } else {
            mqttClient.end(false, resolve);
          }
        });
        mqttClient.once('error', err => {
          mqttClient.end();
          reject(err);
        });
      });
    });
};
