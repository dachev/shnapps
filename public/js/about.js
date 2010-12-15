$(function() {
    var $credits = $('#credits');
    
    function initCredits() {
        if (typeof $.gritter != 'object') {
            return;
        }
        
        $(document).delegate('.gritter-item p a', 'click', function() {
            var $this = $(this),
                href  = $this.attr('href');
            
            window.open(href, 'credits');
            
            return false;
        });
        
        $.gritter.add({
            title  : 'About',
            text   : $credits.html(),
            image  : '/images/button_info_01.png',
            sticky : true
        });
    }
    
    initCredits();
});