'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, BarChart3, RotateCcw, Home } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

interface QuizEngineProps {
  quizId: string;
  moduleName: string;
  difficulty: 'Easy' | 'Intermediate' | 'Advanced';
  onBack: () => void;
}

type QuestionKey = 'option_a' | 'option_b' | 'option_c' | 'option_d';

export default function QuizEngine({ quizId, moduleName, difficulty, onBack }: QuizEngineProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes default
  const [quizComplete, setQuizComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch and randomize questions based on difficulty
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .limit(10);

        if (error) throw error;
        
        // Randomize questions
        const shuffled = data ? [...data].sort(() => Math.random() - 0.5) : [];
        setQuestions(shuffled);
      } catch (error) {
        console.error('Error fetching questions:', error);
        // Fallback to sample data for demo
        setQuestions(generateSampleQuestions());
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [quizId, supabase]);

  // Timer countdown
  useEffect(() => {
    if (quizComplete || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setQuizComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizComplete]);

  const handleAnswerSelect = (answer: string) => {
    setUserAnswer(answer);
    setAnswers({ ...answers, [currentIndex]: answer });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer(answers[currentIndex + 1] || null);
    } else {
      setQuizComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setUserAnswer(answers[currentIndex - 1] || null);
    }
  };

  const calculateScore = (): number => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct_answer) correct++;
    });
    return Math.round((correct / questions.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    const score = calculateScore();
    const correctCount = Object.entries(answers).filter(
      ([idx, ans]) => ans === questions[parseInt(idx)]?.correct_answer
    ).length;

    return <QuizResults score={score} totalQuestions={questions.length} correctCount={correctCount} timeUsed={1800 - timeLeft} onRetry={() => { setCurrentIndex(0); setAnswers({}); setQuizComplete(false); setTimeLeft(1800); }} onBack={onBack} />;
  }

  const current = questions[currentIndex];
  const optionLabels: Record<QuestionKey, string> = {
    option_a: 'A',
    option_b: 'B',
    option_c: 'C',
    option_d: 'D',
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{moduleName}</h2>
            <p className="text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
          </div>
          <div className={`flex items-center gap-2 text-lg font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-primary'}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl border border-border p-8 mb-6">
        {/* Question */}
        <div className="mb-8">
          <p className="text-xl font-bold text-foreground mb-6">{current?.question_text}</p>

          {/* Answer Options */}
          <div className="space-y-3">
            {(['option_a', 'option_b', 'option_c', 'option_d'] as QuestionKey[]).map((key) => (
              <button
                key={key}
                onClick={() => handleAnswerSelect(key)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  userAnswer === key
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${
                      userAnswer === key
                        ? 'border-primary bg-primary text-white'
                        : 'border-border'
                    }`}
                  >
                    {optionLabels[key]}
                  </div>
                  <span className="text-foreground font-medium">{current?.[key]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 justify-between">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
          className="border-primary text-primary hover:bg-primary/5"
        >
          Previous
        </Button>

        <div className="flex gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-red-500 text-red-600 hover:bg-red-50"
          >
            Exit Quiz
          </Button>
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-primary to-secondary text-white font-semibold"
          >
            {currentIndex === questions.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </div>
      </div>

      {/* Question Navigator */}
      <div className="mt-8 bg-white rounded-2xl border border-border p-6">
        <p className="text-sm font-semibold text-foreground mb-4">Question Navigator</p>
        <div className="grid grid-cols-10 gap-2">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setUserAnswer(answers[idx] || null);
              }}
              className={`w-full aspect-square rounded-lg font-bold transition-all ${
                idx === currentIndex
                  ? 'bg-primary text-white'
                  : answers[idx]
                  ? 'bg-primary/20 text-primary hover:bg-primary/30'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuizResults({
  score,
  totalQuestions,
  correctCount,
  timeUsed,
  onRetry,
  onBack,
}: {
  score: number;
  totalQuestions: number;
  correctCount: number;
  timeUsed: number;
  onRetry: () => void;
  onBack: () => void;
}) {
  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (score >= 80) return { grade: 'B', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (score >= 70) return { grade: 'C', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { grade: 'F', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const gradeInfo = getGrade(score);

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className={`${gradeInfo.bgColor} rounded-2xl border-2 border-current p-12 mb-8`}>
        <div className={`text-7xl font-bold ${gradeInfo.color} mb-4`}>{gradeInfo.grade}</div>
        <p className="text-3xl font-bold text-foreground mb-2">Score: {score}%</p>
        <p className="text-muted-foreground">{correctCount} out of {totalQuestions} answers correct</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-border p-6">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Correct Answers</p>
          <p className="text-2xl font-bold text-foreground">{correctCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-6">
          <XCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Wrong Answers</p>
          <p className="text-2xl font-bold text-foreground">{totalQuestions - correctCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-6">
          <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Time Used</p>
          <p className="text-2xl font-bold text-foreground">{Math.floor(timeUsed / 60)}m {timeUsed % 60}s</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-primary text-primary hover:bg-primary/5"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Quiz Center
        </Button>
        <Button
          onClick={onRetry}
          className="bg-gradient-to-r from-primary to-secondary text-white font-semibold"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Retake Quiz
        </Button>
      </div>
    </div>
  );
}

// Sample questions for demo
function generateSampleQuestions(): Question[] {
  return [
    {
      id: '1',
      question_text: 'In a double-entry bookkeeping system, what must always remain true?',
      option_a: 'Assets = Liabilities + Equity',
      option_b: 'Debits must equal Credits',
      option_c: 'Both A and B',
      option_d: 'Revenue must exceed Expenses',
      correct_answer: 'option_c',
      explanation: 'The accounting equation (Assets = Liabilities + Equity) and the double-entry principle (Debits = Credits) are fundamental to bookkeeping.',
    },
    {
      id: '2',
      question_text: 'What is the primary purpose of an income statement?',
      option_a: 'Show financial position at a point in time',
      option_b: 'Show profitability over a period',
      option_c: 'Show cash flows',
      option_d: 'Show financial forecasts',
      correct_answer: 'option_b',
      explanation: 'An income statement (P&L) shows revenue, expenses, and profit/loss over a specific period.',
    },
    {
      id: '3',
      question_text: 'Which cost remains constant regardless of production volume?',
      option_a: 'Variable Cost',
      option_b: 'Fixed Cost',
      option_c: 'Semi-variable Cost',
      option_d: 'Marginal Cost',
      correct_answer: 'option_b',
      explanation: 'Fixed costs like rent do not change with production volume.',
    },
    {
      id: '4',
      question_text: 'What is the formula for Gross Profit?',
      option_a: 'Revenue - Cost of Goods Sold',
      option_b: 'Revenue - Operating Expenses',
      option_c: 'Profit before Tax',
      option_d: 'Revenue - All Expenses',
      correct_answer: 'option_a',
      explanation: 'Gross Profit = Revenue - COGS (before operating expenses).',
    },
    {
      id: '5',
      question_text: 'Which account type appears on the Balance Sheet?',
      option_a: 'Revenue',
      option_b: 'Expense',
      option_c: 'Asset',
      option_d: 'All of the above',
      correct_answer: 'option_c',
      explanation: 'Only Assets, Liabilities, and Equity appear on the Balance Sheet. Revenue and Expenses are on the Income Statement.',
    },
    {
      id: '6',
      question_text: 'What is the purpose of depreciation?',
      option_a: 'To reduce tax liability',
      option_b: 'To allocate asset cost over useful life',
      option_c: 'To increase cash flow',
      option_d: 'To write off bad debts',
      correct_answer: 'option_b',
      explanation: 'Depreciation spreads the cost of a fixed asset over its useful economic life.',
    },
    {
      id: '7',
      question_text: 'What is a deferred revenue?',
      option_a: 'Revenue earned but not received',
      option_b: 'Cash received for services not yet provided',
      option_c: 'Revenue that will never be received',
      option_d: 'Revenue from previous periods',
      correct_answer: 'option_b',
      explanation: 'Deferred revenue (unearned revenue) is cash received before services are delivered.',
    },
    {
      id: '8',
      question_text: 'Which ratio measures how efficiently a company uses its assets?',
      option_a: 'Current Ratio',
      option_b: 'Asset Turnover Ratio',
      option_c: 'Debt to Equity',
      option_d: 'Profit Margin',
      correct_answer: 'option_b',
      explanation: 'Asset Turnover Ratio = Revenue / Total Assets shows how efficiently assets generate revenue.',
    },
    {
      id: '9',
      question_text: 'What does a Balance Sheet show?',
      option_a: 'Profitability',
      option_b: 'Cash position at a point in time',
      option_c: 'Financial position at a specific date',
      option_d: 'Both B and C',
      correct_answer: 'option_d',
      explanation: 'Balance Sheet shows Assets, Liabilities, and Equity at a specific date.',
    },
    {
      id: '10',
      question_text: 'Which accounting principle ensures consistency over time?',
      option_a: 'Materiality',
      option_b: 'Consistency',
      option_c: 'Prudence',
      option_d: 'Matching',
      correct_answer: 'option_b',
      explanation: 'The Consistency principle requires using the same accounting methods period to period.',
    },
  ];
}
