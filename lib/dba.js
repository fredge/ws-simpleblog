/* 
 * Module dependencies
 */
var mysql = require('mysql'),
    config = require('./config').config;

exports.getInitPosts = function(callback) {
    var sql = 'select * from posts order by id desc limit ?';
    var params = [config.limit];
    executeQuery(sql, params, function(err, results) {
        callback(err, results);
    });
};
exports.entryPost = function(data, callback) {
    var sql = "insert into posts (body, entry_date) values (?, now())";
    var params = [data.body];
    executeQuery(sql, params, function(err, results) {
        callback(err);
    });
};
exports.getOlderPosts = function(data, callback) {
    var sql = 'select * from posts where id < ? order by id desc limit ?';
    var params = [data.id, config.limit];
    executeQuery(sql, params, function(err, results) {
        callback(err, results);
    });
};
exports.getNewerPosts = function(data, callback) {
    var sql = 'select * from posts where id > ? order by id desc limit ?';
    var params = [data.id, config.limit];
    executeQuery(sql, params, function(err, results) {
        callback(err, results);
    });
};

function createClient() {
    return mysql.createClient({
        debug: false,
        host: config.mysqlHost,
        port: config.mysqlPort,
        user: config.mysqlUser,
        password: config.mysqlPassword,
        database: config.mysqlDb
    });
}

function executeQuery(sql, params, callback) {
    var client = createClient();
    var results = [];
    var query = client.query(sql, params);
    query.on('row', function(row) {
        results.push(row);
    });
    query.on('end', function(rslt) {
        callback(null, results);
        client.end();
    });
    query.on('err', function(err) {
        callback(err);
        if (client) client.end();
    });
}
// test code
//executeQuery("insert into posts (body, entry_date) values('hello.', now())", null, function(err, result) {
//    if (err) {
//        console.log(err);
//        return;
//    }
//    console.log(result);
//    return;
//});