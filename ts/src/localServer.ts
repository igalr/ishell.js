import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import type { Request, Response as ExpressResponse } from "express";
import path from "path";
import { BaseError } from "./errors.js";
import { ResponseJSON } from "./response.js";
import type { Response } from "./response.js";
import type { APIInterface } from "./API.js";
import http from "http";

export const localServer = (target: APIInterface): Promise<http.Server> => {
  const app = express();

  app.use(express.json());
  app.use(cors());

  app.use(
    "/docs",
    express.static(
      path.join(process.cwd(), "node_modules/redleaf-ishell/swagger"),
    ),
  );

  const serveMethod = async (
    req: Request,
    res: ExpressResponse,
  ): Promise<void> => {
    let reqPath = req.path;
    if (reqPath.startsWith("/")) reqPath = reqPath.slice(1);
    if (reqPath.endsWith("/")) reqPath = reqPath.slice(0, -1);
    const pos = reqPath.lastIndexOf(".");
    if (pos > 0) reqPath = reqPath.slice(0, pos);
    const response = await httpHandler(
      reqPath.split("/"),
      req.query as Record<string, string>,
      req.method,
      req.headers as Record<string, string>,
      req.body as string,
    );
    if (response.contentType !== null) {
      res.type(response.contentType);
    }
    res
      .status(response.returnCode)
      .send(response.content);
  };

  const httpHandler = async (
    pathSegments: string[],
    params: Record<string, string | number | boolean>,
    method: string,
    headers: Record<string, string>,
    body: any = null,
  ): Promise<Response> => {
    const enrichedHeaders = { ...headers, _handler_type: "express" };
    try {
      if (body !== null) {
        let payload: object;
        try {
          payload = body instanceof Object? body: JSON.parse(body);
        } catch (e) {
          console.error("Invalid JSON body:", body);
          throw e;
        }
        return await target.execute(
          pathSegments,
          params,
          method,
          payload,
          enrichedHeaders,
        );
      } else {
        return await target.execute(
          pathSegments,
          params,
          method,
          null,
          enrichedHeaders,
        );
      }
    } catch (err) {
      const trace = (err as Error).stack
        ?.split("\n")
        .slice(1)
        .map((line) => line.trim());
      if (err instanceof BaseError) {
        return new ResponseJSON(err.toJSON()).errorCode(err.statusCode);
      }
      return new ResponseJSON({
        status: "error",
        error: (err as Error).message,
        stack: trace,
      }).errorCode(500);
    }
  };

  app.get("/{*path}", (req, res) => {
    void serveMethod(req, res);
  });
  app.post("/{*path}", (req, res) => {
    void serveMethod(req, res);
  });
  app.put("/{*path}", (req, res) => {
    void serveMethod(req, res);
  });
  app.patch("/{*path}", (req, res) => {
    void serveMethod(req, res);
  });
  app.delete("/{*path}", (req, res) => {
    void serveMethod(req, res);
  });

  dotenv.config();

  const PORT = parseInt(process.env.PORT || "3001", 10);
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      const host = `http://localhost:${PORT}/`;
      console.log(`Express server running on ${host}`);
      for (const [key, t] of Object.entries(target.schema)) {
        if (t.api)
          console.log(`For ${t.tag} API\tgo to  ${host}docs/?root=${key}`);
      }
      resolve(server);
    });
    server.on("error", reject);
  });
};
