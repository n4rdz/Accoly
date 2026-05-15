'use client';

import { useState } from 'react';
import {
  Settings,
  Bell,
  Lock,
  Eye,
  Database,
  LogOut,
  HelpCircle,
  Moon,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <button className="w-full flex items-center gap-3 px-6 py-4 bg-primary/10 text-primary font-semibold border-b border-border">
              <Settings className="w-5 h-5" />
              General
            </button>
            <button className="w-full flex items-center gap-3 px-6 py-4 text-foreground hover:bg-muted transition-colors font-medium">
              <Bell className="w-5 h-5" />
              Notifications
            </button>
            <button className="w-full flex items-center gap-3 px-6 py-4 text-foreground hover:bg-muted transition-colors font-medium">
              <Lock className="w-5 h-5" />
              Privacy & Security
            </button>
            <button className="w-full flex items-center gap-3 px-6 py-4 text-foreground hover:bg-muted transition-colors font-medium">
              <Database className="w-5 h-5" />
              Data & Storage
            </button>
            <button className="w-full flex items-center gap-3 px-6 py-4 text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-border">
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              General Settings
            </h3>

            <div className="space-y-6">
              {/* Theme */}
              <div className="flex items-center justify-between pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                  <Moon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-foreground">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Use dark theme for reduced eye strain
                    </p>
                  </div>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>

              {/* Language */}
              <div className="pb-6 border-b border-border">
                <label className="block font-semibold text-foreground mb-3">Language</label>
                <select className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground">
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Spanish</option>
                </select>
              </div>

              {/* Timezone */}
              <div className="pb-6 border-b border-border">
                <label className="block font-semibold text-foreground mb-3">Timezone</label>
                <select className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground">
                  <option>IST (Indian Standard Time)</option>
                  <option>UTC</option>
                  <option>EST</option>
                </select>
              </div>

              {/* Auto-save */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Auto-save Notes</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically save your notes every 5 minutes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h3>

            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between pb-6 border-b border-border">
                <div>
                  <p className="font-semibold text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get updates about quizzes and achievements
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between pb-6 border-b border-border">
                <div>
                  <p className="font-semibold text-foreground">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive browser notifications
                  </p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Volume2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-foreground">Sound Effects</p>
                    <p className="text-sm text-muted-foreground">
                      Play sounds for quiz completion
                    </p>
                  </div>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Privacy & Security
            </h3>

            <div className="space-y-6">
              {/* Password */}
              <div className="pb-6 border-b border-border">
                <label className="block font-semibold text-foreground mb-3">
                  Change Password
                </label>
                <div className="space-y-3">
                  <Input
                    type="password"
                    placeholder="Current password"
                    className="bg-white border-border"
                  />
                  <Input
                    type="password"
                    placeholder="New password"
                    className="bg-white border-border"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    className="bg-white border-border"
                  />
                  <Button className="bg-primary text-white">Update Password</Button>
                </div>
              </div>

              {/* Profile Visibility */}
              <div className="flex items-center justify-between pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                  <Eye className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-foreground">
                      Public Profile
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Show your profile on leaderboard
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Two-Factor Authentication */}
              <div>
                <p className="font-semibold text-foreground mb-3">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add an extra layer of security to your account
                </p>
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/5"
                >
                  Enable 2FA
                </Button>
              </div>
            </div>
          </div>

          {/* Data & Storage */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data & Storage
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-foreground">Storage Used</p>
                  <p className="text-primary font-bold">2.4 GB / 10 GB</p>
                </div>
                <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                    style={{ width: '24%' }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="font-semibold text-foreground mb-4">Data Management</p>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-border text-foreground hover:bg-muted"
                  >
                    Download My Data
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-border text-foreground hover:bg-muted"
                  >
                    Clear Cache
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-red-500 text-red-600 hover:bg-red-50"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Help & Support */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/10 p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Need Help?
            </h3>
            <p className="text-muted-foreground mb-4">
              Can&apos;t find what you&apos;re looking for? Check our documentation or contact support.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/5"
              >
                Documentation
              </Button>
              <Button className="bg-primary text-white">Contact Support</Button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground pt-2">Accoly Technologies</p>
        </div>
      </div>
    </div>
  );
}
