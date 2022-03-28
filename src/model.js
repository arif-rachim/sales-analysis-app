const { Sequelize, Model, DataTypes } = require('sequelize');
const path = require('path');
const sequelize = new Sequelize(`sqlite:${path.join('./output','sales.db')}`);

class Sales extends Model {}
class ImportedFile extends Model{}

ImportedFile.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    fileName:DataTypes.STRING
},{ sequelize, modelName: 'imported_file' });

Sales.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    storeCode : DataTypes.STRING,
    storeName:DataTypes.STRING,
    store:DataTypes.STRING,
    location:DataTypes.STRING,
    city : DataTypes.STRING,
    groupCode: DataTypes.STRING,
    groupName:DataTypes.STRING,
    brand:DataTypes.STRING,
    code:DataTypes.STRING,
    name:DataTypes.STRING,
    category:DataTypes.STRING,
    date : DataTypes.DATEONLY,
    quantity : DataTypes.NUMBER,
    value : DataTypes.NUMBER
}, { sequelize, modelName: 'sales' });

module.exports = {Sales,ImportedFile,sequelize};
