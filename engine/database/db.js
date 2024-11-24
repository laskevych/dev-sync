import mysql from 'mysql2/promise';
const connection = mysql.createPool({
    database: process.env.DB_NAME || 'DevSync',
    port: process.env.DB_PORT || 3306,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    queueLimit: 0,
    connectionLimit: 15
});

const currentQuery = connection.query;
connection.query = async function (...args) {
    console.log('DB Query:', args[0].replace(/\s+/g, ' ').trim(), args[1] ? '' : '\n');
    if (args[1]) {
        console.log('Query values:', args[1], '\n');
    }
    return currentQuery.apply(
        this,
        args
    );
};
export default connection;