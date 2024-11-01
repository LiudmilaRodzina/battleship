import { config } from 'dotenv';
import httpServer from './server/httpServer';
import './server/wsServer';

config();

const HTTP_PORT = process.env.HTTP_PORT || 8181;

httpServer.listen(Number(HTTP_PORT), () => {
  console.log(`Static HTTP server started on http://localhost:${HTTP_PORT}`);
});
