# STUDYFLOW 📚
### A Professional Student Task & Study Planner with DSA Lab

> **PSA Project** | HTML5 · CSS3 · Vanilla JavaScript · localStorage  
> No backend · No paid APIs · Fully offline

---

## 📸 Features

| Feature | Description |
|---|---|
| **Dashboard** | Live stats (total / completed / pending / overdue), progress bar, recent tasks, upcoming deadlines, subject chart |
| **Task CRUD** | Create, read, update, delete tasks with title, description, subject, priority, deadline, and status |
| **Filters & Sort** | Filter by status, priority, subject; sort by date, deadline, priority, or title |
| **Calendar View** | Monthly calendar with colour-coded deadline dots per task priority |
| **Study Planner** | Weekly grid planner — add colour-coded study sessions per day |
| **DSA Lab** | Animated visualiser: Linear Search, Binary Search, Bubble Sort, Stack (LIFO), Queue (FIFO) |
| **Progress Summary** | Completion rate, weekly stats, subject progress bars, priority breakdown, gamified achievements |
| **Dark / Light Mode** | One-click theme toggle, preference persisted via localStorage |
| **Responsive** | Fully adaptive: desktop → tablet → mobile with hamburger sidebar |
| **Input Validation** | All forms validated with descriptive error messages |
| **Sample Data** | Pre-loaded sample tasks and study sessions on first run |
| **Offline / No API** | 100% localStorage — no server, no internet required after load |

---

## 🗂️ Project Structure

```
STURDYFLOW/
├── index.html      ← Main HTML (all sections, modals)
├── styles.css      ← Complete CSS (dark/light themes, responsive)
├── app.js          ← All JavaScript logic (CRUD, DSA, render, etc.)
└── README.md       ← This file
```

---

## 🚀 How to Run (VS Code)

### Option A – Direct Open (Easiest)
1. Open the `STURDYFLOW` folder in **VS Code**
2. Right-click `index.html` → **Open with Live Server**  
   *(Requires the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer))*
3. The app opens at `http://127.0.0.1:5500`

### Option B – Live Server via Command Palette
1. Open `STURDYFLOW` folder in VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type **"Live Server: Open with Live Server"** and press Enter

### Option C – Plain Browser (no extension needed)
1. Open your file manager / Finder
2. Navigate to the `STURDYFLOW` folder
3. Double-click `index.html`  
   *(Opens directly in your default browser)*

> **Note:** localStorage works in all methods. No Node.js or npm required.

---

## 🧪 How to Test Each Feature

### ✅ Dashboard
- On first load, 8 sample tasks are auto-loaded
- Stats cards update in real time
- Click **"View All →"** to jump to Tasks section

### ✅ Adding a Task
1. Click **+ Add Task** button (Dashboard or Tasks section)
2. Fill in Title, Subject, Priority, Deadline
3. Click **Save Task**
4. Task appears in the list and dashboard updates

### ✅ Editing a Task
1. Go to **My Tasks** section
2. Click the ✏️ edit button on any task card
3. Modify fields and click **Save Task**

### ✅ Deleting a Task
1. Click the 🗑️ delete button on a task
2. Confirm the deletion in the dialog

### ✅ Completing a Task
1. Click the circle checkbox on the left of any task card
2. Task is marked ✅ completed, title gets strikethrough

### ✅ Filtering & Sorting
1. Go to **My Tasks**
2. Use the filter dropdowns (Status, Priority, Subject, Sort By)
3. Use the **Search box** (top bar) to search by title/description/subject

### ✅ Calendar
1. Navigate to **Calendar**
2. Coloured dots appear on dates that have task deadlines
3. Use **‹ Prev / Next ›** buttons to browse months

### ✅ Study Planner
1. Navigate to **Study Planner**
2. Click **+ Add Session**
3. Enter subject, day, time range, and colour
4. Session appears in the weekly grid
5. Hover over a session to reveal the **✕** remove button

### ✅ DSA Lab
1. Navigate to **DSA Lab**
2. Select an algorithm tab (Linear / Binary / Bubble / Stack / Queue)

| Algorithm | How to Test |
|---|---|
| **Linear Search** | Edit the array and target, click **Run Search** — watch animated highlighting |
| **Binary Search** | Enter a sorted (or unsorted) array — it auto-sorts, then animates the search |
| **Bubble Sort** | Enter an array, click **Run Sort** — watch bars animate step by step |
| **Stack** | Type a value, click **Push**. Use **Pop / Peek / Clear** to test LIFO behaviour |
| **Queue** | Type a value, click **Enqueue**. Use **Dequeue / Front / Clear** to test FIFO |

### ✅ Progress Summary
1. Navigate to **Progress**
2. See completion rate, weekly stats, subject-wise progress bars, priority breakdown
3. Earn achievements by completing tasks (unlock icons light up!)

### ✅ Dark / Light Mode
- Click the toggle at the bottom of the sidebar
- Theme preference is saved automatically

---

## 💡 Input Validation Rules

| Field | Rule |
|---|---|
| Task Title | Required, max 100 characters |
| Task Subject | Required (select from list) |
| Task Priority | Required (High / Medium / Low) |
| Task Deadline | Required, datetime |
| Session Subject | Required, non-empty text |
| Session Day | Required (Mon–Sun) |
| Session Time | Start must be before End |
| DSA Arrays | Comma-separated integers only |
| Stack / Queue values | Non-empty text, max 10 elements |

---

## 🎨 Design System

- **Font:** Inter (Google Fonts)
- **Code Font:** JetBrains Mono
- **Primary Color:** `#6C63FF` (indigo)
- **Secondary Color:** `#4ECDC4` (teal)
- **Dark BG:** `#0D0E1A`
- **Light BG:** `#F0F2FF`
- **Themes:** CSS custom properties (`data-theme="dark"` / `"light"`)

---

## 🔧 Customisation

### Adding a New Subject
In `index.html`, find the `<select id="taskSubject">` element and add:
```html
<option value="Your Subject">Your Subject</option>
```

### Changing Colours
Open `styles.css` and edit the `:root` block variables:
```css
--accent-primary: #6C63FF;   /* Main brand colour */
--accent-secondary: #4ECDC4; /* Accent colour */
```

### Clearing All Data
Open browser DevTools → Application → Local Storage → clear `sf_tasks` and `sf_sessions` keys, then reload.

---

## 📱 Browser Compatibility

| Browser | Support |
|---|---|
| Chrome 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Opera 76+ | ✅ Full |

---

## 🏆 DSA Algorithms Summary

| Algorithm | Best | Average | Worst | Space |
|---|---|---|---|---|
| Linear Search | O(1) | O(n) | O(n) | O(1) |
| Binary Search | O(1) | O(log n) | O(log n) | O(1) |
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) |
| Stack ops | O(1) | O(1) | O(1) | O(n) |
| Queue ops | O(1) | O(1) | O(1) | O(n) |

---

## 📄 License

Free to use for educational and personal projects.

---

*Built as a PSA (Public Service Announcement) project to help students organize their academic life.*
