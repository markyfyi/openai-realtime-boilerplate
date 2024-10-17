import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { WavRecorder, WavStreamPlayer } from "./wav";
import { App } from "./App";
import { RealtimeClient } from "@openai/realtime-api-beta";
import { instructions, relayUrl } from "./config";
import { unloggedEventTypes, sampleRate } from "./config";

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
    turn_detection: {
      type: "server_vad",
    },
    instructions,
  });

  realtimeClient.addTool(
    {
      name: "get_current_date_and_time",
      parameters: {},
      description: "Gets the current date and time.",
    },
    () => "current date and time:" + new Date().toLocaleString()
  );

  realtimeClient.on("conversation.interrupted", onAiInterrupted);
  realtimeClient.on("conversation.updated", onAiUpdated);
  realtimeClient.on("realtime.event", logEvent);
  realtimeClient.on("error", onAiError);

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

async function onAiUpdated({ item, delta }: any) {
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

async function onAiInterrupted() {
  const trackSampleOffset = await wavStreamPlayer.interrupt();
  if (trackSampleOffset?.trackId) {
    const { trackId, offset } = trackSampleOffset;
    await realtimeClient.cancelResponse(trackId, offset);
  }
}

function onAiError(event: any) {
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

  if (unloggedEventTypes.includes(type)) return;

  console.log(type, event);
}

// types

interface RealtimeEvent {
  time: string;
  source: "client" | "server";
  count?: number;
  event: { [key: string]: any };
}
