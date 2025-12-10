import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Coinling from "./coinling.jsx"
import useCoinlings from "./useCoinlings.js"
import Dialogue from "./dialogue.jsx"
import { Camera } from "./camera.js"
import { apiFetch } from "../../fetch.js"

function view() {
    const { id } = useParams();
    const [village, setVillage] = useState(null);
    const [selected, setSelected] = useState(null); 
    const [coinlings, setCoinlings] = useState([]);
    const { 
        camera, 
        MIN_SCALE, 
        // used to tell if scroll wheel was used
        lastWheel,
        handleCameraDown, 
        handleCameraMove, 
        handleCameraUp } 
    = Camera();

    // helper to close selected dialogue and unpause/resume the coinling
    const closeSelected = (sel = selected) => {
        if (!sel) return;

        const i = sel.index;
        const coinlingEl = document.querySelectorAll(".coinling");
        const el = coinlingEl[i];
        if (el) el.style.transition = "none";

        setPositions((prev) =>
            prev.map((pos, idx) =>
                idx === i
                    ? {
                        ...pos,
                        paused: false,
                        forceStop: false,
                        duration: 3 + Math.random() * 2,
                        targetTop: Math.random() * 100,
                        targetLeft: Math.random() * 100,
                    }
                    : pos
            )
        );

        setSelected(null);
    };

    // close dialogue whenever the user uses the scroll wheel; ensures coinling is unpaused
    useEffect(() => {
        if (!selected) return;
        // lastWheel updates on any wheel event
        closeSelected();
    }, [lastWheel]);

    // recalculate rect based on camera
    useEffect(() => {
        if (!selected) return;

        const el = document.querySelectorAll(".coinling")[selected.index];
        if (!el) return;

        const rect = el.getBoundingClientRect();
        setSelected(prev => ({ ...prev, rect }));
    }, [camera.scale]);

    useEffect(() => {
        async function fetchVillage() {
            try {
                const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
                const token = userInfo.token;
                const payload = await apiFetch(`/villages/${id}`, {token});

                setVillage(payload.village);
                setCoinlings(payload.coinlings || []);
            } catch (err) {
                console.error("Failed to load village:", err);
            }
        }
        fetchVillage();
    }, [id]);

    const count = coinlings.length;
    const {positions, setPositions} = useCoinlings(count);

    return (
        <div
            className="field"
            onMouseDown={handleCameraDown}
            onMouseMove={handleCameraMove}
            onMouseUp={handleCameraUp}
            onMouseLeave={handleCameraUp}
            style={{ cursor: camera.scale > MIN_SCALE + 0.001 ? "grab" : "default" }}
        >
            <div
                style={{
                    width: "300vw",
                    height: "300vh",
                    transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
                    transformOrigin: "top left",
                    position: "relative",
                }}
            >
                {positions.map((p, i) => (
                    <Coinling
                        key={i}
                        ref={(el) => {
                            if (el && selected?.index === i && !selected.rect) {
                                const rect = el.getBoundingClientRect();
                                setSelected((prev) => ({...prev, rect}));
                            }
                        }}
                        position={p}
                        canDrag={camera.scale <= MIN_SCALE + 0.001}
                        onClick={(e) => {
                            // immediately stop transition when clicked
                            const el = e.currentTarget;
                            const field = document.querySelector(".field > div");
                            if (!field) return;

                            const fieldRect = field.getBoundingClientRect();
                            const rect = el.getBoundingClientRect();

                            const leftPercent = ((rect.left - fieldRect.left) / fieldRect.width) * 100;
                            const topPercent = ((rect.top - fieldRect.top) / fieldRect.height) * 100;

                            el.style.transition = "none";

                            el.style.left = `${leftPercent}%`;
                            el.style.top = `${topPercent}%`;

                            setPositions(prev =>
                                prev.map((pos, idx) =>
                                    idx === i
                                        ? {
                                            ...pos,
                                            top: topPercent,
                                            left: leftPercent,
                                            targetTop: topPercent,
                                            targetLeft: leftPercent,
                                            paused: true,
                                            forceStop: true,
                                            duration: 0
                                        }
                                        : pos
                                )
                            );

                            setSelected({index: i, rect: null});
                        }}
                        onMove={(newLeftPercent, newTopPercent) => {
                            setPositions((prev) =>
                                prev.map((pos, idx) =>
                                    idx === i
                                        ? {
                                            ...pos,
                                            dragging: true,
                                            left: Math.min(Math.max(newLeftPercent, 0), 100),
                                            top: Math.min(Math.max(newTopPercent, 0), 100),
                                        }
                                        : pos
                                )
                            );
                        }}
                        onDragEnd={() => {
                            setPositions((prev) =>
                                prev.map((pos, idx) => (idx === i ? {...pos, dragging: false} : pos))
                            );
                        }}
                    />
                ))}

                {selected?.rect && (
                    <Dialogue
                        coinling={{...coinlings[selected.index], position: positions[selected.index]}}
                        screenRect={selected.rect}
                        cameraScale={camera.scale}
                        onNameUpdated={(updatedCoinling) => {
                            setCoinlings((prev) =>
                                prev.map((c, idx) =>
                                    idx === selected.index ? updatedCoinling : c
                                )
                            );
                        }}
                        onClose={() => {
                            const coinlingEl = document.querySelectorAll(".coinling");
                            const el = coinlingEl[selected.index];

                            if (el) el.style.transition = "";

                            setPositions((prev) =>
                                prev.map((pos, idx) =>
                                    idx === selected.index
                                        ? {
                                            ...pos,
                                            paused: false,
                                            forceStop: false,
                                            duration: 3 + Math.random() * 2,
                                            targetTop: Math.random() * (100),
                                            targetLeft: Math.random() * (100)
                                        }
                                        : pos
                                )
                            );
                            setSelected(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

export default view;