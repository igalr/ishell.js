import { APIInterface } from './API.js';
import { LambdaSimulatorAPI } from './LambdaSimulatorAPI.js';
import { localServer } from './localServer.js';
import { ResponseJSON } from './response.js';
import { localCLI } from './localCLI.js';

class API extends APIInterface {
  constructor() {
    super({
      v1: {
        api: true,
        toplevel: true,
        tag: 'V1',
        action: () => Promise.resolve(new V1()),
      },
    });

    this.addLambdaSimulator(async () => new LambdaSimulatorAPI(this));
  }
}

class V1 extends APIInterface {
  constructor() {
    super({
      foo: {
        method: 'get',
        description: 'API to control data sources (e.g. Google Sheets, S3) and retrieve data from them',
        action: async () => new ResponseJSON({ message: 'Hello World!' }),
      },
    });
  }
}

console.log('starting local server...');
const api = new API();
const server = await localServer(api);
await localCLI(api);
