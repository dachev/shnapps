$(function() {
    var $about = $('#about');
    
    function initAbout() {
        if (typeof $.gritter != 'object') {
            return;
        }
        
        $(document).delegate('.gritter-item p a', 'click', function() {
            var $this = $(this),
                href  = $this.attr('href');
            
            window.open(href, 'about');
            
            return false;
        });
        
        $.gritter.add({
            title  : 'About',
            text   : $about.html(),
            image  : '/images/button_info_01.png',
            sticky : true
        });
    }
    
    initAbout();
});