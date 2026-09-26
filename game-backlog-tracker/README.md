# Game Backlog Tracker

A modern, intelligent web application for managing and prioritizing your video game backlog, with AI assistant integration via Model Context Protocol (MCP).

🌐 **[Live Demo](https://anthonykazyaka.github.io/sandbox/game-backlog-tracker)** | 📖 **[Documentation](docs/)** | 🤖 **[MCP Server](mcp-server/)**

---

## ⚡ Quick Setup

**VS Code + GitHub Copilot:**
```bash
cd game-backlog-tracker
cd mcp-server && npm install && cd ..
cp .vscode/settings.json.example .vscode/settings.json
code .  # Reload VS Code, then chat: @workspace show my backlog
```

📘 **[Complete VS Code Setup Guide →](.vscode/VSCODE_SETUP.md)** | 📖 **[Claude Desktop Setup →](mcp-server/SETUP.md)**

---

## 🎮 Project Status

**All Phases Complete!** ✅

- ✅ **Phase A: Core Library** - Data management, RAWG API integration, priority algorithm
- ✅ **Phase C: Web Application** - Full-featured PWA with dark/light themes
- ✅ **Phase B: MCP Server** - AI assistant integration for Claude Desktop

## ✨ Features

### 🌐 Web Application

- **Smart Prioritization** - AI-powered algorithm ranks games based on interest, length, and backlog age
- **RAWG Integration** - Automatic game data, cover art, and Metacritic scores
- **Status Tracking** - Manage Backlog, Currently Playing, Completed, Wishlist
- **Statistics Dashboard** - Visualize your collection by platform, genre, completion rate
- **Dark/Light Themes** - Beautiful responsive design for desktop and mobile
- **Local-First** - All data stored locally with import/export support

### 🤖 MCP Server (AI Integration)

Talk to your backlog using Claude Desktop or other MCP-compatible AI assistants:

```
"What should I play next?"
"Add Hollow Knight to my backlog"
"Show me games under 10 hours"
"Mark Celeste as completed with 5 stars"
"What's my completion rate?"
```

**9 AI Tools Available:**
- `list_games` - Browse your collection with filters
- `add_game` - Add games manually or from RAWG
- `update_game` - Change status, rating, notes
- `delete_game` - Remove games
- `start_playing` - Move to "Currently Playing"
- `complete_game` - Mark as completed with rating
- `get_priority_list` - Get smart recommendations
- `get_statistics` - View collection stats
- `search_games` - Find games by title/notes

## 🚀 Quick Start

### Web Application

1. **Get a RAWG API key** (free at https://rawg.io/apidocs)

2. **Add the key in the app:** open **Settings → RAWG API Key** and paste it.
   The key is stored only in your browser. (Optional for local development:
   `cp js/config.example.js js/config.js` to override defaults; that file is
   gitignored and is not required.)

3. **Start a local server:**
   ```bash
   python -m http.server 8080
   # or
   npx serve .
   ```

4. **Open in browser:** http://localhost:8080

### MCP Server (Optional - for AI assistants)

#### 🎯 Quick Setup for VS Code + GitHub Copilot

```bash
# One-line setup
cd mcp-server && npm install && cd .. && cp .vscode/settings.json.example .vscode/settings.json
```

Then reload VS Code and start chatting: `@workspace show my backlog`

📘 **[Complete VS Code Setup Guide →](.vscode/VSCODE_SETUP.md)**

#### 🤖 Claude Desktop Setup

1. **Install dependencies:**
   ```bash
   cd mcp-server
   npm install
   ```

2. **Configure Claude Desktop:**
   
   Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):
   ```json
   {
     "mcpServers": {
       "game-backlog": {
         "command": "node",
         "args": ["/absolute/path/to/game-backlog-tracker/mcp-server/index.js"]
       }
     }
   }
   ```

3. **Restart Claude Desktop** and start managing your backlog with AI!

📖 **Detailed setup:** See [mcp-server/SETUP.md](mcp-server/SETUP.md)

## 🛠️ Technology Stack

### Web Application
- **Frontend**: Vanilla JavaScript (ES6+ modules), HTML5, CSS3
- **API**: RAWG Video Games Database API  
- **Storage**: localStorage with JSON import/export
- **Architecture**: Class-based modules, reactive UI patterns
- **No framework dependencies** - Pure vanilla JS

### MCP Server
- **Runtime**: Node.js 18+
- **Protocol**: Model Context Protocol (MCP) via stdio
- **Storage**: JSON file (`~/.game-backlog-tracker.json`)
- **SDK**: `@modelcontextprotocol/sdk`

### Core Library (Shared)
- **Modules**: Data management, RAWG API wrapper, priority calculator
- **Features**: Rate limiting (1 req/sec), caching (7 days), error handling

## 📁 Project Structure

```
game-backlog-tracker/
├── index.html                 # Main application
├── css/
│   └── styles.css            # Dark/light theme styles
├── web/
│   └── app.js                # Web app logic (~1000 lines)
├── core/                     # Core library (shared)
│   ├── data-manager.js       # CRUD operations
│   ├── storage.js            # localStorage persistence
│   ├── rawg-api.js           # API integration + caching
│   ├── priority.js           # Priority algorithm
│   └── index.js              # Module exports
├── mcp-server/               # MCP server
│   ├── index.js              # Server implementation
│   ├── test.js               # Integration tests
│   ├── package.json          # Dependencies
│   ├── README.md             # Server docs
│   └── SETUP.md              # Configuration guide
├── core/config.js            # Defaults + API key from Settings
├── js/
│   ├── config.js             # Optional local override (gitignored)
│   └── config.example.js     # Template for the optional override
└── docs/
    ├── PROJECT_ROADMAP.md    # Development plan
    └── API_INTEGRATION.md    # RAWG research
```

## 🎯 Development Phases

All phases complete! See [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) for details.

### ✅ Phase A: Core Library
- Full CRUD operations for game management
- RAWG API integration with caching & rate limiting
- Priority algorithm with configurable weights
- localStorage with import/export

### ✅ Phase C: Web Application
- Responsive PWA with dark/light themes
- Game cards with cover images & metadata
- Status tracking (Backlog → Playing → Completed)
- Smart filtering, sorting, search
- Statistics dashboard with charts
- Settings panel with priority weights

### ✅ Phase B: MCP Server
- 9 AI-accessible tools
- 4 resource endpoints
- Claude Desktop integration
- Comprehensive tests
- Full documentation

## 🧪 Testing

### Web Application
```bash
# Start server
python -m http.server 8080

# Test in browser
open http://localhost:8080
```

### MCP Server
```bash
cd mcp-server

# Run integration tests
node test.js

# Expected output: "🎉 All tests passed!"
```

### Core Library
```bash
# Open test page
open test-core.html
```

## 🎨 Screenshots

### Web Application
- **Dark Theme**: Sleek, gaming-inspired interface
- **Light Theme**: Clean, accessible alternative
- **Game Cards**: Beautiful cover art, star ratings, platform badges
- **Priority View**: Smart recommendations with scores
- **Statistics**: Visual charts for platform/genre distribution

### MCP Integration
- **Claude Desktop**: Natural language game management
- **AI Tools**: Browse, add, update, complete games via chat
- **Smart Queries**: "Show me short games I rated highly"

## 🔐 Security

- ⚠️ **Never commit `js/config.js`** - the optional local override is gitignored; the key entered in Settings stays in your browser's localStorage
- 🔒 **Local-first** - No cloud storage, data stays on your device
- 📦 **Export/Import** - Backup your data anytime via JSON

## 📊 Priority Algorithm

Games are ranked using configurable weights (adjust in Settings):

- **Interest Level** (30%) - Your 1-5 star rating
- **Backlog Age** (20%) - How long it's been waiting
- **Game Length** (15%) - Shorter games ranked higher
- **Genre Diversity** (10%) - Encourages variety
- **Metacritic Score** (5%) - Critical reception
- **Manual Priority** (50%) - Your explicit overrides

## 🌍 RAWG API Integration

Free tier: 20,000 requests/month

**Features:**
- Game search with auto-complete
- Cover art and screenshots
- Metacritic scores
- Estimated playtime (HowLongToBeat data)
- Genre, platform, release year
- Game descriptions

**Caching:** 7-day cache minimizes API calls and enables offline use.

## 🚀 Future Enhancements

- [ ] Cloud sync (Firebase/Supabase)
- [ ] Social features (share lists, compare backlogs)
- [ ] Play session timer
- [ ] Achievement/trophy tracking
- [ ] Platform integration (Steam, PlayStation, Xbox)
- [ ] Budget tracker for purchases
- [ ] Sale alerts (Steam, Epic)
- [ ] Mobile app (React Native/Flutter)

## 📝 Contributing

This is a personal learning project, but feedback and ideas are welcome!

1. Fork the repository
2. Create a feature branch
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - Free to use and modify

## 🙏 Acknowledgments

- **RAWG API** - Game database and metadata
- **Model Context Protocol** - AI integration standard
- **Claude Desktop** - MCP client implementation

---

**Version**: 1.0.0  
**Last Updated**: November 30, 2025  
**Status**: Production Ready ✅

**Live Demo**: [https://anthonykazyaka.github.io/sandbox/game-backlog-tracker](https://anthonykazyaka.github.io/sandbox/game-backlog-tracker)  
**Repository**: [https://github.com/AnthonyKazyaka/sandbox/tree/main/game-backlog-tracker](https://github.com/AnthonyKazyaka/sandbox/tree/main/game-backlog-tracker)
