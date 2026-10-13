/* ============================================================
   STUDYFLOW – Main Application JavaScript
   Sections:
   1.  State & Constants
   2.  localStorage Helpers
   3.  Toast Notifications
   4.  Navigation & Routing
   5.  Theme Toggle
   6.  Task CRUD (Create, Read, Update, Delete)
   7.  Task Rendering & Filtering
   8.  Dashboard
   9.  Calendar
   10. Study Planner
   11. DSA Lab – Linear Search
   12. DSA Lab – Binary Search
   13. DSA Lab – Bubble Sort
   14. DSA Lab – Stack
   15. DSA Lab – Queue
   16. Progress Summary
   17. Search
   18. Sample Data
   19. Init
   ============================================================ */

'use strict';

/* ============================================================
   1. STATE & CONSTANTS
   ============================================================ */

/** Application state (mutated in memory, persisted to localStorage) */
const STATE = {
  tasks: [],          // Array of task objects
  sessions: [],       // Array of study session objects
  editingTaskId: null // ID of task currently being edited (null = new task)
};

/** Color palette for subject bars */
const SUBJECT_COLORS = [
  '#6C63FF', '#4ECDC4', '#FF6B6B', '#FFD93D',
  '#6BCB77', '#FF6FD8', '#4DA6FF', '#FF8E53'
];

/** Current calendar month/year being displayed */
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-indexed

/** DSA Lab state objects */
const STACK = [];
const QUEUE = [];

/* ============================================================
   2. localStorage HELPERS
   ============================================================ */

/**
 * Load all persisted data from localStorage into STATE.
 */
function loadFromStorage() {
  try {
    const tasks    = localStorage.getItem('sf_tasks');
    const sessions = localStorage.getItem('sf_sessions');
    STATE.tasks    = tasks    ? JSON.parse(tasks)    : [];
    STATE.sessions = sessions ? JSON.parse(sessions) : [];
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
    STATE.tasks    = [];
    STATE.sessions = [];
  }
}

/**
 * Persist tasks to localStorage.
 */
function saveTasks() {
  try {
    localStorage.setItem('sf_tasks', JSON.stringify(STATE.tasks));
  } catch (e) {
    showToast('Storage error – data may not be saved!', 'error');
  }
}

/**
 * Persist study sessions to localStorage.
 */
function saveSessions() {
  try {
    localStorage.setItem('sf_sessions', JSON.stringify(STATE.sessions));
  } catch (e) {
    showToast('Storage error – sessions may not be saved!', 'error');
  }
}

/* ============================================================
   3. TOAST NOTIFICATIONS
   ============================================================ */

/**
 * Display a toast notification.
 * @param {string} message - Message to display.
 * @param {string} type    - 'success' | 'error' | 'info' | 'warning'
 * @param {number} duration - ms before auto-dismiss (default 3200)
 */
function showToast(message, type = 'info', duration = 3200) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ============================================================
   4. NAVIGATION & ROUTING
   ============================================================ */

const SECTION_TITLES = {
  dashboard: 'Dashboard',
  tasks:     'My Tasks',
  calendar:  'Calendar',
  planner:   'Study Planner',
  dsa:       'DSA Lab',
  progress:  'Progress Summary'
};

/**
 * Navigate to a named section, updating the sidebar active state and
 * section visibility.
 * @param {string} section - Key matching a section ID.
 */
function navigateTo(section) {
  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === section);
  });

  // Update sections
  document.querySelectorAll('.section').forEach(sec => {
    sec.classList.toggle('active', sec.id === `section-${section}`);
  });

  // Update page title
  document.getElementById('pageTitle').textContent = SECTION_TITLES[section] || section;

  // Refresh section-specific content
  if (section === 'dashboard')  renderDashboard();
  if (section === 'tasks')      renderTaskList();
  if (section === 'calendar')   renderCalendar();
  if (section === 'planner')    renderPlanner();
  if (section === 'progress')   renderProgress();

  // Close sidebar on mobile
  if (window.innerWidth <= 768) closeSidebar();
}

/** Bind all sidebar nav link clicks */
function bindNavLinks() {
  document.querySelectorAll('.nav-link, .view-all').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.section);
    });
  });
}

/* ---- Sidebar open / close ---- */

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').classList.add('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
}

function bindSidebarControls() {
  document.getElementById('hamburger').addEventListener('click', openSidebar);
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
  document.getElementById('overlay').addEventListener('click', closeSidebar);
}

/* ============================================================
   5. THEME TOGGLE
   ============================================================ */

function initTheme() {
  const saved = localStorage.getItem('sf_theme') || 'dark';
  setTheme(saved);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('sf_theme', theme);
  document.getElementById('themeIcon').textContent  = theme === 'dark' ? '☀️' : '🌙';
  document.getElementById('themeLabel').textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

function bindThemeToggle() {
  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });
}

/* ============================================================
   6. TASK CRUD
   ============================================================ */

/** Generate a unique ID */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Compute derived status ('overdue' / 'completed' / 'pending') for a task.
 * @param {Object} task
 * @returns {string}
 */
function getTaskStatus(task) {
  if (task.status === 'completed') return 'completed';
  if (task.deadline && new Date(task.deadline) < new Date()) return 'overdue';
  return 'pending';
}

/* ---- Task Modal ---- */

function openTaskModal(taskId = null) {
  STATE.editingTaskId = taskId;
  const modal = document.getElementById('taskModal');
  const form  = document.getElementById('taskForm');
  form.reset();
  clearFormErrors();

  if (taskId) {
    // Edit mode – pre-fill form
    const task = STATE.tasks.find(t => t.id === taskId);
    if (!task) return;
    document.getElementById('modalTitle').textContent   = 'Edit Task';
    document.getElementById('taskTitle').value          = task.title;
    document.getElementById('taskDesc').value           = task.description || '';
    document.getElementById('taskSubject').value        = task.subject;
    document.getElementById('taskPriority').value       = task.priority;
    document.getElementById('taskDeadline').value       = task.deadline ? task.deadline.slice(0, 16) : '';
    document.getElementById('taskStatus').value         = task.status;
  } else {
    document.getElementById('modalTitle').textContent = 'Add New Task';
    // Default deadline to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59);
    document.getElementById('taskDeadline').value = tomorrow.toISOString().slice(0, 16);
  }

  modal.classList.add('open');
  document.getElementById('taskTitle').focus();
}

function closeTaskModal() {
  document.getElementById('taskModal').classList.remove('open');
  STATE.editingTaskId = null;
}

function clearFormErrors() {
  ['taskTitleError', 'taskSubjectError', 'taskPriorityError', 'taskDeadlineError']
    .forEach(id => { document.getElementById(id).textContent = ''; });
}

/**
 * Validate task form fields. Returns true if valid.
 */
function validateTaskForm() {
  let valid = true;
  clearFormErrors();

  const title    = document.getElementById('taskTitle').value.trim();
  const subject  = document.getElementById('taskSubject').value;
  const priority = document.getElementById('taskPriority').value;
  const deadline = document.getElementById('taskDeadline').value;

  if (!title) {
    document.getElementById('taskTitleError').textContent = 'Task title is required.';
    valid = false;
  } else if (title.length > 100) {
    document.getElementById('taskTitleError').textContent = 'Title must be 100 characters or less.';
    valid = false;
  }

  if (!subject) {
    document.getElementById('taskSubjectError').textContent = 'Please select a subject.';
    valid = false;
  }

  if (!priority) {
    document.getElementById('taskPriorityError').textContent = 'Please select a priority.';
    valid = false;
  }

  if (!deadline) {
    document.getElementById('taskDeadlineError').textContent = 'Please set a deadline.';
    valid = false;
  }

  return valid;
}

/**
 * Handle task form submission (create or update).
 */
function handleTaskSubmit(e) {
  e.preventDefault();
  if (!validateTaskForm()) return;

  const title       = document.getElementById('taskTitle').value.trim();
  const description = document.getElementById('taskDesc').value.trim();
  const subject     = document.getElementById('taskSubject').value;
  const priority    = document.getElementById('taskPriority').value;
  const deadline    = document.getElementById('taskDeadline').value;
  const status      = document.getElementById('taskStatus').value;

  if (STATE.editingTaskId) {
    // UPDATE existing task
    const idx = STATE.tasks.findIndex(t => t.id === STATE.editingTaskId);
    if (idx !== -1) {
      STATE.tasks[idx] = {
        ...STATE.tasks[idx],
        title, description, subject, priority,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        status,
        updatedAt: new Date().toISOString()
      };
      showToast('Task updated successfully!', 'success');
    }
  } else {
    // CREATE new task
    const task = {
      id:          genId(),
      title,
      description,
      subject,
      priority,
      deadline:    deadline ? new Date(deadline).toISOString() : null,
      status,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString()
    };
    STATE.tasks.unshift(task); // newest first
    showToast('Task added successfully! 🎉', 'success');
  }

  saveTasks();
  closeTaskModal();
  renderTaskList();
  renderDashboard();
  updateTaskBadge();
}

/**
 * Delete a task by ID with confirmation dialog.
 * @param {string} id
 */
function deleteTask(id) {
  openConfirm('Are you sure you want to delete this task? This action cannot be undone.', () => {
    STATE.tasks = STATE.tasks.filter(t => t.id !== id);
    saveTasks();
    renderTaskList();
    renderDashboard();
    updateTaskBadge();
    showToast('Task deleted.', 'info');
  });
}

/**
 * Toggle task completion status.
 * @param {string} id
 */
function toggleTaskComplete(id) {
  const task = STATE.tasks.find(t => t.id === id);
  if (!task) return;
  task.status    = task.status === 'completed' ? 'pending' : 'completed';
  task.updatedAt = new Date().toISOString();
  saveTasks();
  renderTaskList();
  renderDashboard();
  updateTaskBadge();
  showToast(task.status === 'completed' ? 'Task marked complete! ✅' : 'Task marked pending.', 'info');
}

/** Bind task modal open/close and form submit */
function bindTaskModal() {
  document.getElementById('openAddTask').addEventListener('click', () => openTaskModal());
  document.getElementById('dashAddTask').addEventListener('click', () => openTaskModal());
  document.getElementById('modalClose').addEventListener('click', closeTaskModal);
  document.getElementById('cancelTask').addEventListener('click', closeTaskModal);
  document.getElementById('taskModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('taskModal')) closeTaskModal();
  });
  document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
}

/* ============================================================
   7. TASK RENDERING & FILTERING
   ============================================================ */

/**
 * Get the active filter / sort values from the DOM.
 */
function getFilters() {
  return {
    status:   document.getElementById('filterStatus').value,
    priority: document.getElementById('filterPriority').value,
    subject:  document.getElementById('filterSubject').value,
    sort:     document.getElementById('sortBy').value,
    search:   document.getElementById('globalSearch').value.trim().toLowerCase()
  };
}

/**
 * Apply filters and sorting to tasks array.
 */
function applyFilters(tasks, filters) {
  let result = [...tasks];

  // Status filter
  if (filters.status !== 'all') {
    result = result.filter(t => getTaskStatus(t) === filters.status);
  }

  // Priority filter
  if (filters.priority !== 'all') {
    result = result.filter(t => t.priority === filters.priority);
  }

  // Subject filter
  if (filters.subject !== 'all') {
    result = result.filter(t => t.subject === filters.subject);
  }

  // Search filter
  if (filters.search) {
    result = result.filter(t =>
      t.title.toLowerCase().includes(filters.search) ||
      (t.description && t.description.toLowerCase().includes(filters.search)) ||
      t.subject.toLowerCase().includes(filters.search)
    );
  }

  // Sorting
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  result.sort((a, b) => {
    switch (filters.sort) {
      case 'deadline':
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      case 'priority':
        return (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
      case 'title':
        return a.title.localeCompare(b.title);
      default: // created
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return result;
}

/**
 * Render the task list in the Tasks section.
 */
function renderTaskList() {
  const container = document.getElementById('taskList');
  const filters   = getFilters();
  const tasks     = applyFilters(STATE.tasks, filters);

  // Populate subject filter dropdown (dynamic)
  populateSubjectFilter();

  if (tasks.length === 0) {
    container.innerHTML = '<p class="empty-msg">No tasks match your filters. Try adjusting them!</p>';
    return;
  }

  container.innerHTML = tasks.map(task => renderTaskCard(task)).join('');

  // Bind events on newly created cards
  container.querySelectorAll('.task-checkbox').forEach(cb => {
    cb.addEventListener('click', () => toggleTaskComplete(cb.dataset.id));
  });
  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openTaskModal(btn.dataset.id));
  });
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteTask(btn.dataset.id));
  });
}

/**
 * Build the HTML string for a single task card.
 * @param {Object} task
 * @returns {string}
 */
function renderTaskCard(task) {
  const status    = getTaskStatus(task);
  const isDone    = status === 'completed';
  const deadlineStr = task.deadline
    ? formatDeadline(task.deadline)
    : 'No deadline';

  return `
    <div class="task-card priority-${task.priority} status-${status}" data-id="${task.id}">
      <div class="task-checkbox ${isDone ? 'checked' : ''}" data-id="${task.id}" role="button"
           aria-label="${isDone ? 'Mark incomplete' : 'Mark complete'}" tabindex="0"></div>
      <div class="task-body">
        <div class="task-title ${isDone ? 'done' : ''}">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="tag tag-subject">📖 ${escapeHtml(task.subject)}</span>
          <span class="tag tag-${task.priority}">
            ${task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
            ${capitalize(task.priority)}
          </span>
          <span class="tag tag-${status}">
            ${status === 'completed' ? '✅' : status === 'overdue' ? '🚨' : '⏳'}
            ${capitalize(status)}
          </span>
          <span class="tag tag-deadline">📅 ${deadlineStr}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn edit-btn" data-id="${task.id}" title="Edit task" aria-label="Edit task">✏️</button>
        <button class="action-btn delete delete-btn" data-id="${task.id}" title="Delete task" aria-label="Delete task">🗑️</button>
      </div>
    </div>
  `;
}

/** Dynamically populate the subject filter with unique subjects from tasks */
function populateSubjectFilter() {
  const select   = document.getElementById('filterSubject');
  const current  = select.value;
  const subjects = [...new Set(STATE.tasks.map(t => t.subject))].sort();

  select.innerHTML = '<option value="all">All</option>';
  subjects.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    select.appendChild(opt);
  });
  select.value = subjects.includes(current) ? current : 'all';
}

/** Bind filter controls */
function bindFilters() {
  ['filterStatus', 'filterPriority', 'filterSubject', 'sortBy'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderTaskList);
  });
  document.getElementById('clearFilters').addEventListener('click', () => {
    ['filterStatus', 'filterPriority', 'filterSubject', 'sortBy'].forEach(id => {
      document.getElementById(id).selectedIndex = 0;
    });
    document.getElementById('globalSearch').value = '';
    renderTaskList();
  });
}

/** Update the pending task count badge in the sidebar */
function updateTaskBadge() {
  const pending = STATE.tasks.filter(t => getTaskStatus(t) === 'pending').length;
  document.getElementById('taskBadge').textContent = pending;
}

/* ============================================================
   8. DASHBOARD
   ============================================================ */

/**
 * Re-render all dashboard widgets.
 */
function renderDashboard() {
  const tasks     = STATE.tasks;
  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const overdue   = tasks.filter(t => getTaskStatus(t) === 'overdue').length;
  const pending   = tasks.filter(t => getTaskStatus(t) === 'pending').length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Stat cards
  animateCounter('totalCount',     total);
  animateCounter('completedCount', completed);
  animateCounter('pendingCount',   pending);
  animateCounter('overdueCount',   overdue);

  // Progress bar
  document.getElementById('progressBar').style.width = `${pct}%`;
  document.getElementById('progressPct').textContent = `${pct}%`;

  // Recent tasks (latest 5)
  const recent  = [...tasks].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const recentEl = document.getElementById('recentTasksList');
  if (recent.length === 0) {
    recentEl.innerHTML = '<p class="empty-msg">No tasks yet. Add your first task!</p>';
  } else {
    recentEl.innerHTML = recent.map(t => `
      <div class="recent-task-item">
        <span class="priority-dot ${t.priority}"></span>
        <span class="recent-task-title ${t.status === 'completed' ? 'done' : ''}">${escapeHtml(t.title)}</span>
        <span class="recent-task-sub">${escapeHtml(t.subject)}</span>
      </div>
    `).join('');
  }

  // Upcoming deadlines (next 5 non-completed tasks sorted by deadline)
  const upcoming = tasks
    .filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) >= new Date())
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  const upcomingEl = document.getElementById('upcomingList');
  if (upcoming.length === 0) {
    upcomingEl.innerHTML = '<p class="empty-msg">No upcoming deadlines.</p>';
  } else {
    upcomingEl.innerHTML = upcoming.map(t => {
      const d = new Date(t.deadline);
      const day   = d.getDate();
      const month = d.toLocaleString('default', { month: 'short' });
      return `
        <div class="upcoming-item">
          <div class="upcoming-date">
            <div class="upcoming-day">${day}</div>
            <div class="upcoming-month">${month}</div>
          </div>
          <div class="upcoming-info">
            <div class="upcoming-title">${escapeHtml(t.title)}</div>
            <div class="upcoming-subject">${escapeHtml(t.subject)}</div>
          </div>
          <span class="tag tag-${t.priority}">${capitalize(t.priority)}</span>
        </div>
      `;
    }).join('');
  }

  // Subject chart
  renderSubjectChart();
}

/** Render the subject task bar chart on the dashboard */
function renderSubjectChart() {
  const container = document.getElementById('subjectChart');
  const subjectMap = {};
  STATE.tasks.forEach(t => {
    if (!subjectMap[t.subject]) subjectMap[t.subject] = 0;
    subjectMap[t.subject]++;
  });
  const entries  = Object.entries(subjectMap).sort((a, b) => b[1] - a[1]);
  const maxCount = entries[0]?.[1] || 1;

  if (entries.length === 0) {
    container.innerHTML = '<p class="empty-msg">No tasks yet.</p>';
    return;
  }

  container.innerHTML = entries.map(([subject, count], i) => `
    <div class="subject-bar-item">
      <span class="subject-bar-label">${escapeHtml(subject)}</span>
      <div class="subject-bar-wrap">
        <div class="subject-bar-fill"
             style="width:${(count / maxCount) * 100}%; background:${SUBJECT_COLORS[i % SUBJECT_COLORS.length]}">
        </div>
      </div>
      <span class="subject-bar-count">${count}</span>
    </div>
  `).join('');
}

/**
 * Animate a numeric counter from its current value to target.
 * @param {string} id     - Element ID
 * @param {number} target - Target number
 */
function animateCounter(id, target) {
  const el   = document.getElementById(id);
  const start = parseInt(el.textContent) || 0;
  const duration = 600;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* ============================================================
   9. CALENDAR
   ============================================================ */

/**
 * Render the monthly calendar grid with task deadline markers.
 */
function renderCalendar() {
  const grid       = document.getElementById('calGrid');
  const monthLabel = document.getElementById('calMonthYear');

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  monthLabel.textContent = `${monthNames[calMonth]} ${calYear}`;

  const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  // Build a lookup: dateKey -> tasks[]
  const tasksByDate = {};
  STATE.tasks.forEach(t => {
    if (!t.deadline) return;
    const d   = new Date(t.deadline);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!tasksByDate[key]) tasksByDate[key] = [];
    tasksByDate[key].push(t);
  });

  // Build cells: leading blanks from previous month
  const prevDays   = new Date(calYear, calMonth, 0).getDate();
  const cells      = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true });
  }
  // Trailing cells to fill grid (multiples of 7)
  let trailing = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: trailing++, currentMonth: false });
  }

  grid.innerHTML = cells.map(cell => {
    const isToday = cell.currentMonth &&
                    today.getDate()     === cell.day    &&
                    today.getMonth()    === calMonth    &&
                    today.getFullYear() === calYear;

    const key    = `${calYear}-${calMonth}-${cell.day}`;
    const dayTasks = cell.currentMonth ? (tasksByDate[key] || []) : [];

    const dotsHtml = dayTasks.slice(0, 5).map(t => {
      const color = t.status === 'completed' ? 'var(--text-muted)'
                  : t.priority === 'high'    ? 'var(--accent-orange)'
                  : t.priority === 'medium'  ? 'var(--accent-yellow)'
                  : 'var(--accent-green)';
      return `<div class="cal-dot" style="background:${color}" title="${escapeHtml(t.title)}"></div>`;
    }).join('');

    return `
      <div class="cal-cell ${!cell.currentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}">
        <div class="cal-date">${cell.day}</div>
        <div class="cal-dots">${dotsHtml}</div>
      </div>
    `;
  }).join('');
}

/** Bind calendar prev/next buttons */
function bindCalendar() {
  document.getElementById('calPrev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });
}

/* ============================================================
   10. STUDY PLANNER
   ============================================================ */

/**
 * Open the Add Session modal.
 */
function openSessionModal() {
  document.getElementById('sessionModal').classList.add('open');
  document.getElementById('sessionForm').reset();
}

function closeSessionModal() {
  document.getElementById('sessionModal').classList.remove('open');
}

/**
 * Render all study sessions onto the planner grid.
 */
function renderPlanner() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  days.forEach(day => {
    const container = document.getElementById(`slots-${day}`);
    const daySessions = STATE.sessions.filter(s => s.day === day)
      .sort((a, b) => a.start.localeCompare(b.start));

    if (daySessions.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:0.75rem;text-align:center;padding:12px 0;">Empty</p>';
      return;
    }

    container.innerHTML = daySessions.map(s => `
      <div class="session-slot ${s.color}" data-id="${s.id}">
        <button class="session-del" data-id="${s.id}" title="Remove session">✕</button>
        <div class="session-subject">${escapeHtml(s.subject)}</div>
        <div class="session-time">${s.start} – ${s.end}</div>
      </div>
    `).join('');

    container.querySelectorAll('.session-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSession(btn.dataset.id);
      });
    });
  });
}

/**
 * Handle session form submission.
 */
function handleSessionSubmit(e) {
  e.preventDefault();
  const subject = document.getElementById('sessionSubject').value.trim();
  const day     = document.getElementById('sessionDay').value;
  const color   = document.getElementById('sessionColor').value;
  const start   = document.getElementById('sessionStart').value;
  const end     = document.getElementById('sessionEnd').value;

  if (!subject) {
    document.getElementById('sessionSubjectError').textContent = 'Subject is required.';
    return;
  }
  if (!day || !start || !end) {
    showToast('Please fill in all session fields.', 'warning');
    return;
  }
  if (start >= end) {
    showToast('End time must be after start time.', 'error');
    return;
  }

  STATE.sessions.push({ id: genId(), subject, day, color, start, end });
  saveSessions();
  closeSessionModal();
  renderPlanner();
  showToast(`Study session added for ${day}! 📚`, 'success');
}

/**
 * Delete a study session.
 * @param {string} id
 */
function deleteSession(id) {
  STATE.sessions = STATE.sessions.filter(s => s.id !== id);
  saveSessions();
  renderPlanner();
  showToast('Session removed.', 'info');
}

/** Bind study planner controls */
function bindPlanner() {
  document.getElementById('openAddSession').addEventListener('click', openSessionModal);
  document.getElementById('sessionModalClose').addEventListener('click', closeSessionModal);
  document.getElementById('cancelSession').addEventListener('click', closeSessionModal);
  document.getElementById('sessionModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('sessionModal')) closeSessionModal();
  });
  document.getElementById('sessionForm').addEventListener('submit', handleSessionSubmit);
}

/* ============================================================
   11. DSA LAB – LINEAR SEARCH
   ============================================================ */

let linearAnimTimeout = null;

/**
 * Run animated linear search.
 */
function runLinearSearch() {
  clearTimeout(linearAnimTimeout);
  const rawArr  = document.getElementById('linearArray').value;
  const target  = parseInt(document.getElementById('linearTarget').value);
  const arr     = parseArray(rawArr);

  if (arr === null) { showToast('Invalid array! Use comma-separated numbers.', 'error'); return; }
  if (isNaN(target)) { showToast('Please enter a valid target number.', 'error'); return; }

  const viz    = document.getElementById('linearViz');
  const output = document.getElementById('linearOutput');

  // Render elements
  viz.innerHTML = arr.map((v, i) => `
    <div class="dsa-elem" id="le-${i}">${v}</div>
  `).join('');
  output.innerHTML = '<span class="info">Starting linear search...</span>';

  const steps = [];
  let foundIdx = -1;

  for (let i = 0; i < arr.length; i++) {
    steps.push({ type: 'check', index: i });
    if (arr[i] === target) {
      foundIdx = i;
      steps.push({ type: 'found', index: i });
      break;
    }
  }
  if (foundIdx === -1) steps.push({ type: 'notfound' });

  // Animate steps
  let delay = 0;
  steps.forEach((step, si) => {
    linearAnimTimeout = setTimeout(() => {
      if (step.type === 'check') {
        // Reset previous
        if (si > 0 && steps[si-1].type === 'check') {
          document.getElementById(`le-${steps[si-1].index}`)?.classList.remove('active');
        }
        document.getElementById(`le-${step.index}`)?.classList.add('active');
        output.innerHTML = `<span class="step">Checking index ${step.index}: arr[${step.index}] = ${arr[step.index]} ${arr[step.index] === target ? '== target ✓' : '!= target'}</span>`;
      } else if (step.type === 'found') {
        const el = document.getElementById(`le-${step.index}`);
        el?.classList.remove('active');
        el?.classList.add('found');
        output.innerHTML = `<span class="success">✅ Found ${target} at index ${step.index}! Comparisons: ${step.index + 1}</span>`;
      } else if (step.type === 'notfound') {
        output.innerHTML = `<span class="error">❌ ${target} not found in array. All ${arr.length} elements checked.</span>`;
      }
    }, delay);
    delay += 600;
  });
}

function resetLinear() {
  clearTimeout(linearAnimTimeout);
  document.getElementById('linearViz').innerHTML   = '';
  document.getElementById('linearOutput').innerHTML = '';
}

/* ============================================================
   12. DSA LAB – BINARY SEARCH
   ============================================================ */

let binaryAnimTimeout = null;

/**
 * Run animated binary search.
 */
function runBinarySearch() {
  clearTimeout(binaryAnimTimeout);
  const rawArr = document.getElementById('binaryArray').value;
  const target = parseInt(document.getElementById('binaryTarget').value);
  let arr      = parseArray(rawArr);

  if (arr === null) { showToast('Invalid array! Use comma-separated numbers.', 'error'); return; }
  if (isNaN(target)) { showToast('Please enter a valid target number.', 'error'); return; }

  // Sort the array automatically for binary search
  arr = arr.slice().sort((a, b) => a - b);
  document.getElementById('binaryArray').value = arr.join(', ');

  const viz    = document.getElementById('binaryViz');
  const output = document.getElementById('binaryOutput');

  viz.innerHTML = arr.map((v, i) => `
    <div class="dsa-elem" id="be-${i}">
      <span>${v}</span>
    </div>
  `).join('');
  output.innerHTML = '<span class="info">Starting binary search on sorted array...</span>';

  const steps = [];
  let left = 0, right = arr.length - 1, foundIdx = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    steps.push({ type: 'range', left, right, mid });
    if (arr[mid] === target) {
      foundIdx = mid;
      steps.push({ type: 'found', index: mid });
      break;
    } else if (arr[mid] < target) {
      steps.push({ type: 'goRight', mid });
      left = mid + 1;
    } else {
      steps.push({ type: 'goLeft', mid });
      right = mid - 1;
    }
  }
  if (foundIdx === -1) steps.push({ type: 'notfound' });

  // Animate
  let delay = 0;
  steps.forEach(step => {
    binaryAnimTimeout = setTimeout(() => {
      // Reset all
      arr.forEach((_, i) => {
        const el = document.getElementById(`be-${i}`);
        if (el) el.className = 'dsa-elem';
      });

      if (step.type === 'range') {
        for (let i = step.left; i <= step.right; i++) {
          document.getElementById(`be-${i}`)?.classList.add('compare');
        }
        document.getElementById(`be-${step.mid}`)?.classList.add('active');
        output.innerHTML = `<span class="step">Range [${step.left}..${step.right}], mid = ${step.mid}, arr[mid] = ${arr[step.mid]}</span>`;
      } else if (step.type === 'goRight') {
        output.innerHTML = `<span class="step">arr[${step.mid}]=${arr[step.mid]} &lt; target → move RIGHT</span>`;
      } else if (step.type === 'goLeft') {
        output.innerHTML = `<span class="step">arr[${step.mid}]=${arr[step.mid]} &gt; target → move LEFT</span>`;
      } else if (step.type === 'found') {
        document.getElementById(`be-${step.index}`)?.classList.add('found');
        output.innerHTML = `<span class="success">✅ Found ${target} at index ${step.index}! Steps: ${steps.filter(s=>s.type==='range').length}</span>`;
      } else if (step.type === 'notfound') {
        output.innerHTML = `<span class="error">❌ ${target} not found. Took ${steps.filter(s=>s.type==='range').length} steps.</span>`;
      }
    }, delay);
    delay += 800;
  });
}

function resetBinary() {
  clearTimeout(binaryAnimTimeout);
  document.getElementById('binaryViz').innerHTML   = '';
  document.getElementById('binaryOutput').innerHTML = '';
}

/* ============================================================
   13. DSA LAB – BUBBLE SORT
   ============================================================ */

let bubbleAnimTimeout = null;
let bubbleRunning     = false;

/**
 * Run animated bubble sort.
 */
async function runBubbleSort() {
  if (bubbleRunning) return;
  bubbleRunning = true;

  const rawArr = document.getElementById('bubbleArray').value;
  const arr    = parseArray(rawArr);

  if (arr === null) {
    showToast('Invalid array! Use comma-separated numbers.', 'error');
    bubbleRunning = false;
    return;
  }
  if (arr.length > 20) {
    showToast('Please use 20 elements or fewer for visualization.', 'warning');
    bubbleRunning = false;
    return;
  }

  const output = document.getElementById('bubbleOutput');
  output.innerHTML = '<span class="info">Running Bubble Sort...</span>';

  const data   = [...arr];
  const maxVal = Math.max(...data);
  const sortedSet = new Set();

  // Render initial bars
  function renderBars(comparing = [], sortedIndices = new Set()) {
    const viz = document.getElementById('bubbleViz');
    viz.innerHTML = data.map((v, i) => {
      const heightPct = Math.max(10, Math.round((v / maxVal) * 100));
      const cls = sortedIndices.has(i) ? 'sorted-bar' : comparing.includes(i) ? 'comparing' : '';
      return `<div class="dsa-bar ${cls}" style="height:${heightPct}%;" title="${v}">${v}</div>`;
    }).join('');
  }

  renderBars();

  // Generate all swap steps
  const steps = [];
  const temp  = [...data];
  const n     = temp.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ type: 'compare', j, j1: j + 1, sortedFrom: n - i });
      if (temp[j] > temp[j + 1]) {
        [temp[j], temp[j + 1]] = [temp[j + 1], temp[j]];
        steps.push({ type: 'swap', j, j1: j + 1, arr: [...temp] });
      }
    }
    steps.push({ type: 'sorted', index: n - i - 1, sortedFrom: n - i });
  }
  steps.push({ type: 'done', arr: [...temp] });

  // Animate
  let delay = 0;
  steps.forEach(step => {
    setTimeout(() => {
      if (step.type === 'swap') {
        data.length = 0;
        step.arr.forEach(v => data.push(v));
      }
      if (step.type === 'done') {
        // Mark all sorted
        const allSorted = new Set(data.map((_, i) => i));
        renderBars([], allSorted);
        output.innerHTML = `<span class="success">✅ Sorted! Result: [${temp.join(', ')}]</span>`;
        bubbleRunning = false;
        document.getElementById('bubbleArray').value = temp.join(', ');
      } else if (step.type === 'compare') {
        const s = new Set([...Array(data.length - step.sortedFrom + n)].map((_, i) => step.sortedFrom + i));
        sortedSet.forEach(v => s.add(v));
        renderBars([step.j, step.j1], sortedSet);
      } else if (step.type === 'sorted') {
        sortedSet.add(step.index);
        renderBars([], sortedSet);
      } else if (step.type === 'swap') {
        renderBars([step.j, step.j1], sortedSet);
        output.innerHTML = `<span class="step">Swapped ${step.arr[step.j]} ↔ ${step.arr[step.j1]}</span>`;
      }
    }, delay);
    delay += 220;
  });
}

function resetBubble() {
  bubbleRunning = false;
  document.getElementById('bubbleViz').innerHTML   = '';
  document.getElementById('bubbleOutput').innerHTML = '';
}

/* ============================================================
   14. DSA LAB – STACK
   ============================================================ */

function renderStack() {
  const container = document.getElementById('stackItems');
  if (STACK.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:10px">Stack is empty</p>';
    return;
  }
  container.innerHTML = [...STACK].reverse().map(v => `
    <div class="stack-item">${escapeHtml(String(v))}</div>
  `).join('');
}

function stackPush() {
  const val = document.getElementById('stackInput').value.trim();
  if (!val) { showToast('Enter a value to push.', 'warning'); return; }
  if (STACK.length >= 10) { showToast('Stack overflow! Max 10 elements.', 'error'); return; }
  STACK.push(val);
  document.getElementById('stackInput').value = '';
  renderStack();
  setDsaOutput('stackOutput', `<span class="success">Pushed "${val}" → Stack size: ${STACK.length}</span>`);
}

function stackPop() {
  if (STACK.length === 0) {
    setDsaOutput('stackOutput', '<span class="error">Stack underflow! Nothing to pop.</span>');
    return;
  }
  const val = STACK.pop();
  renderStack();
  setDsaOutput('stackOutput', `<span class="info">Popped "${val}" ← Stack size: ${STACK.length}</span>`);
}

function stackPeek() {
  if (STACK.length === 0) {
    setDsaOutput('stackOutput', '<span class="error">Stack is empty – nothing to peek.</span>');
    return;
  }
  setDsaOutput('stackOutput', `<span class="info">Top element: "${STACK[STACK.length - 1]}" (stack unchanged)</span>`);
}

function stackClear() {
  STACK.length = 0;
  renderStack();
  setDsaOutput('stackOutput', '<span class="info">Stack cleared.</span>');
}

/* ============================================================
   15. DSA LAB – QUEUE
   ============================================================ */

function renderQueue() {
  const container = document.getElementById('queueItems');
  if (QUEUE.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:10px">Queue is empty</p>';
    return;
  }
  container.innerHTML = QUEUE.map(v => `
    <div class="queue-item">${escapeHtml(String(v))}</div>
  `).join('');
}

function queueEnqueue() {
  const val = document.getElementById('queueInput').value.trim();
  if (!val) { showToast('Enter a value to enqueue.', 'warning'); return; }
  if (QUEUE.length >= 10) { showToast('Queue is full! Max 10 elements.', 'error'); return; }
  QUEUE.push(val);
  document.getElementById('queueInput').value = '';
  renderQueue();
  setDsaOutput('queueOutput', `<span class="success">Enqueued "${val}" → Queue size: ${QUEUE.length}</span>`);
}

function queueDequeue() {
  if (QUEUE.length === 0) {
    setDsaOutput('queueOutput', '<span class="error">Queue is empty – nothing to dequeue.</span>');
    return;
  }
  const val = QUEUE.shift();
  renderQueue();
  setDsaOutput('queueOutput', `<span class="info">Dequeued "${val}" ← Queue size: ${QUEUE.length}</span>`);
}

function queueFront() {
  if (QUEUE.length === 0) {
    setDsaOutput('queueOutput', '<span class="error">Queue is empty.</span>');
    return;
  }
  setDsaOutput('queueOutput', `<span class="info">Front element: "${QUEUE[0]}" (queue unchanged)</span>`);
}

function queueClear() {
  QUEUE.length = 0;
  renderQueue();
  setDsaOutput('queueOutput', '<span class="info">Queue cleared.</span>');
}

/** Set DSA output panel */
function setDsaOutput(id, html) {
  document.getElementById(id).innerHTML = html;
}

/** Bind all DSA Lab buttons */
function bindDsaLab() {
  // Tabs
  document.querySelectorAll('.dsa-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.dsa-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.dsa-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`dsa-${tab.dataset.algo}`)?.classList.add('active');
    });
  });

  // Linear Search
  document.getElementById('runLinear').addEventListener('click', runLinearSearch);
  document.getElementById('resetLinear').addEventListener('click', resetLinear);

  // Binary Search
  document.getElementById('runBinary').addEventListener('click', runBinarySearch);
  document.getElementById('resetBinary').addEventListener('click', resetBinary);

  // Bubble Sort
  document.getElementById('runBubble').addEventListener('click', runBubbleSort);
  document.getElementById('resetBubble').addEventListener('click', resetBubble);

  // Stack
  document.getElementById('stackPush').addEventListener('click', stackPush);
  document.getElementById('stackPop').addEventListener('click', stackPop);
  document.getElementById('stackPeek').addEventListener('click', stackPeek);
  document.getElementById('stackClear').addEventListener('click', stackClear);
  document.getElementById('stackInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') stackPush();
  });

  // Queue
  document.getElementById('queueEnqueue').addEventListener('click', queueEnqueue);
  document.getElementById('queueDequeue').addEventListener('click', queueDequeue);
  document.getElementById('queueFront').addEventListener('click', queueFront);
  document.getElementById('queueClear').addEventListener('click', queueClear);
  document.getElementById('queueInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') queueEnqueue();
  });
}

/* ============================================================
   16. PROGRESS SUMMARY
   ============================================================ */

/**
 * Render all progress summary widgets.
 */
function renderProgress() {
  const tasks     = STATE.tasks;
  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Top cards
  document.getElementById('progRate').textContent = `${pct}%`;
  document.getElementById('progRateBar').style.width = `${pct}%`;

  // Tasks completed this week
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekTasks = tasks.filter(t => t.status === 'completed' && new Date(t.updatedAt) >= weekAgo).length;
  document.getElementById('progWeek').textContent = weekTasks;

  // High priority completed
  const highDone = tasks.filter(t => t.priority === 'high' && t.status === 'completed').length;
  document.getElementById('progHighDone').textContent = highDone;

  // Unique subjects
  const subjects = [...new Set(tasks.map(t => t.subject))];
  document.getElementById('progSubjects').textContent = subjects.length;

  // Subject-wise progress
  renderSubjectProgress(tasks, subjects);

  // Priority breakdown
  renderPriorityBreakdown(tasks);

  // Achievements
  renderAchievements(tasks, completed, pct, weekTasks, highDone, subjects.length);
}

function renderSubjectProgress(tasks, subjects) {
  const container = document.getElementById('subjectProgress');
  if (subjects.length === 0) {
    container.innerHTML = '<p class="empty-msg">No tasks yet.</p>';
    return;
  }

  container.innerHTML = subjects.map((subj, i) => {
    const subTasks    = tasks.filter(t => t.subject === subj);
    const subDone     = subTasks.filter(t => t.status === 'completed').length;
    const subPct      = Math.round((subDone / subTasks.length) * 100);
    const color       = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
    return `
      <div class="subj-prog-item">
        <span class="subj-prog-name">${escapeHtml(subj)}</span>
        <div class="subj-prog-bar-wrap">
          <div class="subj-prog-bar-fill" style="width:${subPct}%;background:${color}"></div>
        </div>
        <span class="subj-prog-pct">${subPct}%</span>
      </div>
    `;
  }).join('');
}

function renderPriorityBreakdown(tasks) {
  const container = document.getElementById('priorityBreakdown');
  ['high','medium','low'].forEach(p => {
    const pTasks = tasks.filter(t => t.priority === p);
    const pDone  = pTasks.filter(t => t.status === 'completed').length;
    container.innerHTML += `
      <div class="prio-item">
        <div class="prio-item-label">${capitalize(p)} Priority</div>
        <div class="prio-item-count ${p}">${pTasks.length}</div>
        <div class="prio-item-done">${pDone} completed</div>
      </div>
    `;
  });
}

function renderPriorityBreakdown(tasks) {
  const container = document.getElementById('priorityBreakdown');
  container.innerHTML = ['high','medium','low'].map(p => {
    const pTasks = tasks.filter(t => t.priority === p);
    const pDone  = pTasks.filter(t => t.status === 'completed').length;
    return `
      <div class="prio-item">
        <div class="prio-item-label">${capitalize(p)} Priority</div>
        <div class="prio-item-count ${p}">${pTasks.length}</div>
        <div class="prio-item-done">${pDone} completed</div>
      </div>
    `;
  }).join('');
}

/**
 * Render achievements (gamification).
 */
function renderAchievements(tasks, completed, pct, weekTasks, highDone, subjectCount) {
  const achievements = [
    {
      icon: '🚀', title: 'First Step',
      desc: 'Added your first task',
      earned: tasks.length >= 1
    },
    {
      icon: '✅', title: 'Task Crusher',
      desc: 'Completed 5 tasks',
      earned: completed >= 5
    },
    {
      icon: '🔥', title: 'On Fire',
      desc: 'Completed 10 tasks',
      earned: completed >= 10
    },
    {
      icon: '💎', title: 'Diamond Student',
      desc: 'Reached 80% completion rate',
      earned: pct >= 80
    },
    {
      icon: '🏆', title: 'Perfectionist',
      desc: 'Achieved 100% completion',
      earned: pct === 100 && tasks.length > 0
    },
    {
      icon: '⚡', title: 'High Achiever',
      desc: 'Completed 3 high-priority tasks',
      earned: highDone >= 3
    },
    {
      icon: '📚', title: 'Multi-Subject',
      desc: 'Managing 3+ subjects',
      earned: subjectCount >= 3
    },
    {
      icon: '🗓️', title: 'Weekly Warrior',
      desc: 'Completed 5 tasks in a week',
      earned: weekTasks >= 5
    }
  ];

  document.getElementById('achievementsGrid').innerHTML = achievements.map(a => `
    <div class="achievement ${a.earned ? 'earned' : 'locked'}">
      <span class="ach-icon">${a.icon}</span>
      <div>
        <div class="ach-title">${a.earned ? '' : '🔒 '}${a.title}</div>
        <div class="ach-desc">${a.desc}</div>
      </div>
    </div>
  `).join('');
}

/* ============================================================
   17. SEARCH
   ============================================================ */

function bindSearch() {
  const input = document.getElementById('globalSearch');
  input.addEventListener('input', () => {
    // If on tasks section, re-render with search filter
    const activeSection = document.querySelector('.section.active')?.id;
    if (activeSection === 'section-tasks') {
      renderTaskList();
    } else {
      // Navigate to tasks if user is searching
      if (input.value.trim().length > 1) {
        navigateTo('tasks');
        renderTaskList();
      }
    }
  });
}

/* ============================================================
   18. CONFIRM DIALOG
   ============================================================ */

let confirmCallback = null;

function openConfirm(message, onConfirm) {
  document.getElementById('confirmMsg').textContent = message;
  document.getElementById('confirmModal').classList.add('open');
  confirmCallback = onConfirm;
}

function bindConfirm() {
  document.getElementById('confirmOk').addEventListener('click', () => {
    document.getElementById('confirmModal').classList.remove('open');
    if (typeof confirmCallback === 'function') confirmCallback();
    confirmCallback = null;
  });
  document.getElementById('confirmCancel').addEventListener('click', () => {
    document.getElementById('confirmModal').classList.remove('open');
    confirmCallback = null;
  });
}

/* ============================================================
   18. SAMPLE DATA
   ============================================================ */

/**
 * Load sample tasks if none exist in localStorage.
 * Gives a compelling first-run experience.
 */
function loadSampleData() {
  if (STATE.tasks.length > 0) return; // already has data

  const now   = new Date();
  const day   = 24 * 60 * 60 * 1000;

  const sampleTasks = [
    {
      id: genId(), title: 'Complete DSA Assignment – Linked Lists',
      description: 'Implement a doubly linked list with insert, delete, and reverse operations.',
      subject: 'Computer Science', priority: 'high',
      deadline: new Date(now.getTime() + 2 * day).toISOString(),
      status: 'pending', createdAt: new Date(now.getTime() - 1 * day).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * day).toISOString()
    },
    {
      id: genId(), title: 'Solve 20 Integration Problems',
      description: 'Practice integration by substitution and parts from Chapter 7.',
      subject: 'Mathematics', priority: 'high',
      deadline: new Date(now.getTime() + 1 * day).toISOString(),
      status: 'pending', createdAt: new Date(now.getTime() - 2 * day).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * day).toISOString()
    },
    {
      id: genId(), title: 'Read Chapter 5 – Thermodynamics',
      description: 'Cover laws of thermodynamics and entropy concepts.',
      subject: 'Physics', priority: 'medium',
      deadline: new Date(now.getTime() + 3 * day).toISOString(),
      status: 'completed', createdAt: new Date(now.getTime() - 3 * day).toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: genId(), title: 'Write Essay – Industrial Revolution',
      description: '1500-word essay on the social impact of the Industrial Revolution.',
      subject: 'History', priority: 'medium',
      deadline: new Date(now.getTime() + 5 * day).toISOString(),
      status: 'pending', createdAt: new Date(now.getTime() - 1 * day).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * day).toISOString()
    },
    {
      id: genId(), title: 'Lab Report – Titration Experiment',
      description: 'Document the results and conclusion for the acid-base titration lab.',
      subject: 'Chemistry', priority: 'high',
      deadline: new Date(now.getTime() - 1 * day).toISOString(), // OVERDUE
      status: 'pending', createdAt: new Date(now.getTime() - 5 * day).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * day).toISOString()
    },
    {
      id: genId(), title: 'Prepare for Mid-Term Presentation',
      description: 'Create slides and rehearse for the Economics market analysis presentation.',
      subject: 'Economics', priority: 'high',
      deadline: new Date(now.getTime() + 4 * day).toISOString(),
      status: 'pending', createdAt: new Date(now.getTime() - 2 * day).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * day).toISOString()
    },
    {
      id: genId(), title: 'Read "To Kill a Mockingbird" Chapters 10-15',
      description: 'Annotate key themes and character development for class discussion.',
      subject: 'English', priority: 'low',
      deadline: new Date(now.getTime() + 7 * day).toISOString(),
      status: 'completed', createdAt: new Date(now.getTime() - 4 * day).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * day).toISOString()
    },
    {
      id: genId(), title: 'Practice Binary Trees – LeetCode',
      description: 'Solve 10 binary tree problems on LeetCode focusing on BFS and DFS.',
      subject: 'Computer Science', priority: 'medium',
      deadline: new Date(now.getTime() + 6 * day).toISOString(),
      status: 'pending', createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
  ];

  const sampleSessions = [
    { id: genId(), subject: 'Data Structures',  day: 'Mon', color: 'purple', start: '09:00', end: '11:00' },
    { id: genId(), subject: 'Mathematics',       day: 'Mon', color: 'teal',   start: '14:00', end: '16:00' },
    { id: genId(), subject: 'Physics',           day: 'Tue', color: 'orange', start: '10:00', end: '12:00' },
    { id: genId(), subject: 'English Essay',     day: 'Wed', color: 'pink',   start: '09:00', end: '10:30' },
    { id: genId(), subject: 'Computer Science',  day: 'Thu', color: 'blue',   start: '13:00', end: '15:00' },
    { id: genId(), subject: 'Chemistry',         day: 'Fri', color: 'orange', start: '09:00', end: '11:00' },
    { id: genId(), subject: 'Economics Review',  day: 'Sat', color: 'teal',   start: '11:00', end: '13:00' }
  ];

  STATE.tasks    = sampleTasks;
  STATE.sessions = sampleSessions;
  saveTasks();
  saveSessions();
  showToast('Welcome to STUDYFLOW! Sample tasks loaded. 🎉', 'success', 4000);
}

/* ============================================================
   UTILITY HELPERS
   ============================================================ */

/**
 * Parse a comma-separated string into a number array.
 * Returns null if invalid.
 * @param {string} str
 * @returns {number[]|null}
 */
function parseArray(str) {
  const parts = str.split(',').map(s => s.trim()).filter(s => s !== '');
  if (parts.length === 0) return null;
  const nums = parts.map(Number);
  if (nums.some(isNaN)) return null;
  return nums;
}

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Capitalize the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format an ISO deadline string into a human-readable date.
 * @param {string} iso
 * @returns {string}
 */
function formatDeadline(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = d - now;
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < 0)           return `Overdue (${d.toLocaleDateString()})`;
  if (diff < oneDay)      return `Today ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  if (diff < 2 * oneDay)  return `Tomorrow ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

/* ============================================================
   19. INIT – APPLICATION ENTRY POINT
   ============================================================ */

/**
 * Initialise the entire application.
 */
function init() {
  // 1. Load persisted data
  loadFromStorage();

  // 2. Apply saved theme
  initTheme();

  // 3. Load sample data if first visit
  loadSampleData();

  // 4. Bind all event handlers
  bindNavLinks();
  bindSidebarControls();
  bindThemeToggle();
  bindTaskModal();
  bindFilters();
  bindCalendar();
  bindPlanner();
  bindDsaLab();
  bindSearch();
  bindConfirm();

  // 5. Initial renders
  renderDashboard();
  updateTaskBadge();

  // 6. Keyboard accessibility – close modals on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTaskModal();
      closeSessionModal();
      document.getElementById('confirmModal').classList.remove('open');
      closeSidebar();
    }
  });

  // 7. Keyboard navigation for task checkboxes
  document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('task-checkbox')) {
      toggleTaskComplete(e.target.dataset.id);
    }
  });

  console.log('%c STUDYFLOW Initialized ✓ ', 'background:#6C63FF;color:white;font-weight:bold;border-radius:4px;padding:4px 8px;');
}

// Boot the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
