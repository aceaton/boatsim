function Boat(ang, cloth) {
    this.mass = SceneParams.boatMass;

    this.cloth = cloth;
    this.ang = ang;

    this.netForce = new THREE.Vector3(0,0,0);
    this.torque = new THREE.Vector3(0,0,0);
}

// Boat.prototype.translate = function() {

// }

Particle.prototype.addForce = function(force) {
    // ----------- STUDENT CODE BEGIN ------------
    // ----------- Our reference solution uses 1 lines of code.
    this.netForce.add(force);
    // ----------- STUDENT CODE END ------------
  };

Boat.prototype.applyForcesAndUpdate = function() {
    // // Apply all relevant forces to the cloth's particles
  cloth.applyForces();

  // For each particle, perform Verlet integration to compute its new position
  let upd = cloth.update(SceneParams.TIMESTEP,this.com);
  this.forces.add(upd[0]);
  this.torque.add(upd[1]);

  // apply buoyancy forces along hull length

  // apply gravity force
  if (SceneParams.gravity) {
    this.applyGravity();
  }
}



// Apply a uniform force due to gravity
Boat.prototype.applyGravity = function() {
    const GRAVITY = SceneParams.GRAVITY;
    
    this.addForce(new THREE.Vector3(0,-1*GRAVITY*this.mass,0));

};

