export type EngineStatus = "idle" | "loading" | "ready" | "error";

export type EngineEvent =
  | { type: "progress"; pct: number; label: string }
  | { type: "ready"; device: string; dtype: string }
  | { type: "error"; message: string }
  | { type: "chunk"; id: number; samples: Float32Array<ArrayBufferLike>; sampleRate: number; text: string }
  | { type: "done"; id: number }
  | { type: "cancelled"; id: number };

export type EngineHandle = {
  load: () => void;
  speak: (text: string, voice: string, speed: number) => number;
  cancel: () => void;
  terminate: () => void;
};

let nextSpeakId = 1;

export function createEngine(onEvent: (event: EngineEvent) => void): EngineHandle | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;

  const worker = new Worker(new URL("./tts.worker.ts", import.meta.url), {
    type: "module",
    name: "booth-tts",
  });

  worker.onmessage = (event: MessageEvent<EngineEvent>) => {
    onEvent(event.data);
  };

  worker.onerror = (event) => {
    onEvent({
      type: "error",
      message: event.message || "The local speech engine failed to start.",
    });
  };

  return {
    load: () => worker.postMessage({ type: "load" }),
    speak: (text, voice, speed) => {
      const id = nextSpeakId++;
      worker.postMessage({ type: "speak", id, text, voice, speed });
      return id;
    },
    cancel: () => worker.postMessage({ type: "cancel" }),
    terminate: () => worker.terminate(),
  };
}
