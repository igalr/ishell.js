import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { BaseError } from './errors.mjs';
import { ResponseJSON } from './response.mjs';

export const localServer = (target) => {
    const app = express();

    app.use(express.json());
    app.use(cors());

    app.use(
        '/docs',
        express.static(path.join(process.cwd(), 'node_modules/ishell.js/swagger'))
    );

    app.get(/.*/, async (req, res) => serveMethod(req, res));
    app.post(/.*/, async (req, res) => serveMethod(req, res));
    app.put(/.*/, async (req, res) => serveMethod(req, res));
    app.patch(/.*/, async (req, res) => serveMethod(req, res));
    app.delete(/.*/, async (req, res) => serveMethod(req, res));

    const serveMethod = async (req, res) => {
        let path = req.path;
        if (path.startsWith('/')) path = path.slice(1);
        if (path.endsWith('/')) path = path.slice(0, -1);
        const pos = path.lastIndexOf('.');
        if (pos > 0) {
            path = path.slice(0, pos);
        }
        const response = await httpHandler(path.split('/'), req.query, req.method, req.headers, req.body);
        const retcode = response.returnCode;
        res.type(response.contentType).status(retcode).send(response.content);
    };

    const httpHandler = async (path, params, method, headers, body = null) => {
        const enrichedHeaders = { ...headers, '_handler_type': 'express' };
        try {
            if (body !== null) {
                let payload;
                try {
                    payload = JSON.parse(body);
                } catch (e) {
                    payload = body;
                }
                return await target.execute(path, params, method, payload, enrichedHeaders);
            } else {
                return await target.execute(path, params, method, undefined, enrichedHeaders);
            }
        } catch (err) {
            const trace = err.stack.split('\n').slice(1).map(line => line.trim());
            if (err instanceof BaseError) {
                return new ResponseJSON({ status: 'error', type: err.name, message: err.message }).errorCode(err.statusCode);
            }
            const msg = err.message;
            return new ResponseJSON({ status: 'error', error: msg, stack: trace }).errorCode(500);
        }
    }

    dotenv.config();

    const PORT = process.env.PORT || 3001;
    return new Promise((resolve, reject) => {
        const server = app.listen(PORT, () => {
            const host = `http://localhost:${PORT}/`;
            console.log(`Express server running on ${host}`);

            for (const targetKey of Object.keys(target.schema)) {
                const t = target.schema[targetKey];
                if (t.api) console.log(`For ${t.tag} API\tgo to  ${host}docs/?root=${targetKey}`);
            }

            resolve(server);
        });
        server.on('error', reject);
    });
};