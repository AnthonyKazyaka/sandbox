# Transparent Window

A minimal Electron app that renders a completely transparent, frameless, always-on-top window. Phase 1 prototype for a screen region sharing tool.

## What It Does

- Creates a transparent overlay window — you can see your desktop through it
- Frameless with a subtle dashed border to show window boundaries
- Always-on-top by default (toggleable via pin button)
- Draggable via the semi-transparent title bar
- Resizable by dragging window edges

## Setup

```bash
cd transparent-window
npm install
npm start
```

Requires Node.js 18+ installed.

## Controls

| Button | Action |
|--------|--------|
| 📌 Pin | Toggle always-on-top |
| ─ Minimize | Minimize to taskbar |
| ✕ Close | Close the app |

Drag the top bar to reposition. Drag edges/corners to resize.

## Platform Notes

- **Windows**: Works out of the box
- **macOS**: Works out of the box
- **Linux**: Transparent visuals enabled via command-line switch; may vary by compositor

## Future Plans

- **Phase 2**: Mirror screen pixels behind the window using `desktopCapturer` so the window can be shared in video calls to show a specific screen region
- **Phase 3**: Region selection mode, capture/stream export
