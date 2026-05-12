import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Trash2, GripVertical, Image as ImageIcon, Youtube, Clock, Check, ChevronDown, ChevronUp } from "lucide-react";
import { motion, Reorder } from "motion/react";
import { useSession, Question } from "../../context/SessionContext";
import { toast } from "sonner";

export function CreateSession() {
  const navigate = useNavigate();
  const { setSession } = useSession();
  
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      text: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      timer: 30
    }
  ]);

  const [sessionInfo, setSessionInfo] = useState({
    title: "",
    description: "",
    videoLink: "",
  });

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Math.random().toString(36).substr(2, 9),
        text: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        timer: 30
      }
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const updateOption = (qId: string, optIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOptions = [...q.options];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleSave = () => {
    if (!sessionInfo.title) {
      toast.error("Please enter a session title");
      return;
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newSession = {
      id: Math.random().toString(36).substring(2, 10),
      code,
      title: sessionInfo.title,
      description: sessionInfo.description,
      questions,
      status: "waiting" as const,
      currentQuestionIndex: -1,
      participants: 0,
    };

    setSession(newSession);
    toast.success("Session created successfully!");
    navigate(`/admin/session/${newSession.id}/success`);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Session</h1>
          <p className="text-gray-500">Design your interactive experience.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
            Save as Draft
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
          >
            Create Session
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Session Details Card */}
        <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Session Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Session Title</label>
              <input
                type="text"
                placeholder="e.g. Weekly Team Trivia"
                value={sessionInfo.title}
                onChange={(e) => setSessionInfo({ ...sessionInfo, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">YouTube / Vimeo Link (Optional)</label>
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="https://youtube.com/..."
                  value={sessionInfo.videoLink}
                  onChange={(e) => setSessionInfo({ ...sessionInfo, videoLink: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea
                rows={3}
                placeholder="Briefly describe what this session is about..."
                value={sessionInfo.description}
                onChange={(e) => setSessionInfo({ ...sessionInfo, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              ></textarea>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-400 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                <ImageIcon size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">Upload Session Thumbnail</p>
                <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
              </div>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-400 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                <Plus size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">Upload Intro Video</p>
                <p className="text-xs text-gray-500">MP4, MOV up to 50MB</p>
              </div>
            </div>
          </div>
        </section>

        {/* Questions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Questions ({questions.length})</h3>
            <button
              onClick={addQuestion}
              className="flex items-center gap-2 text-blue-600 font-semibold hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={20} />
              Add Question
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, index) => (
              <QuestionCard
                key={q.id}
                index={index}
                question={q}
                onUpdate={(u) => updateQuestion(q.id, u)}
                onUpdateOption={(optIdx, val) => updateOption(q.id, optIdx, val)}
                onDelete={() => removeQuestion(q.id)}
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
  onDelete 
}: { 
  index: number; 
  question: Question; 
  onUpdate: (u: Partial<Question>) => void;
  onUpdateOption: (idx: number, val: string) => void;
  onDelete: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="p-4 bg-gray-50 flex items-center gap-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <GripVertical className="text-gray-400 cursor-grab" size={20} />
        <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 truncate">
            {question.text || "New Question"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
            {question.timer}s
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Question Text</label>
            <input
              type="text"
              placeholder="What is the capital of France?"
              value={question.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((opt, i) => (
              <div key={i} className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  question.correctAnswer === i ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <input
                  type="text"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => onUpdateOption(i, e.target.value)}
                  className={`w-full pl-12 pr-12 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    question.correctAnswer === i 
                      ? "border-green-500 bg-green-50/30 focus:ring-green-500" 
                      : "border-gray-200 focus:ring-blue-500"
                  }`}
                />
                <button
                  onClick={() => onUpdate({ correctAnswer: i })}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                    question.correctAnswer === i 
                      ? "text-green-600 bg-green-100" 
                      : "text-gray-300 hover:text-green-500 hover:bg-green-50"
                  }`}
                >
                  <Check size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Time Limit:</span>
              <select
                value={question.timer}
                onChange={(e) => onUpdate({ timer: parseInt(e.target.value) })}
                className="bg-gray-50 border-none rounded-lg text-sm font-medium py-1.5 px-3 outline-none"
              >
                <option value={10}>10s</option>
                <option value={20}>20s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={120}>2m</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id={`leaderboard-${question.id}`} className="rounded text-blue-600" defaultChecked />
              <label htmlFor={`leaderboard-${question.id}`} className="text-sm font-medium text-gray-600">
                Show leaderboard after this question
              </label>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
