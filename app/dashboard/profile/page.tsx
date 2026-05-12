'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  MapPin,
  Award,
  TrendingUp,
  Calendar,
  Book,
  Target,
  Edit2,
  Loader,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getUserLevel } from '@/lib/leaderboard';

const badges = [
  { emoji: '⭐', name: 'Quiz Master', description: '90%+ in 10 quizzes' },
  { emoji: '🔥', name: 'Perfect Streak', description: '12-day streak', earned: true },
  { emoji: '🎯', name: 'Target Achiever', description: 'Complete 5 subjects' },
  { emoji: '👑', name: 'Champion', description: 'Top 5 on leaderboard', earned: true },
  { emoji: '📚', name: 'Knowledge Seeker', description: 'Read 50 resources' },
  { emoji: '💡', name: 'Quick Learner', description: 'Complete quiz under 10 min' },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [progression, setProgression] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          const prog = getUserLevel(profileData.total_xp || 0);
          setProgression(prog);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || !progression) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load profile</p>
      </div>
    );
  }

  const achievements = [
    { icon: '📊', label: 'Overall Accuracy', value: `${Math.round(profile.accuracy_percentage || 0)}%` },
    { icon: '🎓', label: 'Quizzes Completed', value: profile.total_quizzes_completed || 0 },
    { icon: '📝', label: 'Notes Created', value: 128 },
    { icon: '⏱️', label: 'Total XP', value: profile.total_xp || 0 },
    { icon: '🔥', label: 'Current Streak', value: `${profile.current_streak || 0} days` },
    { icon: '🏆', label: 'Level Progress', value: `${Math.round(progression.percentToNext)}%` },
  ];
  return (
    <div className="space-y-8">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl border-2 border-white/30">
              {profile.full_name
                ?.split(' ')
                .map((n: string) => n[0])
                .join('')}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{profile.full_name || 'Student'}</h1>
              <div className="space-y-1 text-white/90">
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {progression.levelName}
                </p>
                {profile.student_id && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {profile.student_id}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Button className="bg-white text-primary hover:bg-gray-100 font-semibold h-11">
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-border p-6 text-center">
            <div className="text-4xl mb-3">{item.icon}</div>
            <p className="text-sm text-muted-foreground mb-2">{item.label}</p>
            <p className="text-3xl font-bold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                  Email
                </p>
                <p className="text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  alex.johnson@university.edu
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                  Phone
                </p>
                <p className="text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  +91 98765 43210
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                  University
                </p>
                <p className="text-foreground">Delhi Institute of Chartered Accountants</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                  Year
                </p>
                <p className="text-foreground">4th Year (Final)</p>
              </div>
            </div>
          </div>

          {/* Study Preferences */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Book className="w-5 h-5" />
              Study Preferences
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Favorite Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {['Financial', 'Cost', 'Taxation'].map((subject) => (
                    <span
                      key={subject}
                      className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Study Time</p>
                <p className="text-sm text-muted-foreground">Evenings (6 PM - 10 PM)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Achievements & Badges */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progression & Badges */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Level Progression
            </h3>
            
            {/* Level Display */}
            <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Level</p>
                  <p className="text-2xl font-bold text-foreground">{progression.levelName}</p>
                </div>
                <div className="text-4xl">{progression.level === 1 ? '📚' : progression.level === 2 ? '📊' : progression.level === 3 ? '🔍' : progression.level === 4 ? '✓' : '👑'}</div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Level {progression.level} Progress</span>
                  <span className="font-semibold text-foreground">{Math.round(progression.percentToNext)}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                    style={{ width: `${progression.percentToNext}%` }}
                  ></div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">
                {progression.currentXP.toLocaleString()} / {progression.requiredXP.toLocaleString()} XP
              </p>
            </div>

            {/* Badges */}
            <div className="mt-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Achievements
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {badges.map((badge, idx) => (
                  <div
                    key={idx}
                    className={`text-center p-4 rounded-xl border-2 transition-all ${
                      badge.earned
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/50 bg-muted/30 opacity-60'
                    }`}
                  >
                    <div className="text-3xl mb-2">{badge.emoji}</div>
                    <p className={`font-semibold text-sm mb-1 ${
                      badge.earned ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {badge.name}
                    </p>
                    <p className={`text-xs ${
                      badge.earned ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {badge.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Learning Summary */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Learning Summary
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Financial Accounting', progress: 92 },
                { label: 'Cost Accounting', progress: 87 },
                { label: 'Taxation', progress: 89 },
                { label: 'Auditing', progress: 84 },
                { label: 'Business Law', progress: 86 },
              ].map((subject, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-foreground text-sm">{subject.label}</p>
                    <p className="font-bold text-primary text-sm">{subject.progress}%</p>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                      style={{ width: `${subject.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings Quick Link */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20 p-6 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-foreground mb-1">Additional Settings</h4>
          <p className="text-sm text-muted-foreground">
            Manage notifications, privacy, and account preferences
          </p>
        </div>
        <Button className="bg-primary text-white hover:bg-primary/90">
          Go to Settings
        </Button>
      </div>
    </div>
  );
}
