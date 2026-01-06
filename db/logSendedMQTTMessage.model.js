const DataTypes= require("sequelize")

module.exports = (sequelize, Sequelize) => {
    const LogSendedMQTTMessage = sequelize.define("logSendedMQTTMessage", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        storageId:{ type:Sequelize.INTEGER },
        deviceId:{ type:Sequelize.INTEGER },
        actId:{ type:Sequelize.INTEGER },
        cod_device:{ type:Sequelize.STRING },
        topic:{ type:Sequelize.STRING },
        payload:{ type:Sequelize.STRING },
    });
    return LogSendedMQTTMessage;
  };        