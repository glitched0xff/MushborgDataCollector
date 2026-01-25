const mqtt = require('mqtt');
const handleMessage = require('./handler');
const handlerZig2Mqtt=require('./handlerZig2Mqtt')

const client = mqtt.connect(process.env.MQTT_BROKER, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
});

client.on('connect', () => {
  console.log('✔️ MQTT connected'); 
  client.subscribe("#");
});

client.on('message', (topic, payload) => {

  if ((topic.split("/")[0]=="mushborg")&&(topic.split("/")[1]=="zig2mqtt")){
    handlerZig2Mqtt(topic, payload.toString())
    

  }else{
    handleMessage(topic, payload.toString());
  }
});

client.on('error', err => {
  console.error('❗ MQTT error:', err.message);
});

module.exports = client;
