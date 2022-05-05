"use strict";

var GuiConfig = GuiConfig || {};

GuiConfig.textureNames = [
  "tbd",
];

GuiConfig.dropdownOptions = {};

GuiConfig.dropdownOptions.textures = [
  "circuit_pattern.png",
];

GuiConfig.dropdownOptions.objects = [
  "None",
  "Sphere",
  "Box",
];

GuiConfig.dropdownOptions.pinned = [
  "Classic",
  
];

// Each entry of GuiConfig.defs will have one Gui element created for it.
/* Parameters are as follows:
    - folderName: what folder to place this entry in
    - name: text to display as a label for this GUI element
    - param: name of the field of SceneParams to be mutated
    - range: [min, max, step] for numerical-valued fields
    - onChange: a function f(newValue) that applies the results of this
                variable having changed
    - type: optionally a type hint to indicate the type of value being selected
            ("color", "string", "num", "boolean")
*/
GuiConfig.defs = [
  /***************************************************
   *                Top level
   ***************************************************/
  // {
  //   name: "Cloth Size",
  //   param: "fabricLength",
  //   range: [200, 1000, 20],
  //   onChange: Sim.restartCloth,
  // },
  // {
  //   name: "Wireframe",
  //   param: "wireframe",
  //   onChange: Scene.showWireframe,
  // },
  // {
  //   name: "auto rotate",
  //   param: "rotate",
  // },
  // {
  //   name: "angle",
  //   param: "sailAngle",
  //   range: [-90,90,5],
  //   onChange: Sim.restartCloth,
  // },
  /***************************************************
   *             Boat folder
   ***************************************************/
  {
   folderName: "Boat",
   name: "Boat angle",
   param: "boatAngle",
   range: [0,180,1],
   onChange: Scene.update,
  },
  {
   folderName: "Boat",
   name: "Sail angle",
   param: "sailAngle",
   range: [0,180,1],
   onChange: Scene.update,
  },
  {
    folderName: "Boat",
    name: "Boat X COM (x displacement)",
    param: "boatCOMx",
    range: [-200,-50,1],
   },
   {
    folderName: "Boat",
    name: "Boat Y COM (y displacement)",
    param: "boatCOMx",
    range: [-200,-50,1],
   },
   {
    folderName: "Boat",
    name: "Boat mass",
    param: "boatMass",
    range: [0,100,1],
   },
   /***************************************************
   *             Physics folder
   ***************************************************/
   {
    folderName: "Physics",
    name: "torque on",
    param: "torqueOn",
   },
   {
    folderName: "Physics",
    name: "lift coefficient multiplier",
    param: "liftC",
    range: [0.0001,.001,0.0001],
   },
   {
    folderName: "Physics",
    name: "water density",
    param: "waterDensity",
    range: [0.000001,.00001,0.000001],
   },
   {
    folderName: "Physics",
    name: "torque multiplier",
    param: "torqueMult",
    range: [0.0000005,.000002,0.0000001],
   },
   {
    folderName: "Physics",
    name: "accel multiplier",
    param: "accelMult",
    range: [1,20,8],
   },
   {
    folderName: "Physics",
    name: "Rot inertia",
    param: "rotInertia",
    range: [10,500,10],
   },
   {
    folderName: "Physics",
    name: "gravity",
    param: "gravity",
   },
   {
    folderName: "Physics",
    name: "Advanced buoyancy",
    param: "fancyBuoyancy",
   },
   {
    folderName: "Physics",
    name: "current (drift)",
    param: "slip",
    range: [0.0001,.1,0.0001],
   },
   {
    folderName: "Physics",
    name: "wave torque",
    param: "waveTorque",
    range: [0,50000000,10000],
   },
   

   /***************************************************
   *             Wind folder
   ***************************************************/
  {
    folderName: "Wind",
    name: "wind",
    param: "wind",
  },
  {
    folderName: "Wind",
    name: "wind strength",
    param: "windStrength",
    range: [0,100,0.1],
  },
  {
    folderName: "Wind",
    name: "wind direction",
    param: "windDirection",
    range: [0,359,1],
  },
  // {
  //   folderName: "Forces",
  //   name: "rain",
  //   param: "rain",
  // },
  // {
  //   folderName: "Forces",
  //   name: "rain strength",
  //   param: "rainStrength",
  //   range: [0,50,0.1],
  // },
  // {
  //   folderName: "Forces",
  //   name: "rain rate",
  //   param: "rainRate",
  //   range: [0,50,1],
  // },
  // {
  //   folderName: "Forces",
  //   name: "custom",
  //   param: "customForce",
  // },
  // {
  //   folderName: "Forces",
  //   name: "custom strength",
  //   param: "customFStrength",
  //   range: [0,50,0.1],
  // },
  // {
  //   folderName: "Forces",
  //   name: "custom rate",
  //   param: "customFRate",
  //   range: [0,50,1],
  // },
  /***************************************************
   *             Scene folder
   ***************************************************/
  // {
  //   folderName: "Scene",
  //   name: "object",
  //   param: "object",
  //   dropdownOptions: GuiConfig.dropdownOptions.objects,
  //   defaultOption: GuiConfig.dropdownOptions.objects[0],
  //   onChange: Sim.placeObject,
  // },
  // {
  //   folderName: "Scene",
  //   name: "friction",
  //   param: "friction",
  //   range: [0,1,0.001],
  // },
  // {
  //   folderName: "Scene",
  //   name: "moving sphere",
  //   param: "movingSphere",
  // },
  // {
  //   folderName: "Scene",
  //   name: "pinned",
  //   param: "pinned",
  //   dropdownOptions: GuiConfig.dropdownOptions.pinned,
  //   defaultOption: GuiConfig.dropdownOptions.pinned[1],
  //   onChange: Sim.pinCloth,
  // },

  /***************************************************
   *             Behavior folder
   ***************************************************/
  // {
  //   folderName: "Behavior",
  //   name: "structural",
  //   param: "structuralSprings",
  //   onChange: Sim.restartCloth,
  // },
  // {
  //   folderName: "Behavior",
  //   name: "shear",
  //   param: "shearSprings",
  //   onChange: Sim.restartCloth,
  // },
  // {
  //   folderName: "Behavior",
  //   name: "bending",
  //   param: "bendingSprings",
  //   onChange: Sim.restartCloth,
  // },
  // {
  //   folderName: "Behavior",
  //   name: "show constraints",
  //   param: "showConstraints",
  //   onChange: Scene.update,
  // },
  // {
  //   folderName: "Behavior",
  //   name: "NoSelfIntersect",
  //   param: "avoidClothSelfIntersection",
  // },
   /***************************************************
   *             Wave folder
   ***************************************************/
  {
   folderName: "Wave",
   name: "wave",
   param: "fancyGround",
  //  onChange: Scene.update,
  },
  {
    folderName: "Wave",
    name: "waveX",
    param: "waveOnX",
   },
   {
    folderName: "Wave",
    name: "waveZ",
    param: "waveOnZ",
   },
   {
    folderName: "Wave",
    name: "wave Z period",
    param: "wavePdZ",
    range: [100,1000,10],
   },
   {
    folderName: "Wave",
    name: "wave X period",
    param: "wavePdX",
    range: [100,1000,10],
   },

  // {
  //  folderName: "Wave",
  //  name: "wave amplitude",
  //  param: "waveAmp",
  //  range: [0,100,1],
  // },
  // {
  //  folderName: "Wave",
  //  name: "wave frequency",
  //  param: "waveFreq",
  //  range: [0.5,50,0.5],
  // },
  {
    folderName: "Wave",
    name: "Wave height",
    param: "waveHeight",
    range: [0,50,0.5],
   },
   {
    folderName: "Wave",
    name: "wave width",
    param: "waveWidth",
    range: [0.5,10,0.1],
   },
   {
    folderName: "Wave",
    name: "wave resolution",
    param: "waterSize",
    range: [50,1000,10],
   },
   {
    folderName: "Wave",
    name: "water width",
    param: "waterWidth",
    range: [10000,100000,10],
   },{
    folderName: "Wave",
    name: "water height",
    param: "waveWidth",
    range: [10000,100000,10],
   },




  /***************************************************
   *             Appearance folder
   ***************************************************/
   {
     folderName: "Appearance",
     name: "sail color",
     param: "clothColor",
     type: "color",
     onChange: Scene.update,
   },
   {
     folderName: "Appearance",
     name: "sail reflection",
     param: "clothSpecular",
     type: "color",
     onChange: Scene.update,
   },
   {
     folderName: "Appearance",
     name: "ground color",
     param: "groundColor",
     type: "color",
     onChange: Scene.update,
   },
   {
     folderName: "Appearance",
     name: "ground emission",
     param: "groundEmissive",
     type: "color",
     onChange: Scene.update,
   },
   {
     folderName: "Appearance",
     name: "fog color",
     param: "fogColor",
     type: "color",
     onChange: Scene.update,
   },
   {
     folderName: "Appearance",
     name: "cloth texture?",
     param: "showClothTexture",
     onChange: Scene.update,
   },
   {
     folderName: "Appearance",
     name: "cloth img",
     param: "clothTexture",
     onChange: Scene.update,
   },
   {
     folderName: "Appearance",
     name: "ground texture?",
     param: "showGroundTexture",
     onChange: Scene.update,
   },
   {
     folderName: "Appearance",
     name: "ground img",
     param: "groundTexture",
     onChange: Scene.update,
   },
   /***************************************************
    *             Top level
    ***************************************************/
  //  {
  //    name: "Restart simulation",
  //    param: "restartCloth",
  //    onClick: Sim.init,
  //  },
   {
     name: "Restore defaults",
     param: "restoreDefaults",
     onClick: Params.restoreDefaults,
   }
 ];
