const app = require('./app');
const db = require('./db');
const {timerChecker}=require("./module/checkTimerAct")

const PORT = process.env.PORT || 3000;


(async () => {
  await db.sequelize.sync();
  
  app.listen(PORT, () => {
    timerChecker();
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
