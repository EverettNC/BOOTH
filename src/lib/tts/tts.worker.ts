/// <reference lib="webworker" />

import { KokoroTTS } from "kokoro-js";

type InMsg =
  | { type: "load" }
  | { type: "speak"; id: number; text: string; voice: string; speed: number }
  | { type: "cancel" };

type Backend = {
  device: "wasm" | "webgpu";
  dtype: "fp32" | "q8" | "q4";
};

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

let tts: KokoroTTS | null = null;
let backend: Backend | null = null;
let activeId = 0;
let loading = false;

function post(data: Record<string, unknown>, transfer?: Transferable[]) {
  if (transfer && transfer.length > 0) {
    self.postMessage(data, transfer);
  } else {
    self.postMessage(data);
  }
}

async function pickBackends(): Promise<Backend[]> {
  const order: Backend[] = [];
  try {
    const gpu = (self.navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
    if (gpu) {
      const adapter = await gpu.requestAdapter();
      if (adapter) order.push({ device: "webgpu", dtype: "fp32" });
    }
  } catch {
    // WebGPU unavailable
  }
  const memory = (self.navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === "number" && memory <= 4) {
    order.push({ device: "wasm", dtype: "q4" });
    order.push({ device: "wasm", dtype: "q8" });
  } else {
    order.push({ device: "wasm", dtype: "q8" });
    order.push({ device: "wasm", dtype: "q4" });
  }
  return order;
}

async function loadModel() {
  if (tts) {
    post({ type: "ready", device: backend?.device ?? "wasm", dtype: backend?.dtype ?? "q8" });
    return;
  }
  if (loading) return;
  loading = true;

  const attempts = await pickBackends();
  let lastError: unknown;

  for (const attempt of attempts) {
    try {
      post({
        type: "progress",
        pct: 4,
        label: `Loading ${attempt.device.toUpperCase()} · ${attempt.dtype}`,
      });
      const model = await KokoroTTS.from_pretrained(MODEL_ID, {
        device: attempt.device,
        dtype: attempt.dtype,
        progress_callback: (info) => {
          if (info.status === "progress" && info.total) {
            const pct = Math.max(4, Math.min(96, Math.round((info.loaded / info.total) * 100)));
            const file = info.file ? String(info.file).split("/").pop() : "model";
            post({ type: "progress", pct, label: `Saving ${file} on this device` });
          } else if (info.status === "initiate") {
            post({ type: "progress", pct: 8, label: "Starting local download" });
          }
        },
      });
      tts = model;
      backend = attempt;
      post({ type: "ready", device: attempt.device, dtype: attempt.dtype });
      loading = false;
      return;
    } catch (error) {
      lastError = error;
    }
  }

  loading = false;
  const message =
    lastError instanceof Error
      ? lastError.message
      : "Could not load the speech model onto this device.";
  post({ type: "error", message });
}

async function speak(id: number, text: string, voice: string, speed: number) {
  if (!tts) {
    post({ type: "error", message: "The speech engine is not ready yet." });
    return;
  }
  activeId = id;
  const clipped = text.trim();
  if (!clipped) {
    post({ type: "done", id });
    return;
  }

  try {
    const stream = tts.stream(clipped, { voice: voice as never, speed });
    for await (const part of stream) {
      if (activeId !== id) {
        post({ type: "cancelled", id });
        return;
      }
      const source = part.audio.audio;
      const samples = new Float32Array(source.length);
      samples.set(source);
      post(
        {
          type: "chunk",
          id,
          samples,
          sampleRate: part.audio.sampling_rate,
          text: part.text,
        },
        [samples.buffer],
      );
    }
    if (activeId === id) post({ type: "done", id });
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
    void loadModel();
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
