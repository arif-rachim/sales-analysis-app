// Require the framework and instantiate it
const {Sales,sequelize,SalesSchema} = require("./src/model");
const fastify = require('fastify')({ logger: true });

fastify.register(require('fastify-cors'), {
    origin :true
})
const pageSize = 50;

// Declare a route
fastify.get('/', async (request, reply) => {
    return { hello: 'world' }
})

fastify.post('/v1/compoundRequest',async (req,res) => {
    const compoundQuery = req.body.map(({id,method,body},index) => {
            const {filters,values,onlyContains} = body;
            const whereString = filters.map((key,index) => {
                return `"${key}" = '${values[index]}'`
            }).join(' and ');
            const onlyContainsString = Object.keys(onlyContains).map(key => {
                const val = onlyContains[key].map(key => `'${key}'`);
                return `"${key}" in (${val.join(',')})`
            }).join(' and ');
            const query = `(select sum(${method}) as "${id}" from sales where ${whereString} ${onlyContainsString.length > 0 ? `and ${onlyContainsString}`:''}) as "${index}"`;
            return query;
    });
    const sqlQuery = `select * from ${compoundQuery.join(' , ')}`;
    const [[data]] = await sequelize.query(sqlQuery);
    return Object.keys(data).map((key) => {
      return {value:data[key],id:key}
    })
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
    const query = "SELECT DISTINCT(sales.storeName),storeCode,city from sales where city not NULL order by storeCode ASC";
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
    const query = `select DISTINCT(${columnName.split('_').map(key => `"${key}"`).join("||'#'||")}) as column from sales order by "column" asc`;
    const [data] = await sequelize.query(query,{logging:false});
    return data.map(d => ({[columnName]:d.column}));
});

fastify.get('/v1/quantity',async (req) => {
    const query = req.query;
    const whereString = Object.keys(query).map(key => {
        return `"${key}" = '${query[key]}'`
    }).join(' and ');
    const sqlQuery = `select sum(value) as value from sales where ${whereString} `;
    const [data] = await sequelize.query(sqlQuery);
    return data;
});

// Run the server!
const start = async () => {
    try {
        await Sales.sync();
        fastify.listen(3001,'0.0.0.0')
            .then((address) => console.log(`server listening on ${address}`))
            .catch(err => {
                console.log('Error starting server:', err)
                process.exit(1)
            })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()