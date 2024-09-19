class WebSocketPromise {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.messageQueue = [];
        this.currentMessageId = 0;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(this.url);

            this.socket.onopen = () => {
                resolve();
                this.processQueue();
            };

            this.socket.onerror = (error) => {
                reject(error);
            };

            this.socket.onmessage = (event) => {
                const response = JSON.parse(event.data);
                const pendingMessage = this.messageQueue.find(m => m.id === response.id);
                if (pendingMessage) {
                    pendingMessage.resolve(response.data);
                    this.messageQueue = this.messageQueue.filter(m => m.id !== response.id);
                }
            };
        });
    }

    send(data) {
        return new Promise((resolve, reject) => {
            const messageId = ++this.currentMessageId;
            const message = {
                id: messageId,
                data: data,
                resolve: resolve,
                reject: reject
            };

            this.messageQueue.push(message);

            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.sendMessage(message);
            }
        });
    }

    sendMessage(message) {
        this.socket.send(JSON.stringify({
            id: message.id,
            data: message.data
        }));

        // 设置超时
        setTimeout(() => {
            const index = this.messageQueue.findIndex(m => m.id === message.id);
            if (index !== -1) {
                this.messageQueue[index].reject(new Error('Response timeout'));
                this.messageQueue.splice(index, 1);
            }
        }, 5000); // 5秒超时
    }

    processQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue[0];
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.sendMessage(message);
                this.messageQueue.shift();
            } else {
                break;
            }
        }
    }

    close() {
        return new Promise((resolve) => {
            if (this.socket) {
                this.socket.onclose = () => {
                    resolve();
                };
                this.socket.close();
            } else {
                resolve();
            }
        });
    }
}