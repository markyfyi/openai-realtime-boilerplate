import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { WavRecorder, WavStreamPlayer } from "./wav";
import { App } from "./App";
import {
  RealtimeClient,
  RealtimeCustomEvents,
  RealtimeEvent,
  RealtimeServerEvents,
} from "openai-realtime-api";

const relayUrl = `ws://localhost:${import.meta.env.VITE_RELAY_PORT}`;
const sampleRate = 24000;

const noLogEventTypes = [
  "session.update",
  "session.updated",
  "input_audio_buffer.append",
  "response.audio.delta",
  "response.audio_transcript.delta",
  "input_audio_buffer.speech_started",
  "input_audio_buffer.committed",
  "response.audio_transcript.delta",
  "response.audio_transcript.done",
  "response.function_call_arguments.delta",
  "response.content_part.done",
  "input_audio_buffer.speech_stopped",
  "rate_limits.updated",
];

const instructions = `
You are a conversational assistant.
`.trim();

// resources
const reactRoot = createRoot(document.getElementById("root")!);
const wavRecorder = new WavRecorder({ sampleRate });
const wavStreamPlayer = new WavStreamPlayer({ sampleRate });
const realtimeClient = new RealtimeClient({
  url: relayUrl,
});

// state
let isActive = false;

// let's go!
init();

function init() {
  render("💤");

  realtimeClient.updateSession({
    instructions,
    turn_detection: {
      type: "server_vad",
    },
  });

  realtimeClient.on("conversation.interrupted", (e) => onAiInterrupted(e));
  realtimeClient.on("conversation.updated", (e) => onAiUpdated(e));
  realtimeClient.on("realtime.event", (e) => logEvent(e));
  realtimeClient.on("error", (e) => onAiError(e));

  document.addEventListener("click", toggleActive);
}

function toggleActive() {
  if (isActive) {
    stop();
    isActive = false;
  } else {
    start();
    isActive = true;
  }
}

async function start() {
  render("⏳");

  await realtimeClient.connect();
  await wavRecorder.begin();
  await wavStreamPlayer.connect();

  render("🤖");

  await wavRecorder.record((data) => {
    return realtimeClient.appendInputAudio(data.mono);
  });
}

async function stop() {
  render("💤");

  await Promise.all([
    realtimeClient.disconnect(),
    wavRecorder.end(),
    wavStreamPlayer.interrupt(),
  ]);
}

async function onAiUpdated({
  item,
  delta,
  type,
}: RealtimeCustomEvents.ConversationUpdatedEvent) {
  if (delta?.audio) {
    wavStreamPlayer.add16BitPCM(delta.audio, item.id);
  }

  if (item.status === "completed" && item.formatted.audio?.length) {
    const wavFile = await WavRecorder.decode(
      item.formatted.audio,
      24000,
      24000
    );

    item.formatted.file = wavFile;
  }
}

async function onAiInterrupted(
  e: RealtimeCustomEvents.ConversationInterruptedEvent
) {
  const trackSampleOffset = await wavStreamPlayer.interrupt();
  if (trackSampleOffset?.trackId) {
    const { trackId, offset } = trackSampleOffset;
    await realtimeClient.cancelResponse(trackId, offset);
  }
}

function onAiError(event: RealtimeServerEvents.ErrorEvent) {
  console.error(event);
}

function render(content: string) {
  reactRoot.render(
    <StrictMode>
      <App content={content} />
    </StrictMode>
  );
}

function logEvent(e: RealtimeEvent) {
  if (!e.event) return;
  const event = e.event;
  const type = e.event.type;

  if (noLogEventTypes.includes(type)) return;

  console.log(type, event);
}
