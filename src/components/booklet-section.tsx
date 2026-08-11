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

type BookSheet = {
  backMaterial: THREE.MeshBasicMaterial;
  backTexture: THREE.Texture;
  frontMaterial: THREE.MeshBasicMaterial;
  frontMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  frontTexture: THREE.Texture;
  geometry: THREE.PlaneGeometry;
  backMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  originalX: Float32Array;
  originalY: Float32Array;
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
  const xByColumn = new Float32Array(PAGE_SEGMENTS + 1);
  const zByColumn = new Float32Array(PAGE_SEGMENTS + 1);
  const segmentWidth = PAGE_SIZE / PAGE_SEGMENTS;

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
  }

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
  }

  position.needsUpdate = true;

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

      const frontMesh = new THREE.Mesh(geometry, frontMaterial);
      const backMesh = new THREE.Mesh(geometry, backMaterial);

      const sheet: BookSheet = {
        backMaterial,
        backMesh,
        backTexture,
        frontMaterial,
        frontMesh,
        frontTexture,
        geometry,
        originalX,
        originalY,
      };

      sheets.push(sheet);
      bookRoot.add(frontMesh, backMesh);
      deformSheet(sheet, sheetIndex, 0);
    });

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

      const opening = smoothstep(clamp(turn, 0, 1));
      const closing = smoothstep(
        clamp(turn - (SHEET_COUNT - 1), 0, 1),
      );
      bookRoot.position.x =
        -(PAGE_SIZE / 2) * (1 - opening) + (PAGE_SIZE / 2) * closing;
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
