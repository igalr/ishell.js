import { PublishCommand, PublishResponse, SNSClient } from '@aws-sdk/client-sns';
import { fromIni } from '@aws-sdk/credential-providers';

export class SNSPublisher {
  readonly #topic: string;
  get topic(): string { return this.#topic; }

  readonly #client: SNSClient;
  get client(): SNSClient { return this.#client; }

  constructor(topic: string | null = null) {
    this.#topic = (process.env.SNS_ARN_PREFIX ?? '') + (topic ?? '');

    const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    const config: ConstructorParameters<typeof SNSClient>[0] = {
      region: process.env.AWS_REGION,
    };
    if (!isLambda) {
      config.credentials = fromIni({ profile: process.env.AWS_PROFILE });
    }
    this.#client = new SNSClient(config);
  }

  async publish(message: object): Promise<PublishResponse> {
    const command = new PublishCommand({
      TopicArn: this.#topic,
      Message: JSON.stringify(message),
    });
    return await this.#client.send(command);
  }
}
