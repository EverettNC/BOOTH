export type VoiceId =
  | "af_heart"
  | "af_bella"
  | "af_nicole"
  | "af_aoede"
  | "af_kore"
  | "af_sarah"
  | "af_alloy"
  | "af_nova"
  | "af_sky"
  | "af_jessica"
  | "af_river"
  | "am_michael"
  | "am_fenrir"
  | "am_puck"
  | "am_echo"
  | "am_eric"
  | "am_liam"
  | "am_onyx"
  | "am_santa"
  | "am_adam"
  | "bf_emma"
  | "bf_isabella"
  | "bf_alice"
  | "bf_lily"
  | "bm_george"
  | "bm_fable"
  | "bm_lewis"
  | "bm_daniel";

export type VoiceMeta = {
  id: VoiceId;
  name: string;
  region: "American" | "British";
  gender: "Female" | "Male";
  grade: string;
  note: string;
};

const GRADE_RANK: Record<string, number> = {
  A: 0,
  "A-": 1,
  "B-": 2,
  "C+": 3,
  C: 4,
  "C-": 5,
  "D+": 6,
  D: 7,
  "D-": 8,
  "F+": 9,
};

export const VOICES: VoiceMeta[] = (
  [
    { id: "af_heart", name: "Heart", region: "American", gender: "Female", grade: "A", note: "Clear, natural lead" },
    { id: "af_bella", name: "Bella", region: "American", gender: "Female", grade: "A-", note: "Warm and expressive" },
    { id: "af_nicole", name: "Nicole", region: "American", gender: "Female", grade: "B-", note: "Intimate, close-mic" },
    { id: "bf_emma", name: "Emma", region: "British", gender: "Female", grade: "B-", note: "Poised narrator" },
    { id: "af_aoede", name: "Aoede", region: "American", gender: "Female", grade: "C+", note: "Bright and even" },
    { id: "af_kore", name: "Kore", region: "American", gender: "Female", grade: "C+", note: "Soft, measured" },
    { id: "af_sarah", name: "Sarah", region: "American", gender: "Female", grade: "C+", note: "Calm reader" },
    { id: "am_michael", name: "Michael", region: "American", gender: "Male", grade: "C+", note: "Steady broadcast" },
    { id: "am_fenrir", name: "Fenrir", region: "American", gender: "Male", grade: "C+", note: "Low and grounded" },
    { id: "am_puck", name: "Puck", region: "American", gender: "Male", grade: "C+", note: "Light, conversational" },
    { id: "bm_george", name: "George", region: "British", gender: "Male", grade: "C", note: "Classic reader" },
    { id: "bm_fable", name: "Fable", region: "British", gender: "Male", grade: "C", note: "Storyteller" },
    { id: "bf_isabella", name: "Isabella", region: "British", gender: "Female", grade: "C", note: "Gentle British" },
    { id: "af_alloy", name: "Alloy", region: "American", gender: "Female", grade: "C", note: "Neutral studio" },
    { id: "af_nova", name: "Nova", region: "American", gender: "Female", grade: "C", note: "Crisp and quick" },
    { id: "af_sky", name: "Sky", region: "American", gender: "Female", grade: "C-", note: "Airy, youthful" },
    { id: "bm_lewis", name: "Lewis", region: "British", gender: "Male", grade: "D+", note: "Dry, documentary" },
    { id: "af_jessica", name: "Jessica", region: "American", gender: "Female", grade: "D", note: "Casual speech" },
    { id: "af_river", name: "River", region: "American", gender: "Female", grade: "D", note: "Low-key" },
    { id: "am_echo", name: "Echo", region: "American", gender: "Male", grade: "D", note: "Reserved" },
    { id: "am_eric", name: "Eric", region: "American", gender: "Male", grade: "D", note: "Plainspoken" },
    { id: "am_liam", name: "Liam", region: "American", gender: "Male", grade: "D", note: "Quiet baritone" },
    { id: "am_onyx", name: "Onyx", region: "American", gender: "Male", grade: "D", note: "Darker color" },
    { id: "bf_alice", name: "Alice", region: "British", gender: "Female", grade: "D", note: "Soft RP" },
    { id: "bf_lily", name: "Lily", region: "British", gender: "Female", grade: "D", note: "Light British" },
    { id: "bm_daniel", name: "Daniel", region: "British", gender: "Male", grade: "D", note: "News desk" },
    { id: "am_santa", name: "Santa", region: "American", gender: "Male", grade: "D-", note: "Festive character" },
    { id: "am_adam", name: "Adam", region: "American", gender: "Male", grade: "F+", note: "Rough take" },
  ] satisfies VoiceMeta[]
).sort((a, b) => (GRADE_RANK[a.grade] ?? 9) - (GRADE_RANK[b.grade] ?? 9));

export const DEFAULT_VOICE: VoiceId = "af_heart";

export const DEFAULT_SCRIPT =
  "Booth runs entirely on this device. Nothing you type is sent to a server, a cloud, or a data center. Press speak, and the voice is built here — from the script you already have.";

export const SCRIPT_SAMPLES: { id: string; label: string; text: string }[] = [
  {
    id: "brief",
    label: "Brief",
    text: "Good evening. The north dock is clear, the night shift is on, and the last crate left at nine. If you need the ledger, it is on the desk by the lamp. That is all.",
  },
  {
    id: "letter",
    label: "Letter",
    text: "I walked the long way home so I could finish the thought. The river was still, the shops were closing, and I kept hearing the same sentence in my head: we do the work here, on this machine, and we keep the words.",
  },
  {
    id: "lecture",
    label: "Lecture",
    text: "Text-to-speech does not have to leave the room. A small on-device model turns writing into sound on the same computer that holds the file. No account. No upload. The only network trip is the first download of the voice engine, which stays cached after that.",
  },
  {
    id: "ad",
    label: "Spot",
    text: "Chamber-quiet audio. Your script, your machine. Booth is a private voice studio for notes, drafts, and anything you are not willing to send out.",
  },
];

export const MAX_CHARS = 2000;
export const SPEED_MIN = 0.7;
export const SPEED_MAX = 1.35;
