const { VITE_RELAY_PORT } = import.meta.env;

export const relayUrl = `ws://localhost:${VITE_RELAY_PORT}`;

export const instructions = `You are a helpful agent.`;

export const sampleRate = 24000;

export const unloggedEventTypes = [
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
