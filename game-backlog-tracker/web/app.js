/**
 * Game Backlog Tracker - Main Application
 * Web interface for managing your video game backlog
 */

import { dataManager, GAME_STATUS } from '../core/data-manager.js';
import { priorityCalculator } from '../core/priority.js';
import { rawgApi } from '../core/rawg-api.js';
import { storage } from '../core/storage.js';

class GameBacklogApp {
  constructor() {
    this.currentView = 'backlog';
    this.currentGame = null;
    this.searchResults = [];
    this.sortOrder = 'desc';
    this.viewMode = 'grid';
    
    this.init();
  }

  async init() {
    try {
      // Initialize data manager
      dataManager.initialize();
      
      // Bind event listeners
      this.bindEvents();
      
      // Load initial view
      this.switchView('backlog');
      this.updateCounts();
      this.loadFilters();
      
      console.log('Game Backlog Tracker initialized');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showToast('Failed to initialize application', 'error');
    }
  }

  // ===================
  // Event Binding
  // ===================

  bindEvents() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        if (view) this.switchView(view);
      });
    });

    // Mobile menu
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Close sidebar when clicking overlay on mobile
    document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar');
      const menuBtn = document.getElementById('mobile-menu-btn');
      if (sidebar.classList.contains('open') && 
          !sidebar.contains(e.target) && 
          !menuBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });

    // Add game button
    document.getElementById('add-game-btn')?.addEventListener('click', () => {
      this.openAddGameModal();
    });

    document.getElementById('empty-add-btn')?.addEventListener('click', () => {
      this.openAddGameModal();
    });

    // Search input
    document.getElementById('search-input')?.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    // Filters
    document.getElementById('filter-platform')?.addEventListener('change', () => this.renderCurrentView());
    document.getElementById('filter-genre')?.addEventListener('change', () => this.renderCurrentView());
    document.getElementById('sort-by')?.addEventListener('change', () => this.renderCurrentView());
    
    document.getElementById('sort-order')?.addEventListener('click', (e) => {
      this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
      e.currentTarget.classList.toggle('asc', this.sortOrder === 'asc');
      this.renderCurrentView();
    });

    // View mode toggle
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.viewMode = e.currentTarget.dataset.mode;
        this.renderCurrentView();
      });
    });

    // Time available filter for priority
    document.getElementById('time-available')?.addEventListener('change', () => {
      this.renderPriorityView();
    });

    // Modal events
    this.bindModalEvents();

    // Settings events
    this.bindSettingsEvents();

    // Theme handling
    this.applyTheme();
  }

  bindModalEvents() {
    // Game modal
    const gameModal = document.getElementById('game-modal');
    const detailModal = document.getElementById('detail-modal');

    // Close buttons
    document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal('game-modal'));
    document.getElementById('modal-overlay')?.addEventListener('click', () => this.closeModal('game-modal'));
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.closeModal('game-modal'));
    
    document.getElementById('detail-close')?.addEventListener('click', () => this.closeModal('detail-modal'));
    document.getElementById('detail-overlay')?.addEventListener('click', () => this.closeModal('detail-modal'));

    // RAWG search
    document.getElementById('rawg-search-btn')?.addEventListener('click', () => this.searchRAWG());
    document.getElementById('rawg-search')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchRAWG();
    });

    // Save game
    document.getElementById('modal-save')?.addEventListener('click', () => this.saveGame());

    // Star rating
    document.querySelectorAll('#interest-rating .star').forEach(star => {
      star.addEventListener('click', (e) => {
        const value = parseInt(e.currentTarget.dataset.value);
        this.setStarRating('interest-rating', 'game-interest', value);
      });
    });

    // Detail modal events
    document.getElementById('detail-save')?.addEventListener('click', () => this.saveGameDetails());
    document.getElementById('detail-edit')?.addEventListener('click', () => this.editCurrentGame());
    document.getElementById('detail-delete')?.addEventListener('click', () => this.deleteCurrentGame());

    // Detail star rating
    document.getElementById('detail-user-rating')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('star')) {
        const value = parseInt(e.target.dataset.value);
        this.setDetailRating(value);
      }
    });
  }

  bindSettingsEvents() {
    // Theme
    document.getElementById('setting-theme')?.addEventListener('change', (e) => {
      this.setTheme(e.target.value);
    });

    // Priority weights
    ['interest', 'age', 'length', 'diversity', 'metacritic'].forEach(key => {
      const input = document.getElementById(`weight-${key}`);
      input?.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        e.target.nextElementSibling.textContent = value;
        this.updatePriorityWeight(key, value);
      });
    });

    // Data management
    document.getElementById('export-data')?.addEventListener('click', () => this.exportData());
    document.getElementById('import-data')?.addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    document.getElementById('import-file')?.addEventListener('change', (e) => this.importData(e));
    document.getElementById('clear-cache')?.addEventListener('click', () => this.clearCache());
    document.getElementById('reset-data')?.addEventListener('click', () => this.resetData());
  }

  // ===================
  // View Management
  // ===================

  switchView(viewName) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${viewName}`);
    });

    // Update title
    const titles = {
      backlog: 'Backlog',
      playing: 'Currently Playing',
      priority: 'What to Play Next',
      completed: 'Completed Games',
      wishlist: 'Wishlist',
      stats: 'Statistics',
      settings: 'Settings'
    };
    document.getElementById('view-title').textContent = titles[viewName] || viewName;

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');

    this.currentView = viewName;
    this.renderCurrentView();
  }

  renderCurrentView() {
    switch (this.currentView) {
      case 'backlog':
        this.renderGamesView('backlog', 'games-grid', 'empty-backlog');
        break;
      case 'playing':
        this.renderGamesView('playing', 'playing-grid', 'empty-playing');
        break;
      case 'completed':
        this.renderGamesView('completed', 'completed-grid', 'empty-completed');
        break;
      case 'wishlist':
        this.renderGamesView('wishlist', 'wishlist-grid', 'empty-wishlist');
        break;
      case 'priority':
        this.renderPriorityView();
        break;
      case 'stats':
        this.renderStatsView();
        break;
      case 'settings':
        this.renderSettingsView();
        break;
    }
  }

  renderGamesView(status, gridId, emptyId) {
    let games = dataManager.getGamesByStatus(status);
    
    // Apply filters
    const platformFilter = document.getElementById('filter-platform')?.value;
    const genreFilter = document.getElementById('filter-genre')?.value;
    
    if (platformFilter) {
      games = games.filter(g => g.platform === platformFilter);
    }
    if (genreFilter) {
      games = games.filter(g => {
        if (!g.genres) return false;
        return g.genres.some(genre => {
          const name = typeof genre === 'string' ? genre : genre.name;
          return name.toLowerCase() === genreFilter.toLowerCase();
        });
      });
    }

    // Apply sorting
    const sortBy = document.getElementById('sort-by')?.value || 'createdAt';
    games = this.sortGames(games, sortBy);

    // Render
    const grid = document.getElementById(gridId);
    const empty = document.getElementById(emptyId);
    
    if (!grid) return;

    if (games.length === 0) {
      grid.innerHTML = '';
      grid.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    if (empty) empty.style.display = 'none';
    grid.className = `games-grid ${this.viewMode === 'list' ? 'list-view' : ''}`;
    
    grid.innerHTML = games.map(game => this.renderGameCard(game)).join('');
    
    // Bind card events
    grid.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        const gameId = card.dataset.gameId;
        this.openGameDetail(gameId);
      });
    });

    // Bind action buttons
    grid.querySelectorAll('.game-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const gameId = btn.closest('.game-card').dataset.gameId;
        this.handleGameAction(gameId, action);
      });
    });
  }

  renderGameCard(game) {
    const metacriticClass = game.metacriticScore >= 75 ? '' : 
                           game.metacriticScore >= 50 ? 'yellow' : 'red';
    
    const stars = '★'.repeat(game.interestLevel || 0) + '☆'.repeat(5 - (game.interestLevel || 0));
    
    return `
      <div class="game-card" data-game-id="${game.id}">
        <div class="game-card-image">
          ${game.coverImage 
            ? `<img src="${game.coverImage}" alt="${game.title}" loading="lazy">`
            : `<div class="game-card-placeholder">🎮</div>`
          }
          <div class="game-card-badges">
            ${game.metacriticScore 
              ? `<span class="badge badge-metacritic ${metacriticClass}">${game.metacriticScore}</span>`
              : ''
            }
          </div>
        </div>
        <div class="game-card-content">
          <h3 class="game-card-title">${this.escapeHtml(game.title)}</h3>
          <div class="game-card-meta">
            <span class="game-card-platform">${game.platform}</span>
            ${game.estimatedHours ? `<span>~${game.estimatedHours}h</span>` : ''}
            <span class="game-card-interest">${stars}</span>
          </div>
          ${game.status === 'backlog' ? `
            <div class="game-card-actions">
              <button class="btn btn-primary game-action-btn" data-action="start">▶ Start</button>
            </div>
          ` : ''}
          ${game.status === 'playing' ? `
            <div class="game-card-actions">
              <button class="btn btn-primary game-action-btn" data-action="complete">✓ Complete</button>
              <button class="btn btn-secondary game-action-btn" data-action="stop">⏹ Stop</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderPriorityView() {
    const games = dataManager.getAllGames();
    const timeAvailable = document.getElementById('time-available')?.value;
    
    const options = {
      limit: 20,
      availableTime: timeAvailable ? parseInt(timeAvailable) : null
    };
    
    const prioritized = priorityCalculator.getPrioritizedList(games, options);
    const container = document.getElementById('priority-list');
    
    if (!container) return;
    
    if (prioritized.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⭐</div>
          <h3>No games to prioritize</h3>
          <p>Add some games to your backlog first!</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = prioritized.map((item, index) => {
      const game = item.game;
      const explanation = priorityCalculator.explainScore(game, item.priority);
      
      return `
        <div class="priority-item" data-game-id="${game.id}">
          <div class="priority-rank">#${index + 1}</div>
          ${game.coverImage 
            ? `<img class="priority-image" src="${game.coverImage}" alt="${game.title}">`
            : `<div class="priority-image" style="display:flex;align-items:center;justify-content:center">🎮</div>`
          }
          <div class="priority-info">
            <div class="priority-title">${this.escapeHtml(game.title)}</div>
            <div class="priority-meta">
              ${game.platform} • 
              ${game.estimatedHours ? `~${game.estimatedHours}h` : 'Unknown length'} •
              ${game.genres?.slice(0, 2).map(g => typeof g === 'string' ? g : g.name).join(', ') || 'No genres'}
            </div>
          </div>
          <div class="priority-score">
            <div class="priority-score-value">${item.priority.total}</div>
            <div class="priority-score-label">Score</div>
          </div>
        </div>
      `;
    }).join('');
    
    // Bind click events
    container.querySelectorAll('.priority-item').forEach(item => {
      item.addEventListener('click', () => {
        this.openGameDetail(item.dataset.gameId);
      });
    });
  }

  renderStatsView() {
    const stats = dataManager.getStats();
    
    // Update stat cards
    document.getElementById('stat-total').textContent = stats.totalGames;
    document.getElementById('stat-backlog').textContent = stats.byStatus.backlog || 0;
    document.getElementById('stat-completed').textContent = stats.byStatus.completed || 0;
    document.getElementById('stat-completion-rate').textContent = `${stats.completionRate}%`;
    document.getElementById('stat-hours').textContent = `${stats.totalEstimatedHours}h`;
    document.getElementById('stat-metacritic').textContent = stats.averageMetacritic || '-';
    
    // Render charts
    this.renderChart('platform-chart', stats.platformDistribution, stats.totalGames);
    this.renderChart('genre-chart', stats.genreDistribution, stats.totalGames);
    this.renderChart('status-chart', stats.byStatus, stats.totalGames);
  }

  renderChart(containerId, data, total) {
    const container = document.getElementById(containerId);
    if (!container || !data) return;
    
    const entries = Object.entries(data)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    
    const maxValue = Math.max(...entries.map(([_, v]) => v), 1);
    
    container.innerHTML = entries.map(([label, value]) => {
      const percentage = Math.round((value / maxValue) * 100);
      return `
        <div class="chart-bar-item">
          <span class="chart-bar-label">${label}</span>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width: ${percentage}%">
              <span class="chart-bar-value">${value}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderSettingsView() {
    const settings = dataManager.getSettings();
    const weights = priorityCalculator.getWeights();
    
    // Theme
    document.getElementById('setting-theme').value = settings.theme || 'dark';
    
    // Weights
    ['interest', 'age', 'length', 'diversity', 'metacritic'].forEach(key => {
      const input = document.getElementById(`weight-${key}`);
      if (input) {
        input.value = weights[key] || 0;
        input.nextElementSibling.textContent = weights[key] || 0;
      }
    });
    
    // Storage info
    const storageInfo = storage.getStorageInfo();
    const cacheStats = rawgApi.getCacheStats();
    
    document.getElementById('storage-size').textContent = `${storageInfo.sizeMB} MB`;
    document.getElementById('storage-games').textContent = storageInfo.gamesCount;
    document.getElementById('cache-entries').textContent = cacheStats.entries;
  }

  // ===================
  // Game Operations
  // ===================

  openAddGameModal() {
    this.currentGame = null;
    document.getElementById('modal-title').textContent = 'Add Game';
    document.getElementById('game-form').reset();
    document.getElementById('game-id').value = '';
    document.getElementById('game-rawg-id').value = '';
    document.getElementById('game-preview').style.display = 'none';
    document.getElementById('rawg-results').innerHTML = '';
    this.setStarRating('interest-rating', 'game-interest', 3);
    this.openModal('game-modal');
  }

  async searchRAWG() {
    const query = document.getElementById('rawg-search').value.trim();
    if (!query) return;
    
    const resultsContainer = document.getElementById('rawg-results');
    resultsContainer.innerHTML = '<p>Searching...</p>';
    
    try {
      const results = await rawgApi.searchGames(query, { pageSize: 8 });
      this.searchResults = results.results;
      
      if (results.results.length === 0) {
        resultsContainer.innerHTML = '<p>No games found</p>';
        return;
      }
      
      resultsContainer.innerHTML = results.results.map((game, index) => `
        <div class="search-result-item" data-index="${index}">
          ${game.coverImage 
            ? `<img src="${game.coverImage}" alt="${game.title}">`
            : '<div style="width:60px;height:34px;background:var(--bg-tertiary);border-radius:4px"></div>'
          }
          <div class="search-result-info">
            <div class="search-result-title">${this.escapeHtml(game.title)}</div>
            <div class="search-result-meta">
              ${game.releaseYear || 'Unknown'} • 
              ${game.platforms?.slice(0, 2).join(', ') || 'Unknown'} •
              ${game.metacriticScore ? `MC: ${game.metacriticScore}` : 'No MC'}
            </div>
          </div>
        </div>
      `).join('');
      
      // Bind selection
      resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const index = parseInt(item.dataset.index);
          this.selectRAWGGame(this.searchResults[index]);
        });
      });
    } catch (error) {
      console.error('RAWG search failed:', error);
      resultsContainer.innerHTML = '<p>Search failed. Try again.</p>';
    }
  }

  selectRAWGGame(game) {
    document.getElementById('game-title').value = game.title;
    document.getElementById('game-rawg-id').value = game.rawgId;
    document.getElementById('game-hours').value = game.estimatedHours || '';
    document.getElementById('game-year').value = game.releaseYear || '';
    document.getElementById('game-genres').value = game.genres?.join(', ') || '';
    
    // Set platform
    const platformSelect = document.getElementById('game-platform');
    const firstPlatform = game.platforms?.[0];
    if (firstPlatform) {
      const option = Array.from(platformSelect.options).find(opt => 
        opt.value.toLowerCase().includes(firstPlatform.toLowerCase()) ||
        firstPlatform.toLowerCase().includes(opt.value.toLowerCase())
      );
      if (option) platformSelect.value = option.value;
    }
    
    // Show preview
    if (game.coverImage || game.metacriticScore) {
      document.getElementById('game-preview').style.display = 'flex';
      if (game.coverImage) {
        document.getElementById('preview-image').src = game.coverImage;
      }
      document.getElementById('preview-metacritic').textContent = 
        game.metacriticScore ? `Metacritic: ${game.metacriticScore}` : '';
    }
    
    // Clear results
    document.getElementById('rawg-results').innerHTML = `
      <div class="search-result-item" style="background: var(--accent-primary); color: #000;">
        Selected: ${this.escapeHtml(game.title)}
      </div>
    `;
  }

  async saveGame() {
    const form = document.getElementById('game-form');
    const title = document.getElementById('game-title').value.trim();
    
    if (!title) {
      this.showToast('Please enter a game title', 'error');
      return;
    }
    
    const gameData = {
      title,
      platform: document.getElementById('game-platform').value,
      status: document.getElementById('game-status').value,
      estimatedHours: parseInt(document.getElementById('game-hours').value) || null,
      releaseYear: parseInt(document.getElementById('game-year').value) || null,
      interestLevel: parseInt(document.getElementById('game-interest').value) || 3,
      genres: document.getElementById('game-genres').value
        .split(',')
        .map(g => g.trim())
        .filter(g => g),
      notes: document.getElementById('game-notes').value,
      rawgId: parseInt(document.getElementById('game-rawg-id').value) || null
    };
    
    try {
      const gameId = document.getElementById('game-id').value;
      
      if (gameId) {
        // Update existing game
        dataManager.updateGame(gameId, gameData);
        this.showToast('Game updated!', 'success');
      } else if (gameData.rawgId) {
        // Create from RAWG
        await dataManager.createGameFromRawg(gameData.rawgId, {
          platform: gameData.platform,
          status: gameData.status,
          interestLevel: gameData.interestLevel,
          notes: gameData.notes
        });
        this.showToast('Game added from RAWG!', 'success');
      } else {
        // Create manually
        await dataManager.createGame(gameData, true);
        this.showToast('Game added!', 'success');
      }
      
      this.closeModal('game-modal');
      this.renderCurrentView();
      this.updateCounts();
      this.loadFilters();
    } catch (error) {
      console.error('Failed to save game:', error);
      this.showToast('Failed to save game', 'error');
    }
  }

  openGameDetail(gameId) {
    const game = dataManager.getGame(gameId);
    if (!game) return;
    
    this.currentGame = game;
    
    // Populate detail modal
    document.getElementById('detail-title').textContent = game.title;
    document.getElementById('detail-image').src = game.coverImage || '';
    document.getElementById('detail-platform').textContent = game.platform;
    document.getElementById('detail-year').textContent = game.releaseYear || '';
    document.getElementById('detail-hours').textContent = game.estimatedHours ? `~${game.estimatedHours}h` : '';
    document.getElementById('detail-status-select').value = game.status;
    document.getElementById('detail-metacritic').textContent = game.metacriticScore || '-';
    document.getElementById('detail-description').textContent = game.description || 'No description available.';
    document.getElementById('detail-notes').value = game.notes || '';
    
    // Genres
    const genresContainer = document.getElementById('detail-genres');
    genresContainer.innerHTML = (game.genres || []).map(g => {
      const name = typeof g === 'string' ? g : g.name;
      return `<span class="badge">${name}</span>`;
    }).join('');
    
    // User rating
    this.renderDetailStars(game.userRating || 0);
    
    this.openModal('detail-modal');
  }

  renderDetailStars(rating) {
    const container = document.getElementById('detail-user-rating');
    container.innerHTML = [1, 2, 3, 4, 5].map(i => `
      <button type="button" class="star ${i <= rating ? 'active' : ''}" data-value="${i}">★</button>
    `).join('');
  }

  setDetailRating(value) {
    if (this.currentGame) {
      this.currentGame.userRating = value;
      this.renderDetailStars(value);
    }
  }

  async saveGameDetails() {
    if (!this.currentGame) return;
    
    try {
      dataManager.updateGame(this.currentGame.id, {
        status: document.getElementById('detail-status-select').value,
        userRating: this.currentGame.userRating || 0,
        notes: document.getElementById('detail-notes').value
      });
      
      this.showToast('Changes saved!', 'success');
      this.closeModal('detail-modal');
      this.renderCurrentView();
      this.updateCounts();
    } catch (error) {
      console.error('Failed to save changes:', error);
      this.showToast('Failed to save changes', 'error');
    }
  }

  editCurrentGame() {
    if (!this.currentGame) return;
    
    this.closeModal('detail-modal');
    
    // Open add modal in edit mode
    document.getElementById('modal-title').textContent = 'Edit Game';
    document.getElementById('game-id').value = this.currentGame.id;
    document.getElementById('game-title').value = this.currentGame.title;
    document.getElementById('game-platform').value = this.currentGame.platform;
    document.getElementById('game-status').value = this.currentGame.status;
    document.getElementById('game-hours').value = this.currentGame.estimatedHours || '';
    document.getElementById('game-year').value = this.currentGame.releaseYear || '';
    document.getElementById('game-genres').value = (this.currentGame.genres || [])
      .map(g => typeof g === 'string' ? g : g.name)
      .join(', ');
    document.getElementById('game-notes').value = this.currentGame.notes || '';
    document.getElementById('game-rawg-id').value = this.currentGame.rawgId || '';
    
    this.setStarRating('interest-rating', 'game-interest', this.currentGame.interestLevel || 3);
    
    // Show preview if available
    if (this.currentGame.coverImage) {
      document.getElementById('game-preview').style.display = 'flex';
      document.getElementById('preview-image').src = this.currentGame.coverImage;
      document.getElementById('preview-metacritic').textContent = 
        this.currentGame.metacriticScore ? `Metacritic: ${this.currentGame.metacriticScore}` : '';
    }
    
    this.openModal('game-modal');
  }

  deleteCurrentGame() {
    if (!this.currentGame) return;
    
    if (confirm(`Are you sure you want to delete "${this.currentGame.title}"?`)) {
      try {
        dataManager.deleteGame(this.currentGame.id);
        this.showToast('Game deleted', 'success');
        this.closeModal('detail-modal');
        this.renderCurrentView();
        this.updateCounts();
        this.loadFilters();
      } catch (error) {
        console.error('Failed to delete game:', error);
        this.showToast('Failed to delete game', 'error');
      }
    }
  }

  handleGameAction(gameId, action) {
    try {
      switch (action) {
        case 'start':
          dataManager.startPlaying(gameId);
          this.showToast('Started playing!', 'success');
          break;
        case 'complete':
          dataManager.completeGame(gameId);
          this.showToast('Congratulations on completing!', 'success');
          break;
        case 'stop':
          dataManager.moveToBacklog(gameId);
          this.showToast('Moved back to backlog', 'info');
          break;
      }
      
      this.renderCurrentView();
      this.updateCounts();
    } catch (error) {
      console.error('Action failed:', error);
      this.showToast('Action failed', 'error');
    }
  }

  // ===================
  // Utilities
  // ===================

  sortGames(games, sortBy) {
    return [...games].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'title') {
        return this.sortOrder === 'desc'
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }
      
      aVal = aVal || 0;
      bVal = bVal || 0;
      
      return this.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }

  updateCounts() {
    const stats = dataManager.getStats();
    
    document.getElementById('backlog-count').textContent = stats.byStatus.backlog || 0;
    document.getElementById('playing-count').textContent = stats.byStatus.playing || 0;
    document.getElementById('completed-count').textContent = stats.byStatus.completed || 0;
    document.getElementById('wishlist-count').textContent = stats.byStatus.wishlist || 0;
  }

  loadFilters() {
    // Platforms
    const platforms = dataManager.getUniquePlatforms();
    const platformSelect = document.getElementById('filter-platform');
    if (platformSelect) {
      const current = platformSelect.value;
      platformSelect.innerHTML = '<option value="">All Platforms</option>' +
        platforms.map(p => `<option value="${p}">${p}</option>`).join('');
      platformSelect.value = current;
    }
    
    // Genres
    const genres = dataManager.getUniqueGenres();
    const genreSelect = document.getElementById('filter-genre');
    if (genreSelect) {
      const current = genreSelect.value;
      genreSelect.innerHTML = '<option value="">All Genres</option>' +
        genres.map(g => `<option value="${g}">${g}</option>`).join('');
      genreSelect.value = current;
    }
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.renderCurrentView();
      return;
    }
    
    const results = dataManager.searchGames(query);
    const grid = document.getElementById('games-grid');
    
    if (results.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <p>No games found matching "${this.escapeHtml(query)}"</p>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = results.map(game => this.renderGameCard(game)).join('');
    
    // Rebind events
    grid.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => this.openGameDetail(card.dataset.gameId));
    });
  }

  setStarRating(containerId, inputId, value) {
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    
    if (!container || !input) return;
    
    input.value = value;
    container.querySelectorAll('.star').forEach(star => {
      star.classList.toggle('active', parseInt(star.dataset.value) <= value);
    });
  }

  openModal(modalId) {
    document.getElementById(modalId)?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
    document.body.style.overflow = '';
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;
    
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => toast.remove(), 4000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ===================
  // Settings
  // ===================

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    dataManager.updateSettings({ theme });
  }

  applyTheme() {
    const settings = dataManager.getSettings();
    if (settings.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
      const themeSelect = document.getElementById('setting-theme');
      if (themeSelect) themeSelect.value = settings.theme;
    }
  }

  updatePriorityWeight(key, value) {
    priorityCalculator.updateWeights({ [key]: value });
  }

  exportData() {
    try {
      storage.exportToFile(`game-backlog-${new Date().toISOString().split('T')[0]}.json`);
      this.showToast('Data exported!', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      this.showToast('Export failed', 'error');
    }
  }

  async importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const result = await storage.importFromFile(file, { merge: false });
      
      if (result.success) {
        this.showToast(`Imported ${result.gamesCount} games!`, 'success');
        this.renderCurrentView();
        this.updateCounts();
        this.loadFilters();
      } else {
        this.showToast(`Import failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Import failed:', error);
      this.showToast('Import failed', 'error');
    }
    
    // Reset input
    event.target.value = '';
  }

  clearCache() {
    if (confirm('Clear API cache? This will not affect your game data.')) {
      rawgApi.clearCache();
      this.showToast('Cache cleared', 'success');
      this.renderSettingsView();
    }
  }

  resetData() {
    if (confirm('⚠️ This will delete ALL your games and settings! Are you sure?')) {
      if (confirm('This action cannot be undone. Type "RESET" in the next prompt to confirm.')) {
        storage.reset();
        this.showToast('All data reset', 'info');
        this.renderCurrentView();
        this.updateCounts();
        this.loadFilters();
      }
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new GameBacklogApp();
});

export { GameBacklogApp };
