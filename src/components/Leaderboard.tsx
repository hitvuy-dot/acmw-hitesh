import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatSeconds, type ScoreRow } from "@/lib/quiz-data";

export function Leaderboard({ highlightId }: { highlightId?: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<ScoreRow[]> => {
      const { data, error } = await supabase
        .from("scores")
        .select("id, player_name, score, total, seconds, created_at")
        .order("score", { ascending: false })
        .order("seconds", { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as ScoreRow[];
    },
  });

  return (
    <section className="surface-card rounded-3xl p-6 sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Top 10</span>
      </div>

      {isLoading ? (
        <ul className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="h-12 animate-pulse rounded-xl bg-muted/60" />
          ))}
        </ul>
      ) : !data || data.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No scores yet — be the first to set the bar.
        </p>
      ) : (
        <ol className="mt-6 space-y-2">
          {data.map((row, i) => (
            <li
              key={row.id}
              className={`flex items-center gap-4 rounded-xl border px-4 py-3 text-sm transition-colors ${
                row.id === highlightId
                  ? "border-primary/60 bg-primary/10"
                  : "border-transparent bg-secondary/50"
              }`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-lg font-display text-xs font-bold ${
                  i === 0
                    ? "bg-primary text-primary-foreground"
                    : i < 3
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{row.player_name}</span>
              <span className="tabular-nums text-muted-foreground">{formatSeconds(row.seconds)}</span>
              <span className="font-display font-bold tabular-nums">
                {row.score}
                <span className="text-muted-foreground">/{row.total}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
