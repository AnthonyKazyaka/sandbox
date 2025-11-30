# Game Backlog Tracker

A comprehensive web-based tool to help manage, prioritize, and track your video game backlog.

## 🎮 Overview

This application helps gamers organize their growing collection of unplayed games, prioritize what to play next, and gain insights into their gaming habits and preferences.

## ✨ Core Features

### Game Management
- **Add Games**: Manually add games with details (title, platform, genre, release date, estimated playtime)
- **Import from APIs**: Integration with IGDB/Steam APIs for automatic game data
- **Custom Tags**: Organize games with custom tags and categories
- **Game Status**: Track progress (Backlog, Playing, Completed, Abandoned, Wishlist)

### Prioritization System
- **Smart Scoring**: Algorithm considering multiple factors:
  - Personal interest level (1-5 stars)
  - Game length (short games ranked higher for quick wins)
  - Release date (older games get priority)
  - Platform availability
  - Genre balance (suggests variety)
  - Critical reception (optional metacritic integration)
- **Manual Override**: Drag-and-drop reordering
- **Play Queue**: Create a curated "up next" list

### Analytics & Insights
- **Backlog Statistics**:
  - Total games by status
  - Estimated total playtime
  - Completion rate
  - Platform distribution
  - Genre breakdown
- **Trends Over Time**:
  - Games added vs completed
  - Average completion time
  - Most played genres/platforms
- **Recommendations**: Suggest what to play based on mood/available time

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework dependencies)
- **Storage**: localStorage with JSON export/import
- **Design**: Responsive, mobile-first approach
- **PWA**: Offline-capable Progressive Web App

## 📱 User Interface

### Views
1. **Backlog View**: Grid/list of unplayed games with filters
2. **Priority Queue**: Smart-sorted list of what to play next
3. **Currently Playing**: Active games with progress tracking
4. **Completed**: Archive of finished games with ratings/notes
5. **Analytics Dashboard**: Visual statistics and trends
6. **Game Details**: Deep dive into individual game info

### Design Principles
- Clean, gaming-inspired aesthetic
- Fast, responsive interactions
- Keyboard shortcuts for power users
- Dark/light theme support
- Accessible and inclusive design

## 🎯 Project Goals

1. **Practical Utility**: Solve a real problem for gamers with large backlogs
2. **Learning Opportunity**: Explore vanilla JS patterns, data visualization, and PWA features
3. **Portfolio Piece**: Demonstrate full-stack thinking and UX design
4. **Extensibility**: Architecture that allows future enhancements (social features, achievements, etc.)

## 🚀 Getting Started

Open `index.html` in a modern web browser. No build process or dependencies required!

For development:
```bash
# Start a local server
python -m http.server 8000
# or
npx serve .
```

## 📝 Future Enhancements

- Cloud sync (Firebase/Supabase integration)
- Social features (share lists, compare backlogs)
- Gaming sessions timer and tracker
- Achievement/trophy tracking
- Integration with gaming platforms (Steam, PlayStation, Xbox)
- AI-powered recommendations
- Budget tracker for game purchases
- Sale alerts integration (Steam, Epic, etc.)

## 📄 License

MIT License - Free to use and modify

---

**Version**: 1.0.0  
**Last Updated**: November 30, 2025
