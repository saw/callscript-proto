var connect = require('connect');
var path = require('path');
var serveStatic = require('serve-static');
connect().use(serveStatic(path.join(__dirname, '/dist'))).listen(5000, function(){
    console.log('Listening on 5000');
});