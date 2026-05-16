import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Award, CheckCircle2, Timer, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useSession } from "../../context/SessionContext";
import { getPublicSession, participantStorageKey, submitParticipantAnswer } from "../../api/liveSessionApi";
import { toast } from "sonner";
import { StudentSessionEnded } from "./StudentSessionEnded";

const SORTING_DND_TYPE = "sorting-item";

function shuffleArray(items: string[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function sortingOrderStorageKey(code: string, questionId: string | number) {
  return `sorting-order:${code.toUpperCase()}:${questionId}`;
}

function SortableSortingRow({
  item,
  index,
  hasSubmitted,
  onMove,
}: {
  item: string;
  index: number;
  hasSubmitted: boolean;
  onMove: (fromIndex: number, toIndex: number) => void;
}) {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: SORTING_DND_TYPE,
      item: { index },
      canDrag: !hasSubmitted,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [hasSubmitted, index]
  );

  const [, dropRef] = useDrop(
    () => ({
      accept: SORTING_DND_TYPE,
      hover: (dragged: { index: number }) => {
        if (dragged.index === index || hasSubmitted) {
          return;
        }

        onMove(dragged.index, index);
        dragged.index = index;
      },
    }),
    [hasSubmitted, index, onMove]
  );

  return (
    <div
      ref={(node) => {
        dragRef(dropRef(node));
      }}
      className={`flex items-center gap-3 rounded-2xl border-2 border-gray-100 bg-white p-4 transition-all ${
        isDragging ? "scale-[0.99] opacity-60 shadow-lg" : ""
      } ${hasSubmitted ? "" : "cursor-grab active:cursor-grabbing"}`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
        {index + 1}
      </div>
      <div className="flex-1 font-bold text-gray-800">{item}</div>
      <div className="rounded-xl bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
        Drag
      </div>
    </div>
  );
}

export function StudentQuestion() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentSession, setSession } = useSession();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sortingItems, setSortingItems] = useState<string[]>([]);
  const [labelAnswers, setLabelAnswers] = useState<Record<string, string>>({});
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
  const totalQuestions = currentSession ? currentSession.questionCount ?? currentSession.questions.length : 0;
  const currentQuestionResponse = currentSession?.currentQuestionResponse ?? null;
  const hasAnswerReveal =
    currentSession?.status === "results" ||
    currentSession?.status === "leaderboard" ||
    currentSession?.status === "ended";

  const hydrateLocalQuestionState = () => {
    if (!currentQuestion) {
      return;
    }

    setSelectedOption(null);
    if (currentQuestion.questionType === "sorting") {
      const fallbackItems = currentQuestion.items ? [...currentQuestion.items] : [];
      const storageKey = code ? sortingOrderStorageKey(code, currentQuestion.id) : "";
      let nextSortingItems = fallbackItems;

      if (storageKey) {
        const storedOrder = sessionStorage.getItem(storageKey);
        if (storedOrder) {
          try {
            const parsedOrder = JSON.parse(storedOrder) as string[];
            if (Array.isArray(parsedOrder) && parsedOrder.length === fallbackItems.length) {
              nextSortingItems = parsedOrder;
            }
          } catch {
            nextSortingItems = fallbackItems;
          }
        } else if (fallbackItems.length > 1) {
          nextSortingItems = shuffleArray(fallbackItems);
          sessionStorage.setItem(storageKey, JSON.stringify(nextSortingItems));
        }
      }

      setSortingItems(nextSortingItems);
    } else {
      setSortingItems(currentQuestion.items ? [...currentQuestion.items] : []);
    }
    setLabelAnswers(
      Object.fromEntries((currentQuestion.labels ?? []).map((label) => [label.id, ""]))
    );
    setHasSubmitted(false);
    setHasRecordedTimeout(false);
    setIsFinished(false);
  };

  const submitAnswer = async (optionIndex: number | null, markAsSubmitted = true) => {
    if (!code || !currentQuestion) {
      return;
    }

    const storedParticipant = sessionStorage.getItem(participantStorageKey(code));
    if (!storedParticipant) {
      toast.error("Participant session not found. Please join again.");
      navigate("/join");
      return;
    }

    const parsedParticipant = JSON.parse(storedParticipant) as { token: string };
    let responseData: { items?: string[]; labels?: Record<string, string> } | null = null;

    if (currentQuestion.questionType === "sorting") {
      responseData = { items: sortingItems };
      optionIndex = null;
    } else if (currentQuestion.questionType === "label_image") {
      responseData = { labels: labelAnswers };
      optionIndex = null;
    }

    setIsSubmitting(true);

    try {
      await submitParticipantAnswer({
        participantToken: parsedParticipant.token,
        questionId: currentQuestion.id,
        selectedOptionIndex: optionIndex,
        responseData,
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

    const storedParticipant = sessionStorage.getItem(participantStorageKey(code));
    if (!storedParticipant) {
      navigate(`/join/${code}`, { replace: true });
      return;
    }

    const participantToken = (() => {
      try {
        return (JSON.parse(storedParticipant) as { token?: string }).token ?? "";
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
    hydrateLocalQuestionState();
  }, [currentSession?.currentQuestionId]);

  useEffect(() => {
    if (!currentQuestionResponse) {
      return;
    }

    if (currentQuestion.questionType === "multiple_choice") {
      setSelectedOption(currentQuestionResponse.selectedOptionIndex);
    } else if (currentQuestion.questionType === "sorting") {
      setSortingItems(currentQuestionResponse.responseData?.items ?? currentQuestion.items ?? []);
    } else if (currentQuestion.questionType === "label_image") {
      setLabelAnswers(currentQuestionResponse.responseData?.labels ?? {});
    }

    setHasSubmitted(true);
    setHasRecordedTimeout(currentQuestionResponse.selectedOptionIndex === null && !currentQuestionResponse.responseData);
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
  }, [currentQuestion, currentQuestionResponse, currentSession, hasRecordedTimeout, hasSubmitted, isSubmitting, timeLeft]);

  if (!currentSession) {
    return null;
  }

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

  if (!currentQuestion) {
    return null;
  }

  const handleSubmit = async () => {
    if (currentQuestion.questionType === "multiple_choice") {
      if (selectedOption === null) {
        return;
      }

      await submitAnswer(selectedOption);
      return;
    }

    if (currentQuestion.questionType === "sorting") {
      if (!sortingItems.length || sortingItems.some((item) => !item.trim())) {
        toast.error("Please complete the order before submitting.");
        return;
      }

      await submitAnswer(null);
      return;
    }

    if (currentQuestion.questionType === "label_image") {
      const isAnyAnswerFilled = Object.values(labelAnswers).some((answer) => answer.trim());
      if (!isAnyAnswerFilled) {
        toast.error("Please label at least one marker before submitting.");
        return;
      }

      await submitAnswer(null);
    }
  };

  const isCorrect =
    currentQuestion.questionType === "multiple_choice"
      ? hasAnswerReveal && selectedOption !== null && selectedOption === currentQuestion.correctAnswer
      : Boolean(currentQuestionResponse?.isCorrect || (hasSubmitted && hasAnswerReveal));
  const showRevealResult = hasSubmitted && hasAnswerReveal;
  const timedOutWithoutAnswer = hasRecordedTimeout && !hasSubmitted;
  const hasSubmittedAnswer = hasSubmitted || Boolean(currentQuestionResponse);
  const waitingForReveal = hasSubmittedAnswer && !hasAnswerReveal && !timedOutWithoutAnswer;

  const moveSortingItemByDrag = (fromIndex: number, toIndex: number) => {
    setSortingItems((prev) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];
      const [movedItem] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, movedItem);

      if (code && currentQuestion.questionType === "sorting") {
        sessionStorage.setItem(sortingOrderStorageKey(code, currentQuestion.id), JSON.stringify(next));
      }

      return next;
    });
  };

  const renderQuestionBody = () => {
    if (currentQuestion.questionType === "sorting") {
      return (
        <DndProvider backend={HTML5Backend}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              Press, hold, and drag each step to arrange the correct clinical order.
            </div>
            {(sortingItems ?? []).map((item, index) => (
              <SortableSortingRow
                key={`${item}-${index}`}
                item={item}
                index={index}
                hasSubmitted={hasSubmitted}
                onMove={moveSortingItemByDrag}
              />
            ))}
          </div>
        </DndProvider>
      );
    }

    if (currentQuestion.questionType === "label_image") {
      return (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-gray-50 p-4">
            <div className="relative mx-auto aspect-[4/3] max-w-xl overflow-hidden rounded-[1.5rem] bg-white">
              {currentQuestion.mediaUrl ? (
                <img src={currentQuestion.mediaUrl} alt="Question reference" className="h-full w-full object-cover" />
              ) : null}
              {(currentQuestion.labels ?? []).map((label) => (
                <div
                  key={label.id}
                  className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-blue-800 bg-blue-600 text-sm font-black text-white shadow-lg"
                  style={{ left: `${label.x}%`, top: `${label.y}%` }}
                >
                  {label.marker}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(currentQuestion.labels ?? []).map((label) => (
              <div key={label.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                <label className="mb-2 block text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                  Marker {label.marker}
                </label>
                <p className="mb-3 text-sm font-semibold text-gray-500">{label.prompt}</p>
                <input
                  type="text"
                  value={labelAnswers[label.id] ?? ""}
                  onChange={(e) => setLabelAnswers((prev) => ({ ...prev, [label.id]: e.target.value }))}
                  disabled={hasSubmitted}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {currentQuestion.options.map((opt, i) => (
          <button
            key={i}
            disabled={hasSubmitted}
            onClick={() => setSelectedOption(i)}
            className={`group relative flex items-center gap-4 rounded-2xl border-2 p-5 text-left font-bold transition-all ${
              selectedOption === i
                ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                : "border-gray-100 bg-white text-gray-700 hover:border-indigo-200"
            } ${hasSubmitted && selectedOption !== i ? "opacity-50" : ""}`}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              selectedOption === i
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-gray-100 bg-gray-50 text-gray-400 group-hover:border-indigo-200"
            }`}>
              {String.fromCharCode(65 + i)}
            </div>
            {opt}
          </button>
        ))}
      </div>
    );
  };

  const renderRevealMessage = () => {
    if (showRevealResult) {
      if (currentQuestion.questionType === "multiple_choice") {
        return isCorrect
          ? "Your answer has been recorded."
          : currentQuestion.correctAnswer !== undefined
            ? "The correct answer was " + String.fromCharCode(65 + currentQuestion.correctAnswer)
            : "Waiting for the host to reveal the correct answer...";
      }

      if (currentQuestion.questionType === "sorting") {
        return isCorrect
          ? "Excellent ordering. Your sequence matched the correct clinical flow."
          : "Your sequence has been checked. Review the correct order on the shared screen.";
      }

      return isCorrect
        ? "Great labeling. Your image responses were recorded successfully."
        : "Your labels were checked. Review the correct markers on the shared screen.";
    }

    if (waitingForReveal) {
      return "Your answer has been submitted. Wait for others to submit and for the host to reveal the result.";
    }

    if (timedOutWithoutAnswer) {
      if (currentQuestion.questionType === "multiple_choice" && selectedOption !== null) {
        return "You selected an option, but it was recorded as unanswered because Confirm Answer was not clicked in time.";
      }

      return "No response was submitted before time ran out, so this question was recorded as unanswered.";
    }

    return "Wait for others to submit the answer. Wait for answer reveal.";
  };

  return (
    <div className="flex min-h-[500px] flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            {currentSession.currentQuestionIndex + 1}
          </div>
          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-gray-500">Question</span>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-500">
              {currentQuestion.questionType.replace(/_/g, " ")}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 rounded-full px-3 py-1 font-bold ${
          timeLeft < 5 ? "animate-pulse bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"
        }`}>
          <Timer size={16} />
          <span>{timeLeft}s</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-6">
        {!isFinished ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <h2 className="mb-3 text-xl font-black leading-tight text-gray-900">{currentQuestion.text}</h2>
              {currentQuestion.instructions ? (
                <p className="mb-6 text-sm font-semibold text-gray-500">{currentQuestion.instructions}</p>
              ) : null}

              <div className="pb-6">{renderQuestionBody()}</div>
            </div>

            <div className="mt-4 border-t border-gray-100 bg-white pt-4">
              <button
                onClick={handleSubmit}
                disabled={
                  hasSubmitted ||
                  isSubmitting ||
                  (currentQuestion.questionType === "multiple_choice" && selectedOption === null)
                }
                className={`w-full rounded-2xl py-5 font-black text-white shadow-xl transition-all ${
                  hasSubmitted ||
                  isSubmitting ||
                  (currentQuestion.questionType === "multiple_choice" && selectedOption === null)
                    ? "cursor-not-allowed bg-gray-200"
                    : "bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700"
                }`}
              >
                {hasSubmitted ? "Submitted..." : isSubmitting ? "Submitting..." : "Confirm Answer"}
              </button>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-1 flex-col items-center justify-center py-10 text-center"
          >
            <div className={`mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] shadow-2xl ${
              showRevealResult
                ? isCorrect
                  ? "bg-green-100 text-green-600 shadow-green-100"
                  : "bg-red-100 text-red-600 shadow-red-100"
                : timedOutWithoutAnswer
                  ? "bg-amber-100 text-amber-600 shadow-amber-100"
                  : "bg-indigo-100 text-indigo-600 shadow-indigo-100"
            }`}>
              {showRevealResult ? (
                isCorrect ? <CheckCircle2 size={48} strokeWidth={3} /> : <XCircle size={48} strokeWidth={3} />
              ) : (
                <Timer size={48} strokeWidth={3} />
              )}
            </div>

            <h2 className={`mb-2 text-3xl font-black ${
              showRevealResult
                ? isCorrect
                  ? "text-green-600"
                  : "text-red-600"
                : timedOutWithoutAnswer
                  ? "text-amber-600"
                  : "text-indigo-600"
            }`}>
              {showRevealResult ? (isCorrect ? "Correct!" : "Keep Practicing") : timedOutWithoutAnswer ? "Time's Up" : "Answer Submitted"}
            </h2>
            <p className="mb-8 font-bold text-gray-500">{renderRevealMessage()}</p>

            <div className="w-full space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                  <Award size={14} />
                  Current Rank
                </div>
                <span className="text-xl font-black text-gray-900">
                  {currentSession.participantSummary ? `#${currentSession.participantSummary.rank}` : "--"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
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

            <p className="mt-10 animate-pulse text-sm font-bold text-indigo-600">
              {showRevealResult ? "Waiting for the next question..." : "Wait for the next question..."}
            </p>
          </motion.div>
        )}
      </div>

      <div className="mt-auto border-t border-gray-100 bg-gray-50 p-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${((currentSession.currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
