import { handlers } from './handlers/handlers.js';
import { BaseError } from './errors.js';
import { APIInterface } from './API.js';
import fs from 'fs';
import mime from 'mime-types';

export const handleLambdaTrigger = async (input: unknown, target: APIInterface): Promise<unknown> => {
  const handler = handlers.matchHandler(input);
  if (!handler) {
    console.error('No handler found for input');
    console.log('INPUT', JSON.stringify(input));
    return { statusCode: 400, body: 'Input not recognized' };
  }

  let headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
  };

  if (handler.method.toLowerCase() === 'options') {
    const reqHeaders = handler.headers as Record<string, string>;
    headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': reqHeaders['access-control-request-method'],
      'Access-Control-Allow-Headers': reqHeaders['access-control-request-headers'],
    };
    console.log('CORS request service');
    return { statusCode: 200, headers };
  }

  const path = handler.path as string[];
  if (path[0] === 'docs') {
    let filename: string;
    let contentType: string;
    if (path.length > 1) {
      filename = path.slice(1).join('/');
      const format = handler.format;
      if (format) {
        filename += '.' + format;
        contentType = mime.lookup(filename) || 'application/octet-stream';
      } else {
        contentType = 'application/octet-stream';
      }
    } else {
      filename = 'index.html';
      contentType = 'text/html';
    }
    filename = process.cwd() + '/node_modules/ishell.js/swagger/' + filename;
    const data = fs.readFileSync(filename);
    console.log('Docs file', filename, data.length);
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Content-Source': 'static',
      },
      body: data.toString(),
    };
  }

  const requestHeaders = { ...handler.headers, _handler_type: handler.type };

  try {
    if (process.env.AWS_LOG_IO === 'true') {
      console.log('INPUT', JSON.stringify(input));
    } else {
      console.log(handler.shortInputLog(input));
    }
    const response = await target.execute(
      path,
      handler.params as Record<string, unknown>,
      handler.method,
      handler.payload,
      requestHeaders
    );
    return handler.processResponse(response, headers);
  } catch (err) {
    console.log('INPUT', JSON.stringify(input));
    if (err instanceof BaseError) {
      return {
        statusCode: err.statusCode,
        headers,
        body: JSON.stringify({ error: err.message, type: err.name }),
      };
    }
    const msg = (err as Error).message;
    const params = handler.params as Record<string, unknown>;
    const trace =
      params['stacktrace'] !== 'false'
        ? (err as Error).stack?.split('\n').slice(1).map(line => line.trim())
        : undefined;
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: msg, stack: trace }) || 'Internal Application Error',
    };
  }
};
