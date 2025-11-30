# 🎮 Game Backlog MCP Server

A Model Context Protocol (MCP) server that allows AI assistants like Claude to intelligently manage your video game backlog.

## ✨ Features

### 🛠️ Tools

- **list_games** - List all games with optional filtering by status and platform
- **add_game** - Add a new game to your backlog
- **update_game** - Update game details (status, rating, notes)
- **delete_game** - Remove a game from your backlog
- **start_playing** - Move a game from backlog to "currently playing"
- **complete_game** - Mark a game as completed with optional rating
- **get_priority_list** - Get AI-recommended games based on priority algorithm
- **get_statistics** - View overall backlog statistics
- **search_rawg** - Search the RAWG API for game information (Metacritic scores, genres, etc.)

### 📚 Resources

- `backlog://games/all` - All games in your collection
- `backlog://games/backlog` - Games in backlog status
- `backlog://games/playing` - Currently playing games
- `backlog://statistics` - Overall statistics

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- A RAWG API key (get one free at [https://rawg.io/apidocs](https://rawg.io/apidocs))

### Installation

1. **Clone or navigate to the repository:**

   ```bash
   cd game-backlog-tracker/mcp-server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up your RAWG API key:**

   Create a `../js/config.js` file (or use the existing one):

   ```javascript
   export const RAWG_API_KEY = 'your-api-key-here';
   export const RAWG_API_BASE_URL = 'https://api.rawg.io/api';
   export const API_RATE_LIMIT_DELAY = 1000; // 1 second between requests
   export const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
   export const CACHE_MAX_SIZE = 4 * 1024 * 1024; // 4MB
   ```

4. **Test the server:**

   ```bash
   npm start
   ```

   You should see: `Game Backlog MCP Server running on stdio`

## 📱 Configure Your MCP Client

### Claude Desktop (macOS)

1. **Locate your Claude configuration file:**

   ```bash
   open ~/Library/Application\ Support/Claude/
   ```

2. **Edit `claude_desktop_config.json`** (create if it doesn't exist):

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

   **Important:** Replace `/absolute/path/to/` with your actual path. Example:
   ```json
   "/Users/yourname/code/game-backlog-tracker/mcp-server/index.js"
   ```

3. **Restart Claude Desktop**

4. **Verify installation:**
   - Look for the 🔌 icon in Claude Desktop
   - You should see "game-backlog" in the connected servers list

### Claude Desktop (Windows)

1. **Configuration file location:**
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```

2. **Use forward slashes or escaped backslashes in paths:**

   ```json
   {
     "mcpServers": {
       "game-backlog": {
         "command": "node",
         "args": ["C:/Users/YourName/code/game-backlog-tracker/mcp-server/index.js"]
       }
     }
   }
   ```

### Claude Desktop (Linux)

1. **Configuration file location:**
   ```
   ~/.config/Claude/claude_desktop_config.json
   ```

2. **Example configuration:**

   ```json
   {
     "mcpServers": {
       "game-backlog": {
         "command": "node",
         "args": ["/home/yourname/code/game-backlog-tracker/mcp-server/index.js"]
       }
     }
   }
   ```

### Other MCP Clients

This server uses stdio transport and follows the MCP specification. It can be integrated with any MCP-compatible client:

- **Cline** (VS Code extension)
- **Continue** (VS Code extension)
- **Cursor IDE**
- **Windsurf IDE**

Consult your client's documentation for MCP server configuration.

## 🔒 Data & Privacy

### Data Storage

Game data is stored locally in:
```
~/.game-backlog-tracker.json
```

This file is automatically created on first use and contains:
- Your game collection
- Play status and ratings
- Personal notes and preferences

### Privacy

- **100% Local:** All data stays on your machine
- **API Usage:** Only uses RAWG API for game metadata (title, Metacritic scores)
- **No Telemetry:** No usage tracking or analytics

## 💡 Usage Examples

### Adding Games

**From search:**
> "Search RAWG for Hades and add it to my backlog"

**Manual entry:**
> "Add Celeste to my backlog. It's a platformer on PC, about 10 hours long, and I'm very interested (5 stars)"

### Managing Your Backlog

**Get recommendations:**
> "What should I play next from my backlog?"

**Filter by criteria:**
> "Show me short games (under 15 hours) in my backlog"

**Track progress:**
> "I just started playing Hollow Knight"
> "I finished Hades! It was amazing - 5 stars, took me 35 hours"

### Statistics & Analysis

> "Show me my backlog statistics"
> "What genres am I playing the most?"
> "How many hours of games do I have in my backlog?"

## 🎯 Priority Algorithm

The server uses a smart priority algorithm to recommend games you'll actually enjoy playing:

### Scoring Factors

- **Interest Level** (30%) - Your personal interest rating (1-5 stars)
- **Backlog Age** (20%) - How long the game has been waiting
- **Game Length** (15%) - Shorter games get priority
- **Genre Diversity** (10%) - Encourages trying different genres
- **Metacritic Score** (5%) - Critical reception
- **Manual Priority** (50%) - Your explicit priority override

### Example Weights

Want to focus on short games? Adjust the weights:

```javascript
const priorityConfig = {
  interestWeight: 0.25,
  ageWeight: 0.10,
  lengthWeight: 0.40,  // Prioritize short games
  diversityWeight: 0.10,
  metacriticWeight: 0.05,
  manualWeight: 0.50
};
```

## 🔧 Troubleshooting

### Server not appearing in Claude Desktop

1. **Check configuration file syntax:**
   ```bash
   # Validate JSON
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool
   ```

2. **Verify absolute path:**
   ```bash
   # Test if path is correct
   node /absolute/path/to/game-backlog-tracker/mcp-server/index.js
   ```

3. **Restart Claude Desktop completely:**
   - Quit Claude (not just close window)
   - Relaunch from Applications

### "Module not found" errors

```bash
cd game-backlog-tracker/mcp-server
npm install
```

### RAWG API errors

- Check your API key in `../js/config.js`
- Verify you haven't exceeded rate limits (20,000 requests/month)
- Test the API key: `curl "https://api.rawg.io/api/games?key=YOUR_KEY"`

### Permission errors on data file

```bash
# Check permissions
ls -la ~/.game-backlog-tracker.json

# Fix if needed
chmod 644 ~/.game-backlog-tracker.json
```

## 🧪 Development

### Run with auto-reload

```bash
npm run dev
```

### Manual testing

```bash
# Start server
npm start

# In another terminal, test with MCP inspector
npx @modelcontextprotocol/inspector node mcp-server/index.js
```

### Project Structure

```
mcp-server/
├── index.js           # Main MCP server
├── package.json       # Dependencies
└── README.md          # This file

core/                  # Shared game management library
├── rawg-api.js        # RAWG API integration
├── storage.js         # Local data persistence
├── data-manager.js    # Game CRUD operations
└── priority.js        # Smart recommendation algorithm

web/                   # Optional web UI
├── index.html
├── app.js
└── styles.css
```

## 📄 License

MIT - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Claude Desktop
5. Submit a pull request

## 🔗 Links

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Claude Desktop Documentation](https://claude.ai/desktop)
- [RAWG API Documentation](https://rawg.io/apidocs)

---

**Built with ❤️ for gamers with too many games to play** 🎮
