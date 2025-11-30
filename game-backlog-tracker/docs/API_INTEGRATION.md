# API Integration Guide

## Overview

This document outlines strategies for integrating external gaming data sources to enhance the Game Backlog Tracker with automated data population.

## 🎯 Target Data Sources

### 1. HowLongToBeat
**Purpose**: Accurate playtime estimates

**What We Get**:
- Main Story time
- Main + Extras time  
- Completionist time
- Game title, platform, release year
- Community-submitted data

**Integration Options**:
- **Option A**: `howlongtobeat` npm package (unofficial scraper)
  - Pros: Easy to use, works in Node.js
  - Cons: Requires backend/serverless function, against ToS
- **Option B**: Manual entry with HowLongToBeat link
  - Pros: Legal, simple, respects their service
  - Cons: No automation
- **Option C**: Build minimal scraper (ethically)
  - Pros: Direct control
  - Cons: Maintenance burden, ethical concerns

**Recommendation**: Option B for MVP, consider Option A with serverless proxy later

**Example Usage**:
```javascript
// Potential implementation with serverless function
async function fetchHowLongToBeat(gameTitle) {
  try {
    const response = await fetch(`/.netlify/functions/howlongtobeat?game=${encodeURIComponent(gameTitle)}`);
    const data = await response.json();
    return {
      mainStory: data.gameplayMain,
      mainExtras: data.gameplayMainExtra,
      completionist: data.gameplayCompletionist
    };
  } catch (error) {
    console.error('HLTB fetch failed:', error);
    return null; // Fallback to manual entry
  }
}
```

---

### 2. Metacritic
**Purpose**: Critical reception scores

**What We Get**:
- Metascore (critic average)
- User score
- Review count
- Summary

**Integration Options**:
- **Option A**: Web scraping
  - Pros: Free
  - Cons: Fragile, against ToS, no official API
- **Option B**: Third-party APIs (RapidAPI, etc.)
  - Pros: Structured data, legal
  - Cons: Cost, rate limits
- **Option C**: Manual entry with Metacritic link
  - Pros: Legal, simple
  - Cons: No automation

**Recommendation**: Option C for MVP, Option B if budget allows

---

### 3. RAWG API
**Purpose**: Comprehensive game database (BEST OPTION)

**What We Get**:
- Game details (name, description, genres, platforms)
- Release dates
- Cover art and screenshots
- Ratings (Metacritic, user ratings)
- **Playtime estimates** (similar to HLTB)
- Free tier: 20,000 requests/month

**API Key**: Free, easy registration at https://rawg.io/apidocs

**Integration**:
```javascript
const RAWG_API_KEY = 'your-api-key';

async function searchGame(query) {
  const response = await fetch(
    `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}`
  );
  return await response.json();
}

async function getGameDetails(gameId) {
  const response = await fetch(
    `https://api.rawg.io/api/games/${gameId}?key=${RAWG_API_KEY}`
  );
  const game = await response.json();
  
  return {
    title: game.name,
    releaseYear: new Date(game.released).getFullYear(),
    genres: game.genres.map(g => g.name),
    platforms: game.platforms.map(p => p.platform.name),
    coverImage: game.background_image,
    metacriticScore: game.metacritic,
    estimatedHours: game.playtime, // Average playtime in hours
    description: game.description_raw
  };
}
```

**Pros**:
- ✅ Official, free API
- ✅ No CORS issues
- ✅ Includes playtime data
- ✅ Includes Metacritic scores
- ✅ Rich metadata
- ✅ Active maintenance

**Cons**:
- ❌ Rate limits (though generous)
- ❌ Playtime less detailed than HLTB

**Recommendation**: **PRIMARY DATA SOURCE** - Use RAWG as main API

---

### 4. IGDB (Twitch)
**Purpose**: Another comprehensive game database

**What We Get**:
- Extensive game catalog
- Cover art
- Release dates, platforms, genres
- User ratings

**API Access**: Requires Twitch developer account, OAuth

**Pros**:
- Official API
- Very comprehensive
- Good documentation

**Cons**:
- More complex authentication
- Rate limits
- No playtime data

**Recommendation**: Secondary option if RAWG doesn't have data

---

### 5. OpenCritic
**Purpose**: Alternative to Metacritic

**What We Get**:
- Critic scores
- Top critic average
- Percent recommended
- Review links

**API**: No public API, web scraping only

**Recommendation**: Skip for now, Metacritic via RAWG is sufficient

---

## 🏗️ Implementation Architecture

### Phase 1: RAWG Integration (Recommended First Step)

**File Structure**:
```
js/
├── api/
│   ├── rawg.js           # RAWG API wrapper
│   ├── api-cache.js      # Cache API responses in localStorage
│   └── api-manager.js    # Unified API interface
```

**Core Functions**:

```javascript
// js/api/rawg.js
class RAWGApi {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.rawg.io/api';
  }

  async searchGames(query) {
    const url = `${this.baseUrl}/games?key=${this.apiKey}&search=${encodeURIComponent(query)}&page_size=5`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('RAWG API request failed');
    return await response.json();
  }

  async getGame(gameId) {
    const url = `${this.baseUrl}/games/${gameId}?key=${this.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('RAWG API request failed');
    return await response.json();
  }

  // Transform RAWG data to our game model
  transformToGameData(rawgGame) {
    return {
      title: rawgGame.name,
      platform: rawgGame.platforms?.[0]?.platform?.name || 'PC',
      genre: rawgGame.genres?.map(g => g.name) || [],
      releaseYear: new Date(rawgGame.released).getFullYear(),
      estimatedHours: rawgGame.playtime || 10,
      coverImage: rawgGame.background_image,
      rating: Math.round(rawgGame.rating) || 0,
      metacriticScore: rawgGame.metacritic,
      notes: rawgGame.description_raw?.substring(0, 200) || ''
    };
  }
}

// js/api/api-cache.js
class ApiCache {
  constructor(cacheName = 'gameApiCache', maxAge = 7 * 24 * 60 * 60 * 1000) {
    this.cacheName = cacheName;
    this.maxAge = maxAge; // 7 days default
  }

  set(key, data) {
    const cache = this.getCache();
    cache[key] = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(this.cacheName, JSON.stringify(cache));
  }

  get(key) {
    const cache = this.getCache();
    const item = cache[key];
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > this.maxAge) {
      delete cache[key];
      localStorage.setItem(this.cacheName, JSON.stringify(cache));
      return null;
    }
    
    return item.data;
  }

  getCache() {
    try {
      return JSON.parse(localStorage.getItem(this.cacheName) || '{}');
    } catch {
      return {};
    }
  }

  clear() {
    localStorage.removeItem(this.cacheName);
  }
}
```

### UI Integration

**Add Game Modal Enhancement**:
```html
<!-- Add to game form -->
<div class="form-group">
  <label for="gameSearch">Search Game Database</label>
  <input 
    type="text" 
    id="gameSearch" 
    placeholder="Search RAWG database..."
  >
  <div id="searchResults" class="search-results"></div>
</div>

<!-- Or manual entry -->
<div class="form-divider">OR enter manually</div>

<div class="form-group">
  <label for="gameTitle">Game Title</label>
  <input type="text" id="gameTitle" required>
</div>
<!-- ... rest of manual form -->
```

**Search Results Display**:
```javascript
// Show search results
function displaySearchResults(results) {
  const container = document.getElementById('searchResults');
  container.innerHTML = results.map(game => `
    <div class="search-result-item" data-game-id="${game.id}">
      <img src="${game.background_image}" alt="${game.name}">
      <div class="result-info">
        <h4>${game.name}</h4>
        <p>${game.released} • ${game.playtime}h</p>
        <span class="metacritic">${game.metacritic || 'N/A'}</span>
      </div>
    </div>
  `).join('');
}

// Handle selection
document.getElementById('searchResults').addEventListener('click', async (e) => {
  const resultItem = e.target.closest('.search-result-item');
  if (!resultItem) return;
  
  const gameId = resultItem.dataset.gameId;
  const gameData = await rawgApi.getGame(gameId);
  const transformedData = rawgApi.transformToGameData(gameData);
  
  // Pre-fill form with fetched data
  populateGameForm(transformedData);
});
```

---

## 📊 Data Enhancement Strategy

### Priority Order
1. **RAWG API** (primary): Cover 80%+ of games
2. **Manual entry**: User override/fallback
3. **HowLongToBeat** (future): Optional serverless enhancement
4. **IGDB** (future): Fallback for games not in RAWG

### Caching Strategy
- Cache all API responses for 7 days
- Store in separate localStorage key
- Implement cache size monitoring (warn at 4MB)
- Allow manual cache clearing in settings

### User Experience
- Show "Fetching from RAWG..." loading state
- Display data source badge ("via RAWG", "Manual")
- Allow editing auto-fetched data
- Provide manual entry as always-available fallback

---

## 🔐 API Key Management

### Development
```javascript
// config.js (gitignored)
export const API_KEYS = {
  rawg: 'your-rawg-api-key-here'
};
```

### Production
- Store API keys in environment variables (Netlify, Vercel)
- Use serverless functions to proxy requests
- Never expose keys in client-side code for production

### Example Serverless Function (Netlify)
```javascript
// netlify/functions/game-search.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { query } = event.queryStringParameters;
  const apiKey = process.env.RAWG_API_KEY;
  
  try {
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch games' })
    };
  }
};
```

---

## ✅ Implementation Checklist

### Phase 1: Basic RAWG Integration
- [ ] Create `js/api/rawg.js` wrapper
- [ ] Implement API caching system
- [ ] Add search UI to "Add Game" modal
- [ ] Display search results with previews
- [ ] Auto-populate form on selection
- [ ] Add "via RAWG" badge to games
- [ ] Handle API errors gracefully

### Phase 2: Enhanced Features
- [ ] Add manual refresh button for game data
- [ ] Implement bulk import from search
- [ ] Show Metacritic score in game cards
- [ ] Add playtime comparison (estimated vs actual)
- [ ] Settings: API key configuration
- [ ] Settings: Cache management

### Phase 3: Advanced Integration (Optional)
- [ ] Serverless function for API proxying
- [ ] HowLongToBeat integration
- [ ] IGDB fallback
- [ ] Steam library import
- [ ] Automatic data refresh (monthly)

---

## 🚨 Important Considerations

### Rate Limits
- RAWG: 20,000 requests/month free tier
- Monitor usage in settings
- Implement request throttling (1 request/second)

### Data Privacy
- All API data cached locally
- No user data sent to external services
- API keys stored securely

### Fallback Strategy
```javascript
async function addGameWithEnhancement(basicInfo) {
  // Try RAWG first
  let enhancedData = await fetchFromRAWG(basicInfo.title);
  
  if (!enhancedData) {
    // Fall back to IGDB
    enhancedData = await fetchFromIGDB(basicInfo.title);
  }
  
  if (!enhancedData) {
    // Use basic info only
    enhancedData = basicInfo;
  }
  
  return createGame(enhancedData);
}
```

### Error Handling
- Network errors: Show retry button
- No results: Offer manual entry
- Invalid API key: Clear instructions
- Rate limit hit: Inform user, suggest cache

---

## 📚 Resources

- **RAWG API Docs**: https://rawg.io/apidocs
- **IGDB API**: https://api-docs.igdb.com/
- **HowLongToBeat npm**: https://www.npmjs.com/package/howlongtobeat
- **Netlify Functions**: https://docs.netlify.com/functions/overview/

---

**Last Updated**: November 30, 2025  
**Status**: Planning Phase  
**Recommended Approach**: Start with RAWG API for MVP
