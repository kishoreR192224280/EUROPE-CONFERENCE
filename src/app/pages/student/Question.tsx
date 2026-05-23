import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Award, CheckCircle2, ChevronDown, ChevronUp, Search, Timer, WifiOff, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useSession } from "../../context/SessionContext";
import {
  getPublicSession,
  participantSocketStorageKey,
  participantStorageKey,
  parseParticipantRecord,
  submitParticipantAnswer,
} from "../../api/liveSessionApi";
import { toast } from "sonner";
import { StudentSessionEnded } from "./StudentSessionEnded";
import { useParticipantSessionSocket } from "../../hooks/useParticipantSessionSocket";
import { useSingleParticipantTab } from "../../hooks/useSingleParticipantTab";

const SORTING_DND_TYPE = "sorting-item";

function getPrimaryLabelAnswer(label: { acceptedAnswers?: string[]; prompt: string; marker: number }) {
  return label.acceptedAnswers?.find((answer) => answer.trim())?.trim() || label.prompt || `Item ${label.marker}`;
}

function getMatchingOptionLabel(
  pair: { rightText?: string; rightImageUrl?: string },
  fallbackIndex?: number
) {
  const text = pair.rightText?.trim();
  if (text) {
    return text;
  }

  if (typeof fallbackIndex === "number") {
    return `Image option ${String.fromCharCode(65 + fallbackIndex)}`;
  }

  return pair.rightImageUrl ? "Image option" : "Option";
}

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

function matchingOrderStorageKey(code: string, questionId: string | number) {
  return `matching-order:${code.toUpperCase()}:${questionId}`;
}

function SortableSortingRow({
  item,
  index,
  hasSubmitted,
  onMove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  item: string;
  index: number;
  hasSubmitted: boolean;
  onMove: (fromIndex: number, toIndex: number) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
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
      className={`flex items-center gap-3 rounded-2xl border-2 border-gray-100 bg-white p-3.5 sm:p-4 transition-all ${
        isDragging ? "scale-[0.99] opacity-60 shadow-lg" : ""
      } ${hasSubmitted ? "" : "cursor-grab active:cursor-grabbing"}`}
    >
      <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs sm:text-sm font-black text-white">
        {index + 1}
      </div>
      <div className="flex-1 font-bold text-gray-800 text-sm sm:text-base min-w-0 break-words">{item}</div>
      {!hasSubmitted && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={isFirst}
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp?.();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 transition hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50"
            aria-label="Move Up"
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown?.();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 transition hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50"
            aria-label="Move Down"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      )}
      <div className="hidden sm:block rounded-xl bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600 shrink-0">
        Drag
      </div>
    </div>
  );
}

export function StudentQuestion() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentSession, setSession, clearSession } = useSession();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sortingItems, setSortingItems] = useState<string[]>([]);
  const [labelAnswers, setLabelAnswers] = useState<Record<string, string>>({});
  const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});
  const [matchingOptionOrder, setMatchingOptionOrder] = useState<string[]>([]);
  const [matchingPreviewImage, setMatchingPreviewImage] = useState<{ src: string; title: string } | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasRecordedTimeout, setHasRecordedTimeout] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccessRevoked, setIsAccessRevoked] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const participantJson = code ? sessionStorage.getItem(participantStorageKey(code)) : null;
  const participant = useMemo(() => parseParticipantRecord(participantJson), [participantJson]);

  const revokeParticipantAccess = () => {
    if (!code) {
      return;
    }

    setIsAccessRevoked(true);
    sessionStorage.removeItem(participantStorageKey(code));
    sessionStorage.removeItem(participantSocketStorageKey(code));
    clearSession();
    navigate(`/join/${code}/expired`, { replace: true });
  };

  const expireConnection = () => {
    if (!code) {
      return;
    }

    setIsAccessRevoked(true);
    sessionStorage.removeItem(participantStorageKey(code));
    sessionStorage.removeItem(participantSocketStorageKey(code));
    clearSession();
    navigate(`/join/${code}/expired?reason=connection`, { replace: true });
  };

  useSingleParticipantTab({
    code,
    participant,
    sessionId: currentSession?.id ?? null,
    enabled: Boolean(code && participant && currentSession?.id !== undefined && currentSession?.id !== null),
    onDuplicate: revokeParticipantAccess,
  });

  const participantSocket = useParticipantSessionSocket({
    code,
    participant,
    sessionId: currentSession?.id ?? null,
    enabled: Boolean(code && participant && currentSession?.id !== undefined && currentSession?.id !== null),
    onForceLogout: revokeParticipantAccess,
    onConnectionExpired: expireConnection,
    onSessionUpdate: () => setReloadTrigger((prev) => prev + 1),
  });

  const currentQuestion = currentSession?.currentQuestion ?? null;
  const totalQuestions = currentSession ? currentSession.questionCount ?? currentSession.questions.length : 0;
  const currentQuestionResponse = currentSession?.currentQuestionResponse ?? null;
  const hasAnswerReveal =
    currentSession?.status === "results" ||
    currentSession?.status === "leaderboard" ||
    currentSession?.status === "ended";
  const isSessionPaused = currentSession?.status === "paused";

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
    if (currentQuestion.questionType === "matching") {
      const pairs = currentQuestion.matchingPairs ?? [];
      const pairIds = pairs.map((pair) => pair.id);
      const storageKey = code ? matchingOrderStorageKey(code, currentQuestion.id) : "";
      let nextOrder = pairIds;

      if (storageKey) {
        const storedOrder = sessionStorage.getItem(storageKey);
        if (storedOrder) {
          try {
            const parsedOrder = JSON.parse(storedOrder) as string[];
            const isValidOrder =
              Array.isArray(parsedOrder) &&
              parsedOrder.length === pairIds.length &&
              pairIds.every((pairId) => parsedOrder.includes(pairId));

            if (isValidOrder) {
              nextOrder = parsedOrder;
            }
          } catch {
            nextOrder = pairIds;
          }
        } else if (pairIds.length > 1) {
          nextOrder = shuffleArray(pairIds);
          sessionStorage.setItem(storageKey, JSON.stringify(nextOrder));
        }
      }

      setMatchingOptionOrder(nextOrder);
      setMatchingSelections(Object.fromEntries(pairIds.map((pairId) => [pairId, ""])));
    } else {
      setMatchingOptionOrder([]);
      setMatchingSelections({});
    }
    setSelectedLabelId(currentQuestion.labels?.[0]?.id ?? null);
    setIsLabelDialogOpen(false);
    setMatchingPreviewImage(null);
    setHasSubmitted(false);
    setHasRecordedTimeout(false);
    setIsFinished(false);
  };

  const submitAnswer = async (optionIndex: number | null, markAsSubmitted = true) => {
    if (!code || !currentQuestion || isAccessRevoked) {
      return;
    }

    if (!participantSocket.isConnected) {
      toast.error("Trying to reconnect. Please wait before submitting.");
      return;
    }

    const storedParticipant = sessionStorage.getItem(participantStorageKey(code));
    if (!storedParticipant) {
      toast.error("Participant session not found. Please join again.");
      navigate(`/join/${code}`, { replace: true });
      return;
    }

    const parsedParticipant = parseParticipantRecord(storedParticipant);
    if (!parsedParticipant?.token) {
      toast.error("Participant session not found. Please join again.");
      navigate(`/join/${code}`, { replace: true });
      return;
    }
    let responseData: { items?: string[]; labels?: Record<string, string>; matches?: Record<string, string> } | null = null;

    if (currentQuestion.questionType === "sorting" && markAsSubmitted) {
      responseData = { items: sortingItems };
      optionIndex = null;
    } else if (currentQuestion.questionType === "sorting") {
      optionIndex = null;
    } else if (currentQuestion.questionType === "label_image" && markAsSubmitted) {
      responseData = { labels: labelAnswers };
      optionIndex = null;
    } else if (currentQuestion.questionType === "label_image") {
      optionIndex = null;
    } else if (currentQuestion.questionType === "matching" && markAsSubmitted) {
      responseData = { matches: matchingSelections };
      optionIndex = null;
    } else if (currentQuestion.questionType === "matching") {
      optionIndex = null;
    }

    setIsSubmitting(true);

    try {
      const selectedOptionId =
        currentQuestion.questionType === "multiple_choice" && optionIndex !== null
          ? currentQuestion.optionIds?.[optionIndex] ?? null
          : null;
      const answer = await submitParticipantAnswer({
        participantToken: parsedParticipant.token,
        questionId: currentQuestion.id,
        selectedOptionIndex: optionIndex,
        selectedOptionId,
        socketId: sessionStorage.getItem(participantSocketStorageKey(code)),
        responseData,
      });
      const recordedAsTimeout = Boolean(answer.timedOut || answer.deadlineExpired);
      setHasSubmitted(markAsSubmitted && !recordedAsTimeout);
      setHasRecordedTimeout(!markAsSubmitted || recordedAsTimeout);
      setIsFinished(true);
      
      if (!recordedAsTimeout && markAsSubmitted) {
        participantSocket.emit("student:answer-submitted", {
          participantId: parsedParticipant.id,
          questionId: currentQuestion.id,
        });
      }

      if (recordedAsTimeout) {
        toast.error("Time expired before your answer reached the server. This question was recorded as unanswered.");
      }
    } catch (err) {
      if ((err as Error & { code?: string }).code === "ANSWER_ALREADY_SUBMITTED") {
        setHasSubmitted(true);
        setIsFinished(true);
        toast.info("Your answer was already submitted for this question.");
        return;
      }

      if ((err as Error & { code?: string }).code === "QUESTION_NOT_ACTIVE") {
        toast.info("The host has moved to another question. Loading the current session state...");
        try {
          const refreshedSession = await getPublicSession(code, parsedParticipant.token);
          setSession(refreshedSession);
          if (refreshedSession.status === "waiting") {
            navigate(`/join/${code}`, { replace: true });
          }
        } catch {
          // Keep the current UI if recovery polling fails; the normal poll will retry.
        }
        return;
      }

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
    }, 20000);

    return () => {
      isMounted = false;
      window.clearInterval(pollId);
    };
  }, [code, navigate, setSession, reloadTrigger]);

  useEffect(() => {
    hydrateLocalQuestionState();
  }, [currentSession?.currentQuestionId]);

  useEffect(() => {
    if (!currentQuestionResponse) {
      return;
    }

    if (currentQuestion.questionType === "multiple_choice") {
      const selectedOptionIndexFromId =
        currentQuestionResponse.selectedOptionId && currentQuestion.optionIds
          ? currentQuestion.optionIds.findIndex((optionId) => optionId === currentQuestionResponse.selectedOptionId)
          : -1;
      setSelectedOption(
        selectedOptionIndexFromId >= 0
          ? selectedOptionIndexFromId
          : currentQuestionResponse.selectedOptionIndex
      );
    } else if (currentQuestion.questionType === "sorting") {
      setSortingItems(currentQuestionResponse.responseData?.items ?? currentQuestion.items ?? []);
    } else if (currentQuestion.questionType === "label_image") {
      setLabelAnswers(currentQuestionResponse.responseData?.labels ?? {});
      setSelectedLabelId(currentQuestion.labels?.[0]?.id ?? null);
      setIsLabelDialogOpen(false);
    } else if (currentQuestion.questionType === "matching") {
      setMatchingSelections(currentQuestionResponse.responseData?.matches ?? {});
    }

    setHasSubmitted(true);
    setHasRecordedTimeout(currentQuestionResponse.selectedOptionIndex === null && !currentQuestionResponse.responseData);
    setIsFinished(true);
  }, [currentQuestionResponse?.id]);

  useEffect(() => {
    if (!currentSession || !currentQuestion) {
      return;
    }

    if (currentSession.status === "paused") {
      setTimeLeft(currentSession.timeRemainingSeconds ?? currentQuestion.timer);
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
    if (!participantSocket.isConnected) {
      toast.error("Trying to reconnect. Please wait before submitting.");
      return;
    }

    if (isSessionPaused) {
      toast.info("The host paused the quiz. Your timer is safe.");
      return;
    }

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
      const labels = currentQuestion.labels ?? [];
      const hasAllAnswersFilled =
        labels.length > 0 &&
        labels.every((label) => (labelAnswers[label.id] ?? "").trim().length > 0);
      if (!hasAllAnswersFilled) {
        toast.error("Please fill in all labels before submitting.");
        return;
      }

      await submitAnswer(null);
      return;
    }

    if (currentQuestion.questionType === "matching") {
      const pairs = currentQuestion.matchingPairs ?? [];
      const hasAllMatches = pairs.length > 0 && pairs.every((pair) => (matchingSelections[pair.id] ?? "").trim().length > 0);
      if (!hasAllMatches) {
        toast.error("Please complete all matches before submitting.");
        return;
      }

      await submitAnswer(null);
    }
  };

  const showRevealResult = hasSubmitted && hasAnswerReveal;
  const timedOutWithoutAnswer = hasRecordedTimeout && !hasSubmitted;
  const hasSubmittedAnswer = hasSubmitted || Boolean(currentQuestionResponse);
  const waitingForReveal = hasSubmittedAnswer && !hasAnswerReveal && !timedOutWithoutAnswer;
  const labelResultMap = currentQuestionResponse?.responseData?.labelResults ?? {};
  const labelResultValues = Object.values(labelResultMap);
  const labelCorrectCount = labelResultValues.filter((result) => result.isCorrect).length;
  const labelTotalCount = labelResultValues.length;
  const matchingResultMap = currentQuestionResponse?.responseData?.matchingResults ?? {};
  const matchingResultValues = Object.values(matchingResultMap);
  const matchingCorrectCount = matchingResultValues.filter((result) => result.isCorrect).length;
  const matchingTotalCount = matchingResultValues.length;
  const isCorrect =
    currentQuestion.questionType === "multiple_choice"
      ? hasAnswerReveal && selectedOption !== null && selectedOption === currentQuestion.correctAnswer
      : currentQuestion.questionType === "sorting"
        ? Boolean(currentQuestionResponse?.isCorrect)
        : currentQuestion.questionType === "matching"
          ? matchingTotalCount > 0 && matchingCorrectCount === matchingTotalCount
          : labelTotalCount > 0 && labelCorrectCount === labelTotalCount;

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
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-emerald-700 leading-normal">
              Press buttons or drag each step to arrange the correct order.
            </div>
            {(sortingItems ?? []).map((item, index) => (
              <SortableSortingRow
                key={`${item}-${index}`}
                item={item}
                index={index}
                hasSubmitted={hasSubmitted}
                onMove={moveSortingItemByDrag}
                onMoveUp={() => moveSortingItemByDrag(index, index - 1)}
                onMoveDown={() => moveSortingItemByDrag(index, index + 1)}
                isFirst={index === 0}
                isLast={index === (sortingItems?.length ?? 0) - 1}
              />
            ))}
          </div>
        </DndProvider>
      );
    }

    if (currentQuestion.questionType === "label_image") {
      const labels = [...(currentQuestion.labels ?? [])].sort((a, b) => a.marker - b.marker);
      const selectedLabel = labels.find((label) => label.id === selectedLabelId) ?? labels[0] ?? null;
      const filledLabelsCount = labels.filter((label) => (labelAnswers[label.id] ?? "").trim()).length;

      return (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-gray-50 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm font-black uppercase tracking-[0.18em] text-blue-600">Image Reference</p>
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500">Tap numbered marker to label.</p>
              </div>
              <div className="rounded-full bg-white px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.16em] text-blue-700 shadow-sm shrink-0">
                {filledLabelsCount}/{labels.length} filled
              </div>
            </div>
            <div className="relative mx-auto aspect-[4/3] max-w-xl overflow-hidden rounded-[1.5rem] bg-white">
              {currentQuestion.mediaUrl ? (
                <img src={currentQuestion.mediaUrl} alt="Question reference" className="h-full w-full object-contain" />
              ) : null}
              {labels.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  disabled={hasSubmitted}
                  onClick={() => {
                    setSelectedLabelId(label.id);
                  }}
                  className={`absolute flex h-8 w-8 sm:h-10 sm:w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs sm:text-sm font-black text-white shadow-lg transition-all ${
                    selectedLabelId === label.id
                      ? "border-blue-950 bg-blue-700 ring-4 ring-blue-100 scale-105"
                      : "border-blue-800 bg-blue-600"
                  } ${hasSubmitted ? "cursor-default" : "cursor-pointer hover:scale-105"}`}
                  style={{ left: `${label.x}%`, top: `${label.y}%` }}
                >
                  {label.marker}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-gray-100 bg-white p-3.5 sm:p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => {
                const hasValue = Boolean((labelAnswers[label.id] ?? "").trim());
                const labelResult = labelResultMap[label.id];
                return (
                  <button
                    key={label.id}
                    type="button"
                    disabled={hasSubmitted}
                    onClick={() => {
                      setSelectedLabelId(label.id);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                      hasAnswerReveal && hasSubmittedAnswer
                        ? labelResult?.isCorrect
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-700"
                        : hasValue
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-gray-50 text-gray-700"
                    } ${selectedLabelId === label.id ? "ring-2 ring-blue-200" : ""} disabled:cursor-default`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white">
                      {label.marker}
                    </span>
                    <span>{hasValue ? labelAnswers[label.id] : `Item ${label.marker}`}</span>
                  </button>
                );
              })}
            </div>
            {!hasAnswerReveal ? (
              <p className="mt-3 text-center text-xs font-semibold text-gray-500">
                {filledLabelsCount === labels.length
                  ? "All labels are filled. You can confirm your answer now."
                  : "Tap a marker to fill in its label."}
              </p>
            ) : null}
          </div>

          {selectedLabel ? (
            <div className="rounded-[2rem] border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-blue-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white shrink-0">
                    {selectedLabel.marker}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600 leading-none">
                      Labeling Item {selectedLabel.marker}
                    </p>
                    <p className="text-[10px] font-semibold text-gray-500 mt-1">
                      Enter the label for this marker.
                    </p>
                  </div>
                </div>
                {labels.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = labels.findIndex((l) => l.id === selectedLabel.id);
                      const nextIndex = (currentIndex + 1) % labels.length;
                      setSelectedLabelId(labels[nextIndex].id);
                    }}
                    className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm border border-blue-100 hover:bg-blue-50 transition"
                  >
                    Next Marker
                  </button>
                )}
              </div>

              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  value={labelAnswers[selectedLabel.id] ?? ""}
                  onChange={(e) => setLabelAnswers((prev) => ({ ...prev, [selectedLabel.id]: e.target.value }))}
                  disabled={hasSubmitted}
                  placeholder={`Answer for item ${selectedLabel.marker}...`}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
                {hasAnswerReveal ? (
                  <div className="space-y-1 text-xs font-semibold text-gray-500 pt-1">
                    <p>
                      Correct label: <span className="font-black text-gray-700">{getPrimaryLabelAnswer(selectedLabel)}</span>
                    </p>
                    <p className={labelResultMap[selectedLabel.id]?.isCorrect ? "text-emerald-600" : "text-rose-600"}>
                      {labelResultMap[selectedLabel.id]?.isCorrect
                        ? "✓ Matches the answer key."
                        : "✗ Does not match the answer key."}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] font-medium text-gray-400">
                    Type and then tap another marker or click "Next Marker" to continue.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    if (currentQuestion.questionType === "matching") {
      const pairs = currentQuestion.matchingPairs ?? [];
      const pairMap = Object.fromEntries(pairs.map((pair) => [pair.id, pair]));
      const orderedRightPairs = matchingOptionOrder
        .map((pairId) => pairMap[pairId])
        .filter(Boolean);

      return (
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-violet-100 bg-violet-50 p-3.5 text-xs sm:text-sm font-semibold text-violet-700 leading-normal">
            Match every item on the left with the best option on the right.
          </div>

          <div className="space-y-3">
            {(pairs ?? []).map((pair, index) => {
              const selectedRightId = matchingSelections[pair.id] ?? "";
              const selectedRightPair = pairs.find((candidate) => candidate.id === selectedRightId);
              const result = matchingResultMap[pair.id];

              return (
                <div key={pair.id} className="rounded-[1.8rem] border border-gray-100 bg-white p-3.5 sm:p-4 shadow-sm">
                  <div className="space-y-3">
                    {pair.leftImageUrl ? (
                      <div className="relative overflow-hidden rounded-[1.2rem] border border-gray-100 bg-gray-50">
                        <img src={pair.leftImageUrl} alt={pair.leftText} className="h-32 sm:h-40 w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setMatchingPreviewImage({ src: pair.leftImageUrl!, title: pair.leftText })}
                          className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-white shadow-lg transition hover:bg-slate-900"
                          aria-label={`Zoom ${pair.leftText}`}
                        >
                          <Search size={14} />
                        </button>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs sm:text-sm font-black text-white">
                        {index + 1}
                      </div>
                      <p className="text-sm sm:text-base font-black text-gray-900 leading-tight">{pair.leftText}</p>
                    </div>

                    <select
                      value={selectedRightId}
                      disabled={hasSubmitted}
                      onChange={(event) =>
                        setMatchingSelections((prev) => ({
                          ...prev,
                          [pair.id]: event.target.value,
                        }))
                      }
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition ${
                        hasAnswerReveal && hasSubmittedAnswer
                          ? result?.isCorrect
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-violet-500"
                      }`}
                    >
                      <option value="">Select choice</option>
                      {orderedRightPairs.map((rightPair, optionIndex) => (
                        <option key={rightPair.id} value={rightPair.id}>
                          {String.fromCharCode(65 + optionIndex)}. {getMatchingOptionLabel(rightPair, optionIndex)}
                        </option>
                      ))}
                    </select>

                    {selectedRightPair ? (
                      <div className="rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-500">Selected</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          {selectedRightPair.rightImageUrl ? (
                            <img
                              src={selectedRightPair.rightImageUrl}
                              alt={getMatchingOptionLabel(selectedRightPair)}
                              className="h-8 w-8 rounded-lg border border-violet-100 bg-white object-cover"
                            />
                          ) : null}
                          <p className="text-xs font-bold text-violet-900 truncate">
                            {getMatchingOptionLabel(
                              selectedRightPair,
                              orderedRightPairs.findIndex((candidate) => candidate.id === selectedRightPair.id)
                            )}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {hasAnswerReveal && result ? (
                      <div className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                        result.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}>
                        {result.isCorrect ? (
                          "Correct match."
                        ) : (
                          <div className="space-y-1.5">
                            <p>{`Correct: ${result.correctRightLabel || result.correctRightText || "Image option"}`}</p>
                            {result.correctRightImageUrl ? (
                              <img
                                src={result.correctRightImageUrl}
                                alt={result.correctRightLabel || result.correctRightText || "Correct option"}
                                className="h-10 w-10 rounded-lg border border-rose-100 bg-white object-cover"
                              />
                            ) : null}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {matchingPreviewImage ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-600">Image Preview</p>
                    <p className="text-sm font-semibold text-gray-500">{matchingPreviewImage.title}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMatchingPreviewImage(null)}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
                <div className="bg-gray-50 p-5">
                  <img
                    src={matchingPreviewImage.src}
                    alt={matchingPreviewImage.title}
                    className="max-h-[70vh] w-full rounded-[1.5rem] object-contain bg-white"
                  />
                </div>
              </motion.div>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3">
        {currentQuestion.options.map((opt, i) => (
          <button
            key={i}
            disabled={hasSubmitted}
            onClick={() => setSelectedOption(i)}
            className={`group relative flex items-center gap-4 rounded-2xl border-2 p-4 sm:p-5 text-left font-bold transition-all ${
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

      if (currentQuestion.questionType === "matching") {
        return isCorrect
          ? "Excellent matching. Every pair matched the answer key."
          : matchingTotalCount > 0
            ? `You matched ${matchingCorrectCount} of ${matchingTotalCount} pairs correctly. Review the correct matches on the shared screen.`
            : "Your matches were checked. Review the correct pairs on the shared screen.";
      }

      return isCorrect
        ? "Great labeling. Every marker matched the answer key."
        : labelTotalCount > 0
          ? `You got ${labelCorrectCount} of ${labelTotalCount} labels correct. Review the correct markers on the shared screen.`
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-4 sm:p-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            {currentSession.currentQuestionIndex + 1}
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500">Question</span>
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-indigo-500">
              {currentQuestion.questionType.replace(/_/g, " ")}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 rounded-full px-2.5 py-1 font-bold text-sm sm:text-base ${
          timeLeft < 5 ? "animate-pulse bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"
        }`}>
          <Timer size={14} />
          <span>{timeLeft}s</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
        {participantSocket.isReconnecting ? (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 shadow-sm shrink-0">
            <WifiOff size={18} className="shrink-0" />
            <div>
              <p className="text-sm font-black">Reconnecting...</p>
              <p className="text-xs font-semibold">Answer submission is paused until your connection returns.</p>
            </div>
          </div>
        ) : null}
        {isSessionPaused ? (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 shadow-sm shrink-0">
            <WifiOff size={18} className="shrink-0" />
            <div>
              <p className="text-sm font-black">Host paused the quiz</p>
              <p className="text-xs font-semibold">Your timer is paused and your answer will be safe when the host resumes.</p>
            </div>
          </div>
        ) : null}
        {!isFinished ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <h2 className="mb-2 text-lg sm:text-xl font-black leading-tight text-gray-900">{currentQuestion.text}</h2>
              {currentQuestion.instructions ? (
                <p className="mb-4 text-xs sm:text-sm font-semibold text-gray-500">{currentQuestion.instructions}</p>
              ) : null}

              <div className="pb-4">{renderQuestionBody()}</div>
            </div>

            <div className="mt-3 border-t border-gray-100 bg-white pt-3 shrink-0">
              <button
                onClick={handleSubmit}
                disabled={
                  hasSubmitted ||
                  isSubmitting ||
                  !participantSocket.isConnected ||
                  isSessionPaused ||
                  (currentQuestion.questionType === "multiple_choice" && selectedOption === null)
                }
                className={`w-full rounded-2xl py-4 sm:py-5 font-black text-white shadow-xl transition-all text-sm sm:text-base ${
                  hasSubmitted ||
                  isSubmitting ||
                  !participantSocket.isConnected ||
                  isSessionPaused ||
                  (currentQuestion.questionType === "multiple_choice" && selectedOption === null)
                    ? "cursor-not-allowed bg-gray-200"
                    : "bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700"
                }`}
              >
                {hasSubmitted
                  ? "Submitted..."
                  : isSubmitting
                    ? "Submitting..."
                    : isSessionPaused
                      ? "Paused by Host"
                      : participantSocket.isConnected
                      ? "Confirm Answer"
                      : "Reconnecting..."}
              </button>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-1 flex-col items-center justify-center py-6 text-center overflow-y-auto"
          >
            <div className={`mb-4 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-[1.8rem] sm:rounded-[2rem] shadow-2xl shrink-0 ${
              showRevealResult
                ? isCorrect
                  ? "bg-green-100 text-green-600 shadow-green-100"
                  : "bg-red-100 text-red-600 shadow-red-100"
                : timedOutWithoutAnswer
                  ? "bg-amber-100 text-amber-600 shadow-amber-100"
                  : "bg-indigo-100 text-indigo-600 shadow-indigo-100"
            }`}>
              {showRevealResult ? (
                isCorrect ? <CheckCircle2 size={40} strokeWidth={3} /> : <XCircle size={40} strokeWidth={3} />
              ) : (
                <Timer size={40} strokeWidth={3} />
              )}
            </div>

            <h2 className={`mb-1 text-2xl sm:text-3xl font-black ${
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
            <p className="mb-6 text-xs sm:text-sm font-bold text-gray-500 leading-relaxed max-w-sm">{renderRevealMessage()}</p>

            <div className="w-full space-y-3 sm:space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-4 sm:p-6 max-w-md">
              {currentQuestion.questionType === "label_image" && showRevealResult ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400">
                    <CheckCircle2 size={14} />
                    Label Score
                  </div>
                  <span className="text-base sm:text-xl font-black text-gray-900">
                    {labelCorrectCount}/{labelTotalCount || currentQuestion.labels?.length || 0}
                  </span>
                </div>
              ) : null}
              {currentQuestion.questionType === "matching" && showRevealResult ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400">
                    <CheckCircle2 size={14} />
                    Match Score
                  </div>
                  <span className="text-base sm:text-xl font-black text-gray-900">
                    {matchingCorrectCount}/{matchingTotalCount || currentQuestion.matchingPairs?.length || 0}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400">
                  <Award size={14} />
                  Current Rank
                </div>
                <span className="text-base sm:text-xl font-black text-gray-900">
                  {currentSession.participantSummary ? `#${currentSession.participantSummary.rank}` : "--"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400">
                  <Timer size={14} />
                  Time Taken
                </div>
                <span className="text-base sm:text-xl font-black text-gray-900">
                  {currentSession.participantSummary?.totalResponseTimeMs
                    ? `${(currentSession.participantSummary.totalResponseTimeMs / 1000).toFixed(1)}s`
                    : "Live"}
                </span>
              </div>
            </div>

            <p className="mt-8 animate-pulse text-xs sm:text-sm font-bold text-indigo-600 shrink-0">
              {showRevealResult ? "Waiting for the next question..." : "Wait for the next question..."}
            </p>
          </motion.div>
        )}
      </div>

      <div className="mt-auto border-t border-gray-100 bg-gray-50 p-3 sm:p-4 shrink-0">
        <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${((currentSession.currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
