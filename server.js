const app = require('./app');
const db = require('./db');


const PORT = process.env.PORT || 3000;

(async () => {
  await db.sequelize.sync();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
