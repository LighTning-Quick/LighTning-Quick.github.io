const canvas = document.querySelector("#scene");
const labelLayer = document.querySelector("#labels");
const hexagramInput = document.querySelector("#hexagram");
const annotateButton = document.querySelector("#annotate");
const annotationStatus = document.querySelector("#annotationStatus");
const liftInput = document.querySelector("#lift");
const twistInput = document.querySelector("#twist");
const speedInput = document.querySelector("#speed");
const toggleButton = document.querySelector("#toggle");
const idiomModeButton = document.querySelector("#idiomMode");
const mirrorButton = document.querySelector("#mirror");
const resetButton = document.querySelector("#reset");

const gl = canvas.getContext("webgl", { antialias: true, alpha: true });

if (!gl) {
  document.body.innerHTML = "<p>当前浏览器不支持 WebGL。</p>";
  throw new Error("WebGL unavailable");
}

const vertexShaderSource = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute float aSide;
uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;
uniform mat3 uNormalMatrix;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vSide;
void main() {
  vec4 world = uModel * vec4(aPosition, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(uNormalMatrix * aNormal);
  vSide = aSide;
  gl_Position = uProjection * uView * world;
}
`;

const fragmentShaderSource = `
precision highp float;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vSide;
uniform vec3 uCamera;
uniform float uTime;
void main() {
  vec3 yin = vec3(0.015, 0.018, 0.023);
  vec3 yang = vec3(0.96, 0.89, 0.76);
  vec3 gold = vec3(1.0, 0.70, 0.24);
  vec3 cyan = vec3(0.25, 0.88, 0.96);
  vec3 base = mix(yin, yang, smoothstep(-0.18, 0.18, vSide));
  base += 0.15 * mix(cyan, gold, 0.5 + 0.5 * sin(vWorld.z * 1.7 + uTime));

  vec3 lightA = normalize(vec3(-0.35, 0.72, 0.60));
  vec3 lightB = normalize(vec3(0.75, -0.28, 0.48));
  vec3 viewDir = normalize(uCamera - vWorld);
  float diffuse = max(dot(vNormal, lightA), 0.0) * 0.78 + max(dot(vNormal, lightB), 0.0) * 0.38;
  float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.2);
  float pulse = 0.55 + 0.45 * sin(uTime * 2.4 + vWorld.z * 1.8);
  vec3 color = base * (0.32 + diffuse) + rim * mix(cyan, gold, pulse) * 0.78;
  gl_FragColor = vec4(color, 1.0);
}
`;

const program = createProgram(vertexShaderSource, fragmentShaderSource);
gl.useProgram(program);

const locations = {
  position: gl.getAttribLocation(program, "aPosition"),
  normal: gl.getAttribLocation(program, "aNormal"),
  side: gl.getAttribLocation(program, "aSide"),
  projection: gl.getUniformLocation(program, "uProjection"),
  view: gl.getUniformLocation(program, "uView"),
  model: gl.getUniformLocation(program, "uModel"),
  normalMatrix: gl.getUniformLocation(program, "uNormalMatrix"),
  camera: gl.getUniformLocation(program, "uCamera"),
  time: gl.getUniformLocation(program, "uTime"),
};

const buffers = {
  position: gl.createBuffer(),
  normal: gl.createBuffer(),
  side: gl.createBuffer(),
  index: gl.createBuffer(),
};

const state = {
  lift: 0,
  targetLift: 0,
  smoothness: Number(twistInput.value),
  offsetX: 0,
  offsetY: 0,
  mirrorCurve: false,
  idiomMode: false,
  speed: Number(speedInput.value),
  playing: true,
  yaw: -0.72,
  pitch: 0.78,
  distance: 7.4,
  dragging: false,
  panningCurve: false,
  annotation: null,
  lastX: 0,
  lastY: 0,
};

let mesh = null;
let lastMeshKey = "";
let lastTime = performance.now();

liftInput.addEventListener("input", () => {
  state.targetLift = Number(liftInput.value);
});

twistInput.addEventListener("input", () => {
  state.smoothness = Number(twistInput.value);
  lastMeshKey = "";
});

speedInput.addEventListener("input", () => {
  state.speed = Number(speedInput.value);
});

annotateButton.addEventListener("click", annotateHexagram);

hexagramInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") annotateHexagram();
});

toggleButton.addEventListener("click", () => {
  state.playing = !state.playing;
  toggleButton.textContent = state.playing ? "暂停" : "播放";
  toggleButton.setAttribute("aria-pressed", String(state.playing));
});

idiomModeButton.addEventListener("click", () => {
  state.idiomMode = !state.idiomMode;
  idiomModeButton.setAttribute("aria-pressed", String(state.idiomMode));
  idiomModeButton.textContent = state.idiomMode ? "短图式" : "四字成语";
  updateAnnotationStatus();
});

mirrorButton.addEventListener("click", () => {
  state.mirrorCurve = !state.mirrorCurve;
  mirrorButton.setAttribute("aria-pressed", String(state.mirrorCurve));
  mirrorButton.textContent = state.mirrorCurve ? "隐藏对称" : "对称曲线";
  lastMeshKey = "";
});

resetButton.addEventListener("click", () => {
  state.targetLift = 0;
  state.lift = 0;
  liftInput.value = "0";
  state.yaw = -0.72;
  state.pitch = 0.78;
  state.distance = 7.4;
  state.smoothness = 1;
  state.offsetX = 0;
  state.offsetY = 0;
  state.mirrorCurve = false;
  state.idiomMode = false;
  twistInput.value = "1";
  idiomModeButton.textContent = "四字成语";
  idiomModeButton.setAttribute("aria-pressed", "false");
  mirrorButton.textContent = "对称曲线";
  mirrorButton.setAttribute("aria-pressed", "false");
  lastMeshKey = "";
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.button === 2) {
    event.preventDefault();
    state.panningCurve = true;
  } else {
    state.dragging = true;
  }
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!state.dragging && !state.panningCurve) return;
  const dx = event.clientX - state.lastX;
  const dy = event.clientY - state.lastY;
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  if (state.panningCurve) {
    const dragScale = 0.0026 * state.distance;
    state.offsetX = clamp(state.offsetX + dx * dragScale, -1.4, 1.4);
    state.offsetY = clamp(state.offsetY - dy * dragScale, -1.4, 1.4);
    lastMeshKey = "";
  } else {
    state.yaw += dx * 0.006;
    state.pitch = clamp(state.pitch + dy * 0.005, -0.2, 1.34);
  }
});

canvas.addEventListener("pointerup", () => {
  state.dragging = false;
  state.panningCurve = false;
});

canvas.addEventListener("pointercancel", () => {
  state.dragging = false;
  state.panningCurve = false;
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    state.distance = clamp(state.distance + event.deltaY * 0.006, 4.4, 12.5);
  },
  { passive: false },
);

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(render);

function render(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (state.playing) {
    const next = state.targetLift + dt * (0.08 + state.speed * 0.42);
    state.targetLift = next > 1 ? next - 1 : next;
    liftInput.value = state.targetLift.toFixed(3);
  }

  state.lift += (state.targetLift - state.lift) * (1 - Math.pow(0.015, dt));

  const meshKey = [
    state.lift.toFixed(3),
    state.smoothness.toFixed(3),
    state.offsetX.toFixed(3),
    state.offsetY.toFixed(3),
    String(state.mirrorCurve),
    `${canvas.width}x${canvas.height}`,
  ].join("-");
  if (meshKey !== lastMeshKey) {
    mesh = buildTaijiTube(state.lift);
    uploadMesh(mesh);
    lastMeshKey = meshKey;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  const aspect = canvas.width / canvas.height;
  const projection = perspective(45 * Math.PI / 180, aspect, 0.1, 60);
  const camera = orbitCamera(state.yaw, state.pitch, state.distance);
  const view = lookAt(camera, [0, 0, 1.05], [0, 0, 1]);
  const model = identity();
  const normalMatrix = mat3FromMat4(model);

  gl.uniformMatrix4fv(locations.projection, false, projection);
  gl.uniformMatrix4fv(locations.view, false, view);
  gl.uniformMatrix4fv(locations.model, false, model);
  gl.uniformMatrix3fv(locations.normalMatrix, false, normalMatrix);
  gl.uniform3fv(locations.camera, camera);
  gl.uniform1f(locations.time, now * 0.001);

  gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
  updateLabels(projection, view, model);
  requestAnimationFrame(render);
}

function annotateHexagram() {
  const data = window.HEXAGRAM_SCHEMAS || {};
  const name = normalizeHexagramName(hexagramInput.value);
  const hexagram = data[name];

  if (!hexagram) {
    state.annotation = null;
    labelLayer.innerHTML = "";
    annotationStatus.textContent = `未找到「${name || "卦名"}」的六图式`;
    return;
  }

  const zongName = hexagram.zong;
  const zong = zongName ? data[zongName] : null;
  state.annotation = { name, hexagram, zongName, zong };
  updateAnnotationStatus();
}

function normalizeHexagramName(value) {
  return String(value || "")
    .replace(/[《》〈〉\s]/g, "")
    .trim();
}

function updateLabels(projection, view, model) {
  if (!state.annotation) return;

  const labels = [];
  appendAnnotationLabels(labels, state.annotation.name, state.annotation.hexagram, false, projection, view, model);
  if (state.mirrorCurve && state.annotation.zong) {
    appendAnnotationLabels(labels, state.annotation.zongName, state.annotation.zong, true, projection, view, model);
  }

  labelLayer.innerHTML = labels.join("");
}

function updateAnnotationStatus() {
  if (!state.annotation) return;
  const mode = state.idiomMode ? "四字成语" : "短图式";
  annotationStatus.textContent = state.annotation.zong
    ? `${state.annotation.name}：本卦；${state.annotation.zongName}：对称曲线；${mode}`
    : `${state.annotation.name}：本卦；未识别综卦；${mode}`;
}

function appendAnnotationLabels(labels, name, hexagram, mirrored, projection, view, model) {
  const schemas = (state.idiomMode && hexagram.idioms) ? hexagram.idioms : (hexagram.schemas || {});
  const points = controlPointSpecs();

  for (const point of points) {
    const world = controlPointWorld(point.t, mirrored);
    const screen = projectPoint(world, projection, view, model);
    if (!screen.visible) continue;

    const schemaNumber = mirrored ? 7 - point.number : point.number;
    const text = schemas[String(schemaNumber)];
    if (!text) continue;

    const lift = mirrored ? -10 : 10;
    const side = point.number <= 3 ? -1 : 1;
    const x = screen.x + side * 22;
    const y = screen.y - lift;
    labels.push(
      `<div class="point-label${mirrored ? " mirror" : ""}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px"><b>${schemaNumber}</b> ${escapeHtml(text)}</div>`,
    );
  }
}

function controlPointSpecs() {
  return [
    { number: 1, t: 0 },
    { number: 2, t: 0.14 },
    { number: 3, t: 0.28 },
    { number: 4, t: 0.72 },
    { number: 5, t: 0.86 },
    { number: 6, t: 1 },
  ];
}

function controlPointWorld(t, mirrored) {
  const flat = taijiOneStroke(t);
  const z = state.lift * 4.6 * (strokeHeight(t) - 0.5);
  return [
    state.offsetX + flat[0],
    state.offsetY + flat[1],
    mirrored ? -z : z,
  ];
}

function projectPoint(point, projection, view, model) {
  const world = multiplyVec4(model, [point[0], point[1], point[2], 1]);
  const camera = multiplyVec4(view, world);
  const clip = multiplyVec4(projection, camera);
  if (clip[3] <= 0.0001) return { visible: false, x: 0, y: 0 };

  const ndcX = clip[0] / clip[3];
  const ndcY = clip[1] / clip[3];
  const visible = ndcX >= -1.2 && ndcX <= 1.2 && ndcY >= -1.2 && ndcY <= 1.2;
  return {
    visible,
    x: (ndcX * 0.5 + 0.5) * canvas.clientWidth,
    y: (-ndcY * 0.5 + 0.5) * canvas.clientHeight,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTaijiTube(lift) {
  const pathSteps = 420;
  const radialSteps = 16;
  const radius = 0.055 + lift * 0.025;
  const height = lift * 4.6;
  const positions = [];
  const normals = [];
  const sideAttr = [];
  const indices = [];

  appendPath(makeStrokePath(pathSteps, height, false));
  if (state.mirrorCurve) appendPath(makeStrokePath(pathSteps, height, true));

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    sides: new Float32Array(sideAttr),
    indices: new Uint16Array(indices),
  };

  function appendPath(path) {
    const vertexOffset = positions.length / 3;
    let previousNormal = normalize([0, 0, 1]);

    for (let i = 0; i <= pathSteps; i++) {
      const p = path.points[i];
      const tangent = normalize(subtract(path.points[Math.min(i + 1, pathSteps)], path.points[Math.max(i - 1, 0)]));
      let normal = normalize(cross(tangent, [0, 0, 1]));
      if (length(normal) < 0.001) normal = previousNormal;
      const binormal = normalize(cross(tangent, normal));
      previousNormal = normal;

      for (let j = 0; j < radialSteps; j++) {
        const a = (j / radialSteps) * Math.PI * 2;
        const ringNormal = normalize(add(scale(normal, Math.cos(a)), scale(binormal, Math.sin(a))));
        const pos = add(p, scale(ringNormal, radius));
        positions.push(pos[0], pos[1], pos[2]);
        normals.push(ringNormal[0], ringNormal[1], ringNormal[2]);
        sideAttr.push(path.sides[i]);
      }
    }

    for (let i = 0; i < pathSteps; i++) {
      for (let j = 0; j < radialSteps; j++) {
        const a = vertexOffset + i * radialSteps + j;
        const b = vertexOffset + i * radialSteps + ((j + 1) % radialSteps);
        const c = vertexOffset + (i + 1) * radialSteps + j;
        const d = vertexOffset + (i + 1) * radialSteps + ((j + 1) % radialSteps);
        indices.push(a, c, b, b, c, d);
      }
    }
  }
}

function makeStrokePath(pathSteps, height, mirrored) {
  const points = [];
  const sides = [];

  for (let i = 0; i <= pathSteps; i++) {
    const t = i / pathSteps;
    const flat = taijiOneStroke(t);
    const z = height * (strokeHeight(t) - 0.5);
    if (mirrored) {
      points.push([state.offsetX + flat[0], state.offsetY + flat[1], -z]);
      sides.push(-flat[2]);
    } else {
      points.push([state.offsetX + flat[0], state.offsetY + flat[1], z]);
      sides.push(flat[2]);
    }
  }

  return { points, sides };
}

function taijiOneStroke(t) {
  const leftOuterPart = 0.28;
  const sPart = 0.44;

  if (t < leftOuterPart) {
    const p = t / leftOuterPart;
    const a = degToRad(210 - p * 120);
    return [Math.cos(a), Math.sin(a), 1];
  }

  if (t < leftOuterPart + sPart) {
    const s = (t - leftOuterPart) / sPart;
    if (s < 0.5) {
      const p = s / 0.5;
      const a = Math.PI / 2 - p * Math.PI;
      return [0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a), 1 - p];
    }

    const p = (s - 0.5) / 0.5;
    const a = Math.PI / 2 + p * Math.PI;
    return [0.5 * Math.cos(a), -0.5 + 0.5 * Math.sin(a), -p];
  }

  const p = (t - leftOuterPart - sPart) / (1 - leftOuterPart - sPart);
  const a = degToRad(270 + p * 120);
  return [Math.cos(a), Math.sin(a), -1];
}

function strokeHeight(t) {
  const controls = normalizedHeightControls();
  const waypoints = [
    { t: 0, h: 0 },
    { t: 0.14, h: controls.point2 },
    { t: 0.28, h: controls.point3 },
    { t: 0.5, h: 0.5 },
    { t: 0.72, h: controls.point4 },
    { t: 0.86, h: controls.point5 },
    { t: 1, h: 1 },
  ];

  const slopes = monotoneSlopes(waypoints);

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const p = (t - a.t) / span;
      const hermite = cubicHermite(a.h, b.h, slopes[i] * span, slopes[i + 1] * span, p);
      const linear = mix(a.h, b.h, p);
      return mix(linear, hermite, state.smoothness);
    }
  }

  return 1;
}

function monotoneSlopes(points) {
  const slopes = new Array(points.length).fill(0);
  const secants = [];

  for (let i = 0; i < points.length - 1; i++) {
    secants.push((points[i + 1].h - points[i].h) / (points[i + 1].t - points[i].t));
  }

  slopes[0] = secants[0];
  slopes[points.length - 1] = secants[secants.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = secants[i - 1];
    const next = secants[i];
    if (prev * next <= 0) {
      slopes[i] = 0;
    } else {
      slopes[i] = (2 * prev * next) / (prev + next);
    }
  }

  return slopes;
}

function cubicHermite(y0, y1, m0, m1, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * y0 +
    (t3 - 2 * t2 + t) * m0 +
    (-2 * t3 + 3 * t2) * y1 +
    (t3 - t2) * m1
  );
}

function normalizedHeightControls() {
  return {
    point2: 0.2,
    point3: 0.4,
    point4: 0.6,
    point5: 0.8,
  };
}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

function uploadMesh(nextMesh) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, nextMesh.positions, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(locations.position);
  gl.vertexAttribPointer(locations.position, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, nextMesh.normals, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(locations.normal);
  gl.vertexAttribPointer(locations.normal, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.side);
  gl.bufferData(gl.ARRAY_BUFFER, nextMesh.sides, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(locations.side);
  gl.vertexAttribPointer(locations.side, 1, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, nextMesh.indices, gl.DYNAMIC_DRAW);
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(canvas.clientWidth * dpr);
  const height = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    lastMeshKey = "";
  }
}

function createProgram(vertexSource, fragmentSource) {
  const vertex = createShader(gl.VERTEX_SHADER, vertexSource);
  const fragment = createShader(gl.FRAGMENT_SHADER, fragmentSource);
  const nextProgram = gl.createProgram();
  gl.attachShader(nextProgram, vertex);
  gl.attachShader(nextProgram, fragment);
  gl.linkProgram(nextProgram);
  if (!gl.getProgramParameter(nextProgram, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(nextProgram));
  }
  return nextProgram;
}

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

function orbitCamera(yaw, pitch, distance) {
  const cp = Math.cos(pitch);
  return [
    Math.cos(yaw) * cp * distance,
    Math.sin(yaw) * cp * distance,
    Math.sin(pitch) * distance + 1.0,
  ];
}

function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function lookAt(eye, center, up) {
  const z = normalize(subtract(eye, center));
  const x = normalize(cross(up, z));
  const y = cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ]);
}

function identity() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

function rotateZ(a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return new Float32Array([
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

function multiply(a, b) {
  const out = new Float32Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      out[col * 4 + row] =
        a[0 * 4 + row] * b[col * 4 + 0] +
        a[1 * 4 + row] * b[col * 4 + 1] +
        a[2 * 4 + row] * b[col * 4 + 2] +
        a[3 * 4 + row] * b[col * 4 + 3];
    }
  }
  return out;
}

function multiplyVec4(m, v) {
  return [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3],
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
    m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3],
  ];
}

function mat3FromMat4(m) {
  return new Float32Array([
    m[0], m[1], m[2],
    m[4], m[5], m[6],
    m[8], m[9], m[10],
  ]);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function length(a) {
  return Math.hypot(a[0], a[1], a[2]);
}

function normalize(a) {
  const l = length(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
