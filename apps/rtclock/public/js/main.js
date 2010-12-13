$(function() {
    var $clocks  = $('.clock'),
        $local   = $clocks.filter('.local'),
        $remote  = $clocks.filter('.remote');
    
    function initLocalClock() {
        $local.time(new Date);
        
        setInterval(function() {
            $local.time(new Date);
        }, 1000);
    }
    
    function initRemoteClock() {
        var socket = new io.Socket(null, {port:8000, rememberTransport: false});
        socket.connect();
    
        socket.on('connect', function()    {
            socket.send({topic:'rtclock', command:'join'});
        
            socket.on('message', function(msg) {
                if (msg.time) {
                    showRemoteTime(msg.time);
                }
                if (msg.notification) {
                    showNotification(msg.notification);
                }
            });
            socket.on('disconnect', function() {
            });
        });
    }
    
    function showRemoteTime(time) {
        var date = new Date(parseInt(time));
        
        $remote.time(date);
    }
    
    function showNotification(notification) {
        $.gritter.add(notification);
    }
    
    initLocalClock();
    initRemoteClock();
});