import { APIInterface } from './API.mjs';
import { LambdaSimulatorAPI } from './LambdaSimulatorAPI.mjs';
import { localServer } from './localServer.mjs';
import { ResponseJSON } from './response.mjs';

class API extends APIInterface {
    constructor() {
        super({
            v1: {
                api: true,
                toplevel: true,
                tag: "V1",
                action: () => new V1()
            },
        });

        this.addLambdaSimulator (async () => new LambdaSimulatorAPI(this));
    }
}

class V1 extends APIInterface {
    constructor() {
        super({
            foo: {
                method: "get",
                description: "API to control data sources (e.g. Google Sheets, S3) and retrieve data from them",
                action: async () => new ResponseJSON({ message: "Hello World!" })
            }
        })
    }
}

console.log ("starting local server...");
const server = await localServer(new API());    // do not remove the 'server' variable, it is needed to keep the server running
