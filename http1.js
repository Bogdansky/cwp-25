const express = require('express');
const compression = require('compression');

let app = express();

app.use(compression({level: 6}))
app.use('/', express.static(__dirname+'/public'));

module.exports = app;

app.listen(3000, () => {
    console.log('My app is listening on port 3000!');
})