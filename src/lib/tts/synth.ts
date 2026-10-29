export const SAMPLE_RATE = 24000;

type PhonemeSpec = {
  f1: number;
  f2: number;
  f3: number;
  b1: number;
  b2: number;
  b3: number;
  voiced: number;
  noise: number;
  noiseFreq: number;
  durMs: number;
};

type VoiceProfile = {
  f0: number;
  tractScale: number;
  britishShift: boolean;
  breathiness: number;
  vibratoDepth: number;
  paceScale: number;
};

const PHONEMES: Record<string, PhonemeSpec> = {
  // Vowels
  AA: { f1: 730, f2: 1090, f3: 2440, b1: 80, b2: 110, b3: 160, voiced: 1.0, noise: 0.01, noiseFreq: 1500, durMs: 115 },
  AE: { f1: 660, f2: 1720, f3: 2410, b1: 75, b2: 110, b3: 160, voiced: 1.0, noise: 0.01, noiseFreq: 1700, durMs: 110 },
  AH: { f1: 520, f2: 1190, f3: 2390, b1: 70, b2: 100, b3: 150, voiced: 1.0, noise: 0.01, noiseFreq: 1400, durMs: 85 },
  AO: { f1: 570, f2: 840, f3: 2410, b1: 75, b2: 95, b3: 150, voiced: 1.0, noise: 0.01, noiseFreq: 1200, durMs: 115 },
  EH: { f1: 530, f2: 1840, f3: 2480, b1: 70, b2: 105, b3: 155, voiced: 1.0, noise: 0.01, noiseFreq: 1800, durMs: 95 },
  ER: { f1: 490, f2: 1350, f3: 1690, b1: 70, b2: 100, b3: 140, voiced: 1.0, noise: 0.015, noiseFreq: 1500, durMs: 110 },
  IH: { f1: 390, f2: 1990, f3: 2550, b1: 65, b2: 100, b3: 150, voiced: 1.0, noise: 0.01, noiseFreq: 2000, durMs: 85 },
  IY: { f1: 270, f2: 2290, f3: 3010, b1: 60, b2: 95, b3: 150, voiced: 1.0, noise: 0.01, noiseFreq: 2300, durMs: 115 },
  OW: { f1: 450, f2: 1050, f3: 2400, b1: 70, b2: 95, b3: 150, voiced: 1.0, noise: 0.01, noiseFreq: 1100, durMs: 120 },
  UH: { f1: 440, f2: 1020, f3: 2240, b1: 65, b2: 95, b3: 150, voiced: 1.0, noise: 0.01, noiseFreq: 1100, durMs: 85 },
  UW: { f1: 300, f2: 870, f3: 2240, b1: 60, b2: 90, b3: 145, voiced: 1.0, noise: 0.01, noiseFreq: 1000, durMs: 115 },
  // Nasals & Liquids
  M:  { f1: 280, f2: 900, f3: 2200, b1: 120, b2: 160, b3: 200, voiced: 0.75, noise: 0.0, noiseFreq: 1000, durMs: 65 },
  N:  { f1: 280, f2: 1450, f3: 2500, b1: 120, b2: 160, b3: 200, voiced: 0.75, noise: 0.0, noiseFreq: 1500, durMs: 60 },
  NG: { f1: 280, f2: 1900, f3: 2600, b1: 130, b2: 170, b3: 210, voiced: 0.75, noise: 0.0, noiseFreq: 1900, durMs: 70 },
  L:  { f1: 360, f2: 1100, f3: 2650, b1: 80, b2: 120, b3: 160, voiced: 0.85, noise: 0.01, noiseFreq: 1200, durMs: 65 },
  R:  { f1: 420, f2: 1300, f3: 1650, b1: 80, b2: 115, b3: 150, voiced: 0.85, noise: 0.01, noiseFreq: 1400, durMs: 65 },
  W:  { f1: 310, f2: 750, f3: 2200, b1: 75, b2: 105, b3: 150, voiced: 0.9, noise: 0.01, noiseFreq: 850, durMs: 65 },
  Y:  { f1: 280, f2: 2150, f3: 2900, b1: 70, b2: 105, b3: 150, voiced: 0.9, noise: 0.01, noiseFreq: 2200, durMs: 65 },
  // Fricatives & Affricates
  S:  { f1: 320, f2: 1700, f3: 2700, b1: 200, b2: 250, b3: 300, voiced: 0.0, noise: 0.28, noiseFreq: 5200, durMs: 75 },
  Z:  { f1: 320, f2: 1700, f3: 2700, b1: 130, b2: 180, b3: 240, voiced: 0.55, noise: 0.18, noiseFreq: 4800, durMs: 70 },
  SH: { f1: 350, f2: 1850, f3: 2500, b1: 180, b2: 220, b3: 280, voiced: 0.0, noise: 0.26, noiseFreq: 3200, durMs: 80 },
  F:  { f1: 340, f2: 1250, f3: 2400, b1: 200, b2: 240, b3: 300, voiced: 0.0, noise: 0.16, noiseFreq: 2800, durMs: 70 },
  V:  { f1: 340, f2: 1250, f3: 2400, b1: 120, b2: 170, b3: 220, voiced: 0.65, noise: 0.10, noiseFreq: 2600, durMs: 65 },
  TH: { f1: 350, f2: 1450, f3: 2500, b1: 180, b2: 220, b3: 280, voiced: 0.35, noise: 0.14, noiseFreq: 3400, durMs: 65 },
  HH: { f1: 500, f2: 1500, f3: 2500, b1: 160, b2: 200, b3: 260, voiced: 0.15, noise: 0.18, noiseFreq: 1800, durMs: 55 },
  // Stops
  P:  { f1: 300, f2: 1100, f3: 2300, b1: 180, b2: 220, b3: 280, voiced: 0.0, noise: 0.12, noiseFreq: 1600, durMs: 50 },
  B:  { f1: 300, f2: 1100, f3: 2300, b1: 110, b2: 150, b3: 210, voiced: 0.55, noise: 0.05, noiseFreq: 1400, durMs: 50 },
  T:  { f1: 320, f2: 1650, f3: 2600, b1: 180, b2: 220, b3: 280, voiced: 0.0, noise: 0.16, noiseFreq: 3800, durMs: 50 },
  D:  { f1: 320, f2: 1650, f3: 2600, b1: 110, b2: 150, b3: 210, voiced: 0.6, noise: 0.06, noiseFreq: 3200, durMs: 50 },
  K:  { f1: 320, f2: 1850, f3: 2350, b1: 180, b2: 220, b3: 280, voiced: 0.0, noise: 0.15, noiseFreq: 2400, durMs: 55 },
  G:  { f1: 320, f2: 1850, f3: 2350, b1: 110, b2: 150, b3: 210, voiced: 0.6, noise: 0.06, noiseFreq: 2200, durMs: 55 },
  // Pauses
  SIL_SHORT: { f1: 500, f2: 1500, f3: 2500, b1: 200, b2: 250, b3: 300, voiced: 0.0, noise: 0.0, noiseFreq: 1000, durMs: 42 },
  SIL_MED:   { f1: 500, f2: 1500, f3: 2500, b1: 200, b2: 250, b3: 300, voiced: 0.0, noise: 0.0, noiseFreq: 1000, durMs: 135 },
  SIL_LONG:  { f1: 500, f2: 1500, f3: 2500, b1: 200, b2: 250, b3: 300, voiced: 0.0, noise: 0.0, noiseFreq: 1000, durMs: 240 },
};

const VOICE_OFFSETS: Record<string, { f0: number; tract: number; breath: number; pace: number }> = {
  af_heart:    { f0: 198, tract: 1.12, breath: 0.018, pace: 1.00 },
  af_bella:    { f0: 188, tract: 1.10, breath: 0.024, pace: 0.98 },
  af_nicole:   { f0: 182, tract: 1.09, breath: 0.032, pace: 0.95 },
  bf_emma:     { f0: 194, tract: 1.11, breath: 0.016, pace: 0.99 },
  af_aoede:    { f0: 210, tract: 1.14, breath: 0.015, pace: 1.02 },
  af_kore:     { f0: 186, tract: 1.10, breath: 0.025, pace: 0.96 },
  af_sarah:    { f0: 192, tract: 1.11, breath: 0.018, pace: 0.97 },
  am_michael:  { f0: 116, tract: 0.96, breath: 0.014, pace: 1.00 },
  am_fenrir:   { f0: 98,  tract: 0.92, breath: 0.016, pace: 0.96 },
  am_puck:     { f0: 132, tract: 1.00, breath: 0.018, pace: 1.04 },
  bm_george:   { f0: 112, tract: 0.95, breath: 0.014, pace: 0.98 },
  bm_fable:    { f0: 124, tract: 0.98, breath: 0.018, pace: 0.97 },
  bf_isabella: { f0: 202, tract: 1.12, breath: 0.020, pace: 0.98 },
  af_alloy:    { f0: 190, tract: 1.10, breath: 0.014, pace: 1.00 },
  af_nova:     { f0: 208, tract: 1.13, breath: 0.015, pace: 1.05 },
  af_sky:      { f0: 218, tract: 1.15, breath: 0.026, pace: 1.03 },
  bm_lewis:    { f0: 108, tract: 0.94, breath: 0.015, pace: 0.96 },
  af_jessica:  { f0: 200, tract: 1.12, breath: 0.020, pace: 1.01 },
  af_river:    { f0: 176, tract: 1.07, breath: 0.022, pace: 0.96 },
  am_echo:     { f0: 118, tract: 0.96, breath: 0.016, pace: 0.98 },
  am_eric:     { f0: 122, tract: 0.97, breath: 0.015, pace: 1.00 },
  am_liam:     { f0: 106, tract: 0.94, breath: 0.016, pace: 0.97 },
  am_onyx:     { f0: 94,  tract: 0.90, breath: 0.018, pace: 0.95 },
  bf_alice:    { f0: 196, tract: 1.11, breath: 0.019, pace: 0.98 },
  bf_lily:     { f0: 212, tract: 1.14, breath: 0.020, pace: 1.01 },
  bm_daniel:   { f0: 114, tract: 0.95, breath: 0.013, pace: 1.00 },
  am_santa:    { f0: 102, tract: 0.91, breath: 0.024, pace: 0.92 },
  am_adam:     { f0: 120, tract: 0.97, breath: 0.022, pace: 1.00 },
};

export function getVoiceProfile(voiceId: string): VoiceProfile {
  const preset = VOICE_OFFSETS[voiceId];
  const isBritish = voiceId.startsWith("b");
  const isFemale = voiceId.slice(1, 2) === "f";
  return {
    f0: preset?.f0 ?? (isFemale ? 195 : 115),
    tractScale: preset?.tract ?? (isFemale ? 1.11 : 0.96),
    britishShift: isBritish,
    breathiness: preset?.breath ?? 0.018,
    vibratoDepth: 0.012,
    paceScale: preset?.pace ?? 1.0,
  };
}

export function splitIntoClauses(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const raw = normalized.match(/[^.!?;,:—]+[.!?;,:—]*/g) ?? [normalized];
  const clauses: string[] = [];
  for (const part of raw) {
    const trimmed = part.trim();
    if (trimmed) clauses.push(trimmed);
  }
  return clauses;
}

function wordToPhonemes(word: string, britishShift: boolean): PhonemeSpec[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return [];

  const out: PhonemeSpec[] = [];
  let i = 0;
  while (i < clean.length) {
    const rem = clean.slice(i);
    if (rem.startsWith("tion") || rem.startsWith("sion")) {
      out.push(PHONEMES.SH!, PHONEMES.AH!, PHONEMES.N!);
      i += 4;
      continue;
    }
    if (rem.startsWith("ing") && rem.length === 3) {
      out.push(PHONEMES.IH!, PHONEMES.NG!);
      i += 3;
      continue;
    }
    const two = rem.slice(0, 2);
    if (two === "th") { out.push(PHONEMES.TH!); i += 2; continue; }
    if (two === "sh" || two === "ch") { out.push(PHONEMES.SH!); i += 2; continue; }
    if (two === "ph") { out.push(PHONEMES.F!); i += 2; continue; }
    if (two === "ng") { out.push(PHONEMES.NG!); i += 2; continue; }
    if (two === "wh") { out.push(PHONEMES.W!); i += 2; continue; }
    if (two === "ck") { out.push(PHONEMES.K!); i += 2; continue; }
    if (two === "qu") { out.push(PHONEMES.K!, PHONEMES.W!); i += 2; continue; }
    if (two === "ee" || two === "ea") { out.push(PHONEMES.IY!); i += 2; continue; }
    if (two === "oo") { out.push(PHONEMES.UW!); i += 2; continue; }
    if (two === "ou" || two === "ow") { out.push(PHONEMES.AA!, PHONEMES.UH!); i += 2; continue; }
    if (two === "ai" || two === "ay") { out.push(PHONEMES.EH!, PHONEMES.IH!); i += 2; continue; }
    if (two === "oi" || two === "oy") { out.push(PHONEMES.AO!, PHONEMES.IH!); i += 2; continue; }
    if (two === "ar") {
      out.push(PHONEMES.AA!, ...(britishShift ? [] : [PHONEMES.R!]));
      i += 2;
      continue;
    }
    if (two === "er" || two === "ir" || two === "ur") {
      out.push(britishShift ? PHONEMES.AH! : PHONEMES.ER!);
      i += 2;
      continue;
    }
    if (two === "or") {
      out.push(PHONEMES.AO!, ...(britishShift ? [] : [PHONEMES.R!]));
      i += 2;
      continue;
    }

    const ch = clean[i]!;
    if (ch === "e" && i === clean.length - 1 && clean.length > 3) {
      i += 1;
      continue;
    }

    switch (ch) {
      case "a": out.push(britishShift ? PHONEMES.AA! : PHONEMES.AE!); break;
      case "e": out.push(PHONEMES.EH!); break;
      case "i": out.push(PHONEMES.IH!); break;
      case "o": out.push(britishShift ? PHONEMES.AO! : PHONEMES.OW!); break;
      case "u": out.push(PHONEMES.AH!); break;
      case "y": out.push(i === 0 ? PHONEMES.Y! : PHONEMES.IY!); break;
      case "b": out.push(PHONEMES.B!); break;
      case "c": out.push(rem[1] === "e" || rem[1] === "i" ? PHONEMES.S! : PHONEMES.K!); break;
      case "d": out.push(PHONEMES.D!); break;
      case "f": out.push(PHONEMES.F!); break;
      case "g": out.push(PHONEMES.G!); break;
      case "h": out.push(PHONEMES.HH!); break;
      case "j": out.push(PHONEMES.D!, PHONEMES.SH!); break;
      case "k": out.push(PHONEMES.K!); break;
      case "l": out.push(PHONEMES.L!); break;
      case "m": out.push(PHONEMES.M!); break;
      case "n": out.push(PHONEMES.N!); break;
      case "p": out.push(PHONEMES.P!); break;
      case "r": out.push(PHONEMES.R!); break;
      case "s": out.push(PHONEMES.S!); break;
      case "t": out.push(PHONEMES.T!); break;
      case "v": out.push(PHONEMES.V!); break;
      case "w": out.push(PHONEMES.W!); break;
      case "x": out.push(PHONEMES.K!, PHONEMES.S!); break;
      case "z": out.push(PHONEMES.Z!); break;
      default: break;
    }
    i += 1;
  }

  return out.length > 0 ? out : [PHONEMES.AH!];
}

function textToPhonemeStream(text: string, britishShift: boolean): PhonemeSpec[] {
  const tokens = text.trim().split(/\s+/);
  const seq: PhonemeSpec[] = [];
  for (let idx = 0; idx < tokens.length; idx++) {
    const token = tokens[idx]!;
    const phonemes = wordToPhonemes(token, britishShift);
    seq.push(...phonemes);
    if (/[.!?]$/.test(token)) {
      seq.push(PHONEMES.SIL_LONG!);
    } else if (/[,;:—]$/.test(token)) {
      seq.push(PHONEMES.SIL_MED!);
    } else if (idx < tokens.length - 1) {
      seq.push(PHONEMES.SIL_SHORT!);
    }
  }
  return seq;
}

class Resonator {
  private y1 = 0;
  private y2 = 0;

  step(x: number, freq: number, bw: number, sr: number): number {
    const r = Math.exp((-Math.PI * bw) / sr);
    const c = -(r * r);
    const b = 2 * r * Math.cos((2 * Math.PI * freq) / sr);
    const a = 1 - b - c;
    const y = a * x + b * this.y1 + c * this.y2;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

export function synthesizeSpeech(
  text: string,
  voiceId: string,
  speed = 1.0,
  sampleRate = SAMPLE_RATE,
): Float32Array {
  const profile = getVoiceProfile(voiceId);
  const phonemes = textToPhonemeStream(text, profile.britishShift);
  if (phonemes.length === 0) return new Float32Array(0);

  const effectiveSpeed = Math.max(0.5, Math.min(2.0, speed * profile.paceScale));
  const segLengths = phonemes.map((p) =>
    Math.max(64, Math.round(((p.durMs / 1000) * sampleRate) / effectiveSpeed)),
  );
  const totalSamples = segLengths.reduce((acc, n) => acc + n, 0);
  const out = new Float32Array(totalSamples);

  const r1 = new Resonator();
  const r2 = new Resonator();
  const r3 = new Resonator();
  const rNoise = new Resonator();

  const isQuestion = /\?\s*$/.test(text);
  let phase = 0;
  let glottalPrev = 0;
  let noiseSeed = 0x12345678;
  let offset = 0;

  const nextWhiteNoise = () => {
    noiseSeed = (noiseSeed * 1664525 + 1013904223) >>> 0;
    return (noiseSeed / 0x80000000) - 1.0;
  };

  for (let s = 0; s < phonemes.length; s++) {
    const curr = phonemes[s]!;
    const next = phonemes[Math.min(s + 1, phonemes.length - 1)]!;
    const len = segLengths[s]!;
    const coartLen = Math.min(len, Math.round(0.025 * sampleRate));

    for (let i = 0; i < len; i++) {
      const globalIdx = offset + i;
      const progress = globalIdx / Math.max(1, totalSamples - 1);
      const alpha =
        i >= len - coartLen && coartLen > 0
          ? ((i - (len - coartLen)) / coartLen) * 0.5
          : 0;

      const f1 = (curr.f1 * (1 - alpha) + next.f1 * alpha) * profile.tractScale;
      const f2 = (curr.f2 * (1 - alpha) + next.f2 * alpha) * profile.tractScale;
      const f3 = (curr.f3 * (1 - alpha) + next.f3 * alpha) * profile.tractScale;
      const b1 = curr.b1 * (1 - alpha) + next.b1 * alpha;
      const b2 = curr.b2 * (1 - alpha) + next.b2 * alpha;
      const b3 = curr.b3 * (1 - alpha) + next.b3 * alpha;
      const voicedAmp = curr.voiced * (1 - alpha) + next.voiced * alpha;
      const noiseAmp = curr.noise * (1 - alpha) + next.noise * alpha;

      const declination = isQuestion
        ? 1.0 - 0.06 * progress + (progress > 0.75 ? 0.18 * ((progress - 0.75) / 0.25) : 0)
        : 1.04 - 0.12 * progress;
      const vibrato = 1.0 + profile.vibratoDepth * Math.sin((2 * Math.PI * 5.2 * globalIdx) / sampleRate);
      const syllableMod = 1.0 + 0.03 * Math.sin((Math.PI * i) / len);
      const f0 = profile.f0 * declination * vibrato * syllableMod;

      phase += f0 / sampleRate;
      if (phase >= 1.0) phase -= 1.0;

      let glottal = 0;
      if (phase < 0.4) {
        glottal = 0.5 * (1 - Math.cos((Math.PI * phase) / 0.4));
      } else if (phase < 0.56) {
        glottal = Math.cos((Math.PI * (phase - 0.4)) / 0.32);
      }
      const voicedSource = (glottal - glottalPrev) * 2.2;
      glottalPrev = glottal;

      const white = nextWhiteNoise();
      const aspiration = white * profile.breathiness * voicedAmp;
      const excitation = (voicedSource * voicedAmp) + aspiration;

      const v1 = r1.step(excitation, f1, b1, sampleRate);
      const v2 = r2.step(v1, f2, b2, sampleRate);
      const v3 = r3.step(v2, f3, b3, sampleRate);

      const fric = rNoise.step(white * noiseAmp, curr.noiseFreq, 600, sampleRate);

      const envIn = Math.min(1.0, i / Math.min(96, len * 0.2));
      const envOut = Math.min(1.0, (len - 1 - i) / Math.min(96, len * 0.2));
      const sample = (v3 * 0.48 + fric * 0.35) * envIn * envOut;

      out[globalIdx] = Math.max(-0.98, Math.min(0.98, sample));
    }
    offset += len;
  }

  let peak = 0;
  for (let i = 0; i < out.length; i++) {
    const a = Math.abs(out[i]!);
    if (a > peak) peak = a;
  }
  if (peak > 1e-4) {
    const scale = 0.84 / peak;
    for (let i = 0; i < out.length; i++) {
      out[i] = out[i]! * scale;
    }
  }

  return out;
}