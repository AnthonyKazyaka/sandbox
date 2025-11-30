# Setting Up Game Backlog MCP Server

## For Claude Desktop (macOS)

1. **Locate your Claude Desktop config file:**
   ```bash
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

2. **Add the MCP server configuration:**
   ```json
   {
     "mcpServers": {
       "game-backlog": {
         "command": "node",
         "args": [
           "/Users/YOUR_USERNAME/path/to/game-backlog-tracker/mcp-server/index.js"
         ]
       }
     }
   }
   ```

3. **Replace the path** with your actual path to the MCP server

4. **Restart Claude Desktop**

5. **Verify it's working:**
   - Open Claude Desktop
   - Look for the 🔌 icon indicating MCP connection
   - Try asking: "What games are in my backlog?"

## For Claude Desktop (Windows)

1. **Locate your Claude Desktop config file:**
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```

2. **Add the configuration** (same as macOS but with Windows paths):
   ```json
   {
     "mcpServers": {
       "game-backlog": {
         "command": "node",
         "args": [
           "C:\\Users\\YOUR_USERNAME\\path\\to\\game-backlog-tracker\\mcp-server\\index.js"
         ]
       }
     }
   }
   ```

## For Claude Desktop (Linux)

1. **Locate your Claude Desktop config file:**
   ```bash
   ~/.config/Claude/claude_desktop_config.json
   ```

2. **Add the configuration:**
   ```json
   {
     "mcpServers": {
       "game-backlog": {
         "command": "node",
         "args": [
           "/home/YOUR_USERNAME/path/to/game-backlog-tracker/mcp-server/index.js"
         ]
       }
     }
   }
   ```

## Troubleshooting

### Server not connecting

1. **Check Node.js is installed:**
   ```bash
   node --version
   # Should show v18.0.0 or higher
   ```

2. **Test the server manually:**
   ```bash
   cd mcp-server
   npm start
   ```
   You should see: "Game Backlog MCP Server running on stdio"

3. **Check the path is absolute:**
   - Use full paths like `/Users/john/projects/game-backlog-tracker/mcp-server/index.js`
   - Not relative paths like `~/projects/...`

4. **Check Claude Desktop logs:**
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`
   - Linux: `~/.config/Claude/logs/`

### Data not persisting

The MCP server stores data in `~/.game-backlog-tracker.json`. Check:
- File permissions (should be readable/writable)
- Disk space
- File not corrupted (should be valid JSON)

### Features not working

Make sure you have the latest version:
```bash
cd mcp-server
npm install
```

## Example Interactions

Once configured, you can ask Claude:

- "Add Hollow Knight to my backlog"
- "What should I play next?"
- "Show me my backlog statistics"
- "Mark Hades as completed with 5 stars"
- "List all my games on Nintendo Switch"
- "What are my top 5 priority games?"

## Data Storage

Your game data is stored locally in:
```
~/.game-backlog-tracker.json
```

This file contains:
- All your games
- Priority weights
- Statistics
- Settings

**Backup recommendation:** Periodically backup this file or use the web app's export feature.

## Using with Other MCP Clients

The server follows the standard MCP protocol and can work with any MCP client:

1. Use `stdio` transport
2. Run the server with: `node /path/to/index.js`
3. Send JSON-RPC 2.0 requests

See `test.js` for examples of interacting with the server programmatically.
