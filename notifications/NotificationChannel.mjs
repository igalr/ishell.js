export class NotificationChannel {
    async notify(message, threadkey = null) {
        try { message = JSON.stringify(message); } catch { };
        if (process.env.NOTIFICATION_URL) {
            let body = { text: message };
            if (threadkey) body.thread = { threadKey: threadkey };
            try {
                const response = await fetch(process.env.NOTIFICATION_URL, {
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
        } else {
            console.log('Notification:', message);
            return {
                status: 'not_sent',
                reason: 'No NOTIFICATION_URL configured'
            };
        }
    }
}
