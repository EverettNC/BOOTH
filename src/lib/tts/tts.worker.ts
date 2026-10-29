/// <reference lib="webworker" />

import { SAMPLE_RATE, splitIntoClauses, synthesizeSpeech } from "./synth";

type InMsg =
  | { type: "load" }
  | { type: "speak"; id: number; text: string; voice: string; speed: number }
  | { type: "cancel" };

let activeId = 0;
let ready = false;

function post(data: Record<string, unknown>, transfer?: Transferable[]) {
  if (transfer && transfer.length > 0) {
    self.postMessage(data, transfer);
  } else {
    self.postMessage(data);
  }
}

function loadEngine() {
  if (!ready) {
    post({ type: "progress", pct: 100, label: "On-device engine ready" });
    ready = true;
  }
  post({ type: "ready", device: "on-device", dtype: "pcm24k" });
}

async function speak(id: number, text: string, voice: string, speed: number) {
  if (!ready) {
    loadEngine();
  }
  activeId = id;
  const clauses = splitIntoClauses(text);
  if (clauses.length === 0) {
    post({ type: "done", id });
    return;
  }

  try {
    for (const clause of clauses) {
      if (activeId !== id) {
        post({ type: "cancelled", id });
        return;
      }
      const samples = synthesizeSpeech(clause, voice, speed, SAMPLE_RATE);
      if (samples.length > 0) {
        post(
          {
            type: "chunk",
            id,
            samples,
            sampleRate: SAMPLE_RATE,
            text: clause,
          },
          [samples.buffer],
        );
      }
      // Yield briefly between clauses so cancel messages can be processed
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (activeId === id) {
      post({ type: "done", id });
    }
  } catch (error) {
    if (activeId !== id) {
      post({ type: "cancelled", id });
      return;
    }
    const message = error instanceof Error ? error.message : "Speech generation failed.";
    post({ type: "error", message });
  }
}

self.onmessage = (event: MessageEvent<InMsg>) => {
  const msg = event.data;
  if (msg.type === "load") {
    loadEngine();
    return;
  }
  if (msg.type === "cancel") {
    activeId = 0;
    return;
  }
  if (msg.type === "speak") {
    void speak(msg.id, msg.text, msg.voice, msg.speed);
  }
};
