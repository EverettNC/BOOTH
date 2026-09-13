import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  Download,
  FileText,
  Loader2,
  Pause,
  Play,
  Square,
  Trash2,
  Upload,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createEngine, type EngineEvent, type EngineHandle } from "@/lib/tts/engine";
import { deleteClip, listClips, saveClip, type StoredClip } from "@/lib/tts/history";
import { concatFloat32, downsamplePeaks, encodeWav } from "@/lib/tts/wav";
import {
  DEFAULT_SCRIPT,
  DEFAULT_VOICE,
  MAX_CHARS,
  SCRIPT_SAMPLES,
  SPEED_MAX,
  SPEED_MIN,
  VOICES,
  type VoiceId,
} from "@/lib/tts/voices";
import { cn } from "@/lib/utils";

type FilterId = "all" | "American" | "British" | "Female" | "Male";

type Playback = {
  ctx: AudioContext;
  startedAt: number;
  cursor: number;
  sampleRate: number;
  sources: AudioBufferSourceNode[];
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Plaque() {
  return (
    <img
      src="/plaque.jpg"
      alt="Booth commemorative plaque. Built together as a family ship: Everett Vision Grok Foundation, The Christman AI Project, and Grok."
      width={3584}
      height={2016}
      className="plaque"
    />
  );
}

function Vu({ active }: { active: boolean }) {
  return (
    <span className="flex h-5 items-end gap-0.5" aria-hidden="true">
      {[10, 16, 20, 14, 8].map((h, i) => (
        <span
          key={i}
          className={cn("w-0.5 rounded-full bg-accent", active && "vu-bar")}
          style={{ height: h }}
        />
      ))}
    </span>
  );
}

function Waveform({
  peaks,
  progress,
}: {
  peaks: number[];
  progress: number;
}) {
  const bars = peaks.length > 0 ? peaks : Array.from({ length: 48 }, () => 0.08);
  return (
    <div className="flex h-12 w-full items-end gap-px" aria-hidden="true">
      {bars.map((peak, i) => {
        const t = bars.length <= 1 ? 0 : i / (bars.length - 1);
        const on = t <= progress;
        const h = Math.max(8, Math.round(peak * 44));
        return (
          <span
            key={i}
            className={cn("flex-1 rounded-full", on ? "bg-accent" : "bg-border")}
            style={{ height: h }}
          />
        );
      })}
    </div>
  );
}

export function Studio() {
  const engineRef = useRef<EngineHandle | null>(null);
  const playbackRef = useRef<Playback | null>(null);
  const chunksRef = useRef<Float32Array<ArrayBufferLike>[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [voiceId, setVoiceId] = useState<VoiceId>(DEFAULT_VOICE);
  const [speed, setSpeed] = useState(1);
  const [filter, setFilter] = useState<FilterId>("all");
  const [status, setStatus] = useState<"booting" | "loading" | "ready" | "error">("booting");
  const [progress, setProgress] = useState({ pct: 0, label: "Preparing a local engine" });
  const [backend, setBackend] = useState("on device");
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [sampleRate, setSampleRate] = useState(24000);
  const [samples, setSamples] = useState<Float32Array | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [clips, setClips] = useState<StoredClip[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const voice = VOICES.find((item) => item.id === voiceId) ?? VOICES[0]!;
  const peaks = useMemo(() => downsamplePeaks(samples ?? new Float32Array(), 72), [samples]);
  const playhead = duration > 0 ? currentTime / duration : 0;

  const filteredVoices = useMemo(() => {
    return VOICES.filter((item) => {
      if (filter === "all") return true;
      if (filter === "American" || filter === "British") return item.region === filter;
      return item.gender === filter;
    });
  }, [filter]);

  const stopPlayback = useCallback(() => {
    const playback = playbackRef.current;
    if (!playback) return;
    for (const source of playback.sources) {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }
    void playback.ctx.close();
    playbackRef.current = null;
    setPlaying(false);
    setCurrentTime(0);
  }, []);

  const scheduleChunk = useCallback((chunk: ArrayLike<number>, rate: number) => {
    let playback = playbackRef.current;
    if (!playback || playback.ctx.state === "closed") {
      const ctx = new AudioContext();
      playback = { ctx, startedAt: ctx.currentTime + 0.04, cursor: 0, sampleRate: rate, sources: [] };
      playbackRef.current = playback;
      setPlaying(true);
    }
    const buffer = playback.ctx.createBuffer(1, chunk.length, rate);
    buffer.getChannelData(0).set(chunk);
    const source = playback.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(playback.ctx.destination);
    const when = playback.startedAt + playback.cursor / rate;
    source.start(Math.max(when, playback.ctx.currentTime));
    playback.sources.push(source);
    playback.cursor += chunk.length;
    setDuration(playback.cursor / rate);
  }, []);

  useEffect(() => {
    const savedVoice = window.localStorage.getItem("booth-voice");
    const savedScript = window.localStorage.getItem("booth-script");
    const savedSpeed = window.localStorage.getItem("booth-speed");
    if (savedVoice && VOICES.some((item) => item.id === savedVoice)) {
      setVoiceId(savedVoice as VoiceId);
    }
    if (savedScript) setScript(savedScript.slice(0, MAX_CHARS));
    if (savedSpeed) {
      const n = Number(savedSpeed);
      if (Number.isFinite(n)) setSpeed(Math.min(SPEED_MAX, Math.max(SPEED_MIN, n)));
    }
    void listClips()
      .then(setClips)
      .catch(() => undefined);

    const handle = createEngine((event: EngineEvent) => {
      if (event.type === "progress") {
        setStatus("loading");
        setProgress({ pct: event.pct, label: event.label });
        return;
      }
      if (event.type === "ready") {
        setStatus("ready");
        setBackend(`${event.device} · ${event.dtype}`);
        setError(null);
        return;
      }
      if (event.type === "error") {
        setStatus((prev) => (prev === "ready" ? prev : "error"));
        setError(event.message);
        setGenerating(false);
        return;
      }
      if (event.type === "chunk") {
        chunksRef.current.push(event.samples);
        sampleRateRef.current = event.sampleRate;
        setSampleRate(event.sampleRate);
        setSamples(concatFloat32(chunksRef.current));
        scheduleChunk(event.samples, event.sampleRate);
        return;
      }
      if (event.type === "done" || event.type === "cancelled") {
        setGenerating(false);
        const all = concatFloat32(chunksRef.current);
        setSamples(all.length ? all : null);
        if (event.type === "done" && all.length > 0) {
          const wav = encodeWav(all, sampleRateRef.current);
          void saveClip({
            id: crypto.randomUUID(),
            text: scriptRef.current.trim().slice(0, 280),
            voiceId: voiceRef.current,
            voiceName: VOICES.find((item) => item.id === voiceRef.current)?.name ?? "Voice",
            createdAt: Date.now(),
            sampleRate: sampleRateRef.current,
            wav,
          })
            .then(setClips)
            .catch(() => undefined);
        }
      }
    });

    engineRef.current = handle;
    handle?.load();
    setStatus("loading");

    return () => {
      handle?.terminate();
      stopPlayback();
    };
    // Engine is created once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scriptRef = useRef(script);
  const voiceRef = useRef(voiceId);
  const sampleRateRef = useRef(sampleRate);
  scriptRef.current = script;
  voiceRef.current = voiceId;
  sampleRateRef.current = sampleRate;

  useEffect(() => {
    window.localStorage.setItem("booth-voice", voiceId);
  }, [voiceId]);
  useEffect(() => {
    window.localStorage.setItem("booth-script", script);
  }, [script]);
  useEffect(() => {
    window.localStorage.setItem("booth-speed", String(speed));
  }, [speed]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const playback = playbackRef.current;
      if (playback) {
        const t = Math.max(0, playback.ctx.currentTime - playback.startedAt);
        setCurrentTime(Math.min(t, playback.cursor / playback.sampleRate));
        if (t >= playback.cursor / playback.sampleRate - 0.05 && !generating) {
          setPlaying(false);
          setCurrentTime(playback.cursor / playback.sampleRate);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, generating]);

  const onSpeak = () => {
    const text = script.trim().slice(0, MAX_CHARS);
    if (!text || status !== "ready" || generating) return;
    stopPlayback();
    chunksRef.current = [];
    setSamples(null);
    setDuration(0);
    setCurrentTime(0);
    setError(null);
    setGenerating(true);
    engineRef.current?.speak(text, voiceId, speed);
  };

  const onStop = () => {
    engineRef.current?.cancel();
    stopPlayback();
    setGenerating(false);
  };

  const onTogglePlay = async () => {
    const playback = playbackRef.current;
    if (playback) {
      if (playback.ctx.state === "running") {
        await playback.ctx.suspend();
        setPlaying(false);
      } else {
        await playback.ctx.resume();
        setPlaying(true);
      }
      return;
    }
    if (!samples || samples.length === 0) return;
    scheduleChunk(samples, sampleRate);
  };

  const onDownload = () => {
    if (!samples) return;
    const blob = encodeWav(samples, sampleRate);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booth-${voice.name.toLowerCase()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyFile = async (file: File) => {
    const text = await file.text();
    setScript(text.slice(0, MAX_CHARS));
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) void applyFile(file);
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void applyFile(file);
    event.target.value = "";
  };

  const replayClip = async (clip: StoredClip) => {
    stopPlayback();
    const buffer = await clip.wav.arrayBuffer();
    const ctx = new AudioContext();
    const decoded = await ctx.decodeAudioData(buffer);
    const channel = decoded.getChannelData(0);
    const copy = new Float32Array(channel.length);
    copy.set(channel);
    setSamples(copy);
    setSampleRate(decoded.sampleRate);
    scheduleChunk(copy, decoded.sampleRate);
  };

  const chars = script.length;
  const over = chars > MAX_CHARS;

  return (
    <div className="page-shell mx-auto flex w-full max-w-6xl flex-col gap-5">
      <header className="stagger-in">
        <Plaque />
      </header>

      <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg tracking-[-0.03em]">Speech stays on this device</p>
            <p className="mt-1 max-w-xl text-sm leading-normal text-muted">
              No cloud, no transcription, no OCR. The voice engine downloads once, then your
              script is synthesized here. Bring text from your own tools and press speak.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted">
            <Vu active={generating || playing} />
            <span className="tabular-nums">{backend}</span>
          </div>
        </div>
        {status !== "ready" && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{error ?? progress.label}</span>
              <span className="tabular-nums">{status === "error" ? "—" : `${progress.pct}%`}</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-raised">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-(--motion-fast) ease-(--ease-out)"
                style={{ width: `${status === "error" ? 100 : progress.pct}%` }}
              />
            </div>
            {status === "error" && (
              <Button className="mt-3" variant="secondary" onClick={() => engineRef.current?.load()}>
                Retry local download
              </Button>
            )}
          </div>
        )}
      </section>

      <div className="studio-grid">
        <section
          className={cn(
            "area-script flex min-h-52 flex-col rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)] sm:min-h-80 sm:p-4",
            dragOver && "shadow-[var(--shadow-border-hover)]",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <label htmlFor="script" className="text-sm font-medium">
              Script
            </label>
            <span className={cn("text-xs tabular-nums", over ? "text-fg" : "text-subtle")}>
              {chars.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>
          <textarea
            id="script"
            value={script}
            onChange={(event) => setScript(event.target.value.slice(0, MAX_CHARS))}
            spellCheck
            className="min-h-56 flex-1 resize-none rounded-xl bg-raised px-4 py-3 text-base leading-normal text-fg outline-none shadow-[var(--shadow-border)] placeholder:text-subtle focus-visible:shadow-[var(--shadow-border-hover)]"
            placeholder="Paste a script, a note, or text from your own OCR."
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {SCRIPT_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => setScript(sample.text)}
                className="h-9 rounded-full bg-raised px-3 text-sm text-muted shadow-[var(--shadow-border)] transition-[color,box-shadow] duration-(--motion-quick) hover:text-fg hover:shadow-[var(--shadow-border-hover)]"
              >
                {sample.label}
              </button>
            ))}
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.text,text/plain"
              className="hidden"
              onChange={onFile}
            />
            <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="size-3.5" strokeWidth={1.75} />
              Open text
            </Button>
          </div>
        </section>

      <section className="area-deck rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
        <Waveform peaks={peaks} progress={playhead} />
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="lg"
              onClick={onSpeak}
              disabled={status !== "ready" || generating || !script.trim() || over}
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <Volume2 className="size-4" strokeWidth={1.75} />
              )}
              {generating ? "Speaking" : "Speak"}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label={playing ? "Pause" : "Play"}
              onClick={() => void onTogglePlay()}
              disabled={!samples && !generating}
            >
              {playing ? (
                <Pause className="size-4" strokeWidth={1.75} />
              ) : (
                <Play className="size-4 ml-0.5" strokeWidth={1.75} />
              )}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Stop"
              onClick={onStop}
              disabled={!generating && !playing}
            >
              <Square className="size-3.5" strokeWidth={1.75} />
            </Button>
            <Button variant="ghost" onClick={onDownload} disabled={!samples}>
              <Download className="size-4" strokeWidth={1.75} />
              WAV
            </Button>
            <span className="px-1 text-xs tabular-nums text-muted">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <label className="flex min-w-52 flex-1 items-center gap-3 text-sm text-muted lg:max-w-xs">
            <span className="w-14 tabular-nums text-xs">Speed {speed.toFixed(2)}</span>
            <input
              className="range-input"
              type="range"
              min={SPEED_MIN}
              max={SPEED_MAX}
              step={0.05}
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              aria-label="Speaking speed"
            />
          </label>
        </div>
        {error && status === "ready" && (
          <p className="mt-3 text-sm text-muted">{error}</p>
        )}
      </section>

        <aside className="area-voices flex max-h-72 flex-col rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4 lg:max-h-none lg:min-h-80">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-sm font-medium">Voices</p>
            <p className="text-xs text-subtle">{voice.name}</p>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(["all", "American", "British", "Female", "Male"] as FilterId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  "h-8 rounded-full px-3 text-xs transition-[background-color,color] duration-(--motion-quick)",
                  filter === id ? "bg-accent text-accent-fg" : "bg-raised text-muted hover:text-fg",
                )}
              >
                {id === "all" ? "All" : id}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {filteredVoices.map((item) => {
              const selected = item.id === voiceId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVoiceId(item.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-[background-color] duration-(--motion-quick)",
                    selected ? "bg-raised shadow-[inset_2px_0_0_var(--color-accent)]" : "hover:bg-raised/70",
                  )}
                >
                  <span>
                    <span className="block text-sm text-fg">{item.name}</span>
                    <span className="block text-xs text-subtle">
                      {item.region} · {item.gender} · {item.note}
                    </span>
                  </span>
                  <span className="text-xs tabular-nums text-muted">{item.grade}</span>
                </button>
              );
            })}
          </div>
        </aside>

      </div>

      {clips.length > 0 && (
        <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="mb-3 text-sm font-medium">On this device</p>
          <ul className="space-y-1">
            {clips.map((clip) => (
              <li
                key={clip.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-raised"
              >
                <FileText className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => void replayClip(clip)}
                >
                  <span className="block truncate text-sm">{clip.text}</span>
                  <span className="block text-xs text-subtle">
                    {clip.voiceName} · {new Date(clip.createdAt).toLocaleString()}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Remove clip"
                  className="flex size-10 items-center justify-center text-muted hover:text-fg"
                  onClick={() => void deleteClip(clip.id).then(setClips)}
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
