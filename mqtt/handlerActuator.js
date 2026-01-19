const { z } = require('zod');
const db = require("../db");
const sender=require("./sender")
const {logOutMqtt}=require("../module/logMushborgDC")
const moment=require("moment")

const checkAndSendMQTTAct =async(act,data)=>{
    //  console.log(act.label)
    //  console.log(data)
    if (act.flagInterval==1) {
        //console.log((data[act.referenceField]+" "+act.valMin))
        if ((data[act.referenceField])&&(data[act.referenceField]<act.valMin)){
            if(act.inUse==0){
                    console.log(act.payloadType)

                console.log("accendo")
                if (act.payloadType=="JSON"){
                    sender(act.topicMqtt,JSON.parse(act.payloadMqttON))
                } else if (act.payloadType=="PLAINTEXT"){
                    sender(act.topicMqtt,act.payloadMqttON)
                }
                await db.associateActuator.update({inUse:1},{where:{id:act.id}}).catch(err=>{console.log(err)})
                await logOutMqtt(act,act.topicMqtt,act.payloadMqttON?act.payloadMqttON:"")
            }else{
                console.log("già acceso")
            }
        }else if((data[act.referenceField])&&(data[act.referenceField]>act.valMax)){
            if(act.inUse==1){
                console.log("accendo")
                if (act.payloadType=="JSON"){
                    sender(act.topicMqtt,JSON.parse(act.payloadMqttOFF))
                } else if (act.payloadType=="PLAINTEXT"){
                    sender(act.topicMqtt,act.payloadMqttOFF)
                }
                await db.associateActuator.update({inUse:0},{where:{id:act.id}}).catch(err=>{console.log(err)})
                await logOutMqtt(act,act.topicMqtt,act.payloadMqttOFF?act.payloadMqttOFF:"")
            } else{
                console.log("già spento")
            }
        }
    }
    if(act.flagClock==1){
      //  console.log(act.timeOn,act.timeOff)
        const now = moment();
        const timeOn = moment(act.timeOn, "HH:mm").set({
                year: now.year(),
                month: now.month(),
                date: now.date()
                });

                const timeOff = moment(act.timeOff, "HH:mm").set({
                year: now.year(),
                month: now.month(),
                date: now.date()
                });

        if (now.isBetween(timeOn, timeOff)){
             if(act.inUse==0){
                if (act.payloadType=="JSON"){
                    sender(act.topicMqtt,JSON.parse(act.payloadMqttON))
                } else if (act.payloadType=="PLAINTEXT"){
                    sender(act.topicMqtt,act.payloadMqttON?act.payloadMqttON:"")
                }
                await db.associateActuator.update({inUse:1},{where:{id:act.id}}).catch(err=>{console.log(err)})
                await logOutMqtt(act,act.topicMqtt,act.payloadMqttON)
                }
            }else{
                if(act.inUse==1){
                    if (act.payloadType=="JSON"){
                        sender(act.topicMqtt,JSON.parse(act.payloadMqttOFF))
                    } else if (act.payloadType=="PLAINTEXT"){
                        sender(act.topicMqtt,act.payloadMqttOFF)
                    }
                    await db.associateActuator.update({inUse:0},{where:{id:act.id}}).catch(err=>{console.log(err)})
                    await logOutMqtt(act,act.topicMqtt,act.payloadMqttOFF?act.payloadMqttOFF:"")
                }
        }
    }
}

module.exports={checkAndSendMQTTAct}