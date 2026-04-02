import { ResponseJSON } from "./response.mjs";
import { APIInterface } from "./API.mjs";
import { handleLambdaTrigger } from "./lambdaHandler.mjs";

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
