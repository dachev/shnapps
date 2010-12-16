$(function() {
    var $doc     = $(document),
        $inputs  = $('input'),
        $submit  = $inputs.filter('[type="submit"]'),
        $status  = $('#status'),
        $result  = $('#result'),
        template = $('#jquery_tmpl_template').template();
    
    initInputs();
    disableSubmit();
    
    $doc.ajaxError(function() {
        enableSubmit();
        $submit.removeClass('working');
        $status.removeClass('working').addClass('done');
        $status.addClass('error').find('.message').html('Unknow server error');
    });
    
    $doc.delegate('a', 'click', function() {
        var $this = $(this),
            href  = $this.attr('href');
        
        if (!href) { return; }
        
        window.open(href);
        
        return false;
    });
    
    $doc.delegate('input', 'keyup change focus blur', function() {
        checkFormValid();
        return false;
    });
    
    $doc.delegate('form', 'submit', function() {
        var $this  = $(this),
            args   = makeArgs(),
            action = $this.attr('action');
        
        for (var i = 0; i < args.length; i++) {
            var arg = args[i];
            if (arg.value == '') {
                return false;
            }
        }
        
        disableSubmit();
        $submit.addClass('working');
        $result.removeClass('nonempty').html('');
        $status.removeClass('inactive done error warning success');
        $status.addClass('working').find('.message').html('');
        
        $.post(action, args, function(response, status, xhr) {
            enableSubmit();
            $submit.removeClass('working');
            $status.removeClass('working').addClass('done');
            
            var result = {success:false, msgType:'error', msg:'Unknow server error'};
            if (status == 'success' && response) {
                result = response;
            }
            
            if (result.msgType) {
                $status.addClass(result.msgType).find('.message').html(result.msg || '');
            }
            
            if (result.stack && result.stack.length > 0) {
                var args = {items:result.stack};
                
                $result.
                    addClass('nonempty').
                    append($.tmpl(template, args));
            }
        });
        
        return false;
    });
    
    function makeArgs() {
        var args = {};
        
        $inputs.filter('[type="text"]').each(function() {
            var $this  = $(this),
                name   = $this.attr('name'),
                value  = $this.val();
            
            args[name] = value;
        });
        
        return args;
    }
    
    function checkFormValid() {
        var invalidCount = 0;
        
        $inputs.filter('[type="text"]').each(function() {
            var $this  = $(this),
                value  = $this.val();
        
            if (value == '') {
                $this.addClass('invalid');
                disableSubmit();
                invalidCount++;
            }
            else {
                $this.removeClass('invalid');
            }
        });
        
        if (invalidCount == 0 && $submit.hasClass('working') == false) {
            enableSubmit();
        }
    }
    
    function disableSubmit() {
        $submit.
            addClass('disabled').
            attr('disabled', 'true');
    }
    
    function enableSubmit() {
        $submit.
            removeClass('disabled').
            attr('disabled', '');
    }
    
    function initInputs() {
        $inputs.filter('[type="text"]');
    }
});