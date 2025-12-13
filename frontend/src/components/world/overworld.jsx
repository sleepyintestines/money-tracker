import { useEffect, useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Camera } from "./camera.js"
import { apiFetch } from "../../fetch.js"

import "../../css/overworld.css";

function overworld({coinlings, onRefresh, deleteMode, onDeleteVillage, show = false}) {
    const [villages, setVillages] = useState([]);

    // for merging villages
    const [residentAmount, setResidentAmount] = useState({});
    const [draggingVillage, setDraggingVillage] = useState(null);
    const [hoveredVillage, setHoveredVillage] = useState(null);
    const [draggingCoinling, setDraggingCoinling] = useState(null);
    const [coinlingDragOffset, setCoinlingDragOffset] = useState({x: 0, y: 0});
    const [showTooltip, setShowTooltip] = useState(null);

    const {
        camera,
        MIN_SCALE,
        handleCameraDown,
        handleCameraMove,
        handleCameraUp,
    } = Camera();

    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const suppressClickRef = useRef(false);
    const navigate = useNavigate();
    const fieldRef = useRef(null);

    const fetchVillages = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await apiFetch("/villages", { token });

            setVillages(data);
        } catch (err) {
            console.error("Failed to load villages:", err);
        }
    };

    // get amount of coinlings inside a village
    const fetchCount = async () => {
        const counts = {};
        for(const v of villages){
            counts[v._id] = coinlings.filter(g => g.village === v._id && !g.dead).length;
        }

        setResidentAmount(counts);
    }

    const updateVillagePosition = async (id, leftPercent, topPercent) => {
        try {
            const token = localStorage.getItem("token");
            await apiFetch(`/villages/${id}/position`, {
                method: "PUT",
                token,
                body: { leftPercent, topPercent },
            });
        } catch (err) {
            console.error("Failed to update village position:", err);
        }
    };

    const canMergeUI = (source, target) => {
        if (!source || !target) return false;
        if (source._id === target._id) return false;
        if (source.capacity !== target.capacity) return false;
        if (source.capacity === 128) return false;
        return true;
    };

    const mergeVillages = async (sourceId, targetId) => {
        try {
            const token = localStorage.getItem("token");
            await apiFetch("/villages/merge", {
                method: "POST",
                token,
                body: { sourceId, targetId },
            });

            await fetchVillages();
            if (onRefresh) await onRefresh();
            return true;
        } catch (err) {
            alert(err.message || "Cannot merge these villages");
            return false;
        }
    };

    // detect if currently dragged village overlaps with another village
    const checkVillageOverlap = (draggingId, leftPercent, topPercent) => {
        for (const v of villages) {
            if (v._id === draggingId) continue;

            const dx = Math.abs(v.leftPercent - leftPercent);
            const dy = Math.abs(v.topPercent - topPercent);

            if (Math.sqrt(dx * dx + dy * dy) < 5) {
                return v;
            }
        }
        return null;
    };

    const handleVillageMouseDown = (e, village) => {
        e.stopPropagation();
        e.preventDefault();

        const rect = e.currentTarget.getBoundingClientRect();
        dragOffsetRef.current = {
            x: e.clientX - (rect.left + rect.width / 2),
            y: e.clientY - (rect.top + rect.height / 2),
        };

        setDraggingVillage(village._id);
        suppressClickRef.current = false;
    };

    useEffect(() => {
        fetchVillages();
    }, []);

    // refetch villages when coinlings change
    useEffect(() => {
        fetchVillages();
    }, [coinlings]);

    useEffect(() => {
        fetchCount();
    }, [villages, coinlings]);

    // drag logic (villages)
    useEffect(() => {
        if (!draggingVillage) return;

        const handleMouseMove = (e) => {
            const field = document.querySelector(".field > div");
            if (!field) return;

            const rect = field.getBoundingClientRect();

            const leftPercent = Math.min(
                Math.max(((e.clientX - rect.left - dragOffsetRef.current.x) / rect.width) * 100, 0),
                100
            );

            const topPercent = Math.min(
                Math.max(((e.clientY - rect.top - dragOffsetRef.current.y) / rect.height) * 100, 0), 
                100
            );

            const overlappingVillage = checkVillageOverlap(draggingVillage, leftPercent, topPercent);
            setHoveredVillage(overlappingVillage ? overlappingVillage._id : null);

            setVillages((prev) =>
                prev.map((v) =>
                    v._id === draggingVillage ? { ...v, leftPercent, topPercent } : v
                )
            );

            suppressClickRef.current = true;
        };

        const handleMouseUp = async () => {
            const source = villages.find(v => v._id === draggingVillage);
            const target = villages.find(v => v._id === hoveredVillage);

            if (source && target && canMergeUI(source, target)) {
                await mergeVillages(source._id, target._id);
            } else if (source) {
                // if didn't merge update village position
                await updateVillagePosition(source._id, source.leftPercent, source.topPercent);
            }

            setDraggingVillage(null);
            setHoveredVillage(null);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [draggingVillage, villages]);

    // move coinlings across villages
    const moveCoinling = async (coinlingId, villageId) => {
        try{
            const token = localStorage.getItem("token");
            await apiFetch(`/coinling/${coinlingId}/village`, {
                method: "PATCH",
                body: {villageId},
                token
            });
        }catch (err){
            alert(err.message || "Cannot move coinling!");
        }
    }

    const handleCoinlingMouseDown = useCallback((e, coinling, village) => {
        if (deleteMode) return; // don't drag in delete mode

        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setCoinlingDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setDraggingCoinling({...coinling, sourceVillage: village});
    }, [deleteMode]);

    const handleCoinlingMove = useCallback((e) => {
        if (!draggingCoinling) return;

        const fieldRect = fieldRef.current?.getBoundingClientRect();
        if (!fieldRect) return;
        const leftPercent = ((e.clientX - fieldRect.left - coinlingDragOffset.x) / fieldRect.width) * 100;
        const topPercent = ((e.clientY - fieldRect.top - coinlingDragOffset.y) / fieldRect.height) * 100;

        setDraggingCoinling(prev => ({
            ...prev,
            leftPercent,
            topPercent
        }));
    }, [draggingCoinling, coinlingDragOffset]);

    const handleCoinlingMouseUp = useCallback(async (e) => {
        if (!draggingCoinling) return;

        // find which village the coinling was dropped on
        const targetVillage = villages.find(v => {
            const distance = Math.sqrt(
                Math.pow(v.leftPercent - draggingCoinling.leftPercent, 2) +
                Math.pow(v.topPercent - draggingCoinling.topPercent, 2)
            );
            return distance < 5;
        });

        // if dropped on a different village, move it
        if (targetVillage && targetVillage._id !== draggingCoinling.sourceVillage._id) {
            try {
                await moveCoinling(draggingCoinling._id, targetVillage._id);
                onRefresh();
            } catch (error) {
                console.error("Failed to move coinling ->", error);
                alert("Failed to move coinling. Village might be full.");
            }
        }

        setDraggingCoinling(null);
    }, [draggingCoinling, villages, onRefresh]);

    // coinling drag logic
    useEffect(() => {
        if (!draggingCoinling) return;

        const handleMouseMove = (e) => {
            handleCoinlingMove(e);
        };

        const handleMouseUp = (e) => {
            handleCoinlingMouseUp(e);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [draggingCoinling, handleCoinlingMove, handleCoinlingMouseUp]);

    const cursorStyle = camera.scale > MIN_SCALE + 0.001 ? "grab" : "default";

    return (
        <div
            className="field"
            onMouseDown={handleCameraDown}
            onMouseMove={handleCameraMove}
            onMouseUp={handleCameraUp}
            onMouseLeave={handleCameraUp}
            style={{cursor: cursorStyle}}
        >
            <div
                ref={fieldRef}
                style={{
                    width: "300vw",
                    height: "300vh",
                    transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
                    transformOrigin: "top left",
                    position: "relative",
                }}
            >
                {villages.map((v) => {
                    const isDragging = draggingVillage === v._id;
                    const isHovered = hoveredVillage === v._id;
                    const count = residentAmount[v._id] || 0;
                    const source = villages.find(vl => vl._id === draggingVillage);
                    const canMerge = isHovered && source && canMergeUI(source, v);
                    return (
                        <div
                            key={v._id}
                            style={{
                                position: "absolute",
                                left: `${v.leftPercent}%`,
                                top: `${v.topPercent}%`,
                                transform: "translate(-50%, -50%)",
                            }}
                        >
                            <img 
                                src="/sprites/village-sprites/temp.png"
                                alt={v.name || "Village"}
                                onMouseDown={(e) => {
                                    if (deleteMode) return;
                                    handleVillageMouseDown(e, v);
                                }}
                                onMouseEnter={() => setShowTooltip(v._id)}
                                onMouseLeave={() => setShowTooltip(null)}
                                onClick={(e) => {
                                    if (suppressClickRef.current) {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        suppressClickRef.current = false;
                                        return;
                                    }

                                    if (deleteMode) {
                                        e.stopPropagation();
                                        onDeleteVillage(v._id);
                                        return;
                                    }

                                    navigate(`/village/${v._id}`);
                                }}
                                style={{
                                    width: "128px",
                                    height: "128px",
                                    imageRendering: "pixelated",
                                    cursor: deleteMode
                                        ? (count === 0 ? "pointer" : "not-allowed")
                                        : (isDragging ? "grabbing" : "grab"),
                                    filter: deleteMode
                                        ? (count === 0
                                            ? "drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))"
                                            : "grayscale(50%) brightness(0.6)")
                                        : (canMerge
                                            ? "drop-shadow(0 0 8px rgba(34, 197, 94, 0.8))"
                                            : isHovered
                                                ? "drop-shadow(0 0 8px rgba(234, 179, 8, 0.8))"
                                                : "none"),
                                    transition: isDragging ? "none" : "filter 0.2s",
                                    opacity: deleteMode && count > 0 ? 0.5 : 1,
                                    pointerEvents: "auto",
                                }}
                            />
                            {showTooltip === v._id && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "-50px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        background: "rgba(0, 0, 0, 0.9)",
                                        color: "white",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        fontSize: "2rem",
                                        whiteSpace: "nowrap",
                                        pointerEvents: "none",
                                        zIndex: 1000,
                                        border: "1px solid rgba(255, 255, 255, 0.2)",
                                    }}
                                >
                                    <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
                                        {v.name || "Village"}
                                    </div>
                                    <div style={{ fontSize: "2rem", color: "#ccc" }}>
                                        {count}/{v.capacity}
                                    </div>
                                </div>
                            )}
                            {canMerge && (
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "-25px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        color: "white",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "0.7rem",
                                        fontWeight: "bold",
                                        whiteSpace: "nowrap",
                                        pointerEvents: "none",
                                    }}
                                >
                                    MERGE!
                                </div>
                            )}
                        </div>
                    );
                })}
                {/* render coinlings from each village */}
                {show && villages.map(village => {
                    const villageCoinlings = coinlings.filter(g => g.village === village._id && !g.dead);

                    return villageCoinlings.map((coinling, index) => {
                        // position coinlings around their village in a circle pattern
                        const angle = (index / Math.max(villageCoinlings.length, 1)) * 2 * Math.PI;

                        // calculate radius dynamically 
                        const spacing = 2; // space between coinlings
                        const minRadius = { 8: 4, 16: 5.5, 32: 7, 64: 9, 128: 12 }[village.capacity] || 4;
                        const maxRadius = { 8: 5, 16: 7, 32: 9, 64: 12, 128: 15 }[village.capacity] || 10;

                        // calculate required radius for even spacing: circumference = 2πr, spacing = circumference / count
                        const requiredRadius = (villageCoinlings.length * spacing) / (2 * Math.PI);
                        const radius = Math.min(maxRadius, Math.max(minRadius, requiredRadius));

                        const offsetX = Math.cos(angle) * radius;
                        const offsetY = Math.sin(angle) * radius;

                        const left = village.leftPercent + offsetX;
                        const top = village.topPercent + offsetY;

                        // if coinling is being dragged, use dragging position
                        const isBeingDragged = draggingCoinling?._id === coinling._id;
                        const displayLeft = isBeingDragged ? draggingCoinling.leftPercent : left;
                        const displayTop = isBeingDragged ? draggingCoinling.topPercent : top;

                        return (
                            <div
                                key={coinling._id}
                                onMouseDown={(e) => handleCoinlingMouseDown(e, coinling, village)}
                                style={{
                                    position: "absolute",
                                    left: `${displayLeft}%`,
                                    top: `${displayTop}%`,
                                    width: "48px",
                                    height: "48px",
                                    cursor: deleteMode ? "default" : (isBeingDragged ? "grabbing" : "grab"),
                                    zIndex: isBeingDragged ? 1000 : -10,
                                    pointerEvents: deleteMode ? "none" : "auto",
                                    transform: `translate(-50%, -50%) ${isBeingDragged ? "scale(2)" : "scale(1)"}`,
                                    transition: isBeingDragged ? "none" : "transform 0.15s ease",
                                }}
                                title={coinling.name}
                            >
                                <img
                                    src={coinling.sprite}
                                    alt={coinling.name}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        imageRendering: "pixelated",
                                        opacity: isBeingDragged ? 0.7 : 1,
                                        filter: isBeingDragged ? "drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))" : "none",
                                    }}
                                    draggable={false}
                                />
                            </div>
                        );
                    });
                })}
            </div>
        </div>
    );
}

export default overworld;