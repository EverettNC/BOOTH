import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { concatFloat32, encodeWav, downsamplePeaks } from "./wav.ts";
import { VOICES, DEFAULT_VOICE, DEFAULT_SCRIPT } from "./voices.ts";
import { splitIntoClauses, synthesizeSpeech, SAMPLE_RATE } from "./synth.ts";

describe("Booth TTS WAV, Voice & Offline Synthesizer Utilities", () => {
  it("concatenates Float32Array chunks accurately", () => {
    const a = new Float32Array([0.1, 0.2]);
    const b = new Float32Array([-0.1, 0.5, 0.9]);
    const merged = concatFloat32([a, b]);
    assert.equal(merged.length, 5);
    assert.ok(Math.abs(merged[0] - 0.1) < 1e-6);
    assert.ok(Math.abs(merged[2] - -0.1) < 1e-6);
    assert.ok(Math.abs(merged[4] - 0.9) < 1e-6);
  });

  it("encodes valid 16-bit mono RIFF/WAVE PCM headers and samples", async () => {
    const sampleRate = 24000;
    const samples = new Float32Array([0, 0.5, -0.5, 1.0, -1.0]);
    const blob = encodeWav(samples, sampleRate);
    assert.equal(blob.type, "audio/wav");
    assert.equal(blob.size, 44 + samples.length * 2);

    const buf = new DataView(await blob.arrayBuffer());
    assert.equal(buf.getUint32(0, false), 0x52494646); // "RIFF"
    assert.equal(buf.getUint32(8, false), 0x57415645); // "WAVE"
    assert.equal(buf.getUint32(24, true), sampleRate);
    assert.equal(buf.getUint16(34, true), 16);
    assert.equal(buf.getInt16(44, true), 0);
    assert.equal(buf.getInt16(46, true), Math.floor(0.5 * 0x7fff));
    assert.equal(buf.getInt16(48, true), Math.floor(-0.5 * 0x8000));
    assert.equal(buf.getInt16(50, true), 0x7fff);
    assert.equal(buf.getInt16(52, true), -0x8000);
  });

  it("computes waveform peak bars accurately", () => {
    const samples = new Float32Array(400);
    samples[50] = 0.8;
    samples[250] = -0.4;
    const peaks = downsamplePeaks(samples, 4);
    assert.equal(peaks.length, 4);
    assert.ok(Math.abs(peaks[0] - 0.8) < 1e-6);
    assert.equal(peaks[1], 0);
    assert.ok(Math.abs(peaks[2] - 0.4) < 1e-6);
    assert.equal(peaks[3], 0);
  });

  it("provides a valid default voice, voice catalog, and default script", () => {
    assert.ok(VOICES.length >= 10);
    const defaultEntry = VOICES.find((v) => v.id === DEFAULT_VOICE);
    assert.ok(defaultEntry, "DEFAULT_VOICE must exist in VOICES");
    for (const v of VOICES) {
      assert.ok(v.id.length > 0);
      assert.ok(v.name.length > 0);
      assert.ok(v.region === "American" || v.region === "British");
    }
    assert.ok(DEFAULT_SCRIPT.length > 20);
  });

  it("splits scripts into clauses and synthesizes non-silent 24kHz PCM audio offline", () => {
    const clauses = splitIntoClauses("Hello world. Booth runs offline!");
    assert.equal(clauses.length, 2);
    const pcm = synthesizeSpeech(clauses[0]!, DEFAULT_VOICE, 1.0, SAMPLE_RATE);
    assert.ok(pcm.length > SAMPLE_RATE * 0.2, "Expected at least 200ms of synthesized audio");
    let maxAbs = 0;
    for (let i = 0; i < pcm.length; i++) {
      const v = Math.abs(pcm[i]!);
      if (v > maxAbs) maxAbs = v;
    }
    assert.ok(maxAbs > 0.5 && maxAbs <= 0.9, `Expected normalized peak around 0.84, got ${maxAbs}`);
  });
});
