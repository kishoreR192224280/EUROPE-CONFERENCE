import { Award, Sparkles, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { memo } from "react";

type ParticipantSummary = {
  rank: number;
  score: number;
  correctAnswers: number;
  fullyCorrectAnswers?: number;
  partiallyCorrectAnswers?: number;
  correctParts?: number;
  totalParts?: number;
} | null | undefined;

type LeaderboardEntry = {
  id: number;
  name: string;
  phoneNumber?: string | null;
  score: number;
  rank: number;
};

const LeaderboardRow = memo(({ entry }: { entry: LeaderboardEntry }) => {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-[1.3rem] border border-white/8 bg-[#111c36]/80 px-3 py-2.5 sm:py-3"
    >
      <div className="min-w-0">
        <p className="truncate text-sm sm:text-base font-black text-white">
          #{entry.rank} {entry.name}
        </p>
        <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {entry.phoneNumber ?? "Participant"}
        </p>
      </div>
      <p className="shrink-0 text-lg sm:text-xl font-black text-indigo-300">{entry.score}</p>
    </div>
  );
});

type StudentSessionEndedProps = {
  code?: string;
  title: string;
  participantName?: string;
  phoneNumber?: string | null;
  participantSummary?: ParticipantSummary;
  leaderboard?: LeaderboardEntry[];
};

export function StudentSessionEnded({
  code,
  title,
  participantName,
  phoneNumber,
  participantSummary,
  leaderboard,
}: StudentSessionEndedProps) {
  const fullyCorrectAnswers = participantSummary?.fullyCorrectAnswers ?? participantSummary?.correctAnswers ?? 0;
  const partiallyCorrectAnswers = participantSummary?.partiallyCorrectAnswers ?? 0;
  const correctParts = participantSummary?.correctParts ?? fullyCorrectAnswers;
  const totalParts = participantSummary?.totalParts ?? participantSummary?.correctAnswers ?? 0;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-[#0f172a] p-4 text-white sm:p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute left-1/3 top-1/4 h-56 w-56 rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-3 shrink-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-gradient-to-br from-indigo-500 to-blue-600 text-xl font-black shadow-2xl shadow-indigo-500/20 sm:h-14 sm:w-14 sm:rounded-[1.4rem] sm:text-2xl">
            Q
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black tracking-tight sm:text-2xl">{title}</p>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300 sm:text-xs">
              Session completed
            </p>
          </div>
        </div>

        {code ? (
          <div className="shrink-0 rounded-[1.2rem] border border-white/10 bg-white/5 px-2.5 py-1.5 text-right backdrop-blur-xl sm:rounded-[1.5rem] sm:px-4 sm:py-3">
            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.22em] text-indigo-300">Code</p>
            <p className="mt-0.5 text-xl sm:text-3xl font-black tracking-tight text-white">{code}</p>
          </div>
        ) : null}
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-start py-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] border-2 border-emerald-400/50 bg-emerald-500/15 shadow-[0_0_80px_rgba(16,185,129,0.18)] sm:h-24 sm:w-24">
            <Award className="h-8 w-8 text-emerald-400 sm:h-12 sm:w-12" />
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight leading-none sm:mt-6 sm:text-5xl">
            Congratulations!
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-xs sm:text-base font-medium leading-relaxed text-slate-300">
            {participantName ? `${participantName}, ` : ""}
            thank you for participating in this interactive session. The host has ended the quiz and your responses have been recorded successfully.
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-indigo-300 backdrop-blur-xl sm:mt-6 sm:px-5 sm:text-xs">
            <Sparkles size={10} />
            Thank you for participating
          </div>

          <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-3 sm:p-4 text-left backdrop-blur-xl min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Participant</p>
              <p className="mt-2 text-sm sm:text-base md:text-lg font-black text-white truncate">{participantName ?? "Guest Player"}</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-3 sm:p-4 text-left backdrop-blur-xl min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Phone Number</p>
              <p className="mt-2 text-sm sm:text-base md:text-lg font-black text-white break-words">{phoneNumber ?? "Not available"}</p>
            </div>
            <div className="rounded-[1.6rem] border border-indigo-400/20 bg-indigo-500/10 p-3 sm:p-4 text-left backdrop-blur-xl">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-indigo-300">Final Rank</p>
              <p className="mt-2 text-xl sm:text-2xl font-black text-white">
                {participantSummary ? `#${participantSummary.rank}` : "--"}
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-emerald-400/20 bg-emerald-500/10 p-3 sm:p-4 text-left backdrop-blur-xl">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Final Score</p>
              <p className="mt-2 text-xl sm:text-2xl font-black text-white">{participantSummary?.score ?? 0}</p>
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3 grid gap-2 sm:gap-3 sm:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.6rem] border border-amber-400/20 bg-amber-500/10 p-3 sm:p-4 text-left backdrop-blur-xl">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">Answer Accuracy</p>
              <p className="mt-2 text-xl sm:text-2xl font-black text-white">
                {totalParts > 0 ? `${correctParts}/${totalParts}` : `${fullyCorrectAnswers}`}
              </p>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-amber-100/90">
                {fullyCorrectAnswers} fully correct
                {partiallyCorrectAnswers > 0 ? `, ${partiallyCorrectAnswers} partial` : ""}
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-3 sm:p-4 text-left backdrop-blur-xl">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Next Step</p>
              <p className="mt-2 text-xs sm:text-sm font-semibold leading-relaxed text-slate-200">
                Final results and leaderboard updates can now be shared by the organizer. You can safely close this tab.
              </p>
            </div>
          </div>

          {leaderboard && leaderboard.length > 0 ? (
            <div className="mt-4 rounded-[1.8rem] border border-white/10 bg-white/5 p-4 text-left backdrop-blur-xl">
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400 animate-pulse" />
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-300">Top Participants</p>
              </div>
              <div className="space-y-2">
                {leaderboard.slice(0, 3).map((entry) => (
                  <LeaderboardRow key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
