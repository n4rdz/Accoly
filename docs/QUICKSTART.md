# 🚀 Accountify Pure HTML/CSS/JS - Quick Start Guide

## ⚡ 30 Second Setup

### Step 1: Open in Browser
```bash
# Just open index.html in your browser!
# Or use a local server:
python -m http.server 8000
# Then visit: http://localhost:8000
```

### Step 2: Sign Up
- Click **"Get Started"** on landing page
- Fill in: Full Name, Email, Password, Confirm Password
- Click **"Sign Up"**

### Step 3: Take Your First Quiz
- Click **"Quiz Center"** in sidebar
- Pick any subject
- Click **"Start Quiz"**
- Answer 10 questions in 30 minutes
- Get instant score and XP!

---

## 📊 What You Get

### Fully Working Features

| Feature | Status | Location |
|---------|--------|----------|
| User Authentication | ✅ Complete | login.html, signup.html |
| Dashboard | ✅ Complete | dashboard.html |
| Quiz System (70 Qs) | ✅ Complete | quiz.html |
| Timer (30 min) | ✅ Complete | quiz.html |
| Score Calculation | ✅ Complete | quiz.js |
| XP System | ✅ Complete | storage.js |
| Level Progression | ✅ Complete | profile.html |
| Leaderboard | ✅ Complete | leaderboard.html |
| User Profile | ✅ Complete | profile.html |
| Settings | ✅ Complete | settings.html |

### Coming Soon
- Digital Notepad
- Notes Module
- Standards Library

---

## 🎮 Quiz System Overview

### 7 Subjects × 10 Questions Each = 70 Total Questions

1. **Financial Accounting** (Easy)
   - Balance sheet, income statement, accounting principles
   
2. **Cost Accounting** (Intermediate)
   - Cost behavior, break-even, variance analysis
   
3. **Auditing** (Hard)
   - Audit procedures, materiality, evidence gathering
   
4. **Taxation** (Intermediate)
   - Tax systems, deductions, capital gains
   
5. **Business Law** (Easy)
   - Contracts, partnerships, property rights
   
6. **Economics** (Intermediate)
   - Supply/demand, inflation, GDP, elasticity
   
7. **MAS** (Hard)
   - Strategy, risk management, performance metrics

---

## 💾 Sample Login

**Create your own account during signup** - the app stores everything locally!

For testing:
- Email: any@email.com
- Password: any password you want (6+ chars)
- Everything is saved in browser localStorage

---

## 🎯 Quiz Flow

```
Quiz Center
    ↓
Select Subject (7 options)
    ↓
Choose Difficulty (Easy/Intermediate/Hard)
    ↓
Start Quiz (30 minute timer)
    ↓
Answer 10 Random Questions
    ↓
Submit Quiz
    ↓
See Results:
  - Score (A/B/C/F grade)
  - Accuracy %
  - XP Earned
  - Time Taken
    ↓
Retake Quiz (questions shuffle)
or Back to Quiz Center
```

---

## 📊 Scoring System

### How You Earn Points

**XP by Difficulty:**
- Easy Quiz (pass): 50 XP base
- Intermediate Quiz (pass): 100 XP base
- Hard Quiz (pass): 200 XP base

**Accuracy Bonus:**
- 100% correct: +150 XP
- 90-99%: +75 XP
- 80-89%: +25 XP
- Below 70%: 0 XP (fail)

**Grade Calculation:**
- A = 90-100%
- B = 80-89%
- C = 70-79%
- F = Below 70%

### Example
Hard Quiz with 9/10 correct (90%) = 200 + 75 = **275 XP**

---

## 🏆 Leaderboard

### How Rankings Work

**Points Calculation:**
```
Points = (Total XP ÷ 10) + (Accuracy ÷ 100 × 20) + Quiz Count
```

**Filters:**
- All Time (top performers overall)
- Monthly (top this month)
- Weekly (top this week)
- Daily (top today)

**Your Position:**
- Shown at bottom of leaderboard
- Updates after every quiz
- Your rank based on total points

---

## 👤 Profile & Levels

### Level System (5 Levels)

| Level | Name | XP Required | Icon |
|-------|------|------------|------|
| 1 | Beginner Accountant | 0 XP | 📚 |
| 2 | Junior Analyst | 500 XP | 📊 |
| 3 | Senior Reviewer | 1,500 XP | 🔍 |
| 4 | Audit Specialist | 3,500 XP | ✓ |
| 5 | CPA Elite | 7,000 XP | 👑 |

### Your Profile Shows
- Current level & progress bar
- Total XP accumulated
- Average accuracy %
- Quizzes completed
- Current study streak
- Recent quiz attempts
- Achievement badges

---

## 🔧 Settings

### What You Can Do
- View your email
- Change theme (Light/Dark/Auto)
- Enable/disable notifications
- **Clear All Data** (deletes everything - use carefully!)

---

## 📱 Mobile Ready

✅ Works great on:
- iPhone/iPad
- Android phones
- Tablets
- Desktop

Just open in mobile browser!

---

## 💾 Your Data

### What's Saved
- Your account (email and full name)
- All quiz attempts with scores
- Your XP and level
- Accuracy stats
- Study streak

### Where It's Saved
**Browser's localStorage** - persists even after closing browser!

### How to Delete
- Settings → "Clear All Data" button
- Or manually: Clear browser cache

---

## ⚙️ Browser Settings

**Required for full functionality:**
- ✅ JavaScript enabled
- ✅ localStorage enabled
- ✅ Cookies enabled (optional)

**No account needed!** Everything works offline in your browser.

---

## 🎯 Tips for Success

### Quiz Tips
1. **Read carefully** - Don't rush through questions
2. **Use timer** - 30 minutes is plenty for 10 questions
3. **Navigate smart** - Use question numbers to jump around
4. **Try hard mode** - Earn 4x the XP of easy quizzes
5. **Retake often** - Different questions each time!

### Study Tips
1. **Take one quiz per day** - Build your streak 🔥
2. **Mix difficulties** - Easy for confidence, Hard for growth
3. **Track progress** - Check leaderboard regularly
4. **Review explanations** - Learn why answers are correct
5. **Aim for A's** - 90%+ unlocks maximum XP bonus

### Competition Tips
1. **Check leaderboard** - See where you rank
2. **Beat your score** - Retake to improve %
3. **Consistent practice** - Small daily gains add up
4. **Master hard quizzes** - Worth 4x easy questions
5. **Maintain streak** - Daily practice compounds

---

## ⚡ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ← | Previous Question |
| → | Next Question |
| 1-9 | Jump to Question |
| Esc | Exit Quiz |
| Enter | Submit (if on last Q) |

---

## 🐛 Troubleshooting

### Quiz Won't Load
- Refresh the page (F5)
- Check browser console (F12)
- Try different browser

### Timer Issues
- Timer auto-submits when it reaches 0:00
- Refresh doesn't reset timer mid-quiz
- Submit early to stop timer

### Data Not Saving
- Check if localStorage is enabled
- Try private/incognito window
- Clear cache and retry

### Leaderboard Empty
- Need at least one quiz attempt
- Check you're logged in
- Refresh page

---

## 📈 Your First 24 Hours

**Suggested schedule:**

1. **Hour 0** - Sign up account
2. **Hour 1** - Take Financial Accounting Easy quiz
3. **Hour 6** - Take Cost Accounting quiz  
4. **Hour 12** - Take Auditing quiz
5. **Hour 18** - Check leaderboard
6. **Hour 24** - Retake your best quiz to improve score

**Expected progress:**
- 3-4 quizzes taken
- ~400-600 XP earned
- Level 1→ Level 2 progression
- Ready to compete!

---

## 🌟 Features Highlight

### Quiz Taking
- ✅ 70 accounting questions
- ✅ Random shuffle each time
- ✅ 30-minute countdown timer
- ✅ Question navigator grid
- ✅ Instant grading (A-F)
- ✅ XP calculation
- ✅ Unlimited retakes

### Leaderboard
- ✅ Real-time rankings
- ✅ Podium display
- ✅ Top 3 highlighted
- ✅ Time period filters
- ✅ Your position shown
- ✅ Points calculation
- ✅ Level badges

### Profile
- ✅ User stats
- ✅ 5-level system
- ✅ Progress bars
- ✅ Achievement badges
- ✅ Quiz history
- ✅ Streak counter
- ✅ XP tracker

---

## 🚀 Advanced Usage

### Export Your Data
Open Browser DevTools (F12):
```javascript
// View all your data
JSON.stringify(JSON.parse(localStorage.getItem('quizAttempts')), null, 2)
```

### Create Test Accounts
Sign up multiple accounts to see leaderboard with multiple people!

### Stress Test
Take 20+ quizzes to see how high level you can reach (max Level 5 at 7,000 XP)

---

## 💡 Ideas for Customization

1. **Change colors** - Edit `styles.css` CSS variables
2. **Add questions** - Edit `js/quiz-data.js`
3. **Modify timer** - Change `timeLimit` in `js/quiz.js`
4. **Add subjects** - Duplicate and modify quiz module
5. **Custom scoring** - Modify `calculateXP()` in `storage.js`

---

## ✨ Enjoy!

You now have a **fully functional accounting learning platform** that:
- Doesn't require any installation
- Works offline in your browser
- Tracks your progress automatically
- Competes with peers
- Rewards your learning

**Start learning accounting today!** 🎓

For detailed documentation, read **README.md**
