/*
 *  Module dependencies
 */
var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    util = require('util'),
    ejs = require('ejs'),
    StaticServer = require('node-static').Server,
    WebSocketServer = require('websocket').server;
var dba = require('./lib/dba'),
    config = require('./lib/config');
var staticServer = new StaticServer('./public');
var server = http.createServer(function(req, res) {
    if (url.parse(req.url).pathname != '/') {
        // delegate task to static server
        req.addListener('end', function() {
            staticServer.serve(req, res);
        });
        return;
    }
    // get posts list
    dba.getInitPosts(function(err, results) {
        var data = {};
        if (err) {
            console.error(err);
            return;
        }
        data.event = 'refresh';
        data.latestId = results[0].id;
        data.oldestId = results[results.length - 1].id;
        data.posts = results;
        util.debug(JSON.stringify(data));
        // render html
        var template = fs.readFileSync(__dirname + '/view/index.ejs');
        // var params = extractParams(req.url);
        res.writeHead(200, {
            'Content-Type': 'text/html'
        });
        res.write(ejs.render(template.toString(), {
            "data": data
        }));
        res.end();
    });
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});
var wsServer = new WebSocketServer({
    httpServer: server
});
wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        console.log(message);
        var json = JSON.parse(message.utf8Data);
        util.debug(json);
        switch(json.event) {
            case 'post':
                // post a comment
                dba.entryPost(json.data, function(err) {
                    if(err){
                        console.error(err);
                        sendReply({
                            event: 'post',
                            result: 'FAIL'
                        });
                        return;
                    }
                    sendReply({
                        event: 'post',
                        result: 'SUCCESS'
                    });
                });
                break;
            case 'getNewer':
                // load newer posts
                break;
            case 'getOlder':
                // load older posts
                break;
            default:
                console.error('Property "event" is not valid:' + json.event );
        }

//        if (message.type === 'utf8') {
        //            console.log('Received Message: ' + message.utf8Data);
        //            wsServer.broadcastUTF(message.utf8Data);
        //            // connection.send(message.utf8Data);
        //            console.log('Message sent successfully.');
        //        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
    function sendReply(json) {
        connection.send(JSON.stringify(json));
    }
});