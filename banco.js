const express       = require('express')
const app           = express()
const port          = 3000
const bodyParser    = require('body-parser');
const { dirname }   = require('path')
const { Pool }      = require('pg');
require ('dotenv').config();

const config = {
    user :process.env.PGUSER,
    host :process.env.PGHOST,
    database :process.env.PGDB,
    password: process.env.PGPASSWORD
}
const pool = new Pool(config);

app.use(express.json())
app.post('/usuario',async (req,res)=>{
    try {
        const query         = 'INSERT INTO "usuarios"(nombre,balance) VALUES($1,$2)';
        const parametros    = [ req.body.nombre, req.body.balance]
        let respuesta       = await pool.query(query,parametros);
        res.send(respuesta)
    } catch (error) {
        console.log(error.message)
    }
}) 
app.get('/usuarios', async (req,res)=>{
   try {
    const query     = 'SELECT "id","nombre","balance" FROM "usuarios"'
    let respuesta   = await pool.query(query);
    res.send(respuesta.rows)
   } catch (error) {
    console.log(error.message)
   }
})
app.get('/transferencias',async (req,res)=>{
    try {
        let query       = 'SELECT t."id",t."fecha",u1."nombre" AS "Emisor",t."emisor",u2."nombre" AS "Receptor",t."receptor",t."monto" FROM "transferencias" t '
            query       +=' JOIN "usuarios" u1 ON u1."id"=t."emisor" ' 
            query       +=' JOIN "usuarios" u2 ON u2."id"=t."receptor"'
        let respuesta   = await pool.query(query);
        let array       =[]
        for(i=0;i<respuesta.rows.length;i++){
            let fila = [respuesta.rows[i].id,respuesta.rows[i].Emisor,respuesta.rows[i].Receptor,respuesta.rows[i].monto,respuesta.rows[i].fecha]
            array.push(fila)
        }
        res.send(array)
    } catch (error) {
        console.log(error.message)
    }
}) 
app.put('/usuario/:id', async(req,res)=>{
    try {
        let query        = 'update "usuarios" set "nombre"= $1,"balance"= $2 where id= $3'
        let id           = req.params.id
        let nombre       = req.body.name
        let balance      = req.body.balance
        let parametros   = [req.body.name,req.body.balance,req.params.id];
        let respuesta    = await pool.query(query,parametros);
        res.json({estatus:'ok'})
    } catch (error) {
        console.log(error.message)
    }
})
app.delete('/usuario/:id',async(req,res)=>{
    try {
        let query     = 'DELETE FROM "usuarios" WHERE "id"= $1'
        let respuesta = await pool.query(query,[req.params.id] )
        res.json({status:'ok'})
    } catch (error) {
        console.log(error.message)
    }
})
app.post('/transferencia', async(req,res)=>{
    let q1 ='UPDATE usuarios SET balance=balance - $1 WHERE Id = $2; '
    let q2 = 'UPDATE usuarios SET balance=balance + $1 WHERE Id = $2;'
    let q3 = 'INSERT INTO "transferencias"(emisor,receptor,monto,fecha) VALUES($2,$3,$1,$4)'

    try {
        const parametros = [req.body.monto,req.body.emisor,req.body.receptor,new Date()]
        await pool.query("BEGIN");
        await pool.query(q1,[req.body.monto,req.body.emisor]);
        console.log('debitado emisor')
        await pool.query(q2,[req.body.monto,req.body.receptor]);
        console.log('incrementado receptor')
        await pool.query(q3,parametros);
        console.log('ingresada la transferencia')
        await pool.query("COMMIT");
        res.json({status:'ok'})
    } catch (error) {
        console.log(error.message)
    }
})
app.get('/', (req, res) => {
   res.sendFile(__dirname+'/html/index.html')
})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))