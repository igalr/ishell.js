export interface NotificationResult {
  status: 'sent' | 'not_sent';
  response?: Response;
  reason?: string;
}

export class NotificationChannel {
  readonly #notificationUrl: string | null;
  get url(): string | null { return this.#notificationUrl; }

  constructor(notificationUrl: string | null = null) {
    this.#notificationUrl = notificationUrl;
  }

  async notify(message: object, threadkey: string | null = null): Promise<NotificationResult> {
    let text: string;
    try { text = JSON.stringify(message); } catch { text = String(message); }
    const body: Record<string, any> = { text };
    if (threadkey) body['thread'] = { threadKey: threadkey };
    try {
      const response = await fetch(this.#notificationUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return { status: 'sent', response };
    } catch (err) {
      console.error('Failed to send notification', err);
      return { status: 'not_sent', reason: (err as Error).message };
    }
  }
}
