const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let sessions = {};

wss.on('connection', (ws) => {
  let sessionID = null;
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    switch (data.type) {
      case 'join':
        sessionID = data.sessionID;
        if (!sessions[sessionID]) {
          sessions[sessionID] = [];
        }
        sessions[sessionID].push(ws);
        break;
      case 'drawing':
        if (sessionID && sessions[sessionID]) {
          sessions[sessionID].forEach(client => {
            if (client !== ws) {
              client.send(JSON.stringify(data));
            }
          });
        }
        break;
    }
  });

  ws.on('close', () => {
    if (sessionID && sessions[sessionID]) {
      sessions[sessionID] = sessions[sessionID].filter(client => client !== ws);
      if (sessions[sessionID].length === 0) {
        delete sessions[sessionID];
      }
    }
  });
});

server.listen(5000, () => {
  console.log('Server started on port 5000');
});
