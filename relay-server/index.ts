/// <reference types="@types/node" />

import "dotenv/config";

import { RealtimeClient } from "openai-realtime-api";
import { RealtimeRelay } from "./RealtimeRelay";

const { SERVER_OPENAI_API_KEY, VITE_RELAY_PORT } = process.env;

if (!SERVER_OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API Key");
}

const port = VITE_RELAY_PORT ? parseInt(VITE_RELAY_PORT) : undefined;
if (!port || isNaN(port)) {
  throw new Error("Missing port");
}

const realtimeClient = new RealtimeClient({
  debug: false,
  relay: true,
  apiKey: SERVER_OPENAI_API_KEY,
});

const relay = new RealtimeRelay({ client: realtimeClient });
relay.listen(port);
