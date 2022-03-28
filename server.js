// Require the framework and instantiate it
const {Sales,sequelize} = require("./src/model");
const fastify = require('fastify')({ logger: true });

const pageSize = 50;

// Declare a route
fastify.get('/', async (request, reply) => {
    return { hello: 'world' }
})

async function loadPaginatedQuery(query, page) {
    page = parseInt(page);
    const countQuery = `select count(*) total from (${query})`;
    const [[{total:totalRow}]] = await sequelize.query(countQuery);
    const paginatedQuery = `${query} limit ${(page - 1) * pageSize},${pageSize}`;
    const [data] = await sequelize.query(paginatedQuery);
    const totalPage = Math.ceil(totalRow / pageSize);
    return {page, pageSize, totalPage, data};
}

fastify.get('/v1/sales/stores/:page',async (req) => {
    const query = "SELECT DISTINCT(storeName),storeCode,city from sales where city not NULL order by storeCode ASC";
    const {page} = req.params;
    return await loadPaginatedQuery(query, page);
});

fastify.get('/v1/sales/products/:page',async (req) => {
    const query = "SELECT DISTINCT(storeName),storeCode,city from sales where city not NULL order by storeCode ASC";
    const {page} = req.params;
    return await loadPaginatedQuery(query, page);
});

fastify.get('/v1/sales/brands/:page',async (req) => {
    const query = "select DISTINCT(brand) from sales";
    const {page} = req.params;
    return await loadPaginatedQuery(query,page);
});

fastify.get('/v1/sales/material/:page',async () => {
    const query = "select DISTINCT(code),name,category,brand from sales";
    const {page} = req.params;
    return await loadPaginatedQuery(query,page);
});

fastify.get('/v1/dimension',async () => {

    return [
        {id:'storeCode',name:'Store Code'},
        {id:'storeName',name:'Store Name'},
        {id:'store',name:'Store Type'},
        {id:'location',name:'Store Location'},
        {id:'city',name:'Store City'},
        {id:'groupCode',name:'Material Group Code'},
        {id:'name',name:'Material Name'},
        {id:'category',name:'Material Category'},
        {id:'date',name:'Date'},
        {id:'quantity',name:'Sales Quantity'},
        {id:'value',name:'Sales Value'},
    ];
});

// Run the server!
const start = async () => {
    try {
        await Sales.sync();
        await fastify.listen(3001);
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()