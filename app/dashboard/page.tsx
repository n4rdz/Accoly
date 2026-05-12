'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Target,
  BookMarked,
  TrendingUp,
  Clock,
  Award,
  ArrowRight,
  Flame,
  Users,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const performanceData = [
  { week: 'Week 1', score: 65 },
  { week: 'Week 2', score: 72 },
  { week: 'Week 3', score: 78 },
  { week: 'Week 4', score: 85 },
  { week: 'Week 5', score: 88 },
  { week: 'Week 6', score: 92 },
];

const subjectData = [
  { subject: 'Financial', score: 92 },
  { subject: 'Cost', score: 87 },
  { subject: 'Taxation', score: 89 },
  { subject: 'Auditing', score: 84 },
  { subject: 'Business Law', score: 86 },
  { subject: 'Economics', score: 81 },
];

const subjects = [
  {
    name: 'Financial Accounting',
    icon: BookOpen,
    color: 'from-primary to-secondary',
    lightColor: 'bg-primary/10',
    iconColor: 'text-primary',
    progress: 92,
    quizzes: 12,
    notes: 45,
  },
  {
    name: 'Cost Accounting',
    icon: BarChart3,
    color: 'from-secondary to-accent',
    lightColor: 'bg-secondary/10',
    iconColor: 'text-secondary',
    progress: 87,
    quizzes: 10,
    notes: 38,
  },
  {
    name: 'Taxation',
    icon: Target,
    color: 'from-accent to-primary',
    lightColor: 'bg-accent/10',
    iconColor: 'text-accent',
    progress: 89,
    quizzes: 8,
    notes: 32,
  },
];

const recentActivities = [
  { icon: Target, text: 'Completed Financial Accounting Quiz', time: '2 hours ago' },
  { icon: BookOpen, text: 'Added 5 new notes to Cost Accounting', time: '5 hours ago' },
  { icon: Award, text: 'Earned "Quiz Master" badge', time: '1 day ago' },
  { icon: TrendingUp, text: 'Improved score to 92% in Financial', time: '2 days ago' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Welcome Back, Alex!</h1>
          <p className="text-muted-foreground mt-2">Continue mastering accountancy subjects</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <Flame className="w-5 h-5 text-primary" />
          <span className="font-semibold text-primary">12-day streak 🔥</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Overall Progress</p>
              <p className="text-3xl font-bold text-foreground">89%</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Quizzes Completed</p>
              <p className="text-3xl font-bold text-foreground">42</p>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <Target className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Study Hours</p>
              <p className="text-3xl font-bold text-foreground">128</p>
            </div>
            <div className="bg-accent/10 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-accent" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Leaderboard Rank</p>
              <p className="text-3xl font-bold text-foreground">#15</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg">
              <Award className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: '#2563eb', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">Subject Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="subject" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="score"
                fill="#2563eb"
                radius={[8, 8, 0, 0]}
                animationDuration={600}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Cards */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Your Subjects</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const Icon = subject.icon;
            return (
              <Link key={subject.name} href="/dashboard/quiz">
                <div className="bg-white rounded-2xl border border-border p-6 hover:shadow-lg transition-all cursor-pointer group h-full">
                  <div className={`${subject.lightColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${subject.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{subject.name}</h3>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-bold text-foreground">{subject.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${subject.color} transition-all duration-500`}
                        style={{ width: `${subject.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Quizzes</p>
                      <p className="font-bold text-foreground">{subject.quizzes}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="font-bold text-foreground">{subject.notes}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-primary text-primary hover:bg-primary/5"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivities.map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <div key={idx} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                  <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0 mt-1">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard Preview */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" /> Top Students
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Sarah Ahmed', score: '95%' },
              { name: 'Michael Chen', score: '94%' },
              { name: 'You', score: '89%', isYou: true },
              { name: 'Emily Parker', score: '88%' },
              { name: 'James Wilson', score: '87%' },
            ].map((student, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  student.isYou ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-muted-foreground text-sm">#{idx + 1}</span>
                  <span className={`text-sm font-medium ${student.isYou ? 'text-primary' : 'text-foreground'}`}>
                    {student.name}
                  </span>
                </div>
                <span className="font-bold text-foreground text-sm">{student.score}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/leaderboard">
            <Button variant="outline" size="sm" className="w-full mt-4 border-primary text-primary hover:bg-primary/5">
              View Full Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
