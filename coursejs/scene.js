"use strict";

var Scene = Scene || {};

Scene.init = function() {
  Scene.loader = new THREE.TextureLoader();


  // Make a canvas to draw your simulation on
  Scene.container = Scene.buildContainer();
  Scene.stats = Scene.buildStats();

  // scene (First thing you need to do is set up a scene)
  Scene.scene = Scene.buildScene();

  // camera (Second thing you need to do is set up the camera)
  Scene.camera = Scene.buildCamera();

  // renderer (Third thing you need is a renderer)
  Scene.renderer = Scene.buildRenderer();

  // controls, so we can look around
  Scene.controls = Scene.buildControls();

  // lights (fourth thing you need is lights)
  Scene.lights = Scene.buildLights();

  // Now fill the scene with objects
  if (SceneParams.fancyGround) {
    Scene.ground = Scene.buildWater();
    
  }
  else {
    Scene.ground = Scene.buildGround();
  }
  Scene.ground.geometry.dynamic = true;

  Scene.cloth  = Scene.buildCloth();
  // Scene.mast  = Scene.buildMast();
  // Scene.boom = Scene.buildBoom();
  Scene.sphere = Scene.buildSphere();
  Scene.box    = Scene.buildBox();
  Scene.arrow = Scene.buildArrow(0);
  Scene.arrow = Scene.buildArrow(SceneParams.windDirection);
  Scene.boat = Scene.buildBoat();
  
  // Scene.keel = Scene.buildKeel();

  Scene.update();
}

Scene.buildContainer = function() {
  let container = document.createElement("div");
  document.body.appendChild(container);

  return container;
}

Scene.buildStats = function() {
  // This gives us stats on how well the simulation is running
  let stats = new Stats();
  Scene.container.appendChild(stats.domElement);

  return stats;
}

Scene.buildScene = function() {
  let scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcce0ff, 500,20000);

  return scene;
}

Scene.buildCamera = function() {
  let camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.y = 450;
  camera.position.z = 1500;
  Scene.scene.add(camera);

  return camera;
}

Scene.buildRenderer = function() {
  let renderer = new THREE.WebGLRenderer({
    antialias: true,
    devicePixelRatio: 1,
    preserveDrawingBuffer: true, // save drawing frames for screenshots
   });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(Scene.scene.fog.color);

  Scene.container.appendChild(renderer.domElement);
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMap.enabled = true;

  return renderer;
}

// mouse controls (so you can look around the scene)
Scene.buildControls = function() {
  // controls = new THREE.TrackballControls(camera, renderer.domElement);
  let controls = new THREE.OrbitControls(Scene.camera, Scene.renderer.domElement);
  controls.update();

  return controls;
}

Scene.buildLights = function() {
  let light = new THREE.DirectionalLight(0xdfebff, 1.75);
  Scene.scene.add(new THREE.AmbientLight(0x666666));
  light.position.set(50, 200, 100);
  light.position.multiplyScalar(1.3);
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;

  // If cloth shadows are getting clipped, then d must be a larger number
  let d = 350;
  light.shadow.camera.left = -d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;
  light.shadow.camera.far = 1000;

  Scene.scene.add(light);
  return light;
}

Scene.buildWater = function() {
  let ground = {};
  ground.textures = {};

  // ground material
  ground.material = new THREE.MeshPhysicalMaterial({
    color: 0xaa0000,//1ca3ec,//0x404761, //0x3c3c3c,
    // specular: 0x404761, //0x3c3c3c//,
    metalness: 0.3,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
    opacity: .7
  });
  
  // adapted from caio's water material
//   ground.material = new THREE.MeshPhysicalMaterial({
//     // clearcoat: 1,
//     // clearcoatRoughness: 0.1,
//     // transmission: .4,
//     // ior: .1,
//     // reflectivity: .7,
//     roughness: 0.5,
//     opacity: .7,
//     color: 0x0010ff,
//     side: THREE.DoubleSide,
//     // envMap: envMap,
//     // bumpMap: bumpTexture,
//     transparent: true,
//     color: 0x1ca3ec
// });

  // ground mesh
  ground.geometry = new THREE.ParametricGeometry(initWaterParameterizedPosition, SceneParams.waterSize, SceneParams.waterSize);
  // console.log(ground.geometry);
  // ground.m.updateMatrix();
  ground.mesh = new THREE.Mesh(ground.geometry, ground.material);
  // ground.mesh.position.y = SceneParams.groundY - 1;
  // ground.mesh.rotation.x = -Math.PI / 2;
  ground.mesh.receiveShadow = true;

  // handled in Scene.updateGroundTexture()
  // needed for ground texture
  // ground.texture = Scene.loader.load( "textures/terrain/grasslight-big.jpg" );
  // ground.texture.wrapS = ground.texture.wrapT = THREE.RepeatWrapping;
  // ground.texture.repeat.set( 25, 25 );
  // ground.texture.anisotropy = 16;
  // ground.material.map = ground.texture;


  Scene.scene.add(ground.mesh); // add ground to scene

  return ground;
}

Scene.buildCloth = function() {
  // every thing in our world needs a material and a geometry
  // cloth material
  // this tells us the material's color, how light reflects off it, etc.
  let cloth = {};
  cloth.material = new THREE.MeshPhongMaterial({
    color: 0xaa2929,
    specular: 0x030303,
    wireframeLinewidth: 2,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
  });

  // cloth geometry
  // the geometry contains all the points and faces of an object
  // cloth.geometry = new THREE.ParametricGeometry(initParameterizedPosition, SceneParams.xSegs, SceneParams.ySegs);
  
  cloth.geometry = new THREE.Geometry();
  
  let g = cloth.geometry;

  // make the triangle as the initial geometry;
  // using w and h as width and height, p1 as initial point (top of sail), and d as number of divisions (like xSegs);
  // g.vertices.push(new THREE.Vector3().copy(p1));
  // let lastRow = [0];
  let c = 0;
  let d = SceneParams.d;
  let h = SceneParams.sailHeight;
  let w = SceneParams.sailWidth;
  // let p1 = SceneParams.p1;
  let p1 = new THREE.Vector3(SceneParams.p1x,SceneParams.p1y,SceneParams.p1z);
  for (let i = 0; i <= d; i++) {
    for (let j = 0; j <= i; j++) {
      let len = -i*h/d;
      let ang = SceneParams.sailAngle/180*Math.PI;
      g.vertices.push(new THREE.Vector3().addVectors(p1,new THREE.Vector3(j*w/d,len*Math.cos(ang),len*Math.sin(ang))));
      // console.log(SceneParams.p1);
      // console.log(SceneParams.d);
      // console.log(SceneParams.sailheight);
      // console.log(j*w/d,-i*h/d,0);
      // console.log(g.vertices.slice(-1)[0]);
      
      if (i>0 && j>0) {
        // add normal triangle
        // console.log(c);
        // console.log(i,j);
        g.faces.push(new THREE.Face3(c,c-1,c-1-i));
        if (i>1 && j<d && j<i) {
          // add other direction triangle 
          g.faces.push(new THREE.Face3(c,c-i-1,c-i));
        }
      }
      c++;
    }
  }
  g.computeBoundingSphere();
  cloth.geometry.dynamic = true;
  // console.log(cloth.geometry);
  // console.log(g);

  // cloth mesh
  // a mesh takes the geometry and applies a material to it
  // so a mesh = geometry + material
  cloth.mesh = new THREE.Mesh(cloth.geometry, cloth.material);
  cloth.mesh.position.set(0, 0, 0);
  cloth.mesh.castShadow = true;

  cloth.textures = {};

  // Handled by Scene.buildClothTexture()
  // this part allows us to use an image for the cloth texture
  // can include transparent parts
  // cloth.texture = Scene.loader.load( "textures/patterns/circuit_pattern.png" );
  //cloth.texture = Scene.loader.load("textures/patterns/420club.png");
  //console.log(cloth.texture);
  //cloth.texture.wrapS = cloth.texture.wrapT = THREE.RepeatWrapping;
  //cloth.texture.anisotropy = 16;
  //cloth.material.map = cloth.texture;
  
  // more stuff needed for the texture
  var uniforms = { texture:  { type: "t", value: cloth.texture } };
  var vertexShader = document.getElementById( 'vertexShaderDepth' ).textContent;
  var fragmentShader = document.getElementById( 'fragmentShaderDepth' ).textContent;
  
  // more stuff needed for texture
  cloth.mesh.customDepthMaterial = new THREE.ShaderMaterial( {
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide
  } );

  // whenever we make something, we need to also add it to the scene
  Scene.scene.add(cloth.mesh); // add cloth to the scene
  // console.log(cloth.geometry.vertices);
  return cloth;
}

Scene.buildSphere = function() {
  let sphere = {};
  sphere.radius = SceneParams.sphereRadius;
  sphere.geometry = new THREE.SphereGeometry(sphere.radius, 20, 20);
  // sphere material
  sphere.material = new THREE.MeshPhongMaterial({
    color: 0xaaaaaa,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.15, // clipping is an issue, so set low opacity
  });

  // sphere mesh
  sphere.mesh = new THREE.Mesh(sphere.geometry, sphere.material);
  sphere.mesh.castShadow = true;
  sphere.mesh.receiveShadow = true;

  let pos = new THREE.Vector3(0, -250 + sphere.radius, 0);
  sphere.mesh.position.copy(pos);
  sphere.position = pos.clone();
  sphere.prevPosition = pos.clone();

  Scene.scene.add(sphere.mesh); // add sphere to scene
  return sphere;
}

Scene.buildGround = function() {
  let ground = {};
  ground.textures = {};

  // ground material
  ground.material = new THREE.MeshStandardMaterial({
    color: 0x404761, //0x3c3c3c,
    // specular: 0x404761, //0x3c3c3c//,
    metalness: 0.3,
  });

  // ground mesh
  ground.geometry = new THREE.PlaneBufferGeometry(20000, 20000)
  ground.mesh = new THREE.Mesh(ground.geometry, ground.material);
  ground.mesh.position.y = SceneParams.groundY - 1;
  ground.mesh.rotation.x = -Math.PI / 2;
  ground.mesh.receiveShadow = true;

  // handled in Scene.updateGroundTexture()
  // needed for ground texture
  // ground.texture = Scene.loader.load( "textures/terrain/grasslight-big.jpg" );
  // ground.texture.wrapS = ground.texture.wrapT = THREE.RepeatWrapping;
  // ground.texture.repeat.set( 25, 25 );
  // ground.texture.anisotropy = 16;
  // ground.material.map = ground.texture;

  Scene.scene.add(ground.mesh); // add ground to scene

  return ground;
}

Scene.buildMast = function() {
  /* let poles = {};
  poles.height = 250 + 125;
  poles.meshes = [];
  poles.geometry = new THREE.BoxGeometry(5, poles.height, 5);
  // Position the poles on the "floor" of their coordinate space
  poles.geometry.translate(0,(250+125)/2,0);
  poles.material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    specular: 0x111111,
    shininess: 100,
    side: THREE.DoubleSide,
  });

  let mesh1 = new THREE.Mesh(poles.geometry, poles.material);
  mesh1.position.x = -250;
  mesh1.position.z = 250;
  mesh1.position.y = SceneParams.groundY;
  mesh1.receiveShadow = false;
  mesh1.castShadow = false;
  poles.meshes.push(mesh1);
  Scene.scene.add(mesh1);

  let mesh2 = new THREE.Mesh(poles.geometry, poles.material);
  mesh2.position.x = 250;
  mesh2.position.z = 250;
  mesh2.position.y = SceneParams.groundY;
  mesh2.receiveShadow = false;
  mesh2.castShadow = false;
  poles.meshes.push(mesh2);
  Scene.scene.add(mesh2);

  let mesh3 = new THREE.Mesh(poles.geometry, poles.material);
  mesh3.position.x = 250;
  mesh3.position.z = -250;
  mesh3.position.y = SceneParams.groundY;
  mesh3.receiveShadow = false;
  mesh3.castShadow = false;
  poles.meshes.push(mesh3);
  Scene.scene.add(mesh3);

  let mesh4 = new THREE.Mesh(poles.geometry, poles.material);
  mesh4.position.x = -250;
  mesh4.position.z = -250;
  mesh4.position.y = SceneParams.groundY;
  mesh4.receiveShadow = false;
  mesh4.castShadow = false;
  poles.meshes.push(mesh4);
  Scene.scene.add(mesh4); */

  let mastGeo = {};
  mastGeo.height = 630;
  mastGeo.meshes = [];
  mastGeo.geometry = new THREE.BoxGeometry(10, mastGeo.height, 5);
  // Position the poles on the "floor" of their coordinate space
  mastGeo.geometry.translate(0,630/2,0);
  mastGeo.material = new THREE.MeshPhongMaterial({
    color: 0x333333,//0xffffff,
    specular: 0x111111,
    shininess: 100,
    side: THREE.DoubleSide,
  });


  let mast = new THREE.Mesh(mastGeo.geometry, mastGeo.material);
  mast.position.x = 0;
  mast.position.z = 0;
  mast.position.y = -249 + 120;
  mast.receiveShadow = true;
  mast.castShadow = true;
  mastGeo.meshes.push(mast);
  Scene.scene.add(mast);

  return mastGeo;
}

Scene.buildBoat = function() {
  var boatGeo = {};
  boatGeo.meshes = [];

  let mainHullGeo = {};
  mainHullGeo.meshes = [];
  mainHullGeo.centerwidth = 163;
  mainHullGeo.sternwidth = 140;
  mainHullGeo.mainLength = 295;
  mainHullGeo.radialSegments = 8;
  mainHullGeo.thetaLength = Math.PI;
  
  mainHullGeo.geometry = new THREE.CylinderGeometry(mainHullGeo.centerwidth, mainHullGeo.sternwidth, mainHullGeo.mainLength, mainHullGeo.radialSegments, 1, false, 0, mainHullGeo.thetaLength);
  // var geometry = new THREE.CylinderGeometry(100,100,150, 8, 1, false, 0, Math.PI);
  mainHullGeo.geometry.rotateZ(-Math.PI/2);
  mainHullGeo.geometry.rotateY(Math.PI);
  mainHullGeo.geometry.translate((mainHullGeo.mainLength / 2),0,0);
  mainHullGeo.geometry.rotateY(-Math.PI/180*SceneParams.boatAngle);
  
  // mainHullGeo.material = ;
  let mat = new THREE.MeshPhongMaterial({
    color: 0x333333,//0xffffff,
    specular: 0x111111,
    shininess: 100,
    side: THREE.DoubleSide,
    opacity: 0.15, // clipping is an issue, so set a low opacity
  });

  let mainHull = new THREE.Mesh(mainHullGeo.geometry, mat);
  mainHull.position.x = 0;
  mainHull.position.z = 0;
  mainHull.position.y = -249 + 140;
  // mainHull.receiveShadow = true;
  // mainHull.castShadow = true;
  boatGeo.meshes.push(mainHull);
  // Scene.scene.add(mainHull);

  // the bow

  // inspired by https://github.com/AlexP11223/Three.js_IslandCastle
  var bowGeo = new THREE.ConeGeometry(mainHullGeo.centerwidth, 125, mainHullGeo.radialSegments, 1, false, 0, mainHullGeo.thetaLength);
  bowGeo.rotateY(Math.PI);
  
  bowGeo.rotateZ(Math.PI/2);
  bowGeo.translate(-(125 / 2),0,0);
  bowGeo.rotateY(-Math.PI/180*SceneParams.boatAngle);
  
  
  let bow = new THREE.Mesh(bowGeo, mat);
  bow.position.x = 0;
  bow.position.z = 0;
  bow.position.y = -249 + 140;
  bow.receiveShadow = true;
  bow.castShadow = true;
  boatGeo.meshes.push(bow);
  // mainHull.add(bow);
  // Scene.scene.add(bow);

  let mastGeo = {};
  mastGeo.height = 630;
  mastGeo.meshes = [];
  mastGeo.geometry = new THREE.BoxGeometry(10, mastGeo.height, 5);
  // Position the poles on the "floor" of their coordinate space
  mastGeo.geometry.translate(0,630/2,0);


  let mast = new THREE.Mesh(mastGeo.geometry, mat);
  mast.position.x = 0;
  mast.position.z = 0;
  mast.position.y = -249 + 120;
  mast.receiveShadow = true;
  mast.castShadow = true;
  boatGeo.meshes.push(mast);
  // Scene.scene.add(mast);

  let boomGeo = {};
  boomGeo.length = 240;
  boomGeo.meshes = [];
  boomGeo.geometry = new THREE.BoxGeometry(boomGeo.length, 10, 5);
  boomGeo.geometry.translate((240/2),-100,0);
  boomGeo.geometry.rotateY(-SceneParams.sailAngle/180*Math.PI);
  
  let boom = new THREE.Mesh(boomGeo.geometry);
  boom.position.x = 0;
  boom.position.z = 0;
  boom.position.y = -10 + 120;
  // console.log(SceneParams.sailAngle);
  // console.log(SceneParams.sailAngle/180*Math.PI);

  boom.receiveShadow = true;
  boom.castShadow = true;
  boatGeo.meshes.push(boom);

  let keelGeo = {};
  keelGeo.meshes = [];
  keelGeo.length = 120;
  keelGeo.width = 70;
  keelGeo.depth = 5;
  keelGeo.geometry = new THREE.BoxGeometry(keelGeo.width, keelGeo.length, keelGeo.depth);
  //keelGeo.geometry.rotateY(Math.PI/2);
  keelGeo.geometry.rotateY(-Math.PI/180*SceneParams.boatAngle);
  let keel = new THREE.Mesh(keelGeo.geometry);
  keel.position.x = 55;
  keel.position.z = 100;
  keel.position.y = -249 - 60;
  keel.receiveShadow = true;
  keel.castShadow = true;
  boatGeo.meshes.push(keel);

  let coverGeo1 = new THREE.BoxGeometry(1, mainHullGeo.mainLength, mainHullGeo.centerwidth*2 - 50);
  coverGeo1.rotateY(Math.PI);
  coverGeo1.rotateZ(Math.PI/2);
  coverGeo1.translate((mainHullGeo.mainLength / 2),0,0);
  coverGeo1.rotateY(-Math.PI/180*SceneParams.boatAngle);
  // coverGeo1.rotateZ(Math.PI);
  let cover1 = new THREE.Mesh(coverGeo1, mat);
  cover1.position.x = 0;
  cover1.position.z = 0;
  cover1.position.y = -249 + 140;
  cover1.receiveShadow = true;
  cover1.castShadow = true;
  boatGeo.meshes.push(cover1);
  
  

  var singleGeo = new THREE.Geometry();
  for (var m of boatGeo.meshes){
    m.updateMatrix();
    singleGeo.merge(m.geometry,m.matrix);
  }
  var singleMesh = new THREE.Mesh(singleGeo, mat);
  singleMesh.receiveShadow = true;
  singleMesh.castShadow = true;
  Scene.scene.add(singleMesh);


 //var coverGeo2 = new THREE.Geometry();
 // var v1 = new THREE.Vector3(0,-249 + 125,0);
 // var v2 = new THREE.Vector3(0,-249 + 125, mainHullGeo.centerwidth*2);
 // var v3 = new THREE.Vector3(125,-249 + 125,mainHullGeo.centerwidth);


//coverGeo2.vertices.push(new THREE.Vector3(v1));
//coverGeo2.vertices.push(new THREE.Vector3(v2));
//coverGeo2.vertices.push(new THREE.Vector3(v3));
//console.log("below are vertices");
//console.log(coverGeo2.vertices);
//coverGeo2.faces.push( new THREE.Face3( 0, 1, 2 ) );

//coverGeo2.computeFaceNormals();
//coverGeo2.computeVertexNormals();
//coverGeo2.translate(0,100,0);

//var cover2 = new THREE.Mesh(coverGeo2, mainHullGeo.material);
//cover2.receiveShadow = true;
//cover2.castShadow = true;
//mainHullGeo.meshes.push(cover2);
//mainHull.add(cover2);
//Scene.scene.add(cover2);




  
  return singleMesh;

}

Scene.buildKeel = function() {
  let keelGeo = {};
  keelGeo.meshes = [];
  keelGeo.length = 120;
  keelGeo.width = 70;
  keelGeo.depth = 5;
  keelGeo.geometry = new THREE.BoxGeometry(keelGeo.width, keelGeo.length, keelGeo.depth);
  keelGeo.geometry.rotateY(Math.PI/2);
  keelGeo.material = new THREE.MeshPhongMaterial({
    color: 0x333333,//0xffffff,
    specular: 0x111111,
    shininess: 100,
    side: THREE.DoubleSide,
  });

  let keel = new THREE.Mesh(keelGeo.geometry, keelGeo.material);
  keel.position.x = 0;
  keel.position.z = 100;
  keel.position.y = -249 - 60;
  keel.receiveShadow = true;
  keel.castShadow = true;
  keelGeo.meshes.push(keel);
  Scene.scene.add(keel);

  return keelGeo;

}

Scene.buildArrow = function(ang) {
  let arrow = {};
  arrow.length = 100;
  arrow.meshes = [];
  arrow.geometry = new THREE.BoxGeometry(arrow.length, 10, 5);
  arrow.geometry.translate(-200, -0, 0);
  arrow.geometry.rotateY(-1*ang*(Math.PI/180));
  arrow.material = new THREE.MeshPhongMaterial({
    color: 0xee0000,//0xffffff,
    specular: 0x888888,//0x111111,
    shininess: 100,
    side: THREE.DoubleSide,
  });
  
  let ar = new THREE.Mesh(arrow.geometry, arrow.material);
  ar.rotation.set(0, SceneParams.windDirection*(Math.PI/180), 0);
  ar.position.x = -100;
  ar.position.z = 0;
  ar.position.y = -10;
  // console.log(SceneParams.sailAngle);
  // console.log(SceneParams.sailAngle/180*Math.PI);
  // boom.rotateY(-SceneParams.sailAngle/180*Math.PI);

  ar.receiveShadow = false;
  ar.castShadow = false;
  arrow.meshes.push(ar);
  Scene.scene.add(ar);

  return arrow;
}

Scene.buildBoom = function() {

  let boomGeo = {};
  boomGeo.length = 240;
  boomGeo.meshes = [];
  boomGeo.geometry = new THREE.BoxGeometry(boomGeo.length, 10, 5);
  boomGeo.geometry.translate((240/2),-100,0);
  boomGeo.geometry.rotateY(-SceneParams.sailAngle/180*Math.PI);
  boomGeo.material = new THREE.MeshPhongMaterial({
    color: 0x333333,//0xffffff,
    specular: 0x888888,//0x111111,
    shininess: 100,
    side: THREE.DoubleSide,
  });
  
  let boom = new THREE.Mesh(boomGeo.geometry, boomGeo.material);
  boom.position.x = 0;
  boom.position.z = 0;
  boom.position.y = -10 + 120;
  // console.log(SceneParams.sailAngle);
  // console.log(SceneParams.sailAngle/180*Math.PI);

  boom.receiveShadow = true;
  boom.castShadow = true;
  boomGeo.meshes.push(boom);
  Scene.scene.add(boom);

  return boomGeo;

}

Scene.buildBox = function() {
  let box = {}

  // create a box mesh
  box.geometry = new THREE.BoxGeometry(250, 100, 250);
  box.material = new THREE.MeshPhongMaterial({
    color: 0xaaaaaa,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.15, // clipping is an issue, so set a low opacity
  });
  box.mesh = new THREE.Mesh(box.geometry, box.material);
  box.mesh.position.x = 0;
  box.mesh.position.y = 0;
  box.mesh.position.z = 0;
  box.mesh.receiveShadow = true;
  box.mesh.castShadow = true;

  box.geometry.computeBoundingBox();
  box.boundingBox = box.geometry.boundingBox.clone();

  Scene.scene.add(box.mesh);
  return box;
}

Scene.createConstraintLine = function(constraint) {
  if (!Scene.constraintMaterials) {
    let mats = [];
    mats.push(new THREE.LineBasicMaterial({color: 0xff0000}));
    mats.push(new THREE.LineBasicMaterial({color: 0x00ff00}));
    mats.push(new THREE.LineBasicMaterial({color: 0x0000ff}));
    mats.push(new THREE.LineBasicMaterial({color: 0x000000}));
    Scene.constraintMaterials = mats;
  }

  let line = {};
  let points = [constraint.p1.position, constraint.p2.position];
  line.geometry = new THREE.BufferGeometry().setFromPoints( points );

  // figure out materials
  let mats = Scene.constraintMaterials;
  let mat = mats[3]; // black
  let d = constraint.distance;
  // console.log(SceneParams);
  let rest = SceneParams.restDistance;
  // console.log(SceneParams.restDistanceS);
  let restB = rest * SceneParams.restDistanceB;
  let restS = rest * SceneParams.restDistanceS;
  if      (d == rest)   mat = mats[0];
  else if (d == restS)  mat = mats[1];
  else if (d == restB)  mat = mats[2];

  line.mesh = new THREE.Line(line.geometry, mat);
  // Scene.scene.add(line.mesh);
  return line;
}

Scene.showWireframe = function(flag) {
  // Scene.boom.material.wireframe = flag;
  // Scene.mast.material.wireframe = flag;
  Scene.cloth.material.wireframe = flag;
  Scene.sphere.material.wireframe = flag;
  Scene.box.material.wireframe = flag;
  Scene.boat.material.wireframe = flag;
  // Scene.keel.material.wireframe = flag; 
  // Scene.boat[1].material.wireframe = flag;
}

// this part allows us to use an image for the cloth texture
// can include transparent parts
Scene.buildClothTexture = function(imgName) {
  let fallback = function() {
    Scene.updateClothTexture("404.png");
    Scene.cloth.textures[imgName] = Scene.cloth.textures["404.png"];
  }
  let texture = Scene.loader.load(`textures/patterns/${imgName}`, undefined, undefined, fallback);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 16;

  // more stuff needed for the texture
  let uniforms = { texture:  { type: "t", value: texture } };
  let vertexShader = document.getElementById( 'vertexShaderDepth' ).textContent;
  let fragmentShader = document.getElementById( 'fragmentShaderDepth' ).textContent;

  // more stuff needed for texture
  let customDepthMaterial = new THREE.ShaderMaterial( {
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide
  } );

  return [texture, customDepthMaterial];
  
}

Scene.buildGroundTexture = function(imgName) {
  let fallback = function() {
    Scene.updateGroundTexture("404.png");
    Scene.ground.textures[imgName] = Scene.ground.textures["404.png"];
  };
  let texture = Scene.loader.load(`textures/terrain/${imgName}`, undefined, undefined, fallback);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 25, 25 );
  texture.anisotropy = 16;
  return texture;
}

Scene.updateClothTexture = function(imgName) {
  Scene.cloth.material.needsUpdate = true;
  // Hide texture if we are disabling it
  if (!SceneParams.showClothTexture) {
    Scene.cloth.material.map = undefined;
    Scene.cloth.mesh.customDepthMaterial = undefined;
    return;
  }

  // If we already constructed this material, re-use it
  let texture, depthMaterial;
  let cached = Scene.cloth.textures[imgName];
  if (cached) [texture, depthMaterial] = cached;
  if (texture) {
    Scene.cloth.material.map = texture;
    Scene.cloth.mesh.customDepthMaterial = depthMaterial;
    return;
  }

  // Otherwise construct a new one
  [texture, depthMaterial] = Scene.buildClothTexture(imgName);
  // Tough to check if this async load went through OK - just assume so for now
  // and let the user troubleshoot
  console.log(texture);
  console.log(depthMaterial);
  Scene.cloth.material.map = texture;
  Scene.cloth.mesh.customDepthMaterial = depthMaterial;
  Scene.cloth.textures[imgName] = [texture, depthMaterial];
  
}
















Scene.updateGroundTexture = function(imgName) {
  Scene.ground.material.needsUpdate = true;
  // Hide texture if we are disabling it
  if (!SceneParams.showGroundTexture || SceneParams.fancyGround) {
    Scene.ground.material.map = undefined;
    return;
  }

  // If we already constructed this material, re-use it
  let texture = Scene.ground.textures[imgName];
  console.log("line 776")
  console.log(texture);
  if (texture) {
    Scene.ground.material.map = texture;
    return;
  }

  // Otherwise construct a new one
  texture = Scene.buildGroundTexture(imgName);
  console.log("below is ground texture");
  console.log(texture);
  // Tough to check if this async load went through OK - just assume so for now
  // and let the user troubleshoot

  Scene.ground.material.map = texture;
  Scene.ground.textures[imgName] = texture;
}

Scene.update = function() {
  // Repair broken SceneParams colors
  Params.repairColors();

  Scene.showWireframe(SceneParams.wireframe);

  // Reset textures
  Scene.updateClothTexture(SceneParams.clothTexture);
  Scene.updateGroundTexture(SceneParams.groundTexture);

  // Scene.cloth.material = Scene.cloth.textures[SceneParams.clothTexture];
  // Scene.ground.material = Scene.ground.textures[SceneParams.groundTexture];

  Scene.cloth.material.color.setHex(SceneParams.clothColor);
  Scene.cloth.material.specular.setHex(SceneParams.clothSpecular);

  Scene.ground.material.color.setHex(SceneParams.groundColor);
  // Scene.ground.material.specular.setHex(SceneParams.groundSpecular);
  Scene.ground.material.emissive.setHex(SceneParams.groundEmissive);

  Scene.scene.fog.color.setHex(SceneParams.fogColor);
  Scene.renderer.setClearColor(Scene.scene.fog.color);

  if (Scene.cloth.constraints) {
    Scene.cloth.constraints.group.visible = SceneParams.showConstraints;
  }


  // Reset any scaling from `wave` feature
  /*for (let mesh of Scene.poles.meshes) {
    mesh.scale.y = 1;
  } */
}
