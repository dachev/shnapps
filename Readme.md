
# shnapps
      
A [node.js](http://nodejs.org) application server capable of hosting multiple websites.

## Live demo
[blago.dachev.com](http://blago.dachev.com)

## Installation
``` bash
    // Create the docroot. This is where all of your apps will go.
    $ mkdir -p /path/to/your/docroot
    
    // Clone the shnapps repo.
    $ git clone git@github.com:dachev/shnapps.git
    $ cd shnapps
    
    // Install dependancies.
    $ npm install .
    
    // Create the config file.
    $ cp config.txt.js config.js
    
    // Edit configuration. Make sure to set docroot to the path from step 1.
    $ edit config.js
    
    // Run
    $ ./www.js -e development
```
Open your browser and load [http://127.0.0.1:YOUR_PORT](http://127.0.0.1:YOUR_PORT). You should see a default page. Now you can install some example apps:
``` bash
    // Get the code
    $ cd /path/to/your/docroot
    $ git clone git@github.com:dachev/shnapps-wikidrill.git
    $ cd shnapps-wikidrill
    
    // Install dependancies.
    $ npm install .
```
When you are done. Restart the server and go to [http://127.0.0.1:YOUR_PORT](http://127.0.0.1:YOUR_PORT). You should see a link to the wikidrill app.

## Node Compatibility
    
The latest revision of shnapps is compatible with node --version:

    v0.4.9

## License 

(The MIT License)

Copyright 2010, Blagovest Dachev.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.