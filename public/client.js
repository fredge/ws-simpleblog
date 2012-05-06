(function() {
    // page context
    var context = (function() {
        var latestId;
        var oldestId;
        return {
            getLatestId: function() {
                return latestId;
            },
            setLatestId: function(id) {
                latestId = id;
            },
            getOldestId: function() {
                return oldestId;
            },
            setOldestId: function(id) {
                oldestId = id;
            }
        };
    }());
    window.addEventListener('load', function(e) {
        var elComment = document.getElementById('comment');
        clear();
        var ws = new WebSocket("ws://" + document.URL.substr(7).split('/')[0]);
        ws.onopen = function() {
            console.log(new Date() + " Connected");
            // load latest posts
            var message = {
                event: 'refresh'
            };
            ws.send(JSON.stringify(message));
        };
        ws.onmessage = function(event) {
            if (!event.data) {
                return;
            }
            // JSON parse
            var json = JSON.parse(event.data);
            console.debug(json);
            switch (json.event) {
            case 'refresh':
                if (json.result == 'SUCCESS') {
                    // load posts
                    var tbody1 = document.getElementById('tbody1');
                    var rs = createMultiRec(json.posts);
                    for (var i = 0; i < rs.length; i++) {
                        tbody1.appendChild(rs[i]);
                    }
                    // update page context
                    context.setLatestId(json.latestId);
                    context.setOldestId(json.oldestId);
                }
                else {
                    console.error('Failed loading posts.');
                }
                break;
            case 'post':
                if (json.result == 'SUCCESS') {
                    console.log('Posting comment success');
                    // load newer posts
                    ws.send(JSON.stringify({
                        event: 'getNewer',
                        data:{
                            id: context.getLatestId()
                        }
                    }));
                }
                else {
                    console.error('Failed posting comment.');
                }
                break;
            case 'getNewer':
                if (json.result == 'SUCCESS') {
                    if (json.posts.length === 0) {
                        console.log('No newer post');
                        return;
                    }
                    // load posts
                    (function(){
                        var tbody1 = document.getElementById('tbody1');
                        var rs = createMultiRec(json.posts);
                        var before = tbody1.firstChild;
                        for (var i = 0; i < rs.length; i++) {
                            tbody1.insertBefore(rs[i], before);
                        }
                        // update page context
                        context.setLatestId(json.latestId);
                    }());
                } else {
                    console.error('Failed loading newer posts.');
                }
                break;
            default:
                break;
            }
        };
        ws.onclose = function() {
            console.log(new Date() + " Disconnected");
        };
        document.getElementById('post').addEventListener('click', function(e) {
            if (elComment.value) {
                var message = {
                    event: 'post',
                    data: {
                        body: elComment.value
                    }
                };
                ws.send(JSON.stringify(message));
            }
            clear();
            return false;
        }, false);
        document.getElementById('newer').addEventListener('click', function(e) {
            // load newer posts
            ws.send(JSON.stringify({
                event: 'getNewer',
                data:{
                    id: context.getLatestId()
                }
            }));
        }, false);

        function clear() {
            elComment.value = '';
            elComment.focus();
        }

        function createSingleRec(post) {
            var r = document.createElement('tr');
            var date = document.createElement('td');
            date.appendChild(document.createTextNode(post.entry_date));
            var body = document.createElement('td');
            body.appendChild(document.createTextNode(post.body));
            r.appendChild(date);
            r.appendChild(body);
            return r;
        }

        function createMultiRec(posts) {
            var rs = [];
            for (var i = 0; i < posts.length; i++) {
                rs.push(createSingleRec(posts[i]));
            }
            return rs;
        }
    }, false);
}());