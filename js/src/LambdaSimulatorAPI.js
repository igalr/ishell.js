import { ResponseJSON } from "./response.js";
import { APIInterface } from "./API.js";
import { handleLambdaTrigger } from "./lambdaHandler.js";

export class LambdaSimulatorAPI extends APIInterface {
    constructor(api, version='unknown') {
        super({
            simulate: {
                method: 'post',
                summary: 'Simulate a raw lambda trigger',
                description: 'Simulate a lambda trigger for testing purposes',
                body: {
                    properties: {}
                },
                action: async (params, body) => {
                    const result = await handleLambdaTrigger(body, api);
                    return new ResponseJSON(result);
                },
                tag: "Debug"
            }
        },
        "Lambda Simulator", version);
    }
}
