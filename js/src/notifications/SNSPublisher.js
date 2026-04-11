import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { fromIni } from "@aws-sdk/credential-providers";

export class SNSPublisher {
    #topic; get topic() { return this.#topic; }
    #client; get client() { return this.#client; }
    constructor(topic = null) {
        this.#topic = process.env.SNS_ARN_PREFIX + (topic ?? '');

        let config = { region: this.region }
        const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
        if (!isLambda) {
            config.credentials = fromIni({ profile: process.env.AWS_PROFILE });
        }
        this.#client = new SNSClient(config);
    }

    async publish(message) {
        const command = new PublishCommand({
            TopicArn: this.#topic,
            Message: JSON.stringify(message)
        });
        return await this.#client.send(command);
    }
}
