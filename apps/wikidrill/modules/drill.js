var Rest   = require('restler'),
    JsDom  = require('jsdom'),
    Url    = require('url');

Probe.prototype = new process.EventEmitter();
Probe.prototype.constructor = Probe;
function Probe(startTerm, endTerm) {
    var self     = this,
        baseUrl  = 'http://en.wikipedia.org/wiki/',
        startUrl = Url.parse(baseUrl + startTerm),
        endUrl   = Url.parse(baseUrl + endTerm),
        stack    = [],
        $        = null,
        counter  = 0,
        maxHops  = 50;
    
    // give users a chance to attach "error" handlers
    process.nextTick(function() {
        if (startTerm.toLowerCase() == endTerm.toLowerCase()) {
            self.emit('error', {
                msg:'Start and end term must be different',
                stack:getTrace(stack)
            });
            
            return;
        }
        
        loadPage(startUrl);
    });
    
    function loadPage(url) {
        if (counter >= maxHops) {
            self.emit('error', {
                msg:'Maximum number of hops reached: ' + maxHops,
                stack:getTrace(stack)
            });
            
            return;
        }
            
        var currentUrl = url,
            request    = Rest.get(currentUrl.href, {followRedirects:true});
                
        request.on('success', function(body) {
            var $doc = parsePage(body);
            
            if (isDisambiguationPage($doc)) {
                self.emit('error', {
                    msg:'Disambiguation page ' + makeLink(currentUrl.href),
                    stack:getTrace(stack)
                });
                
                return;
            }
            
            var $h1      = $doc.find('#firstHeading'),
                title    = $h1.html(),
                $content = $doc.find('#bodyContent'),
                $p       = $content.children().filter('p'),
                $links   = $p.find('a').not(filterLinks);
            
            // done
            if (currentUrl.href.toLowerCase() == endUrl.href.toLowerCase()) {
                var item = {url:currentUrl, title:title, $links:$links};
                stack.push(item);
            
                self.emit('complete', {
                    msg:'success',
                    stack:getTrace(stack)
                });
                
                return;
            }
            
            var nextUrl = pickLink(currentUrl, $links);
            if (!nextUrl) {
                self.emit('error', {
                    msg:'Error finding an appropriate link in ' + makeLink(currentUrl.href),
                    stack:getTrace(stack)
                });
                
                return;
            }
            
            var item = {url:currentUrl, title:title, $links:$links};
            stack.push(item);
            
            counter++;
            loadPage(nextUrl);
        });
        
        request.on('error', function(data) {
            self.emit('error', {
                msg:'Error loading ' + makeLink(currentUrl.href),
                stack:getTrace(stack)
            });
        });
    }
    
    function pickLink(currentUrl, $links) {
        for (var i = 0; i < $links.length; i++) {
            var $link   = $links.eq(i),
                linkUrl = $link.attr('href');
            
            if (!linkUrl) { continue; }
            
            var absUrl  = Url.resolve(currentUrl, linkUrl),
                nextUrl = Url.parse(absUrl);
            
            if (isWikipediaUrl(nextUrl) == false) {
                continue;
            }
            
            if (isCircularUrl(nextUrl) == true) {
                continue;
            }
            
            return nextUrl;
        }
        
        return null;
    }
    
    function parsePage(body) {
        var domOpts = {
            features: { 
                'FetchExternalResources'   : false,
                'ProcessExternalResources' : false
            }
        };
        
        var window   = JsDom.jsdom(body, null, domOpts).createWindow(),
            document = window.document;
        
        // jquery breaks without this
        location  = window.location;
        navigator = {userAgent:'Node.js'};
        $         = require('jquery').create(window);
        
        return $(document);
    }
    
    function makeLink(url) {
        return ['<a href="', url, '">', url, '</a>'].join('');
    }
    
    function getTrace(stack) {
        var trace = [];
        
        for (var i = 0; i < stack.length; i++) {
            var item = stack[i];
            
            trace.push({
                url   : item.url.href,
                title : item.title
            });
        }
                
        return trace;
    }
    
    function isCircularUrl(nextUrl) {
        for (var i = 0; i < stack.length; i++) {
            var visitedUrl = stack[i].url;
            if (visitedUrl.href == nextUrl.href) {
                return true;
            }
        }
        
        return false;
    }

    function isWikipediaUrl(url) {
        if (!url.protocol || url.protocol.indexOf('http') != 0) {
            return false;
        }
        if (!url.host || url.host.indexOf('wikipedia.org') < 0) {
            return false;
        }
    
        return true;
    }
    
    var blacklistRe = /(language)|(taxonomy)|(oxford_english_dictionary)/;
    function isEtymology(link) {
        var href = link.getAttribute('href');
        if (href && blacklistRe.test(href.toLowerCase())) {
            return true;
        }
    
        var afterParentheses  = false,
            beforeParentheses = false,
            beforeSnippet     = '',
            afterSnippet      = '',
            cnt               = 0;
        
        node = link;
        while (node.previousSibling && cnt++ < 20) {
            node = node.previousSibling;
            
            var text = node.nodeValue || node.textContent || '';
            
            beforeSnippet = text + beforeSnippet;
        }
        node = link;
        while (node.nextSibling && cnt++ < 20) {
            node = node.nextSibling;
            
            var text = node.nodeValue || node.textContent || '';
            
            afterSnippet = afterSnippet + text;
        }
        
        if (beforeSnippet.indexOf('(') < 0 || afterSnippet.indexOf(')') < 0) {
            return false;
        }
        
        if (beforeSnippet.indexOf(')') >= 0 && beforeSnippet.lastIndexOf(')') > beforeSnippet.lastIndexOf('(')) {
            return false;
        }
        
        if (afterSnippet.indexOf('(') >= 0 && afterSnippet.indexOf('(') < afterSnippet.indexOf(')')) {
            return false;
        }
        
        return true;
    }
    
    function isAnchor(link) {
        var href = link.getAttribute('href');
        if (href && href.indexOf('#') > 0) {
            return true;
        }
        
        return false;
    }
    
    function filterLinks() {
        var $this = $(this);
        
        if ($this.closest('.IPA').length > 0) {
            return true;
        }
        if ($this.closest('.reference').length > 0) {
            return true;
        }
        if (isEtymology(this)) {
            return true;
        }
        if (isAnchor(this)) {
            return true;
        }
        if ($this.hasClass('extiw') == true) {
            return true;
        }
        
        return false;
    }
    
    function isDisambiguationPage($doc) {
        if ($doc.find('#disambigbox').length > 0) {
            return true;
        }
        
        return false;
    }
}

function probe(startTerm, endTerm) {
    return new Probe(startTerm, endTerm);
};

function Profiler() {
    var start = +new Date,
        count = 0;
    
    this.log = function(label) {
        var now = (+new Date);
        
        count++;
        var msg = count + ':' + (now - start);
        if (label) {
            msg += ' (' + label + ')';
        }
        
        console.log(msg);
        start = now;
    }
    
    this.finalize = function() {
        console.log('---------------------');
    }
}

module.exports = {
    probe:probe
}






