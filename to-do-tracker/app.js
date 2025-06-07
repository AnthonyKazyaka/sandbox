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
    }

    renderProgressCircle() {
        const todayTasks = this.getTodayTasks();
        const completed = todayTasks.filter(task => task.completed).length;
        const total = todayTasks.length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;

        const circle = document.querySelector('.progress-ring-circle');
        const circumference = 2 * Math.PI * 54; // radius = 54
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        circle.style.strokeDashoffset = strokeDashoffset;
        circle.style.stroke = percentage === 100 ? '#10b981' : '#3b82f6';

        document.querySelector('.progress-number').textContent = completed;
        document.querySelector('.progress-label').textContent = total === 1 ? 'task' : 'tasks';
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
    }

    // ==========================================================================
    // Analytics Rendering
    // ==========================================================================

    renderAnalytics() {
        // Placeholder for analytics - will be implemented in Phase 2
        console.log('Analytics view rendered');
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
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            
            if (task.completed) {
                this.showToast(`✅ "${task.title}" completed!`, 'success');
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
    }

    saveTask() {
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
                this.showToast('Task updated!', 'success');
            }
        } else {
            // Create new task
            this.addTask(taskData);
            this.showToast('Task created!', 'success');
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
