import * as THREE from "three";
import { BOOKLET_PAGE_COUNT, bookletPageSrc, bookletSheets } from "~/lib/booklet-pages";

const LEAD_IN = 0.05;
const LEAD_OUT = 0.07;
const PAGE_SIZE = 1.6;
const HALF_PAGE = PAGE_SIZE / 2;
const PAGE_SEGMENTS = 40;
const SHEET_COUNT = bookletSheets.length;

/**
 * A narrow lens keeps perspective gentle: a page lifted towards the camera
 * still grows on screen, but not so much that the open spread has to shrink
 * to make room for it.
 */
const CAMERA_FOV = 24;
const CAMERA_TAN = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
/** Screen space, in CSS px, kept clear for the nav above and the caption below. */
const SAFE_TOP = 84;
const SAFE_BOTTOM = 72;
const SAFE_SIDE = 20;

/** Fine tooth on unprinted stock, kept faint because the JPGs already carry grain. */
const GRAIN_TILE = 256;
const GRAIN_REPEAT = 4;
const GRAIN_STRENGTH = 0.012;

/**
 * One soft key light above the table, slightly up and to the left of the
 * viewer, so a lifted page is lit from the front rather than backlit. Flat
 * pages face +Z, and ambient is solved to make a resting page render at
 * exactly 1.0 and match the printed art. Bent paper only ever darkens from
 * there, apart from a faint satin glint where the curl catches the light.
 */
const LIGHT = new THREE.Vector3(-0.2, 0.3, 0.93).normalize();
const DIFFUSE = 0.3;
const WRAP = 0.55;
const AMBIENT = 1 - (DIFFUSE * (LIGHT.z + WRAP)) / (1 + WRAP);
const SHEEN = 0.045;
const SHEEN_POWER = 40;
/** Depth of the shaded valley where the pages meet the binding. */
const GUTTER_SHADE = 0.11;

/** How far a page's shadow slides across the stack per unit it is lifted. */
const SHADOW_SLIDE_X = -LIGHT.x / LIGHT.z;
const SHADOW_SLIDE_Y = -LIGHT.y / LIGHT.z;
/** Sits above the thickest resting stack so the shadow wins the depth test. */
const SHADOW_PLANE_Z = 0.024;
const SHADOW_STRENGTH = 0.42;

type Bend = {
  x: Float32Array;
  z: Float32Array;
  nx: Float32Array;
  nz: Float32Array;
};

type BookSheet = Bend & {
  geometry: THREE.PlaneGeometry;
  frontMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  backMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  frontTexture: THREE.Texture;
  backTexture: THREE.Texture;
  /** Per-vertex (sin θ, cos θ) of the local curl: the paper normal in XZ. */
  normal: THREE.BufferAttribute;
  originalX: Float32Array;
  originalY: Float32Array;
  easedTurn: number;
  stackDepth: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function createBend(): Bend {
  return {
    x: new Float32Array(PAGE_SEGMENTS + 1),
    z: new Float32Array(PAGE_SEGMENTS + 1),
    nx: new Float32Array(PAGE_SEGMENTS + 1),
    nz: new Float32Array(PAGE_SEGMENTS + 1),
  };
}

/**
 * Walks the sheet from the spine outwards. The whole sheet rotates by the
 * turn angle and the free edge lags behind it, which is what reads as paper
 * rather than a rigid board.
 */
function bendSheet(bend: Bend, easedTurn: number) {
  const baseAngle = -Math.PI * easedTurn;
  const curlStrength = Math.sin(Math.PI * easedTurn) * 0.74;
  const segmentWidth = PAGE_SIZE / PAGE_SEGMENTS;
  let x = 0;
  let z = 0;

  for (let column = 1; column <= PAGE_SEGMENTS; column += 1) {
    const u = (column - 0.5) / PAGE_SEGMENTS;
    const angle = baseAngle - curlStrength * Math.sin(Math.PI * u * 0.86);

    x += Math.cos(angle) * segmentWidth;
    z -= Math.sin(angle) * segmentWidth;
    bend.x[column] = x;
    bend.z[column] = z;
    bend.nx[column] = Math.sin(angle);
    bend.nz[column] = Math.cos(angle);
  }

  // The spine column has no segment of its own; it inherits the first one.
  bend.nx[0] = bend.nx[1];
  bend.nz[0] = bend.nz[1];
}

function sheetStackDepth(sheetIndex: number, easedTurn: number) {
  const right = (SHEET_COUNT - sheetIndex) * 0.003;
  const left = (sheetIndex + 1) * 0.003;
  return lerp(right, left, easedTurn) + Math.sin(Math.PI * easedTurn) * 0.012;
}

function paperRipple(column: number, easedTurn: number) {
  return Math.sin((Math.PI * column) / PAGE_SEGMENTS) * Math.sin(Math.PI * easedTurn) * 0.008;
}

type Frame = { tan: number; aspect: number; marginX: number; marginY: number };

/** Camera distance that keeps one point inside the safe area of the viewport. */
function distanceFor(frame: Frame, x: number, y: number, z: number) {
  return Math.max(
    z + Math.abs(x) / (frame.marginX * frame.tan * frame.aspect),
    z + Math.abs(y) / (frame.marginY * frame.tan),
  );
}

/** Distance that fits a lying-flat footprint from `left` to `right`. */
function distanceForFlat(frame: Frame, left: number, right: number) {
  return Math.max(
    distanceFor(frame, left, HALF_PAGE, 0.02),
    distanceFor(frame, right, HALF_PAGE, 0.02),
  );
}

function distanceForBend(
  frame: Frame,
  bend: Bend,
  easedTurn: number,
  depth: number,
  offsetX: number,
) {
  let distance = 0;
  for (let column = 0; column <= PAGE_SEGMENTS; column += 1) {
    const ripple = paperRipple(column, easedTurn);
    const z = bend.z[column] + depth;
    const x = bend.x[column] + offsetX;
    distance = Math.max(
      distance,
      distanceFor(frame, x, HALF_PAGE + ripple, z),
      distanceFor(frame, x, -HALF_PAGE + ripple, z),
    );
  }
  return distance;
}

function pageLabel(turn: number) {
  const spread = clamp(Math.round(turn), 0, SHEET_COUNT);
  if (spread === 0) return `01 / ${BOOKLET_PAGE_COUNT}`;
  if (spread === SHEET_COUNT) return `${BOOKLET_PAGE_COUNT} / ${BOOKLET_PAGE_COUNT}`;
  const left = spread * 2;
  return `${String(left).padStart(2, "0")}–${String(left + 1).padStart(2, "0")} / ${BOOKLET_PAGE_COUNT}`;
}

/** Isotropic micro-roughness; a 3×3 blur knocks out sparkle without fibres. */
function createGrainTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = GRAIN_TILE;
  canvas.height = GRAIN_TILE;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const speckle = new Float32Array(GRAIN_TILE * GRAIN_TILE);
  for (let i = 0; i < speckle.length; i += 1) speckle[i] = Math.random();

  const image = context.createImageData(GRAIN_TILE, GRAIN_TILE);
  for (let y = 0; y < GRAIN_TILE; y += 1) {
    for (let x = 0; x < GRAIN_TILE; x += 1) {
      let blurred = 0;
      for (let row = -1; row <= 1; row += 1) {
        const wrappedRow = (y + row + GRAIN_TILE) % GRAIN_TILE;
        for (let col = -1; col <= 1; col += 1) {
          blurred += speckle[wrappedRow * GRAIN_TILE + ((x + col + GRAIN_TILE) % GRAIN_TILE)];
        }
      }
      const value = clamp(0.5 + (blurred / 9 - 0.5) * 0.7, 0, 1);
      const pixel = (y * GRAIN_TILE + x) * 4;
      const channel = Math.round(value * 255);
      image.data[pixel] = channel;
      image.data[pixel + 1] = channel;
      image.data[pixel + 2] = channel;
      image.data[pixel + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Matte paper lit by a single soft key light. `side` flips the normal for the
 * back face, which shares the front face's geometry.
 */
function applyPaperSurface(
  material: THREE.MeshBasicMaterial,
  grain: THREE.Texture | null,
  side: "front" | "back",
) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uGrainMap: { value: grain },
      uGrainRepeat: { value: grain ? GRAIN_REPEAT : 0 },
      uGrainStrength: { value: grain ? GRAIN_STRENGTH : 0 },
      uSide: { value: side === "front" ? 1 : -1 },
      uLight: { value: LIGHT },
      uAmbient: { value: AMBIENT },
      uDiffuse: { value: DIFFUSE },
      uWrap: { value: WRAP },
      uSheen: { value: SHEEN },
      uSheenPower: { value: SHEEN_POWER },
      uGutter: { value: GUTTER_SHADE },
    });

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute vec2 aNormal;
varying vec2 vPaperUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vPaperUv = uv;
vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
vWorldNormal = normalize(mat3(modelMatrix) * vec3(aNormal.x, 0.0, aNormal.y));`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform sampler2D uGrainMap;
uniform float uGrainRepeat;
uniform float uGrainStrength;
uniform float uSide;
uniform vec3 uLight;
uniform float uAmbient;
uniform float uDiffuse;
uniform float uWrap;
uniform float uSheen;
uniform float uSheenPower;
uniform float uGutter;
varying vec2 vPaperUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
vec3 N = normalize(vWorldNormal) * uSide;
vec3 V = normalize(cameraPosition - vWorldPosition);
float wrapped = max(0.0, (dot(N, uLight) + uWrap) / (1.0 + uWrap));
float light = uAmbient + uDiffuse * wrapped;
float sheen = pow(max(0.0, dot(N, normalize(uLight + V))), uSheenPower) * uSheen;
float fibre = texture2D(uGrainMap, vPaperUv * uGrainRepeat).r;
float tooth = 1.0 + (fibre - 0.5) * 2.0 * uGrainStrength;
// uv.x is 0 at the spine on both faces, so this darkens the binding valley.
float gutter = 1.0 - uGutter * (1.0 - smoothstep(0.0, 0.12, vPaperUv.x));
diffuseColor.rgb = diffuseColor.rgb * light * tooth * gutter + sheen;`,
      );
  };
}

/**
 * Shadow of the turning page on the resting stack. The penumbra widens and
 * fades with height above the paper, the way a real page's shadow softens as
 * it lifts, and it is clipped to the book so it never hangs off the edge as a
 * hard grey slab.
 */
function createCastShadowMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    // Depth-tested so the page hides its own shadow, but never writes depth.
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(0x2b2419) },
      uOpacity: { value: 0 },
      uExtent: { value: new THREE.Vector2(PAGE_SIZE, HALF_PAGE) },
    },
    vertexShader: `
attribute float aLift;
varying float vLift;
varying vec2 vUv;
varying vec2 vLocal;
void main() {
  vLift = aLift;
  vUv = uv;
  vLocal = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `
uniform vec3 uColor;
uniform float uOpacity;
uniform vec2 uExtent;
varying float vLift;
varying vec2 vUv;
varying vec2 vLocal;
void main() {
  float height = clamp(vLift / ${PAGE_SIZE.toFixed(2)}, 0.0, 1.0);
  float feather = 0.03 + 0.22 * height;
  float edge = smoothstep(0.0, feather, 1.0 - vUv.x)
    * smoothstep(0.0, feather, vUv.y)
    * smoothstep(0.0, feather, 1.0 - vUv.y);
  vec2 inside = uExtent - abs(vLocal);
  float clip = smoothstep(0.0, 0.03, inside.x) * smoothstep(0.0, 0.03, inside.y);
  float alpha = uOpacity * edge * clip * (1.0 - 0.7 * smoothstep(0.0, 0.8, height));
  gl_FragColor = vec4(uColor, alpha);
}`,
  });
}

/**
 * Soft shadow of the whole book on the table: a tight contact core and a wide
 * ambient falloff, both from one rounded-box distance so they stay in world
 * units however wide the footprint gets.
 */
function createGroundShadow() {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uHalf: { value: new THREE.Vector2(HALF_PAGE, HALF_PAGE) },
      uColor: { value: new THREE.Color(0x2b2419) },
      uOpacity: { value: 1 },
    },
    vertexShader: `
varying vec2 vPos;
void main() {
  vPos = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `
uniform vec2 uHalf;
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vPos;
float box(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main() {
  float contact = 1.0 - smoothstep(-0.02, 0.05, box(vPos - vec2(0.012, -0.018), uHalf, 0.02));
  float ambient = 1.0 - smoothstep(-0.12, 0.34, box(vPos - vec2(0.05, -0.09), uHalf, 0.08));
  float alpha = (contact * 0.26 + ambient * 0.24) * uOpacity;
  gl_FragColor = vec4(uColor, alpha);
}`,
  });

  // Large enough for the open spread plus the widest falloff.
  const geometry = new THREE.PlaneGeometry(PAGE_SIZE * 2 + 1.2, PAGE_SIZE + 1.2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = -0.02;
  mesh.renderOrder = -1;
  return { mesh, material, geometry };
}

function configureTexture(texture: THREE.Texture, renderer: THREE.WebGLRenderer, mirrored = false) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  if (mirrored) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = -1;
    texture.offset.x = 1;
  }
}

function deformSheet(sheet: BookSheet, sheetIndex: number, totalTurn: number) {
  const rawTurn = clamp(totalTurn - sheetIndex, 0, 1);
  const localTurn = rawTurn < 0.0005 ? 0 : rawTurn > 0.9995 ? 1 : rawTurn;
  const eased = smoothstep(localTurn);
  const position = sheet.geometry.getAttribute("position") as THREE.BufferAttribute;

  bendSheet(sheet, eased);
  sheet.easedTurn = eased;
  sheet.stackDepth = sheetStackDepth(sheetIndex, eased);

  for (let vertex = 0; vertex < position.count; vertex += 1) {
    const column = clamp(
      Math.round((sheet.originalX[vertex] / PAGE_SIZE) * PAGE_SEGMENTS),
      0,
      PAGE_SEGMENTS,
    );
    position.setXYZ(
      vertex,
      sheet.x[column],
      sheet.originalY[vertex] + paperRipple(column, eased),
      sheet.z[column] + sheet.stackDepth,
    );
    sheet.normal.setXY(vertex, sheet.nx[column], sheet.nz[column]);
  }

  position.needsUpdate = true;
  sheet.normal.needsUpdate = true;

  const renderOrder =
    localTurn > 0.001 && localTurn < 0.999
      ? 200 + sheetIndex
      : localTurn >= 0.999
        ? 100 + sheetIndex
        : 100 + SHEET_COUNT - sheetIndex;
  sheet.frontMesh.renderOrder = renderOrder;
  sheet.backMesh.renderOrder = renderOrder;
}

export type BookletElements = {
  section: HTMLElement;
  canvas: HTMLCanvasElement;
  fallback: HTMLDivElement;
  counter: HTMLSpanElement;
  progressBar: HTMLDivElement;
  setStatus: (status: "ready" | "failed") => void;
};

/** Builds the WebGL booklet and returns its teardown. */
export function createBookletScene(elements: BookletElements) {
  const { section, canvas, fallback, counter, progressBar, setStatus } = elements;
  let disposed = false;
  let inView = false;
  let frame: number | undefined;
  let previousTime = performance.now();
  let targetTurn = 0;
  let renderedTurn = 0;
  let lastLabel = "";
  let viewWidth = 0;
  let viewHeight = 0;
  let coverDistance = 1;
  let openDistance = 1;
  const sheets: BookSheet[] = [];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: "high-performance",
    });
  } catch {
    setStatus("failed");
    return () => {};
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.05, 80);
  const bookRoot = new THREE.Group();
  scene.add(bookRoot);

  const ground = createGroundShadow();
  scene.add(ground.mesh);

  const loadingManager = new THREE.LoadingManager();
  loadingManager.onLoad = () => {
    if (disposed) return;
    setStatus("ready");
    startFrame();
  };
  loadingManager.onError = () => {
    if (!disposed) setStatus("failed");
  };

  const textureLoader = new THREE.TextureLoader(loadingManager);
  const grainTexture = createGrainTexture();
  if (grainTexture) {
    grainTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
  }

  bookletSheets.forEach((source, sheetIndex) => {
    const geometry = new THREE.PlaneGeometry(PAGE_SIZE, PAGE_SIZE, PAGE_SEGMENTS, 1);
    geometry.translate(HALF_PAGE, 0, 0);

    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    const originalX = new Float32Array(position.count);
    const originalY = new Float32Array(position.count);
    for (let vertex = 0; vertex < position.count; vertex += 1) {
      originalX[vertex] = position.getX(vertex);
      originalY[vertex] = position.getY(vertex);
    }

    const normal = new THREE.BufferAttribute(new Float32Array(position.count * 2), 2);
    normal.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("aNormal", normal);
    position.setUsage(THREE.DynamicDrawUsage);

    const frontTexture = textureLoader.load(bookletPageSrc(source.front));
    const backTexture = textureLoader.load(bookletPageSrc(source.back));
    configureTexture(frontTexture, renderer);
    configureTexture(backTexture, renderer, true);

    const frontMaterial = new THREE.MeshBasicMaterial({ map: frontTexture, side: THREE.FrontSide });
    const backMaterial = new THREE.MeshBasicMaterial({ map: backTexture, side: THREE.BackSide });
    applyPaperSurface(frontMaterial, grainTexture, "front");
    applyPaperSurface(backMaterial, grainTexture, "back");

    const sheet: BookSheet = {
      ...createBend(),
      geometry,
      frontMesh: new THREE.Mesh(geometry, frontMaterial),
      backMesh: new THREE.Mesh(geometry, backMaterial),
      frontTexture,
      backTexture,
      normal,
      originalX,
      originalY,
      easedTurn: 0,
      stackDepth: 0,
    };

    // Vertices move every frame, so the cached bounds would cull wrongly.
    sheet.frontMesh.frustumCulled = false;
    sheet.backMesh.frustumCulled = false;
    sheets.push(sheet);
    bookRoot.add(sheet.frontMesh, sheet.backMesh);
    deformSheet(sheet, sheetIndex, 0);
  });

  /**
   * The turning page lifts a long way off the book, so without a shadow its
   * silhouette reads as a pasted rectangle. This projects the sheet's own
   * bend onto the resting stack along the light direction.
   */
  const shadowGeometry = new THREE.PlaneGeometry(PAGE_SIZE, PAGE_SIZE, PAGE_SEGMENTS, 1);
  shadowGeometry.translate(HALF_PAGE, 0, 0);
  const shadowPosition = shadowGeometry.getAttribute("position") as THREE.BufferAttribute;
  shadowPosition.setUsage(THREE.DynamicDrawUsage);
  const shadowLift = new THREE.BufferAttribute(new Float32Array(shadowPosition.count), 1);
  shadowLift.setUsage(THREE.DynamicDrawUsage);
  shadowGeometry.setAttribute("aLift", shadowLift);
  const shadowColumn = new Uint8Array(shadowPosition.count);
  const shadowY = new Float32Array(shadowPosition.count);
  for (let vertex = 0; vertex < shadowPosition.count; vertex += 1) {
    shadowColumn[vertex] = clamp(
      Math.round((shadowPosition.getX(vertex) / PAGE_SIZE) * PAGE_SEGMENTS),
      0,
      PAGE_SEGMENTS,
    );
    shadowY[vertex] = shadowPosition.getY(vertex);
  }
  const shadowMaterial = createCastShadowMaterial();
  const shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
  shadowMesh.frustumCulled = false;
  shadowMesh.visible = false;
  bookRoot.add(shadowMesh);

  const updateShadow = (sheet: BookSheet | undefined) => {
    const eased = sheet?.easedTurn ?? 0;
    if (!sheet || eased <= 0.002 || eased >= 0.998) {
      shadowMesh.visible = false;
      return;
    }

    shadowMesh.visible = true;
    // A page held high throws a long, faint shadow; one settling back onto
    // the stack throws a tight, dark one.
    const contact = 1 - clamp(sheet.z[PAGE_SEGMENTS] / PAGE_SIZE, 0, 1);
    shadowMaterial.uniforms.uOpacity.value =
      SHADOW_STRENGTH * (0.45 + 0.55 * contact) * Math.sin(Math.PI * eased);

    for (let vertex = 0; vertex < shadowPosition.count; vertex += 1) {
      const column = shadowColumn[vertex];
      const lift = sheet.z[column];
      shadowPosition.setXYZ(
        vertex,
        sheet.x[column] + lift * SHADOW_SLIDE_X,
        shadowY[vertex] + lift * SHADOW_SLIDE_Y,
        SHADOW_PLANE_Z,
      );
      shadowLift.setX(vertex, lift);
    }
    shadowPosition.needsUpdate = true;
    shadowLift.needsUpdate = true;
  };

  const updateMeta = (turn: number) => {
    const label = pageLabel(turn);
    if (label !== lastLabel) {
      counter.textContent = label;
      lastLabel = label;
    }
    progressBar.style.transform = `scaleX(${clamp(turn / SHEET_COUNT, 0, 1)})`;
  };

  const viewFrame = (): Frame => ({
    tan: CAMERA_TAN,
    aspect: viewWidth / viewHeight,
    marginX: clamp(1 - (2 * SAFE_SIDE) / viewWidth, 0.5, 1),
    marginY: clamp(1 - (2 * Math.max(SAFE_TOP, SAFE_BOTTOM)) / viewHeight, 0.4, 1),
  });

  /**
   * Two fixed framings: the closed cover filling the view, and the open
   * spread pulled back far enough that no page ever leaves the frame while
   * it turns. Holding the second constant through the middle of the book
   * stops the camera breathing with every page.
   */
  const updateFraming = () => {
    const view = viewFrame();
    coverDistance = distanceForFlat(view, -HALF_PAGE, HALF_PAGE);

    const probe = createBend();
    let turningDistance = 0;
    for (let step = 1; step < 48; step += 1) {
      const eased = smoothstep(step / 48);
      bendSheet(probe, eased);
      turningDistance = Math.max(
        turningDistance,
        distanceForBend(view, probe, eased, sheetStackDepth(SHEET_COUNT >> 1, eased), 0),
      );
    }
    openDistance = Math.max(distanceForFlat(view, -PAGE_SIZE, PAGE_SIZE), turningDistance);

    // Size the CSS cover to match where the 3D cover will land.
    const coverPx = (PAGE_SIZE / (2 * coverDistance * CAMERA_TAN)) * viewHeight;
    fallback.style.width = `${Math.round(coverPx)}px`;
  };

  const updateBook = (turn: number) => {
    sheets.forEach((sheet, index) => deformSheet(sheet, index, turn));

    const opening = smoothstep(clamp(turn, 0, 1));
    const closing = smoothstep(clamp(turn - (SHEET_COUNT - 1), 0, 1));
    const openness = opening * (1 - closing);
    bookRoot.position.x = -HALF_PAGE * (1 - opening) + HALF_PAGE * closing;

    const turningIndex = Math.floor(turn);
    const turning =
      turningIndex >= 0 && turningIndex < SHEET_COUNT ? sheets[turningIndex] : undefined;
    updateShadow(turning);

    // Never closer than the framing for this stage of the book, and never so
    // close that the page in the air leaves the frame.
    let distance = lerp(coverDistance, openDistance, openness);
    if (turning && turning.easedTurn > 0 && turning.easedTurn < 1) {
      distance = Math.max(
        distance,
        distanceForBend(
          viewFrame(),
          turning,
          turning.easedTurn,
          turning.stackDepth,
          bookRoot.position.x,
        ),
      );
    }
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);

    // Only paper lying on the table casts the ground shadow. While the cover
    // or the back cover is in the air there is nothing under it, so that side
    // of the footprint grows in as the sheet lands and shrinks as it lifts.
    const eased = turning?.easedTurn ?? 0;
    const leftCover =
      turn >= 1 ? 1 : turningIndex === 0 ? smoothstep(clamp((eased - 0.7) / 0.3, 0, 1)) : 0;
    const rightCover =
      turn < SHEET_COUNT - 1
        ? 1
        : turningIndex === SHEET_COUNT - 1
          ? 1 - smoothstep(clamp(eased / 0.3, 0, 1))
          : 0;
    const left = bookRoot.position.x - PAGE_SIZE * leftCover;
    const right = bookRoot.position.x + PAGE_SIZE * rightCover;
    ground.mesh.position.x = (left + right) / 2;
    ground.material.uniforms.uHalf.value.set(Math.max(0.001, (right - left) / 2), HALF_PAGE);
    updateMeta(turn);
  };

  const resizeRenderer = () => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const drawWidth = Math.floor(width * pixelRatio);
    const drawHeight = Math.floor(height * pixelRatio);

    if (width !== viewWidth || height !== viewHeight) {
      viewWidth = width;
      viewHeight = height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      updateFraming();
    }
    if (canvas.width !== drawWidth || canvas.height !== drawHeight) {
      renderer.setSize(drawWidth, drawHeight, false);
    }
  };

  const updateTargetFromScroll = () => {
    if (reducedMotion) {
      targetTurn = 0;
      return;
    }
    const scrollDistance = Math.max(1, section.offsetHeight - window.innerHeight);
    const sectionProgress = clamp(-section.getBoundingClientRect().top / scrollDistance, 0, 1);
    const span = 1 - LEAD_IN - LEAD_OUT;
    targetTurn = clamp((sectionProgress - LEAD_IN) / span, 0, 1) * SHEET_COUNT;
    startFrame();
  };

  const draw = () => {
    resizeRenderer();
    updateBook(renderedTurn);
    renderer.render(scene, camera);
  };

  const render = (time: number) => {
    frame = undefined;
    if (disposed || !inView) return;

    const deltaSeconds = Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    const smoothing = reducedMotion ? 1 : 1 - Math.exp(-deltaSeconds * 12);
    renderedTurn += (targetTurn - renderedTurn) * smoothing;
    if (Math.abs(targetTurn - renderedTurn) < 0.0005) renderedTurn = targetTurn;

    draw();

    if (renderedTurn !== targetTurn) frame = window.requestAnimationFrame(render);
  };

  function startFrame() {
    if (!disposed && inView && frame === undefined) {
      previousTime = performance.now();
      frame = window.requestAnimationFrame(render);
    }
  }

  const onContextLost = (event: Event) => {
    event.preventDefault();
    if (!disposed) setStatus("failed");
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      if (inView) {
        updateTargetFromScroll();
        startFrame();
      } else if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
        frame = undefined;
      }
    },
    { rootMargin: "100% 0px" },
  );
  // A resize needs one redraw even when the turn is already settled.
  const resizeObserver = new ResizeObserver(() => {
    if (!disposed) draw();
  });

  observer.observe(section);
  resizeObserver.observe(canvas);
  canvas.addEventListener("webglcontextlost", onContextLost);
  window.addEventListener("scroll", updateTargetFromScroll, { passive: true });
  window.addEventListener("resize", updateTargetFromScroll);

  draw();

  return () => {
    disposed = true;
    observer.disconnect();
    resizeObserver.disconnect();
    canvas.removeEventListener("webglcontextlost", onContextLost);
    window.removeEventListener("scroll", updateTargetFromScroll);
    window.removeEventListener("resize", updateTargetFromScroll);
    if (frame !== undefined) window.cancelAnimationFrame(frame);

    sheets.forEach((sheet) => {
      sheet.geometry.dispose();
      sheet.frontMesh.material.dispose();
      sheet.backMesh.material.dispose();
      sheet.frontTexture.dispose();
      sheet.backTexture.dispose();
    });
    grainTexture?.dispose();
    shadowGeometry.dispose();
    shadowMaterial.dispose();
    ground.geometry.dispose();
    ground.material.dispose();
    renderer.dispose();
  };
}
