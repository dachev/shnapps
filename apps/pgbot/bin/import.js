#!/usr/bin/env node

var Fs   = require('fs');
var Path = require('path');
var _    = require('underscore');

var host = '127.0.0.1';
var port = 8080;
var core = 'pgbot';
var solr = require('../modules/solr').createClient(host, port, core);

var name  = Path.join(__dirname, '../data/sentences.txt');
Fs.readFile(name, 'utf8', function(err, data) {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    
    var sentences = data.split('\n');
    var documents = _.reduce(sentences, function(memo, item, key) {
        memo.push({
            id   : (key+1).toString(),
            text : item
        });
        
        return memo;
    }, []);
    
    solr.del(null, '*:*', function(err, response) {
        if (err) {
            solr.destroy();
            console.log(err);
            process.exit(1);
        }
        
        solr.add(documents, function(err, response) {
            if (err) {
                solr.destroy();
                console.log(err);
                process.exit(1);
            }
            
            solr.commit();
            solr.optimize();
            solr.destroy();
        });
    });
});
