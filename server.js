// Require the framework and instantiate it
const {Sales, sequelize, SalesSchema} = require("./src/model");
const fastify = require('fastify')({logger: true});

fastify.register(require('fastify-cors'), {
    origin: true
})

// Declare a route
fastify.get('/', async () => {
    return {hello: 'world'}
})

fastify.post('/v1/compoundRequest', async (req) => {
    const compoundQuery = req.body.map(({id, method, body}, index) => {
        const {filters, values, onlyContains} = body;
        const whereString = filters.map((key, index) => {
            return `"${key}" = '${values[index].toString().split("'").join("''")}'`
        }).join(' and ');
        const onlyContainsString = Object.keys(onlyContains).map(key => {
            const val = onlyContains[key].map(key => `'${key}'`);
            return `"${key}" in (${val.join(',')})`
        }).join(' and ');
        return `(select sum(${method}) as "${id}" from sales where ${whereString} ${onlyContainsString.length > 0 ? `and ${onlyContainsString}` : ''}) as "${index}"`;
    });
    const sqlQuery = `select * from ${compoundQuery.join(' , ')}`;
    try{
        const [[data]] = await sequelize.query(sqlQuery);
        return Object.keys(data).map((key) => {
            return {value: data[key], id: key}
        })
    }catch(err){
        debugger;
        throw err;
    }

})


fastify.get('/v1/dimension', async () => {
    return Object.keys(SalesSchema).filter(key => key !== 'id').map(key => {
        return {id: key, name: SalesSchema[key].comment, isQuantifiable: SalesSchema[key].isQuantifiable}
    })
});

fastify.get('/v1/distinct/:columnName', async (req) => {

    const columnName = req.params.columnName;
    const query = `select DISTINCT(${columnName.split('_').map(key => `"${key}"`).join("||'#'||")}) as column from sales order by "column" asc`;
    const [data] = await sequelize.query(query, {logging: false});
    return data.map(d => ({[columnName]: d.column}));
});

// Run the server!
const start = async () => {
    try {
        await Sales.sync();
        fastify.listen(3001, '0.0.0.0')
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