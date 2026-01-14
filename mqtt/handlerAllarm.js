const { z } = require('zod');
const db = require("../db");
const sender=require("./sender")
const {logOutMqtt}=require("../module/logMushborgDC")
const moment=require("moment")

const checkAndSendAllarm =async(all,data)=>{
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

}


module.exports={checkAndSendAllarm}