import { APIInterface } from './API.js';
import { handleLambdaTrigger } from './lambdaHandler.js';
import { localServer } from './localServer.js';
import { localCLI } from './localCLI.js';
import { ResponseJSON, ResponseText, ResponseHTML, ResponseXML } from './response.js';

module.exports = {
    localServer,
    localCLI,
    handleLambdaTrigger,
    APIInterface,
    ResponseJSON,
    ResponseText,
    ResponseHTML,
    ResponseXML
};