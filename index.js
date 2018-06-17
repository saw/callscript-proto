var connect = require('connect');
var path = require('path');
var serveStatic = require('serve-static');
var port = process.env.PORT;
connect().use(serveStatic(path.join(__dirname, '/dist'))).listen(port, function(){
    console.log('Listening on '+ port);
});