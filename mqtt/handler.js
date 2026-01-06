const { z } = require('zod');
const db = require("../db");
const {checkAndSendMQTTAct}=require("./handlerActuator")
const {socketSendMessage}=require("../module/socketHandler")

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

module.exports = async function handleMessage(topic, message) {
    let data = schema.safeParse(JSON.parse(message));
    if (!data.success) {
      return false // ZodError instance
    } else {
      data=data.data; // { username: string; xp: number }
    }
    console.log(data)
    // Creazione del sensore se non presente
    let sensorRecord= await db.device.count({where:{cod_device:data.cod_device,type:data.type,active:1}})
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
      let actuators=await db.associateActuator.findAll({where:{referenceSensorId:device.id,active:1}})
      //console.log(JSON.parse(JSON.stringify(actuators)))
      if (actuators.length>0){
        for (let i = 0; i < actuators.length; i++) {
          const act = actuators[i];
          await checkAndSendMQTTAct(JSON.parse(JSON.stringify(act)),data)
        }
      }

      /** check allarmi */
      let allarms=await db.associateAllarm.findAll({where:{referenceSensorId:device.id,active:1}})
      //console.log(JSON.parse(JSON.stringify(allarms)))
      
      if (allarms.length>0){
        for (let i = 0; i < allarms.length; i++) {
          const all = allarms[i];
          let allarmOn=0
          switch (all.operator) {
            case "==":
              allarmOn= data[all.referenceField] == all.threshold ?1:0
              break;
            case "=!":
              allarmOn= data[all.referenceField] != all.threshold ?1:0
              break;
            case "<=":
              allarmOn= data[all.referenceField]<=  all.threshold ?1:0
              break;
            case ">=":
              allarmOn=data[all.referenceField]  >= all.threshold ?1:0
              break;
            case ">":
              allarmOn= data[all.referenceField] > all.threshold ?1:0
              break;
            case "<":
            //console.log(all.threshold , data[all.referenceField])
              allarmOn=  data[all.referenceField] < all.threshold ?1:0
             // topic

              break;
          }
          //console.log(allarmOn)
          await db.associateAllarm.update({inUse:allarmOn},{where:{id:all.id}})
                                  .catch(err=>{console.log(err)})
          await socketSendMessage("data","update")
        }
      }
      }
};
