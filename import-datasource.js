const {readFile, utils} = require("xlsx");
const path = require('path');
const fs = require('fs');
const {Sales, ImportedFile} = require("./src/model");

function loadKamus() {
    return new Promise(resolve => {
        const materialGroupCategory = new Map();
        const storeCodeCity = new Map();
        const storeCodeName = new Map();
        const file = readFile('./kamus.xls');

        const categoriesRows = utils.sheet_to_json(file.Sheets[file.SheetNames[0]], {header: 1, defval: ''});
        categoriesRows.forEach(categoryRow => {
            materialGroupCategory.set(categoryRow[0], categoryRow[1].trim());
        });
        const storeNameCodeCities = utils.sheet_to_json(file.Sheets[file.SheetNames[1]], {header: 1, defval: ''});
        storeNameCodeCities.forEach(storeNameCodeCityRow => {
            storeCodeCity.set(storeNameCodeCityRow[1], storeNameCodeCityRow[2].trim());
            storeCodeName.set(storeNameCodeCityRow[1], storeNameCodeCityRow[0].trim());
        });
        resolve({materialGroupCategory, storeCodeName, storeCodeCity});
    });
}

function loadData({materialGroupCategory, storeCodeCity, storeCodeName, fileHasBeenImported}) {

    return new Promise(resolve => {
        const sales = [];
        fs.readdir('./data-source', (err, _files) => {
            const files = _files.filter(file => {
                const hasBeenImported = fileHasBeenImported.find(importedFile => {
                    return importedFile.dataValues.fileName === file
                });
                return hasBeenImported === undefined;
            });

            files.forEach(fileName => {
                const file = readFile(path.join('./data-source', fileName));
                const sheets = file.SheetNames
                for (let i = 0; i < sheets.length; i++) {

                    const materialGroupCodeColIndex = 0;
                    const materialGroupNameColIndex = 1;
                    const materialBrandNameColIndex = 2;
                    const materialCodeColIndex = 3;
                    const materialNameColIndex = 4;
                    const materialEanUpcColIndex = 5;
                    const startingColumnIndex = 7;

                    const storeCodeRowIndex = 1;
                    const storeNameRowIndex = 2;
                    const monthCodeRowIndex = 3;
                    const qtyOrValueRowIndex = 0;

                    const dataRows = utils.sheet_to_json(file.Sheets[file.SheetNames[i]], {header: 1, defval: ''});
                    const storeCodes = dataRows[storeCodeRowIndex];
                    const storeNames = dataRows[storeNameRowIndex];
                    const months = dataRows[monthCodeRowIndex];
                    const qtyOrValue = dataRows[qtyOrValueRowIndex];

                    dataRows.filter((row, rowIndex) => rowIndex > 6 && row[materialEanUpcColIndex].length > 1).forEach(row => {
                        for (let colIndex = startingColumnIndex; colIndex < row.length; colIndex++) {
                            const isQuantity = qtyOrValue[colIndex].toUpperCase().indexOf('QTY') >= 0;
                            if (!isQuantity) {
                                continue;
                            }
                            const storeCode = storeCodes[colIndex];
                            const storeName = storeCodeName.get(parseInt(storeCode));
                            if (storeName === undefined) {
                                const storeNameActual = storeNames[colIndex];
                                console.log(storeNameActual, storeCode);
                                throw new Error('Unregistered store :' + storeNameActual + ':' + storeCode);
                            }
                            const stNames = storeName.split(',')
                            const dt = months[colIndex].split('.');
                            const groupCode = row[materialGroupCodeColIndex];

                            const data = {
                                groupCode: trimToUpperCase(groupCode),
                                groupName: trimToUpperCase(row[materialGroupNameColIndex]),
                                brand: trimToUpperCase(row[materialBrandNameColIndex]),
                                code: trimToUpperCase(row[materialCodeColIndex]),
                                name: trimToUpperCase(row[materialNameColIndex]),
                                category: trimToUpperCase(materialGroupCategory.get(parseInt(groupCode))),
                                storeName: trimToUpperCase(storeName),
                                storeCode: trimToUpperCase(storeCode),
                                store: trimToUpperCase(stNames[0]),
                                location: trimToUpperCase(stNames[1]),
                                city: trimToUpperCase(storeCodeCity.get(parseInt(storeCode))),
                                date: new Date(`${dt[1]}-${dt[0]}-01`),
                                quantity: row[colIndex],
                                value: row[storeCodes.findIndex((value, index) => value === storeCodes[colIndex] && index > colIndex)]
                            }
                            sales.push(data);
                        }
                    })
                }
            });
            resolve({sales, importedFiles: files.map(file => ({fileName: file}))});
        });
    });
}


(async () => {
    console.log('Loading Kamus ... ');
    const {materialGroupCategory, storeCodeName, storeCodeCity} = await loadKamus();
    console.log('Kamus loaded... materialgroup-category:', materialGroupCategory.size, 'storename-city:', storeCodeName.size);
    console.log('Loading sales data');
    await ImportedFile.sync();
    const fileHasBeenImported = await ImportedFile.findAll();
    const {sales, importedFiles} = await loadData({
        materialGroupCategory,
        storeCodeName,
        storeCodeCity,
        fileHasBeenImported
    });
    console.log('Sales data load complete');
    await Sales.sync();
    console.log('Storing sales', sales.length, 'records');
    await Sales.bulkCreate(sales);

    console.log('Storing imported files', importedFiles.length, 'records');
    await ImportedFile.bulkCreate(importedFiles);
    console.log('Data ... stored', sales.length, 'records');
})();

function trimToUpperCase(val) {
    if (val === null || val === undefined) {
        return val;
    }
    return val.toString().toUpperCase().trim();
}