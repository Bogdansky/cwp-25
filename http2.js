const http2 = require('http2');
const fs = require('fs');
const mime = require('mime');
const path = require('path');

const {HTTP2_HEADER_PATH} = http2.constants;

const key = fs.readFileSync(__dirname+'\\ssl\\3965116_localhost.key');
const cert = fs.readFileSync(__dirname+'\\ssl\\3965116_localhost.cert');

const server = http2.createSecureServer(
  { key, cert },
  onRequest
);

function onRequest(req, res) {
  console.log(req.headers[':path']);

  switch(req.headers[':path']){
    case '/index.html': 
      push(req.stream, 'app.js');
      push(req.stream, 'site.css');
      for(let i = 1; i < 21; i++){
        push(req.stream, `app${i}.js`);
      }
      res.stream.respondWithFile('public'+req.headers[':path']);
      break;
    case '/site.css': 
    case '/app.js':
      res.stream.respondWithFile('public'+req.headers[':path']);
      break;
    default: 
      res.stream.respond({
        'content-type': 'text/html',
        ':status': 404
      });
      res.stream.end('<h1>Resource is forbidden</h1>');
    break;
  }
}

server.listen(8443, 'localhost', () => {
  console.log('Server is listening on port 8443');
});

function push(stream, filePath){
  let {fd, headers} = getFileInfo(path.join('./public', filePath));
  const pushHeaders = {[HTTP2_HEADER_PATH]: `/${path}`};
  stream.pushStream(pushHeaders, (err, pushStream) => {
    if (err) throw err;
    pushStream.respondWithFD(fd, headers);
  })
}

function getFileInfo(path){
  try {
    let fd = fs.openSync(path, 'r');
    let stat = fs.fstatSync(fd);
    return {
      fd,
      headers: {
        'content-length': stat.size,
			  'last-modified': stat.mtime.toUTCString(),
			  'content-type': mime.getType(path)
      }
    }
  } catch (error) {
    console.error(error.message);
  }
}