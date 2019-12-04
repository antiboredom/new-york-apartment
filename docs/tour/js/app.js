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
    look: [0, 0, 0],
    // bg: 0xffeeff,
    dist: 5000,
  },
  fattower: {
    model: "fattower.glb",
    start: [-73.65608801261031, 28.393634398036895, 147.0004790467669],
    look: [0, 0, 0],
    dist: 1000,
    // bg: 0xffffee,
  },
};

let currentScene = scenes[getUrlParameter("scene")] || scenes.flat;

const walkingSpeed = currentScene.speed || defaults.speed;

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

  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, 100, dist);

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

  controls = new THREE.PointerLockControls(camera, document.body);
  scene.add(controls.getObject());
  camera.position.set(
    currentScene.start[0],
    currentScene.start[1],
    currentScene.start[2]
  );
  camera.lookAt(
    new THREE.Vector3(
      currentScene.look[0],
      currentScene.look[1],
      currentScene.look[2]
    )
  );

  try {
    let glb = await loadGLTF(currentScene.model);
    addClickLock();
    towerMesh = glb.scene;
  } catch (e) {
    console.log(e);
  }

  const mats = [
    new THREE.MeshStandardMaterial({
      color: 0xbababa,
      flatShading: false,
      roughness: 0.3,
      metalness: 0.5,
    }),
    new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      flatShading: false,
      roughness: 0.3,
      metalness: 0.5,
    }),
    new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      flatShading: false,
      roughness: 0.3,
      metalness: 0.5,
    }),
    new THREE.MeshStandardMaterial({
      color: 0xdbdbdb,
      flatShading: false,
      roughness: 0.3,
      metalness: 0.5,
    }),
    new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      flatShading: false,
      roughness: 0.3,
      metalness: 0.5,
    }),
  ];

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
