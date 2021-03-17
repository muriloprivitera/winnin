const config = require('../config.json');
const mysql = require('mysql');

const connect_bd = mysql.createConnection({
    host: config['HOST'],
    user: config['USER'],
    port: config['PORT'], 
    password: config['PASSWORD'],
    database: config['DATABASE'],
});
  
module.exports = connect_bd;