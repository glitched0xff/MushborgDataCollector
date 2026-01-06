
const db = require("../db");

const logOutMqtt=async(act, topic, payload)=>{
    console.log(act)
    await db.logSendedMQTTMessage.create({storageId:act.storageId,
                                          deviceId:act.sensorId,
                                          actId:act.id,
                                          topic:topic,
                                          payload:payload})
}

const logCleanAll=async()=>{
    await db.logSendedMQTTMessage.destroy({where: {}})
}

const logCleanByDevice=async(idDevice)=>{
    await db.logSendedMQTTMessage.destroy({where:{id:idDevice}})
}

module.exports={logOutMqtt,logCleanAll,logCleanByDevice}