const { z } = require('zod');
const db = require("../db");
const sender=require("./sender")
const {logOutMqtt}=require("../module/logMushborgDC")

const checkAndSendMQTTAct =async(act,data)=>{
    //console.log(act)
    if (act.flagInterval==1) {
        if ((data[act.referenceField])&&(data[act.referenceField]<act.valMin)){
            if(act.inUse==0){
                console.log("accendo")
                let payload=act.switch
                sender(act.topicMqtt,{val:act.switch})
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
                sender(act.topicMqtt,{val:payload})
                await db.associateActuator.update({inUse:0},{where:{id:act.id}}).catch(err=>{console.log(err)})
                await logOutMqtt(act,act.topicMqtt,payload)
            } else{
                console.log("già spento")
            }
        }
    }
}

module.exports={checkAndSendMQTTAct}