'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, Award, Filter, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLeaderboard, getUserLeaderboardPosition } from '@/lib/leaderboard';

const filterOptions = [
  { label: 'All Time', value: 'all_time' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Daily', value: 'daily' },
];

export default function LeaderboardPage() {
  const [filter, setFilter] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('all_time');
  const [sortBy, setSortBy] = useState('score');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPosition, setUserPosition] = useState<any>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await getLeaderboard(filter);
        setLeaderboardData(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [filter]);

  // Get top 3 for display
  const topThree = leaderboardData.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">Compete with fellow accountancy students</p>
      </div>

      {/* Top Performers Podium */}
      {loading ? (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      ) : topThree.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl p-8 text-center text-white shadow-lg h-full flex flex-col justify-end">
                <div className="text-5xl mb-3">🥈</div>
                <h3 className="text-xl font-bold mb-1">{topThree[1].userName}</h3>
                <p className="text-gray-100 mb-3">2nd Place</p>
                <p className="text-2xl font-bold">{Math.round(topThree[1].accuracy)}%</p>
                <p className="text-sm text-gray-100 mt-2">{topThree[1].quizCount} Quizzes • {topThree[1].currentStreak} Day Streak</p>
              </div>
            </div>
          )}

          {/* 1st Place - Center */}
          {topThree[0] && (
            <div className="md:col-span-1 md:order-2 md:mt-8">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-8 text-center text-white shadow-xl">
                <div className="text-6xl mb-4">👑</div>
                <h3 className="text-2xl font-bold mb-1">{topThree[0].userName}</h3>
                <p className="text-yellow-100 mb-4">1st Place</p>
                <p className="text-3xl font-bold">{Math.round(topThree[0].accuracy)}%</p>
                <p className="text-sm text-yellow-100 mt-2">{topThree[0].quizCount} Quizzes • {topThree[0].currentStreak} Day Streak</p>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-orange-300 to-orange-400 rounded-2xl p-8 text-center text-white shadow-lg h-full flex flex-col justify-end">
                <div className="text-5xl mb-3">🥉</div>
                <h3 className="text-xl font-bold mb-1">{topThree[2].userName}</h3>
                <p className="text-orange-100 mb-3">3rd Place</p>
                <p className="text-2xl font-bold">{Math.round(topThree[2].accuracy)}%</p>
                <p className="text-sm text-orange-100 mt-2">{topThree[2].quizCount} Quizzes • {topThree[2].currentStreak} Day Streak</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-2xl">
          <p className="text-muted-foreground">No leaderboard data available yet</p>
        </div>
      )}

      {/* Filter & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <div className="flex gap-2 flex-wrap">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === option.value
                    ? 'bg-primary text-white'
                    : 'bg-white border border-border text-foreground hover:border-primary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 ml-auto">
          <Button
            size="sm"
            variant={sortBy === 'score' ? 'default' : 'outline'}
            onClick={() => setSortBy('score')}
            className={sortBy === 'score' ? 'bg-primary' : ''}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Score
          </Button>
          <Button
            size="sm"
            variant={sortBy === 'streak' ? 'default' : 'outline'}
            onClick={() => setSortBy('streak')}
            className={sortBy === 'streak' ? 'bg-primary' : ''}
          >
            <Award className="w-4 h-4 mr-2" />
            Streak
          </Button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Points</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Accuracy</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Quizzes</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Streak</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Level</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No data available yet
                  </td>
                </tr>
              ) : (
                leaderboardData.map((student) => (
                  <tr
                    key={student.userId}
                    className="border-b border-border transition-colors hover:bg-muted/50"
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`font-bold text-lg ${
                          student.rank === 1
                            ? 'text-yellow-500'
                            : student.rank === 2
                            ? 'text-gray-400'
                            : student.rank === 3
                            ? 'text-orange-400'
                            : 'text-foreground'
                        }`}
                      >
                        #{student.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                          {student.userName
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{student.userName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-foreground text-lg">{student.totalPoints}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-foreground">{Math.round(student.accuracy)}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-foreground">{student.quizCount}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm">🔥</span>
                        <span className="font-semibold text-foreground">{student.currentStreak}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-primary">{student.badge} {student.levelName}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Achievement Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-border p-6 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h4 className="font-bold text-foreground mb-2">Perfect Streak</h4>
          <p className="text-sm text-muted-foreground">Complete 30 days of consecutive learning</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-6 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h4 className="font-bold text-foreground mb-2">Quiz Master</h4>
          <p className="text-sm text-muted-foreground">Score 90% or above in 10 quizzes</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-6 text-center">
          <div className="text-4xl mb-3">👑</div>
          <h4 className="font-bold text-foreground mb-2">Champion</h4>
          <p className="text-sm text-muted-foreground">Rank in top 3 on the leaderboard</p>
        </div>
      </div>
    </div>
  );
}
