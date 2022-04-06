// Require the framework and instantiate it
const {Sales,sequelize,SalesSchema} = require("./src/model");
const fastify = require('fastify')({ logger: true });

fastify.register(require('fastify-cors'), {
    origin : true
})
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

fastify.get('/v1/dimension',async () => {
    return Object.keys(SalesSchema).filter(key => key !== 'id').map(key => {
        return {id:key,name:SalesSchema[key].comment,isQuantifiable:SalesSchema[key].isQuantifiable}
    })
});

fastify.get('/v1/distinct/:columnName',async (req) => {
    const columnName = req.params.columnName;
    const query = `select DISTINCT(${columnName.split('_').join('||"#"||')}) as ${columnName} from sales order by ${columnName} asc`;
    const [data] = await sequelize.query(query);
    return data;
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