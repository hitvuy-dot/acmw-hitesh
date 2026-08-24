import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaderboard } from "@/components/Leaderboard";
import { formatSeconds, verdict, type Question } from "@/lib/quiz-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ACM-W Quiz — Test your ACM & AI basics" },
      {
        name: "description",
        content:
          "A 12-question interactive quiz on ACM, ACM-W and fundamental AI concepts, with a live leaderboard.",
      },
      { property: "og:title", content: "ACM-W Quiz — Test your ACM & AI basics" },
      {
        property: "og:description",
        content: "Answer 12 questions on ACM, ACM-W and AI basics, then climb the live leaderboard.",
      },
    ],
  }),
  component: QuizPage,
});

type Stage = "intro" | "playing" | "done";

function QuizPage() {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<Stage>("intro");
  const [name, setName] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const startedAt = useRef<number>(0);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions"],
    queryFn: async (): Promise<Question[]> => {
      const { data, error } = await supabase
        .from("questions")
        .select("id, prompt, options, correct_index, category, explanation, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Question[];
    },
  });

  useEffect(() => {
    if (stage !== "playing") return;
    const id = window.setInterval(() => {
      setSeconds(Math.round((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [stage]);

  const total = questions?.length ?? 0;
  const current = questions?.[index];

  const score = useMemo(() => {
    if (!questions) return 0;
    return questions.reduce((acc, q) => (answers[q.id] === q.correct_index ? acc + 1 : acc), 0);
  }, [questions, answers]);

  function start() {
    setStage("playing");
    setIndex(0);
    setAnswers({});
    setPicked(null);
    setSeconds(0);
    setSavedId(null);
    setSaveError(null);
    startedAt.current = Date.now();
  }

  function choose(i: number) {
    if (picked !== null || !current) return;
    setPicked(i);
    setAnswers((a) => ({ ...a, [current.id]: i }));
  }

  async function next() {
    if (!questions) return;
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    setStage("done");
    await save();
  }

  async function save() {
    if (!questions) return;
    const finalScore = questions.reduce(
      (acc, q) => (answers[q.id] === q.correct_index ? acc + 1 : acc),
      0,
    );
    const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
    setSubmitting(true);
    setSaveError(null);
    const { data, error } = await supabase
      .from("scores")
      .insert({
        player_name: name.trim() || "Anonymous",
        score: finalScore,
        total: questions.length,
        seconds: elapsed,
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (error) {
      setSaveError("Couldn't save your score to the leaderboard.");
      return;
    }
    setSavedId(data.id);
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">ACM-W</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
            The <span className="text-gradient">ACM &amp; AI</span> Quiz
          </h1>
        </div>
        {stage === "playing" && (
          <div className="surface-card rounded-2xl px-4 py-2 text-right">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Time</p>
            <p className="font-display text-xl font-bold tabular-nums">{formatSeconds(seconds)}</p>
          </div>
        )}
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <div className="surface-card rounded-3xl p-6 sm:p-8">
          {isLoading && <p className="text-muted-foreground">Loading questions…</p>}

          {!isLoading && stage === "intro" && (
            <div>
              <h2 className="text-2xl font-bold">Ready to play?</h2>
              <p className="mt-3 max-w-prose text-muted-foreground">
                {total} multiple-choice questions on the Association for Computing Machinery, ACM-W,
                and the fundamentals of artificial intelligence. Pick an answer, get instant
                feedback, and land your name on the leaderboard.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                  placeholder="Your name"
                  className="h-12 rounded-xl bg-secondary/60 text-base"
                />
                <Button
                  size="lg"
                  className="glow h-12 rounded-xl px-8 text-base font-semibold"
                  onClick={start}
                  disabled={total === 0}
                >
                  Start quiz
                </Button>
              </div>
            </div>
          )}

          {stage === "playing" && current && (
            <div>
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>
                  Question {index + 1} / {total}
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 text-accent">
                  {current.category}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${((index + (picked !== null ? 1 : 0)) / total) * 100}%`,
                    backgroundImage: "var(--gradient-hero)",
                  }}
                />
              </div>

              <h2 className="mt-6 text-2xl font-bold leading-snug">{current.prompt}</h2>

              <ul className="mt-6 space-y-3">
                {current.options.map((opt, i) => {
                  const isCorrect = i === current.correct_index;
                  const isPicked = picked === i;
                  const reveal = picked !== null;
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => choose(i)}
                        disabled={reveal}
                        className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all ${
                          reveal && isCorrect
                            ? "border-success bg-success/15"
                            : reveal && isPicked
                              ? "border-destructive bg-destructive/15"
                              : "border-border bg-secondary/50 hover:border-primary/60 hover:bg-secondary"
                        } ${reveal ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted font-display text-sm font-bold">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-base">{opt}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {picked !== null && (
                <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4">
                  <p className="font-display font-bold">
                    {picked === current.correct_index ? "Correct" : "Not quite"}
                  </p>
                  {current.explanation && (
                    <p className="mt-1 text-sm text-muted-foreground">{current.explanation}</p>
                  )}
                  <Button
                    className="glow mt-4 h-11 rounded-xl px-6 font-semibold"
                    onClick={next}
                  >
                    {index + 1 === total ? "See results" : "Next question"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {stage === "done" && (
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Your score</p>
              <p className="mt-3 font-display text-7xl font-bold text-gradient">
                {score}
                <span className="text-3xl text-muted-foreground">/{total}</span>
              </p>
              <p className="mt-3 text-lg">{verdict(Math.round((score / (total || 1)) * 100))}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Finished in {formatSeconds(seconds)}
                {submitting && " · saving…"}
              </p>
              {saveError && <p className="mt-2 text-sm text-destructive">{saveError}</p>}

              <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
                {questions?.map((q, i) => {
                  const ok = answers[q.id] === q.correct_index;
                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border px-4 py-3 text-sm ${
                        ok ? "border-success/50 bg-success/10" : "border-destructive/50 bg-destructive/10"
                      }`}
                    >
                      <p className="font-medium">
                        {i + 1}. {q.prompt}
                      </p>
                      {!ok && (
                        <p className="mt-1 text-muted-foreground">
                          Answer: {q.options[q.correct_index]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button className="glow mt-8 h-12 rounded-xl px-8 font-semibold" onClick={start}>
                Play again
              </Button>
            </div>
          )}
        </div>

        <Leaderboard highlightId={savedId} />
      </div>

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        Built for the ACM-W 2026 recruitment challenge.
      </footer>
    </main>
  );
}
