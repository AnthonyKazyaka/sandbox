// SANDBOX³ simulation core: materials, cellular-automaton world, raycast.
// Kept free of rendering/THREE.js code so it can be unit-tested under Node.

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
export const GRID = 32;
export const MAT = { EMPTY:0,STONE:1,SAND:2,WATER:3,LAVA:4,OIL:5,STEAM:6,FIRE:7,SMOKE:8,SPOUT:9 };
export const PLACE_MATS = [MAT.STONE,MAT.SAND,MAT.WATER,MAT.LAVA,MAT.OIL,MAT.FIRE];
export const PLACE_NAMES= ['STONE','SAND','WATER','LAVA','OIL','FIRE'];
export const MODES = ['POUR','SPOUT','ERASE'];
export const MODE_COLORS = { POUR:'#50a0ff', SPOUT:'#ffaa00', ERASE:'#ff4444' };

//                    0    1    2    3    4   5   6   7   8   9
export const DENSITY  = [    0, 999, 180, 100, 320, 55,  2,  3,  1, 999];
export const IS_LIQ   = [    0,   0,   0,   1,   1,  1,  0,  0,  0,   0];
export const IS_GAS   = [    0,   0,   0,   0,   0,  0,  1,  1,  1,   0];
export const LIFETIME = [    0,   0,   0,   0,   0,  0, 55, 22, 80,   0];
// Rendered see-through (water, oil, steam, fire, smoke): they do not hide what is behind them
export const IS_TRANSLUCENT = [0,   0,   0,   1,   0,  1,  1,  1,  1,   0];

export const COLORS = {
  [MAT.STONE]:[0x7a7a8a,0x8c8c9c,0x666678],
  [MAT.SAND]: [0xe8c87a,0xf4d888,0xd4b060],
  [MAT.WATER]:[0x1a55bb,0x2266cc,0x3080dd],
  [MAT.LAVA]: [0xff4400,0xff6600,0xdd2200],
  [MAT.OIL]:  [0x1a0d28,0x221133,0x2c1a40],
  [MAT.STEAM]:[0x889aaa,0x99aabb,0x778899],
  [MAT.FIRE]: [0xff8800,0xffcc00,0xff4400],
  [MAT.SMOKE]:[0x445566,0x334455,0x556677],
};

// Per-material hex for wrist UI / spout tinting
export const MAT_HEX = {
  [MAT.STONE]:'#7a7a8a',[MAT.SAND]:'#e8c87a',[MAT.WATER]:'#3a8fff',
  [MAT.LAVA]:'#ff4f00',[MAT.OIL]:'#553366',[MAT.FIRE]:'#ff8800',
};

export const TICK_MS = 75;

// ─── WORLD ────────────────────────────────────────────────────────────────────
export class World {
  constructor() {
    const N = GRID*GRID*GRID;
    this.cells     = new Uint8Array(N);
    this.variant   = new Uint8Array(N);
    this.age       = new Uint16Array(N);
    this.spoutMat  = new Uint8Array(N);   // which material a spout emits
    this.spoutRate = new Uint8Array(N);   // cells per tick per spout (1-8)
    this.active    = new Set();
    this.spouts    = new Set();           // indices of all spout cells
    this.dirty     = true;                // rebuild needed flag
    this._buildFloor();
  }

  idx(x,y,z)      { return x + GRID*(y + GRID*z); }
  inBounds(x,y,z) { return x>=0&&x<GRID&&y>=0&&y<GRID&&z>=0&&z<GRID; }
  get(x,y,z)      { if(!this.inBounds(x,y,z)) return MAT.STONE; return this.cells[this.idx(x,y,z)]; }

  set(x,y,z,mat) {
    if(!this.inBounds(x,y,z)) return;
    const i = this.idx(x,y,z);
    const prev = this.cells[i];
    if(prev===MAT.SPOUT) this.spouts.delete(i);
    this.cells[i]=mat; this.variant[i]=Math.random()*3|0; this.age[i]=0;
    if(mat!==MAT.EMPTY) this.active.add(i);
    this.dirty=true;
    this._wake(x,y,z);
  }

  setSpout(x,y,z,emitMat,rate) {
    if(!this.inBounds(x,y,z)) return;
    if(y===0) return; // protect floor
    const i = this.idx(x,y,z);
    this.cells[i]=MAT.SPOUT; this.variant[i]=0; this.age[i]=0;
    this.spoutMat[i]=emitMat; this.spoutRate[i]=rate;
    this.spouts.add(i);
    this.active.add(i);
    this._wake(x,y,z);
  }

  swap(ax,ay,az,bx,by,bz) {
    const ia=this.idx(ax,ay,az), ib=this.idx(bx,by,bz);
    let t;
    t=this.cells[ia];  this.cells[ia]=this.cells[ib];   this.cells[ib]=t;
    t=this.variant[ia];this.variant[ia]=this.variant[ib];this.variant[ib]=t;
    t=this.age[ia];    this.age[ia]=this.age[ib];        this.age[ib]=t;
    this.active.add(ia); this.active.add(ib);
    this.dirty=true;
    this._wake(ax,ay,az); this._wake(bx,by,bz);
  }

  _wake(x,y,z) {
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) for(let dz=-1;dz<=1;dz++) {
      const nx=x+dx,ny=y+dy,nz=z+dz;
      if(this.inBounds(nx,ny,nz)) { const ni=this.idx(nx,ny,nz); if(this.cells[ni]!==MAT.EMPTY) this.active.add(ni); }
    }
  }

  _buildFloor() { for(let x=0;x<GRID;x++) for(let z=0;z<GRID;z++) this.set(x,0,z,MAT.STONE); }

  _canDisplace(mover,tx,ty,tz) {
    if(!this.inBounds(tx,ty,tz)) return false;
    const t=this.cells[this.idx(tx,ty,tz)];
    if(t===MAT.EMPTY) return true;
    if(t===MAT.STONE||t===MAT.SPOUT) return false;
    return DENSITY[t]<DENSITY[mover];
  }

  // Only marks the world dirty when a cell's material or colour changes, so an
  // idle world skips the renderer rebuild entirely.
  step() {
    // ── Spout emission ──
    for(const si of this.spouts) {
      if(this.cells[si]!==MAT.SPOUT) { this.spouts.delete(si); continue; }
      const x=si%GRID, y=(si/GRID|0)%GRID, z=si/(GRID*GRID)|0;
      const eMat=this.spoutMat[si], rate=this.spoutRate[si];
      let placed=0;
      // Try directly below, then fan out in a radius
      const below=y-1;
      if(below>=0 && this.get(x,below,z)===MAT.EMPTY) { this.set(x,below,z,eMat); placed++; }
      // Fill remaining rate with random cells in downward cone
      let tries=0;
      while(placed<rate && tries<rate*4) {
        tries++;
        const r=Math.random()*2|0; // cone radius 0-1
        const angle=Math.random()*Math.PI*2;
        const ox=Math.round(Math.cos(angle)*r), oz=Math.round(Math.sin(angle)*r);
        const dy=-(Math.random()*2|0)-1; // 1 or 2 below
        const nx=x+ox, ny=y+dy, nz=z+oz;
        if(this.inBounds(nx,ny,nz)&&this.get(nx,ny,nz)===MAT.EMPTY) { this.set(nx,ny,nz,eMat); placed++; }
      }
      this.active.add(si); // spouts always stay active
    }

    // ── Cell simulation ──
    const list=Array.from(this.active);
    for(let i=list.length-1;i>0;i--) { const j=Math.random()*(i+1)|0; const t=list[i];list[i]=list[j];list[j]=t; }
    const next=new Set();

    for(const ci of list) {
      const mat=this.cells[ci]; if(mat===MAT.EMPTY) continue;
      const x=ci%GRID, y=(ci/GRID|0)%GRID, z=ci/(GRID*GRID)|0;

      // Spouts are immortal and handled above
      if(mat===MAT.SPOUT) { next.add(ci); continue; }

      this.age[ci]++;
      const life=LIFETIME[mat];
      if(life>0 && this.age[ci]>life+(Math.random()*20|0)) {
        if(mat===MAT.FIRE) { this.cells[ci]=MAT.SMOKE; this.variant[ci]=Math.random()*3|0; this.age[ci]=0; next.add(ci); }
        else this.cells[ci]=MAT.EMPTY;
        this.dirty=true;
        this._wake(x,y,z); continue;
      }
      // Stone never moves; it is re-woken by _wake when a neighbour changes
      if(mat===MAT.STONE) continue;

      let moved=false;
      if(mat===MAT.SAND)       moved=this._sand(x,y,z,next);
      else if(IS_LIQ[mat])     moved=this._liquid(x,y,z,mat,next);
      else if(mat===MAT.FIRE)  moved=this._fire(x,y,z,next);
      else if(IS_GAS[mat])     moved=this._gas(x,y,z,mat,next);

      if(!moved&&mat!==MAT.STONE) {
        const b=this.get(x,y-1,z);
        if(b===MAT.EMPTY||DENSITY[b]<DENSITY[mat]) next.add(ci);
        else if(IS_LIQ[mat]||IS_GAS[mat]||mat===MAT.FIRE) next.add(ci);
      }
    }
    this.active=next;
  }

  _sand(x,y,z,next) {
    if(y>0&&this._canDisplace(MAT.SAND,x,y-1,z)){this.swap(x,y,z,x,y-1,z);next.add(this.idx(x,y-1,z));return true;}
    const dirs=_shuf([[-1,-1,0],[1,-1,0],[0,-1,-1],[0,-1,1]]);
    for(const[dx,dy,dz]of dirs){const nx=x+dx,ny=y+dy,nz=z+dz;if(this._canDisplace(MAT.SAND,nx,ny,nz)){this.swap(x,y,z,nx,ny,nz);next.add(this.idx(nx,ny,nz));return true;}}
    return false;
  }

  _liquid(x,y,z,mat,next) {
    if(mat===MAT.LAVA) {
      const nb6=[[-1,0,0],[1,0,0],[0,1,0],[0,-1,0],[0,0,-1],[0,0,1]];
      for(const[dx,dy,dz]of nb6){
        const nx=x+dx,ny=y+dy,nz=z+dz; if(!this.inBounds(nx,ny,nz))continue;
        const nm=this.get(nx,ny,nz);
        if(nm===MAT.WATER){this.set(x,y,z,MAT.STONE);this.set(nx,ny,nz,MAT.STEAM);next.add(this.idx(x,y,z));next.add(this.idx(nx,ny,nz));return true;}
        if(nm===MAT.OIL&&Math.random()<0.04){this.set(nx,ny,nz,MAT.FIRE);next.add(this.idx(nx,ny,nz));}
      }
    }
    if(y>0&&this._canDisplace(mat,x,y-1,z)){this.swap(x,y,z,x,y-1,z);next.add(this.idx(x,y-1,z));return true;}
    const dirs=_shuf([[-1,0,0],[1,0,0],[0,0,-1],[0,0,1],[-1,0,-1],[1,0,-1],[-1,0,1],[1,0,1]]);
    for(const[dx,,dz]of dirs){const nx=x+dx,nz2=z+dz;if(this._canDisplace(mat,nx,y,nz2)){this.swap(x,y,z,nx,y,nz2);next.add(this.idx(nx,y,nz2));return true;}}
    return false;
  }

  _fire(x,y,z,next) {
    const nb6=[[-1,0,0],[1,0,0],[0,1,0],[0,-1,0],[0,0,-1],[0,0,1]];
    for(const[dx,dy,dz]of nb6){
      const nx=x+dx,ny=y+dy,nz=z+dz; if(!this.inBounds(nx,ny,nz))continue;
      if(this.get(nx,ny,nz)===MAT.OIL&&Math.random()<0.08){this.set(nx,ny,nz,MAT.FIRE);next.add(this.idx(nx,ny,nz));}
    }
    if(y<GRID-1&&this.get(x,y+1,z)===MAT.EMPTY&&Math.random()<0.25){this.swap(x,y,z,x,y+1,z);next.add(this.idx(x,y+1,z));return true;}
    next.add(this.idx(x,y,z)); return false;
  }

  _gas(x,y,z,mat,next) {
    if(y<GRID-1&&this.get(x,y+1,z)===MAT.EMPTY){this.swap(x,y,z,x,y+1,z);next.add(this.idx(x,y+1,z));return true;}
    const dirs=_shuf([[-1,1,0],[1,1,0],[0,1,-1],[0,1,1]]);
    for(const[dx,dy,dz]of dirs){const nx=x+dx,ny=y+dy,nz=z+dz;if(this.inBounds(nx,ny,nz)&&this.get(nx,ny,nz)===MAT.EMPTY){this.swap(x,y,z,nx,ny,nz);next.add(this.idx(nx,ny,nz));return true;}}
    next.add(this.idx(x,y,z)); return false;
  }
}

// Fisher–Yates shuffle (j ranges over 0..i inclusive, so every order is equally likely)
export function _shuf(a){const r=a.slice();for(let i=r.length-1;i>0;i--){const j=Math.random()*(i+1)|0;const t=r[i];r[i]=r[j];r[j]=t;}return r;}

// A voxel can be skipped when rendering only if all 6 neighbours hide it:
// opaque neighbours always do; translucent ones only when they are the same
// material (interior of a body of water). Edge voxels are never culled.
export function isOccluded(cells,x,y,z) {
  if(x<=0||x>=GRID-1||y<=0||y>=GRID-1||z<=0||z>=GRID-1) return false;
  const G=GRID, G2=GRID*GRID, ci=x+G*(y+G*z), mat=cells[ci];
  const hides=n=>n!==MAT.EMPTY&&(!IS_TRANSLUCENT[n]||n===mat);
  return hides(cells[ci-1])&&hides(cells[ci+1])&&hides(cells[ci-G])&&hides(cells[ci+G])&&hides(cells[ci-G2])&&hides(cells[ci+G2]);
}

// ─── DDA RAYCAST ─────────────────────────────────────────────────────────────
export function ddaRaycast(world,origin,dir,maxDist) {
  let x=Math.floor(origin.x),y=Math.floor(origin.y),z=Math.floor(origin.z);
  const sx=dir.x>0?1:-1,sy=dir.y>0?1:-1,sz=dir.z>0?1:-1;
  const tdx=Math.abs(dir.x)<1e-9?1e30:1/Math.abs(dir.x);
  const tdy=Math.abs(dir.y)<1e-9?1e30:1/Math.abs(dir.y);
  const tdz=Math.abs(dir.z)<1e-9?1e30:1/Math.abs(dir.z);
  let tx=dir.x>0?(x+1-origin.x)*tdx:(origin.x-x)*tdx;
  let ty=dir.y>0?(y+1-origin.y)*tdy:(origin.y-y)*tdy;
  let tz=dir.z>0?(z+1-origin.z)*tdz:(origin.z-z)*tdz;
  let dist=0,face='y';
  while(dist<maxDist){
    if(tx<ty&&tx<tz){x+=sx;dist=tx;tx+=tdx;face='x';}
    else if(ty<tz)  {y+=sy;dist=ty;ty+=tdy;face='y';}
    else            {z+=sz;dist=tz;tz+=tdz;face='z';}
    if(!world.inBounds(x,y,z)) return null;
    if(world.get(x,y,z)!==MAT.EMPTY) return{x,y,z,dist,face};
  }
  return null;
}
