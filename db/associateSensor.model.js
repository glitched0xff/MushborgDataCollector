const DataTypes= require("sequelize")

module.exports = (sequelize, Sequelize) => {
    const AssociateSensor = sequelize.define("associateSensor", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      valueName:{ type:Sequelize.STRING },
      deviceId:{ type:Sequelize.INTEGER },
      fieldName:{ type:Sequelize.STRING },
      label:{ type:Sequelize.STRING },
      icon:{ type:Sequelize.STRING },
      postChr:{ type:Sequelize.STRING },
      sensorType:{ type:Sequelize.STRING },
      storageId:{ type:Sequelize.INTEGER },
      mushElementId:{ type:Sequelize.INTEGER },
      version:{ type:Sequelize.INTEGER },
      active:{ type:Sequelize.INTEGER },
});
    AssociateSensor.associate = (models) => {
      // AssociateSensor.belongsTo(models.storage, {foreignKey: "storageId"});
      // AssociateSensor.hasMany(models.sensorData, {foreignKey: "deviceId"});
    }
    return AssociateSensor;
  };        