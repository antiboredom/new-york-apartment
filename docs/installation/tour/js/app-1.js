let container;
let camera;
let renderer;
let scene;
let mesh;
let controls;
let player;
let prevTime = performance.now();
let delta = 0;
let towerMesh;
let effect;
let composer;

let loader = new THREE.GLTFLoader();
let dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath("draco/");
loader.setDRACOLoader(dracoLoader);

const defaults = {
  fov: 35,
  dist: 1000,
  bg: 0xeeffff,
  speed: 1000,
};

const scenes = {
  flat: {
    model: "flat_4000.glb",
    start: [48.23045010769473, 75.22063006996052, -34.27884385033894],
    look: [300, -2, -300],
  },
  pyramid: {
    model: "thin_pyramid.glb",
    start: [-73.65608801261031, 28.393634398036895, 147.0004790467669],
    look: [0, 0, 0],
    // bg: 0xffeeff,
    dist: 5000,
  },
  tower: {
    model: "tower.glb",
    start: [-73.65608801261031, 28.393634398036895, 147.0004790467669],
    look: [0, 400, 0],
    // bg: 0xffeeff,
    dist: 5000,
  },
  fattower: {
    model: "fattower.glb",
    start: [-73.65608801261031, 28.393634398036895, 147.0004790467669],
    look: [0, 400, 0],
    dist: 1000,
    // bg: 0xffffee,
  },
};

let currentScene = scenes[getUrlParameter("scene")] || scenes.flat;

const walkingSpeed = currentScene.speed || defaults.speed;

//tube stuff
let splineCamera, cameraHelper, cameraEye;
let stats;

let binormal = new THREE.Vector3();
let normal = new THREE.Vector3();

let pipeSpline = new THREE.CatmullRomCurve3( [
  new THREE.Vector3( 0, 10, - 10 ), new THREE.Vector3( 10, 0, - 10 ),
  new THREE.Vector3( 20, 0, 0 ), new THREE.Vector3( 30, 0, 10 ),
  new THREE.Vector3( 30, 0, 20 ), new THREE.Vector3( 20, 0, 30 ),
  new THREE.Vector3( 10, 0, 30 ), new THREE.Vector3( 0, 0, 30 ),
  new THREE.Vector3( - 10, 10, 30 ), new THREE.Vector3( - 10, 20, 30 ),
  new THREE.Vector3( 0, 30, 30 ), new THREE.Vector3( 10, 30, 30 ),
  new THREE.Vector3( 20, 30, 15 ), new THREE.Vector3( 10, 30, 10 ),
  new THREE.Vector3( 0, 30, 10 ), new THREE.Vector3( - 10, 20, 10 ),
  new THREE.Vector3( - 10, 10, 10 ), new THREE.Vector3( 0, 0, 10 ),
  new THREE.Vector3( 10, - 10, 10 ), new THREE.Vector3( 20, - 15, 10 ),
  new THREE.Vector3( 30, - 15, 10 ), new THREE.Vector3( 40, - 15, 10 ),
  new THREE.Vector3( 50, - 15, 10 ), new THREE.Vector3( 60, 0, 10 ),
  new THREE.Vector3( 70, 0, 0 ), new THREE.Vector3( 80, 0, 0 ),
  new THREE.Vector3( 90, 0, 0 ), new THREE.Vector3( 100, 0, 0 )
] );

let sampleClosedSpline = new THREE.CatmullRomCurve3( [
  new THREE.Vector3( 0, - 40, - 40 ),
  new THREE.Vector3( 0, 40, - 40 ),
  new THREE.Vector3( 0, 140, - 40 ),
  new THREE.Vector3( 0, 40, 40 ),
  new THREE.Vector3( 0, - 40, 40 )
] );
sampleClosedSpline.curveType = 'catmullrom';
sampleClosedSpline.closed = true;

// Keep a dictionary of Curve instances
let splines = {
  GrannyKnot: new Curves.GrannyKnot(),
  HeartCurve: new Curves.HeartCurve( 3.5 ),
  VivianiCurve: new Curves.VivianiCurve( 70 ),
  KnotCurve: new Curves.KnotCurve(),
  HelixCurve: new Curves.HelixCurve(),
  TrefoilKnot: new Curves.TrefoilKnot(),
  TorusKnot: new Curves.TorusKnot( 20 ),
  CinquefoilKnot: new Curves.CinquefoilKnot( 20 ),
  TrefoilPolynomialKnot: new Curves.TrefoilPolynomialKnot( 14 ),
  FigureEightPolynomialKnot: new Curves.FigureEightPolynomialKnot(),
  DecoratedTorusKnot4a: new Curves.DecoratedTorusKnot4a(),
  DecoratedTorusKnot4b: new Curves.DecoratedTorusKnot4b(),
  DecoratedTorusKnot5a: new Curves.DecoratedTorusKnot5a(),
  DecoratedTorusKnot5c: new Curves.DecoratedTorusKnot5c(),
  PipeSplinepipeSpline,
  SampleClosedSpline: sampleClosedSpline
};

let parent, tubeGeometry;
let params = {
  spline: 'GrannyKnot',
  scale: 4,
  extrusionSegments: 100,
  radiusSegments: 3,
  closed: true,
  animationView: false,
  lookAhead: false,
  cameraHelper: false,
};

var material = new THREE.MeshLambertMaterial( { color: 0xff00ff } );
var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.3, wireframe: true, transparent: true } );







function loadGLTF(url) {
  return new Promise(resolve => {
    loader.load(url, resolve);
  });
}

function getUrlParameter(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  var results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function addClickLock() {
  document.body.addEventListener(
    "click",
    function() {
      document.querySelector("#clicktolock").style.display = "none";
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        document.querySelector("#mobile-controls").style.display = "block";
      }
      controls.lock();
    },
    false
  );
  document.querySelector("#msg").textContent = "Click to start.";
}


//add tube
function addTube() {
  if ( mesh !== undefined ) {
    parent.remove( mesh );
    mesh.geometry.dispose();
  }
  var extrudePath = splines[ params.spline ];
  tubeGeometry = new THREE.TubeBufferGeometry( extrudePath, params.extrusionSegments, 2, params.radiusSegments, params.closed );
  addGeometry( tubeGeometry );
  setScale();
}

function setScale() {
  mesh.scale.set( params.scale, params.scale, params.scale );
}

function addGeometry( geometry ) {
  // 3D shape
  mesh = new THREE.Mesh( geometry, material );
  var wireframe = new THREE.Mesh( geometry, wireframeMaterial );
  mesh.add( wireframe );
  parent.add( mesh );
}


function animateCamera() {
  cameraHelper.visible = params.cameraHelper;
  cameraEye.visible = params.cameraHelper;
}



class Player {
  constructor() {
    this.moveForward = false;
    this.moveBackward = false;
    this.moveUp = false;
    this.moveDown = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canJump = false;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.setListeners();
  }

  update() {
    let time = performance.now();
    delta = (time - prevTime) / 1000;
    prevTime = time;

    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;
    this.velocity.y -= this.velocity.y * 10 * delta;
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.y = Number(this.moveUp) - Number(this.moveDown);
    this.direction.normalize(); // this ensures consistent movements in all directions
    if (this.moveForward || this.moveBackward)
      this.velocity.z -= this.direction.z * walkingSpeed * delta;
    if (this.moveLeft || this.moveRight)
      this.velocity.x -= this.direction.x * walkingSpeed * delta;
    if (this.moveUp || this.moveDown)
      this.velocity.y -= this.direction.y * walkingSpeed * delta;
    controls.moveRight(-this.velocity.x * delta);
    controls.moveForward(-this.velocity.z * delta);
    controls.getObject().position.y += this.velocity.y * delta; // new behavior
  }

  setListeners() {
    document.querySelector('#u').addEventListener('touchstart', e => {
      this.moveDown = true;
    });

    document.querySelector('#u').addEventListener('touchend', e => {
      this.moveDown = false;
    });

    document.querySelector('#d').addEventListener('touchstart', e => {
      this.moveUp = true;
    });

    document.querySelector('#d').addEventListener('touchend', e => {
      this.moveUp = false;
    });

    document.querySelector('#l').addEventListener('touchstart', e => {
      this.moveLeft = true;
    });

    document.querySelector('#l').addEventListener('touchend', e => {
      this.moveLeft = false;
    });

    document.querySelector('#r').addEventListener('touchstart', e => {
      this.moveRight = true;
    });

    document.querySelector('#r').addEventListener('touchend', e => {
      this.moveRight = false;
    });

    document.querySelector('#f').addEventListener('touchstart', e => {
      this.moveForward = true;
    });

    document.querySelector('#f').addEventListener('touchend', e => {
      this.moveForward = false;
    });

    document.querySelector('#b').addEventListener('touchstart', e => {
      this.moveBackward = true;
    });

    document.querySelector('#b').addEventListener('touchend', e => {
      this.moveBackward = false;
    });

    document.addEventListener(
      "keydown",
      event => {
        switch (event.keyCode) {
          case 38: // up
          case 87: // w
            this.moveForward = true;
            break;
          case 37: // left
          case 65: // a
            this.moveLeft = true;
            break;
          case 40: // down
          case 83: // s
            this.moveBackward = true;
            break;
          case 39: // right
          case 68: // d
            this.moveRight = true;
            break;
          case 81: // q
            this.moveUp = true;
            break;
          case 69: // e
            this.moveDown = true;
            break;
        }
      },
      false
    );

    document.addEventListener(
      "keyup",
      event => {
        switch (event.keyCode) {
          case 38: // up
          case 87: // w
            this.moveForward = false;
            break;
          case 37: // left
          case 65: // a
            this.moveLeft = false;
            break;
          case 40: // down
          case 83: // s
            this.moveBackward = false;
            break;
          case 39: // right
          case 68: // d
            this.moveRight = false;
            break;
          case 81: // q
            this.moveUp = false;
            break;
          case 69: // e
            this.moveDown = false;
            break;
        }
      },
      false
    );
  }
}

async function init() {

  container = document.querySelector("#floorplans-3d");
  player = new Player();
  scene = new THREE.Scene();

  const dist = currentScene.dist || defaults.dist;
  const bg = currentScene.bg || defaults.bg;
  // const bg = 0x555555;
  const fov = currentScene.fov || defaults.fov;
  const aspect = container.clientWidth / container.clientHeight;
  const near = 0.3;
  const far = dist;

  //scene

  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, 100, dist);

  //camera

  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  scene.add(camera);
  const ambientLight = new THREE.HemisphereLight(
    0xffffff, // ground color
    0x000000, // sky color
    2.4 // intensity
  );

  scene.add(ambientLight);


  const directionalLight = new THREE.DirectionalLight(0xf7efbe, 0.7);
  directionalLight.position.set(0.5, 1, 0.5);
  scene.add(directionalLight);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.7);
  directionalLight.position.set(0.5, 1, 0.5);
  scene.add(directionalLight2);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  container.appendChild(renderer.domElement);

  // the outline effect
  effect = new THREE.OutlineEffect(renderer, {
    defaultThickness: 0.002,
    defaultColor: [0, 0, 0],
    defaultAlpha: 0.5,
    defaultKeepAlive: true,
  });

  //controls

  // controls = new THREE.PointerLockControls(camera, document.body);
  // scene.add(controls.getObject());
  // camera.position.set(
  //   currentScene.start[0],
  //   currentScene.start[1],
  //   currentScene.start[2]
  // );

  // camera.lookAt(
  //   new THREE.Vector3(
  //     currentScene.look[0],
  //     currentScene.look[1],
  //     currentScene.look[2]
  //   )
  

  // );

  // tube
  parent = new THREE.Object3D();
  scene.add( parent );
  splineCamera = new THREE.PerspectiveCamera( 84, window.innerWidth / window.innerHeight, 0.01, 1000 );
  parent.add( splineCamera );
  cameraHelper = new THREE.CameraHelper( splineCamera );
  scene.add( cameraHelper );
  addTube();

  // debug camera
  cameraEye = new THREE.Mesh( new THREE.SphereBufferGeometry( 5 ), new THREE.MeshBasicMaterial( { color: 0xdddddd } ) );
  parent.add( cameraEye );
  cameraHelper.visible = params.cameraHelper;
  cameraEye.visible = params.cameraHelper;
  
  // renderer
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );
  
  // stats
  stats = new Stats();
  container.appendChild( stats.dom );

  // dat.GUI
  var gui = new GUI( { width: 300 } );
  var folderGeometry = gui.addFolder( 'Geometry' );
  folderGeometry.add( params, 'spline', Object.keys( splines ) ).onChange( function () {
    addTube();
  } );
  folderGeometry.add( params, 'scale', 2, 10 ).step( 2 ).onChange( function () {
    setScale();
  } );
  folderGeometry.add( params, 'extrusionSegments', 50, 500 ).step( 50 ).onChange( function () {
    addTube();
  } );
  folderGeometry.add( params, 'radiusSegments', 2, 12 ).step( 1 ).onChange( function () {
    addTube();
  } );
  folderGeometry.add( params, 'closed' ).onChange( function () {
    addTube();
  } );
  folderGeometry.open();
  var folderCamera = gui.addFolder( 'Camera' );
  folderCamera.add( params, 'animationView' ).onChange( function () {
    animateCamera();
  } );
  folderCamera.add( params, 'lookAhead' ).onChange( function () {
    animateCamera();
  } );
  folderCamera.add( params, 'cameraHelper' ).onChange( function () {
    animateCamera();
  } );
  folderCamera.open();
  var controls = new OrbitControls( camera, renderer.domElement );
  window.addEventListener( 'resize', onWindowResize, false );



  try {
    let glb = await loadGLTF(currentScene.model);
    addClickLock();
    towerMesh = glb.scene;
  } catch (e) {
    console.log(e);
  }


  towerMesh.traverse(o => {
    if (o.isMesh) {
      o.material = mats[Math.floor(Math.random() * mats.length)];
      o.material.receiveShadow = true;
      o.material.castShadow = true;
      // const edges = new THREE.EdgesGeometry(o.geometry); // or WireframeGeometry
      // const mat = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } );
      // const lines = new THREE.LineSegments(edges, mat);
      // lines.position.x = o.position.x;
      // lines.position.y = o.position.y;
      // lines.position.z = o.position.z;
      // scene.add(lines);

      // you can play around with each floorplan's position/rotation below
      o.order = o.position.y / 9;
      o.rspeed = o.position.x * 0.000001;
      // o.position.set(Math.random() * 500 - 250, Math.random() * 500 - 250, Math.random() * 500 - 250);
      // o.rotation.set(0, o.position.y * 0.01, 0);
      // o.position.x = Math.sin(o.position.y) * 10;
      // o.position.z = Math.cos(o.position.y) * 10;
    }
  });

  // change the scale of the whole thing like so:
  // towerMesh.scale.set(20, 20, 20);

  scene.add(towerMesh);

  function makeGUI() {
    function addGuiColor(gui, obj, prop) {
      const data = {};
      data[prop] = obj[prop].getHex();
      gui.addColor(data, prop).onChange(handleColorChange(obj[prop]));
    }

    function handleColorChange(color) {
      return function(value) {
        if (typeof value === "string") {
          value = value.replace("#", "0x");
        }

        color.setHex(value);
      };
    }

    const gui = new dat.GUI();

    const ambFolder = gui.addFolder("Ambient Light");
    ambFolder.add(ambientLight, "intensity", 0, 10);
    addGuiColor(ambFolder, ambientLight, "color");
    addGuiColor(ambFolder, ambientLight, "groundColor");
    ambFolder.open();

    const dirFolder = gui.addFolder("Directional Light");
    addGuiColor(dirFolder, directionalLight, "color");
    dirFolder.add(directionalLight, "intensity", 0, 2);
    dirFolder.add(directionalLight.position, "x", -10, 10);
    dirFolder.add(directionalLight.position, "y", -10, 10);
    dirFolder.add(directionalLight.position, "z", -10, 10);
    dirFolder.open();

    const dirFolder2 = gui.addFolder("Directional Light 2");
    addGuiColor(dirFolder2, directionalLight2, "color");
    dirFolder2.add(directionalLight2, "intensity", 0, 2);
    dirFolder2.add(directionalLight2.position, "x", -10, 10);
    dirFolder2.add(directionalLight2.position, "y", -10, 10);
    dirFolder2.add(directionalLight2.position, "z", -10, 10);
    dirFolder2.open();

    const matFolder = gui.addFolder("Material");
    matFolder.add(testMat, "roughness", 0, 1);
    matFolder.add(testMat, "metalness", 0, 1);
    addGuiColor(matFolder, testMat, "color");
    addGuiColor(matFolder, testMat, "emissive");
    matFolder.open();
  }
}

function animate() {
  requestAnimationFrame(animate);

  // if you want to animate each floorplan...
  if (towerMesh) {
    towerMesh.traverse(o => {
      if (o.isMesh) {
        // o.rotation.y += o.rspeed;
        // o.rotation.y += o.rspeed/2;
        // o.position.x = Math.sin(delta/2 + o.order)*115;
        // o.position.z = Math.cos(delta/2 + o.order)*115;
      }
    });
  }

  player.update();

  // toggle these to remove the outline effect
  // renderer.render(scene, camera);
  effect.render(scene, camera);
  
  render();
  stats.update();

}

function render() {
  // animate camera along spline
  var time = Date.now();
  var looptime = 20 * 1000;
  var t = ( time % looptime ) / looptime;
  var pos = tubeGeometry.parameters.path.getPointAt( t );
  pos.multiplyScalar( params.scale );
  // interpolation
  var segments = tubeGeometry.tangents.length;
  var pickt = t * segments;
  var pick = Math.floor( pickt );
  var pickNext = ( pick + 1 ) % segments;
  binormal.subVectors( tubeGeometry.binormals[ pickNext ], tubeGeometry.binormals[ pick ] );
  binormal.multiplyScalar( pickt - pick ).add( tubeGeometry.binormals[ pick ] );
  var dir = tubeGeometry.parameters.path.getTangentAt( t );
  var offset = 15;
  normal.copy( binormal ).cross( dir );
  // we move on a offset on its binormal
  pos.add( normal.clone().multiplyScalar( offset ) );
  splineCamera.position.copy( pos );
  cameraEye.position.copy( pos );
  // using arclength for stablization in look ahead
  var lookAt = tubeGeometry.parameters.path.getPointAt( ( t + 30 / tubeGeometry.parameters.path.getLength() ) % 1 ).multiplyScalar( params.scale );
  // camera orientation 2 - up orientation via normal
  if ( ! params.lookAhead ) lookAt.copy( pos ).add( dir );
  splineCamera.matrix.lookAt( splineCamera.position, lookAt, normal );
  splineCamera.quaternion.setFromRotationMatrix( splineCamera.matrix );
  cameraHelper.update();
  renderer.render( scene, params.animationView === true ? splineCamera : camera );
}

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
  composer.setSize(container.clientWidth, container.clientHeight);
}

window.addEventListener("resize", onWindowResize);

init();
animate();
