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

/* Mobile-first responsive design with container constraints */
.container {
    width: 100%;
    max-width: 100%; /* CRITICAL: Prevent horizontal overflow */
    box-sizing: border-box; /* Include padding in width */
    padding: var(--spacing-xl); /* 32px on desktop */
    overflow: hidden; /* Clip overflow content */
}

@media (max-width: 768px) {
    .container {
        padding: var(--spacing-md); /* 16px on mobile - REQUIRED */
    }
}

/* Grid/Flex children must allow shrinking */
.grid-item,
.flex-item {
    min-width: 0; /* Override default min-width: auto */
    max-width: 100%;
    overflow: hidden;
}

/* Root elements prevent horizontal scroll */
html, body {
    overflow-x: hidden;
    max-width: 100vw;
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

### Critical Layout Testing (5 Required Viewports)
**Test EVERY CSS/layout change at these sizes:**
- [ ] 1920x1080 (Desktop)
- [ ] 1024x768 (Tablet landscape)
- [ ] 768x768 (Tablet portrait)
- [ ] 375x667 (Mobile - iPhone SE)
- [ ] 320x568 (Small mobile)

**Quick Overflow Check:**
```javascript
// Run in browser console after each viewport resize
console.log('Horizontal overflow:', document.body.scrollWidth > document.body.clientWidth);

// Find ALL overflowing elements
Array.from(document.querySelectorAll('*'))
    .filter(el => el.scrollWidth > window.innerWidth)
    .forEach(el => console.log(el.tagName, el.className, el.scrollWidth));
```

### Testing Checklist Template
```markdown
#### Layout Testing (PRIORITY - Test First)
- [ ] No horizontal scrollbar at all 5 viewports
- [ ] Vertical scrolling works properly
- [ ] Sidebar displays at 260px width (desktop)
- [ ] Calendar fits within viewport (all sizes)
- [ ] Mobile padding reduced to 16px
- [ ] No content extends beyond viewport edges

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
- [ ] No layout shifts (CLS = 0)

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

// Debug layout and overflow issues
function debugLayout() {
    const body = document.body;
    const app = document.querySelector('.app-container');
    
    return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        bodySize: { scroll: body.scrollWidth, client: body.clientWidth },
        hasOverflow: body.scrollWidth > body.clientWidth,
        appDisplay: app ? window.getComputedStyle(app).display : 'N/A',
        canScrollH: window.scrollX !== (window.scrollTo(100, 0), window.scrollX, window.scrollTo(0, 0))
    };
}
console.table(debugLayout());

// Find specific overflowing element
function findOverflowCause() {
    return Array.from(document.querySelectorAll('*'))
        .filter(el => el.scrollWidth > window.innerWidth)
        .map(el => ({
            tag: el.tagName,
            id: el.id,
            classes: el.className,
            scrollW: el.scrollWidth,
            clientW: el.clientWidth,
            diff: el.scrollWidth - el.clientWidth
        }))
        .sort((a, b) => b.diff - a.diff);
}
console.table(findOverflowCause());
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

### gps-admin Development
- **Architecture**: Multi-view application with Calendar API integration
- **Styling**: CSS Grid layout with responsive breakpoints at 768px
- **Key Views**: Dashboard, Calendar (Month/Week/Day/List), Templates, Analytics, Settings
- **Critical Layout Fix**: JavaScript must set `display: 'grid'` not `display: 'block'` to enable CSS Grid

**Common Layout Issues & Solutions:**
```javascript
// Issue: Sidebar displaying horizontally instead of vertical 260px
// Cause: JavaScript setting display:block overrides CSS display:grid
// Fix: In core.js, ensure: app.style.display = 'grid';

// Issue: Calendar overflow on mobile
// Cause: Missing width constraints + excessive padding
// Fix: Add width: 100%, max-width: 100%, reduce mobile padding to 16px
```

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

## 📚 Critical Lessons Learned

### Layout & Overflow Issues (Nov 2025 - gps-admin)
**Problem**: Sidebar displayed full width horizontally, calendar overflowed viewport on mobile

**Root Causes Identified:**
1. **JavaScript Override**: `app.style.display = 'block'` overrode CSS `display: grid`
2. **Missing Width Constraints**: Containers lacked `width: 100%; max-width: 100%`
3. **Excessive Mobile Padding**: 32px padding caused overflow at 375px viewport
4. **Grid Children Not Shrinking**: Missing `min-width: 0` on flex/grid items

**Solutions Applied:**
```javascript
// core.js - CRITICAL FIX
app.style.display = 'grid'; // NOT 'block'!
```

```css
/* styles.css & calendar.css - Container Constraints Pattern */
.container {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden; /* or overflow-x: hidden */
}

/* Mobile responsive padding - REQUIRED */
@media (max-width: 768px) {
    .container {
        padding: var(--spacing-md); /* 16px, NOT 32px */
    }
}

/* Grid/flex children - Allow shrinking */
.grid-item {
    min-width: 0; /* Critical for grid to work */
    overflow: hidden;
}

/* Root overflow prevention */
html, body {
    overflow-x: hidden;
    max-width: 100vw;
}
```

**Prevention Checklist:**
- [ ] Test layout at 5 viewports: 1920x1080, 1024x768, 768x768, 375x667, 320x568
- [ ] Check `document.body.scrollWidth > document.body.clientWidth` in console
- [ ] Verify JavaScript doesn't override critical CSS (display, width, etc.)
- [ ] Ensure mobile padding ≤ 16px for 375px viewport
- [ ] Add `min-width: 0` to all grid/flex children
- [ ] Use `box-sizing: border-box` on all containers with padding

**Reference Documentation:**
- `gps-admin/CSS_BEST_PRACTICES.md` - Comprehensive CSS patterns and guidelines
- `gps-admin/TESTING_GUIDE.md` - Manual and automated testing procedures
- `gps-admin/PLAYWRIGHTER_LOG.md` - Session logs and evidence files

---

## 📝 Maintenance Log

**Last Updated**: November 22, 2025  
**Version**: 1.3.0  
**Sync Status**: ✅ Synchronized with copilot-instructions.md and CLAUDE.md  
**Next Review**: Weekly during active development

### Change History
- **November 22, 2025**: Added gps-admin layout lessons, enhanced CSS architecture patterns, integrated overflow debugging strategies, added 5-viewport testing requirements
- **June 7, 2025**: Added Quick Reference section, performance guidelines, enhanced universal standards, integrated Phase 2 development context
- **Pending**: Weekly updates based on development progress

---

*This document serves as the universal reference for AI assistant collaboration within the sandbox environment. All AI agents should familiarize themselves with these guidelines and the specific project contexts before providing assistance.*
