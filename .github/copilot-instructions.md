# GitHub Copilot Instructions for Sandbox Projects

## ⚡ Quick Reference

**Current Project**: to-do-tracker (Phase 2 - Enhanced User Experience)  
**Priority**: UI polish, advanced features, performance optimization  
**Key Context**: Check `DEV_LOG.md` → Next Steps before starting  
**Current Focus**: Visual animations, micro-interactions, advanced UI

### Essential Actions
1. **Start Here**: Read `to-do-tracker/DEV_LOG.md` "Next Steps" section
2. **Understand Phase**: Reference `PROJECT_ROADMAP.md` for Phase 2 requirements  
3. **Test First**: Verify current functionality before making changes
4. **Document Updates**: Update DEV_LOG.md with progress every ~12 messages

### Quick Commands
```javascript
// Debug current state
console.log(JSON.parse(localStorage.getItem('familyTrackerData')));

// Reset for testing
localStorage.removeItem('familyTrackerData'); location.reload();

// Test theme switching
document.documentElement.setAttribute('data-theme', 'green');
```

### Phase-Aware Development Context
**Current Phase**: Phase 2 - Enhanced User Experience  
**Focus Areas**: UI polish, animations, micro-interactions, advanced features  
**Technical Priorities**: CSS animations, touch gestures, performance optimization, accessibility refinements

#### Phase 2 Specific Guidelines
- **Animation Standards**: Use CSS transitions (200-300ms) for micro-interactions
- **Touch Support**: Implement swipe gestures for mobile task management
- **Performance Targets**: <100ms response time for all UI interactions
- **Visual Polish**: Consistent spacing (8px grid system), refined typography
- **Advanced Features**: Drag-and-drop, keyboard shortcuts, batch operations

---

## Overview
This sandbox workspace contains multiple experimental and learning projects. Each project has its own specific requirements and contexts that AI assistants should understand when providing help.

## Project Structure & Context

### 📁 Current Projects

#### `to-do-tracker/` - Family To-Do Tracker Application
**Status**: Active Development (Phase 1 Complete)  
**Type**: Progressive Web App (PWA)  
**Tech Stack**: Vanilla HTML/CSS/JavaScript  
**Purpose**: Visual, customizable family task management with real-time collaboration

**Key Files to Reference**:
- `PROJECT_ROADMAP.md` - Comprehensive 16-week development plan
- `DEV_LOG.md` - Current progress, testing results, and next steps
- `README.md` - User documentation and feature overview
- `app.js` - Main application logic and state management
- `styles.css` - Theming system with CSS custom properties
- `index.html` - PWA structure with semantic HTML

**Development Guidelines**:
- Follow the phased roadmap in PROJECT_ROADMAP.md
- Update DEV_LOG.md every ~12 messages with progress
- Maintain local-first, privacy-focused architecture
- Use vanilla JavaScript (no frameworks)
- Implement responsive design with mobile-first approach
- Follow accessibility best practices

#### `game-of-life-ancestry/` - Conway's Game of Life with Lineage
**Status**: Experimental  
**Type**: Interactive Simulation  
**Tech Stack**: HTML5 Canvas, JavaScript  
**Purpose**: Educational simulation exploring cellular automata

#### `auto-shooter/` - Automated Shooting Game
**Status**: Experimental  
**Type**: Browser Game  
**Tech Stack**: HTML5 Canvas, JavaScript  
**Purpose**: Game development learning project

## AI Assistant Guidelines

### 🎯 General Principles

1. **Context-Aware Development**
   - Always check the relevant project's README and documentation first
   - For to-do-tracker: Reference DEV_LOG.md for current status
   - Understand the project's phase and current priorities

2. **Code Quality Standards**
   - Write semantic, accessible HTML
   - Use modern CSS with custom properties for theming
   - Write clean, well-commented JavaScript
   - Follow existing code patterns and architecture
   - Maintain consistent naming conventions

3. **Documentation First**
   - Update relevant documentation when making changes
   - Keep DEV_LOG.md current for active projects
   - Explain technical decisions and trade-offs
   - Document any new features or changes

### 🔧 Technical Best Practices

#### For JavaScript Projects
- Use ES6+ features appropriately
- Implement proper error handling
- Follow functional programming principles when beneficial
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

#### For CSS
- Use CSS custom properties for theming
- Implement responsive design with mobile-first approach
- Use modern layout techniques (Grid, Flexbox)
- Follow BEM or similar naming convention
- Optimize for performance and accessibility

#### For HTML
- Use semantic HTML5 elements
- Implement proper ARIA attributes
- Ensure keyboard navigation support
- Include appropriate meta tags
- Structure for progressive enhancement

### 📱 Progressive Web App Guidelines (to-do-tracker)

1. **Offline-First Approach**
   - Implement service worker caching
   - Use local storage for data persistence
   - Provide meaningful offline experiences
   - Handle network connectivity changes

2. **Performance Optimization**
   - Minimize bundle sizes
   - Optimize images and assets
   - Use lazy loading where appropriate
   - Implement proper caching strategies

3. **User Experience**
   - Provide immediate feedback for user actions
   - Implement smooth animations and transitions
   - Use loading states for async operations
   - Follow platform-specific design patterns

### 🔄 Development Workflow

#### Context Retrieval Protocol
**ALWAYS follow this sequence before providing assistance:**

1. **Check Current Status**: Read `to-do-tracker/DEV_LOG.md` → "Next Steps" section
2. **Understand Phase Context**: Review `PROJECT_ROADMAP.md` → Current phase requirements  
3. **Verify Existing State**: Test current functionality before making changes
4. **Review Architecture**: Check `app.js` class structure and state patterns
5. **Validate Constraints**: Ensure adherence to vanilla JavaScript approach

#### VS Code Tool Integration Patterns
**Optimize context gathering with these tool usage patterns:**

- **`semantic_search`**: Use for finding related code patterns and context
- **`list_code_usages`**: Check impact of changes across the codebase  
- **`read_file`**: Always read existing files before making edits
- **`get_errors`**: Validate changes and check for compilation issues
- **`run_in_terminal`**: Test functionality with local development server

**Tool Sequence for New Features:**
1. `semantic_search` → Find existing patterns and related code
2. `read_file` → Understand current implementation
3. `list_code_usages` → Check dependencies and usage patterns
4. `insert_edit_into_file` → Implement changes
5. `get_errors` → Validate implementation
6. `run_in_terminal` → Test functionality

#### Starting Work on to-do-tracker
1. Read DEV_LOG.md "Next Steps" section
2. Check PROJECT_ROADMAP.md for current phase requirements
3. Review any existing issues or technical debt
4. Test current functionality before making changes

#### During Development
- Make incremental, testable changes
- Test across different screen sizes and themes
- Verify accessibility with keyboard navigation
- Check data persistence and state management

#### Completing Work
- Update DEV_LOG.md with completed items
- Document any new issues discovered
- Update next steps and priorities
- Commit with clear, descriptive messages

#### GitHub Copilot Decision Tree

**When User Requests New Feature:**
```
Is feature in current phase? 
├─ YES → Check DEV_LOG.md next steps → Implement
└─ NO → Suggest phase alignment or defer to roadmap

Is change breaking existing functionality?
├─ YES → Require explicit confirmation + backup strategy
└─ NO → Proceed with implementation

Does feature require new dependencies?
├─ YES → Justify need + check vanilla JS constraints
└─ NO → Implement using existing patterns
```

**When Debugging Issues:**
```
Is error in console? 
├─ YES → Check browser dev tools → Fix syntax/runtime
└─ NO → Check localStorage → Check UI state → Check event listeners

Is issue reproducible?
├─ YES → Create minimal test case → Fix root cause
└─ NO → Add logging → Monitor for patterns
```

**When Optimizing Performance:**
```
Is issue UI responsiveness?
├─ YES → Check animations → Reduce DOM manipulation → Use CSS transforms
└─ NO → Check data operations → Optimize algorithms → Add caching
```

### 🧪 Testing Requirements

#### Functional Testing Checklist
- [ ] All CRUD operations work correctly
- [ ] Data persists across browser sessions
- [ ] Export/import functionality works
- [ ] All UI interactions provide feedback
- [ ] Form validation prevents invalid data

#### Cross-Browser Testing
- [ ] Modern Chrome/Edge (primary target)
- [ ] Firefox compatibility
- [ ] Safari compatibility (if possible)
- [ ] Mobile browser testing

#### Accessibility Testing
- [ ] Keyboard navigation works throughout app
- [ ] Screen reader compatibility (semantic HTML)
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators are visible

#### Performance Testing
- [ ] Load times under 2 seconds
- [ ] Smooth 60fps animations
- [ ] Memory usage stays reasonable
- [ ] Service worker caches appropriately

## 📋 Common Tasks & Patterns

### VS Code Tool Integration
**Optimize context gathering with these tool usage patterns:**

- **`semantic_search`**: Use for finding related code patterns and context
- **`list_code_usages`**: Check impact of changes across the codebase  
- **`read_file`**: Always read existing files before making edits
- **`get_errors`**: Validate changes and check for compilation issues
- **`run_in_terminal`**: Test functionality with local development server

**Tool Sequence for New Features:**
1. `semantic_search` → Find existing patterns and related code
2. `read_file` → Understand current implementation
3. `list_code_usages` → Check dependencies and usage patterns
4. `insert_edit_into_file` → Implement changes
5. `get_errors` → Validate implementation
6. `run_in_terminal` → Test functionality

### Performance Monitoring & Quality Assurance

#### Code Generation Quality Metrics
- **Context Accuracy**: >95% relevant code suggestions based on project patterns
- **Error Reduction**: <5% syntax/runtime errors in generated code
- **Pattern Consistency**: Follow existing architecture 100% of the time
- **Documentation Sync**: Always update relevant docs with code changes

#### Performance Targets
- **Response Time**: <2 seconds for code suggestions
- **Context Retrieval**: <10 seconds for comprehensive project analysis
- **Error Detection**: Real-time validation using `get_errors` tool
- **Testing Efficiency**: <30 seconds to verify changes work correctly

### Adding New Features to to-do-tracker
1. **Planning**: Check if feature aligns with current phase in roadmap
2. **Design**: Consider mobile-first responsive design
3. **Implementation**: Follow existing code patterns
4. **Testing**: Use the testing checklist above
5. **Documentation**: Update relevant files

### Code Review Focus Areas
- **Security**: No XSS vulnerabilities, proper input sanitization
- **Performance**: Efficient algorithms, minimal DOM manipulation
- **Accessibility**: Proper ARIA labels, keyboard support
- **Maintainability**: Clear code structure, good separation of concerns

### Debugging Strategies
1. Use browser dev tools effectively
2. Check console for errors and warnings
3. Test with different data sets
4. Verify localStorage operations
5. Test offline functionality

## 🔄 File Synchronization Instructions

### Syncing AI Assistant Instructions

This file (`copilot-instructions.md`) should be kept in sync with equivalent instruction files:

#### Root Directory Files
- **`CLAUDE.md`** - Instructions specific to Claude AI assistant
- **`AGENTS.md`** - General AI agent instructions and context

#### Synchronization Process
1. **When updating this file**:
   - Copy relevant sections to `../CLAUDE.md` and `../AGENTS.md`
   - Ensure project-specific context is maintained
   - Update timestamp in all files

2. **When updating root instruction files**:
   - Review changes for relevance to GitHub Copilot
   - Update this file with applicable changes
   - Maintain consistency across all instruction files

3. **Regular Maintenance**:
   - Review all instruction files monthly
   - Update based on project evolution
   - Remove outdated information
   - Add new patterns and best practices

#### File-Specific Content Guidelines

**copilot-instructions.md** (this file):
- Focus on GitHub Copilot integration
- Emphasize code completion and generation
- Include specific technical patterns
- Highlight IDE-specific workflows

**CLAUDE.md**:
- Comprehensive conversation context
- Detailed project background
- Complex problem-solving approaches
- Long-form documentation and planning

**AGENTS.md**:
- General AI agent capabilities
- Cross-platform compatibility
- Universal best practices
- Tool-agnostic instructions

## 💡 Project-Specific Tips

### to-do-tracker Development
- **State Management**: App uses class-based state management in `app.js`
- **Theming**: CSS custom properties in `:root` for easy theme switching
- **Data Flow**: localStorage → JavaScript objects → DOM rendering
- **Architecture**: Modular components ready for framework migration

### Common Patterns
```javascript
// Task creation pattern
const task = {
    id: this.generateId(),
    title: taskData.title,
    // ... other properties
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

// Theme switching pattern
document.documentElement.setAttribute('data-theme', theme);
document.documentElement.setAttribute('data-scheme', scheme);

// Toast notification pattern
this.showToast('Task created!', 'success');
```

## 🚀 Quick Start Commands

### Setting up Development Environment
```bash
# Navigate to project
cd to-do-tracker

# Start local server (Python)
python -m http.server 8000

# Or with Node.js
npx serve .

# Or with PHP
php -S localhost:8000
```

### Common Development Tasks
```javascript
// Debug localStorage
console.log(JSON.parse(localStorage.getItem('familyTrackerData')));

// Reset application data
localStorage.removeItem('familyTrackerData');
location.reload();

// Test PWA installation
// Use Chrome DevTools > Application > Manifest
```

---

## 📞 Support & Resources

### Documentation Hierarchy
1. **DEV_LOG.md** - Current status and next steps
2. **PROJECT_ROADMAP.md** - Long-term planning and architecture
3. **README.md** - User-facing documentation
4. This file - Development guidelines

### When to Ask for Help
- Unclear project requirements or priorities
- Complex architectural decisions
- Cross-browser compatibility issues
- Performance optimization needs
- Accessibility implementation questions

### Best Practices for AI Collaboration
- Provide context about current project phase
- Reference specific files and line numbers
- Ask for explanations of complex implementations
- Request testing strategies for new features
- Seek code review feedback before major changes

---

## 📝 Maintenance & Version Control

### Change History
- **June 7, 2025**: Added Quick Reference section, enhanced Context Retrieval Protocol, integrated VS Code tool patterns, added Phase 2 development context, implemented decision trees, added performance monitoring guidelines
- **Pending**: Weekly updates based on development progress

### File Dependencies
This instruction file is part of a synchronized set:
- **Primary**: `.github/copilot-instructions.md` (this file)
- **Companion**: `../CLAUDE.md` - Claude AI comprehensive instructions
- **Universal**: `../AGENTS.md` - General AI agent guidelines

### Synchronization Checklist
When updating this file:
- [ ] Review changes for relevance to other instruction files
- [ ] Update `../CLAUDE.md` with applicable comprehensive context
- [ ] Update `../AGENTS.md` with universal AI agent guidance
- [ ] Test instruction effectiveness with real development scenarios
- [ ] Commit all instruction files together with descriptive message

---

*Last Updated: June 7, 2025*  
*Version: 1.2.0*  
*Sync Status: ✅ Synchronized with CLAUDE.md and AGENTS.md*  
*Next Review: Weekly during active development or after major project milestones*
