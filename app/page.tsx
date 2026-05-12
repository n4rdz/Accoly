'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  BookOpen,
  Zap,
  Users,
  TrendingUp,
  Target,
  ArrowRight,
  CheckCircle2,
  Award,
  Lightbulb,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">Accountify</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-foreground hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#benefits" className="text-foreground hover:text-primary transition-colors">
              Benefits
            </Link>
            <Link href="#" className="text-foreground hover:text-primary transition-colors">
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/5"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg transition-shadow">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <main className="relative">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-block mb-6 px-4 py-2 bg-accent/10 border border-accent/30 rounded-full">
                <p className="text-sm font-semibold text-accent flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Unlock Your Accounting Potential
                </p>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Master Accountancy with <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Smarter Learning</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Study accounting subjects, practice quizzes, organize notes, and access updated accounting standards in one powerful platform built exclusively for future CPAs.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary text-white text-lg font-semibold rounded-lg hover:shadow-xl transition-all duration-300"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-primary text-primary hover:bg-primary/5 text-lg font-semibold rounded-lg"
                  >
                    Explore Dashboard
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-3xl font-bold text-primary">1000+</p>
                  <p className="text-sm text-muted-foreground">Students Learning</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">50+</p>
                  <p className="text-sm text-muted-foreground">Quiz Modules</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">98%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative h-96 md:h-full flex items-center justify-center">
              <div className="w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-2xl absolute"></div>
              <div className="relative z-10 bg-white/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-xl w-full max-w-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                    <BookOpen className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">Financial Accounting</p>
                      <p className="text-xs text-muted-foreground">12 chapters, 250 questions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/5 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-secondary" />
                    <div>
                      <p className="font-semibold text-foreground">Cost Accounting</p>
                      <p className="text-xs text-muted-foreground">10 chapters, 180 questions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-lg">
                    <Target className="w-6 h-6 text-accent" />
                    <div>
                      <p className="font-semibold text-foreground">Taxation</p>
                      <p className="text-xs text-muted-foreground">8 chapters, 150 questions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed specifically for accountancy students
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1: Notes */}
            <div className="bg-white rounded-2xl border border-border p-8 hover:shadow-lg transition-shadow">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Digital Notes</h3>
              <p className="text-muted-foreground mb-4">
                Organize notes for all 7 accounting subjects with pen tools, templates, and smart highlighting.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Blue highlighter tools
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Paper templates
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Auto-save functionality
                </li>
              </ul>
            </div>

            {/* Feature 2: Quiz */}
            <div className="bg-white rounded-2xl border border-border p-8 hover:shadow-lg transition-shadow">
              <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Quiz Center</h3>
              <p className="text-muted-foreground mb-4">
                Master 7 subject modules with timed quizzes, instant feedback, and progress tracking.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  Timed assessments
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  Leaderboard rankings
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  Achievement badges
                </li>
              </ul>
            </div>

            {/* Feature 3: Standards */}
            <div className="bg-white rounded-2xl border border-border p-8 hover:shadow-lg transition-shadow">
              <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Standards Library</h3>
              <p className="text-muted-foreground mb-4">
                Access the latest accounting standards, regulations, and reviewer materials.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  Updated regulations
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  PDF annotations
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  Easy downloads
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-3xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-8">
                Why Choose Accountify?
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Award className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-foreground mb-2">Premium Learning Experience</h4>
                    <p className="text-muted-foreground">
                      Designed by accountancy professionals for student success
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Lightbulb className="w-8 h-8 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-foreground mb-2">Smart Study Tools</h4>
                    <p className="text-muted-foreground">
                      Organize, practice, and track your progress in one platform
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Users className="w-8 h-8 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-foreground mb-2">Community & Gamification</h4>
                    <p className="text-muted-foreground">
                      Compete with peers, earn badges, and celebrate achievements
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-border p-8 shadow-lg">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                  <span className="font-semibold text-foreground">Financial Accounting</span>
                  <span className="text-primary font-bold">92%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-secondary/5 rounded-lg">
                  <span className="font-semibold text-foreground">Cost Accounting</span>
                  <span className="text-secondary font-bold">87%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-accent/5 rounded-lg">
                  <span className="font-semibold text-foreground">Taxation</span>
                  <span className="text-accent font-bold">89%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="font-semibold text-foreground">Average Student Performance</span>
                  <span className="text-primary font-bold">89%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-12 text-center text-white shadow-xl">
            <h2 className="text-4xl font-bold mb-4">Ready to Succeed?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Join 1000+ accountancy students already mastering their subjects with Accountify
            </p>
            <Link href="/login">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-gray-100 font-bold text-lg"
              >
                Start Learning Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
            <p>© 2024 Accountify. All rights reserved. Built for Future CPAs.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
