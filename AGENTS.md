# AI Agent Instructions for Sandbox Projects

## ⚡ Quick Reference

**Active Project**: to-do-tracker (Phase 2 - Enhanced User Experience)  
**Current Focus**: UI animations, micro-interactions, performance optimization  
**Architecture**: Vanilla JavaScript PWA with class-based state management  
**Key Principle**: Local-first, privacy-focused family collaboration tool

### Context Retrieval Priority
1. **Current Status**: `to-do-tracker/DEV_LOG.md` → Check "Next Steps" section
2. **Phase Requirements**: `PROJECT_ROADMAP.md` → Understand Phase 2 goals  
3. **Technical Context**: `app.js` → Review class architecture and patterns
4. **User Perspective**: `README.md` → Understand feature functionality

### Core Constraints
- **No External Dependencies**: Vanilla JavaScript only
- **Data Storage**: localStorage (local-first approach)
- **Design Inspiration**: Tody app aesthetics with unlimited customization
- **Target Users**: Families needing visual task management

### Performance & Quality Guidelines
**Current Phase**: Phase 2 - Enhanced User Experience  
**Development Standards**: CSS animations (200-300ms), <100ms UI response times, 8px grid system  
**Technical Focus**: Micro-interactions, touch gestures, performance optimization, accessibility refinements

#### Universal Quality Metrics
- **Context Relevance**: >95% accurate suggestions based on project patterns
- **Code Quality**: <5% syntax/runtime errors in generated code
- **Architecture Consistency**: 100% adherence to existing patterns
- **Documentation Sync**: Always update relevant docs with changes

---

## Universal AI Assistant Guidelines

This document provides general instructions for any AI agent (GitHub Copilot, Claude, ChatGPT, or other AI assistants) working within this sandbox development environment.

## 🎯 Project Portfolio

### Active Development Projects

#### **to-do-tracker/** - Family To-Do Tracker Application
- **Status**: Phase 1 Complete, Phase 2 Active Development
- **Type**: Progressive Web App (PWA)
- **Technology**: Vanilla HTML/CSS/JavaScript
- **Purpose**: Visual family task management with customization and collaboration

**Essential Context Files**:
- `PROJECT_ROADMAP.md` - 16-week development plan and architecture
- `DEV_LOG.md` - Current progress, testing results, next steps
- `README.md` - User documentation and feature overview

#### Experimental Projects
- `game-of-life-ancestry/` - Educational cellular automata simulation
- `auto-shooter/` - Browser-based game development learning

## 🤖 Universal AI Assistant Principles

### 1. Context-First Approach
- **Always review project documentation** before providing assistance
- Check relevant README, roadmap, and log files for current status
- Understand project phase, priorities, and architectural decisions
- Respect existing code patterns and conventions

### 2. Quality-Driven Development
- Follow modern best practices for the target technology stack
- Prioritize accessibility, performance, and maintainability
- Implement proper error handling and edge case management
- Write clean, well-documented, and testable code

### 3. Educational Support
- Explain complex concepts and implementation decisions
- Provide multiple solution approaches with trade-offs
- Share relevant learning resources and best practices
- Help developers understand long-term implications

### 4. Documentation Maintenance
- Keep project documentation current with changes
- Update progress logs and roadmaps as needed
- Maintain consistency across instruction files
- Document technical decisions and architectural choices

## 🛠️ Technical Standards

### Code Quality Requirements

#### JavaScript (ES6+)
```javascript
// Example patterns from to-do-tracker
class FamilyTracker {
    constructor() {
        // Clear initialization
        this.state = this.initializeState();
        this.bindMethods();
    }
    
    // Always include error handling
    async saveData() {
        try {
            localStorage.setItem('familyTrackerData', JSON.stringify(this.state));
            this.showToast('Data saved successfully', 'success');
        } catch (error) {
            console.error('Failed to save data:', error);
            this.showToast('Failed to save data', 'error');
        }
    }
}
```

#### CSS Architecture
```css
/* Use CSS custom properties for theming */
:root {
    --primary-500: #3b82f6;
    --surface: #ffffff;
    --text: #1f2937;
}

/* Support dark theme */
[data-theme="dark"] {
    --surface: #1e293b;
    --text: #f1f5f9;
}

/* Mobile-first responsive design */
.container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}

@media (min-width: 768px) {
    .container {
        padding: 2rem;
    }
}
```

#### HTML Semantic Structure
```html
<!-- Progressive Web App structure -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Family task management application">
    <!-- PWA meta tags -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#3b82f6">
</head>
<body>
    <!-- Semantic HTML with ARIA support -->
    <header role="banner">
        <nav role="navigation" aria-label="Main navigation">
            <!-- Navigation items -->
        </nav>
    </header>
    <main role="main">
        <!-- Main content -->
    </main>
</body>
</html>
```

### Accessibility Standards
- Use semantic HTML elements appropriately
- Implement proper ARIA labels and roles
- Ensure keyboard navigation support
- Maintain WCAG AA color contrast ratios
- Test with screen readers when possible

### Performance Guidelines
- Optimize for Core Web Vitals (LCP, FID, CLS)
- Minimize DOM manipulation and reflows
- Use efficient event handling patterns
- Implement proper caching strategies
- Monitor memory usage and prevent leaks

## 📋 Development Workflow

### Starting Work Session
1. **Review Status**: Check DEV_LOG.md for current project status
2. **Understand Context**: Read relevant documentation and roadmaps
3. **Assess Priorities**: Identify current phase requirements and goals
4. **Plan Approach**: Suggest optimal implementation strategy

### During Development
- Make incremental, testable changes
- Test across different devices and browsers
- Verify accessibility with keyboard navigation
- Check data persistence and state management
- Provide immediate feedback for user actions

### Completing Work
- Update relevant documentation files
- Test functionality thoroughly
- Document any new issues or technical debt
- Suggest next logical development steps
- Commit changes with clear, descriptive messages

## 🧪 Testing & Quality Assurance

### Testing Checklist Template
```markdown
#### Functional Testing
- [ ] All CRUD operations work correctly
- [ ] Data persists across browser sessions
- [ ] Export/import functionality works
- [ ] Form validation prevents invalid data
- [ ] Error handling works appropriately

#### Accessibility Testing
- [ ] Keyboard navigation works throughout app
- [ ] Screen reader compatibility (semantic HTML)
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators are visible
- [ ] Alternative text for images

#### Performance Testing
- [ ] Load times under 2 seconds
- [ ] Smooth 60fps animations
- [ ] Memory usage stays reasonable
- [ ] Large datasets handled efficiently

#### Cross-Browser Testing
- [ ] Chrome/Edge (primary target)
- [ ] Firefox compatibility
- [ ] Safari compatibility
- [ ] Mobile browser testing
```

### Debugging Strategies
```javascript
// Debug application state
console.log('App State Debug:', {
    tasks: app.tasks?.length || 0,
    categories: app.categories?.length || 0,
    currentView: app.currentView,
    settings: app.settings
});

// Debug localStorage
const savedData = localStorage.getItem('familyTrackerData');
console.log('Saved Data:', savedData ? JSON.parse(savedData) : 'No data');

// Debug theme system
console.log('Theme State:', {
    theme: document.documentElement.getAttribute('data-theme'),
    scheme: document.documentElement.getAttribute('data-scheme')
});
```

## 🔄 File Synchronization Protocol

### Instruction File Management
This file (`AGENTS.md`) should remain synchronized with:
- `.github/copilot-instructions.md` - GitHub Copilot specific guidance
- `CLAUDE.md` - Claude AI assistant comprehensive instructions

### Synchronization Process
```markdown
When updating any instruction file:
1. Identify changes that apply to other AI assistants
2. Update relevant sections in corresponding files
3. Maintain project context consistency
4. Update modification timestamps
5. Commit all instruction files together
```

### File-Specific Roles
- **AGENTS.md** (this file): Universal guidelines for any AI assistant
- **copilot-instructions.md**: GitHub Copilot specific IDE integration
- **CLAUDE.md**: Claude-specific comprehensive context and problem-solving

### Maintenance Schedule
- **Weekly reviews** during active development
- **Project milestone updates** for phase transitions
- **Monthly cleanup** of outdated information
- **Regular assessment** of instruction effectiveness

## 💡 Common Patterns & Solutions

### Progressive Web App Development
```javascript
// Service worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}

// Offline data management
class DataManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupOfflineHandling();
    }
    
    setupOfflineHandling() {
        window.addEventListener('online', () => this.syncData());
        window.addEventListener('offline', () => this.handleOffline());
    }
}
```

### State Management Patterns
```javascript
// Reactive state updates
class StateManager {
    constructor() {
        this.state = {};
        this.listeners = [];
    }
    
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
        this.persistState();
    }
    
    subscribe(listener) {
        this.listeners.push(listener);
    }
}
```

### Theme System Implementation
```css
/* CSS custom property theming */
:root {
    /* Light theme (default) */
    --primary-hue: 220;
    --primary-sat: 70%;
    --primary-light: 50%;
    
    --surface: hsl(var(--primary-hue), 10%, 98%);
    --on-surface: hsl(var(--primary-hue), 15%, 15%);
}

[data-theme="dark"] {
    --surface: hsl(var(--primary-hue), 15%, 8%);
    --on-surface: hsl(var(--primary-hue), 10%, 90%);
}

[data-scheme="blue"] { --primary-hue: 220; }
[data-scheme="green"] { --primary-hue: 150; }
[data-scheme="purple"] { --primary-hue: 270; }
```

## 🎯 Project-Specific Guidelines

### to-do-tracker Development
- **Architecture**: Class-based state management with localStorage persistence
- **Styling**: CSS custom properties with comprehensive theming system
- **Data Flow**: Reactive updates with immediate UI feedback
- **Navigation**: Single-page application with view switching

### Key Implementation Principles
- **Local-first**: All data stored locally, privacy-focused
- **Progressive enhancement**: Works without JavaScript for basic functionality
- **Mobile-first**: Responsive design starting from mobile screens
- **Accessibility**: WCAG AA compliance with keyboard navigation

## 🚀 Quick Reference Commands

### Development Server Setup
```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

### Common Debugging Commands
```javascript
// Reset application data
localStorage.clear();
location.reload();

// Export current data
const data = JSON.parse(localStorage.getItem('familyTrackerData'));
console.log(JSON.stringify(data, null, 2));

// Import test data
const testData = { /* test data structure */ };
localStorage.setItem('familyTrackerData', JSON.stringify(testData));
```

## 📊 Performance & Quality Guidelines

### AI Assistance Effectiveness Metrics
- **Context Retrieval Time**: < 30 seconds to gather relevant project context
- **Solution Accuracy**: > 80% success rate on first attempt  
- **Documentation Sync**: Update relevant docs with every code change
- **Testing Coverage**: Validate functionality before marking complete

### Quality Assurance Checklist
- [ ] Solution aligns with current project phase and priorities
- [ ] Code follows established patterns and architecture
- [ ] Changes are tested across target browsers and devices
- [ ] Documentation is updated to reflect new functionality
- [ ] No breaking changes to existing features

## 📞 Support & Escalation

### When to Request Additional Context
- Unclear project requirements or conflicting priorities
- Complex architectural decisions requiring trade-off analysis
- Cross-browser compatibility issues with no clear solution
- Performance optimization beyond standard best practices

### Best Practices for AI Collaboration
- Provide specific context about current development phase
- Reference exact file names and line numbers when discussing code
- Ask for explanations of complex implementation decisions
- Request testing strategies for new features
- Seek code review feedback before major architectural changes

### Communication Guidelines
- Be specific about project context and current objectives
- Explain technical constraints and requirements clearly
- Provide examples of desired behavior or implementation
- Ask for multiple solution approaches when appropriate
- Request documentation updates alongside code changes

---

## 📝 Maintenance Log

**Last Updated**: June 7, 2025  
**Version**: 1.2.0  
**Sync Status**: ✅ Synchronized with copilot-instructions.md and CLAUDE.md  
**Next Review**: Weekly during active development

### Change History
- **June 7, 2025**: Added Quick Reference section, performance guidelines, enhanced universal standards, integrated Phase 2 development context
- **Pending**: Weekly updates based on development progress

---

*This document serves as the universal reference for AI assistant collaboration within the sandbox environment. All AI agents should familiarize themselves with these guidelines and the specific project contexts before providing assistance.*
