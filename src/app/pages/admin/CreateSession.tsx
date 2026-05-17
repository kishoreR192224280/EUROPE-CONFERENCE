import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  GripVertical,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  Youtube,
} from "lucide-react";
import { motion } from "motion/react";
import {
  useSession,
  type LabelImageZone,
  type MatchingPair,
  type Question,
  type QuestionType,
} from "../../context/SessionContext";
import { toast } from "sonner";
import { createSession, uploadLabelImage } from "../../api/sessionApi";

function createSampleQuestion(type: QuestionType, index: number): Question {
  const base = {
    id: Math.random().toString(36).slice(2, 11),
    timer: 30,
    showLeaderboardAfter: true,
    instructions: "",
    mediaUrl: "",
  };

  if (type === "sorting") {
    return {
      ...base,
      questionType: "sorting",
      text: "Arrange the proper handwashing steps in the correct order.",
      options: [],
      items: [
        "Apply soap and rub palms",
        "Wet hands with clean water",
        "Rinse thoroughly and dry",
        "Scrub between fingers and under nails",
      ],
      correctOrder: [
        "Wet hands with clean water",
        "Apply soap and rub palms",
        "Scrub between fingers and under nails",
        "Rinse thoroughly and dry",
      ],
    };
  }

  if (type === "label_image") {
    return {
      ...base,
      questionType: "label_image",
      text: "Label the key organs shown in this digestive system diagram.",
      instructions: "Type the organ name for each numbered marker.",
      mediaUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
      options: [],
      labels: [
        { id: "brain", marker: 1, x: 58, y: 16, width: 20, height: 14, prompt: "Brain", acceptedAnswers: ["Brain"] },
        { id: "lungs", marker: 2, x: 52, y: 33, width: 28, height: 18, prompt: "Lungs", acceptedAnswers: ["Lungs", "Lung"] },
        { id: "stomach", marker: 3, x: 49, y: 53, width: 18, height: 14, prompt: "Stomach", acceptedAnswers: ["Stomach"] },
      ],
    };
  }

  if (type === "matching") {
    return {
      ...base,
      questionType: "matching",
      text: "Match each body system with its primary function.",
      instructions: "Connect each item on the left with the best match on the right.",
      options: [],
      matchingPairs: [
        { id: "match_circulatory", leftText: "Circulatory system", rightText: "Transports blood, oxygen, and nutrients" },
        { id: "match_respiratory", leftText: "Respiratory system", rightText: "Brings oxygen into the body and removes carbon dioxide" },
        { id: "match_digestive", leftText: "Digestive system", rightText: "Breaks down food and absorbs nutrients" },
      ],
    };
  }

  return {
    ...base,
    questionType: "multiple_choice",
    text: index === 0 ? "Which vitamin is produced when skin is exposed to sunlight?" : "Which organ primarily pumps blood through the body?",
    options: index === 0
      ? ["Vitamin D", "Vitamin C", "Vitamin K", "Vitamin B12"]
      : ["Heart", "Liver", "Lungs", "Kidney"],
    correctAnswer: 0,
  };
}

function emptyQuestion(type: QuestionType): Question {
  if (type === "sorting") {
    return {
      id: Math.random().toString(36).slice(2, 11),
      questionType: "sorting",
      text: "",
      instructions: "Arrange the steps from first to last.",
      mediaUrl: "",
      options: [],
      items: ["", "", ""],
      correctOrder: ["", "", ""],
      timer: 30,
      showLeaderboardAfter: true,
    };
  }

  if (type === "label_image") {
    return {
      id: Math.random().toString(36).slice(2, 11),
      questionType: "label_image",
      text: "",
      instructions: "Type the correct label for each marker.",
      mediaUrl: "",
      options: [],
      labels: [
        { id: "label_1", marker: 1, x: 50, y: 30, width: 18, height: 14, prompt: "Marker 1", acceptedAnswers: [""] },
      ],
      timer: 30,
      showLeaderboardAfter: true,
    };
  }

  if (type === "matching") {
    return {
      id: Math.random().toString(36).slice(2, 11),
      questionType: "matching",
      text: "",
      instructions: "Match each item on the left with the correct item on the right.",
      mediaUrl: "",
      options: [],
      matchingPairs: [
        { id: `match_${Date.now()}_1`, leftText: "", rightText: "" },
        { id: `match_${Date.now()}_2`, leftText: "", rightText: "" },
        { id: `match_${Date.now()}_3`, leftText: "", rightText: "" },
      ],
      timer: 30,
      showLeaderboardAfter: true,
    };
  }

  return {
    id: Math.random().toString(36).slice(2, 11),
    questionType: "multiple_choice",
    text: "",
    instructions: "",
    mediaUrl: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    timer: 30,
    showLeaderboardAfter: true,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function LabelImageEditor({
  question,
  onUpdate,
  onUpdateLabelZone,
  onAddLabelZone,
  onRemoveLabelZone,
}: {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
  onUpdateLabelZone: (zoneId: string, updates: Partial<LabelImageZone>) => void;
  onAddLabelZone: () => void;
  onRemoveLabelZone: (zoneId: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const itemInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [synonymDrafts, setSynonymDrafts] = useState<Record<string, string>>({});
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(question.labels?.[0]?.id ?? null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (!question.labels?.length) {
      setSelectedLabelId(null);
      return;
    }

    if (!selectedLabelId || !question.labels.some((label) => label.id === selectedLabelId)) {
      setSelectedLabelId(question.labels[0].id);
    }
  }, [question.labels, selectedLabelId]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file.");
      return;
    }

    setIsUploadingImage(true);

    try {
      const uploaded = await uploadLabelImage(file);
      onUpdate({ mediaUrl: uploaded.url });
      toast.success("Image uploaded successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const addAnswerChip = (zoneId: string) => {
    const draft = (synonymDrafts[zoneId] ?? "").trim();
    if (!draft) {
      return;
    }

    const currentZone = (question.labels ?? []).find((label) => label.id === zoneId);
    if (!currentZone) {
      return;
    }

    const existingAnswers = (currentZone.acceptedAnswers ?? []).filter(Boolean);
    if (existingAnswers.some((item) => item.toLowerCase() === draft.toLowerCase())) {
      setSynonymDrafts((prev) => ({ ...prev, [zoneId]: "" }));
      return;
    }

    const nextAcceptedAnswers = [...existingAnswers, draft];

    onUpdateLabelZone(zoneId, {
      prompt: nextAcceptedAnswers[0] || `Item ${currentZone.marker}`,
      acceptedAnswers: nextAcceptedAnswers,
    });
    setSynonymDrafts((prev) => ({ ...prev, [zoneId]: "" }));
  };

  const removeAnswerChip = (zoneId: string, chipIndex: number) => {
    const currentZone = (question.labels ?? []).find((label) => label.id === zoneId);
    if (!currentZone) {
      return;
    }

    const existingAnswers = (currentZone.acceptedAnswers ?? []).filter(Boolean);
    const nextAcceptedAnswers = existingAnswers.filter((_, index) => index !== chipIndex);

    onUpdateLabelZone(zoneId, {
      prompt: nextAcceptedAnswers[0] || `Item ${currentZone.marker}`,
      acceptedAnswers: nextAcceptedAnswers,
    });
  };

  const createLabelAtPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clamp(((clientX - rect.left) / rect.width) * 100, 4, 96);
    const y = clamp(((clientY - rect.top) / rect.height) * 100, 4, 96);
    const nextMarker = (question.labels?.length ?? 0) + 1;
    const nextLabel = {
      id: `label_${nextMarker}_${Date.now()}`,
      marker: nextMarker,
      x,
      y,
      width: 18,
      height: 14,
      prompt: `Item ${nextMarker}`,
      acceptedAnswers: [""],
    };
    const nextLabels = [...(question.labels ?? []), nextLabel];

    onUpdate({ labels: nextLabels });
    setSelectedLabelId(nextLabel.id);
    window.requestAnimationFrame(() => {
      itemInputRefs.current[nextLabel.id]?.focus();
    });
  };

  const beginMarkerDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    zone: LabelImageZone
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const move = (pointerEvent: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const percentX = ((pointerEvent.clientX - rect.left) / rect.width) * 100;
      const percentY = ((pointerEvent.clientY - rect.top) / rect.height) * 100;
      onUpdateLabelZone(zone.id, {
        x: clamp(percentX, 5, 95),
        y: clamp(percentY, 6, 94),
      });
    };

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Image URL</label>
          <input
            type="text"
            value={question.mediaUrl ?? ""}
            onChange={(e) => onUpdate({ mediaUrl: e.target.value })}
            placeholder="https://... or upload from device"
            disabled={isUploadingImage}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
          />
        </div>
        <div className="flex items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 font-semibold text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={18} />
            {isUploadingImage ? "Uploading..." : "Upload Image"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            onUpdate({ labels: [] });
            setSynonymDrafts({});
            setSelectedLabelId(null);
          }}
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
          className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploadingImage ? "Uploading image..." : "Replace image"}
        </button>
        <p className="text-xs font-semibold text-gray-400">
          Upload an image, then click it to add a numbered label.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Image Canvas</p>
              <p className="text-xs font-semibold text-gray-400">Click to add markers and drag them into place.</p>
            </div>
            <div className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-600 shadow-sm">
              {question.labels?.length ?? 0} item{(question.labels?.length ?? 0) === 1 ? "" : "s"}
            </div>
          </div>
          <div
            ref={canvasRef}
            onClick={(event) => {
              if (!question.mediaUrl) {
                return;
              }

              createLabelAtPoint(event.clientX, event.clientY);
            }}
            className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-white"
          >
            {question.mediaUrl ? (
              <img src={question.mediaUrl} alt="Question reference" className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                  <ImageIcon size={24} />
                </div>
                <p className="text-sm font-semibold text-gray-500">
                  Upload an image from your device or paste a URL, then click the image to place numbered labels.
                </p>
              </div>
            )}

            {(question.labels ?? []).map((label) => (
              <button
                key={label.id}
                type="button"
                onPointerDown={(event) => {
                  setSelectedLabelId(label.id);
                  beginMarkerDrag(event, label);
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedLabelId(label.id);
                }}
                className={`absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] text-lg font-black text-white shadow-lg transition-transform hover:scale-105 ${
                  selectedLabelId === label.id
                    ? "border-blue-950 bg-blue-600 shadow-blue-300 ring-4 ring-blue-100"
                    : "border-blue-900 bg-blue-500 shadow-blue-200"
                }`}
                style={{
                  left: `${label.x}%`,
                  top: `${label.y}%`,
                }}
                title={`Move label ${label.marker}`}
              >
                {label.marker}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-gray-700">Items</label>
              <p className="mt-1 text-xs font-semibold text-gray-400">
                Add one or more accepted answers for each marker. The first chip becomes the main label.
              </p>
            </div>
          </div>

          {!(question.labels ?? []).length ? (
            <div className="rounded-[28px] border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
              <p className="text-sm font-semibold text-gray-700">No items added yet</p>
              <p className="mt-1 text-xs font-semibold text-gray-400">
                Click on the image to place your first marker, or use the button below to start from the center.
              </p>
            </div>
          ) : null}

          {(question.labels ?? []).map((label) => (
            <div
              key={label.id}
              className={`flex items-start gap-4 rounded-[28px] px-1 py-1 transition-colors ${
                selectedLabelId === label.id ? "bg-blue-50/60" : ""
              }`}
              onClick={() => setSelectedLabelId(label.id)}
            >
              <div className="pt-7 text-base font-black text-gray-700">{label.marker}</div>
              <div
                className={`flex-1 rounded-[26px] border bg-white px-4 py-3 shadow-sm transition-all ${
                  selectedLabelId === label.id ? "border-blue-300 shadow-blue-100" : "border-gray-200"
                }`}
              >
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">Item {label.marker}</p>
                <div
                  className={`flex min-h-[72px] flex-wrap content-start gap-2 rounded-2xl border px-3 py-3 transition-colors ${
                    selectedLabelId === label.id ? "border-blue-200 bg-white" : "border-gray-100 bg-gray-50"
                  }`}
                  onClick={() => {
                    setSelectedLabelId(label.id);
                    itemInputRefs.current[label.id]?.focus();
                  }}
                >
                  {(label.acceptedAnswers ?? []).filter(Boolean).map((answer, chipIndex) => (
                    <span
                      key={`${label.id}_answer_${chipIndex}`}
                      className={`inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                        chipIndex === 0 ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="break-words">{answer}</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeAnswerChip(label.id, chipIndex);
                        }}
                        className="text-slate-500 transition-colors hover:text-slate-800"
                        title={`Remove ${answer}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    ref={(node) => {
                      itemInputRefs.current[label.id] = node;
                    }}
                    type="text"
                    value={synonymDrafts[label.id] ?? ""}
                    onChange={(e) =>
                      setSynonymDrafts((prev) => ({
                        ...prev,
                        [label.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addAnswerChip(label.id);
                      }

                      if (
                        e.key === "Backspace" &&
                        !(synonymDrafts[label.id] ?? "").length &&
                        (label.acceptedAnswers ?? []).filter(Boolean).length
                      ) {
                        e.preventDefault();
                        removeAnswerChip(label.id, (label.acceptedAnswers ?? []).filter(Boolean).length - 1);
                      }
                    }}
                    onBlur={() => addAnswerChip(label.id)}
                    placeholder={(label.acceptedAnswers ?? []).filter(Boolean).length ? "Add another accepted answer" : "Add item"}
                    className="min-w-[120px] flex-1 bg-transparent px-1 py-1.5 text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemoveLabelZone(label.id);
                }}
                className="mt-7 rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                title={`Delete item ${label.marker}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              const canvas = canvasRef.current;
              if (canvas) {
                const rect = canvas.getBoundingClientRect();
                createLabelAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
                return;
              }

              onAddLabelZone();
            }}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Plus size={18} />
            New item
          </button>
        </div>
      </div>
    </div>
  );
}

function MatchingEditor({
  question,
  onUpdate,
  onUpdatePair,
  onAddPair,
  onRemovePair,
}: {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
  onUpdatePair: (pairId: string, updates: Partial<MatchingPair>) => void;
  onAddPair: () => void;
  onRemovePair: (pairId: string) => void;
}) {
  const pairs = question.matchingPairs ?? [];
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  const handlePairImageUpload = async (
    pairId: string,
    side: "left" | "right",
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file.");
      return;
    }

    const targetKey = `${pairId}_${side}`;
    setUploadingTarget(targetKey);

    try {
      const uploaded = await uploadLabelImage(file);
      onUpdatePair(
        pairId,
        side === "left"
          ? { leftImageUrl: uploaded.url }
          : { rightImageUrl: uploaded.url }
      );
      toast.success("Match image uploaded successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingTarget(null);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <label className="text-sm font-semibold text-gray-700">Matches</label>
          <p className="mt-1 text-xs font-semibold text-gray-400">
            Add one correct match per row. The order you define here is the answer key.
          </p>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-600">
          {pairs.length} pair{pairs.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="space-y-3">
        {pairs.map((pair, pairIndex) => (
          <div
            key={pair.id}
            className="grid gap-3 rounded-[28px] border border-gray-100 bg-gray-50 p-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto]"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                  Option {pairIndex + 1}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={(node) => {
                      fileInputRefs.current[`${pair.id}_left`] = node;
                    }}
                    type="file"
                    accept="image/*"
                    onChange={(event) => void handlePairImageUpload(pair.id, "left", event)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[`${pair.id}_left`]?.click()}
                    disabled={uploadingTarget === `${pair.id}_left`}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ImageIcon size={12} />
                    {uploadingTarget === `${pair.id}_left` ? "Uploading" : pair.leftImageUrl ? "Replace image" : "Add image"}
                  </button>
                  {pair.leftImageUrl ? (
                    <button
                      type="button"
                      onClick={() => onUpdatePair(pair.id, { leftImageUrl: "" })}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Remove left image"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
              </div>
              {pair.leftImageUrl ? (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <img
                    src={pair.leftImageUrl}
                    alt={`Left match visual ${pairIndex + 1}`}
                    className="h-28 w-full object-contain bg-gray-50"
                  />
                </div>
              ) : null}
              {pair.leftImageUrl ? (
                pair.leftText.trim() ? (
                  <input
                    type="text"
                    value={pair.leftText}
                    onChange={(e) => onUpdatePair(pair.id, { leftText: e.target.value })}
                    placeholder="Optional caption"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                    This side will use the image only. Add text later only if you want a caption.
                  </div>
                )
              ) : (
                <input
                  type="text"
                  value={pair.leftText}
                  onChange={(e) => onUpdatePair(pair.id, { leftText: e.target.value })}
                  placeholder="e.g. Respiratory system"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <div className="flex items-center justify-center px-1 pt-6 text-gray-300">
              <ArrowRight size={22} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                  Match {String.fromCharCode(65 + pairIndex)}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={(node) => {
                      fileInputRefs.current[`${pair.id}_right`] = node;
                    }}
                    type="file"
                    accept="image/*"
                    onChange={(event) => void handlePairImageUpload(pair.id, "right", event)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[`${pair.id}_right`]?.click()}
                    disabled={uploadingTarget === `${pair.id}_right`}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ImageIcon size={12} />
                    {uploadingTarget === `${pair.id}_right` ? "Uploading" : pair.rightImageUrl ? "Replace image" : "Add image"}
                  </button>
                  {pair.rightImageUrl ? (
                    <button
                      type="button"
                      onClick={() => onUpdatePair(pair.id, { rightImageUrl: "" })}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Remove right image"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
              </div>
              {pair.rightImageUrl ? (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <img
                    src={pair.rightImageUrl}
                    alt={`Right match visual ${pairIndex + 1}`}
                    className="h-28 w-full object-contain bg-gray-50"
                  />
                </div>
              ) : null}
              {pair.rightImageUrl ? (
                pair.rightText.trim() ? (
                  <input
                    type="text"
                    value={pair.rightText}
                    onChange={(e) => onUpdatePair(pair.id, { rightText: e.target.value })}
                    placeholder="Optional caption"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700">
                    This side will use the image only. Add text later only if you want a caption.
                  </div>
                )
              ) : (
                <input
                  type="text"
                  value={pair.rightText}
                  onChange={(e) => onUpdatePair(pair.id, { rightText: e.target.value })}
                  placeholder="e.g. Brings oxygen into the body"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <div className="flex items-center justify-center pt-6">
              <button
                type="button"
                onClick={() => onRemovePair(pair.id)}
                disabled={pairs.length <= 2}
                className="rounded-xl p-2 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                title={`Remove pair ${pairIndex + 1}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddPair}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
      >
        <Plus size={16} />
        New option
      </button>
    </div>
  );
}

export function CreateSession() {
  const navigate = useNavigate();
  const { setSession } = useSession();

  const [questions, setQuestions] = useState<Question[]>([
    createSampleQuestion("multiple_choice", 0),
    createSampleQuestion("sorting", 1),
    createSampleQuestion("label_image", 2),
  ]);

  const [sessionInfo, setSessionInfo] = useState({
    title: "Health Foundations Quiz",
    description: "A mixed-format health quiz with multiple choice, ordering, and image labeling for anatomy and clinical basics.",
    videoLink: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = (type: QuestionType) => {
    setQuestions((prev) => [...prev, emptyQuestion(type)]);
  };

  const removeQuestion = (id: string | number) => {
    if (questions.length > 1) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    }
  };

  const updateQuestion = (id: string | number, updates: Partial<Question>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const updateOption = (qId: string | number, optIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) {
          return q;
        }

        const nextOptions = [...q.options];
        nextOptions[optIndex] = value;
        return { ...q, options: nextOptions };
      })
    );
  };

  const updateSortingItem = (qId: string | number, itemIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) {
          return q;
        }

        const nextItems = [...(q.items ?? [])];
        nextItems[itemIndex] = value;
        return { ...q, items: nextItems, correctOrder: nextItems };
      })
    );
  };

  const addSortingItem = (qId: string | number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) {
          return q;
        }

        const nextItems = [...(q.items ?? []), ""];
        return { ...q, items: nextItems, correctOrder: nextItems };
      })
    );
  };

  const updateMatchingPair = (qId: string | number, pairId: string, updates: Partial<MatchingPair>) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) {
          return q;
        }

        return {
          ...q,
          matchingPairs: (q.matchingPairs ?? []).map((pair) =>
            pair.id === pairId ? { ...pair, ...updates } : pair
          ),
        };
      })
    );
  };

  const addMatchingPair = (qId: string | number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) {
          return q;
        }

        const nextPairs = [...(q.matchingPairs ?? [])];
        nextPairs.push({
          id: `match_${Date.now()}_${nextPairs.length + 1}`,
          leftText: "",
          rightText: "",
        });

        return { ...q, matchingPairs: nextPairs };
      })
    );
  };

  const removeMatchingPair = (qId: string | number, pairId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) {
          return q;
        }

        return {
          ...q,
          matchingPairs: (q.matchingPairs ?? []).filter((pair) => pair.id !== pairId),
        };
      })
    );
  };

  const updateLabelZone = (qId: string | number, zoneId: string, updates: Partial<LabelImageZone>) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) {
          return q;
        }

        return {
          ...q,
          labels: (q.labels ?? []).map((label) => (label.id === zoneId ? { ...label, ...updates } : label)),
        };
      })
    );
  };

  const addLabelZone = (qId: string | number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) {
          return q;
        }

        const nextLabels = [...(q.labels ?? [])];
        nextLabels.push({
          id: `label_${nextLabels.length + 1}_${Date.now()}`,
          marker: nextLabels.length + 1,
          x: 50,
          y: 50,
          width: 18,
          height: 14,
          prompt: `Marker ${nextLabels.length + 1}`,
          acceptedAnswers: [""],
        });
        return { ...q, labels: nextLabels };
      })
    );
  };

  const removeLabelZone = (qId: string | number, zoneId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) {
          return q;
        }

        const nextLabels = (q.labels ?? [])
          .filter((label) => label.id !== zoneId)
          .map((label, index) => ({ ...label, marker: index + 1 }));
        return { ...q, labels: nextLabels };
      })
    );
  };

  const validateQuestions = () => {
    for (const [index, question] of questions.entries()) {
      if (!question.text.trim()) {
        toast.error(`Please enter text for question ${index + 1}`);
        return false;
      }

      if (question.questionType === "multiple_choice") {
        if (question.options.length !== 4 || question.options.some((option) => !option.trim())) {
          toast.error(`Please complete all 4 options for question ${index + 1}`);
          return false;
        }
      }

      if (question.questionType === "sorting") {
        if (!question.items || question.items.length < 3 || question.items.some((item) => !item.trim())) {
          toast.error(`Please add at least 3 ordered steps for question ${index + 1}`);
          return false;
        }
      }

      if (question.questionType === "label_image") {
        if (!question.mediaUrl?.trim()) {
          toast.error(`Please add an image for question ${index + 1}`);
          return false;
        }

        if (!question.labels || question.labels.length < 1) {
          toast.error(`Please add at least 1 image marker for question ${index + 1}`);
          return false;
        }

        const invalidLabel = question.labels.find(
          (label) =>
            !label.prompt.trim() ||
            !(label.acceptedAnswers ?? []).some((answer) => answer.trim())
        );

        if (invalidLabel) {
          toast.error(`Please complete all label prompts and accepted answers for question ${index + 1}`);
          return false;
        }
      }

      if (question.questionType === "matching") {
        if (!question.matchingPairs || question.matchingPairs.length < 2) {
          toast.error(`Please add at least 2 match pairs for question ${index + 1}`);
          return false;
        }

        const invalidPair = question.matchingPairs.find(
          (pair) =>
            (!pair.leftText.trim() && !pair.leftImageUrl?.trim()) ||
            (!pair.rightText.trim() && !pair.rightImageUrl?.trim())
        );

        if (invalidPair) {
          toast.error(`Please add text or an image for every left and right item in question ${index + 1}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = async (status: "draft" | "waiting") => {
    if (!sessionInfo.title.trim()) {
      toast.error("Please enter a session title");
      return;
    }

    if (!validateQuestions()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const newSession = await createSession({
        title: sessionInfo.title.trim(),
        description: sessionInfo.description.trim(),
        youtubeUrl: sessionInfo.videoLink.trim(),
        status,
        questions,
      });

      setSession(newSession);
      toast.success(status === "draft" ? "Session draft saved successfully!" : "Session created successfully!");
      navigate(`/admin/session/${newSession.id}/success`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save session");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Session</h1>
          <p className="text-gray-500">Build a health quiz with mixed objective response formats.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => void handleSave("draft")}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            Save as Draft
          </button>
          <button
            onClick={() => void handleSave("waiting")}
            disabled={isSubmitting}
            className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-md shadow-blue-100 transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Create Session"}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <section className="space-y-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h3 className="border-b border-gray-100 pb-4 text-lg font-bold text-gray-900">Session Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Session Title</label>
              <input
                type="text"
                value={sessionInfo.title}
                onChange={(e) => setSessionInfo({ ...sessionInfo, title: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">YouTube / Vimeo Link (Optional)</label>
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={sessionInfo.videoLink}
                  onChange={(e) => setSessionInfo({ ...sessionInfo, videoLink: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea
                rows={3}
                value={sessionInfo.description}
                onChange={(e) => setSessionInfo({ ...sessionInfo, description: e.target.value })}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 p-8 transition-colors hover:border-blue-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500">
                <ImageIcon size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">Session Thumbnail</p>
                <p className="text-xs text-gray-500">Keep using URLs for now, then connect upload later</p>
              </div>
            </div>
            <div className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 p-8 transition-colors hover:border-blue-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500">
                <Plus size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">Intro Video</p>
                <p className="text-xs text-gray-500">Prepared for richer media in the next phase</p>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-900">Questions ({questions.length})</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => addQuestion("multiple_choice")}
                className="rounded-xl bg-blue-50 px-4 py-2 font-semibold text-blue-600 transition-colors hover:bg-blue-100"
              >
                Add MCQ
              </button>
              <button
                onClick={() => addQuestion("sorting")}
                className="rounded-xl bg-emerald-50 px-4 py-2 font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
              >
                Add Sorting
              </button>
              <button
                onClick={() => addQuestion("label_image")}
                className="rounded-xl bg-amber-50 px-4 py-2 font-semibold text-amber-600 transition-colors hover:bg-amber-100"
              >
                Add Label Image
              </button>
              <button
                onClick={() => addQuestion("matching")}
                className="rounded-xl bg-violet-50 px-4 py-2 font-semibold text-violet-600 transition-colors hover:bg-violet-100"
              >
                Add Matching
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                index={index}
                question={question}
                onUpdate={(updates) => updateQuestion(question.id, updates)}
                onUpdateOption={(optIdx, val) => updateOption(question.id, optIdx, val)}
                onUpdateSortingItem={(itemIdx, val) => updateSortingItem(question.id, itemIdx, val)}
                onAddSortingItem={() => addSortingItem(question.id)}
                onUpdateMatchingPair={(pairId, updates) => updateMatchingPair(question.id, pairId, updates)}
                onAddMatchingPair={() => addMatchingPair(question.id)}
                onRemoveMatchingPair={(pairId) => removeMatchingPair(question.id, pairId)}
                onUpdateLabelZone={(zoneId, updates) => updateLabelZone(question.id, zoneId, updates)}
                onAddLabelZone={() => addLabelZone(question.id)}
                onRemoveLabelZone={(zoneId) => removeLabelZone(question.id, zoneId)}
                onDelete={() => removeQuestion(question.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({
  index,
  question,
  onUpdate,
  onUpdateOption,
  onUpdateSortingItem,
  onAddSortingItem,
  onUpdateMatchingPair,
  onAddMatchingPair,
  onRemoveMatchingPair,
  onUpdateLabelZone,
  onAddLabelZone,
  onRemoveLabelZone,
  onDelete,
}: {
  index: number;
  question: Question;
  onUpdate: (u: Partial<Question>) => void;
  onUpdateOption: (idx: number, val: string) => void;
  onUpdateSortingItem: (idx: number, val: string) => void;
  onAddSortingItem: () => void;
  onUpdateMatchingPair: (pairId: string, updates: Partial<MatchingPair>) => void;
  onAddMatchingPair: () => void;
  onRemoveMatchingPair: (pairId: string) => void;
  onUpdateLabelZone: (zoneId: string, updates: Partial<LabelImageZone>) => void;
  onAddLabelZone: () => void;
  onRemoveLabelZone: (zoneId: string) => void;
  onDelete: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const typeBadge =
    question.questionType === "multiple_choice"
      ? "Multiple Choice"
      : question.questionType === "sorting"
        ? "Sorting"
        : question.questionType === "matching"
          ? "Matching"
          : "Label Image";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      <div className="flex cursor-pointer items-center gap-4 bg-gray-50 p-4" onClick={() => setIsExpanded(!isExpanded)}>
        <GripVertical className="cursor-grab text-gray-400" size={20} />
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="truncate font-semibold text-gray-900">{question.text || "New Question"}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400">{typeBadge}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-500">{question.timer}s</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-gray-400 transition-colors hover:text-red-500"
          >
            <Trash2 size={18} />
          </button>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded ? (
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Question Type</label>
              <select
                value={question.questionType}
                onChange={(e) => onUpdate(emptyQuestion(e.target.value as QuestionType))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="sorting">Sorting Steps in Order</option>
                <option value="matching">Matching</option>
                <option value="label_image">Label an Image</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Question Text</label>
              <input
                type="text"
                value={question.text}
                onChange={(e) => onUpdate({ text: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Instructions (Optional)</label>
              <input
                type="text"
                value={question.instructions ?? ""}
                onChange={(e) => onUpdate({ instructions: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {question.questionType === "multiple_choice" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {question.options.map((option, i) => (
                <div key={i} className="group relative">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    question.correctAnswer === i ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => onUpdateOption(i, e.target.value)}
                    className={`w-full rounded-xl border py-3 pl-12 pr-12 outline-none transition-all ${
                      question.correctAnswer === i
                        ? "border-green-500 bg-green-50/30 focus:ring-2 focus:ring-green-500"
                        : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                    }`}
                  />
                  <button
                    onClick={() => onUpdate({ correctAnswer: i })}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors ${
                      question.correctAnswer === i
                        ? "bg-green-100 text-green-600"
                        : "text-gray-300 hover:bg-green-50 hover:text-green-500"
                    }`}
                  >
                    <Check size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {question.questionType === "sorting" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Correct Order</label>
                <button
                  onClick={onAddSortingItem}
                  className="rounded-xl bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-600"
                >
                  Add Step
                </button>
              </div>
              {(question.items ?? []).map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                    {itemIndex + 1}
                  </div>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => onUpdateSortingItem(itemIndex, e.target.value)}
                    placeholder={`Step ${itemIndex + 1}`}
                    className="flex-1 bg-transparent font-semibold text-gray-700 outline-none"
                  />
                </div>
              ))}
              <p className="text-xs font-semibold text-gray-400">
                Students will reorder these steps. The order shown here is treated as the correct answer.
              </p>
            </div>
          ) : null}

          {question.questionType === "matching" ? (
            <MatchingEditor
              question={question}
              onUpdate={onUpdate}
              onUpdatePair={onUpdateMatchingPair}
              onAddPair={onAddMatchingPair}
              onRemovePair={onRemoveMatchingPair}
            />
          ) : null}

          {question.questionType === "label_image" ? (
            <LabelImageEditor
              question={question}
              onUpdate={onUpdate}
              onUpdateLabelZone={onUpdateLabelZone}
              onAddLabelZone={onAddLabelZone}
              onRemoveLabelZone={onRemoveLabelZone}
            />
          ) : null}

          <div className="flex items-center gap-6 border-t border-gray-50 pt-4">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Time Limit:</span>
              <select
                value={question.timer}
                onChange={(e) => onUpdate({ timer: Number.parseInt(e.target.value, 10) })}
                className="rounded-lg bg-gray-50 px-3 py-1.5 text-sm font-medium outline-none"
              >
                <option value={10}>10s</option>
                <option value={20}>20s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={120}>2m</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`leaderboard-${question.id}`}
                className="rounded text-blue-600"
                checked={question.showLeaderboardAfter}
                onChange={(e) => onUpdate({ showLeaderboardAfter: e.target.checked })}
              />
              <label htmlFor={`leaderboard-${question.id}`} className="text-sm font-medium text-gray-600">
                Show leaderboard after this question
              </label>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

