// A tiny, deterministic browser-like sandbox for running the classic
// (non-module) game scripts under node:test. It provides:
//   - a fake DOM with just enough surface for the games' UI code,
//   - a no-op 2D canvas context,
//   - a manual clock driving setTimeout / requestAnimationFrame / Date.now,
//   - a seeded Math.random so simulations are reproducible.
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './static-server.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noopCanvasContext() {
  const gradient = { addColorStop() {} };
  return new Proxy({}, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient;
      if (prop === 'measureText') return () => ({ width: 0 });
      return () => {};
    },
    set(target, prop, value) { target[prop] = value; return true; },
  });
}

class FakeClassList {
  constructor() { this.set = new Set(); }
  add(...c) { c.forEach(x => this.set.add(x)); }
  remove(...c) { c.forEach(x => this.set.delete(x)); }
  toggle(c, force) {
    const on = force === undefined ? !this.set.has(c) : force;
    on ? this.set.add(c) : this.set.delete(c);
    return on;
  }
  contains(c) { return this.set.has(c); }
}

export class FakeElement {
  constructor(tag = 'div', id = null) {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.textContent = '';
    this._innerHTML = '';
    this.value = '';
    this.disabled = false;
    this.style = {};
    this.dataset = {};
    this.children = [];
    this.classList = new FakeClassList();
    this.listeners = {};
    this.width = 300;
    this.height = 150;
    this.rect = null;
    this._ctx = null;
  }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(v) { this._innerHTML = String(v); if (v === '') this.children = []; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  removeEventListener(type, fn) { this.listeners[type] = (this.listeners[type] || []).filter(f => f !== fn); }
  dispatch(type, event = {}) {
    const ev = { type, target: this, preventDefault() {}, ...event };
    (this.listeners[type] || []).forEach(fn => fn(ev));
    if (typeof this[`on${type}`] === 'function') this[`on${type}`](ev);
    return ev;
  }
  click() { return this.dispatch('click'); }
  appendChild(child) { this.children.push(child); return child; }
  getContext() { return (this._ctx ||= noopCanvasContext()); }
  getBoundingClientRect() {
    return this.rect || { left: 0, top: 0, width: this.width, height: this.height, right: this.width, bottom: this.height };
  }
}

export function createBrowserSandbox({ seed = 1, elements = {} } = {}) {
  const clock = { now: 1_700_000_000_000, perf: 0 };
  let timerId = 0;
  const timers = new Map();
  let rafQueue = [];
  const docListeners = {};
  const byId = new Map();

  for (const [id, props] of Object.entries(elements)) {
    const el = new FakeElement(props.tag || 'div', id);
    Object.assign(el, props);
    byId.set(id, el);
  }

  const document = {
    getElementById(id) {
      if (!byId.has(id)) byId.set(id, new FakeElement('div', id));
      return byId.get(id);
    },
    createElement(tag) { return new FakeElement(tag); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener(type, fn) { (docListeners[type] ||= []).push(fn); },
    dispatch(type, event = {}) { (docListeners[type] || []).forEach(fn => fn({ type, preventDefault() {}, ...event })); },
  };

  const context = {
    console,
    document,
    setTimeout(fn, ms = 0) {
      const id = ++timerId;
      timers.set(id, { fn, at: clock.perf + ms });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame(fn) { rafQueue.push(fn); return rafQueue.length; },
    cancelAnimationFrame() {},
    performance: { now: () => clock.perf },
  };
  context.window = context;
  vm.createContext(context);
  const rng = mulberry32(seed);
  context.__rng = rng;
  vm.runInContext(`
    Math.random = __rng;
    Date.now = () => __clock.now;
  `, Object.assign(context, { __clock: clock }));

  const sandbox = {
    context,
    document,
    clock,
    element: id => document.getElementById(id),
    load(relPath) {
      const code = fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
      vm.runInContext(code, context, { filename: relPath });
    },
    eval(code) { return vm.runInContext(code, context); },
    fireDOMContentLoaded() { document.dispatch('DOMContentLoaded'); },
    pendingTimers() { return timers.size; },
    // Advance the fake clock, running due timers in chronological order.
    advance(ms) {
      const target = clock.perf + ms;
      for (;;) {
        let next = null;
        for (const [id, t] of timers) if (t.at <= target && (!next || t.at < next[1].at)) next = [id, t];
        if (!next) break;
        const [id, t] = next;
        timers.delete(id);
        clock.now += t.at - clock.perf;
        clock.perf = t.at;
        t.fn();
      }
      clock.now += target - clock.perf;
      clock.perf = target;
    },
    // Advance the clock by one frame and run queued animation-frame callbacks.
    frame(ms = 1000 / 60) {
      sandbox.advance(ms);
      const q = rafQueue;
      rafQueue = [];
      q.forEach(fn => fn(clock.perf));
    },
  };
  return sandbox;
}
