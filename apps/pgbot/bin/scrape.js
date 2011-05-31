#!/usr/bin/env node

var Url    = require('url');
var Path   = require('path');
var Fs     = require('fs');
var Rest   = require('restler');
var JsDom  = require('jsdom');
var jQuery = require('jquery');
var _      = require('underscore');
var Valve  = require('../modules/valve');

load('get', 'http://www.paulgraham.com/articles.html', null, null, null, function(err, $) {
    var links = $('table').eq(2).find('a').toArray();
    var hrefs = _.reduce(links, function(memo, item, key) {
        var $item = $(item);
        var href  = $item.attr('href')||'';
        
        if (href.match(/\.html$/)) {
            memo.push('http://www.paulgraham.com/' + href);
        }
        
        return memo;
    }, []);
    
    var name  = Path.join(__dirname, '../data/articles.txt')
    var file  = Fs.createWriteStream(name);
    var valve = new Valve(load, 3);
    valve.on('result', function(err, $) {
        if (err) { return; }
        
        var text = $('body table').eq(0).text().replace(/\n/g, ' ').replace(/\s+/m, ' ');
        file.write(text);
    });
    valve.on('empty', function() {
        console.log('===========');
    });
    
    for (var i = 0; i < hrefs.length; i++) {
        valve.push('get', hrefs[i], null, null, null);
    }
});

function load(method, url, query, data, options, func) {
    method = method.toLowerCase();
    
    var parsers = {
        auto: function(data, callback) {
            var contentType = this.headers['content-type'];
            
            if (contentType) {
                for (var matcher in parsers.auto.matchers) {
                    if (contentType.indexOf(matcher) == 0) {
                        return parsers.auto.matchers[matcher].call(this, data, callback);
                    }
                }
            }
        
            callback(data);
        },
        json: function(data, callback) {
            callback(data && JSON.parse(data));
        },
        html: function(data, callback) {
            var body = data.
                replace(/<(\/?)script/g, '<$1nobreakage').
                replace(/<(\/?)style/g, '<$1nobreakage').
                replace(/<(\/?)link/g, '<$1nobreakage');
            
            var options   = {features:{'FetchExternalResources':false, 'ProcessExternalResources':false}}
                ,dom      = JsDom.jsdom(body, null, options)
                ,window   = dom.createWindow()
                ,document = window.document;
            
            callback(jQuery.create(window));
        }
    };
    parsers.auto.matchers = {
        'application/json' : parsers.json,
        'text/html'        : parsers.html
    };
    
    options = _.extend({}, options||{}, {
        followRedirects : true,
        parser          : parsers.auto
    });
    
    options.headers = _.extend({
        'Content-Type':'application/json; charset=UTF-8'
    }, options.headers||{});
    
    if (query) {
        options.query = query;
    }
    
    if (data) {
        options.data = data;
    }
    
    var request = Rest[method](url, options);
    request.on('success', function($) { func(null, $); });
    request.on('error', function(err) { func(err, null); });
}
