(function() {
    window.addEventListener('load', function(e) {
        var elComment = document.getElementById('comment');
        clear();
        var ws = new WebSocket("ws://" + document.URL.substr(7).split('/')[0]);
        ws.onopen = function() {
            console.log(new Date() + " Connected");
        };
        ws.onmessage = function(event) {
            //            if (event.data) {
            //                document.getElementById('msg_list').insertBefore(create(event.data), this.firstChild);
            //            }
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

        function clear() {
            elComment.value = '';
            elComment.focus();
        }

        function create(data) {
            var d = document.createElement('div');
            d.appendChild(document.createTextNode(data));
            return d;
        }
    }, false);
}());