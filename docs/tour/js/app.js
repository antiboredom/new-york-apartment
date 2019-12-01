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

function loadGLTF(url) {
  return new Promise(resolve => {
    loader.load(url, resolve);
  });
}

const walkingSpeed = 1000;

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
    container.addEventListener(
      "click",
      function() {
        controls.lock();
      },
      false
    );

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

  const dist = 2000;
  // const bg = 0xeeffff;
  const bg = 0x555555;
  const fov = 25;
  const aspect = container.clientWidth / container.clientHeight;
  const near = 1;
  const far = dist;

  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, 100, dist);

  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  scene.add(camera);
  camera.position.set(0, 0, 0);

  const ambientLight = new THREE.HemisphereLight(
    0x000000, // sky color
    0xffffff, // ground color
    // 0xddeeff, // sky color
    // 0x202020, // ground color
    4.5 // intensity
  );

  // const mainLight = new THREE.DirectionalLight(0xffffff, 2);
  // mainLight.castShadow = true;
  // mainLight.position.set(10, 10, 10);

  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xf7efbe, 0.7);
  directionalLight.position.set(0.5, 1, 0.5);
  scene.add(directionalLight);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.7);
  directionalLight.position.set(0.5, 1, 0.5);
  scene.add(directionalLight2);

  const spotLight = new THREE.SpotLight(0xffffff, 1);
  spotLight.position.set(15, 40, 35);
  spotLight.angle = Math.PI / 4;
  spotLight.penumbra = 0.05;
  spotLight.decay = 2;
  spotLight.distance = 200;
  scene.add(spotLight);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // this removes the background alltogether...
  // renderer.setClearColor(0x000000, 0);

  composer = new THREE.EffectComposer(renderer);

  // const renderPass = new THREE.RenderPass(scene, camera);
  // composer.addPass(renderPass);

  const ssaoPass = new THREE.SSAOPass(
    scene,
    camera,
    container.clientWidth,
    container.clientHeight
  );
  ssaoPass.kernelRadius = 16;
  // composer.addPass(ssaoPass);

  // const bokehPass = new THREE.BokehPass(scene, camera, {
  //   focus: 0.1,
  //   aperture: 0.25,
  //   maxblur: 0.01,
  //   width: container.clientWidth,
  //   height: container.clientHeight,
  // });
  // composer.addPass(bokehPass);

  // the outline effect
  effect = new THREE.OutlineEffect(renderer, {
    defaultThickness: 0.004,
    defaultColor: [0, 0, 0],
    defaultAlpha: 0.9,
    defaultKeepAlive: true,
  });

  // const outlinePass = new THREE.OutlinePass( new THREE.Vector2( container.clientWidth, container.clientHeight ), scene, camera );
  // outlinePass.edgeStrength = 3.0;
  // outlinePass.edgeThickness = 1.0;
  // outlinePass.visibleEdgeColor = 0xFF0000;
  // composer.addPass( outlinePass );

  controls = new THREE.PointerLockControls(camera, document.body);
  scene.add(controls.getObject());

  try {
    // different models to load
    // let glb = await loadGLTF("all_grid2.glb");
    let glb = await loadGLTF("all_grid_packed.glb");
    // let glb = await loadGLTF("all6.glb");
    // let glb = await loadGLTF("all5.glb");
    towerMesh = glb.scene;
  } catch (e) {
    console.log(e);
  }

  // an array of possible materials to use
  const mats = [
    // new THREE.MeshToonMaterial({ color: 0x555555 }),
    // new THREE.MeshToonMaterial({ color: 0x444444 }),
    // new THREE.MeshToonMaterial({ color: 0x333333 }),
    // new THREE.MeshPhongMaterial({ color: 0x444444, shininess: 40, emissive: 0x383838, emissiveIntensity: 1, specular: 0xff0000}),
    // new THREE.MeshPhongMaterial({ color: 0x2194ce, shininess: 40, emissive: 0x383838, emissiveIntensity: 1, specular: 0xff0000}),
    // new THREE.MeshPhongMaterial({ color: 0x2194ce, shininess: 40, emissive: 0x383838, emissiveIntensity: 1, specular: 0xff0000}),
    new THREE.MeshStandardMaterial({
      color: 0x999999,
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
  ];

  const testMat = new THREE.MeshStandardMaterial({
    color: 0x878787,
    roughness: 0.5,
    metalness: 0.5,
    emissive: 0x000000,
  });

  towerMesh.traverse(o => {
    if (o.isMesh) {
      // o.material = mats[Math.floor(Math.random() * mats.length)];
      o.material = testMat;
      // const edges = new THREE.EdgesGeometry(o.geometry); // or WireframeGeometry
      // const mat = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } );
      // const lines = new THREE.LineSegments(edges, mat);
      // lines.position.x = o.position.x;
      // lines.position.y = o.position.y;
      // lines.position.z = o.position.z;
      // scene.add(lines);

      // you can play around with each floorplan's position/rotation below
      // o.order = o.position.y / 9;
      // o.rspeed = o.position.x * 0.0001;
      // o.position.set(Math.random() * 500 - 250, Math.random() * 500 - 250, Math.random() * 500 - 250);
      // o.rotation.set(0, o.position.y * 0.01, 0);
      // o.position.x = Math.sin(o.position.y) * 10;
      // o.position.z = Math.cos(o.position.y) * 10;
    }
  });

  // change the scale of the whole thing like so:
  // towerMesh.scale.set(20, 20, 20);

  scene.add(towerMesh);

  {
    //images for faces
    // const skyDome = [
    //   "images/t1_seamless.jpg",
    //   "images/t1_seamless.jpg",
    //   "images/t1_seamless.jpg",
    //   "images/t1_seamless.jpg",
    //   "images/t1_seamless.jpg",
    //   "images/t1_seamless.jpg",
    // "images/px.jpg",
    // "images/nx.jpg",
    // "images/py.jpg",
    // "images/ny.jpg",
    // "images/pz.jpg",
    // "images/nz.jpg",
    // ];
    // Add Skybox
    // const cubeTextureloader = new THREE.CubeTextureLoader();
    // const texture = cubeTextureloader.load(skyDome);
    // scene.background = texture;
  }

  player = new Player();

  {
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

    const ssaoFolder = gui.addFolder("SSAO");
    ssaoFolder
      .add(ssaoPass, "output", {
        Default: THREE.SSAOPass.OUTPUT.Default,
        "SSAO Only": THREE.SSAOPass.OUTPUT.SSAO,
        "SSAO Only + Blur": THREE.SSAOPass.OUTPUT.Blur,
        Beauty: THREE.SSAOPass.OUTPUT.Beauty,
        Depth: THREE.SSAOPass.OUTPUT.Depth,
        Normal: THREE.SSAOPass.OUTPUT.Normal,
      })
      .onChange(function(value) {
        ssaoPass.output = parseInt(value);
      });
    ssaoFolder
      .add(ssaoPass, "kernelRadius")
      .min(0)
      .max(32);
    ssaoFolder
      .add(ssaoPass, "minDistance")
      .min(0.001)
      .max(0.02);
    ssaoFolder
      .add(ssaoPass, "maxDistance")
      .min(0.01)
      .max(0.3);

    // const outlineFolder = gui.addFolder("outline");
    // outlineFolder.add(outlinePass, "edgeThickness", 1, 4);
    // outlineFolder.add(outlinePass, "edgeStrength", 0.01, 10);
    // addGuiColor(outlineFolder, outlinePass, "visibleEdgeColor");

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

    const spotFolder = gui.addFolder("Spot Light");
    addGuiColor(spotFolder, spotLight, "color");
    spotFolder.add(spotLight, "intensity", 0, 2);
    spotFolder.add(spotLight, "distance", 0, 1000);
    spotFolder.add(spotLight, "angle", 0, 2);
    spotFolder.add(spotLight, "penumbra", 0, 1);
    spotFolder.add(spotLight, "decay", 1, 2);
    spotFolder.add(spotLight.position, "x", -1000, 1000);
    spotFolder.add(spotLight.position, "y", -1000, 1000);
    spotFolder.add(spotLight.position, "z", -1000, 1000);
    spotFolder.open();

    const matFolder = gui.addFolder("Material");
    matFolder.add(testMat, "roughness", 0, 1);
    matFolder.add(testMat, "metalness", 0, 1);
    addGuiColor(matFolder, testMat, "color");
    addGuiColor(matFolder, testMat, "emissive");
    matFolder.open();

    // const outlineFolder = gui.addFolder("Outline");
    // outlineFolder.add(effect, "edgeThickness", 0, 5);
    // outlineFolder.open();
  }
}

function animate() {
  requestAnimationFrame(animate);

  // if you want to animate each floorplan...
  // if (towerMesh) {
  //   towerMesh.traverse(o => {
  //     if (o.isMesh) {
  //       o.rotation.y += o.rspeed;
  //       o.rotation.y += o.rspeed/2;
  //       o.position.x = Math.sin(delta/2 + o.order)*115;
  //       o.position.z = Math.cos(delta/2 + o.order)*115;
  //     }
  //   });
  // }

  player.update();

  // toggle these to remove the outline effect
  renderer.render(scene, camera);
  // effect.render(scene, camera);
  // composer.render();
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
