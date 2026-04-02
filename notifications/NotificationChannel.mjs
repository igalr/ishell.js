export class NotificationChannel {
    #notificationUrl; get url() { return this.#notificationUrl; }
    constructor(notificationUrl = null) {
        this.#notificationUrl = notificationUrl;
    }

    async notify(message, threadkey = null) {
        try { message = JSON.stringify(message); } catch { };
        let body = { text: message };
        if (threadkey) body.thread = { threadKey: threadkey };
        try {
            const response = await fetch(this.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            return {
                status: 'sent',
                response: response
            }
        } catch (err) {
            console.error('Failed to send notification', err);
            return {
                status: 'not_sent',
                reason: err.message
            }
        }
    }
}
