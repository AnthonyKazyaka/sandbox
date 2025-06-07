# Claude AI Assistant Instructions for Sandbox Projects

## ⚡ Quick Reference

**Current Project**: to-do-tracker (Phase 2 - Enhanced User Experience)  
**Status**: Phase 1 MVP Complete, implementing visual polish and advanced features  
**Immediate Priority**: UI animations, micro-interactions, performance optimization  
**Documentation Status**: Review DEV_LOG.md for latest progress and next steps

### Context Retrieval Protocol
1. **ALWAYS CHECK FIRST**: `to-do-tracker/DEV_LOG.md` → "Next Steps" section
2. **UNDERSTAND PHASE**: `PROJECT_ROADMAP.md` → Phase 2 requirements and goals
3. **VERIFY CURRENT STATE**: Test existing functionality before implementing changes
4. **CHECK ARCHITECTURE**: Review `app.js` class structure and state management patterns

### Key Decision Points
- **Framework**: Vanilla JavaScript (no external dependencies)
- **Architecture**: Class-based state management with localStorage persistence  
- **Design**: Visual appeal inspired by Tody app with unlimited customization
- **Focus**: Family collaboration with privacy-first approach

### Phase-Aware Development Context
**Current Phase**: Phase 2 - Enhanced User Experience  
**Phase Focus**: Visual polish, animations, micro-interactions, advanced features  
**Technical Priorities**: CSS animations, touch gestures, performance optimization, accessibility

#### Phase 2 Implementation Standards
- **Animation Guidelines**: 200-300ms CSS transitions for micro-interactions
- **Touch Interface**: Swipe gestures for mobile task management
- **Performance Standards**: <100ms UI response times for all interactions
- **Visual Design**: 8px grid system, refined typography, consistent spacing
- **Advanced Functionality**: Drag-and-drop, keyboard shortcuts, batch operations

---

## Context & Purpose
This sandbox workspace contains experimental and learning projects requiring AI assistance for development, documentation, and problem-solving. Claude should provide comprehensive support while maintaining project-specific context and quality standards.

## Project Portfolio Overview

### 🎯 Active Development: `to-do-tracker/`
**Family To-Do Tracker Application**
- **Status**: Phase 1 MVP Complete, Phase 2 in progress
- **Architecture**: Progressive Web App (PWA) with local-first approach
- **Tech Stack**: Vanilla HTML/CSS/JavaScript (no frameworks)
- **Goal**: Visual, customizable family task management with real-time collaboration

**Critical Context Files**:
- `PROJECT_ROADMAP.md` - 16-week phased development plan
- `DEV_LOG.md` - Current progress, testing results, and immediate next steps
- `README.md` - User documentation and feature overview

**Key Principles**:
- Privacy-first design (local storage, no external tracking)
- Visual appeal inspired by Tody app but with unlimited customization
- Family collaboration focus
- Progressive enhancement and accessibility

### 🧪 Experimental Projects
- **`game-of-life-ancestry/`** - Conway's Game of Life with lineage tracking
- **`auto-shooter/`** - Automated shooting game for learning

## Claude-Specific Guidelines

### 🧠 Approach to Assistance

#### 1. Context-Driven Development
- **Always review project documentation first** before making suggestions
- For to-do-tracker: Check DEV_LOG.md for current status and priorities
- Understand the project phase and align recommendations accordingly
- Reference existing architectural decisions and patterns

#### 2. Comprehensive Problem-Solving
- Provide multiple solution approaches with trade-offs
- Explain technical decisions and their implications
- Consider long-term maintainability and scalability
- Address potential edge cases and error scenarios

#### 3. Educational Value
- Explain complex concepts and implementation details
- Provide learning resources and best practice references
- Suggest improvements beyond immediate requirements
- Share industry standards and emerging patterns

### 🔧 Technical Expertise Areas

#### Frontend Development Excellence
```javascript
// Example: State management pattern in to-do-tracker
class FamilyTracker {
    constructor() {
        this.tasks = [];
        this.categories = [];
        // Reactive state management
        this.renderApp = this.renderApp.bind(this);
    }
    
    // Always save after state changes
    async saveData() {
        // Implementation with error handling
    }
}
```

#### Progressive Web App Mastery
- Service worker implementation and caching strategies
- Offline-first architecture patterns
- Web app manifest optimization
- Performance optimization techniques

#### Accessibility & Inclusive Design
- WCAG compliance strategies
- Keyboard navigation implementation
- Screen reader compatibility
- Color contrast and visual accessibility

#### Modern CSS Architecture
```css
/* Example: Theming system used in to-do-tracker */
:root {
    --primary-500: #3b82f6;
    --surface: #f8fafc;
    /* Semantic color tokens */
}

[data-theme="dark"] {
    --surface: #1e293b;
    /* Dark theme overrides */
}
```

### 📋 Development Workflow Support

#### Decision Tree for Feature Requests
```
New Feature Request:
├── In current phase? → Check PROJECT_ROADMAP.md Phase 2 requirements
├── Conflicts with existing? → Review app.js architecture and patterns  
├── Requires dependencies? → Evaluate against vanilla JavaScript constraint
├── UI/UX implications? → Consider mobile-first responsive design
└── Testing needed? → Reference comprehensive testing checklist
```

#### Starting New Work Sessions
1. **Review Current Status**: Read DEV_LOG.md for to-do-tracker projects
2. **Understand Context**: Check roadmap phase and current priorities
3. **Assess Technical Debt**: Review known issues and limitations
4. **Plan Approach**: Suggest optimal implementation strategy

#### Decision Tree for Feature Requests

**When User Requests New Feature:**
```
Is feature in current roadmap phase?
├─ YES → Check DEV_LOG.md priorities → Provide implementation guidance
└─ NO → Assess feature value → Suggest phase alignment or roadmap adjustment

Does feature align with vanilla JS constraint?
├─ YES → Proceed with architecture-consistent implementation
└─ NO → Suggest alternative approaches → Explain trade-offs

Will feature impact existing functionality?
├─ MINIMAL → Proceed with careful integration testing
└─ SIGNIFICANT → Require explicit confirmation → Plan migration strategy
```

**When Debugging Complex Issues:**
```
Is error reproducible?
├─ YES → Create minimal test case → Identify root cause → Provide fix
└─ NO → Add comprehensive logging → Monitor patterns → Suggest debugging tools

Is issue architectural?
├─ YES → Review design patterns → Suggest refactoring approach
└─ NO → Focus on specific implementation → Provide targeted solution
```

#### During Development
- Provide real-time code review and optimization suggestions
- Suggest testing strategies for new features
- Help with debugging complex issues
- Recommend performance improvements

#### Completing Work
- Help update documentation (DEV_LOG.md, README.md)
- Suggest next logical development steps
- Identify potential technical debt
- Recommend testing and quality assurance steps

### 🎨 Design & UX Guidance

#### Visual Design Principles
- **Modern aesthetics** with clean, minimalist approach
- **Visual hierarchy** using typography, spacing, and color
- **Responsive design** with mobile-first methodology
- **Accessibility** as a core design principle

#### User Experience Optimization
- **Progressive disclosure** of complex features
- **Immediate feedback** for user actions
- **Error prevention** and graceful error handling
- **Performance perception** through loading states and animations

### 🧪 Quality Assurance Support

#### Testing Strategy Development
```javascript
// Example: Testing checklist for new features
const testFeature = {
    functional: ['CRUD operations', 'data persistence', 'UI interactions'],
    accessibility: ['keyboard navigation', 'screen readers', 'color contrast'],
    performance: ['load times', 'memory usage', 'animation smoothness'],
    crossBrowser: ['Chrome/Edge', 'Firefox', 'Safari', 'Mobile browsers']
};
```

#### Code Review Focus
- **Security**: Input validation, XSS prevention, secure data handling
- **Performance**: Efficient algorithms, minimal DOM manipulation
- **Maintainability**: Clear architecture, good separation of concerns
- **Scalability**: Future-proof design patterns

### 📚 Learning & Development Support

#### Skill Development Recommendations
- Suggest learning resources for new technologies
- Provide explanations of complex programming concepts
- Share industry best practices and emerging trends
- Help with architectural decision-making

#### Code Examples & Patterns
- Provide working code examples with explanations
- Suggest refactoring opportunities
- Demonstrate modern JavaScript patterns
- Show CSS and HTML best practices

## 🔄 File Synchronization Protocol

### Instruction File Synchronization
This file should remain synchronized with:
- `.github/copilot-instructions.md` - GitHub Copilot specific guidance
- `AGENTS.md` - General AI agent instructions

#### Synchronization Responsibilities
1. **Monitor changes** to any instruction file
2. **Update relevant sections** across all files
3. **Maintain consistency** in project context and guidelines
4. **Version control** instruction file changes

#### Update Process
```markdown
When updating this file:
1. Review changes for applicability to other instruction files
2. Update .github/copilot-instructions.md with relevant technical details
3. Update AGENTS.md with general AI agent guidance
4. Commit all files together with descriptive message
```

### Documentation Maintenance
- **Weekly reviews** of instruction file accuracy
- **Project milestone updates** to reflect new phases
- **Regular cleanup** of outdated information
- **Integration** of lessons learned from development

## 🚀 Advanced Assistance Capabilities

### Complex Problem Solving
- **Architectural planning** for new features and systems
- **Performance optimization** strategies and implementation
- **Cross-platform compatibility** solutions
- **Security audit** and vulnerability assessment

### Research & Analysis
- **Technology evaluation** for new project requirements
- **Competitive analysis** of similar applications
- **Best practice research** for specific implementation challenges
- **Future-proofing** strategies for evolving requirements

### Documentation & Communication
- **Technical writing** for complex features and systems
- **User documentation** creation and optimization
- **Code documentation** and API reference generation
- **Project planning** and milestone definition

## 💡 Project-Specific Deep Dive: to-do-tracker

### Current Architecture Understanding
```javascript
// Core application structure
class FamilyTracker {
    // State management
    constructor() { /* initialization */ }
    
    // Data layer
    async loadData() { /* localStorage integration */ }
    async saveData() { /* persistence with error handling */ }
    
    // View management
    switchView(viewName) { /* SPA navigation */ }
    renderCurrentView() { /* reactive rendering */ }
    
    // Feature modules
    // Task management, theme system, family support
}
```

### Development Priorities (Current Phase)
1. **Enhanced Visual Polish** - Animations, micro-interactions
2. **Advanced Task Features** - Recurring tasks, dependencies
3. **Analytics Dashboard** - Chart integration, insights
4. **Gamification System** - Achievements, streaks

### Technical Challenges & Solutions
- **State synchronization** across family members (Phase 3)
- **Offline conflict resolution** for collaborative editing
- **Performance optimization** for large task datasets
- **Cross-browser PWA compatibility**

## 🔍 Debugging & Troubleshooting Support

### Common Issue Patterns
```javascript
// Data persistence debugging
console.log('Current app state:', {
    tasks: app.tasks.length,
    categories: app.categories.length,
    settings: app.settings
});

// Theme system debugging
console.log('Current theme:', {
    theme: document.documentElement.getAttribute('data-theme'),
    scheme: document.documentElement.getAttribute('data-scheme')
});
```

### Performance Monitoring
- Memory usage patterns
- DOM manipulation efficiency
- Event listener optimization
- Bundle size analysis

### Browser Compatibility Issues
- Progressive enhancement fallbacks
- Polyfill requirements
- CSS feature detection
- JavaScript API availability

---

## 📞 Collaboration Guidelines

### When to Provide Detailed Explanations
- Complex architectural decisions
- Performance optimization strategies
- Security implementation details
- Accessibility requirement solutions

### When to Suggest Alternatives
- Multiple valid implementation approaches exist
- Trade-offs between different solutions
- Future scalability considerations
- Technology stack decisions

### Communication Style
- **Be comprehensive** but not overwhelming
- **Explain reasoning** behind recommendations
- **Provide examples** with working code
- **Consider skill level** and adjust complexity accordingly

---

## 📝 Maintenance & Version Control

### Change History
- **June 7, 2025**: Added Quick Reference section, enhanced decision trees, integrated context retrieval protocol, added Phase 2 development context, implemented performance standards
- **Pending**: Weekly updates based on development progress

### File Dependencies
This instruction file is part of a synchronized set:
- **Primary**: `CLAUDE.md` (this file) - Claude AI comprehensive instructions
- **Companion**: `.github/copilot-instructions.md` - GitHub Copilot specific guidance
- **Universal**: `AGENTS.md` - General AI agent guidelines

### Synchronization Checklist
When updating this file:
- [ ] Review changes for relevance to other instruction files
- [ ] Update `.github/copilot-instructions.md` with applicable technical patterns
- [ ] Update `AGENTS.md` with universal AI agent guidance
- [ ] Maintain comprehensive context and detailed explanations
- [ ] Commit all instruction files together with descriptive message

---

*Last Updated: June 7, 2025*  
*Version: 1.2.0*  
*Sync Status: ✅ Synchronized with copilot-instructions.md and AGENTS.md*  
*Next Review: After major project milestones or weekly during active development*
