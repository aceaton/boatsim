function Boat(cloth) {
  this.mass = SceneParams.boatMass;

  let boatLoc = new THREE.Vector3(SceneParams.boatCOMx, SceneParams.boatCOMy, 0);//.copy(SceneParams.boatCOM);
  // console.log(boatLoc);
  // console.log(SceneParams.boatCOM);
  let axis = new THREE.Vector3(0, 1, 0);
  // console.log(axis);
  // console.log(-1 * SceneParams.boatAngle / 180 * Math.PI);
  boatLoc.applyAxisAngle(axis, -1 * SceneParams.boatAngle / 180 * Math.PI);
  // console.log(boatLoc);

  this.origin = new THREE.Vector3().copy(boatLoc);
  // center of mass
  this.position = new THREE.Vector3().copy(boatLoc);
  this.previous = new THREE.Vector3().copy(boatLoc);

  this.ang = new THREE.Vector3(boatLoc.x, 0, boatLoc.z);
  this.angVel = new THREE.Vector3(0, 0, 0);

  // total amount of torque ever applied to boat - lets us see water submersion
  this.totalAngAlongBoat = new THREE.Vector3(0, 0, 0).copy(this.ang).normalize();
  this.totalAngOutBoat = new THREE.Vector3(boatLoc.z, 0, -1 * boatLoc.x).normalize();

  this.cloth = cloth;

  this.netForce = new THREE.Vector3(0, 0, 0);
  this.torque = new THREE.Vector3(0, 0, 0);

  // water surface equations for advanced buoyancy
  this.w = SceneParams.waterWidth;
  this.h = SceneParams.waterHeight;
  
  this.waterEq = plane1(this.w,this.h,false);
  this.waterDer = plane1(this.w,this.h,true);
}

Boat.prototype.translate = function (tr) {
  // let toRot = [Scene.boat[0].geometry,Scene.boat[1],Scene.mast.geometry,Scene.boom.geometry];
  let toRot = [Scene.boat.geometry];
  for (obj of toRot) {
    // console.log(obj);
    obj.translate(tr.x, tr.y, tr.z);


  }
  // Scene.boat[0].geometry.translate(tr);
  // Scene.boat[1].translate(tr);
  // Scene.mast.geometry.translate(tr);
  // Scene.boom.geometry.translate(tr);
  this.previous = this.position;
  this.position.add(tr);

  // translate cloth (only bound bits)
  for (particle of this.cloth.particles) {
    if (particle.locked == true) {
      particle.position.add(tr);
    }
  }
}

Boat.prototype.rotate = function (rot) {
  // let toRot = [Scene.boat[0].geometry,Scene.boat[1],Scene.mast.geometry,Scene.boom.geometry];
  let toRot = [Scene.boat.geometry];
  let neg = new THREE.Vector3().copy(this.position).multiplyScalar(-1);
  let ang1 = new THREE.Vector3().copy(rot);
  let xang = ang1.dot(new THREE.Vector3(1, 0, 0));
  let yang = ang1.dot(new THREE.Vector3(0, 1, 0));
  let zang = ang1.dot(new THREE.Vector3(0, 0, 1));
  let mag = ang1.length();
  ang1.normalize();

  for (obj of toRot) {
    // console.log(obj);
    obj.translate(neg.x, neg.y, neg.z);
    obj.rotateX(xang);
    obj.rotateY(yang);
    obj.rotateZ(zang);
    obj.translate(this.position.x, this.position.y, this.position.z);
  }

  for (particle of this.cloth.particles) {
    if (particle.locked == true) {
      particle.position.add(neg);
      particle.position.applyAxisAngle(ang1, mag);
      particle.position.add(this.position);
    }
  }

  this.totalAngAlongBoat.applyAxisAngle(ang1, mag);
  this.totalAngOutBoat.applyAxisAngle(ang1, mag);
  // rotoate cloth (only bound bits)
}

Boat.prototype.applyForcesAndUpdate = function () {
  // // Apply all relevant forces to the cloth's particles
  cloth.applyForces();

  deltaT = 3 * SceneParams.TIMESTEP;

  // For each particle, perform Verlet integration to compute its new position
  let upd = cloth.update(deltaT, this.position);
  //   console.log(upd);
  this.netForce.add(upd[0]);
  this.torque.add(upd[1]);
  // console.log("torguwq ", this.torque);
  //   console.log(this.netForce);

  // apply buoyancy forces along hull length
  if (SceneParams.fancyGround && SceneParams.fancyBuoyancy) {
    this.applyAdvancedBuoyancy();
  }
  else {
    this.applyBuoyancy();
  }
  // apply gravity force
  if (SceneParams.gravity) {
    this.applyGravity();
  }

  this.applyKeelForce();

  // console.log(this.netForce);
  // console.log(this.netForce.multiplyScalar(deltaT*deltaT/this.mass));
  // this.netForce.multiplyScalar(deltaT*deltaT/this.mass);

  //   console.log(this.torque);
  // integration
  const DAMPING = SceneParams.DAMPING;
  var p = new THREE.Vector3(0, 0, 0).subVectors(this.position, this.previous);
  // console.log(p);
  this.previous = this.position;
  p.multiplyScalar(1 - DAMPING);
  p.add(this.position);
  p.add(this.netForce.multiplyScalar(SceneParams.accelMult * deltaT * deltaT / this.mass));
  this.position = p;
  this.netForce = new THREE.Vector3(0, 0, 0);

  // let tr = new THREE.Vector3().subVectors(this.position, this.previous);
  // // console.log(tr);
  // this.translate(tr);
  // //   console.log(tr);

  // apply verlet integration but with angular momentum
  if (SceneParams.torqueOn) {
    var t = new THREE.Vector3().copy(this.angVel);
    t.multiplyScalar(1 - DAMPING);
    t.add(this.torque.multiplyScalar(SceneParams.torqueMult * deltaT * deltaT / SceneParams.rotInertia));

    this.rotate(t);

    this.angVel = t;

    this.torque = new THREE.Vector3(0, 0, 0);
  }

  let tr = new THREE.Vector3().subVectors(this.position, this.previous);
  // console.log(tr);
  this.translate(tr);
}

Boat.prototype.applyBuoyancy = function () {
  // let importantRotAxis = new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3( 0, 1, 0 ), -SceneParams.boatAngle/180*Math.PI+Math.PI/2);
  // let rot = this.totalAng.dot(importantRotAxis)*SceneParams.torqueMult;

  // right now we implement naive buoyancy, later will do it depending on angle of boat
  // right now the angle is locked to only rotate about the axis along the hull

  const GRAVITY = SceneParams.GRAVITY * 50;
  let r = 140;
  let l = 295;
  let depth = -249 - this.position.y + r;

  // distance of COM below the center of the cylinder
  yDisp = SceneParams.boatCOMy + 109;
  // console.log(depth);
  // console.log(this.position);
  if (depth <= 0) return;

  // how much water is displaced using cylinder volume
  let theta = 2 * Math.acos(1 - depth / r);
  let segArea = .5 * r ** 2 * theta - .5 * Math.sin(theta) * r ** 2;
  let v = segArea * l;

  let bForce = new THREE.Vector3(0, SceneParams.waterDensity * v * GRAVITY, 0);

  this.netForce.add(bForce);

  // console.log(bForce.length());

  // adjust torque for inclination of the boat at the time
  let t = new THREE.Vector3().copy(this.totalAngAlongBoat).multiplyScalar(-1 * this.totalAngOutBoat.y);
  t.add(new THREE.Vector3().copy(this.totalAngOutBoat).multiplyScalar(this.totalAngAlongBoat.y));
  t.multiplyScalar(bForce.length() * SceneParams.bTorqueMult);
  this.torque.add(t);
  // console.log("buoyang", t);
}

Boat.prototype.applyAdvancedBuoyancy = function () {
  let u = (this.position.x + this.w/2)/this.w;
  let v = (this.position.z + this.h/2)/this.h;

  let waterHeight = new THREE.Vector3(0,0,0);
  let waterSlope = new THREE.Vector3(0,0,0);

  this.waterEq(u,v,waterHeight);
  this.waterDer(u,v,waterSlope);

  // console.log(waterSlope);
  // console.log(waterHeight.y);
  // console.log(this.position.y);

  const GRAVITY = SceneParams.GRAVITY * 50;
  let r = 140;
  let l = 295;
  let depth = waterHeight.y - this.position.y + r;

  // distance of COM below the center of the cylinder
  yDisp = SceneParams.boatCOMy + 109;
  // console.log(depth);
  // console.log(this.position);
  if (depth <= 0) return;

  // how much water is displaced using cylinder volume
  let theta = 2 * Math.acos(1 - depth / r);
  let segArea = .5 * r ** 2 * theta - .5 * Math.sin(theta) * r ** 2;
  let v1 = segArea * l;

  let bForce = new THREE.Vector3(0, SceneParams.waterDensity * v1 * GRAVITY, 0);

  bForce.multiplyScalar(1);
  this.netForce.add(bForce);
  console.log("depth", depth);

  // console.log(bForce.length());

  // adjust torque for inclination of the boat at the time
  let t = new THREE.Vector3().copy(this.totalAngAlongBoat).multiplyScalar(-1 * this.totalAngOutBoat.y);
  t.add(new THREE.Vector3().copy(this.totalAngOutBoat).multiplyScalar(this.totalAngAlongBoat.y));
  t.multiplyScalar(bForce.length() * SceneParams.bTorqueMult);
  // t.multiplyScalar(.5);
  t.multiplyScalar(.01);
  console.log(this.torque);
  this.torque.add(t);
  console.log("buoyant", t);

  
  // adjust torque for wave slope
  let tAd = new THREE.Vector3(0,0,0).add(new THREE.Vector3(0,0,1).multiplyScalar(waterSlope.x));
  tAd.add(new THREE.Vector3(-1,0,0).multiplyScalar(waterSlope.z));

  let wF = new THREE.Vector3().crossVectors(tAd,new THREE.Vector3(0,1,0));
  console.log(this.netForce);
  this.netForce.add(wF.multiplyScalar(10));
  console.log(wF);
  tAd.multiplyScalar(SceneParams.waveTorque);

  // console.log(this.torque);
  this.torque.add(tAd);
  console.log("tadd", tAd);
}

// Apply a uniform force due to gravity
Boat.prototype.applyGravity = function () {
  const GRAVITY = SceneParams.GRAVITY * 50;

  let forc = new THREE.Vector3(0, -1 * GRAVITY * this.mass, 0);

  if (SceneParams.fancyGround && SceneParams.fancyBuoyancy) {
    forc.multiplyScalar(.2);
    this.netForce.add(forc);
  }
};

Boat.prototype.applyKeelForce = function () {
  // this.torque.add(new THREE.Vector3().copy(this.ang).multiplyScalar(50));
  let f = this.netForce;
  let dir = new THREE.Vector3(this.ang.z, 0, -1 * this.ang.x).normalize();
  let keelForce = dir.multiplyScalar(f.dot(dir) * (1 - SceneParams.slip));
  f.sub(keelForce);
  // console.log(dir);

  // stop the boat from spinning around the keel
  this.torque.y = 0;
}
