# Accountify - Pure HTML/CSS/JavaScript

A premium educational learning platform for accountancy students built entirely with **vanilla HTML5, CSS3, and JavaScript** - no frameworks, no build process, no dependencies.

## Quick Start

1. Open `pure-html/index.html` in your browser
2. Create a student account
3. Start taking quizzes and track your progress

## Features

✅ **11 Complete Pages**
- Landing page with hero section
- Authentication (login/signup)
- Dashboard with stats and activity
- Quiz Center with 70 accounting questions
- Real leaderboard with rankings
- User profile with progression system
- Notes, standards, notepad, and settings pages

✅ **Quiz System**
- 70 questions across 7 accounting subjects
- 30-minute countdown timer
- Random question shuffling
- Instant score calculation with A-F grading
- XP earning system
- Unlimited retakes

✅ **Leaderboard & Progression**
- Competitive leaderboard with podium display
- 5-level progression system (Beginner → CPA Elite)
- XP tracking with difficulty multipliers
- Achievement badges
- Study streak counter

✅ **Beautiful Design**
- 5-color premium palette
- Fully responsive (mobile, tablet, desktop)
- Smooth animations and transitions
- Touch-friendly interface
- No external dependencies

✅ **Data Persistence**
- All data stored in browser localStorage
- Survives browser restarts
- No server needed
- Works completely offline

## Project Structure

```
pure-html/
├── index.html, login.html, signup.html, dashboard.html
├── quiz.html, leaderboard.html, profile.html
├── notes.html, notepad.html, standards.html, settings.html
├── styles.css, auth.css, dashboard.css, quiz.css, leaderboard.css, profile.css
├── js/
│   ├── storage.js      (localStorage API)
│   ├── auth.js         (authentication logic)
│   ├── dashboard.js    (dashboard features)
│   ├── quiz.js         (quiz engine)
│   ├── quiz-data.js    (70 quiz questions)
│   ├── leaderboard.js  (ranking system)
│   └── profile.js      (progression tracking)
├── README.md           (complete documentation)
└── QUICKSTART.md       (30-minute tutorial)
```

## Zero Dependencies

- **No npm/yarn** - No package manager needed
- **No build process** - No Webpack, Parcel, or Vite
- **No frameworks** - Pure vanilla JavaScript (ES6+)
- **No libraries** - Just HTML, CSS, and JS

## Subjects Covered

1. Financial Accounting
2. Cost Accounting
3. Auditing
4. Taxation
5. Business Law
6. Economics
7. Management Advisory Services

Each subject has 10 questions across 3 difficulty levels (Easy, Intermediate, Hard).

## Levels & Progression

- **Level 1:** Beginner Accountant (0 XP)
- **Level 2:** Junior Analyst (500 XP)
- **Level 3:** Senior Reviewer (1,500 XP)
- **Level 4:** Audit Specialist (3,500 XP)
- **Level 5:** CPA Elite (7,000 XP)

## Getting Started

**Method 1: Direct Open**
```
Double-click: pure-html/index.html
```

**Method 2: Local Server (Recommended)**
```bash
# Python 3
python -m http.server 8000
# Then visit: http://localhost:8000/pure-html/

# Or Python 2
python -m SimpleHTTPServer 8000

# Or Node.js (with http-server)
npx http-server pure-html
```

## Documentation

- **README.md** - Complete feature documentation and development guide
- **QUICKSTART.md** - 30-minute quick start tutorial
- **PURE_HTML_COMPLETE.md** - Full project summary and statistics

See `/pure-html/` directory for these files.

## Features in Detail

### Quiz System
- Timer with real-time countdown
- Random question shuffling (different order each attempt)
- Question navigator grid
- Instant scoring with letter grades
- XP calculation based on accuracy and difficulty
- Unlimited retakes

### Leaderboard
- Podium display for top 3
- Full ranking table with all participants
- Points calculation from XP + accuracy + quiz count
- Time period filters (All Time, Monthly, Weekly, Daily)
- Your position always visible

### Profile & Progression
- Current level with visual progress bar
- XP counter showing progress to next level
- Achievement badges earned
- Study streak tracking
- Quiz attempt history

### Responsive Design
- Mobile-first approach
- Works on all devices
- Touch-optimized buttons
- Flexible layouts
- Fast loading

## File Sizes

- **Minified CSS:** ~20 KB
- **Minified JS:** ~35 KB
- **HTML files:** ~30 KB
- **Total:** ~85 KB uncompressed

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Data Storage

All student data is stored locally using the browser's localStorage API:
- User accounts
- Quiz attempts and scores
- XP and levels
- Leaderboard rankings
- Accuracy statistics
- Study streaks

No data is sent to any server. Everything works offline.

## Customization

Each component is self-contained and easy to modify:
- Edit colors in `styles.css`
- Add questions in `js/quiz-data.js`
- Modify page content in HTML files
- Adjust timers and scoring in `js/quiz.js`

See `/pure-html/README.md` for detailed modification guide.

## License

Free to use and modify for educational purposes.

---

**Start learning now:** Open `pure-html/index.html` in your browser!
