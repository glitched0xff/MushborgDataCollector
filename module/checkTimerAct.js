const db = require("../db");
const {checkAndSendMQTTAct}=require("../mqtt/handlerActuator")

async function checkValueInDb() {
    console.log("timer")
  try {
    const timerAct = await db.associateActuator.findAll({where:{flagClock:1,active:1}});
    if (timerAct.length>0){
        timerAct.forEach(act => {
            console.log('Attuatore trovato invio MQTT');
            checkAndSendMQTTAct(JSON.parse(JSON.stringify(act)),true)
        });
    }
    if (!timerAct) {
      console.log('Nessun attuatore trovato');
      return;
    }
    
  } catch (err) {
    console.error('Errore nel controllo DB:', err);
  }
}

function timerChecker() {
    
  // esegue subito
  checkValueInDb();

  // poi ogni minuto
  setInterval(checkValueInDb, 60 * 1000);
}

module.exports = {timerChecker};
