$(function() {
    var $wrap  = $('.wrapper')
        ,$conv = $('.conversation')
        ,$line = $conv.find('li').remove()
        ,$form = $('.form')
        ,$text = $('.text');
    
    $form.submit(function() {
        submitHandler();
        return false;
    });
    
    $text.focus();
    addLine('paul', 'What\'s your idea. Hit me.');
    
    var submitHandler = _.debounce(function() {
        var text = $.trim($text.val());
        $text.val('');
        
        if (text == '') {
            return false;
        }
        
        addLine('me', text);
        
        $.post('/pgbot/line', {text:text}, function(response, status) {
            var text = (response.success == true) ? response.payload : 'server error';
            addLine('paul', text);
        });
        
        return false;
    }, 200);
    
    function addLine(name, text) {
        var $item = $line.clone();
        
        $item.find('.name').html(name + ':');
        $item.find('.text').html(text);
        
        $conv.append($item);
        $wrap.scrollTo($item);
    }
});

