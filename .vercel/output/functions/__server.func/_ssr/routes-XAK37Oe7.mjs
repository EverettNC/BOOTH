import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Square, c as Pause, d as Download, i as Trash2, l as LoaderCircle, n as Upload, o as ShieldCheck, s as Play, t as Volume2, u as FileText } from "../_libs/lucide-react.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-XAK37Oe7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 font-medium select-none whitespace-nowrap rounded-md outline-none transition-[background-color,color,box-shadow,opacity,transform] duration-(--motion-quick) ease-(--ease-out) focus-visible:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			primary: "bg-accent text-accent-fg hover:bg-fg",
			secondary: "bg-raised text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
			ghost: "bg-transparent text-muted hover:bg-raised hover:text-fg",
			danger: "bg-raised text-fg hover:text-fg"
		},
		size: {
			md: "h-11 px-4 text-sm",
			lg: "h-12 px-5 text-sm",
			icon: "size-11 px-0",
			sm: "h-9 px-3 text-sm"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
var nextSpeakId = 1;
function createEngine(onEvent) {
	if (typeof window === "undefined" || typeof Worker === "undefined") return null;
	const worker = new Worker(new URL("./tts.worker.ts", import.meta.url), {
		type: "module",
		name: "booth-tts"
	});
	worker.onmessage = (event) => {
		onEvent(event.data);
	};
	worker.onerror = (event) => {
		onEvent({
			type: "error",
			message: event.message || "The local speech engine failed to start."
		});
	};
	return {
		load: () => worker.postMessage({ type: "load" }),
		speak: (text, voice, speed) => {
			const id = nextSpeakId++;
			worker.postMessage({
				type: "speak",
				id,
				text,
				voice,
				speed
			});
			return id;
		},
		cancel: () => worker.postMessage({ type: "cancel" }),
		terminate: () => worker.terminate()
	};
}
var DB_NAME = "booth-clips";
var STORE = "clips";
var MAX_CLIPS = 12;
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
async function listClips() {
	if (typeof indexedDB === "undefined") return [];
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
		req.onsuccess = () => {
			resolve(req.result.sort((a, b) => b.createdAt - a.createdAt));
		};
		req.onerror = () => reject(req.error);
	});
}
async function saveClip(clip) {
	const next = [clip, ...(await listClips()).filter((row) => row.id !== clip.id)].slice(0, MAX_CLIPS);
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		const store = tx.objectStore(STORE);
		store.clear();
		for (const row of next) store.put(row);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
	return next;
}
async function deleteClip(id) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).delete(id);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
	return listClips();
}
function writeString(view, offset, value) {
	for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
}
function concatFloat32(chunks) {
	const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
	const out = new Float32Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		out.set(chunk, offset);
		offset += chunk.length;
	}
	return out;
}
function encodeWav(samples, sampleRate) {
	const bytesPerSample = 2;
	const blockAlign = bytesPerSample;
	const dataSize = samples.length * bytesPerSample;
	const buffer = new ArrayBuffer(44 + dataSize);
	const view = new DataView(buffer);
	writeString(view, 0, "RIFF");
	view.setUint32(4, 36 + dataSize, true);
	writeString(view, 8, "WAVE");
	writeString(view, 12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * blockAlign, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, 16, true);
	writeString(view, 36, "data");
	view.setUint32(40, dataSize, true);
	let offset = 44;
	for (let i = 0; i < samples.length; i++) {
		const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
		view.setInt16(offset, s < 0 ? s * 32768 : s * 32767, true);
		offset += 2;
	}
	return new Blob([buffer], { type: "audio/wav" });
}
function downsamplePeaks(samples, buckets) {
	if (samples.length === 0 || buckets <= 0) return [];
	const peaks = [];
	const step = samples.length / buckets;
	for (let i = 0; i < buckets; i++) {
		const start = Math.floor(i * step);
		const end = Math.min(samples.length, Math.floor((i + 1) * step) || start + 1);
		let max = 0;
		for (let j = start; j < end; j++) {
			const v = Math.abs(samples[j] ?? 0);
			if (v > max) max = v;
		}
		peaks.push(max);
	}
	return peaks;
}
var GRADE_RANK = {
	A: 0,
	"A-": 1,
	"B-": 2,
	"C+": 3,
	C: 4,
	"C-": 5,
	"D+": 6,
	D: 7,
	"D-": 8,
	"F+": 9
};
var VOICES = [
	{
		id: "af_heart",
		name: "Heart",
		region: "American",
		gender: "Female",
		grade: "A",
		note: "Clear, natural lead"
	},
	{
		id: "af_bella",
		name: "Bella",
		region: "American",
		gender: "Female",
		grade: "A-",
		note: "Warm and expressive"
	},
	{
		id: "af_nicole",
		name: "Nicole",
		region: "American",
		gender: "Female",
		grade: "B-",
		note: "Intimate, close-mic"
	},
	{
		id: "bf_emma",
		name: "Emma",
		region: "British",
		gender: "Female",
		grade: "B-",
		note: "Poised narrator"
	},
	{
		id: "af_aoede",
		name: "Aoede",
		region: "American",
		gender: "Female",
		grade: "C+",
		note: "Bright and even"
	},
	{
		id: "af_kore",
		name: "Kore",
		region: "American",
		gender: "Female",
		grade: "C+",
		note: "Soft, measured"
	},
	{
		id: "af_sarah",
		name: "Sarah",
		region: "American",
		gender: "Female",
		grade: "C+",
		note: "Calm reader"
	},
	{
		id: "am_michael",
		name: "Michael",
		region: "American",
		gender: "Male",
		grade: "C+",
		note: "Steady broadcast"
	},
	{
		id: "am_fenrir",
		name: "Fenrir",
		region: "American",
		gender: "Male",
		grade: "C+",
		note: "Low and grounded"
	},
	{
		id: "am_puck",
		name: "Puck",
		region: "American",
		gender: "Male",
		grade: "C+",
		note: "Light, conversational"
	},
	{
		id: "bm_george",
		name: "George",
		region: "British",
		gender: "Male",
		grade: "C",
		note: "Classic reader"
	},
	{
		id: "bm_fable",
		name: "Fable",
		region: "British",
		gender: "Male",
		grade: "C",
		note: "Storyteller"
	},
	{
		id: "bf_isabella",
		name: "Isabella",
		region: "British",
		gender: "Female",
		grade: "C",
		note: "Gentle British"
	},
	{
		id: "af_alloy",
		name: "Alloy",
		region: "American",
		gender: "Female",
		grade: "C",
		note: "Neutral studio"
	},
	{
		id: "af_nova",
		name: "Nova",
		region: "American",
		gender: "Female",
		grade: "C",
		note: "Crisp and quick"
	},
	{
		id: "af_sky",
		name: "Sky",
		region: "American",
		gender: "Female",
		grade: "C-",
		note: "Airy, youthful"
	},
	{
		id: "bm_lewis",
		name: "Lewis",
		region: "British",
		gender: "Male",
		grade: "D+",
		note: "Dry, documentary"
	},
	{
		id: "af_jessica",
		name: "Jessica",
		region: "American",
		gender: "Female",
		grade: "D",
		note: "Casual speech"
	},
	{
		id: "af_river",
		name: "River",
		region: "American",
		gender: "Female",
		grade: "D",
		note: "Low-key"
	},
	{
		id: "am_echo",
		name: "Echo",
		region: "American",
		gender: "Male",
		grade: "D",
		note: "Reserved"
	},
	{
		id: "am_eric",
		name: "Eric",
		region: "American",
		gender: "Male",
		grade: "D",
		note: "Plainspoken"
	},
	{
		id: "am_liam",
		name: "Liam",
		region: "American",
		gender: "Male",
		grade: "D",
		note: "Quiet baritone"
	},
	{
		id: "am_onyx",
		name: "Onyx",
		region: "American",
		gender: "Male",
		grade: "D",
		note: "Darker color"
	},
	{
		id: "bf_alice",
		name: "Alice",
		region: "British",
		gender: "Female",
		grade: "D",
		note: "Soft RP"
	},
	{
		id: "bf_lily",
		name: "Lily",
		region: "British",
		gender: "Female",
		grade: "D",
		note: "Light British"
	},
	{
		id: "bm_daniel",
		name: "Daniel",
		region: "British",
		gender: "Male",
		grade: "D",
		note: "News desk"
	},
	{
		id: "am_santa",
		name: "Santa",
		region: "American",
		gender: "Male",
		grade: "D-",
		note: "Festive character"
	},
	{
		id: "am_adam",
		name: "Adam",
		region: "American",
		gender: "Male",
		grade: "F+",
		note: "Rough take"
	}
].sort((a, b) => (GRADE_RANK[a.grade] ?? 9) - (GRADE_RANK[b.grade] ?? 9));
var DEFAULT_VOICE = "af_heart";
var DEFAULT_SCRIPT = "Booth runs entirely on this device. Nothing you type is sent to a server, a cloud, or a data center. Press speak, and the voice is built here — from the script you already have.";
var SCRIPT_SAMPLES = [
	{
		id: "brief",
		label: "Brief",
		text: "Good evening. The north dock is clear, the night shift is on, and the last crate left at nine. If you need the ledger, it is on the desk by the lamp. That is all."
	},
	{
		id: "letter",
		label: "Letter",
		text: "I walked the long way home so I could finish the thought. The river was still, the shops were closing, and I kept hearing the same sentence in my head: we do the work here, on this machine, and we keep the words."
	},
	{
		id: "lecture",
		label: "Lecture",
		text: "Text-to-speech does not have to leave the room. A small on-device model turns writing into sound on the same computer that holds the file. No account. No upload. The only network trip is the first download of the voice engine, which stays cached after that."
	},
	{
		id: "ad",
		label: "Spot",
		text: "Chamber-quiet audio. Your script, your machine. Booth is a private voice studio for notes, drafts, and anything you are not willing to send out."
	}
];
var MAX_CHARS = 2e3;
var SPEED_MIN = .7;
var SPEED_MAX = 1.35;
function formatTime(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
	return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}
function Mark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "flex size-10 items-center justify-center rounded-lg bg-raised shadow-[var(--shadow-border)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 24 24",
			className: "size-5 text-accent",
			"aria-hidden": "true",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "4",
					y: "11",
					width: "2.5",
					height: "7",
					rx: "1",
					fill: "currentColor"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "8.5",
					y: "6",
					width: "2.5",
					height: "12",
					rx: "1",
					fill: "currentColor"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "13",
					y: "8.5",
					width: "2.5",
					height: "9.5",
					rx: "1",
					fill: "currentColor"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "17.5",
					y: "4",
					width: "2.5",
					height: "14",
					rx: "1",
					fill: "currentColor"
				})
			]
		})
	});
}
function Vu({ active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "flex h-5 items-end gap-0.5",
		"aria-hidden": "true",
		children: [
			10,
			16,
			20,
			14,
			8
		].map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("w-0.5 rounded-full bg-accent", active && "vu-bar"),
			style: { height: h }
		}, i))
	});
}
function Waveform({ peaks, progress }) {
	const bars = peaks.length > 0 ? peaks : Array.from({ length: 48 }, () => .08);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-12 w-full items-end gap-px",
		"aria-hidden": "true",
		children: bars.map((peak, i) => {
			const on = (bars.length <= 1 ? 0 : i / (bars.length - 1)) <= progress;
			const h = Math.max(8, Math.round(peak * 44));
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("flex-1 rounded-full", on ? "bg-accent" : "bg-border"),
				style: { height: h }
			}, i);
		})
	});
}
function Studio() {
	const engineRef = (0, import_react.useRef)(null);
	const playbackRef = (0, import_react.useRef)(null);
	const chunksRef = (0, import_react.useRef)([]);
	const fileRef = (0, import_react.useRef)(null);
	const [script, setScript] = (0, import_react.useState)(DEFAULT_SCRIPT);
	const [voiceId, setVoiceId] = (0, import_react.useState)(DEFAULT_VOICE);
	const [speed, setSpeed] = (0, import_react.useState)(1);
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [status, setStatus] = (0, import_react.useState)("booting");
	const [progress, setProgress] = (0, import_react.useState)({
		pct: 0,
		label: "Preparing a local engine"
	});
	const [backend, setBackend] = (0, import_react.useState)("on device");
	const [error, setError] = (0, import_react.useState)(null);
	const [generating, setGenerating] = (0, import_react.useState)(false);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [sampleRate, setSampleRate] = (0, import_react.useState)(24e3);
	const [samples, setSamples] = (0, import_react.useState)(null);
	const [duration, setDuration] = (0, import_react.useState)(0);
	const [currentTime, setCurrentTime] = (0, import_react.useState)(0);
	const [clips, setClips] = (0, import_react.useState)([]);
	const [dragOver, setDragOver] = (0, import_react.useState)(false);
	const voice = VOICES.find((item) => item.id === voiceId) ?? VOICES[0];
	const peaks = (0, import_react.useMemo)(() => downsamplePeaks(samples ?? /* @__PURE__ */ new Float32Array(), 72), [samples]);
	const playhead = duration > 0 ? currentTime / duration : 0;
	const filteredVoices = (0, import_react.useMemo)(() => {
		return VOICES.filter((item) => {
			if (filter === "all") return true;
			if (filter === "American" || filter === "British") return item.region === filter;
			return item.gender === filter;
		});
	}, [filter]);
	const stopPlayback = (0, import_react.useCallback)(() => {
		const playback = playbackRef.current;
		if (!playback) return;
		for (const source of playback.sources) try {
			source.stop();
		} catch {}
		playback.ctx.close();
		playbackRef.current = null;
		setPlaying(false);
		setCurrentTime(0);
	}, []);
	const scheduleChunk = (0, import_react.useCallback)((chunk, rate) => {
		let playback = playbackRef.current;
		if (!playback || playback.ctx.state === "closed") {
			const ctx = new AudioContext();
			playback = {
				ctx,
				startedAt: ctx.currentTime + .04,
				cursor: 0,
				sampleRate: rate,
				sources: []
			};
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
	(0, import_react.useEffect)(() => {
		const savedVoice = window.localStorage.getItem("booth-voice");
		const savedScript = window.localStorage.getItem("booth-script");
		const savedSpeed = window.localStorage.getItem("booth-speed");
		if (savedVoice && VOICES.some((item) => item.id === savedVoice)) setVoiceId(savedVoice);
		if (savedScript) setScript(savedScript.slice(0, MAX_CHARS));
		if (savedSpeed) {
			const n = Number(savedSpeed);
			if (Number.isFinite(n)) setSpeed(Math.min(SPEED_MAX, Math.max(SPEED_MIN, n)));
		}
		listClips().then(setClips).catch(() => void 0);
		const handle = createEngine((event) => {
			if (event.type === "progress") {
				setStatus("loading");
				setProgress({
					pct: event.pct,
					label: event.label
				});
				return;
			}
			if (event.type === "ready") {
				setStatus("ready");
				setBackend(`${event.device} · ${event.dtype}`);
				setError(null);
				return;
			}
			if (event.type === "error") {
				setStatus((prev) => prev === "ready" ? prev : "error");
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
					saveClip({
						id: crypto.randomUUID(),
						text: scriptRef.current.trim().slice(0, 280),
						voiceId: voiceRef.current,
						voiceName: VOICES.find((item) => item.id === voiceRef.current)?.name ?? "Voice",
						createdAt: Date.now(),
						sampleRate: sampleRateRef.current,
						wav
					}).then(setClips).catch(() => void 0);
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
	}, []);
	const scriptRef = (0, import_react.useRef)(script);
	const voiceRef = (0, import_react.useRef)(voiceId);
	const sampleRateRef = (0, import_react.useRef)(sampleRate);
	scriptRef.current = script;
	voiceRef.current = voiceId;
	sampleRateRef.current = sampleRate;
	(0, import_react.useEffect)(() => {
		window.localStorage.setItem("booth-voice", voiceId);
	}, [voiceId]);
	(0, import_react.useEffect)(() => {
		window.localStorage.setItem("booth-script", script);
	}, [script]);
	(0, import_react.useEffect)(() => {
		window.localStorage.setItem("booth-speed", String(speed));
	}, [speed]);
	(0, import_react.useEffect)(() => {
		if (!playing) return;
		let frame = 0;
		const tick = () => {
			const playback = playbackRef.current;
			if (playback) {
				const t = Math.max(0, playback.ctx.currentTime - playback.startedAt);
				setCurrentTime(Math.min(t, playback.cursor / playback.sampleRate));
				if (t >= playback.cursor / playback.sampleRate - .05 && !generating) {
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
	const applyFile = async (file) => {
		const text = await file.text();
		setScript(text.slice(0, MAX_CHARS));
	};
	const onDrop = (event) => {
		event.preventDefault();
		setDragOver(false);
		const file = event.dataTransfer.files[0];
		if (file) applyFile(file);
	};
	const onFile = (event) => {
		const file = event.target.files?.[0];
		if (file) applyFile(file);
		event.target.value = "";
	};
	const replayClip = async (clip) => {
		stopPlayback();
		const buffer = await clip.wav.arrayBuffer();
		const decoded = await new AudioContext().decodeAudioData(buffer);
		const channel = decoded.getChannelData(0);
		const copy = new Float32Array(channel.length);
		copy.set(channel);
		setSamples(copy);
		setSampleRate(decoded.sampleRate);
		scheduleChunk(copy, decoded.sampleRate);
	};
	const chars = script.length;
	const over = chars > MAX_CHARS;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-shell mx-auto flex w-full max-w-6xl flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "stagger-in flex items-start justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl leading-tight tracking-[-0.03em]",
						children: "Booth"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "On-device text to speech"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 rounded-full bg-raised px-3 py-2 text-xs text-muted shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
							className: "size-3.5 text-accent",
							strokeWidth: 1.75
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Never uploaded"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "sm:hidden",
							children: "Local"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-lg tracking-[-0.03em]",
						children: "Speech stays on this device"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 max-w-xl text-sm leading-normal text-muted",
						children: "No cloud, no transcription, no OCR. The voice engine downloads once, then your script is synthesized here. Bring text from your own tools and press speak."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 text-sm text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Vu, { active: generating || playing }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: backend
						})]
					})]
				}), status !== "ready" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between text-xs text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error ?? progress.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: status === "error" ? "—" : `${progress.pct}%`
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 h-1 overflow-hidden rounded-full bg-raised",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full rounded-full bg-accent transition-[width] duration-(--motion-fast) ease-(--ease-out)",
								style: { width: `${status === "error" ? 100 : progress.pct}%` }
							})
						}),
						status === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-3",
							variant: "secondary",
							onClick: () => engineRef.current?.load(),
							children: "Retry local download"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "studio-grid",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: cn("area-script flex min-h-52 flex-col rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)] sm:min-h-80 sm:p-4", dragOver && "shadow-[var(--shadow-border-hover)]"),
						onDragOver: (event) => {
							event.preventDefault();
							setDragOver(true);
						},
						onDragLeave: () => setDragOver(false),
						onDrop,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-2 flex items-center justify-between gap-3 px-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									htmlFor: "script",
									className: "text-sm font-medium",
									children: "Script"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: cn("text-xs tabular-nums", over ? "text-fg" : "text-subtle"),
									children: [
										chars.toLocaleString(),
										" / ",
										MAX_CHARS.toLocaleString()
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								id: "script",
								value: script,
								onChange: (event) => setScript(event.target.value.slice(0, MAX_CHARS)),
								spellCheck: true,
								className: "min-h-56 flex-1 resize-none rounded-xl bg-raised px-4 py-3 text-base leading-normal text-fg outline-none shadow-[var(--shadow-border)] placeholder:text-subtle focus-visible:shadow-[var(--shadow-border-hover)]",
								placeholder: "Paste a script, a note, or text from your own OCR."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap items-center gap-2",
								children: [
									SCRIPT_SAMPLES.map((sample) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setScript(sample.text),
										className: "h-9 rounded-full bg-raised px-3 text-sm text-muted shadow-[var(--shadow-border)] transition-[color,box-shadow] duration-(--motion-quick) hover:text-fg hover:shadow-[var(--shadow-border-hover)]",
										children: sample.label
									}, sample.id)),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										ref: fileRef,
										type: "file",
										accept: ".txt,.md,.text,text/plain",
										className: "hidden",
										onChange: onFile
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										size: "sm",
										onClick: () => fileRef.current?.click(),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
											className: "size-3.5",
											strokeWidth: 1.75
										}), "Open text"]
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "area-deck rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waveform, {
								peaks,
								progress: playhead
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "lg",
											onClick: onSpeak,
											disabled: status !== "ready" || generating || !script.trim() || over,
											children: [generating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
												className: "size-4 animate-spin",
												strokeWidth: 1.75
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, {
												className: "size-4",
												strokeWidth: 1.75
											}), generating ? "Speaking" : "Speak"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "secondary",
											size: "icon",
											"aria-label": playing ? "Pause" : "Play",
											onClick: () => void onTogglePlay(),
											disabled: !samples && !generating,
											children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {
												className: "size-4",
												strokeWidth: 1.75
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
												className: "size-4 ml-0.5",
												strokeWidth: 1.75
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "secondary",
											size: "icon",
											"aria-label": "Stop",
											onClick: onStop,
											disabled: !generating && !playing,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, {
												className: "size-3.5",
												strokeWidth: 1.75
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "ghost",
											onClick: onDownload,
											disabled: !samples,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
												className: "size-4",
												strokeWidth: 1.75
											}), "WAV"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "px-1 text-xs tabular-nums text-muted",
											children: [
												formatTime(currentTime),
												" / ",
												formatTime(duration)
											]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex min-w-52 flex-1 items-center gap-3 text-sm text-muted lg:max-w-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "w-14 tabular-nums text-xs",
										children: ["Speed ", speed.toFixed(2)]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "range-input",
										type: "range",
										min: SPEED_MIN,
										max: SPEED_MAX,
										step: .05,
										value: speed,
										onChange: (event) => setSpeed(Number(event.target.value)),
										"aria-label": "Speaking speed"
									})]
								})]
							}),
							error && status === "ready" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: error
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "area-voices flex max-h-72 flex-col rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4 lg:max-h-none lg:min-h-80",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-3 flex items-center justify-between px-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: "Voices"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-subtle",
									children: voice.name
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-3 flex flex-wrap gap-1.5",
								children: [
									"all",
									"American",
									"British",
									"Female",
									"Male"
								].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setFilter(id),
									className: cn("h-8 rounded-full px-3 text-xs transition-[background-color,color] duration-(--motion-quick)", filter === id ? "bg-accent text-accent-fg" : "bg-raised text-muted hover:text-fg"),
									children: id === "all" ? "All" : id
								}, id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "min-h-0 flex-1 space-y-1 overflow-y-auto pr-1",
								children: filteredVoices.map((item) => {
									const selected = item.id === voiceId;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setVoiceId(item.id),
										className: cn("flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-[background-color] duration-(--motion-quick)", selected ? "bg-raised shadow-[inset_2px_0_0_var(--color-accent)]" : "hover:bg-raised/70"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-sm text-fg",
											children: item.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "block text-xs text-subtle",
											children: [
												item.region,
												" · ",
												item.gender,
												" · ",
												item.note
											]
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs tabular-nums text-muted",
											children: item.grade
										})]
									}, item.id);
								})
							})
						]
					})
				]
			}),
			clips.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-sm font-medium",
					children: "On this device"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1",
					children: clips.map((clip) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-raised",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
								className: "size-4 shrink-0 text-muted",
								strokeWidth: 1.75
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "min-w-0 flex-1 text-left",
								onClick: () => void replayClip(clip),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm",
									children: clip.text
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block text-xs text-subtle",
									children: [
										clip.voiceName,
										" · ",
										new Date(clip.createdAt).toLocaleString()
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Remove clip",
								className: "flex size-10 items-center justify-center text-muted hover:text-fg",
								onClick: () => void deleteClip(clip.id).then(setClips),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									className: "size-3.5",
									strokeWidth: 1.75
								})
							})
						]
					}, clip.id))
				})]
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, {}) });
}
//#endregion
export { Home as component };
