var mysql = require('mysql');
var conn = mysql.createConnection({
  host: 'localhost', // host name
  user: 'root',      // Replace with your database username
  password: '',      // Replace with your database password
  database: 'app_node' // database Name
});
conn.connect(function (err) {
  if (err) throw err;
  console.log('Database is connected successfully !');
});
module.exports = conn;