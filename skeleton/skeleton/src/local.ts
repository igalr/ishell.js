import dotenv from 'dotenv';
import { localServer } from 'redleaf-ishell/localServer.js';
import { API } from './api/V1.ts';
dotenv.config();

console.log ("starting local server...", process.env.AWS_PROFILE);
const server = await localServer(new API());    // do not remove the 'server' variable, it is needed to keep the server running
