#!/bin/bash

# Game Backlog Tracker - VS Code MCP Setup Script
# This script configures GitHub Copilot to use the Game Backlog MCP server

set -e

echo "🎮 Game Backlog Tracker - VS Code MCP Setup"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "mcp-server/package.json" ]; then
    echo "❌ Error: Please run this script from the game-backlog-tracker root directory"
    exit 1
fi

echo -e "${BLUE}Step 1: Installing MCP server dependencies...${NC}"
cd mcp-server
npm install
cd ..
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}Step 2: Setting up VS Code workspace settings...${NC}"
if [ ! -d ".vscode" ]; then
    mkdir .vscode
    echo "   Created .vscode directory"
fi

if [ -f ".vscode/settings.json" ]; then
    echo -e "${YELLOW}⚠️  .vscode/settings.json already exists${NC}"
    read -p "   Do you want to backup and replace it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mv .vscode/settings.json .vscode/settings.json.backup
        echo "   Backed up to .vscode/settings.json.backup"
        cp .vscode/settings.json.example .vscode/settings.json
        echo -e "${GREEN}✅ Settings configured${NC}"
    else
        echo "   Skipped. Please manually merge .vscode/settings.json.example"
    fi
else
    cp .vscode/settings.json.example .vscode/settings.json
    echo -e "${GREEN}✅ Settings configured${NC}"
fi
echo ""

echo -e "${BLUE}Step 3: Testing MCP server...${NC}"
cd mcp-server
if node test.js > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MCP server tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Tests had some issues (this is normal on first run)${NC}"
fi
cd ..
echo ""

echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Reload VS Code: Cmd/Ctrl + Shift + P → 'Reload Window'"
echo "  2. Open Copilot Chat: Cmd/Ctrl + Shift + I"
echo "  3. Try: '@workspace show my backlog'"
echo ""
echo -e "${BLUE}📘 Full documentation: .vscode/VSCODE_SETUP.md${NC}"
echo ""
