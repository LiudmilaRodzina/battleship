import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

const HTTP_PORT = 8181;
const WS_PORT = 3000;

const httpServer = http.createServer((req, res) => {
  const __dirname = path.resolve(path.dirname(''));
  const file_path =
    __dirname + (req.url === '/' ? '/front/index.html' : '/front' + req.url);

  fs.readFile(file_path, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`Start static HTTP server on the ${HTTP_PORT} port`);
  console.log(`WebSocket server started on ws://localhost:${WS_PORT}`);
});

export default httpServer;
