export type Question = {
  id: string;
  prompt: string;
  options: string[];
  correct_index: number;
  category: string;
  explanation: string | null;
  sort_order: number;
};

export type ScoreRow = {
  id: string;
  player_name: string;
  score: number;
  total: number;
  seconds: number;
  created_at: string;
};

export function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function verdict(pct: number) {
  if (pct === 100) return "Flawless. ACM-W material.";
  if (pct >= 80) return "Excellent work!";
  if (pct >= 60) return "Solid — a little revision to go.";
  if (pct >= 40) return "Not bad, try another round.";
  return "Time to brush up on ACM and AI basics.";
}
