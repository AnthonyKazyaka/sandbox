// ==========================================================================
// Family To-Do Tracker - JavaScript Application
// ==========================================================================

class FamilyTracker {
    constructor() {
        this.tasks = [];
        this.categories = [];
        this.familyMembers = [];
        this.settings = {};
        this.currentView = 'dashboard';
        this.currentUser = null;
        
        this.initializeApp();
    }

    // ==========================================================================
    // Initialization
    // ==========================================================================

    async initializeApp() {
        try {
            await this.loadData();
            this.initializeDefaultData();
            this.setupEventListeners();
            this.setupTheme();
            this.renderApp();
            this.hideLoadingScreen();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showToast('Failed to load application', 'error');
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const app = document.getElementById('app');
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            app.style.display = 'flex';
            app.classList.add('fade-in');
        }, 1000);
    }

    initializeDefaultData() {
        // Initialize default categories if none exist
        if (this.categories.length === 0) {
            this.categories = [
                { id: '1', name: 'Household', icon: '🏠', color: '#3b82f6' },
                { id: '2', name: 'Personal', icon: '👤', color: '#10b981' },
                { id: '3', name: 'Work', icon: '💼', color: '#f59e0b' },
                { id: '4', name: 'Health', icon: '💪', color: '#ef4444' },
                { id: '5', name: 'Learning', icon: '📚', color: '#8b5cf6' }
            ];
        }

        // Initialize default user if none exist
        if (this.familyMembers.length === 0) {
            this.familyMembers = [
                { id: '1', name: 'Me', avatar: '👤', role: 'admin', isCurrentUser: true }
            ];
            this.currentUser = this.familyMembers[0];
        }

        // Initialize default settings
        if (Object.keys(this.settings).length === 0) {
            this.settings = {
                theme: 'auto',
                colorScheme: 'blue',
                notifications: true,
                language: 'en'
            };
        }

        // Add some sample tasks if none exist
        if (this.tasks.length === 0) {
            this.addSampleTasks();
        }
    }

    addSampleTasks() {
        const sampleTasks = [
            {
                title: 'Welcome to Family Tracker! 🎉',
                description: 'This is your first task. Click the checkbox to mark it complete!',
                category: '2',
                priority: 'medium',
                assignee: '1',
                dueDate: this.getTodayDate(),
                completed: false
            },
            {
                title: 'Take out the trash',
                description: 'Remember to separate recyclables',
                category: '1',
                priority: 'high',
                assignee: '1',
                dueDate: this.getTodayDate(),
                completed: false
            },
            {
                title: 'Read for 30 minutes',
                description: 'Continue reading that book on the nightstand',
                category: '5',
                priority: 'low',
                assignee: '1',
                dueDate: this.getTomorrowDate(),
                completed: false
            }
        ];

        sampleTasks.forEach(taskData => {
            this.addTask(taskData);
        });
    }

    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    // ==========================================================================
    // Data Management
    // ==========================================================================

    async loadData() {
        try {
            const data = localStorage.getItem('familyTrackerData');
            if (data) {
                const parsed = JSON.parse(data);
                this.tasks = parsed.tasks || [];
                this.categories = parsed.categories || [];
                this.familyMembers = parsed.familyMembers || [];
                this.settings = parsed.settings || {};
                this.currentUser = parsed.currentUser || null;
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }

    async saveData() {
        try {
            const data = {
                tasks: this.tasks,
                categories: this.categories,
                familyMembers: this.familyMembers,
                settings: this.settings,
                currentUser: this.currentUser,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('familyTrackerData', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save data:', error);
            this.showToast('Failed to save data', 'error');
        }
    }

    // ==========================================================================
    // Event Listeners
    // ==========================================================================

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openModal('settingsModal');
        });

        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openTaskModal();
        });

        // Task form
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // Modal controls
        document.querySelectorAll('.modal-close, #cancelTaskBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Color scheme selection
        document.querySelectorAll('.color-scheme').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const scheme = e.target.dataset.scheme;
                this.setColorScheme(scheme);
            });
        });

        // Theme selection
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });

        // Export/Import data
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importDataBtn').addEventListener('click', () => {
            this.importData();
        });

        // Filters
        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.renderTasks();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.renderTasks();
        });

        document.getElementById('assigneeFilter').addEventListener('change', () => {
            this.renderTasks();
        });
    }

    // ==========================================================================
    // View Management
    // ==========================================================================

    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}View`).classList.add('active');

        this.currentView = viewName;
        this.renderCurrentView();
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'tasks':
                this.renderTasks();
                break;
            case 'family':
                this.renderFamily();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
        }
    }

    renderApp() {
        this.renderDashboard();
        this.renderTasks();
        this.renderFamily();
        this.populateFilters();
    }

    // ==========================================================================
    // Dashboard Rendering
    // ==========================================================================

    renderDashboard() {
        this.renderProgressCircle();
        this.renderStats();
        this.renderUrgentTasks();
        this.renderFamilyActivity();
        this.renderCategories();
    }    renderProgressCircle() {
        const todayTasks = this.getTodayTasks();
        const completed = todayTasks.filter(task => task.completed).length;
        const total = todayTasks.length;

        document.querySelector('.progress-number').textContent = completed;
        document.querySelector('.progress-label').textContent = total === 1 ? 'task' : 'tasks';
        
        // Use animated progress circle
        this.animateProgressCircle();
    }

    renderStats() {
        const todayTasks = this.getTodayTasks();
        const completed = todayTasks.filter(task => task.completed).length;
        const remaining = todayTasks.length - completed;

        document.getElementById('completedToday').textContent = completed;
        document.getElementById('remainingToday').textContent = remaining;
    }

    renderUrgentTasks() {
        const urgentTasks = this.tasks.filter(task => 
            !task.completed && (task.priority === 'urgent' || this.isOverdue(task))
        ).slice(0, 5);

        const container = document.getElementById('urgentTasksList');
        
        if (urgentTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">✨</span>
                    <p>No urgent tasks - you're doing great!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = urgentTasks.map(task => `
            <div class="task-item urgent" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'completed' : ''}" 
                     onclick="app.toggleTask('${task.id}')">
                    ${task.completed ? '✓' : ''}
                </div>
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        <span class="task-category">${this.getCategoryName(task.category)}</span>
                        <span class="task-due">${this.formatDueDate(task.dueDate)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderFamilyActivity() {
        const container = document.getElementById('familyActivity');
        const recentActivity = this.getRecentActivity();

        if (recentActivity.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">👋</span>
                    <p>Welcome to your family tracker!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentActivity.map(activity => `
            <div class="activity-item">
                <div class="activity-avatar">${activity.avatar}</div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    renderCategories() {
        const container = document.getElementById('categoriesGrid');
        
        container.innerHTML = this.categories.map(category => {
            const taskCount = this.tasks.filter(task => task.category === category.id).length;
            return `
                <div class="category-item" onclick="app.filterByCategory('${category.id}')">
                    <div class="category-icon">${category.icon}</div>
                    <div class="category-name">${this.escapeHtml(category.name)}</div>
                    <div class="category-count">${taskCount} tasks</div>
                </div>
            `;
        }).join('');
    }

    // ==========================================================================
    // Tasks Rendering
    // ==========================================================================

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        const container = document.getElementById('tasksList');

        if (filteredTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📝</span>
                    <p>No tasks found. Create your first task!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'completed' : ''}" 
                     onclick="app.toggleTask('${task.id}')">
                    ${task.completed ? '✓' : ''}
                </div>
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        <span class="task-priority ${task.priority}">${this.getPriorityLabel(task.priority)}</span>
                        <span class="task-category">${this.getCategoryName(task.category)}</span>
                        <span class="task-assignee">${this.getMemberName(task.assignee)}</span>
                        ${task.dueDate ? `<span class="task-due">${this.formatDueDate(task.dueDate)}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn" onclick="app.editTask('${task.id}')" title="Edit">
                        ✏️
                    </button>
                    <button class="task-action-btn" onclick="app.deleteTask('${task.id}')" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    getFilteredTasks() {
        let filtered = [...this.tasks];

        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const assigneeFilter = document.getElementById('assigneeFilter').value;

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(task => task.category === categoryFilter);
        }

        if (statusFilter !== 'all') {
            switch (statusFilter) {
                case 'pending':
                    filtered = filtered.filter(task => !task.completed);
                    break;
                case 'completed':
                    filtered = filtered.filter(task => task.completed);
                    break;
                case 'in-progress':
                    // For now, treat all non-completed as in-progress
                    filtered = filtered.filter(task => !task.completed);
                    break;
            }
        }

        if (assigneeFilter !== 'all') {
            filtered = filtered.filter(task => task.assignee === assigneeFilter);
        }

        // Sort by priority and due date
        return filtered.sort((a, b) => {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority] || 0;
            const bPriority = priorityOrder[b.priority] || 0;
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            
            return a.dueDate ? -1 : b.dueDate ? 1 : 0;
        });
    }

    populateFilters() {
        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
            this.categories.map(cat => 
                `<option value="${cat.id}">${cat.icon} ${this.escapeHtml(cat.name)}</option>`
            ).join('');

        // Assignee filter
        const assigneeFilter = document.getElementById('assigneeFilter');
        assigneeFilter.innerHTML = '<option value="all">All Members</option>' +
            this.familyMembers.map(member => 
                `<option value="${member.id}">${member.avatar} ${this.escapeHtml(member.name)}</option>`
            ).join('');

        // Task assignee dropdown
        const taskAssignee = document.getElementById('taskAssignee');
        taskAssignee.innerHTML = this.familyMembers.map(member => 
            `<option value="${member.id}" ${member.isCurrentUser ? 'selected' : ''}>
                ${member.avatar} ${this.escapeHtml(member.name)}
            </option>`
        ).join('');
    }

    // ==========================================================================
    // Family Rendering
    // ==========================================================================

    renderFamily() {
        const container = document.getElementById('familyGrid');
        
        container.innerHTML = this.familyMembers.map(member => {
            const memberTasks = this.tasks.filter(task => task.assignee === member.id);
            const completedTasks = memberTasks.filter(task => task.completed).length;
            const completionRate = memberTasks.length > 0 ? 
                Math.round((completedTasks / memberTasks.length) * 100) : 0;

            return `
                <div class="family-member-card">
                    <div class="member-avatar">${member.avatar}</div>
                    <div class="member-info">
                        <h4>${this.escapeHtml(member.name)}</h4>
                        <p class="member-role">${member.role}</p>
                        <div class="member-stats">
                            <div class="stat">
                                <span class="stat-number">${memberTasks.length}</span>
                                <span class="stat-label">tasks</span>
                            </div>
                            <div class="stat">
                                <span class="stat-number">${completionRate}%</span>
                                <span class="stat-label">completed</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }    // ==========================================================================
    // Analytics Rendering
    // ==========================================================================

    renderAnalytics() {
        this.renderAnalyticsOverview();
        this.renderAnalyticsCharts();
        this.renderAchievements();
        this.renderInsights();
        this.setupAnalyticsTimeFilter();
    }

    renderAnalyticsOverview() {
        const timeRange = this.getAnalyticsTimeRange();
        const tasks = this.getTasksInTimeRange(timeRange);
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const currentStreak = this.getCurrentStreak();
        const avgTasksPerDay = this.getAverageTasksPerDay(timeRange);

        document.getElementById('totalTasksCount').textContent = totalTasks;
        document.getElementById('completionRate').textContent = `${completionRate}%`;
        document.getElementById('currentStreak').textContent = `${currentStreak} days`;
        document.getElementById('avgTasksPerDay').textContent = avgTasksPerDay.toFixed(1);
    }

    renderAnalyticsCharts() {
        this.renderWeeklyProgressChart();
        this.renderCategoryChart();
        this.renderPriorityChart();
        this.renderFamilyChart();
    }

    renderWeeklyProgressChart() {
        const ctx = document.getElementById('weeklyProgressChart').getContext('2d');
        const container = document.getElementById('weeklyProgressChart').parentElement;
        const weeklyData = this.getWeeklyProgressData();
        // Show empty state if no data
        if (weeklyData.completed.every(v => v === 0) && weeklyData.created.every(v => v === 0)) {
            container.innerHTML = '<div class="chart-placeholder">No data to display for this period.</div>';
            return;
        }
        container.innerHTML = '<canvas id="weeklyProgressChart"></canvas>';
        const newCtx = document.getElementById('weeklyProgressChart').getContext('2d');
        new Chart(newCtx, {
            type: 'line',
            data: {
                labels: weeklyData.labels,
                datasets: [{
                    label: 'Tasks Completed',
                    data: weeklyData.completed,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Tasks Created',
                    data: weeklyData.created,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 300 },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { boxWidth: 18, font: { size: 13 } }
                    },
                    tooltip: {
                        callbacks: {
                            title: (items) => `Date: ${items[0].label}`,
                            label: (context) => `${context.dataset.label}: ${context.parsed.y} tasks`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    renderCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        const container = document.getElementById('categoryChart').parentElement;
        const categoryData = this.getCategoryDistribution();
        if (categoryData.data.every(v => v === 0)) {
            container.innerHTML = '<div class="chart-placeholder">No category data for this period.</div>';
            return;
        }
        container.innerHTML = '<canvas id="categoryChart"></canvas>';
        const newCtx = document.getElementById('categoryChart').getContext('2d');
        new Chart(newCtx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.data,
                    backgroundColor: categoryData.colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 300 },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { boxWidth: 18, font: { size: 13 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.parsed / total) * 100);
                                return `${context.label}: ${context.parsed} tasks (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderPriorityChart() {
        const ctx = document.getElementById('priorityChart').getContext('2d');
        const container = document.getElementById('priorityChart').parentElement;
        const priorityData = this.getPriorityDistribution();
        if (priorityData.data.every(v => v === 0)) {
            container.innerHTML = '<div class="chart-placeholder">No priority data for this period.</div>';
            return;
        }
        container.innerHTML = '<canvas id="priorityChart"></canvas>';
        const newCtx = document.getElementById('priorityChart').getContext('2d');
        new Chart(newCtx, {
            type: 'bar',
            data: {
                labels: priorityData.labels,
                datasets: [{
                    label: 'Tasks',
                    data: priorityData.data,
                    backgroundColor: priorityData.colors,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 300 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${context.parsed.y} tasks`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    renderFamilyChart() {
        const ctx = document.getElementById('familyChart').getContext('2d');
        const container = document.getElementById('familyChart').parentElement;
        const familyData = this.getFamilyPerformanceData();
        if (familyData.data.every(v => v === 0)) {
            container.innerHTML = '<div class="chart-placeholder">No family performance data for this period.</div>';
            return;
        }
        container.innerHTML = '<canvas id="familyChart"></canvas>';
        const newCtx = document.getElementById('familyChart').getContext('2d');
        new Chart(newCtx, {
            type: 'bar',
            data: {
                labels: familyData.labels,
                datasets: [{
                    label: 'Completion Rate',
                    data: familyData.data,
                    backgroundColor: familyData.colors,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 300 },
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${context.parsed.x}% completion rate`
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }    setupAnalyticsTimeFilter() {
        const timeFilter = document.getElementById('analyticsTimeRange');
        if (timeFilter && !timeFilter.hasAttribute('data-listener')) {
            timeFilter.addEventListener('change', () => {
                this.renderAnalytics();
            });
            timeFilter.setAttribute('data-listener', 'true');
        }
    }

    // ==========================================================================
    // Analytics Data Processing Helper Methods
    // ==========================================================================

    getAnalyticsTimeRange() {
        const timeRangeSelect = document.getElementById('analyticsTimeRange');
        const selectedRange = timeRangeSelect ? timeRangeSelect.value : 'week';
        
        const now = new Date();
        const ranges = {
            week: {
                start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
                end: now,
                days: 7
            },
            month: {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: now,
                days: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
            },
            quarter: {
                start: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
                end: now,
                days: 90
            },
            year: {
                start: new Date(now.getFullYear(), 0, 1),
                end: now,
                days: 365
            }
        };

        return ranges[selectedRange] || ranges.week;
    }

    getTasksInTimeRange(timeRange) {
        const { start, end } = timeRange;
        return this.tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= start && taskDate <= end;
        });
    }

    getCurrentStreak() {
        // Calculate consecutive days with at least one completed task
        const now = new Date();
        let streak = 0;
        let currentDate = new Date(now);
        currentDate.setHours(0, 0, 0, 0);

        while (true) {
            const dayStart = new Date(currentDate);
            const dayEnd = new Date(currentDate);
            dayEnd.setHours(23, 59, 59, 999);

            const dayTasks = this.tasks.filter(task => {
                if (!task.completed) return false;
                const completedDate = new Date(task.updatedAt);
                return completedDate >= dayStart && completedDate <= dayEnd;
            });

            if (dayTasks.length === 0) {
                break;
            }

            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
            
            // Prevent infinite loop - max 365 days
            if (streak >= 365) break;
        }

        return streak;
    }

    getAverageTasksPerDay(timeRange) {
        const tasks = this.getTasksInTimeRange(timeRange);
        if (timeRange.days === 0) return 0;
        return tasks.length / timeRange.days;
    }

    getWeeklyProgressData() {
        const timeRange = this.getAnalyticsTimeRange();
        const daysToShow = Math.min(timeRange.days, 14); // Show max 14 days for weekly view
        const labels = [];
        const completed = [];
        const created = [];

        for (let i = daysToShow - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            // Format label
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));

            // Count tasks created on this day
            const createdCount = this.tasks.filter(task => {
                const taskDate = new Date(task.createdAt);
                return taskDate >= dayStart && taskDate <= dayEnd;
            }).length;
            created.push(createdCount);

            // Count tasks completed on this day
            const completedCount = this.tasks.filter(task => {
                if (!task.completed) return false;
                const completedDate = new Date(task.updatedAt);
                return completedDate >= dayStart && completedDate <= dayEnd;
            }).length;
            completed.push(completedCount);
        }

        return { labels, completed, created };
    }

    getCategoryDistribution() {
        const timeRange = this.getAnalyticsTimeRange();
        const tasks = this.getTasksInTimeRange(timeRange);
        const categoryCount = {};
        const categoryColors = {};

        // Count tasks by category
        tasks.forEach(task => {
            const category = this.categories.find(c => c.id === task.category);
            if (category) {
                categoryCount[category.name] = (categoryCount[category.name] || 0) + 1;
                categoryColors[category.name] = category.color || '#3b82f6';
            }
        });

        const labels = Object.keys(categoryCount);
        const data = Object.values(categoryCount);
        const colors = labels.map(label => categoryColors[label]);

        return { labels, data, colors };
    }

    getPriorityDistribution() {
        const timeRange = this.getAnalyticsTimeRange();
        const tasks = this.getTasksInTimeRange(timeRange);
        const priorityCount = { low: 0, medium: 0, high: 0, urgent: 0 };
        const priorityColors = {
            low: '#10b981',
            medium: '#3b82f6', 
            high: '#f59e0b',
            urgent: '#ef4444'
        };

        tasks.forEach(task => {
            if (priorityCount.hasOwnProperty(task.priority)) {
                priorityCount[task.priority]++;
            }
        });

        const labels = ['🟢 Low', '🟡 Medium', '🟠 High', '🔴 Urgent'];
        const data = [priorityCount.low, priorityCount.medium, priorityCount.high, priorityCount.urgent];
        const colors = [priorityColors.low, priorityColors.medium, priorityColors.high, priorityColors.urgent];

        return { labels, data, colors };
    }

    getFamilyPerformanceData() {
        const timeRange = this.getAnalyticsTimeRange();
        const tasks = this.getTasksInTimeRange(timeRange);
        const memberStats = {};

        // Initialize stats for all family members
        this.familyMembers.forEach(member => {
            memberStats[member.id] = {
                name: member.name,
                avatar: member.avatar,
                total: 0,
                completed: 0,
                completionRate: 0
            };
        });

        // Count tasks by assignee
        tasks.forEach(task => {
            if (memberStats[task.assignee]) {
                memberStats[task.assignee].total++;
                if (task.completed) {
                    memberStats[task.assignee].completed++;
                }
            }
        });

        // Calculate completion rates
        Object.values(memberStats).forEach(stats => {
            stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        });

        const labels = Object.values(memberStats).map(stats => `${stats.avatar} ${stats.name}`);
        const data = Object.values(memberStats).map(stats => stats.completionRate);
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

        return { labels, data, colors: colors.slice(0, labels.length) };
    }

    getAchievements() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const streak = this.getCurrentStreak();
        const todayTasks = this.getTodayTasks();
        const todayCompleted = todayTasks.filter(task => task.completed).length;

        const achievements = [
            {
                id: 'first_task',
                name: 'Getting Started',
                description: 'Complete your first task',
                icon: '🎯',
                unlocked: completedTasks >= 1,
                progress: Math.min(completedTasks, 1) * 100,
                current: Math.min(completedTasks, 1),
                target: 1
            },
            {
                id: 'task_master',
                name: 'Task Master',
                description: 'Complete 10 tasks',
                icon: '🏆',
                unlocked: completedTasks >= 10,
                progress: Math.min((completedTasks / 10) * 100, 100),
                current: Math.min(completedTasks, 10),
                target: 10
            },
            {
                id: 'productive_day',
                name: 'Productive Day',
                description: 'Complete 5 tasks in one day',
                icon: '⚡',
                unlocked: todayCompleted >= 5,
                progress: Math.min((todayCompleted / 5) * 100, 100),
                current: Math.min(todayCompleted, 5),
                target: 5
            },
            {
                id: 'streak_starter',
                name: 'Streak Starter',
                description: 'Maintain a 3-day streak',
                icon: '🔥',
                unlocked: streak >= 3,
                progress: Math.min((streak / 3) * 100, 100),
                current: Math.min(streak, 3),
                target: 3
            },
            {
                id: 'consistency_king',
                name: 'Consistency King',
                description: 'Maintain a 7-day streak',
                icon: '👑',
                unlocked: streak >= 7,
                progress: Math.min((streak / 7) * 100, 100),
                current: Math.min(streak, 7),
                target: 7
            },
            {
                id: 'task_creator',
                name: 'Task Creator',
                description: 'Create 25 tasks',
                icon: '📝',
                unlocked: totalTasks >= 25,
                progress: Math.min((totalTasks / 25) * 100, 100),
                current: Math.min(totalTasks, 25),
                target: 25
            }
        ];

        return achievements;
    }

    generateInsights() {
        const timeRange = this.getAnalyticsTimeRange();
        const tasks = this.getTasksInTimeRange(timeRange);
        const completedTasks = tasks.filter(task => task.completed);
        const insights = [];

        // Completion rate insight
        const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
        if (completionRate >= 80) {
            insights.push({
                icon: '🌟',
                text: 'Excellent productivity!',
                detail: `You've completed ${completionRate}% of your tasks. Keep up the great work!`
            });
        } else if (completionRate >= 60) {
            insights.push({
                icon: '👍',
                text: 'Good progress',
                detail: `${completionRate}% completion rate. You're doing well!`
            });
        } else if (completionRate < 60 && tasks.length > 0) {
            insights.push({
                icon: '💪',
                text: 'Room for improvement',
                detail: `Consider breaking down larger tasks or setting realistic daily goals.`
            });
        }

        // Most productive category
        const categoryStats = {};
        completedTasks.forEach(task => {
            const category = this.getCategoryName(task.category);
            categoryStats[category] = (categoryStats[category] || 0) + 1;
        });

        const topCategory = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0];
        if (topCategory && topCategory[1] > 1) {
            insights.push({
                icon: '🏅',
                text: 'Top performing category',
                detail: `${topCategory[0]} with ${topCategory[1]} completed tasks`
            });
        }

        // Streak insight
        const streak = this.getCurrentStreak();
        if (streak >= 7) {
            insights.push({
                icon: '🔥',
                text: 'Amazing streak!',
                detail: `You've completed tasks for ${streak} consecutive days`
            });
        } else if (streak >= 3) {
            insights.push({
                icon: '📈',
                text: 'Building momentum',
                detail: `${streak}-day streak going strong!`
            });
        }

        // Weekly performance insight
        const weeklyData = this.getWeeklyProgressData();
        const avgCompleted = weeklyData.completed.reduce((a, b) => a + b, 0) / weeklyData.completed.length;
        if (avgCompleted >= 2) {
            insights.push({
                icon: '⚡',
                text: 'Consistent performer',
                detail: `Averaging ${avgCompleted.toFixed(1)} completed tasks per day`
            });
        }

        // Priority insight
        const urgentTasks = tasks.filter(task => task.priority === 'urgent' && !task.completed);
        if (urgentTasks.length > 0) {
            insights.push({
                icon: '⚠️',
                text: 'Urgent tasks pending',
                detail: `${urgentTasks.length} urgent task${urgentTasks.length > 1 ? 's' : ''} need${urgentTasks.length > 1 ? '' : 's'} attention`
            });
        }

        return insights.slice(0, 4); // Limit to 4 insights for better UX
    }

    // ==========================================================================
    // Task Management
    // ==========================================================================

    addTask(taskData) {
        const task = {
            id: this.generateId(),
            title: taskData.title,
            description: taskData.description || '',
            category: taskData.category,
            priority: taskData.priority || 'medium',
            assignee: taskData.assignee || this.currentUser.id,
            dueDate: taskData.dueDate || null,
            completed: taskData.completed || false,
            recurring: taskData.recurring || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveData();
        this.renderApp();
        
        return task;
    }    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            
            if (task.completed) {
                this.showToastWithAnimation(`✅ "${task.title}" completed!`, 'success');
            }
            
            this.saveData();
            this.renderApp();
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.openTaskModal(task);
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveData();
            this.renderApp();
            this.showToast('Task deleted', 'info');
        }
    }

    openTaskModal(task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('taskModalTitle');

        if (task) {
            title.textContent = 'Edit Task';
            form.elements.title.value = task.title;
            form.elements.description.value = task.description;
            form.elements.category.value = task.category;
            form.elements.priority.value = task.priority;
            form.elements.assignee.value = task.assignee;
            form.elements.dueDate.value = task.dueDate || '';
            form.elements.recurring.checked = task.recurring;
            form.dataset.taskId = task.id;
        } else {
            title.textContent = 'Add New Task';
            form.reset();
            form.elements.assignee.value = this.currentUser.id;
            delete form.dataset.taskId;
        }

        this.openModal('taskModal');
    }    saveTask() {
        const form = document.getElementById('taskForm');
        const formData = new FormData(form);
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            priority: formData.get('priority'),
            assignee: formData.get('assignee'),
            dueDate: formData.get('dueDate'),
            recurring: formData.has('recurring')
        };

        if (form.dataset.taskId) {
            // Update existing task
            const task = this.tasks.find(t => t.id === form.dataset.taskId);
            if (task) {
                Object.assign(task, taskData);
                task.updatedAt = new Date().toISOString();
                this.showToastWithAnimation('Task updated!', 'success');
            }
        } else {
            // Create new task with animation
            this.addTaskWithAnimation(taskData);
            this.showToastWithAnimation('Task created!', 'success');
        }

        this.closeModal('taskModal');
        this.renderApp();
    }

    // ==========================================================================
    // Utility Functions
    // ==========================================================================

    getTodayTasks() {
        const today = new Date().toISOString().split('T')[0];
        return this.tasks.filter(task => task.dueDate === today);
    }

    isOverdue(task) {
        if (!task.dueDate) return false;
        const today = new Date().toISOString().split('T')[0];
        return task.dueDate < today && !task.completed;
    }

    getCategoryName(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? `${category.icon} ${category.name}` : 'Unknown';
    }

    getMemberName(memberId) {
        const member = this.familyMembers.find(m => m.id === memberId);
        return member ? `${member.avatar} ${member.name}` : 'Unknown';
    }

    getPriorityLabel(priority) {
        const labels = {
            low: '🟢 Low',
            medium: '🟡 Medium',
            high: '🟠 High',
            urgent: '🔴 Urgent'
        };
        return labels[priority] || '🟡 Medium';
    }

    formatDueDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateStr = date.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (dateStr === todayStr) return 'Today';
        if (dateStr === tomorrowStr) return 'Tomorrow';
        if (dateStr === yesterdayStr) return 'Yesterday';
        
        return date.toLocaleDateString();
    }

    getRecentActivity() {
        // Placeholder for activity tracking - will be enhanced in Phase 2
        return [];
    }

    filterByCategory(categoryId) {
        this.switchView('tasks');
        setTimeout(() => {
            document.getElementById('categoryFilter').value = categoryId;
            this.renderTasks();
        }, 100);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==========================================================================
    // Theme Management
    // ==========================================================================

    setupTheme() {
        const savedTheme = this.settings.theme || 'auto';
        const savedScheme = this.settings.colorScheme || 'blue';
        
        this.setTheme(savedTheme, false);
        this.setColorScheme(savedScheme, false);
        
        // Update UI controls
        document.getElementById('themeSelect').value = savedTheme;
        document.querySelector(`[data-scheme="${savedScheme}"]`).classList.add('active');
    }

    setTheme(theme, save = true) {
        const root = document.documentElement;
        const themeIcon = document.querySelector('.theme-icon');
        
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            themeIcon.textContent = prefersDark ? '🌙' : '☀️';
        } else {
            root.setAttribute('data-theme', theme);
            themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
        }

        if (save) {
            this.settings.theme = theme;
            this.saveData();
        }
    }

    toggleTheme() {
        const current = this.settings.theme;
        let next;
        
        if (current === 'light') next = 'dark';
        else if (current === 'dark') next = 'auto';
        else next = 'light';
        
        this.setTheme(next);
        document.getElementById('themeSelect').value = next;
    }

    setColorScheme(scheme, save = true) {
        document.documentElement.setAttribute('data-scheme', scheme);
        
        // Update active button
        document.querySelectorAll('.color-scheme').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-scheme="${scheme}"]`).classList.add('active');

        if (save) {
            this.settings.colorScheme = scheme;
            this.saveData();
        }
    }

    // ==========================================================================
    // Modal Management
    // ==========================================================================

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ==========================================================================
    // Toast Notifications
    // ==========================================================================

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toastIcon');
        const messageEl = document.getElementById('toastMessage');

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        icon.textContent = icons[type] || icons.success;
        messageEl.textContent = message;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ==========================================================================
    // Data Import/Export
    // ==========================================================================

    exportData() {
        const data = {
            tasks: this.tasks,
            categories: this.categories,
            familyMembers: this.familyMembers,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `family-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Data exported successfully!', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (confirm('This will replace all current data. Continue?')) {
                        this.tasks = data.tasks || [];
                        this.categories = data.categories || [];
                        this.familyMembers = data.familyMembers || [];
                        this.settings = data.settings || {};
                        
                        this.saveData();
                        this.renderApp();
                        this.setupTheme();
                        
                        this.showToast('Data imported successfully!', 'success');
                    }
                } catch (error) {
                    this.showToast('Invalid file format', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    // ==========================================================================
    // Enhanced Animation Methods (Phase 2)
    // ==========================================================================

    addTaskWithAnimation(taskData) {
        const task = this.addTask(taskData);
        
        // Add task to DOM with animation
        setTimeout(() => {
            const taskElements = document.querySelectorAll(`[data-task-id="${task.id}"]`);
            taskElements.forEach(el => {
                el.classList.add('task-created');
                // Remove animation class after completion
                setTimeout(() => el.classList.remove('task-created'), 500);
            });
        }, 100);
        
        return task;
    }

    toggleTaskWithAnimation(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const taskElements = document.querySelectorAll(`[data-task-id="${taskId}"]`);
        
        if (!task.completed) {
            // Completing task - add completion animation
            taskElements.forEach(el => {
                el.classList.add('completing');
                setTimeout(() => {
                    el.classList.remove('completing');
                    el.classList.add('completed');
                }, 600);
            });
        }

        // Toggle the task state
        this.toggleTask(taskId);
    }

    deleteTaskWithAnimation(taskId) {
        const taskElements = document.querySelectorAll(`[data-task-id="${taskId}"]`);
        
        // Animate out before deleting
        taskElements.forEach(el => {
            el.classList.add('task-deleting');
        });
        
        // Delete after animation completes
        setTimeout(() => {
            this.deleteTask(taskId);
        }, 400);
    }

    showToastWithAnimation(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toastIcon');
        const messageEl = document.getElementById('toastMessage');

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        icon.textContent = icons[type] || icons.success;
        messageEl.textContent = message;

        // Remove any existing classes
        toast.className = 'toast';
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    animateProgressCircle() {
        const todayTasks = this.getTodayTasks();
        const completed = todayTasks.filter(task => task.completed).length;
        const total = todayTasks.length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;

        const circle = document.querySelector('.progress-ring-circle');
        const circumference = 2 * Math.PI * 54;
        
        // Start from current position for smooth transition
        const currentOffset = circle.style.strokeDashoffset || circumference;
        const targetOffset = circumference - (percentage / 100) * circumference;
        
        // Animate the progress
        const duration = 800; // ms
        const startTime = performance.now();
        const startOffset = parseFloat(currentOffset);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = startOffset + (targetOffset - startOffset) * easeOut;
            
            circle.style.strokeDashoffset = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete - update color
                circle.style.stroke = percentage === 100 ? '#10b981' : '#3b82f6';
            }
        };
        
        requestAnimationFrame(animate);
    }

    showLoadingState(element, text = 'Loading...') {
        const originalContent = element.innerHTML;
        element.innerHTML = `
            <span class="loading-state">
                <span class="loading-spinner-mini"></span>
                ${text}
            </span>
        `;
        
        return () => {
            element.innerHTML = originalContent;
        };
    }

    staggerTaskAnimation() {
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 50}ms`;
        });
    }
}

// ==========================================================================
// Initialize Application
// ==========================================================================

let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new FamilyTracker();
});

// Handle system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (app && app.settings.theme === 'auto') {
        app.setTheme('auto', false);
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'n':
                e.preventDefault();
                if (app) app.openTaskModal();
                break;
            case ',':
                e.preventDefault();
                if (app) app.openModal('settingsModal');
                break;
        }
    }
    
    if (e.key === 'Escape') {
        // Close any open modals
        document.querySelectorAll('.modal.active').forEach(modal => {
            if (app) app.closeModal(modal.id);
        });
    }
});
