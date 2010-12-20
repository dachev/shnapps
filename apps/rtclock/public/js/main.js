$(function() {
    var $clocks  = $('.clock'),
        $local   = $clocks.filter('.local'),
        $remote  = $clocks.filter('.remote');
    
    function initLocalClock() {
        $local.time(new Date);
        
        setInterval(function() {
            $local.time(new Date);
        }, 330);
    }
    
    function initRemoteClock() {
    
        var client = new Faye.Client(location.host + '/faye', {
            timeout:120
        });
        client.subscribe('/rtclock/time', function(msg) {
            showRemoteTime(msg.time);
        });
        client.subscribe('/rtclock/users', function(msg) {
            showNotification(msg.users);
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