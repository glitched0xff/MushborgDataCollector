module.exports = (sequelize, Sequelize) => {
    const SensorData = sequelize.define("sensorData", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      cod_device: {
        type: Sequelize.STRING
      },
      temp: {
        type: Sequelize.FLOAT
      },
      hume: {
        type: Sequelize.FLOAT
      },
      hums: {
        type: Sequelize.FLOAT
      },
      co2: {
        type: Sequelize.FLOAT
      },
      levl: {
        type: Sequelize.FLOAT
      },
      ligh: {
        type: Sequelize.FLOAT
      },
      wind: {
        type: Sequelize.FLOAT
      },
      battery:{
        type: Sequelize.FLOAT
      },
      status:{
        type: Sequelize.INTEGER
      },
      deviceId:{
        type: Sequelize.INTEGER
      },
      storageId:{
        type: Sequelize.INTEGER
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    });
    SensorData.associate = (models) => {
      SensorData.belongsTo(models.device, {foreignKey: "deviceId"});
    }
    return SensorData;
  };