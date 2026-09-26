// SANDBOX³ VR helpers: where the world appears, how it moves, turns and scales.
// Kept free of DOM/WebXR access so the math can be unit-tested under Node.
//
// The player never moves: the headset pose is fixed in room space, and the
// voxel world (a THREE.Group, "sceneGroup") is transformed around them. So
// "moving forward" means moving the world backward, and so on.

import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

// Tabletop layout used when entering VR (metres)
export const VR_SPAWN = {
  size: 1.6,        // width of the whole grid
  belowEyes: 0.65,  // world floor this far below the eyes (standing or seated)
  distance: 1.2     // grid centre this far in front of the player
};

export const LOCO_VOXELS_PER_SEC = 3.2;   // thumbstick flying speed, in voxels
export const VR_SCALE_MIN = 0.01;
export const VR_SCALE_MAX = 20;

// Heading (rotation about +Y) of the direction a quaternion looks along (-Z)
export function yawOf(quaternion) {
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
  return Math.atan2(-forward.x, -forward.z);
}

// World transform that puts a grid×grid×grid world on a virtual table in
// front of the player, facing the direction they are looking.
export function computeSpawnTransform(headPosition, headQuaternion, grid, layout = VR_SPAWN) {
  const scale = layout.size / grid;
  const quaternion = new THREE.Quaternion().setFromAxisAngle(UP, yawOf(headQuaternion));
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
  const centre = new THREE.Vector3(headPosition.x, headPosition.y - layout.belowEyes, headPosition.z)
    .addScaledVector(forward, layout.distance);
  // The grid's local floor centre (grid/2, 0, grid/2) must land on `centre`
  const localCentre = new THREE.Vector3(grid / 2, 0, grid / 2).multiplyScalar(scale).applyQuaternion(quaternion);
  return { position: centre.sub(localCentre), quaternion, scale };
}

export function applyTransform(group, { position, quaternion, scale }) {
  group.position.copy(position);
  group.quaternion.copy(quaternion);
  group.scale.setScalar(scale);
  group.updateMatrixWorld(true);
}

export function resetTransform(group) {
  group.position.set(0, 0, 0);
  group.quaternion.identity();
  group.scale.setScalar(1);
  group.updateMatrixWorld(true);
}

// Offset to add to the world's position for one frame of thumbstick flight:
// forward/back along where the controller points (so pointing up flies up),
// strafe kept horizontal for comfort. Speed is in voxels per second, so it
// feels the same at any world scale and any refresh rate.
export function locomotionOffset(controllerQuaternion, stickX, stickY, worldScale, dt,
  voxelsPerSec = LOCO_VOXELS_PER_SEC, deadzone = 0.15) {
  const move = new THREE.Vector3();
  if (Math.abs(stickY) > deadzone) {
    // xr-standard thumbsticks report "pushed forward" as -1
    move.addScaledVector(new THREE.Vector3(0, 0, -1).applyQuaternion(controllerQuaternion), -stickY);
  }
  if (Math.abs(stickX) > deadzone) {
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(controllerQuaternion);
    right.y = 0;
    if (right.lengthSq() > 1e-8) move.addScaledVector(right.normalize(), stickX);
  }
  // The player moving by `move` is the world moving by `-move`
  return move.multiplyScalar(-voxelsPerSec * worldScale * dt);
}

// Rotate the world about the vertical axis through `pivot` (the player's head),
// so the player turns in place. Positive angle turns the player to the right.
export function rotateAboutPivot(group, pivot, angle) {
  const rotation = new THREE.Quaternion().setFromAxisAngle(UP, angle);
  const axis = new THREE.Vector3(pivot.x, 0, pivot.z);
  group.position.sub(axis).applyQuaternion(rotation).add(axis);
  group.quaternion.premultiply(rotation);
  group.updateMatrixWorld(true);
}

// Scale the world by `ratio` about `pivot` (the point between the hands), so
// the part of the world under the hands stays under the hands.
export function scaleAboutPivot(group, pivot, ratio, min = VR_SCALE_MIN, max = VR_SCALE_MAX) {
  const from = group.scale.x;
  const to = Math.max(min, Math.min(max, from * ratio));
  const k = to / from;
  group.position.sub(pivot).multiplyScalar(k).add(pivot);
  group.scale.setScalar(to);
  group.updateMatrixWorld(true);
}

// three.js numbers controllers in the order the runtime lists input sources,
// which says nothing about handedness. Map hands to controller indices using
// the handedness reported on 'connected'; fall back to list order.
export function resolveHands(handednessByIndex) {
  let left = handednessByIndex.indexOf('left');
  let right = handednessByIndex.indexOf('right');
  const unassigned = handednessByIndex.map((_, i) => i).filter(i => i !== left && i !== right);
  if (left < 0) left = unassigned.shift() ?? -1;
  if (right < 0) right = unassigned.shift() ?? -1;
  return { left, right };
}

// Paces a repeating action (pouring) at a fixed rate in simulated time, so
// holding the button pours the same amount at 60, 90 or 144 Hz. The first
// tick after a reset fires immediately; a slow frame never fires a burst.
export const POUR_RATE = 30; // brush stamps per second

export function createPacer(ratePerSec = POUR_RATE) {
  const interval = 1 / ratePerSec;
  let elapsed = interval;
  return {
    tick(dt) {
      elapsed += dt;
      if (elapsed + 1e-9 < interval) return false;
      // Keep the remainder for accurate timing, but never a full interval
      // (that would fire again on the very next frame after a hitch)
      elapsed = Math.min(elapsed - interval, interval * 0.999);
      return true;
    },
    reset() { elapsed = interval; },
  };
}
