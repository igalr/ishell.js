import { APIInterface } from "redleaf-ishell/API.js";
import { LambdaSimulatorAPI } from "redleaf-ishell/LambdaSimulatorAPI.js";
import { ResponseJSON } from "redleaf-ishell/response.js";

export class API extends APIInterface {
    constructor() {
        super({
            v1: {
                api: true,
                toplevel: true,
                tag: "V1",
                action: () => Promise.resolve(new V1())
            },
        });

        super.addLambdaSimulator(async () => new LambdaSimulatorAPI(this));
    }
}

export default class V1 extends APIInterface {
    constructor() {
        super({
            smoke: {
                method: "GET",
                description: "API to check if the service is running",
                action: async () => new ResponseJSON({ status: "ok" })
            },
            env: {
                method: "GET",
                description: "API to check the environment variables",
                action: async () => new ResponseJSON(process.env)
            }
        },
        "V1 API", process.env.VERSION || "Unknown");
    }
}
