import { API } from './api/V1.js';
import { handleLambdaTrigger, setLambdaInvocationEndHook } from 'redleaf-ishell/lambdaHandler.js';

setLambdaInvocationEndHook (async () => {
    console.log ("Disconnect DB at the end of the Lambda invocation");
});

export const handler = async (event: any) => {
    const response = await handleLambdaTrigger(event, new API());
    if (response.statusCode >= 400) {
        console.error("OUTPUT", JSON.stringify(response));
    } else if (process.env.AWS_LOG_IO === 'true') {
        if (!response.headers || response.headers['Content-Source'] !== 'static') {
            console.log("OUTPUT", JSON.stringify(response));
        }
    }
    return response;
};
