import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import { guessBodyPartFromMeshName } from "../data/bodyParts";
import { resolveHotspotsToWorld } from "../data/hotspots";
import Hotspot from "./Hotspot";

/** Selection (click) — distinct from hover */
const SELECT_COLOR = new THREE.Color("#007BFF");
const SELECT_EMISSIVE = new THREE.Color("#3399FF");
const BASE_EMISSIVE = new THREE.Color("#000000");

/** Hover uses Velzon primary (same family as toolbar / fullscreen); softened for light UI */
const THEME_PRIMARY_FALLBACK = "#800020";
const HOVER_EMISSIVE_INTENSITY = 0.58;
const SELECT_EMISSIVE_INTENSITY = 1.1;
const HOVER_SCALE = 1.018;
const HOVER_OVERLAY_OPACITY = 0.34;
const HOVER_TINT_WHITEN = 0.22;

function readThemePrimaryTHREE(gl) {
  const c = new THREE.Color();
  const scope =
    (typeof document !== "undefined" &&
      gl?.domElement &&
      gl.domElement.closest(".anatomy-root")) ||
    (typeof document !== "undefined" ? document.documentElement : null);
  let raw = "";
  if (scope) {
    raw =
      getComputedStyle(scope).getPropertyValue("--anat-primary").trim() ||
      getComputedStyle(document.documentElement).getPropertyValue("--vz-primary").trim();
  }
  if (!raw) raw = THEME_PRIMARY_FALLBACK;
  try {
    c.set(raw);
  } catch {
    c.set(THEME_PRIMARY_FALLBACK);
  }
  return c;
}

function toVec3(value, fallback = new THREE.Vector3(1, 1, 1)) {
  if (!value) return fallback.clone();
  if (value?.isVector3) return value.clone();
  if (Array.isArray(value) && value.length >= 3) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }
  if (typeof value === "object") {
    const x = Number(value.x);
    const y = Number(value.y);
    const z = Number(value.z);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      return new THREE.Vector3(x, y, z);
    }
  }
  return fallback.clone();
}

function forEachMaterial(mesh, fn) {
  const mat = mesh?.material;
  if (!mat) return;
  if (Array.isArray(mat)) mat.forEach((m) => m && fn(m));
  else fn(mat);
}

function ensureMeshMaterial(mesh) {
  // GLBs often share material references; clone so per-mesh color changes don't affect others.
  if (!mesh?.material) return;

  if (Array.isArray(mesh.material)) {
    mesh.material = mesh.material.map((m) => {
      if (!m) return m;
      if (m.userData?.__anatomyCloned) return m;
      const cloned = m.clone();
      cloned.userData = { ...(cloned.userData || {}), __anatomyCloned: true };
      return cloned;
    });
    return;
  }

  if (!mesh.material.userData?.__anatomyCloned) {
    const cloned = mesh.material.clone();
    cloned.userData = { ...(cloned.userData || {}), __anatomyCloned: true };
    mesh.material = cloned;
  }
}

export default function HumanModel({
  url,
  hoveredMesh,
  selectedMeshes,
  onHoverMesh,
  onSelectMesh,
  onMeshList,
  onBoundsComputed,
  onFocusMesh,
  transparentNonSelected,
  setCursorPointer,
  showHotspots = false,
  hotspotsData = [],
  onHotspotClick,
  hotspotHoverName = "",
  hotspotKeyPrefix = "",
}) {
  const hoverPaletteRef = useRef({
    tint: new THREE.Color(THEME_PRIMARY_FALLBACK),
    emissive: new THREE.Color(THEME_PRIMARY_FALLBACK),
  });
  const { scene } = useGLTF(url);
  const { camera, gl } = useThree();
  const meshStateRef = useRef(new Map());
  const normalizedRef = useRef(false);
  const lastHoverNameRef = useRef("");
  const lastAppliedHoverRef = useRef("");
  const loggedMeshesRef = useRef({ url: "", didLog: false });
  const meshesRef = useRef([]);
  const selectedSetRef = useRef(new Set());
  const hoverOverlayRef = useRef({ name: "", obj: null });
  const [boundsEpoch, setBoundsEpoch] = useState(0);

  // Drei caches GLTFs by URL. We mutate transforms/materials for interaction, so we must
  // clone per-mount to avoid “switch to women then back to men = empty/offset scene”.
  const localScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // Reset per-model refs when the URL changes.
  useEffect(() => {
    meshStateRef.current = new Map();
    normalizedRef.current = false;
  }, [url]);

  const meshes = useMemo(() => {
    const found = [];
    localScene.traverse((obj) => {
      if (obj && obj.isMesh) found.push(obj);
    });
    return found;
  }, [localScene]);

  const selectedSet = useMemo(() => {
    if (!Array.isArray(selectedMeshes) || selectedMeshes.length === 0) return null;
    return new Set(selectedMeshes);
  }, [selectedMeshes]);

  const lastFocusedSelectionRef = useRef("");

  useEffect(() => {
    if (!onFocusMesh || !selectedMeshes?.length || !meshes.length) {
      if (!selectedMeshes?.length) lastFocusedSelectionRef.current = "";
      return;
    }
    const key = selectedMeshes.slice().sort().join("|");
    if (lastFocusedSelectionRef.current === key) return;
    lastFocusedSelectionRef.current = key;

    const nameSet = new Set(selectedMeshes);
    const targets = meshes.filter((m) => nameSet.has(m.name));
    if (!targets.length) return;

    const box = new THREE.Box3();
    targets.forEach((m) => box.expandByObject(m));
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    const radius = Math.max(0.35, size.length() * 0.5);
    const dist = THREE.MathUtils.clamp(radius * 3.2, 1.8, 6.5);
    const dir = new THREE.Vector3().subVectors(camera.position, center).normalize();
    if (!Number.isFinite(dir.x) || dir.lengthSq() < 1e-6) {
      dir.set(1, 0.35, 1).normalize();
    }
    const position = center.clone().add(dir.multiplyScalar(dist));
    onFocusMesh({ target: center.clone(), position });
  }, [selectedMeshes, meshes, onFocusMesh, camera]);

  const placedHotspots = useMemo(() => {
    if (!showHotspots || !hotspotsData?.length) return [];
    if (!Array.isArray(selectedMeshes) || selectedMeshes.length === 0) return [];
    const nameSet = new Set(selectedMeshes);
    const partMeshes = meshes.filter((m) => nameSet.has(m.name));
    return resolveHotspotsToWorld(hotspotsData, partMeshes);
  }, [showHotspots, hotspotsData, selectedMeshes, meshes, boundsEpoch]);

  useEffect(() => {
    meshesRef.current = meshes;
  }, [meshes]);

  useEffect(() => {
    selectedSetRef.current = selectedSet || new Set();
  }, [selectedSet]);

  useEffect(() => {
    const primary = readThemePrimaryTHREE(gl);
    const white = new THREE.Color("#ffffff");
    hoverPaletteRef.current.tint.copy(primary).lerp(white, HOVER_TINT_WHITEN);
    hoverPaletteRef.current.emissive.copy(primary);

    const names = [];
    meshes.forEach((m) => {
      ensureMeshMaterial(m);
      m.castShadow = true;
      m.receiveShadow = true;

      let baseColor = null;
      let baseEmissive = BASE_EMISSIVE.clone();
      let baseEmissiveIntensity = 0;

      // Keep original materials so we can swap a dedicated hover material (most reliable for texture-heavy GLBs)
      const originalMaterial = m.material;
      const makeHoverMat = (srcMat) => {
        const hoverMat = new THREE.MeshStandardMaterial({
          color: hoverPaletteRef.current.tint.clone(),
          emissive: hoverPaletteRef.current.emissive.clone(),
          emissiveIntensity: HOVER_EMISSIVE_INTENSITY,
          roughness: 0.55,
          metalness: 0.05,
          // Force fully-visible hover. (Some GLBs use transparent/low opacity materials.)
          transparent: false,
          opacity: 1,
          // IMPORTANT: do NOT keep the original diffuse map, otherwise tint may be hard to see.
          // (Texture-heavy materials can visually override `color`.)
          map: null,
          alphaMap: srcMat?.alphaMap || null,
          side: srcMat?.side ?? THREE.FrontSide,
          depthWrite: true,
          depthTest: true,
          toneMapped: false,
        });
        // Preserve skinning/morph flags if present
        hoverMat.skinning = Boolean(m.isSkinnedMesh);
        hoverMat.morphTargets = Boolean(m.morphTargetInfluences);
        hoverMat.morphNormals = Boolean(m.morphTargetInfluences);
        return hoverMat;
      };

      const hoverMaterial = Array.isArray(originalMaterial)
        ? originalMaterial.map((mat) => makeHoverMat(mat))
        : makeHoverMat(originalMaterial);

      forEachMaterial(m, (mat) => {
        if (!baseColor && mat?.color) baseColor = mat.color.clone();
        if (mat?.emissive) baseEmissive = mat.emissive.clone();
        if (typeof mat?.emissiveIntensity === "number") {
          baseEmissiveIntensity = mat.emissiveIntensity;
        }
      });

      meshStateRef.current.set(m.uuid, {
        baseColor,
        baseEmissive,
        baseEmissiveIntensity,
        originalMaterial,
        hoverMaterial,
      });

      if (!m.userData.__anatomyBaseScale) {
        // Store as plain array so it survives cloning / HMR without losing Vector3 methods
        m.userData.__anatomyBaseScale = [m.scale.x, m.scale.y, m.scale.z];
      }

      if (m.name) names.push(m.name);
    });

    if (names.length) {
      const last = loggedMeshesRef.current;
      if (last.url !== url) {
        loggedMeshesRef.current = { url, didLog: false };
      }
      if (!loggedMeshesRef.current.didLog) {
        loggedMeshesRef.current.didLog = true;
        // eslint-disable-next-line no-console
        console.log("[AnatomyViewer] Discovered mesh names (" + names.length + "):", names);
      }
    }

    onMeshList?.(names);
  }, [meshes, onMeshList, gl]);

  const clearHoverOverlay = () => {
    const prev = hoverOverlayRef.current;
    if (prev?.obj && prev.obj.parent) prev.obj.parent.remove(prev.obj);
    if (prev?.obj?.material?.dispose) prev.obj.material.dispose();
    if (prev?.obj?.geometry?.dispose) prev.obj.geometry.dispose();
    hoverOverlayRef.current = { name: "", obj: null };
  };

  const applyHoverOverlay = (mesh) => {
    if (!mesh?.isMesh) return;
    // Remove existing overlay
    clearHoverOverlay();

    // A simple overlay mesh renders on top. This is the most reliable “always visible” hover indicator.
    const overlayMat = new THREE.MeshBasicMaterial({
      color: hoverPaletteRef.current.tint.clone(),
      transparent: true,
      opacity: HOVER_OVERLAY_OPACITY,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    overlayMat.polygonOffset = true;
    overlayMat.polygonOffsetFactor = -2;
    overlayMat.polygonOffsetUnits = -2;

    const overlay = new THREE.Mesh(mesh.geometry, overlayMat);
    overlay.name = "__hover_overlay__";
    overlay.renderOrder = 9999;
    overlay.frustumCulled = false;
    overlay.raycast = () => null;

    // Make it sit slightly above to avoid z-fighting
    overlay.scale.setScalar(1.0015);
    mesh.add(overlay);

    hoverOverlayRef.current = { name: mesh.name || "", obj: overlay };
  };

  // Manual raycast hover: reliable even if R3F hover events are flaky due to controls / event layers.
  useEffect(() => {
    if (!gl?.domElement) return;

    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const setHoverName = (name) => {
      const next = name || "";
      if (next !== lastHoverNameRef.current) {
        lastHoverNameRef.current = next;
        if (next) {
          // eslint-disable-next-line no-console
          console.log("Hovered:", next);
        }
      }
      onHoverMesh?.(next);
      setCursorPointer?.(Boolean(next));
    };

    const onMove = (ev) => {
      const rect = dom.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);
      pointer.set(x, y);

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(meshesRef.current, true);
      const hitMesh = hits?.[0]?.object;
      const hitName = hitMesh?.isMesh ? hitMesh.name : "";

      // Hover should NOT override selected
      if (hitName && selectedSetRef.current.has(hitName)) {
        setHoverName("");
        clearHoverOverlay();
        return;
      }
      setHoverName(hitName);
      if (hitName) applyHoverOverlay(hitMesh);
      else clearHoverOverlay();
    };

    const onLeave = () => setHoverName("");

    dom.addEventListener("pointermove", onMove, { passive: true });
    dom.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      dom.removeEventListener("pointermove", onMove);
      dom.removeEventListener("pointerleave", onLeave);
      clearHoverOverlay();
    };
  }, [camera, gl, onHoverMesh, setCursorPointer]);

  // Swap hover material on/off (robust, avoids “color change not visible” on textured materials)
  useEffect(() => {
    const selectedNames = selectedSet || new Set();
    const nextHover = hoveredMesh || "";
    const prevHover = lastAppliedHoverRef.current || "";

    // Restore previously hovered mesh
    if (prevHover && prevHover !== nextHover) {
      const prevMesh = meshes.find((m) => m.name === prevHover);
      if (prevMesh) {
        const st = meshStateRef.current.get(prevMesh.uuid);
        if (st?.originalMaterial) prevMesh.material = st.originalMaterial;
      }
    }

    // Apply hover only if not selected
    if (nextHover && !selectedNames.has(nextHover)) {
      const nextMesh = meshes.find((m) => m.name === nextHover);
      if (nextMesh) {
        const st = meshStateRef.current.get(nextMesh.uuid);
        if (st?.hoverMaterial) nextMesh.material = st.hoverMaterial;
      }
    }

    lastAppliedHoverRef.current = nextHover && !selectedNames.has(nextHover) ? nextHover : "";
  }, [hoveredMesh, meshes, selectedSet]);

  useEffect(() => {
    // Normalize the loaded GLB:
    // - center to origin
    // - scale to a consistent height
    // - align feet to a "ground" plane so it's centered & large in view
    if (normalizedRef.current) return;
    if (!localScene) return;

    const box = new THREE.Box3().setFromObject(localScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    if (!Number.isFinite(size.y) || size.y <= 0.0001) return;

    // Slightly smaller on-screen height so feet stay inside the viewport with typical camera FOV.
    const desiredHeight = 2.42;
    const scale = desiredHeight / size.y;

    localScene.position.sub(center);
    localScene.scale.setScalar(scale);

    // Recompute after scale/center and place on ground
    const box2 = new THREE.Box3().setFromObject(localScene);
    const groundY = -1.12;
    const deltaY = groundY - box2.min.y;
    localScene.position.y += deltaY;

    const box3 = new THREE.Box3().setFromObject(localScene);
    const size3 = box3.getSize(new THREE.Vector3());
    const center3 = box3.getCenter(new THREE.Vector3());

    onBoundsComputed?.({
      center: [center3.x, center3.y, center3.z],
      radius: size3.length() * 0.5,
      height: size3.y,
    });

    normalizedRef.current = true;
    setBoundsEpoch((e) => e + 1);
  }, [localScene, onBoundsComputed]);

  useFrame((_, delta) => {
    const speed = 12;
    const t = 1 - Math.exp(-speed * delta);

    const hasSelection = Boolean(selectedSet && selectedSet.size > 0);

    meshes.forEach((m) => {
      const st = meshStateRef.current.get(m.uuid);
      if (!st || !m.material) return;

      const isSelected = Boolean(selectedSet && selectedSet.has(m.name));
      const isHovered = Boolean(lastAppliedHoverRef.current && m.name === lastAppliedHoverRef.current);

      // Albedo policy (per your requirement):
      // - Hover: theme-primary tint (softened; matches app primary / fullscreen control)
      // - Click selection: keep original model color (no blue fill), selection is indicated via glow
      const baseAlbedo = st.baseColor || new THREE.Color(0xffffff);
      const targetColor = isHovered ? hoverPaletteRef.current.tint : baseAlbedo;

      if (m.material.transparent === false) m.material.transparent = true;

      // We keep “isolation/dim others” behind a prop, but the UI toggle was removed.
      // Default behavior in AnatomyViewer now passes `transparentNonSelected={false}`.
      let targetOpacity = 1;
      if (hasSelection && !isSelected && transparentNonSelected) targetOpacity = 0.22;
      forEachMaterial(m, (mat) => {
        if (!mat) return;
        if (mat.transparent === false) mat.transparent = true;

        mat.opacity = THREE.MathUtils.lerp(mat.opacity ?? 1, targetOpacity, t);

        if (mat.color && targetColor) {
          mat.color.lerp(targetColor, t);
        }

        // Glow reads best on PBR materials with emissive; plain Matcap/Basic meshes still pick up albedo tint.
        if (mat.emissive) {
          let emissiveTarget = st.baseEmissive || BASE_EMISSIVE;
          let intensityTarget = st.baseEmissiveIntensity ?? 0;

          // Hover-only glow (selection should not recolor/glow)
          if (isHovered) {
            emissiveTarget = hoverPaletteRef.current.emissive;
            intensityTarget = HOVER_EMISSIVE_INTENSITY;
          }

          mat.emissive.lerp(emissiveTarget, t);

          if (typeof mat.emissiveIntensity === "number") {
            mat.emissiveIntensity = THREE.MathUtils.lerp(
              mat.emissiveIntensity,
              intensityTarget,
              t
            );
          }
        }
      });

      // Subtle “lift” on hover (relative to each mesh’s authored scale)
      const base = toVec3(m.userData.__anatomyBaseScale, new THREE.Vector3(1, 1, 1));
      const hoverVec = base.clone().multiplyScalar(HOVER_SCALE);
      const restVec = base.clone();
      const targetScale = isHovered ? hoverVec : restVec;
      m.scale.lerp(targetScale, t);
    });
  });

  const onClick = (e) => {
    e.stopPropagation();
    const mesh = e.object;
    if (!mesh?.isMesh) return;
    const part = guessBodyPartFromMeshName(mesh.name);
    onSelectMesh?.({ meshName: mesh.name, partName: part, object: mesh });

    // Smooth camera emphasis toward the picked mesh (optional / bonus)
    if (typeof onFocusMesh === "function") {
      const box = new THREE.Box3().setFromObject(mesh);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);
      const radius = Math.max(0.35, size.length() * 0.5);
      const dist = THREE.MathUtils.clamp(radius * 3.2, 1.8, 6.5);
      const dir = new THREE.Vector3().subVectors(camera.position, center).normalize();
      if (!Number.isFinite(dir.x) || dir.lengthSq() < 1e-6) {
        dir.set(1, 0.35, 1).normalize();
      }
      const position = center.clone().add(dir.multiplyScalar(dist));
      onFocusMesh({ target: center.clone(), position });
    }
  };

  return (
    <>
      <primitive object={localScene} onClick={onClick} dispose={null} />
      {placedHotspots.map((hs) => (
        <Hotspot
          key={`${hotspotKeyPrefix || "hs"}_${hs.id ?? hs.name}`}
          hotspot={hs}
          onClick={onHotspotClick}
          showLabel={hotspotHoverName === hs.name}
        />
      ))}
    </>
  );
}

