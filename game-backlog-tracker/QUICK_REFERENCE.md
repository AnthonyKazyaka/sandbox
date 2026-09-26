# Quick Reference - Game Backlog Tracker

## 🚀 5-Minute Setup

```bash
# 1. Get RAWG API key (free)
https://rawg.io/apidocs

# 2. Configure: open the app, Settings → RAWG API Key, paste the key
#    (optional local override: cp js/config.example.js js/config.js)
cd game-backlog-tracker

# 3. Start
python -m http.server 8080

# 4. Use
http://localhost:8080
```

## 🎮 Web App Cheat Sheet

### Keyboard Shortcuts
- **/** - Focus search
- **Esc** - Close modals
- **Enter** - Submit forms

### Quick Actions
- **Add Game** - Click + button or empty state "Add Game"
- **Search** - Type in search box, results filter live
- **Start Playing** - Click ▶ Start button on game card
- **Complete** - Click ✓ Complete when done
- **View Details** - Click any game card

### Views
- **📚 Backlog** - Games waiting to be played
- **🎮 Playing** - Currently active games
- **⭐ Play Next** - Smart recommendations
- **✅ Completed** - Finished games
- **💫 Wishlist** - Games you want
- **📊 Statistics** - Analytics dashboard
- **⚙️ Settings** - Preferences & data management

### Filters & Sorting
- **Platform** - Filter by PC, PlayStation, Xbox, Switch, etc.
- **Genre** - Filter by Action, RPG, Adventure, etc.
- **Sort By** - Date Added, Title, Interest, Length, Metacritic
- **Sort Order** - Click ↓ to toggle ascending/descending
- **View Mode** - Grid ⊞ or List ☰

## 🤖 AI Assistant Commands (MCP)

### Setup (Claude Desktop)
```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "game-backlog": {
      "command": "node",
      "args": ["/full/path/to/mcp-server/index.js"]
    }
  }
}
```

### Example Queries
```
"Add Hollow Knight to my backlog"
"What should I play next?"
"Show me games under 10 hours"
"Mark Hades as completed with 5 stars"
"List all my Nintendo Switch games"
"What's my completion rate?"
"Search for RPG games"
"Delete game with ID game_123..."
"Show me statistics"
"What are my top 5 priority games?"
```

### Available Tools
- `list_games` - Browse with filters
- `add_game` - Add new game
- `update_game` - Edit details
- `delete_game` - Remove game
- `start_playing` - Move to Playing
- `complete_game` - Mark complete
- `get_priority_list` - Get recommendations
- `get_statistics` - View stats
- `search_games` - Find games

## 📊 Priority Algorithm

### Default Weights
- **Interest Level**: 30% (your 1-5 ⭐ rating)
- **Backlog Age**: 20% (how long waiting)
- **Game Length**: 15% (shorter = higher)
- **Genre Diversity**: 10% (variety encouraged)
- **Metacritic**: 5% (critical reception)
- **Manual Priority**: 50% (your override)

### Adjust in Settings
Settings → Priority Weights → Drag sliders

## 💾 Data Management

### Export
Settings → Export Data → Saves JSON file

### Import
Settings → Import Data → Select JSON file

### Backup Location (MCP Server)
`~/.game-backlog-tracker.json`

### Reset
Settings → Reset All Data (⚠️ Cannot undo!)

### Clear Cache
Settings → Clear Cache (keeps game data, removes API cache)

## 🎨 Themes

### Switch Theme
Settings → Theme → Dark / Light

### Dark Theme
- Deep navy background
- Cyan accents
- Perfect for night gaming sessions

### Light Theme
- Clean white background
- Blue accents
- Better for daytime use

## 🔧 Troubleshooting

### "No games found" in RAWG search
- Check the API key in Settings → RAWG API Key
- Check browser console for errors
- Verify internet connection
- Try different search terms

### Data not saving
- Check localStorage available (not disabled)
- Check disk space
- Try export → clear → import

### MCP server not connecting
```bash
cd mcp-server
node index.js
# Should see: "Game Backlog MCP Server running on stdio"
```

### Themes not changing
- Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
- Clear browser cache
- Check console for errors

## 📱 Mobile Tips

- **Hamburger menu** - Tap ☰ to open sidebar
- **Swipe** - Swipe left on sidebar overlay to close
- **Tap** - Single tap to open game details
- **Long press** - No special action (normal click)

## 🎯 Best Practices

### Adding Games
1. Use RAWG search for automatic data
2. Fill in interest level (helps recommendations)
3. Add notes for context (why interested, who recommended)
4. Tag with purchase date if tracking spending

### Managing Backlog
1. Limit "Playing" to 2-3 games
2. Complete before starting new ones
3. Check "Play Next" for recommendations
4. Rate completed games (improves algorithm)

### Data Hygiene
1. Export monthly backups
2. Clean up abandoned games
3. Update interest levels periodically
4. Remove duplicates

## 📈 Statistics Explained

### Completion Rate
`(Completed / Total Games) × 100`

### Total Hours
Sum of `estimatedHours` for all backlog games

### Platform Distribution
Count of games per platform

### Genre Distribution
Count of games per genre (games can have multiple)

### Avg Metacritic
Average of all games with Metacritic scores

## 🔐 Privacy & Security

- ✅ **All data local** - No cloud upload
- ✅ **API key private** - Never shared
- ✅ **No tracking** - No analytics
- ✅ **No accounts** - No registration
- ✅ **Offline capable** - Works without internet (after cache)

## 📞 Support

### Documentation
- `README.md` - Main documentation
- `mcp-server/SETUP.md` - MCP configuration
- `IMPLEMENTATION_SUMMARY.md` - Technical details

### Testing
```bash
# Web app - manual testing
open http://localhost:8080

# MCP server - automated tests
cd mcp-server && node test.js

# Core library - interactive tests
open test-core.html
```

### Common Paths
- **Config**: `core/config.js` (defaults), Settings → RAWG API Key, optional `js/config.js`
- **Data (Web)**: Browser localStorage
- **Data (MCP)**: `~/.game-backlog-tracker.json`
- **Cache**: Browser localStorage (key: `gameBacklogTracker`)

---

**Pro Tip**: Set up both web app AND MCP server for the ultimate backlog management experience! Manage visually in the browser, query quickly via AI assistant.

**Version**: 1.0.0  
**Updated**: November 30, 2025
