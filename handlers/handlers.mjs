import { ExpressURLHandler } from "./express.mjs";
import { LambdaURLHandler } from "./lambdaURL.mjs";
import { AmazonConnectHandler } from "./amazonConnect.mjs";
import { KinesistHandler } from "./KinesisHandler.mjs";
import { S3Handler } from "./S3Handler.mjs";
import { SNSHandler } from "./SNSHandler.mjs";

export const handlers = {
    matchHandler: (input) => {
        if (LambdaURLHandler.isLambdaURL(input)) return new LambdaURLHandler(input);
        if (ExpressURLHandler.isExpressURL(input)) return new ExpressURLHandler(input);
        if (AmazonConnectHandler.isAmazonConnect(input)) return new AmazonConnectHandler(input);
        if (KinesistHandler.isKinesis(input)) return new KinesistHandler(input);
        if (S3Handler.isS3(input)) return new S3Handler(input);
        if (SNSHandler.isSNS(input)) return new SNSHandler(input);
        return null;
    },
};