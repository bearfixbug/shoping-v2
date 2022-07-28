const express = require('express')
const app = express();
const bodyParser = require('body-parser')
const _ = require('lodash')
const cors = require('cors');
const mysql = require('mysql');
var axios = require('axios');
var qs = require('qs');
const linetoken = 'Bearer 8aSvFqK6fqwSE18FHH0Eow5AmVAYvvljZgemNa5gZEl'

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(3000, console.log('server is running....'))

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Dkigiupo@1452',
    database: 'shoping'
});
  
db.connect(function(err) {
    if (err) throw err;
    // mysql -u root -p
    // ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Dkigiupo@1452';
    // flush privileges;
    console.log("Server is Connected!");
});


app.get('/api/getproduct', (req,res) => {
    try {
        db.query(`select * from sp_product`,(err,resp) => {
            // console.log(resp)
            return res.status(200).json({
                RespCode: 200,
                RespMessage: 'good',
                Result: resp
            })
        })
    }
    catch(err) {
        console.log(err)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: 'bad',
            Log: 0
        })
    }

})

app.post('/api/buynow', (req,res) => {
    var cart = _.get(req, ["body", "product"]);
    var addr = _.get(req, ["body", "addr"]);
    
    try {
        if(cart && addr) {
            console.log(cart)
            db.query(`select * from sp_product`,(err,product) => {
                var amount = 0;
                for (let i = 0; i < cart.length; i++) {
                    for (let k = 0; k < product.length; k++) {
                        if(parseInt(cart[i].id) == parseInt(product[k].id)) {
                            amount += parseInt(cart[i].count) * product[k].price;
                            break;
                        }
                    }
                }

                console.log('amount',amount)
                var shiping = 100;
                var netamount = amount + shiping;
                var transid = 'TX'+new Date().getTime()

                db.query('insert into sp_transaction (transid,orderlist,amount,shipping,netamount,operation,mil,updated_at,addr) values (?,?,?,?,?,?,?,?,?)',[
                    transid,
                    JSON.stringify(cart),
                    amount,
                    shiping,
                    netamount,
                    'PENDING',
                    new Date().getTime(), 
                    new Date()+'',
                    addr
                ], (err2, resp2) => {
                    console.log('err', err2)

                    
                    var text = '';
                    for (let i = 0; i < cart.length; i++) {
                        text += `รายการที่ ${i+1} - ${cart[i].name} ไซส์ ${cart[i].size} จำนวน ${cart[i].count} คู่ |`;
                    }
                    text += ` ที่อยู่ : ${addr}`
                    var data = qs.stringify({
                        'message': text
                    });
                    var config = {
                    method: 'post',
                    url: 'https://notify-api.line.me/api/notify',
                    headers: { 
                        'Content-Type': 'application/x-www-form-urlencoded', 
                        'Authorization': linetoken
                    },
                    data : data
                    };

                    axios(config)
                    .then(function (response) {
                    console.log(JSON.stringify(response.data));
                    })
                    .catch(function (error) {
                    console.log(error);
                    });


                    return res.status(200).json({
                        RespCode: 200,
                        RespMessage: 'good',
                        Result: {
                            tx: transid
                        }
                    })
                })
            })
        }
        else {
            return res.status(400).json({
                RespCode: 400,
                RespMessage: 'bad',
                Log: 1
            })
        }
    }
    catch(err) {
        console.log(err)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: 'bad',
            Log: 0
        })
    }

})