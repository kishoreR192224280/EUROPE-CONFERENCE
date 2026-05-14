import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Timer, CheckCircle2, XCircle, Award } from "lucide-react";
import { motion } from "motion/react";
import { useSession } from "../../context/SessionContext";
import { getPublicSession, participantStorageKey, submitParticipantAnswer } from "../../api/liveSessionApi";
import { toast } from "sonner";
import { StudentSessionEnded } from "./StudentSessionEnded";

export function StudentQuestion() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentSession, setSession } = useSession();
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasRecordedTimeout, setHasRecordedTimeout] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const participantJson = code ? sessionStorage.getItem(participantStorageKey(code)) : null;
  const participant = participantJson
    ? (JSON.parse(participantJson) as { name?: string; phoneNumber?: string | null })
    : null;
  const currentQuestion = currentSession
    ? currentSession.currentQuestion ?? currentSession.questions[currentSession.currentQuestionIndex]
    : null;
  const totalQuestions = currentSession
    ? currentSession.questionCount ?? currentSession.questions.length
    : 0;
  const currentQuestionResponse = currentSession?.currentQuestionResponse ?? null;
  const hasAnswerReveal =
    currentSession?.status === "results" ||
    currentSession?.status === "leaderboard" ||
    currentSession?.status === "ended";

  const submitAnswer = async (optionIndex: number | null, markAsSubmitted = true) => {
    if (!code || !currentQuestion) {
      return;
    }

    const participantJson = sessionStorage.getItem(participantStorageKey(code));
    if (!participantJson) {
      toast.error("Participant session not found. Please join again.");
      navigate("/join");
      return;
    }

    const participant = JSON.parse(participantJson) as { token: string };
    setIsSubmitting(true);

    try {
      await submitParticipantAnswer({
        participantToken: participant.token,
        questionId: currentQuestion.id,
        selectedOptionIndex: optionIndex,
      });
      setHasSubmitted(markAsSubmitted);
      setHasRecordedTimeout(!markAsSubmitted);
      setIsFinished(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!code) {
      return;
    }

    const participant = sessionStorage.getItem(participantStorageKey(code));
    if (!participant) {
      navigate(`/join/${code}`, { replace: true });
      return;
    }

    const participantToken = (() => {
      try {
        return (JSON.parse(participant) as { token?: string }).token ?? "";
      } catch {
        return "";
      }
    })();

    let isMounted = true;

    const loadSession = async () => {
      try {
        const session = await getPublicSession(code, participantToken);
        if (!isMounted) {
          return;
        }

        setSession(session);
        if (session.status === "waiting") {
          navigate(`/join/${code}`);
        }
      } catch {
        // Keep the last rendered state if the poll fails temporarily.
      }
    };

    void loadSession();
    const pollId = window.setInterval(() => {
      void loadSession();
    }, 3000);

    return () => {
      isMounted = false;
      window.clearInterval(pollId);
    };
  }, [code, navigate, setSession]);

  useEffect(() => {
    setSelectedOption(null);
    setHasSubmitted(false);
    setHasRecordedTimeout(false);
    setIsFinished(false);
  }, [currentSession?.currentQuestionId]);

  useEffect(() => {
    if (!currentQuestionResponse) {
      return;
    }

    setSelectedOption(currentQuestionResponse.selectedOptionIndex);
    setHasSubmitted(true);
    setHasRecordedTimeout(currentQuestionResponse.selectedOptionIndex === null);
    setIsFinished(true);
  }, [currentQuestionResponse?.id]);

  useEffect(() => {
    if (!currentSession || !currentQuestion) {
      return;
    }

    if (currentSession.status !== "active") {
      setTimeLeft(0);
      setIsFinished(true);
      return;
    }

    setTimeLeft(currentSession.timeRemainingSeconds ?? currentQuestion.timer);
    const intervalId = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          setIsFinished(true);
        }
        return next;
      });
    }, 1000);

    if ((currentSession.timeRemainingSeconds ?? currentQuestion.timer) === 0) {
      setIsFinished(true);
    }

    return () => window.clearInterval(intervalId);
  }, [currentQuestion, currentSession?.status, currentSession?.timeRemainingSeconds]);

  useEffect(() => {
    if (!currentSession || !currentQuestion || currentSession.status !== "active") {
      return;
    }

    if (currentQuestionResponse) {
      return;
    }

    if (timeLeft > 0 || hasSubmitted || hasRecordedTimeout || isSubmitting) {
      return;
    }

    void submitAnswer(null, false);
  }, [
    currentQuestion,
    currentQuestionResponse,
    currentSession,
    hasRecordedTimeout,
    hasSubmitted,
    isSubmitting,
    timeLeft,
  ]);

  if (!currentSession) return null;

  if (currentSession.status === "ended") {
    return (
      <StudentSessionEnded
        code={code}
        title={currentSession.title}
        participantName={participant?.name}
        phoneNumber={participant?.phoneNumber}
        participantSummary={currentSession.participantSummary}
        leaderboard={currentSession.leaderboard}
      />
    );
  }

  if (!currentQuestion) return null;

  const handleSubmit = async () => {
    if (selectedOption === null) {
      return;
    }
    await submitAnswer(selectedOption);
  };

  const isCorrect =
    hasAnswerReveal && selectedOption !== null && selectedOption === currentQuestion.correctAnswer;
  const showRevealResult = hasSubmitted && hasAnswerReveal;
  const timedOutWithoutAnswer = hasRecordedTimeout && !hasSubmitted;
  const hasSubmittedAnswer = hasSubmitted || Boolean(currentQuestionResponse);
  const waitingForReveal = hasSubmittedAnswer && !hasAnswerReveal && !timedOutWithoutAnswer;

  return (
    <div className="flex flex-col min-h-[500px]">
      <div className="p-6 bg-gray-50 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
            {currentSession.currentQuestionIndex + 1}
          </div>
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Question</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold ${
          timeLeft < 5 ? "bg-red-100 text-red-600 animate-pulse" : "bg-indigo-100 text-indigo-600"
        }`}>
          <Timer size={16} />
          <span>{timeLeft}s</span>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        {!isFinished ? (
          <>
            <h2 className="text-xl font-black text-gray-900 mb-8 leading-tight">
              {currentQuestion.text}
            </h2>

            <div className="grid grid-cols-1 gap-4 mb-8">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  disabled={hasSubmitted}
                  onClick={() => setSelectedOption(i)}
                  className={`relative p-5 text-left rounded-2xl border-2 transition-all font-bold group flex items-center gap-4 ${
                    selectedOption === i 
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600" 
                      : "border-gray-100 bg-white hover:border-indigo-200 text-gray-700"
                  } ${hasSubmitted && selectedOption !== i ? "opacity-50" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                    selectedOption === i 
                      ? "bg-indigo-600 text-white border-indigo-600" 
                      : "bg-gray-50 text-gray-400 border-gray-100 group-hover:border-indigo-200"
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  {opt}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={selectedOption === null || hasSubmitted || isSubmitting}
              className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all mt-auto ${
                selectedOption === null || hasSubmitted || isSubmitting
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
              }`}
            >
              {hasSubmitted ? "Submitted..." : isSubmitting ? "Submitting..." : "Confirm Answer"}
            </button>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center py-10"
          >
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl ${
              showRevealResult
                ? isCorrect
                  ? "bg-green-100 text-green-600 shadow-green-100"
                  : "bg-red-100 text-red-600 shadow-red-100"
                : "bg-amber-100 text-amber-600 shadow-amber-100"
            }`}>
              {showRevealResult ? (
                isCorrect ? <CheckCircle2 size={48} strokeWidth={3} /> : <XCircle size={48} strokeWidth={3} />
              ) : (
                <Timer size={48} strokeWidth={3} />
              )}
            </div>

            <h2
              className={`text-3xl font-black mb-2 ${
                showRevealResult
                  ? isCorrect
                    ? "text-green-600"
                    : "text-red-600"
                  : timedOutWithoutAnswer
                    ? "text-amber-600"
                    : "text-indigo-600"
              }`}
            >
              {showRevealResult
                ? (isCorrect ? "Correct!" : "Nice Try!")
                : timedOutWithoutAnswer
                  ? "Time's Up"
                  : waitingForReveal
                    ? "Answer Submitted"
                    : "Time's Up"}
            </h2>
            <p className="text-gray-500 font-bold mb-8">
              {showRevealResult
                ? isCorrect
                  ? "Your answer has been recorded."
                  : currentQuestion.correctAnswer !== undefined
                    ? "The correct answer was " + String.fromCharCode(65 + currentQuestion.correctAnswer)
                    : "Waiting for the host to reveal the correct answer..."
                : waitingForReveal
                  ? "Your answer has been submitted. Wait for others to submit and for the host to reveal the result."
                  : timedOutWithoutAnswer
                  ? selectedOption !== null
                    ? "You selected an option, but it was recorded as unanswered because Confirm Answer was not clicked in time."
                    : "No option was submitted before time ran out, so this question was recorded as unanswered."
                  : "Wait for others to submit the answer. Wait for answer reveal."}
            </p>

            <div className="w-full bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
                  <Award size={14} />
                  Current Rank
                </div>
                <span className="text-xl font-black text-gray-900">
                  {currentSession.participantSummary ? `#${currentSession.participantSummary.rank}` : "--"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
                  <Timer size={14} />
                  Time Taken
                </div>
                <span className="text-xl font-black text-gray-900">
                  {currentSession.participantSummary?.totalResponseTimeMs
                    ? `${(currentSession.participantSummary.totalResponseTimeMs / 1000).toFixed(1)}s`
                    : "Live"}
                </span>
              </div>
            </div>

            <p className="mt-10 text-sm font-bold text-indigo-600 animate-pulse">
              {showRevealResult ? "Waiting for the next question..." : "Wait for the next question..."}
            </p>
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-gray-50 mt-auto border-t border-gray-100">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500" 
            style={{ width: `${((currentSession.currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
