const dbConfig = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: "mariadb",
  //operatorsAliases: false,
  //logging:console.log,
  logging: false,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.sensorData = require("./sensorData.model.js")(sequelize, Sequelize);
db.device = require("./device.model.js")(sequelize, Sequelize);
db.associateActuator = require("./associateActuator.model.js")(sequelize, Sequelize);
db.associateSensor = require("./associateSensor.model.js")(sequelize, Sequelize);
db.associateAllarm = require("./associateAllarm.model.js")(sequelize, Sequelize);
db.logSendedMQTTMessage = require("./logSendedMQTTMessage.model.js")(sequelize, Sequelize);

db.associateActuator.associate(db)
db.associateSensor.associate(db)
db.associateAllarm.associate(db)

module.exports = db;