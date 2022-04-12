const {Sequelize, Model, DataTypes} = require('sequelize');
const path = require('path');
const sequelize = new Sequelize(`sqlite:${path.join('./output', 'sales.db')}`,{
    pool: {
        max: 100,
        min: 100,
        acquire: 30000,
        idle: 10000
    }
});

class Sales extends Model {
}

class ImportedFile extends Model {
}

ImportedFile.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    fileName: DataTypes.STRING
}, {sequelize, modelName: 'imported_file'});


const SalesSchema = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Id',
        isQuantifiable : false
    },
    storeCode: {
        type: DataTypes.STRING,
        comment: 'Store Code',
        isQuantifiable : false
    },
    storeName: {
        type: DataTypes.STRING,
        comment: 'Store Name',
        isQuantifiable : false
    },
    store: {
        type: DataTypes.STRING,
        comment: 'Store Type',
        isQuantifiable : false
    },
    location: {
        type: DataTypes.STRING,
        comment: 'Store Location',
        isQuantifiable : false
    },
    city: {
        type: DataTypes.STRING,
        comment: 'Store City',
        isQuantifiable : false
    },
    groupCode: {
        type: DataTypes.STRING,
        comment: 'Material Group Code',
        isQuantifiable : false
    },
    groupName: {
        type: DataTypes.STRING,
        comment: 'Material Group Name',
        isQuantifiable : false
    },
    brand: {
        type: DataTypes.STRING,
        comment: 'Material Brand',
        isQuantifiable : false
    },
    code: {
        type: DataTypes.STRING,
        comment: 'Material Code',
        isQuantifiable : false
    },
    name: {
        type: DataTypes.STRING,
        comment: 'Material Name',
        isQuantifiable : false
    },
    category: {
        type: DataTypes.STRING,
        comment: 'Material Category',
        isQuantifiable : false
    },
    date: {
        type: DataTypes.DATEONLY,
        comment: 'Date',
        isQuantifiable : false
    },
    quantity: {
        type: DataTypes.NUMBER,
        comment: 'Quantity',
        isQuantifiable : true
    },
    value: {
        type: DataTypes.NUMBER,
        comment: 'Value',
        isQuantifiable : true
    }
};
Sales.init(SalesSchema, {sequelize, modelName: 'sales'});

module.exports = {Sales, ImportedFile, sequelize, SalesSchema};
