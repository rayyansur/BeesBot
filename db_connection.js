import 'dotenv/config';
import mysql from 'mysql2';

export let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASS,
    database: "ideas"
})

con.on('error', (err) => {
    console.error('MySQL error:', err.message);
});

function createTable() {
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        let sql = "CREATE TABLE IDEAS (name VARCHAR(255), description VARCHAR(255))";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Table created");
        });
    })
}
