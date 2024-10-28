import type { IncomingMessage } from "node:http";

import { type WebSocket, WebSocketServer } from "ws";

import {
  RealtimeClient,
  RealtimeClientEvents,
  assert,
} from "openai-realtime-api";

export class RealtimeRelay {
  readonly client: RealtimeClient;
  wss?: WebSocketServer;

  constructor({ client }: { client: RealtimeClient }) {
    assert(
      client.relay,
      'RealtimeRelay client must have the "relay" option set'
    );
    assert(
      client.realtime.apiKey,
      "RealtimeRelay client must have an API key set"
    );

    this.client = client;
  }

  listen(port?: number) {
    assert(!this.wss, "RealtimeRelay is already listening");

    if (!port) {
      throw new Error("Port is required");
    }

    this.wss = new WebSocketServer({ port });
    this.wss.on("connection", this._connectionHandler.bind(this));

    this._info(`Listening on ws://localhost:${port}`);
  }

  close() {
    this.wss?.close();
    this.wss = undefined;
  }

  protected async _connectionHandler(ws: WebSocket, req: IncomingMessage) {
    // Relay: OpenAI server events -> browser
    this.client.realtime.on("server.*", (event) => {
      this._debug(`Relaying "${event.type}" to client`);
      ws.send(JSON.stringify(event));
    });
    this.client.realtime.on("close", () => ws.close());

    // Relay: browser events -> OpenAI server
    // We need to queue data waiting for the OpenAI connection
    const messageQueue: string[] = [];
    const messageHandler = (data: string) => {
      try {
        const event = JSON.parse(data) as RealtimeClientEvents.ClientEvent;
        this._debug(`Relaying "${event.type}" to server`);
        this.client.realtime.send(event.type, event);
      } catch (err: any) {
        this._error(`Error parsing event from client: ${data}`, err.message);
      }
    };

    ws.on("message", (data) => {
      if (!this.client.isConnected) {
        messageQueue.push(data.toString());
      } else {
        messageHandler(data.toString());
      }
    });
    ws.on("close", () => this.client.disconnect());

    try {
      this._info("Connecting to server...", this.client.realtime.url);
      await this.client.connect();
    } catch (err: any) {
      this._error("Error connecting to server", err.message);
      ws.close();
      return;
    }

    this._info("Connected to server successfully", this.client.realtime.url);
    while (messageQueue.length) {
      messageHandler(messageQueue.shift()!);
    }
  }

  protected _info(...args: any[]) {
    console.log("[RealtimeRelay]", ...args);
  }

  protected _debug(...args: any[]) {
    if (this.client.realtime.debug) {
      console.log("[RealtimeRelay]", ...args);
    }
  }

  protected _error(...args: any[]) {
    console.error("[RealtimeRelay]", ...args);
  }
}
