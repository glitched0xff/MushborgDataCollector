const { z } = require('zod');
const db = require("../db");
const sender=require("./sender")
const {logOutMqtt}=require("../module/logMushborgDC")
const moment=require("moment")

const checkAndSendMQTTAct =async(act,data)=>{
    // console.log(act)
    // console.log(data)
    if (act.flagInterval==1) {
        //console.log((data[act.referenceField]+" "+act.valMin))
        if ((data[act.referenceField])&&(data[act.referenceField]<act.valMin)){
            if(act.inUse==0){
                console.log("accendo")
                let payload=act.switch
                sender(act.topicMqtt,{relay:act.switch})
                await db.associateActuator.update({inUse:1},{where:{id:act.id}}).catch(err=>{console.log(err)})
                await logOutMqtt(act,act.topicMqtt,payload)
            }else{
                console.log("già acceso")
            }
        }else if((data[act.referenceField])&&(data[act.referenceField]>act.valMax)){
            if(act.inUse==1){
                console.log("spengo")
                let payload
                switch (act.switch) {
                    case 1:
                        payload=0
                        break;
                    case true:
                        payload=false
                        break;
                }
                sender(act.topicMqtt,{relay:payload})
                await db.associateActuator.update({inUse:0},{where:{id:act.id}}).catch(err=>{console.log(err)})
                await logOutMqtt(act,act.topicMqtt,payload)
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
            let payload=act.switch
            sender(act.topicMqtt,{relay:act.switch})
            await db.associateActuator.update({inUse:1},{where:{id:act.id}}).catch(err=>{console.log(err)})
            await logOutMqtt(act,act.topicMqtt,payload)
        }else{
            let payload
                switch (act.switch) {
                    case 1:
                        payload=0
                        break;
                    case true:
                        payload=false
                        break;
                }
                sender(act.topicMqtt,{relay:payload})
                await db.associateActuator.update({inUse:0},{where:{id:act.id}}).catch(err=>{console.log(err)})
                await logOutMqtt(act,act.topicMqtt,payload)
        }
    }
}

module.exports={checkAndSendMQTTAct}