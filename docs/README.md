# Accountify - Pure HTML/CSS/JavaScript Version

## 🎓 Complete Accounting Learning Platform

A fully functional, client-side only version of Accountify built with **pure HTML5, CSS3, and Vanilla JavaScript**. No frameworks, no backend server required. All data persists in browser localStorage.

---

## 📁 Project Structure

```
pure-html/
├── index.html              # Landing page
├── login.html              # Login page
├── signup.html             # Registration page
├── dashboard.html          # Main dashboard
├── quiz.html               # Quiz center with 70 questions
├── leaderboard.html        # Competitive leaderboard
├── profile.html            # User profile & progression
├── notes.html              # Notes module (placeholder)
├── notepad.html            # Digital notepad (placeholder)
├── standards.html          # Standards library (placeholder)
├── settings.html           # Settings page
│
├── styles.css              # Global styles & design system
├── auth.css                # Authentication pages style
├── dashboard.css           # Dashboard layout
├── quiz.css                # Quiz interface styles
├── leaderboard.css         # Leaderboard styles
├── profile.css             # Profile styles
│
└── js/
    ├── storage.js          # LocalStorage management
    ├── auth.js             # Authentication logic
    ├── dashboard.js        # Dashboard initialization
    ├── quiz-data.js        # All 70 quiz questions
    ├── quiz.js             # Quiz engine (fully functional)
    ├── leaderboard.js      # Leaderboard calculations
    └── profile.js          # Profile logic
```

---

## 🚀 Getting Started

### Option 1: Open Directly
Simply open `index.html` in any modern web browser. No installation needed!

```bash
# On Windows
start index.html

# On macOS
open index.html

# On Linux
xdg-open index.html
```

### Option 2: Use Local Server (Recommended)
For best experience, run a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit: `http://localhost:8000`

---

## 🔐 Authentication

### Demo Accounts
The application comes with sample functionality. You can:
1. **Sign Up** - Create a new account with any email/password
2. **Login** - Use credentials from signup
3. **Logout** - Clears session from browser

All data is stored in **localStorage** - persists even after closing the browser.

```javascript
// Users are stored as JSON in localStorage
localStorage.getItem('users')         // All registered users
localStorage.getItem('currentUser')   // Currently logged-in user
```

---

## 📚 Features & Pages

### 1. **Landing Page** (index.html)
- Hero section with call-to-action
- 6 feature cards explaining the platform
- Responsive design for all devices

### 2. **Authentication** (login.html, signup.html)
- Full signup with validation
- Login with error handling
- Password confirmation
- Beautiful gradient backgrounds

### 3. **Dashboard** (dashboard.html)
- Welcome message with time-based greeting
- 4 stat cards showing progress
- Recent activity feed
- Quick links to main features

### 4. **Quiz Center** (quiz.html) ⭐ **MAIN FEATURE**
- **7 subjects** with 10 questions each (70 total questions)
  - Financial Accounting
  - Cost Accounting
  - Auditing
  - Taxation
  - Business Law
  - Economics
  - Management Advisory Services

**Features:**
- ✅ Difficulty filtering (Easy, Intermediate, Hard)
- ✅ 30-minute countdown timer with color warnings
- ✅ Random question shuffling on each attempt
- ✅ Question navigator grid
- ✅ Instant score calculation & grading (A, B, C, F)
- ✅ XP earning system with difficulty multipliers
- ✅ Answer review with explanations
- ✅ Unlimited retakes
- ✅ Time tracking

**Sample Questions Included:**
- Double-entry bookkeeping fundamentals
- Income statement analysis
- Depreciation and amortization
- Capital gains taxation
- Business contracts and law
- Economic principles
- Management consulting strategies

### 5. **Leaderboard** (leaderboard.html)
- **Real leaderboard calculation** from quiz scores
- Podium display for top 3
- Full ranking table with 7 columns
- Time period filtering (All Time, Monthly, Weekly, Daily)
- User's current position highlighted
- Points calculated from XP, accuracy, and quiz count

**Leaderboard Formula:**
```
Total Points = (XP ÷ 10) + (Accuracy ÷ 100 × 20) + Quiz Count
```

### 6. **User Profile** (profile.html)
- Avatar with initials
- Level progression system (5 levels)
- Visual progress bar to next level
- Achievement badges
- Recent quiz history with scores
- Total XP counter
- Accuracy percentage

**Level System:**
- Level 1: Beginner Accountant (0 XP)
- Level 2: Junior Analyst (500 XP)
- Level 3: Senior Reviewer (1,500 XP)
- Level 4: Audit Specialist (3,500 XP)
- Level 5: CPA Elite (7,000 XP)

### 7. **Additional Pages** (Placeholders for future expansion)
- Notes Module
- Digital Notepad  
- Standards Library
- Settings

---

## 💾 Data Storage

### What's Stored in localStorage?

```javascript
// 1. Users Database
users = [
    {
        id: "1234567890",
        fullName: "John Doe",
        email: "john@example.com",
        password: "hashed_password",
        createdAt: "2024-01-15T10:30:00Z"
    }
]

// 2. Quiz Attempts
quizAttempts = [
    {
        id: "attempt_123",
        userId: "user_456",
        subject: "Financial Accounting",
        difficulty: "Easy",
        score: 90,
        correctAnswers: 9,
        totalQuestions: 10,
        timeTaken: 1240,        // seconds
        xpEarned: 125,
        timestamp: "2024-01-20T14:30:00Z"
    }
]

// 3. User Statistics
userStats = {
    "user_456": {
        totalQuizzes: 15,
        totalXP: 2150,
        accuracyPercentage: 87,
        currentStreak: 5,       // days
        bestScore: 100,
        level: 3,
        lastAttemptDate: "2024-01-20"
    }
}

// 4. Session
currentUser = { /* same structure as users */ }
```

---

## 🎮 Quiz System (Detailed)

### How Quizzes Work

1. **Select Subject** - Choose from 7 accounting topics
2. **Filter by Difficulty** - Easy, Intermediate, or Hard
3. **Start Quiz** - Timer starts (30 minutes)
4. **Answer Questions** - 10 random questions per quiz
5. **Navigate** - Use Previous/Next or click question numbers
6. **Submit** - On last question or time runs out
7. **View Results** - Instant score, XP, grade
8. **Retake** - Shuffle questions and retry unlimited times

### Question Randomization
```javascript
// Questions are shuffled each attempt
currentQuestions = currentQuestions.sort(() => Math.random() - 0.5);
```

### Scoring System
```javascript
// Base XP by difficulty
Easy: 50 XP
Intermediate: 100 XP
Hard: 200 XP

// Accuracy bonus
100% = +150 XP
90-99% = +75 XP
80-89% = +25 XP
<70% = 0 XP (no pass)

// Grading
A = 90-100%
B = 80-89%
C = 70-79%
F = Below 70%
```

---

## 🎨 Design System

### Color Palette
```css
--primary: #1E3A8A          /* Deep Blue */
--primary-light: #3B82F6    /* Bright Blue */
--secondary: #1E40AF        /* Dark Blue */
--accent: #0EA5E9           /* Cyan */
--background: #FFFFFF       /* White */
--surface: #F9FAFB          /* Light Gray */
--text-primary: #0F172A     /* Dark Text */
--text-secondary: #64748B   /* Gray Text */
```

### Typography
- **Font**: Poppins, Inter, system-ui (sans-serif)
- **Headings**: 600-700 weight
- **Body**: 400-500 weight
- **Line Height**: 1.6

### Responsive Breakpoints
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px

---

## 🔧 JavaScript Features

### Utility Functions (storage.js)

```javascript
// User Management
Storage.saveUser(user)
Storage.getUserByEmail(email)
Storage.getCurrentUser()
Storage.setCurrentUser(user)

// Quiz Management
Storage.saveQuizAttempt(attempt)
Storage.getQuizAttempts(userId)

// Statistics
Storage.getUserStats(userId)
Storage.calculateXP(quizAttempt)
Storage.calculateLevel(totalXP)
Storage.getLevelName(level)

// Notes (Ready for implementation)
Storage.saveNote(note)
Storage.getNotes(userId)
Storage.deleteNote(noteId)
```

### Quiz Engine (quiz.js)

**Key Functions:**
- `startQuiz(moduleId)` - Initialize quiz
- `loadQuestion()` - Display current question
- `selectAnswer(index)` - Record answer selection
- `nextQuestion()` - Navigate to next question
- `submitQuiz()` - Calculate and show results
- `startTimer()` - Countdown with auto-submit
- `updateTimerDisplay()` - Color-coded timer

---

## 📊 Sample Data

### 70 Pre-loaded Questions

**Financial Accounting (10 Q)**
- Accounting principles, Balance Sheet, Income Statement, Depreciation, Accounting ratios

**Cost Accounting (10 Q)**
- Cost behavior, Break-even analysis, Variance analysis, Costing methods

**Auditing (10 Q)**
- Audit objectives, Materiality, Sampling risk, Evidence gathering

**Taxation (10 Q)**
- Tax systems, Income definitions, Deductions, Capital gains

**Business Law (10 Q)**
- Contracts, Partnerships, Corporations, Intellectual property

**Economics (10 Q)**
- Supply & demand, Inflation, GDP, Elasticity, Opportunity cost

**MAS (10 Q)**
- Business strategy, Risk management, Process improvement, Performance metrics

---

## 🚫 Limitations & Notes

1. **No Real Backend** - All data is local to the browser
2. **Data Loss** - Clearing browser cache deletes all data
3. **Single Device** - Data doesn't sync across devices
4. **No Image Uploads** - Avatar is text-based
5. **No PDF Export** - Results only shown on screen
6. **Demo Passwords** - Not encrypted (demo purposes only)

### Production Considerations
To deploy to production, integrate:
- **Backend API** for persistent database
- **Authentication** with OAuth/JWT
- **File Storage** for images and documents
- **Real Encryption** for passwords
- **Cloud Backup** for data persistence

---

## 🌐 Browser Compatibility

✅ **Fully Compatible:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Opera 76+

✅ **Responsive:**
- Desktop (1920×1080 and larger)
- Tablet (768×1024)
- Mobile (375×667)

---

## 📝 File Sizes

| File | Size | Purpose |
|------|------|---------|
| index.html | ~3 KB | Landing |
| dashboard.html | ~4 KB | Dashboard |
| quiz.html | ~6 KB | Quiz interface |
| leaderboard.html | ~5 KB | Leaderboard |
| profile.html | ~5 KB | User profile |
| styles.css | ~15 KB | Global styles |
| quiz.css | ~14 KB | Quiz styles |
| quiz-data.js | ~40 KB | 70 questions |
| quiz.js | ~12 KB | Quiz engine |
| **Total** | **~110 KB** | **All files** |

---

## 🎯 Next Steps for Development

1. **Digital Notepad** - Add Canvas drawing with pen/pencil tools
2. **Notes Module** - Rich text editor for subject notes
3. **Standards Library** - Display accounting standards and regulations
4. **Backend Integration** - Connect to real database
5. **Analytics** - Performance charts and statistics
6. **Mobile App** - React Native or Flutter version
7. **Offline Mode** - Service Workers for offline functionality
8. **Gamification** - Daily challenges, seasonal competitions
9. **AI Tutor** - ChatGPT-powered help system
10. **Multiplayer** - Live quiz competitions

---

## 👨‍💻 Development Tips

### Modifying Quiz Questions
Edit `js/quiz-data.js`:

```javascript
const QUIZ_QUESTIONS = {
    1: [ // Financial Accounting
        {
            id: 1,
            question: 'Your question here?',
            options: ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
            correct: 0, // 0-3 index of correct answer
            explanation: 'Why this is correct...'
        }
    ]
};
```

### Adding New Subjects
Edit both `QUIZ_MODULES` and `QUIZ_QUESTIONS` in `js/quiz-data.js`:

```javascript
const QUIZ_MODULES = [
    {
        id: 8,
        name: 'New Subject',
        subject: 'Subject Name',
        difficulty: 'Easy', // Easy, Intermediate, Hard
        color: 'from-blue-500 to-blue-600',
        icon: '🎓'
    }
];

const QUIZ_QUESTIONS = {
    8: [ /* 10 questions */ ]
};
```

### Styling Customization
Edit `styles.css` root colors:

```css
:root {
    --primary: #1E3A8A;
    --primary-light: #3B82F6;
    /* ... other colors ... */
}
```

---

## 📞 Support

For issues, questions, or feature requests:
1. Check the code comments
2. Review the README
3. Test in different browsers
4. Check localStorage values with browser DevTools

---

## 📄 License

Built for Accountify - Premium Accounting Learning Platform

---

## ✨ Built With Pure HTML/CSS/JavaScript

No dependencies. No frameworks. No build process. Just clean, semantic HTML, beautiful CSS, and vanilla JavaScript.

**Enjoy learning accounting with Accountify!** 🎓
