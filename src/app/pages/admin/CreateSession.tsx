import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  GripVertical,
  Image as ImageIcon,
  Plus,
  Trash2,
  Youtube,
} from "lucide-react";
import { motion } from "motion/react";
import { useSession, type LabelImageZone, type Question, type QuestionType } from "../../context/SessionContext";
import { toast } from "sonner";
import { createSession } from "../../api/sessionApi";

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
        { id: "brain", marker: 1, x: 58, y: 16, prompt: "Label marker 1", acceptedAnswers: ["Brain"] },
        { id: "lungs", marker: 2, x: 52, y: 33, prompt: "Label marker 2", acceptedAnswers: ["Lungs", "Lung"] },
        { id: "stomach", marker: 3, x: 49, y: 53, prompt: "Label marker 3", acceptedAnswers: ["Stomach"] },
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
        { id: "label_1", marker: 1, x: 50, y: 30, prompt: "Marker 1", acceptedAnswers: [""] },
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
          id: `label_${nextLabels.length + 1}`,
          marker: nextLabels.length + 1,
          x: 50,
          y: 50,
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
          toast.error(`Please provide an image URL for question ${index + 1}`);
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

          {question.questionType === "label_image" ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Image URL</label>
                <input
                  type="text"
                  value={question.mediaUrl ?? ""}
                  onChange={(e) => onUpdate({ mediaUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white">
                    {question.mediaUrl ? (
                      <img src={question.mediaUrl} alt="Question reference" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-400">
                        Add an image URL to preview markers
                      </div>
                    )}
                    {(question.labels ?? []).map((label) => (
                      <div
                        key={label.id}
                        className="absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-blue-700 bg-blue-500 text-sm font-black text-white shadow-lg"
                        style={{ left: `${label.x}%`, top: `${label.y}%` }}
                      >
                        {label.marker}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">Markers</label>
                    <button
                      onClick={onAddLabelZone}
                      className="rounded-xl bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-600"
                    >
                      Add Marker
                    </button>
                  </div>
                  {(question.labels ?? []).map((label) => (
                    <div key={label.id} className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-gray-900">Marker {label.marker}</p>
                        <button onClick={() => onRemoveLabelZone(label.id)} className="text-xs font-semibold text-red-500">
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        value={label.prompt}
                        onChange={(e) => onUpdateLabelZone(label.id, { prompt: e.target.value })}
                        placeholder="Prompt"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={label.x}
                          onChange={(e) => onUpdateLabelZone(label.id, { x: Number(e.target.value) })}
                          placeholder="X %"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={label.y}
                          onChange={(e) => onUpdateLabelZone(label.id, { y: Number(e.target.value) })}
                          placeholder="Y %"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <input
                        type="text"
                        value={(label.acceptedAnswers ?? []).join(", ")}
                        onChange={(e) =>
                          onUpdateLabelZone(label.id, {
                            acceptedAnswers: e.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                          })
                        }
                        placeholder="Accepted answers, comma separated"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
