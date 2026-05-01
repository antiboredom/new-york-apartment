const outline_shader = {
  uniforms: {
    linewidth: { type: "f", value: 0.2 },
  },
  vertex_shader: [
    "uniform float linewidth;",
    "void main() {",
    "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
    "vec4 displacement = vec4( normalize( normalMatrix * normal ) * linewidth, 0.0 ) + mvPosition;",
    "gl_Position = projectionMatrix * displacement;",
    "}",
  ].join("\n"),
  fragment_shader: [
    "void main() {",
    "gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );",
    "}",
  ].join("\n"),
};

const outline_material = new THREE.ShaderMaterial({
  uniforms: THREE.UniformsUtils.clone(outline_shader.uniforms),
  vertexShader: outline_shader.vertex_shader,
  fragmentShader: outline_shader.fragment_shader,
});

const gradient_shader = {
  uniforms: {
    color1: {
      type: "c",
      value: new THREE.Color(0xff0000),
    },
    color2: {
      type: "c",
      value: new THREE.Color(0x00ff00),
    },
  },
  vertex_shader: [
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = uv;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);",
    "}",
  ].join("\n"),
  fragment_shader: [
    "uniform vec3 color1;",
    "uniform vec3 color2;",
    "varying vec2 vUv;",
    "                                                        ",
    "void main() {",
    "  gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);",
    "}",
  ].join("\n"),
};

const gradient_material = new THREE.ShaderMaterial({
  uniforms: THREE.UniformsUtils.clone(gradient_shader.uniforms),
  vertexShader: gradient_shader.vertex_shader,
  fragmentShader: gradient_shader.fragment_shader,
});

const gradMat = new THREE.ShaderMaterial({
  uniforms: {
    color1: {
      value: new THREE.Color("red"),
    },
    color2: {
      value: new THREE.Color("purple"),
    },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv.y = (position.y - 0.1) / (3.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color1;
    uniform vec3 color2;
    varying vec2 vUv;
    void main() {
      gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
    }
  `,
});
