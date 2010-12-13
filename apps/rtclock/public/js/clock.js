/*
(c) copyright 2010, Brian Cavalier

LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the MIT
License at the following url: http://www.opensource.org/licenses/mit-license.php.
*/
$(function() {
    $.fn.extend({
        time:function() {
            var fl = Math.floor;
            
            return this.each(function(time) {
                var $clock = $(this).addClass('hr24').find('.sep').addClass('on').end()
                    ,now   = time || new Date
                    ,h = now.getHours()
                    ,m = now.getMinutes()
                    ,s = now.getSeconds()
                    ,nowstr = now.toString()
                    ,tz = (nowstr.match(/\b([A-Z]{1,4}).$/) || [""]).pop()
                    ,d = $clock.find('.digit')
                    ,hours = 24
                    ;
        
                // Set all the digits
                d.removeClass("d0 d1 d2 d3 d4 d5 d6 d7 d8 d9")
                .eq(0).addClass("d" + fl(h / 10)).end()
                .eq(1).addClass("d" + (h % 10)).end()
                .eq(2).addClass("d" + fl(m / 10)).end()
                .eq(3).addClass("d" + (m % 10)).end()
                .eq(4).addClass("d" + fl(s / 10)).end()
                .eq(5).addClass("d" + (s % 10));
            });
        }
    });
});    
