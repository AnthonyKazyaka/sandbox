# Game Backlog Tracker

A comprehensive web-based tool to help manage, prioritize, and track your video game backlog.

## 🎮 Overview

This application helps gamers organize their growing collection of unplayed games, prioritize what to play next, and gain insights into their gaming habits and preferences.

## ✨ Core Features

### Game Management
- **Add Games**: Manually add games with details (title, platform, genre, release date, estimated playtime)
- **Import from APIs**: Integration with RAWG API for automatic game data (cover art, playtime, Metacritic scores)
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
- **APIs**: RAWG API for game data enrichment

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

### Setup

1. **Clone the repository** (or download the files)

2. **Configure API keys**:
   ```bash
   # Copy the example config file
   cp js/config.example.js js/config.js
   ```

## 🎯 API Integration

### RAWG API
This app uses the [RAWG Video Games Database API](https://rawg.io/apidocs) to:
- Search for games by title
- Auto-populate game details (genre, platforms, release date)
- Fetch cover art and screenshots
- Get playtime estimates
- Include Metacritic scores

**Free Tier**: 20,000 requests per month

**Data Caching**: API responses are cached locally for 7 days to minimize requests and work offline.

## 🔧 Configuration

Edit `js/config.js` to customize:
- API keys
- Cache duration (default: 7 days)
- Request rate limits
- Timeout settings

## 📝 Future Enhancements

- Cloud sync (Firebase/Supabase integration)
- Social features (share lists, compare backlogs)
- Gaming sessions timer and tracker
- Achievement/trophy tracking
- Integration with gaming platforms (Steam, PlayStation, Xbox)
- AI-powered recommendations
- Budget tracker for game purchases
- Sale alerts integration (Steam, Epic, etc.)
   # Node.js
   npx serve .
   
   # PHP
   php -S localhost:8000
   ```

5. **Open in browser**: Navigate to `http://localhost:8000`

### Important: API Key Security

⚠️ **Never commit `js/config.js` to git!**

The `.gitignore` file is configured to exclude `js/config.js` from version control. This keeps your API keys private. Always use `js/config.example.js` as a template for sharing.

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
