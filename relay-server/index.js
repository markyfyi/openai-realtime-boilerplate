/// <reference types="@types/node" />

import "dotenv/config";
import { RealtimeRelay } from "./relay.js";

const { SERVER_OPENAI_API_KEY, VITE_RELAY_PORT } = process.env;

if (!SERVER_OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API Key");
}

const relay = new RealtimeRelay(SERVER_OPENAI_API_KEY);
relay.listen(VITE_RELAY_PORT);
