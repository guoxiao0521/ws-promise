const WebSocket = require('ws');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const wss = new WebSocket.Server({ port: 8080 });
const app = express()
const port = 3000;
const staticPath = path.join(__dirname, '../front');

app.use(express.static(staticPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

wss.on('connection', function connection(ws) {
    console.log('A new client connected!');

    ws.on('message', function incoming(message) {
        console.log('Received: %s', message);

        // 广播消息给所有连接的客户端
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.send('Welcome to the WebSocket server!');
});

app.listen(port, () => {
    console.log(`WebSocket server is running on ws://localhost:8080 static server port=${port}`);
})