'use client';

import { useState } from 'react';
import {
  Target,
  Play,
  Lock,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuizEngine from '@/components/QuizEngine';

const quizModules = [
  {
    id: 1,
    name: 'Financial Accounting',
    emoji: '📊',
    color: 'from-primary to-secondary',
    lightColor: 'bg-primary/10',
    iconColor: 'text-primary',
    description: 'Master journal entries, ledgers, and financial statements',
    questions: 250,
    completed: 42,
    avgScore: 92,
    difficulty: 'Intermediate',
    status: 'in-progress',
  },
  {
    id: 2,
    name: 'Cost Accounting',
    emoji: '💰',
    color: 'from-secondary to-accent',
    lightColor: 'bg-secondary/10',
    iconColor: 'text-secondary',
    description: 'Learn cost classification, allocation, and analysis methods',
    questions: 180,
    completed: 35,
    avgScore: 87,
    difficulty: 'Intermediate',
    status: 'in-progress',
  },
  {
    id: 3,
    name: 'Taxation',
    emoji: '📋',
    color: 'from-accent to-primary',
    lightColor: 'bg-accent/10',
    iconColor: 'text-accent',
    description: 'Understand income tax, deductions, and filing procedures',
    questions: 150,
    completed: 28,
    avgScore: 89,
    difficulty: 'Intermediate',
    status: 'in-progress',
  },
  {
    id: 4,
    name: 'Auditing',
    emoji: '🔍',
    color: 'from-primary to-accent',
    lightColor: 'bg-primary/10',
    iconColor: 'text-primary',
    description: 'Explore audit procedures, evidence collection, and reporting',
    questions: 140,
    completed: 18,
    avgScore: 84,
    difficulty: 'Advanced',
    status: 'todo',
  },
  {
    id: 5,
    name: 'Business Law',
    emoji: '⚖️',
    color: 'from-secondary to-primary',
    lightColor: 'bg-secondary/10',
    iconColor: 'text-secondary',
    description: 'Study contract law, corporate law, and business regulations',
    questions: 120,
    completed: 15,
    avgScore: 86,
    difficulty: 'Beginner',
    status: 'todo',
  },
  {
    id: 6,
    name: 'Economics',
    emoji: '📈',
    color: 'from-accent to-secondary',
    lightColor: 'bg-accent/10',
    iconColor: 'text-accent',
    description: 'Understand microeconomics and macroeconomic principles',
    questions: 100,
    completed: 12,
    avgScore: 81,
    difficulty: 'Beginner',
    status: 'todo',
  },
  {
    id: 7,
    name: 'Management Services',
    emoji: '🎯',
    color: 'from-primary to-secondary',
    lightColor: 'bg-primary/10',
    iconColor: 'text-primary',
    description: 'Master consulting, budgeting, and performance management',
    questions: 130,
    completed: 8,
    avgScore: null,
    difficulty: 'Advanced',
    status: 'todo',
  },
];

const upcomingQuizzes = [
  { name: 'Financial Accounting - Chapter 5', time: 'Tomorrow, 10:00 AM' },
  { name: 'Cost Accounting - Module Review', time: 'Mar 20, 2024' },
  { name: 'Taxation - Q1 Assessment', time: 'Mar 22, 2024' },
];

export default function QuizPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<{ id: string; name: string; difficulty: 'Easy' | 'Intermediate' | 'Advanced' } | null>(null);

  const handleQuizStart = (module: typeof quizModules[0]) => {
    setActiveQuiz({
      id: module.id.toString(),
      name: module.name,
      difficulty: module.difficulty as 'Easy' | 'Intermediate' | 'Advanced',
    });
  };

  const handleBackToQuizList = () => {
    setActiveQuiz(null);
  };

  // Show quiz engine if active
  if (activeQuiz) {
    return (
      <div className="space-y-6">
        <QuizEngine
          quizId={activeQuiz.id}
          moduleName={activeQuiz.name}
          difficulty={activeQuiz.difficulty}
          onBack={handleBackToQuizList}
        />
      </div>
    );
  }

  const filteredModules = selectedDifficulty
    ? quizModules.filter((m) => m.difficulty === selectedDifficulty)
    : quizModules;

  const overallStats = {
    totalCompleted: quizModules.reduce((sum, m) => sum + m.completed, 0),
    totalQuestions: quizModules.reduce((sum, m) => sum + m.questions, 0),
    avgScore: Math.round(
      quizModules.filter(m => m.avgScore !== null).reduce((sum, m) => sum + (m.avgScore || 0), 0) /
      quizModules.filter(m => m.avgScore !== null).length
    ),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Quiz Center</h1>
        <p className="text-muted-foreground mt-2">Practice, assess, and master all accounting subjects</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Questions Done</p>
              <p className="text-3xl font-bold text-foreground">{overallStats.totalCompleted}</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Total Questions</p>
              <p className="text-3xl font-bold text-foreground">{overallStats.totalQuestions}</p>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <Target className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Average Score</p>
              <p className="text-3xl font-bold text-foreground">{overallStats.avgScore}%</p>
            </div>
            <div className="bg-accent/10 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Accuracy Rate</p>
              <p className="text-3xl font-bold text-foreground">89%</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg">
              <Award className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Quizzes */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Upcoming Scheduled Quizzes
        </h3>
        <div className="space-y-3">
          {upcomingQuizzes.map((quiz, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/80 rounded-lg p-4">
              <div>
                <p className="font-medium text-foreground">{quiz.name}</p>
                <p className="text-sm text-muted-foreground">{quiz.time}</p>
              </div>
              <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
                Prepare
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedDifficulty(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            !selectedDifficulty
              ? 'bg-primary text-white'
              : 'bg-white border border-border text-foreground hover:border-primary'
          }`}
        >
          All Levels
        </button>
        {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
          <button
            key={level}
            onClick={() => setSelectedDifficulty(level)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedDifficulty === level
                ? 'bg-primary text-white'
                : 'bg-white border border-border text-foreground hover:border-primary'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Quiz Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => (
          <div key={module.id} className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow group">
            {/* Header with Gradient */}
            <div className={`h-24 bg-gradient-to-r ${module.color} p-6 flex items-end`}>
              <div className="flex items-end gap-3 w-full">
                <span className="text-4xl">{module.emoji}</span>
                <div>
                  <h3 className="font-bold text-white">{module.name}</h3>
                  <p className="text-white/80 text-xs">{module.difficulty}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">{module.description}</p>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-foreground">Progress</span>
                  <span className="text-xs font-bold text-foreground">
                    {module.completed} / {module.questions}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${module.color} transition-all duration-500`}
                    style={{ width: `${(module.completed / module.questions) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-border">
                <div>
                  <p className="text-muted-foreground text-xs">Questions</p>
                  <p className="font-bold text-foreground">{module.questions}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Best Score</p>
                  <p className="font-bold text-foreground">{module.avgScore ? `${module.avgScore}%` : '-'}</p>
                </div>
              </div>

              {/* Button */}
              <Button
                onClick={() => handleQuizStart(module)}
                className={`w-full h-10 font-semibold text-white ${
                  module.status === 'locked'
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-gradient-to-r ' + module.color + ' hover:shadow-lg'
                }`}
                disabled={module.status === 'locked'}
              >
                {module.status === 'locked' ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Locked
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Quiz
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-accent/5 to-primary/5 rounded-2xl border border-accent/20 p-8">
        <h3 className="text-2xl font-bold text-foreground mb-4">Quiz Tips for Success</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="font-bold text-foreground mb-2">⏱️ Manage Your Time</p>
            <p className="text-sm text-muted-foreground">
              Each quiz has a time limit. Practice fast reading and quick decision-making.
            </p>
          </div>
          <div>
            <p className="font-bold text-foreground mb-2">📝 Review Your Answers</p>
            <p className="text-sm text-muted-foreground">
              After completing a quiz, review your answers to understand concepts better.
            </p>
          </div>
          <div>
            <p className="font-bold text-foreground mb-2">📊 Track Your Progress</p>
            <p className="text-sm text-muted-foreground">
              Monitor your performance trends and focus on weak areas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
