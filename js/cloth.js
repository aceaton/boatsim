"use strict";

/***************** Important Info on Accessing Cloth Properties **************/
// NOTE: A variety of useful physical constants and properties of the cloth
// are defined for you in `params.js`.
//
// As you change values in the GUI (such as the size of the cloth),
// these changes are automatically populated into the global SceneParams object.
//
// You should treat the SceneParams object as read-only, as mutating its values
// without going through the GUI will have undesirable effects.
//
// We recommend you briefly inspect `params.js` to get a feel for what sorts
// of values are available to you, and what their defaults are.
//
// For example, to use these values in your code you might write:
//      let MASS = SceneParams.MASS;
//      let friction = SceneParams.friction;
//      let fabricLength = SceneParams.fabricLength;
//  ... and so on.

/****************************** HELPER FUNCTIONS ******************************/
// Used to parameterize the cloth's geometry and provide initial positions
// for the particles in the cloth
// Params:
// * width: int - the width of the planar section
// * height: int - the height of the planar section
function plane(width, height) {
  return function(u, v, vec) {
    let x = u * width - width / 2;
    let y = 125;
    let z = v * height - height / 2;
    vec.set(x, y, z);
  };
}

// Our modified cloth - the cloth is a triangle between points p1,p2,p3.
// Let mast be the vector between p2 and p1. v is the distance along the mast from p1, and u is the distance perpendicular to the mast in the p3 direction
function triangle(p1,p2,p3) {
  // v is the distance from the top down
  // u is the distance from the mast out towards p3
  return function(u,v,vec) {
    // console.log(u,v);
    let mast = new THREE.Vector3().subVectors(p2,p1);
    let p3p1 = new THREE.Vector3().subVectors(p3,p1);
    let dotted = mast.clone().multiplyScalar(mast.dot(p3p1));
    let perp = new THREE.Vector3().subVectors(p3p1,dotted);

    vec = p1.clone().add(mast.multiplyScalar(v).add(perp.multiplyScalar(u)));
  }

}

// A higher order function f(u,v,vec) that sets the components of a Vector3 vec
// using the u,v coordinates in a plane.
// let initParameterizedPosition = plane(500,500);
// TODO DEFINE INITIAL LOCATION OF THE CLOTH
let corner1 = new THREE.Vector3(-250,125,-250);
let corner2 = new THREE.Vector3(-250,125,250);
let corner3 = new THREE.Vector3(250,125,-250);
// let initParameterizedPosition = triangle(corner1,corner2,corner3);
let initParametrizedPosition = function(u,v) {
  let pos = new THREE.Vector3();
  let ang = SceneParams.sailAngle/180*Math.pi;
  let len = -v*h/d;
  let p1 = new THREE.Vector3(SceneParams.p1x,SceneParams.p1y,SceneParams.p1z);
  pos = new THREE.Vector3().addVectors(p1,new THREE.Vector3(u*w/d,len*Math.cos(ang),len*Math.sin(ang)));
}

function liftCoeff(angleDegrees) {
  let d = angleDegrees;
  return .004266*d**4 -.10058*d**3 + 1.426*d**2 - 10.54*d + 28.64 - .0001160 * d**5 +.000002075*d**6 - 2.433e-8*d**7 + 1.800e-10*d**8 - 7.626e-13*d**9 + 1.412e-15*d**10;
}

// console.log("20: " + liftCoeff(20));

/***************************** CONSTRAINT *****************************/
function Constraint(p1, p2, distance) {
  this.p1 = p1; // Particle 1
  this.p2 = p2; // Particle 2
  this.distance = distance; // Desired distance
}

Constraint.prototype.enforce = function() {
  // ----------- STUDENT CODE BEGIN ------------
  // Enforce this constraint by applying a correction to the two particles'
  // positions based on their current distance relative to their desired rest
  // distance.
  // ----------- Our reference solution uses 10 lines of code.
  var vAB = new THREE.Vector3(0,0,0);
  vAB.subVectors(this.p2.position, this.p1.position);
  var diff = vAB.length() - this.distance;
  var vCorr = new THREE.Vector3(0,0,0);
  vCorr = vAB.multiplyScalar(.5*diff/vAB.length());
  this.p1.position.add(vCorr);
  this.p2.position.sub(vCorr);
  // ----------- STUDENT CODE END ------------
};

/****************************** CLOTH ******************************/
// Cloth constructor
// Parameters:
//   w: (int) number of segments width-wise
//   h: (int) number of segments height-wise
//   l: (int) actual length of the square cloth
//
// A cloth has the following properties:
//   this.w: (int) number of segments width-wise
//   this.h: (int) number of segments height-wise
//   this.constraints: (Constraints[]) list of Constraint objects
//      that constrain distances between some 2 particles in the cloth
//   this.particles: (Particles[]) list of Particle objects that make up the cloth
//
// NOTE: A cloth is a 2d grid of particles ranging from (0,0) to (w,h) *inclusive*.
//       This means that the grid of particles is [w+1 x h+1], NOT [w x h].
function Cloth(w, h, l) {
  // Internal helper function for computing 1D index into particles list
  // from a particle's 2D index
  function index(u, v) {
    return u + v * (w + 1);
  }
  this.index = index;

  // Width and height
  this.w = w;
  this.h = h;

  // Resting distances
  this.restDistance = SceneParams.fabricLength / this.w; // for adjacent particles
  this.restDistanceB = 2; // multiplier for 2-away particles
  this.restDistanceS = Math.sqrt(2);

  // Empty initial lists
  let particles = [];
  let constraints = [];

  let d = SceneParams.d;
  let height = SceneParams.sailHeight;
  let width = SceneParams.sailWidth;

  // let p1 = SceneParams.p1;
  let p1 = new THREE.Vector3(SceneParams.p1x,SceneParams.p1y,SceneParams.p1z);

  // Create particles
  for (let v = 0; v <= h; v++) {
    for (let u = 0; u <= v; u++) {
      particles.push(new Particle(p1.x+u*width/w, p1.y-v*height/h, 0, SceneParams.MASS));
    }
  }

  // // Add constraints
  // for (let v = 0; v <= h; v++) {
  //   for (let u = 0; u <= v; u++) {

  //   }
  // }

  // Edge constraints
  let rconstraints = [];

  for (let v = 0; v <= h; v++) {
    for (let u = 0; u <= v; u++) {
      if (v < h && (u == 0 || u == w)) {
        constraints.push(
          new Constraint(particles[index(u, v)], particles[index(u, v + 1)], this.restDistance)
        );
      }

      if (u < w && (v == 0 || v == h)) {
        constraints.push(
          new Constraint(particles[index(u, v)], particles[index(u + 1, v)], this.restDistance)
        );
      }
    }
  }

  // Structural constraints
  if (SceneParams.structuralSprings) {
    // ----------- STUDENT CODE BEGIN ------------
    // Add structural constraints between particles in the cloth to the list of constraints.
    // ----------- Our reference solution uses 15 lines of code.
    for (let v = 0; v < h; v++) {
      for (let u = 1; u < w; u++) {
        constraints.push(
          new Constraint(particles[index(u, v)], particles[index(u, v + 1)], this.restDistance)
        );
      }
    }
    for (let v = 1; v < h; v++) {
      for (let u = 0; u < w; u++) {
        constraints.push(
          new Constraint(particles[index(u, v)], particles[index(u+1, v)], this.restDistance)
        );
      }
    }
    // ----------- STUDENT CODE END ------------
  }

  // Shear constraints
  if (SceneParams.shearSprings) {
    // ----------- STUDENT CODE BEGIN ------------
    // Add shear constraints between particles in the cloth to the list of constraints.
    // ----------- Our reference solution uses 21 lines of code.
    for (let v = 0; v < h; v++) {
      for (let u = 0; u < w; u++) {
        constraints.push(
          new Constraint(particles[index(u,v)], particles[index(u+1, v+1)], this.restDistance*this.restDistanceS)
        );
        constraints.push(
          new Constraint(particles[index(u+1,v)], particles[index(u, v+1)], this.restDistance*this.restDistanceS)
        );
      }
    }
    // ----------- STUDENT CODE END ------------
  }

  // Bending constraints
  if (SceneParams.bendingSprings) {
    // ----------- STUDENT CODE BEGIN ------------
    // Add bending constraints between particles in the cloth to the list of constraints.
    // ----------- Our reference solution uses 23 lines of code.
    for (let v = 0; v < h-1; v++) {
      for (let u = 0; u <= w; u++) {
        constraints.push(
          new Constraint(particles[index(u, v)], particles[index(u, v + 2)], this.restDistance*this.restDistanceB)
        );
      }
    }
    for (let v = 0; v <= h; v++) {
      for (let u = 0; u < w-1; u++) {
        constraints.push(
          new Constraint(particles[index(u, v)], particles[index(u+2, v)], this.restDistance*this.restDistanceB)
        );
      }
    }
    // ----------- STUDENT CODE END ------------
  }

  // Store the particles and constraints lists into the cloth object
  this.particles = particles;
  this.constraints = constraints;

  // Register an event handler to make the cloth react to your keypresses.
  // Don't double register if this handler has already been set up.
  // BUG: Remove this check - will invoke on wrong cloth obj
  if (!Cloth.eventHandlerRegistered) {
    // ----------- STUDENT CODE BEGIN ------------
    // Add a listener for key press events.
    // The listener should invoke `cloth.handleImpactEvents`, which you
    // will complete elsewhere in this file.
    //
    // The `onMouseMove`, `onWindowResize`, and `Renderer.init` functions
    // in `render.js` may serve as a useful guide.
    // ----------- Our reference solution uses 1 lines of code.
    document.addEventListener("keydown", handleImpactEvents, false);
    // ----------- STUDENT CODE END ------------
    Cloth.eventHandlerRegistered = true;
    
  }
}

// Return the Particle that the mouse cursor is currently hovering above,
// or return null if the cursor is not over the canvas.
Cloth.prototype.getLookedAtParticle = function() {
  // Shoot a ray into the scene and see what it hits, just like in A3!
  let intersects = Renderer.raycaster.intersectObjects(Scene.scene.children);

  // Check all of the objects the ray intersects.
  // If one is the cloth, find an arbitrary particle on the face that was hit.
  for (let intersect of intersects) {
    if (intersect.object === Scene.cloth.mesh) {
      let i = intersect.face.a;
      // console.log(this);
      let particle = this.particles[i];
      return particle;
    }
  }

  // The ray didn't run into any faces of the cloth.
  return null;
}

// Handler for impact events generated by the keyboard.
// When a certain key on the keyboard is pressed, apply a small impulse to the
// cloth at the location of the mouse cursor.
//
// We recommend binding each of the four arrow keys to a different directional
// impulse, but you are welcome to get creative if you'd like to have more
// complicated effects, or use different keys.
// Be sure to document your implementation and keybindings in the writeup.
//
// Params:
// * evt: event - The keypress event that led to this function call.
//
//  Note: your browser's event handling framework will automatically
//       invoke this function with the correct argument so long as you
//       registered the handler correctly in the Cloth constructor.
function handleImpactEvents(event) {
  // Ignore keypresses typed into a text box
  // console.log(event);
  if (event.target.tagName === "INPUT") { return; }

  // The vectors tom which each key code in this handler maps. (Change these if you like)
  const keyMap = {
    ArrowUp: new THREE.Vector3(0,  1,  0),
    ArrowDown: new THREE.Vector3(0,  -1,  0),
    ArrowLeft: new THREE.Vector3(-1,  0,  0),
    ArrowRight: new THREE.Vector3(1,  0,  0),
};

  // The magnitude of the offset produced by this impact.
  // this number was chosen to look well in the absence of gravity.
  // It looks especially cool if you start turning off spring constraints.
  const scale = 30; // the magnitude of the offset produced by this impact.

  // ----------- STUDENT CODE BEGIN ------------
  // (1) Check which key was pressed. If it isn't the triggering key, do nothing.
  // (2) Shoot a ray into the scene to determine what point is being looked at.
  //     (You may find the `cloth.getLookedAtParticle()` function useful).
  // (3) Calculate a position offset based on the directional key pressed.
  //     Scale the offset proportional to scale.
  // (4) Update the particle's position based on the offset.

  // Uncomment this line to inspect the fields of event in more detail:
  // debugger;
  // console.log(event.key);

  // ----------- Our reference solution uses 8 lines of code.
  var offset = new THREE.Vector3(0,0,0);
  var importantKey = false;
  if (event.key in keyMap) {
    offset = keyMap[event.key];
    importantKey = true;
  }

  if (event.key === 'x') {
    let s = 100;
    var parts = cloth.particles;
    for (let i = 0; i < parts.length; i++) {
      parts[i].position.z += Math.random()*s*2 - s;
    }
  }

  if (!importantKey) {return;}
  
  var part = cloth.getLookedAtParticle();
  offset.multiplyScalar(scale);

  part.position.x += offset.x;
  part.position.y += offset.y;
  part.position.z += offset.z;

  // ----------- STUDENT CODE END ------------
}

// ***************************************************************
// *                     Forces & Impulses
// ***************************************************************

// Apply a uniform force due to gravity to all particles in the cloth
Cloth.prototype.applyGravity = function() {
  let particles = this.particles;
  const GRAVITY = SceneParams.GRAVITY;
  // ----------- STUDENT CODE BEGIN ------------
  // For each particle in the cloth, apply force due to gravity.
  // ----------- Our reference solution uses 4 lines of code.
  for (let i = 0; i < particles.length; i++) {
    particles[i].addForce(
      new THREE.Vector3(0,-1*GRAVITY*particles[i].mass,0)
    );
  }
  // ----------- STUDENT CODE END ------------
};

// Oscllate one edge of the cloth up and down with the specified
// amplitude and frequency, while fixing the opposing edge in place.
//
// Useful for debugging constraints.
//
// Params:
// * amplitude: Number - the amplitude of oscillation (in units)
// * frequency: Number - the frequency of oscillation (in Hz/2pi)
Cloth.prototype.applyWave = function(amplitude, frequency) {
  let f = frequency / 1000;
  let y = amplitude * Math.sin(f * time);
  let offset = new THREE.Vector3(0,y,0);

  // Move the last row of cloth up and down.
  for (let i = 0; i <= this.w; i++) {
    let particle = this.particles[this.index(0, i)];
    particle.previous.addVectors(particle.original, offset);
    particle.position.addVectors(particle.original, offset);
  }

  // Grow/shrink the poles to match
  let oldHeight = Scene.poles.height;
  let newHeight = oldHeight + y;
  let ratio = newHeight / oldHeight;
  Scene.poles.meshes[3].scale.y = ratio;
  Scene.poles.meshes[0].scale.y = ratio;
}

// For each face in the cloth's geometry, apply a wind force.
//
// Params:
// * windStrength: number - the strength of the wind. Larger = stronger wind.
//        The precise implementation details of how to use this parameter are
//        intentionally left for you to decide upon.
Cloth.prototype.applyWind = function(windStrength) {
  let particles = this.particles;
  // ----------- STUDENT CODE BEGIN ------------
  // Here are some dummy values for a relatively boring wind.
  //
  // Try making it more interesting by making the strength and direction
  // of the wind vary with time. You can use the global variable `time`,
  // which stores (and is constantly updated with) the current Unix time
  // in milliseconds.
  //
  // One suggestion is to use sinusoidal functions. Play around with the
  // constant factors to find an appealing result!
  let windForce = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(windStrength);

  // ----------- Our reference solution uses 6 lines of code.
  let newStrength = Math.sin(time/1000)*10;
  // console.log(newStrength);
  let st = 10;
  // windForce.multiplyScalar(newStrength);
  windForce.x *= Math.sin(time/1000)*st;
  windForce.y *= Math.sin(time/340)*st;
  windForce.z *= Math.sin(time/534)*st;

  // ----------- STUDENT CODE END ------------

  // Apply the wind force to the cloth particles
  let faces = Scene.cloth.geometry.faces;
  for (let face of faces) {
    let normal = face.normal;
    let tmpForce = normal
      .clone()
      .normalize()
      .multiplyScalar(normal.dot(windForce));
    particles[face.a].addForce(tmpForce);
    particles[face.b].addForce(tmpForce);
    particles[face.c].addForce(tmpForce);
  }
};

// For each face in the cloth's geometry, apply a rain impulse.
// Impulses represent a sudden strike to the cloth, rather than a sustained force.
//
// As such, the "rain force" is not a true force, and doesn't need to be
// considered during net force calculations. Instead, you can think of the
// rain impulse as a sudden change to the position of affected particles,
// which will be corrected over time by the constraints of the cloth.
//
// Hint: You may find Sim.randomCoord() useful.
//
// Params:
// * strength: number - a scalar multiplier for the strength of raindrop impact
// * rate: number - the number of raindrop impacts to simulate in a given frame
Cloth.prototype.applyRain = function(strength, rate) {
  let particles = this.particles;

  // (1) For each of the `rate` raindrops,
  //    (i)    Compute a random impact location
  //    (ii)   Add an impulse to that raindrop's position
  //    (iii)  Add a weakened impulse to nearby raindrops
  // ----------- STUDENT CODE BEGIN ------------

  // ----------- Our reference solution uses 21 lines of code.
  for (let i = 0; i < rate; i++) {
    let u = Math.floor(Math.random()*(this.w-1))+1;
    let v = Math.floor(Math.random()*(this.h-1))+1;
    this.particles[this.index(u,v)].position.y -= strength;
    this.particles[this.index(u+1,v)].position.y -= strength/2;
    this.particles[this.index(u-1,v)].position.y -= strength/2;
    this.particles[this.index(u,v+1)].position.y -= strength/2;
    this.particles[this.index(u,v-1)].position.y -= strength/2;
    this.particles[this.index(u+1,v+1)].position.y -= strength/3;
    this.particles[this.index(u-1,v+1)].position.y -= strength/3;
    this.particles[this.index(u+1,v-1)].position.y -= strength/3;
    this.particles[this.index(u-1,v-1)].position.y -= strength/3;
  }
  // ----------- STUDENT CODE END ------------
}


// Implement your own custom force, and apply it to some (or all) of the
// particles in the cloth.
//
// You can make it vary as a function of time, space, or any other parameters
// that you can dream up.
//
// Params:
// * strength: number - a strength parameter. Use it however you like, or ignore it!
// * rate: number - a rate parameter. Use it however you like, or ignore it!
Cloth.prototype.applyCustom = function(strength, rate) {
  let particles = this.particles;

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 36 lines of code.
  // ----------- STUDENT CODE END ------------
}

// Wrapper function that calls each of the other force-related
// functions, if applicable. Additional forces in the simulation
// should be added here.
Cloth.prototype.applyForces = function() {
  if (SceneParams.gravity) {
    this.applyGravity();
  }
  if (SceneParams.wind) {
    this.applyWind(SceneParams.windStrength);
  }
  if (SceneParams.rain) {
    this.applyRain(SceneParams.rainStrength, SceneParams.rainRate);
  }
  if (SceneParams.wave) {
    this.applyWave(SceneParams.waveAmp, SceneParams.waveFreq);
  }
  if (SceneParams.customForce) {
    this.applyCustom(SceneParams.customFStrength, SceneParams.customFRate);
  }
};

Cloth.prototype.update = function(deltaT) {
  if (!SceneParams.integrate) return;
  let particles = this.particles;
  // ----------- STUDENT CODE BEGIN ------------
  // For each particle in the cloth, have it update its position
  // by calling its integrate function.
  // ----------- Our reference solution uses 3 lines of code.
  for (let i = 0; i < particles.length; i++) {
    particles[i].integrate(deltaT);
  }
  // ----------- STUDENT CODE END ------------
};

// ***************************************************************
// *                 Collisions & Constraints
// ***************************************************************

Cloth.prototype.handleCollisions = function() {
  let particles = this.particles;

  let floor  = Scene.ground;
  let sphere = Scene.sphere;
  let box    = Scene.box;
  // ----------- STUDENT CODE BEGIN ------------
  // For each particle in the cloth, call the appropriate function(s)
  // for handling collisions with various objects.
  //
  // Edit this function as you implement additional collision-detection functions.
  // ----------- Our reference solution uses 5 lines of code.
  for (let i = 0; i < particles.length; i++) {
    particles[i].handleFloorCollision(floor);
    particles[i].handleBoxCollision(box);
    particles[i].handleSphereCollision(sphere);
  }
  // ----------- STUDENT CODE END ------------
};

Cloth.prototype.enforceConstraints = function() {
  let constraints = this.constraints;
  // ----------- STUDENT CODE BEGIN ------------
  // Enforce all constraints in the cloth.
  // ----------- Our reference solution uses 3 lines of code.
  // for (let c = 0; c < constraints.length; c++) {
  //   constraints[c].enforce();
  // }
  // ----------- STUDENT CODE END ------------
};


Cloth.prototype.createConstraintLinesInScene = function() {
  let constraints = this.constraints;
  let group = new THREE.Group();
  // create constraint lines if not already created
  if (!Scene.cloth.constraints) {
    let objs = [];
    for (let c of constraints) {
      let obj = Scene.createConstraintLine(c)
      objs.push(obj);
      group.add(obj.mesh);
    }
    Scene.cloth.constraints = {
      array: objs,
      group: group,
    };
    Scene.scene.add(group);
  }
}

// Handle self intersections within the cloth by repelling any
// pair of particles back towards a natural rest distance.
// This should be similar to how constraints are enforced to keep
// particles close to each other, but in the opposite direction.
//
// A naive approach can do this in quadratic time.
// For additional credit, try optimizing this further and showing us
// the fps improvements that you achieve with your optimizations!
//
// Possible optimization ideas, in order of increasing difficutly:
//  (1) Implement a heuristic collision detection scheme, such as:
//  (1a)    Assume a particle will only ever self-intersect with nearby
//          particles. Check for self-intersections only in a K-sized window
//          around a given point, in terms of the 2D cloth coordinates.
//  (1b)    Implement a nondeterministic collision detection scheme by
//          randomly enforcing only a subset of the self-intersection constraints
//          at each time step.
//  (2) Use spatial hashing to efficiently check for collisions only against
//      points that are nearby in 3D space. To do this:
//      (i) Segment 3D space into several cubic "chunks"
//            (similar to the checkerbooard material from A3).
//      (ii) Create a mapping from each chunk to the particles within it at
//           the current time step.
//      (iii) Check for collisions only between a particle and all other
//            particles that are within that bin.
//      (iv) Bonus: There are interesting corner cases where two bins meet.
//           For example, two adjacent particles may end up each in a different
//           bin, and we'd like to make sure they don't intersect either.
//           Find a creative way of resolving these corner cases.
Cloth.prototype.handleSelfIntersections = function() {

  let particles = this.particles;

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 20 lines of code.
  for (let i = 0; i < particles.length; i++) {
    for (let j = 0; j < particles.length; j++) {
      if (i!==j) {
      let d = new THREE.Vector3(0,0,0);
      d.subVectors(particles[i].position,particles[j].position);
      let thresh = cloth.restDistance;
      if (d.length() < thresh) {
        // console.log(d.length());
        let dif  = thresh-d.length();
        d.normalize().multiplyScalar(dif/2);
        particles[i].position.add(d);
        particles[j].position.sub(d);
      }
    }
    }
  }
  // ----------- STUDENT CODE END ------------
};
