import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Timer, CheckCircle2, XCircle, Award, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "../../context/SessionContext";

export function StudentQuestion() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentSession } = useSession();
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);

  if (!currentSession) return null;

  const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex];

  useEffect(() => {
    let timer: any;
    if (timeLeft > 0 && !hasSubmitted) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsFinished(true);
    }
    return () => clearInterval(timer);
  }, [timeLeft, hasSubmitted]);

  const handleSubmit = () => {
    if (selectedOption !== null) {
      setHasSubmitted(true);
      // Simulate submission
      setTimeout(() => {
        setIsFinished(true);
      }, 1000);
    }
  };

  const isCorrect = selectedOption === currentQuestion.correctAnswer;

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
              disabled={selectedOption === null || hasSubmitted}
              className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all mt-auto ${
                selectedOption === null || hasSubmitted
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
              }`}
            >
              {hasSubmitted ? "Submitted..." : "Confirm Answer"}
            </button>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center py-10"
          >
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl ${
              isCorrect ? "bg-green-100 text-green-600 shadow-green-100" : "bg-red-100 text-red-600 shadow-red-100"
            }`}>
              {isCorrect ? <CheckCircle2 size={48} strokeWidth={3} /> : <XCircle size={48} strokeWidth={3} />}
            </div>

            <h2 className={`text-3xl font-black mb-2 ${isCorrect ? "text-green-600" : "text-red-600"}`}>
              {isCorrect ? "Correct!" : "Nice Try!"}
            </h2>
            <p className="text-gray-500 font-bold mb-8">
              {isCorrect ? "You earned 850 points!" : "The correct answer was " + String.fromCharCode(65 + currentQuestion.correctAnswer)}
            </p>

            <div className="w-full bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
                  <Award size={14} />
                  Current Rank
                </div>
                <span className="text-xl font-black text-gray-900">#4</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
                  <Timer size={14} />
                  Time Taken
                </div>
                <span className="text-xl font-black text-gray-900">1.2s</span>
              </div>
            </div>

            <p className="mt-10 text-sm font-bold text-indigo-600 animate-pulse">
              Waiting for the next question...
            </p>
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-gray-50 mt-auto border-t border-gray-100">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500" 
            style={{ width: `${((currentSession.currentQuestionIndex + 1) / currentSession.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
