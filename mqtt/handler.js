const { z } = require('zod');
const db = require("../db");
const {checkAndSendMQTTAct}=require("./handlerActuator")
const {checkAndSendAllarm}=require("./handlerAllarm")
const {socketSendMessage}=require("../module/socketHandler")
let lastUpdate= Date.now();
let debounchTime=5000

const schema = z.object({
    cod_device:z.string(),
    type:z.string(),
    temp:z.number().optional(),
    hume:z.number().optional(),
    hums:z.number().optional(),
    wind:z.number().optional(),
    levl:z.number().optional(),
    ligh:z.number().optional(),
    co2:z.number().optional(),
});

const isValidJSON = (text) => {
  let isValid = false;

  if (typeof text !== 'string' || (typeof text === 'string' && text.length === 0)) {
    return isValid;
  }

  try {
    JSON.parse(text);
    isValid = true;
  } catch (e) {
    console.error('[isValidJSON], invalid JSON text', text);
  }

  return isValid;
}

module.exports = async function handleMessage(topic, message) {
  if (isValidJSON(message)){
    let data = schema.safeParse(JSON.parse(message));
    if (!data.success) {
      return false // ZodError instance
    } else {
      data=data.data; 
    }
  //  console.log(data)
    // Creazione del sensore se non presente
    let sensorRecord= await db.device.count({where:{cod_device:data.cod_device,type:data.type,active:1}})
   // console.log(sensorRecord)

    if(sensorRecord==0){
      let presentFied={
        temp:0,
        hume:0,
        hums:0,
        co2:0,
        levl:0,
        ligh:0,
        wind:0,
      }
      const field = Object.keys(data);
      if (field.includes("temp")){presentFied.temp=1}
      if (field.includes("hume")){presentFied.hume=1}
      if (field.includes("hums")){presentFied.hums=1}
      if (field.includes("co2")){presentFied.co2=1}
      if (field.includes("levl")){presentFied.levl=1}
      if (field.includes("ligh")){presentFied.ligh=1}
      if (field.includes("wind")){presentFied.wind=1}
      await db.device.create({
        cod_device:data.cod_device,
        type:data.type,
        temp:presentFied.temp,
        hume:presentFied.hume,
        hums:presentFied.hums,
        co2:presentFied.co2,
        levl:presentFied.levl,
        ligh:presentFied.ligh,
        wind:presentFied.wind,
      })
      .catch(err=>{
        console.log(err)
      })
    }

    let device= await db.device.findOne({where:{cod_device:data.cod_device},attribute:["id","sorageId"]})
    // Inserimento messaggio
    // Ricevo un messaggio da un sensore S, lo inserisco nel db e controllo attuatori e allarmi
    if (device.type=="S"){
      await db.sensorData.create({
        cod_device:data.cod_device,
        deviceId:device.id,
        temp:data.temp?data.temp:0,
        hume:data.hume?data.hume:0,
        hums:data.hums?data.hums:0,
        co2:data.co2?data.co2:0,
        levl:data.levl?data.levl:0,
        ligh:data.ligh?data.ligh:0,
        wind:data.wind?data.wind:0,
        battery:data.battery?data.battery:0,
      }).catch(err=>{
        console.log(err)
      })

      /** check attuatori */
      let actuators=await db.associateActuator.findAll({where:{referenceSensorId:device.id,active:1,flagInterval:1}})
      
      console.log(JSON.parse(JSON.stringify(actuators)))
      if (actuators.length>0){
        for (let i = 0; i < actuators.length; i++) {
          const act = actuators[i];
          await checkAndSendMQTTAct(JSON.parse(JSON.stringify(act)),data)
        }
      }

      /** check allarmi */
      let allarms=await db.associateAllarm.findAll({where:{referenceSensorId:device.id,active:11}})
      //console.log(JSON.parse(JSON.stringify(allarms)))
      
      if (allarms.length>0){
        for (let i = 0; i < allarms.length; i++) {
          const all = allarms[i];
          await checkAndSendAllarm(JSON.parse(JSON.stringify(all)),data)
        }
      }
      }

  }
  
  // console.log("----")
  // console.log(lastUpdate)
  // console.log((Date.now() - lastUpdate >= debounchTime))
  // console.log(Date.now() - lastUpdate)
  // console.log(debounchTime)
  // console.log("----")
  if (Date.now() - lastUpdate >= debounchTime) {
      console.log("socket")
      await socketSendMessage("data",true)
      lastUpdate = Date.now();
  }

};
