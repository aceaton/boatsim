"use strict";

// Particle constructor
function Particle(x, y, z, mass) {
  let pos = new THREE.Vector3(x,y,z);
  this.position = new THREE.Vector3().copy(pos); // position
  this.previous = new THREE.Vector3().copy(pos); // previous
  this.original = new THREE.Vector3().copy(pos); // original

  // initParameterizedPosition(x, y, this.position);
  // initParameterizedPosition(x, y, this.previous);
  // initParameterizedPosition(x, y, this.original);

  this.netForce = new THREE.Vector3(); // net force acting on particle
  this.mass = mass; // mass of the particle
  this.correction = new THREE.Vector3(); // offset to apply to enforce constraints
}

// Snap a particle back to its original position
Particle.prototype.lockToOriginal = function() {
  this.position.copy(this.original);
  this.previous.copy(this.original);
};

// Snap a particle back to its previous position
Particle.prototype.lock = function() {
  this.position.copy(this.previous);
  this.previous.copy(this.previous);
};

// Add the given force to a particle's total netForce.
// Params:
// * force: THREE.Vector3 - the force to add
Particle.prototype.addForce = function(force) {
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 1 lines of code.
  this.netForce.add(force);
  // ----------- STUDENT CODE END ------------
};

// Perform Verlet integration on this particle with the provided
// timestep deltaT.
// Params:
// * deltaT: Number - the length of time dt over which to integrate
Particle.prototype.integrate = function(deltaT) {
  const DAMPING = SceneParams.DAMPING;

  // ----------- STUDENT CODE BEGIN ------------
  // You need to:
  // (1) Save the old (i.e. current) position into this.previous.
  // (2) Compute the new position of this particle using Verlet integration,
  //     and store it into this.position.
  // (3) Reset the net force acting on the particle (i.e. make it (0, 0, 0) again).
  // ----------- Our reference solution uses 13 lines of code.
  
  var p = new THREE.Vector3(0,0,0).subVectors(this.position, this.previous);
  this.previous = this.position;
  p.multiplyScalar(1-DAMPING);
  p.add(this.position);
  p.add(this.netForce.multiplyScalar(deltaT*deltaT/this.mass));
  this.position = p;
  this.netForce = new THREE.Vector3(0,0,0);
  // ----------- STUDENT CODE END ------------
};

// Handle collisions between this Particle and the provided floor.
// Note: the fields of floor are documented for completeness, but you
//       *WILL NOT* need to use all of them.
// Params:
// * floor: An object representing the floor of the scene, with properties:
//    - mesh: THREE.Mesh - the physical representation in the scene
//    - geometry: THREE.PlaneBufferGeometry - the abstract geometric representation
//    - material: THREE.MeshPhongMaterial - material information for lighting
Particle.prototype.handleFloorCollision = function(floor) {
  let floorMesh = floor.mesh;
  let floorPosition = floorMesh.position;
  const EPS = 3;
  // ----------- STUDENT CODE BEGIN ------------
  // Handle collision of this particle with the floor.
  // ----------- Our reference solution uses 4 lines of code.
  // console.log(this.position.y);
  if (this.position.y < floorPosition.y+EPS) {
    // console.log(this.position.y);
    this.position.y = floorPosition.y + EPS;
  }
  // ----------- STUDENT CODE END ------------
};

// Handle collisions between this Particle and the provided sphere.
// Note: the fields of sphere are documented for completeness, but you
//       *WILL NOT* need to use all of them.
// Params:
// * sphere: An object representing a sphere in the scene, with properties:
//    - mesh: THREE.Mesh - the physical representation in the scene
//    - geometry: THREE.SphereGeometry - the abstract geometric representation
//    - material: THREE.MeshPhongMaterial - material information for lighting
//    - radius: number - the radius of the sphere
//    - position: THREE.Vector3 - the sphere's position in this frame
//    - prevPosition: THREE.Vector3 - the sphere's position in the previous frame
Particle.prototype.handleSphereCollision = function(sphere) {
  if (sphere.mesh.visible) {
    const friction = SceneParams.friction;
    let spherePosition = sphere.position.clone();
    let prevSpherePosition = sphere.prevPosition.clone();
    let EPS = 5; // empirically determined
    // ----------- STUDENT CODE BEGIN ------------
    // Handle collision of this particle with the sphere.
    // As with the floor, use EPS to prevent clipping.
    let posFriction = new THREE.Vector3();
    let posNoFriction = new THREE.Vector3();
    let pos = new THREE.Vector3();
    // ----------- Our reference solution uses 28 lines of code.
    let diffNow = new THREE.Vector3();
    diffNow.subVectors(this.position,spherePosition);
    let diffOld = new THREE.Vector3()
    diffOld.subVectors(this.previous,spherePosition);
    if (diffNow.length()*diffNow.length() >= sphere.radius*sphere.radius) {
    // if (0) {
      return;
    }
    posNoFriction = diffNow.clone();
    posNoFriction.normalize().multiplyScalar(sphere.radius + EPS).add(spherePosition);
    if (diffOld.length()*diffOld.length() >= sphere.radius*sphere.radius) {
      posFriction.addVectors(this.previous,spherePosition.sub(prevSpherePosition));
      this.previous = this.position;
      pos.addVectors(posFriction.multiplyScalar(friction), posNoFriction.multiplyScalar(1-friction));
      this.position = pos;
    }
    else {
      this.previous = this.position;
      this.position = posNoFriction;
    }
    // ----------- STUDENT CODE END ------------
  }
};

// Handle collisions between this Particle and the provided axis-aligned box.
// Note: the fields of box are documented for completeness, but you
//       *WILL NOT* need to use all of them.
// Params:
// * box: An object representing an axis-aligned box in the scene, with properties:
//    - mesh: THREE.Mesh - the physical representation in the scene
//    - geometry: THREE.BoxGeometry - the abstract geometric representation
//    - material: THREE.MeshPhongMaterial - material information for lighting
//    - boundingBox: THREE.Box3 - the bounding box of the box in the scene
Particle.prototype.handleBoxCollision = function(box) {
  if (box.mesh.visible) {
    const friction = SceneParams.friction;
    let boundingBox = box.boundingBox.clone();
    const EPS = 10; // empirically determined
    // ----------- STUDENT CODE BEGIN ------------
    // Handle collision of this particle with the axis-aligned box.
    // As before, use EPS to prevent clipping
    let posFriction = new THREE.Vector3();
    let posNoFriction = new THREE.Vector3();
    // ----------- Our reference solution uses 66 lines of code.
    let pos = new THREE.Vector3(0,0,0);
    let p = this.position.clone();
    if (!boundingBox.containsPoint(p)) {
      return;
    }
    let max = boundingBox.max;
    let min = boundingBox.min;
    let d = max.x - p.x;
    posNoFriction = p.clone();
    posNoFriction.x = max.x + EPS;
    // let d = Math.infinity;

    if (p.x-min.x < d) { 
      posNoFriction = p.clone(); 
      posNoFriction.x = min.x - EPS; 
      d = p.x-min.x;
      // console.log(d,"minx");
    }
    if (p.y-min.y < d) { posNoFriction = p.clone(); posNoFriction.y = min.y - EPS; d = p.y-min.y;}
    if (p.z-min.z < d) { posNoFriction = p.clone(); posNoFriction.z = min.z - EPS; d = p.z-min.z;}
    if (max.y-p.y < d) { posNoFriction = p.clone(); posNoFriction.y = max.y + EPS; d = max.y-p.y;}
    if (max.z-p.z < d) { posNoFriction = p.clone(); posNoFriction.z = max.z + EPS; d = max.z-p.z;}

    if (!boundingBox.containsPoint(this.previous)) {
      posFriction = this.previous;
      pos.addVectors(posFriction.multiplyScalar(friction), posNoFriction.multiplyScalar(1-friction));
      this.previous = p;
      this.position = pos;
    }
    else {
      this.previous = p;
      this.position = posNoFriction;
    }
    // ----------- STUDENT CODE END ------------
  }
};

// ------------------------ Don't worry about this ---------------------------
// Apply the cached correction vector to this particle's position, and
// then zero out the correction vector.
// Particle.prototype.applyCorrection = function() {
//   this.position.add(this.correction);
//   this.correction.set(0,0,0);
// }
