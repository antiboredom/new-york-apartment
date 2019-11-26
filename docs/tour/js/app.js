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

  const dist = 5000;
  const bg = 0xeeffff;
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
    0xffffff, // ground color
    0x000000, // sky color
    // 0xddeeff, // sky color
    // 0x202020, // ground color
    4.5 // intensity
  );

  // const mainLight = new THREE.DirectionalLight(0xffffff, 2);
  // mainLight.castShadow = true;
  // mainLight.position.set(10, 10, 10);

  scene.add(ambientLight);

  // const directionalLight1 = new THREE.DirectionalLight( 0xF7EFBE, 0.7 );
  // directionalLight1.position.set( 0.5, 1, 0.5 );
  // scene.add( directionalLight1 );
  // const directionalLight2 = new THREE.DirectionalLight( 0xF7EFBE, 0.5 );
  // directionalLight2.position.set( -0.5, -1, -0.5 );
  // scene.add( directionalLight2 );

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);

  // this removes the background alltogether...
  // renderer.setClearColor(0x000000, 0);

  // the outline effect
  effect = new THREE.OutlineEffect(renderer, {
    defaultThickness: 0.002,
    defaultColor: [0, 0, 0],
    defaultAlpha: 0.9,
    defaultKeepAlive: true,
  });

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

  towerMesh.traverse(o => {
    if (o.isMesh) {
      o.material = mats[Math.floor(Math.random() * mats.length)];

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
    const vertexShader = `
      varying vec3 vWorldPosition;

			void main() {

				vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
				vWorldPosition = worldPosition.xyz;

				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			}
    `;

    const fragmentShader = `
      uniform vec3 topColor;
			uniform vec3 bottomColor;
			uniform float offset;
			uniform float exponent;

			varying vec3 vWorldPosition;

			void main() {

				float h = normalize( vWorldPosition + offset ).y;
				gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( h, exponent ), 0.0 ) ), 1.0 );

			}
    `;

    const uniforms = {
      topColor: { type: "c", value: new THREE.Color(0x0000ff) },
      bottomColor: { type: "c", value: new THREE.Color(0x00ff00) },
      offset: { type: "f", value: 100 },
      exponent: { type: "f", value: 0.7 },
    };

    //skydome

    const skyGeo = new THREE.SphereGeometry(1000, 25, 25);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
      side: THREE.BackSide,
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    // scene.add(sky);
  }

  {
    //images for faces
    const skyDome = [
      "images/t1_seamless.jpg",
      "images/t1_seamless.jpg",
      "images/t1_seamless.jpg",
      "images/t1_seamless.jpg",
      "images/t1_seamless.jpg",
      "images/t1_seamless.jpg",
      // "images/px.jpg",
      // "images/nx.jpg",
      // "images/py.jpg",
      // "images/ny.jpg",
      // "images/pz.jpg",
      // "images/nz.jpg",
    ];

    // Add Skybox
    const cubeTextureloader = new THREE.CubeTextureLoader();
    const texture = cubeTextureloader.load(skyDome);
    // scene.background = texture;
  }

  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

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

    const ambFolder = gui.addFolder("Ambient Light");
    ambFolder.add(ambientLight, "intensity", 0, 10);
    addGuiColor(ambFolder, ambientLight, "color");
    addGuiColor(ambFolder, ambientLight, "groundColor");
    ambFolder.open();

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
  // renderer.render(scene, camera);
  effect.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

window.addEventListener("resize", onWindowResize);

init();
animate();
