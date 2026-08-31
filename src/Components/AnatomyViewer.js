import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  ContactShadows,
  Html,
} from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";

import HumanModel from "./HumanModel";
import GenderSelector from "./GenderSelector";
import BodyPartSectionsPanel from "./BodyPartSectionsPanel";
import BodyPartHotspotsPanel from "./BodyPartHotspotsPanel";
import { mapApiHotspotsForViewer } from "../data/hotspots";
import {
  resolveMeshesForMeshKey,
  findMeshKeyForPart,
} from "../data/meshKeyMapping";
import {
  getMeshKeyMasterList,
  getAnatomySectionMasterByMeshKeyId,
  getAnatomyHotspotBySectionId,
} from "../helpers/realbackend_helper";

import menUrl from "../assets/images/men.glb";
import womenUrl from "../assets/images/women.glb";

const MESH_KEY_LIST_REQUEST = { PageNumber: 1, PageSize: 10, SearchText: "" };
const SECTION_LIST_REQUEST = { PageNumber: 1, PageSize: 10 };
const HOTSPOT_LIST_REQUEST = { PageNumber: 1, PageSize: 10 };

function LoaderCard({ label }) {
  return (
    <div className="anatomy-loader">
      <div className="spinner-border spinner-border-sm me-2" role="status" />
      <span>{label || "Loading 3D model..."}</span>
    </div>
  );
}

/**
 * Smooth camera moves for framing / reset / mesh focus.
 * IMPORTANT: when the move completes, `focusRequest` is cleared so OrbitControls can
 * take over without fighting this rig every frame.
 */
function CameraRig({ focusRequest, controlsRef }) {
  const targetRef = useRef(null);
  const camPosRef = useRef(null);
  const lastFocusIdRef = useRef(0);

  useFrame(({ camera }, delta) => {
    const req = focusRequest?.current;
    if (!req || req.id == null) return;

    if (req.id !== lastFocusIdRef.current) {
      lastFocusIdRef.current = req.id;
      const controls = controlsRef.current;
      targetRef.current = (controls?.target ?? new THREE.Vector3()).clone();
      camPosRef.current = camera.position.clone();
    }

    const t = 1 - Math.exp(-6 * delta);
    targetRef.current.lerp(req.target, t);
    camPosRef.current.lerp(req.position, t);

    camera.position.copy(camPosRef.current);
    camera.lookAt(targetRef.current);

    const controls = controlsRef.current;
    if (controls) {
      controls.target.copy(targetRef.current);
      controls.update();
    }

    const epsPos = 0.035;
    const epsTgt = 0.035;
    const targetOk = controls ? controls.target.distanceTo(req.target) < epsTgt : true;
    if (camera.position.distanceTo(req.position) < epsPos && targetOk) {
      focusRequest.current = null;
      lastFocusIdRef.current = 0;
      targetRef.current = null;
      camPosRef.current = null;
    }
  });

  return null;
}

function ShadowMapTypeGuard() {
  const { gl } = useThree();
  useFrame(() => {
    // Some dependency is setting PCFSoftShadowMap repeatedly; force a stable, supported type.
    if (gl?.shadowMap?.type !== THREE.PCFShadowMap) {
      gl.shadowMap.type = THREE.PCFShadowMap;
    }
  });
  return null;
}

export default function AnatomyViewer({ onAddToRepertorization, repertorizationRubrics = [] }) {
  const [gender, setGender] = useState("male");
  const [hoveredMesh, setHoveredMesh] = useState("");
  const [selectedMesh, setSelectedMesh] = useState(""); // last clicked mesh name (for panel)
  const [selectedMeshes, setSelectedMeshes] = useState([]); // group selection (front/back etc.)
  const [selectedPart, setSelectedPart] = useState("");
  const [meshNames, setMeshNames] = useState([]);
  const [cursorPointer, setCursorPointer] = useState(false);
  const [singleMeshWarning, setSingleMeshWarning] = useState(false);
  const [defaultView, setDefaultView] = useState({
    target: new THREE.Vector3(0, 0.9, 0),
    // Front-facing default (for your GLB orientation)
    position: new THREE.Vector3(4.2, 1.2, 0),
  });
  const [viewerFullscreen, setViewerFullscreen] = useState(false);

  const [meshKeys, setMeshKeys] = useState([]);
  const [selectedMeshKey, setSelectedMeshKey] = useState(null);
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [sectionsError, setSectionsError] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [hotspotHoverName, setHotspotHoverName] = useState("");
  const [apiHotspots, setApiHotspots] = useState([]);
  const [hotspotsLoading, setHotspotsLoading] = useState(false);
  const [hotspotsError, setHotspotsError] = useState(null);

  useEffect(() => {
    document.body.style.cursor = cursorPointer ? "pointer" : "default";
    return () => {
      document.body.style.cursor = "default";
    };
  }, [cursorPointer]);

  const controlsRef = useRef(null);
  const focusRequest = useRef(null);
  const focusIdRef = useRef(0);

  const queueCameraFocus = useCallback((targetVec3, positionVec3) => {
    focusIdRef.current += 1;
    focusRequest.current = {
      id: focusIdRef.current,
      target: targetVec3.clone(),
      position: positionVec3.clone(),
    };
  }, []);

  const modelUrl = gender === "male" ? menUrl : womenUrl;

  const hotspots = useMemo(() => mapApiHotspotsForViewer(apiHotspots), [apiHotspots]);

  useEffect(() => {
    let cancelled = false;
    const loadMeshKeys = async () => {
      try {
        const response = await getMeshKeyMasterList(MESH_KEY_LIST_REQUEST);
        if (cancelled) return;
        setMeshKeys(response?.resultObject || []);
      } catch {
        if (!cancelled) setMeshKeys([]);
      }
    };
    loadMeshKeys();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSectionsForMeshKey = useCallback(async (meshKey) => {
    const meshKeyId = meshKey?.ThreeD_BodyPart_MeshKeyID;
    if (meshKeyId == null) {
      setSections([]);
      return;
    }
    setSectionsLoading(true);
    setSectionsError(null);
    setSections([]);
    setSelectedSectionId(null);
    setSelectedSection(null);
    setApiHotspots([]);
    setHotspotsError(null);
    try {
      const response = await getAnatomySectionMasterByMeshKeyId(
        meshKeyId,
        SECTION_LIST_REQUEST
      );
      setSections(response?.resultObject || []);
    } catch (err) {
      setSections([]);
      setSectionsError(
        typeof err === "string" ? err : err?.message || "Failed to load sections"
      );
    } finally {
      setSectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedPart || !meshKeys.length) return;
    const meshKey = findMeshKeyForPart(selectedPart, meshKeys, meshNames);
    if (
      meshKey &&
      meshKey.ThreeD_BodyPart_MeshKeyID !== selectedMeshKey?.ThreeD_BodyPart_MeshKeyID
    ) {
      setSelectedMeshKey(meshKey);
      loadSectionsForMeshKey(meshKey);
    }
  }, [meshKeys, meshNames, selectedPart, selectedMeshKey, loadSectionsForMeshKey]);

  const loadHotspotsForSection = useCallback(async (sectionRow) => {
    const sectionId = sectionRow?.ThreeDBodyPartSectionID ?? sectionRow?.sectionId;
    if (sectionId == null) {
      setApiHotspots([]);
      return;
    }
    setHotspotsLoading(true);
    setHotspotsError(null);
    setApiHotspots([]);
    setHotspotHoverName("");
    try {
      const response = await getAnatomyHotspotBySectionId(
        sectionId,
        HOTSPOT_LIST_REQUEST
      );
      setApiHotspots(response?.resultObject || []);
    } catch (err) {
      setApiHotspots([]);
      setHotspotsError(
        typeof err === "string" ? err : err?.message || "Failed to load hotspots"
      );
    } finally {
      setHotspotsLoading(false);
    }
  }, []);

  const onSelectMesh = useCallback(
    ({ meshName, partName }) => {
      setHoveredMesh("");
      setCursorPointer(false);
      setSelectedMesh(meshName);
      setSelectedPart(partName);

      const { meshes } = resolveMeshesForMeshKey(partName, meshNames);
      setSelectedMeshes(meshes.length ? meshes : [meshName]);

      const meshKey = findMeshKeyForPart(partName, meshKeys, meshNames);
      setSelectedMeshKey(meshKey);
      if (meshKey) {
        loadSectionsForMeshKey(meshKey);
      } else {
        setSections([]);
        setSectionsError(null);
        setSectionsLoading(false);
        setSelectedSectionId(null);
        setSelectedSection(null);
        setApiHotspots([]);
        setHotspotsError(null);
      }
    },
    [meshNames, meshKeys, loadSectionsForMeshKey]
  );

  const onSelectSection = useCallback(
    (row) => {
      setSelectedSectionId(row.ThreeDBodyPartSectionMasterID);
      setSelectedSection(row);
      loadHotspotsForSection(row);
    },
    [loadHotspotsForSection]
  );

  /** Clears mesh selection, hotspots, and restores materials — does not move the camera */
  const clearSelection = useCallback(() => {
    setHoveredMesh("");
    setCursorPointer(false);
    setSelectedMesh("");
    setSelectedMeshes([]);
    setSelectedPart("");
    setSelectedMeshKey(null);
    setSections([]);
    setSectionsError(null);
    setSelectedSectionId(null);
    setSelectedSection(null);
    setHotspotHoverName("");
    setApiHotspots([]);
    setHotspotsError(null);
  }, []);

  /** Clears sections/hotspots, resets camera, clears 3D highlight; keeps body part name in panels */
  const resetSectionsAndHotspots = useCallback(() => {
    setHoveredMesh("");
    setCursorPointer(false);
    setSelectedMesh("");
    setSelectedMeshes([]);
    setSections([]);
    setSectionsLoading(false);
    setSectionsError(null);
    setSelectedSectionId(null);
    setSelectedSection(null);
    setHotspotHoverName("");
    setApiHotspots([]);
    setHotspotsLoading(false);
    setHotspotsError(null);
    queueCameraFocus(defaultView.target, defaultView.position);
  }, [defaultView, queueCameraFocus]);

  /** Returns camera to the framed default — keeps current selection */
  const resetCameraOnly = useCallback(() => {
    queueCameraFocus(defaultView.target, defaultView.position);
  }, [defaultView, queueCameraFocus]);

  /** Full reset (used when switching models) */
  const resetAll = useCallback(() => {
    clearSelection();
    queueCameraFocus(defaultView.target, defaultView.position);
  }, [clearSelection, defaultView, queueCameraFocus]);

  const handleGenderChange = useCallback(
    (next) => {
      if (!next || next === gender) return;
      setGender(next);
      resetAll();
      setSelectedMeshKey(null);
      setSections([]);
      setSectionsError(null);
    },
    [gender, resetAll]
  );

  const onFocusMesh = useCallback(
    (payload) => {
      if (!payload?.target || !payload?.position) return;
      queueCameraFocus(payload.target, payload.position);
    },
    [queueCameraFocus]
  );

  return (
    <div
      className={`anatomy-root ${cursorPointer ? "cursor-pointer" : ""} ${viewerFullscreen ? "anatomy-root--fullscreen" : ""
        }`}
    >
      <div className="anatomy-header anatomy-header--toolbar">
        <div className="anatomy-header-actions">
          <GenderSelector
            value={gender}
            onChange={handleGenderChange}
          />

          <motion.button
            type="button"
            className="anatomy-action-btn"
            onClick={resetCameraOnly}
            whileTap={{ scale: 0.98 }}
          >
            Reset Camera
          </motion.button>

          <motion.button
            type="button"
            className="anatomy-action-btn"
            onClick={() => setViewerFullscreen((v) => !v)}
            whileTap={{ scale: 0.98 }}
          >
            {viewerFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </motion.button>

        </div>
      </div>

      <div className="anatomy-grid">
        <div className="anatomy-viewer-col">
          <div
            className="anatomy-canvas-wrap"
            onMouseLeave={() => {
              setHoveredMesh("");
              setCursorPointer(false);
            }}
          >
            <div className="anatomy-canvas-overlay" aria-label="3D viewer actions">
              <div className="anatomy-canvas-overlay__left">
                <button
                  type="button"
                  className={`btn btn-icon btn-topbar btn-ghost-secondary rounded-circle anatomy-canvas-icon-btn${gender === "male" ? " anatomy-canvas-icon-btn--active" : ""
                    }`}
                  title="Male"
                  aria-label="Male"
                  aria-pressed={gender === "male"}
                  onClick={() => handleGenderChange("male")}
                >
                  <i className="ri-men-line fs-20" />
                </button>
                <button
                  type="button"
                  className={`btn btn-icon btn-topbar btn-ghost-secondary rounded-circle anatomy-canvas-icon-btn${gender === "female" ? " anatomy-canvas-icon-btn--active" : ""
                    }`}
                  title="Female"
                  aria-label="Female"
                  aria-pressed={gender === "female"}
                  onClick={() => handleGenderChange("female")}
                >
                  <i className="ri-women-line fs-20" />
                </button>
              </div>
              <div className="anatomy-canvas-overlay__right">
                <button
                  type="button"
                  className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle anatomy-canvas-icon-btn"
                  title="Reset sections and hotspots"
                  aria-label="Reset sections and hotspots"
                  onClick={resetSectionsAndHotspots}
                >
                  <i className="ri-refresh-line fs-20" />
                </button>
                <button
                  type="button"
                  className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle anatomy-canvas-icon-btn"
                  title={viewerFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  aria-label={viewerFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  onClick={() => setViewerFullscreen((v) => !v)}
                >
                  <i
                    className={
                      viewerFullscreen
                        ? "ri-fullscreen-exit-line fs-20"
                        : "ri-fullscreen-line fs-20"
                    }
                  />
                </button>
              </div>
            </div>
            <Canvas
              shadows
              camera={{ position: [0, 1.4, 4.2], fov: 45, near: 0.1, far: 100 }}
              dpr={[1, 2]}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
                preserveDrawingBuffer: false,
              }}
              onCreated={({ gl }) => {
                // Explicit transparent clear so the canvas blends with the page / gradient behind it
                gl.setClearColor(0x000000, 0);
                // Keep default renderer shadow settings (avoid deprecation warnings from forced types)
              }}
              onPointerMove={(e) => {
                // When moving over empty space (no intersections), clear hover highlight.
                if (!e?.intersections?.length) {
                  setHoveredMesh("");
                  setCursorPointer(false);
                }
              }}
              onPointerMissed={(e) => {
                // Raycast missed all meshes — professional “click outside” deselect
                if (e?.button === 0) clearSelection();
              }}
            >
              <ShadowMapTypeGuard />
              <ambientLight intensity={0.35} />
              <directionalLight
                position={[4.5, 8, 5]}
                intensity={1.25}
                castShadow
                shadow-bias={-0.00018}
                shadow-mapSize={[2048, 2048]}
                shadow-camera-near={0.5}
                shadow-camera-far={40}
                shadow-camera-left={-6}
                shadow-camera-right={6}
                shadow-camera-top={6}
                shadow-camera-bottom={-6}
              />
              <directionalLight position={[-4, 4, -3]} intensity={0.35} />
              <spotLight position={[-5, 7, 4]} intensity={0.45} angle={0.45} penumbra={0.65} />

              <Suspense
                fallback={
                  <Html center>
                    <LoaderCard />
                  </Html>
                }
              >
                <HumanModel
                  url={modelUrl}
                  hoveredMesh={hoveredMesh}
                  selectedMeshes={selectedMeshes}
                  onHoverMesh={setHoveredMesh}
                  onSelectMesh={onSelectMesh}
                  onMeshList={(names) => {
                    setMeshNames(names);
                    // If GLB has a single mesh, body-part hover/selection is not possible.
                    setSingleMeshWarning(Array.isArray(names) && names.length <= 1);
                  }}
                  onBoundsComputed={({ center, radius }) => {
                    // Framing tuned so full figure (including feet) fits in typical viewports.
                    const c = new THREE.Vector3(center[0], center[1], center[2]);
                    const dist = Math.max(2.85, radius * 2.55);
                    const pos = new THREE.Vector3(c.x + dist, c.y + 0.06, c.z);
                    const next = { target: c, position: pos };
                    setDefaultView(next);
                    queueCameraFocus(next.target, next.position);
                  }}
                  onFocusMesh={onFocusMesh}
                  transparentNonSelected={false}
                  setCursorPointer={setCursorPointer}
                  showHotspots={Boolean(selectedSection) && hotspots.length > 0}
                  hotspotsData={hotspots}
                  onHotspotClick={() => { }}
                  hotspotHoverName={hotspotHoverName}
                  hotspotKeyPrefix={selectedPart || ""}
                />

                <Environment preset="studio" />
                <ContactShadows
                  position={[0, -1.25, 0]}
                  opacity={0.28}
                  width={9}
                  height={9}
                  blur={2.6}
                  far={7}
                  // Don't allow shadows plane to block "empty space" clicks.
                  raycast={null}
                />

                <CameraRig focusRequest={focusRequest} controlsRef={controlsRef} />
              </Suspense>

              <OrbitControls
                ref={controlsRef}
                makeDefault
                enableRotate
                enableZoom
                enablePan
                enableDamping
                dampingFactor={0.08}
                rotateSpeed={0.65}
                zoomSpeed={0.85}
                panSpeed={0.65}
                screenSpacePanning={false}
                maxDistance={14}
                minDistance={1.35}
                // Full 360° orbit with poles clamped to reduce sudden flip artifacts
                minPolarAngle={0.12}
                maxPolarAngle={Math.PI - 0.12}
              />
            </Canvas>
          </div>
        </div>

        <BodyPartSectionsPanel
          meshKeyName={selectedMeshKey?.ThreeD_BodyPart_MeshKey_Name}
          selectedPart={selectedPart}
          sections={sections}
          loading={sectionsLoading}
          error={sectionsError}
          selectedSectionId={selectedSectionId}
          onSelectSection={onSelectSection}
        />

        <BodyPartHotspotsPanel
          meshKeyName={selectedMeshKey?.ThreeD_BodyPart_MeshKey_Name}
          selectedPart={selectedPart}
          selectedSectionName={selectedSection?.SectionName}
          hotspots={hotspots}
          loading={hotspotsLoading}
          error={hotspotsError}
          hotspotHoverName={hotspotHoverName}
          setHotspotHoverName={setHotspotHoverName}
          onAddToRepertorization={onAddToRepertorization}
          repertorizationRubrics={repertorizationRubrics}
        />
      </div>

      {singleMeshWarning && (
        <div className="anatomy-warning">
          Your GLB contains only <b>one mesh</b>, so the whole body highlights together.
          To hover/select <b>Head / Left Arm / Right Leg</b> etc., export the model with
          <b> separate meshes per body part</b> (Blender: Edit Mode → select faces → Separate).
        </div>
      )}
    </div>
  );
}

