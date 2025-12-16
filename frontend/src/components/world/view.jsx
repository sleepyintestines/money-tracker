import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Coinling from "./coinling.jsx"
import useCoinlings from "./useCoinlings.js"
import Dialogue from "./dialogue.jsx"
import { Camera } from "./camera.js"
import { apiFetch } from "../../fetch.js"

function view({hideHeader}) {
    const { id } = useParams();
    const [house, setHouse] = useState(null);
    const [selected, setSelected] = useState(null); 
    const [coinlings, setCoinlings] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const { 
        camera, 
        MIN_SCALE, 
        // used to tell if scroll wheel was used
        lastWheel,
        handleCameraDown, 
        handleCameraMove, 
        handleCameraUp } 
    = Camera();

    // calculate accessible area based on current house capacity
    const getPlayableAreaPercent = (capacity) => {
        const capacityToPercent = {
            2: 12.5,
            4: 17.677,
            8: 25,
            16: 35.355,
            32: 50,
            64: 70.711,
            128: 100
        };
        return capacityToPercent[capacity] || 12.5;
    };

    const playableAreaPercent = house ? getPlayableAreaPercent(house.capacity) : 100;
    const centerOffset = (100 - playableAreaPercent) / 2;

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
                        targetTop: centerOffset + Math.random() * playableAreaPercent,
                        targetLeft: centerOffset + Math.random() * playableAreaPercent,
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
        async function fetchHouse() {
            try {
                const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
                const token = userInfo.token;
                const payload = await apiFetch(`/houses/${id}`, {token});

                setHouse(payload.house);
                setCoinlings(payload.coinlings || []);
                setNewName(payload.house.name || "House");
            } catch (err) {
                console.error("Failed to load house:", err);
            }
        }
        fetchHouse();
    }, [id]);

    const count = coinlings.length;
    const {positions, setPositions} = useCoinlings(count, playableAreaPercent, centerOffset);

    // edit house name
    const updateHouseName = async (houseId, name) => {
        const token = localStorage.getItem("token");
        return await apiFetch(`/houses/${houseId}/name`, {
            method: "PATCH",
            body: { name },
            token
        });
    };

    const handleSave = async () => {
        if (!newName.trim() || newName === house.name) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            const updatedHouse = await updateHouseName(house._id, newName);
            setHouse(updatedHouse);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update house name:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
            setNewName(house.name);
            setIsEditing(false);
        }
    };

    return (
        <>
            {house && !hideHeader && (
                <div
                    style={{
                        position: "fixed",
                        top: "20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "white",
                        color: "black",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        fontSize: "1.2rem",
                        zIndex: 1000,
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                        pointerEvents: "auto",
                    }}
                >
                    {isEditing ? (
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleSave}
                            disabled={isSaving}
                            autoFocus
                            style={{
                                fontWeight: "bold",
                                marginBottom: "4px",
                                textAlign: "center",
                                background: "rgba(255, 255, 255, 0.2)",
                                border: "1px solid rgba(255, 255, 255, 0.5)",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "1.2rem",
                                width: "200px",
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                fontWeight: "bold",
                                marginBottom: "4px",
                                textAlign: "center",
                                cursor: "pointer",
                            }}
                            onClick={() => setIsEditing(true)}
                        >
                            {house.name || "House"}
                        </div>
                    )}
                    <div style={{ fontSize: "1rem", color: "#ccc", textAlign: "center" }}>
                        {count}/{house.capacity}
                    </div>
                </div>
            )}
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
                    background: "#000", // non accessible area is black
                }}
            >
                {/* accessible area container */}
                <div
                    style={{
                        position: "absolute",
                        top: `${centerOffset}%`,
                        left: `${centerOffset}%`,
                        width: `${playableAreaPercent}%`,
                        height: `${playableAreaPercent}%`,
                        background: "#fff",
                        pointerEvents: "none",
                    }}
                    className="playable-area"
                ></div>

                {positions.map((p, i) => (
                    <Coinling
                        key={i}
                        coinling={coinlings[i]}
                        ref={(el) => {
                            if (el && selected?.index === i && !selected.rect) {
                                const rect = el.getBoundingClientRect();
                                setSelected((prev) => ({...prev, rect}));
                            }
                        }}
                        position={p}
                        canDrag={camera.scale <= MIN_SCALE + 0.001}
                        playableAreaPercent={playableAreaPercent}
                        playableAreaOffset={centerOffset}
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
                                            left: newLeftPercent,
                                            top: newTopPercent,
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
                                            targetTop: centerOffset + Math.random() * playableAreaPercent,
                                            targetLeft: centerOffset + Math.random() * playableAreaPercent
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
        </>
    );
}

export default view;