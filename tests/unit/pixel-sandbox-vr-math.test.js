// Pixel-sandbox VR math (items 1-4). Pure functions from pixel-sandbox/vr-math.js,
// checked as geometric properties over many poses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  VR_SPAWN, LOCO_VOXELS_PER_SEC, yawOf, computeSpawnTransform, applyTransform, resetTransform,
  locomotionOffset, rotateAboutPivot, scaleAboutPivot, resolveHands,
} from '../../pixel-sandbox/vr-math.js';

const GRID = 32;
const UP = new THREE.Vector3(0, 1, 0);
const yawQuat = deg => new THREE.Quaternion().setFromAxisAngle(UP, deg * Math.PI / 180);
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('yawOf recovers the heading, ignoring pitch', () => {
  for (const deg of [-170, -90, 0, 45, 135]) {
    const q = yawQuat(deg).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.6));
    assert.ok(near(yawOf(q), deg * Math.PI / 180, 1e-9), `${deg}°`);
  }
});

for (const deg of [0, 90, 200, -45]) {
  test(`spawn: world sits on a table in front of a player facing ${deg}°`, () => {
    const head = new THREE.Vector3(0.4, 1.55, -0.3);
    const g = new THREE.Group();
    applyTransform(g, computeSpawnTransform(head, yawQuat(deg).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.4)), GRID));
    const facing = new THREE.Vector3(0, 0, -1).applyQuaternion(yawQuat(deg));
    const centre = g.localToWorld(new THREE.Vector3(GRID / 2, 0, GRID / 2));
    const toCentre = centre.clone().sub(head).setY(0);
    assert.ok(near(toCentre.dot(facing), VR_SPAWN.distance, 1e-9), 'centre is straight ahead at the set distance');
    assert.ok(near(toCentre.length(), VR_SPAWN.distance, 1e-9), 'and not off to the side');
    assert.ok(near(centre.y, head.y - VR_SPAWN.belowEyes, 1e-9), 'floor below eye level');
    assert.ok(near(g.scale.x * GRID, VR_SPAWN.size, 1e-9), 'tabletop size');
    for (const [x, z] of [[0, 0], [GRID, 0], [0, GRID], [GRID, GRID]]) {
      const c = g.localToWorld(new THREE.Vector3(x, 0, z)).sub(head).setY(0);
      assert.ok(c.dot(facing) > 0.1, `corner (${x},${z}) is in front`);
    }
  });
}

// Player position expressed in world-voxel coordinates
const headLocal = (g, head) => g.worldToLocal(head.clone());

for (const scale of [0.05, 1]) {
  test(`locomotion follows the controller aim after any turn (world scale ${scale})`, () => {
    for (let turnDeg = 0; turnDeg < 360; turnDeg += 15) {
      const head = new THREE.Vector3(0.2, 1.6, 0.1);
      const g = new THREE.Group();
      g.scale.setScalar(scale);
      g.updateMatrixWorld(true);
      rotateAboutPivot(g, head, turnDeg * Math.PI / 180);
      for (const aimDeg of [0, 30, -120]) {
        const ctrl = yawQuat(aimDeg);
        const before = headLocal(g, head);
        const aimLocal = g.worldToLocal(head.clone().add(new THREE.Vector3(0, 0, -1).applyQuaternion(ctrl))).sub(before).normalize();
        for (let i = 0; i < 72; i++) { g.position.add(locomotionOffset(ctrl, 0, -1, g.scale.x, 1 / 72)); g.updateMatrixWorld(true); }
        const moved = headLocal(g, head).sub(before);
        assert.ok(moved.clone().normalize().dot(aimLocal) > 0.9999, `turn ${turnDeg}°, aim ${aimDeg}°`);
        assert.ok(near(moved.length(), LOCO_VOXELS_PER_SEC, 1e-6), `speed ${moved.length()} voxels/s`);
      }
    }
  });
}

test('locomotion: pointing up flies up, strafe stays level, deadzone ignored, frame-rate independent', () => {
  const up45 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 4);
  const fwd = locomotionOffset(up45, 0, -1, 1, 1);
  assert.ok(fwd.y < 0, 'world moves down = player rises');
  const strafe = locomotionOffset(up45, 1, 0, 1, 1);
  assert.ok(near(strafe.y, 0) && strafe.x < 0, 'strafe right: world moves left, level');
  assert.equal(locomotionOffset(up45, 0.1, -0.1, 1, 1).length(), 0);
  const sum = hz => { const v = new THREE.Vector3(); for (let i = 0; i < hz; i++) v.add(locomotionOffset(new THREE.Quaternion(), 0.5, -1, 0.05, 1 / hz)); return v; };
  assert.ok(sum(30).distanceTo(sum(144)) < 1e-9);
});

test('turning keeps the head over the same spot and turns the view the right way', () => {
  const head = new THREE.Vector3(0.7, 1.6, 0.9);
  const g = new THREE.Group();
  applyTransform(g, computeSpawnTransform(new THREE.Vector3(0, 1.6, 0), new THREE.Quaternion(), GRID));
  const before = headLocal(g, head);
  const rightPoint = g.worldToLocal(head.clone().add(new THREE.Vector3(1, 0, 0)));
  rotateAboutPivot(g, head, Math.PI / 2); // turn right 90°
  const after = headLocal(g, head);
  assert.ok(near(after.x, before.x, 1e-9) && near(after.z, before.z, 1e-9), 'head stays over the same voxel');
  const nowAt = g.localToWorld(rightPoint.clone()).sub(head);
  assert.ok(nowAt.z < -0.99, 'what was on the right is now straight ahead');
});

test('scaling keeps the point between the hands fixed and clamps the scale', () => {
  const g = new THREE.Group();
  applyTransform(g, computeSpawnTransform(new THREE.Vector3(0, 1.6, 0), yawQuat(30), GRID));
  const pivot = new THREE.Vector3(0.1, 1.1, -0.8);
  const local = g.worldToLocal(pivot.clone());
  scaleAboutPivot(g, pivot, 3);
  assert.ok(g.worldToLocal(pivot.clone()).distanceTo(local) < 1e-9);
  assert.ok(near(g.scale.x, 0.15, 1e-12));
  scaleAboutPivot(g, pivot, 1e6);
  assert.equal(g.scale.x, 20);
  scaleAboutPivot(g, pivot, 1e-9);
  assert.equal(g.scale.x, 0.01);
  assert.ok(g.worldToLocal(pivot.clone()).distanceTo(local) < 1e-6, 'pivot still fixed when clamped');
});

test('resetTransform restores the desktop layout', () => {
  const g = new THREE.Group();
  applyTransform(g, computeSpawnTransform(new THREE.Vector3(1, 1.6, 2), yawQuat(77), GRID));
  resetTransform(g);
  assert.deepEqual([g.position.toArray(), g.quaternion.toArray(), g.scale.toArray()], [[0, 0, 0], [0, 0, 0, 1], [1, 1, 1]]);
});

test('resolveHands maps by handedness, not connection order', () => {
  assert.deepEqual(resolveHands(['right', 'left']), { left: 1, right: 0 });
  assert.deepEqual(resolveHands(['left', 'right']), { left: 0, right: 1 });
  assert.deepEqual(resolveHands(['right', undefined]), { left: 1, right: 0 });
  assert.deepEqual(resolveHands([undefined, undefined]), { left: 0, right: 1 });
  assert.deepEqual(resolveHands(['none', 'none']), { left: 0, right: 1 });
  assert.deepEqual(resolveHands(['left']), { left: 0, right: -1 });
});

import { createPacer, POUR_RATE } from '../../pixel-sandbox/vr-math.js';

test('pacer fires POUR_RATE times per second at any frame rate, immediately on first press', () => {
  for (const hz of [30, 60, 72, 90, 120, 144]) {
    const pacer = createPacer();
    let fired = 0;
    for (let i = 0; i < hz; i++) if (pacer.tick(1 / hz)) fired++;
    assert.ok(Math.abs(fired - POUR_RATE) <= 1, `${hz} Hz fired ${fired}`);
  }
  const p = createPacer();
  assert.equal(p.tick(0), true, 'first tick fires');
  assert.equal(p.tick(0), false);
  p.reset();
  assert.equal(p.tick(0), true, 'fires again right after reset');
  const slow = createPacer();
  slow.tick(0);
  let burst = 0;
  for (let i = 0; i < 5; i++) if (slow.tick(i === 0 ? 1 : 0)) burst++;
  assert.equal(burst, 1, 'a 1 s hitch does not cause a burst of pours');
});
