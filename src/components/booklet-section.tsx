"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  BOOKLET_PAGE_COUNT,
  bookletPageSrc,
  bookletSheets,
} from "@/lib/booklet-pages";

const LEAD_IN = 0.05;
const LEAD_OUT = 0.07;
const PAGE_SIZE = 1.6;
const PAGE_SEGMENTS = 32;
const SHEET_COUNT = bookletSheets.length;

/**
 * The page JPGs already carry a fine matte stock. This overlay is only a tight
 * tooth so it does not reprint as large fibres on top of that. Mipmaps keep it
 * from aliasing into visible grit at typical page size.
 */
const GRAIN_TILE = 256;
const GRAIN_REPEAT = 4;
const GRAIN_STRENGTH = 0.012;

/** Specular on printed ink (spot-UV / coated graphics), not on the paper. */
const GLOSS_LIGHT_LEN = Math.hypot(-0.28, 0.62, 0.72);
const GLOSS_LIGHT_X = -0.28 / GLOSS_LIGHT_LEN;
const GLOSS_LIGHT_Y = 0.62 / GLOSS_LIGHT_LEN;
const GLOSS_LIGHT_Z = 0.72 / GLOSS_LIGHT_LEN;
const GLOSS_STRENGTH = 0.55;
const GLOSS_POWER = 18;
/** Always-on varnish lift so coated ink reads glossier than paper at rest. */
const GLOSS_COAT = 0.07;

/**
 * Key light in the XZ plane. The sheets only bend around Y, so a 2D light is
 * enough to shade the curl and costs one dot product per column.
 */
const LIGHT_LENGTH = Math.hypot(-0.42, 0.91);
const LIGHT_X = -0.42 / LIGHT_LENGTH;
const LIGHT_Z = 0.91 / LIGHT_LENGTH;
const PAPER_DIFFUSE = 0.2;
/** Depth of the shaded valley where the pages meet the binding. */
const GUTTER_SHADE = 0.16;
/** Chosen so a flat page lands on exactly 1.0 and matches the source art. */
const PAPER_AMBIENT = 1 - PAPER_DIFFUSE * LIGHT_Z;

/**
 * The same key light raised above the book, used only to project the turning
 * page's shadow. Sheet normals have no Y component, so the height cannot affect
 * shading — it just decides where the shadow lands.
 */
const LIGHT_HEIGHT = 0.62;
/** Shadow displacement per unit the page is lifted off the resting stack. */
const SHADOW_SLIDE = -LIGHT_X / LIGHT_Z;
const SHADOW_DROP = LIGHT_HEIGHT / LIGHT_Z;
/** Sits above the thickest resting stack so the shadow wins the depth test. */
const SHADOW_PLANE_Z = 0.024;
const SHADOW_STRENGTH = 0.62;
/**
 * Kept tight: the page covers most of its own shadow, so the fringe around the
 * silhouette is the only part on screen and must not fade to nothing.
 */
const SHADOW_FEATHER = 0.05;

type BookSheet = {
  backMaterial: THREE.MeshBasicMaterial;
  backTexture: THREE.Texture;
  frontMaterial: THREE.MeshBasicMaterial;
  frontMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  frontTexture: THREE.Texture;
  geometry: THREE.PlaneGeometry;
  backMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  lambert: THREE.BufferAttribute;
  /** Per-vertex (sin θ, cos θ) of the local curl, for ink specular. */
  bend: THREE.BufferAttribute;
  originalX: Float32Array;
  originalY: Float32Array;
  /** Bend of the sheet along its width, reused to project the cast shadow. */
  xByColumn: Float32Array;
  zByColumn: Float32Array;
  nxByColumn: Float32Array;
  nzByColumn: Float32Array;
  lambertByColumn: Float32Array;
  easedTurn: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function pageLabel(turn: number) {
  const spread = clamp(Math.round(turn), 0, SHEET_COUNT);

  if (spread === 0) return `01 / ${BOOKLET_PAGE_COUNT}`;
  if (spread === SHEET_COUNT) {
    return `${BOOKLET_PAGE_COUNT} / ${BOOKLET_PAGE_COUNT}`;
  }

  const leftPage = spread * 2;
  return `${String(leftPage).padStart(2, "0")}–${String(leftPage + 1).padStart(2, "0")} / ${BOOKLET_PAGE_COUNT}`;
}

/**
 * Isotropic micro-roughness for matte stock. A 3×3 blur knocks out sparkle
 * without stretching the noise into visible fibres.
 */
function createGrainTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = GRAIN_TILE;
  canvas.height = GRAIN_TILE;

  const context = canvas.getContext("2d");
  if (!context) return null;

  const speckle = new Float32Array(GRAIN_TILE * GRAIN_TILE);
  for (let i = 0; i < speckle.length; i += 1) {
    speckle[i] = Math.random();
  }

  const image = context.createImageData(GRAIN_TILE, GRAIN_TILE);

  for (let y = 0; y < GRAIN_TILE; y += 1) {
    for (let x = 0; x < GRAIN_TILE; x += 1) {
      let blurred = 0;
      for (let row = -1; row <= 1; row += 1) {
        const wrappedRow = (y + row + GRAIN_TILE) % GRAIN_TILE;
        for (let col = -1; col <= 1; col += 1) {
          blurred +=
            speckle[
              wrappedRow * GRAIN_TILE + ((x + col + GRAIN_TILE) % GRAIN_TILE)
            ];
        }
      }
      blurred /= 9;

      const index = y * GRAIN_TILE + x;
      const value = clamp(0.5 + (blurred - 0.5) * 0.7, 0, 1);
      const channel = Math.round(value * 255);
      const pixel = index * 4;

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
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  return texture;
}

/**
 * Matte tooth on unprinted paper, coated specular on ink. `side` flips both
 * the lambert term and the world normal for the shared back-face geometry.
 */
function applyPaperSurface(
  material: THREE.MeshBasicMaterial,
  grain: THREE.Texture | null,
  side: "front" | "back",
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGrainMap = { value: grain };
    shader.uniforms.uGrainRepeat = { value: grain ? GRAIN_REPEAT : 0 };
    shader.uniforms.uGrainStrength = { value: grain ? GRAIN_STRENGTH : 0 };
    shader.uniforms.uSide = { value: side === "front" ? 1 : -1 };
    shader.uniforms.uAmbient = { value: PAPER_AMBIENT };
    shader.uniforms.uDiffuse = { value: PAPER_DIFFUSE };
    shader.uniforms.uGutter = { value: GUTTER_SHADE };
    shader.uniforms.uGloss = { value: GLOSS_STRENGTH };
    shader.uniforms.uGlossPower = { value: GLOSS_POWER };
    shader.uniforms.uGlossCoat = { value: GLOSS_COAT };
    shader.uniforms.uLight = {
      value: new THREE.Vector3(GLOSS_LIGHT_X, GLOSS_LIGHT_Y, GLOSS_LIGHT_Z),
    };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute float aLambert;
attribute vec2 aBend;
varying float vLambert;
varying vec2 vGrainUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vLambert = aLambert;
vGrainUv = uv;
vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
vWorldNormal = normalize(mat3(modelMatrix) * vec3(aBend.x, 0.0, aBend.y));`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform sampler2D uGrainMap;
uniform float uGrainRepeat;
uniform float uGrainStrength;
uniform float uSide;
uniform float uAmbient;
uniform float uDiffuse;
uniform float uGutter;
uniform float uGloss;
uniform float uGlossPower;
uniform float uGlossCoat;
uniform vec3 uLight;
varying float vLambert;
varying vec2 vGrainUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
float paperLight = uAmbient + uDiffuse * max(0.0, vLambert * uSide);
float fibre = texture2D(uGrainMap, vGrainUv * uGrainRepeat).r;
float tooth = 1.0 + (fibre - 0.5) * 2.0 * uGrainStrength;
float luma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
// Near-white is unprinted matte stock; everything else is coated ink.
float ink = 1.0 - smoothstep(0.84, 0.97, luma);
vec3 N = normalize(vWorldNormal) * uSide;
vec3 V = normalize(cameraPosition - vWorldPosition);
vec3 H = normalize(uLight + V);
float spec = pow(max(0.0, dot(N, H)), uGlossPower);
float fresnel = pow(1.0 - max(0.0, dot(N, V)), 2.4);
float gloss = (uGlossCoat + spec * 0.78 + fresnel * 0.22) * ink * uGloss;
// uv.x is 0 at the spine on both faces, so this darkens the binding valley.
float gutter = 1.0 - uGutter * (1.0 - smoothstep(0.0, 0.14, vGrainUv.x));
// Varnish fills the tooth; unprinted paper keeps the matte grain.
diffuseColor.rgb *= paperLight * mix(tooth, 1.0, ink * 0.85) * gutter;
diffuseColor.rgb += gloss * vec3(1.0, 0.997, 0.99);`,
      );
  };
}

/**
 * Feathered square used as the cast shadow's alpha. `alphaMap` reads the green
 * channel, so the falloff is written to RGB.
 */
function createShadowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) return null;

  const image = context.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const edge = Math.min(u, 1 - u, v, 1 - v);
      const level = Math.round(
        smoothstep(clamp(edge / SHADOW_FEATHER, 0, 1)) * 255,
      );
      const index = (y * size + x) * 4;
      image.data[index] = level;
      image.data[index + 1] = level;
      image.data[index + 2] = level;
      image.data[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

function configureTexture(
  texture: THREE.Texture,
  renderer: THREE.WebGLRenderer,
  mirrored = false,
) {
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
  const localTurn =
    rawTurn < 0.0005 ? 0 : rawTurn > 0.9995 ? 1 : rawTurn;
  const easedTurn = smoothstep(localTurn);
  const baseAngle = -Math.PI * easedTurn;
  const curlStrength = Math.sin(Math.PI * easedTurn) * 0.72;
  const position = sheet.geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const { xByColumn, zByColumn, lambertByColumn, nxByColumn, nzByColumn } =
    sheet;
  const segmentWidth = PAGE_SIZE / PAGE_SEGMENTS;

  sheet.easedTurn = easedTurn;

  let x = 0;
  let z = 0;

  for (let column = 1; column <= PAGE_SEGMENTS; column += 1) {
    const u = (column - 0.5) / PAGE_SEGMENTS;
    const curlProfile = Math.sin(Math.PI * u * 0.86);
    const segmentAngle = baseAngle - curlStrength * curlProfile;

    x += Math.cos(segmentAngle) * segmentWidth;
    z -= Math.sin(segmentAngle) * segmentWidth;
    xByColumn[column] = x;
    zByColumn[column] = z;
    nxByColumn[column] = Math.sin(segmentAngle);
    nzByColumn[column] = Math.cos(segmentAngle);
    // Surface normal of this segment, perpendicular to its tangent in XZ.
    lambertByColumn[column] =
      Math.sin(segmentAngle) * LIGHT_X + Math.cos(segmentAngle) * LIGHT_Z;
  }

  // The spine column has no segment of its own; it inherits the first one.
  lambertByColumn[0] = lambertByColumn[1];
  nxByColumn[0] = nxByColumn[1];
  nzByColumn[0] = nzByColumn[1];

  const rightStackDepth = (SHEET_COUNT - sheetIndex) * 0.003;
  const leftStackDepth = (sheetIndex + 1) * 0.003;
  const stackDepth =
    rightStackDepth +
    (leftStackDepth - rightStackDepth) * easedTurn +
    Math.sin(Math.PI * easedTurn) * 0.012;
  const vertexCount = position.count;

  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const sourceX = sheet.originalX[vertex];
    const column = clamp(
      Math.round((sourceX / PAGE_SIZE) * PAGE_SEGMENTS),
      0,
      PAGE_SEGMENTS,
    );
    const u = column / PAGE_SEGMENTS;
    const paperRipple =
      Math.sin(Math.PI * u) * Math.sin(Math.PI * easedTurn) * 0.008;

    position.setXYZ(
      vertex,
      xByColumn[column],
      sheet.originalY[vertex] + paperRipple,
      zByColumn[column] + stackDepth,
    );
    sheet.lambert.setX(vertex, lambertByColumn[column]);
    sheet.bend.setXY(vertex, nxByColumn[column], nzByColumn[column]);
  }

  position.needsUpdate = true;
  sheet.lambert.needsUpdate = true;
  sheet.bend.needsUpdate = true;

  const renderOrder =
    localTurn > 0.001 && localTurn < 0.999
      ? 200 + sheetIndex
      : localTurn >= 0.999
        ? 100 + sheetIndex
        : 100 + SHEET_COUNT - sheetIndex;
  sheet.frontMesh.renderOrder = renderOrder;
  sheet.backMesh.renderOrder = renderOrder;
}

export function BookletSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    let disposed = false;
    let inView = false;
    let frame: number | undefined;
    let previousTime = performance.now();
    let targetTurn = 0;
    let renderedTurn = 0;
    let lastLabel = "";
    const sheets: BookSheet[] = [];
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
        powerPreference: "high-performance",
      });
    } catch {
      window.setTimeout(() => setStatus("failed"), 0);
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 2, 0.1, 20);
    camera.position.set(0, 0.02, 3.15);
    camera.lookAt(0, 0, 0);

    const bookRoot = new THREE.Group();
    bookRoot.rotation.x = -0.045;
    scene.add(bookRoot);

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
      grainTexture.anisotropy = Math.min(
        renderer.capabilities.getMaxAnisotropy(),
        4,
      );
    }

    bookletSheets.forEach((source, sheetIndex) => {
      const geometry = new THREE.PlaneGeometry(
        PAGE_SIZE,
        PAGE_SIZE,
        PAGE_SEGMENTS,
        1,
      );
      geometry.translate(PAGE_SIZE / 2, 0, 0);

      const position = geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const originalX = new Float32Array(position.count);
      const originalY = new Float32Array(position.count);

      for (let vertex = 0; vertex < position.count; vertex += 1) {
        originalX[vertex] = position.getX(vertex);
        originalY[vertex] = position.getY(vertex);
      }

      const lambert = new THREE.BufferAttribute(
        new Float32Array(position.count),
        1,
      );
      lambert.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute("aLambert", lambert);

      const bend = new THREE.BufferAttribute(
        new Float32Array(position.count * 2),
        2,
      );
      bend.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute("aBend", bend);

      const frontTexture = textureLoader.load(bookletPageSrc(source.front));
      const backTexture = textureLoader.load(bookletPageSrc(source.back));
      configureTexture(frontTexture, renderer);
      configureTexture(backTexture, renderer, true);

      const frontMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: frontTexture,
        side: THREE.FrontSide,
      });
      const backMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: backTexture,
        side: THREE.BackSide,
      });

      applyPaperSurface(frontMaterial, grainTexture, "front");
      applyPaperSurface(backMaterial, grainTexture, "back");

      const frontMesh = new THREE.Mesh(geometry, frontMaterial);
      const backMesh = new THREE.Mesh(geometry, backMaterial);

      const sheet: BookSheet = {
        backMaterial,
        backMesh,
        backTexture,
        bend,
        easedTurn: 0,
        frontMaterial,
        frontMesh,
        frontTexture,
        geometry,
        lambert,
        lambertByColumn: new Float32Array(PAGE_SEGMENTS + 1),
        nxByColumn: new Float32Array(PAGE_SEGMENTS + 1),
        nzByColumn: new Float32Array(PAGE_SEGMENTS + 1),
        originalX,
        originalY,
        xByColumn: new Float32Array(PAGE_SEGMENTS + 1),
        zByColumn: new Float32Array(PAGE_SEGMENTS + 1),
      };

      sheets.push(sheet);
      bookRoot.add(frontMesh, backMesh);
      deformSheet(sheet, sheetIndex, 0);
    });

    /**
     * The turning page lifts a long way off the book, so without a shadow its
     * silhouette reads as a pasted rectangle. This projects the sheet's own bend
     * onto the resting stack along the light direction.
     */
    const shadowTexture = createShadowTexture();
    const shadowGeometry = new THREE.PlaneGeometry(
      PAGE_SIZE,
      PAGE_SIZE,
      PAGE_SEGMENTS,
      1,
    );
    shadowGeometry.translate(PAGE_SIZE / 2, 0, 0);

    const shadowPosition = shadowGeometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
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

    const shadowMaterial = new THREE.MeshBasicMaterial({
      alphaMap: shadowTexture ?? undefined,
      color: 0x2b2419,
      // Depth-tested so the page hides its own shadow, but never writes depth.
      depthWrite: false,
      opacity: 0,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadowMesh.visible = false;
    bookRoot.add(shadowMesh);

    const updateShadow = (turn: number) => {
      const index = Math.floor(turn);
      const sheet = index >= 0 && index < SHEET_COUNT ? sheets[index] : undefined;
      const eased = sheet?.easedTurn ?? 0;

      if (!sheet || eased <= 0.002 || eased >= 0.998) {
        shadowMesh.visible = false;
        return;
      }

      shadowMesh.visible = true;
      // A page held high throws a long, faint shadow; one settling back onto the
      // stack throws a tight, dark one. Without this the standing page drops a
      // hard slab of grey next to the spine.
      const contact = 1 - clamp(sheet.zByColumn[PAGE_SEGMENTS] / PAGE_SIZE, 0, 1);
      shadowMaterial.opacity =
        SHADOW_STRENGTH * contact * Math.sin(Math.PI * eased);

      for (let vertex = 0; vertex < shadowPosition.count; vertex += 1) {
        const column = shadowColumn[vertex];
        const lift = sheet.zByColumn[column];

        shadowPosition.setXYZ(
          vertex,
          sheet.xByColumn[column] + lift * SHADOW_SLIDE,
          shadowY[vertex] - lift * SHADOW_DROP,
          SHADOW_PLANE_Z,
        );
      }

      shadowPosition.needsUpdate = true;
    };

    const updateMeta = (turn: number) => {
      const nextLabel = pageLabel(turn);

      if (counterRef.current && nextLabel !== lastLabel) {
        counterRef.current.textContent = nextLabel;
        lastLabel = nextLabel;
      }
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${clamp(turn / SHEET_COUNT, 0, 1)})`;
      }
    };

    const updateBook = (turn: number) => {
      sheets.forEach((sheet, index) => deformSheet(sheet, index, turn));
      updateShadow(turn);

      const opening = smoothstep(clamp(turn, 0, 1));
      const closing = smoothstep(
        clamp(turn - (SHEET_COUNT - 1), 0, 1),
      );
      bookRoot.position.x =
        -(PAGE_SIZE / 2) * (1 - opening) + (PAGE_SIZE / 2) * closing;
      // Drives the width of the CSS contact shadow under the book.
      section.style.setProperty(
        "--book-open",
        (opening * (1 - closing)).toFixed(3),
      );
      updateMeta(turn);
    };

    const resizeRenderer = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
      const drawWidth = Math.floor(width * pixelRatio);
      const drawHeight = Math.floor(height * pixelRatio);

      if (canvas.width !== drawWidth || canvas.height !== drawHeight) {
        renderer.setSize(drawWidth, drawHeight, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };

    const updateTargetFromScroll = () => {
      if (reducedMotion) {
        targetTurn = 0;
        return;
      }

      const scrollDistance = Math.max(
        1,
        section.offsetHeight - window.innerHeight,
      );
      const sectionProgress = clamp(
        -section.getBoundingClientRect().top / scrollDistance,
        0,
        1,
      );
      const span = 1 - LEAD_IN - LEAD_OUT;
      const progress = clamp((sectionProgress - LEAD_IN) / span, 0, 1);
      targetTurn = progress * SHEET_COUNT;
      startFrame();
    };

    const render = (time: number) => {
      frame = undefined;
      if (disposed || !inView) return;

      const deltaSeconds = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      const smoothing = reducedMotion
        ? 1
        : 1 - Math.exp(-deltaSeconds * 13.5);
      renderedTurn += (targetTurn - renderedTurn) * smoothing;

      if (targetTurn === 0 && renderedTurn < 0.002) {
        renderedTurn = 0;
      } else if (
        targetTurn === SHEET_COUNT &&
        SHEET_COUNT - renderedTurn < 0.002
      ) {
        renderedTurn = SHEET_COUNT;
      }

      if (Math.abs(targetTurn - renderedTurn) < 0.0005) {
        renderedTurn = targetTurn;
      }

      resizeRenderer();
      updateBook(renderedTurn);
      renderer.render(scene, camera);

      if (Math.abs(targetTurn - renderedTurn) >= 0.0005) {
        frame = window.requestAnimationFrame(render);
      }
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
    const resizeObserver = new ResizeObserver(() => startFrame());

    observer.observe(section);
    resizeObserver.observe(canvas);
    canvas.addEventListener("webglcontextlost", onContextLost);
    window.addEventListener("scroll", updateTargetFromScroll, {
      passive: true,
    });
    window.addEventListener("resize", updateTargetFromScroll);

    updateMeta(0);
    resizeRenderer();
    updateBook(0);
    renderer.render(scene, camera);

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
        sheet.frontMaterial.dispose();
        sheet.backMaterial.dispose();
        sheet.frontTexture.dispose();
        sheet.backTexture.dispose();
      });
      grainTexture?.dispose();
      shadowGeometry.dispose();
      shadowMaterial.dispose();
      shadowTexture?.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="booklet"
      className="booklet-section relative h-[700vh]"
      data-status={status}
      aria-label="Team of Silicons offer booklet"
    >
      <div className="booklet-pin sticky top-0 flex h-dvh flex-col justify-center px-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
          <div className="booklet-stage">
            <div className="booklet-shadow" aria-hidden />

            <div className="booklet-viewer">
              <canvas
                ref={canvasRef}
                className="booklet-three-canvas"
                role="img"
                aria-label="Interactive 3D offer booklet. Scroll to turn its pages."
              />

              <div
                className="booklet-fallback"
                aria-hidden={status === "ready"}
              >
                <Image
                  src={bookletPageSrc(1)}
                  alt="Offer booklet front cover"
                  fill
                  sizes="(max-width: 640px) 46vw, 32rem"
                  priority={false}
                />
              </div>
            </div>
          </div>

          <div className="booklet-meta">
            <span className="booklet-meta__label">Scroll to turn</span>
            <div className="booklet-meta__track" aria-hidden>
              <div ref={progressRef} className="booklet-meta__bar" />
            </div>
            <span
              ref={counterRef}
              className="booklet-meta__counter"
              aria-live="polite"
            >
              01 / {BOOKLET_PAGE_COUNT}
            </span>
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            {status === "loading"
              ? "Interactive 3D offer booklet loading."
              : status === "failed"
                ? "3D booklet unavailable. Showing the cover image."
                : "Interactive 3D offer booklet ready. Scroll to turn its pages."}
          </p>
        </div>
      </div>
    </section>
  );
}
