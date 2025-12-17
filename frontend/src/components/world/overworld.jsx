import { useEffect, useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Camera } from "./camera.js"
import { apiFetch } from "../../fetch.js"

import "../../css/overworld.css";

function overworld({coinlings, onRefresh, deleteMode, onDeleteHouse, show = false, modal = null, onError}) {
    const [houses, setHouses] = useState([]);

    const [residentAmount, setResidentAmount] = useState({});
    const [draggingHouse, setDraggingHouse] = useState(null);
    const [hoveredHouse, setHoveredHouse] = useState(null);
    const [draggingCoinling, setDraggingCoinling] = useState(null);
    const [coinlingDragOffset, setCoinlingDragOffset] = useState({x: 0, y: 0});
    const [showTooltip, setShowTooltip] = useState(null);

    const {
        camera,
        MIN_SCALE,
        handleCameraDown,
        handleCameraMove,
        handleCameraUp,
    } = Camera(!!modal);

    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const suppressClickRef = useRef(false);
    const navigate = useNavigate();
    const fieldRef = useRef(null);

    // get house sprite based on capacity
    const getHouseSprite = (capacity) => {
        const spriteMap = {
            2: "/sprites/house-sprites/house.png",
            4: "/sprites/house-sprites/house-4.png",
            8: "/sprites/house-sprites/house-8.png",
            16: "/sprites/house-sprites/house-16.png",
            32: "/sprites/house-sprites/house-32.png",
            64: "/sprites/house-sprites/house-64.png",
            128: "/sprites/house-sprites/house-128.png"
        };
        return spriteMap[capacity];
    };

    const fetchHouses = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await apiFetch("/houses", { token });

            setHouses(data);
        } catch (err) {
            console.error("Failed to load houses:", err);
        }
    };

    // get amount of coinlings inside a house
    const fetchCount = async () => {
        const counts = {};
        for(const v of houses){
            counts[v._id] = coinlings.filter(g => g.house === v._id && !g.dead).length;
        }

        setResidentAmount(counts);
    }

    const updateHousePosition = async (id, leftPercent, topPercent) => {
        try {
            const token = localStorage.getItem("token");
            await apiFetch(`/houses/${id}/position`, {
                method: "PUT",
                token,
                body: { leftPercent, topPercent },
            });
        } catch (err) {
            console.error("Failed to update house position:", err);
        }
    };

    const canMergeUI = (source, target) => {
        if (!source || !target) return false;
        if (source._id === target._id) return false;
        if (source.capacity !== target.capacity) return false;
        if (source.capacity === 128) return false;
        return true;
    };

    const mergeHouses = async (sourceId, targetId) => {
        try {
            const token = localStorage.getItem("token");
            await apiFetch("/houses/merge", {
                method: "POST",
                token,
                body: { sourceId, targetId },
            });

            await fetchHouses();
            if (onRefresh) await onRefresh();
            return true;
        } catch (err) {
            if (onError) onError(err.message || "Cannot merge these houses");
            return false;
        }
    };

    // detect if currently dragged house overlaps with another house
    const checkHouseOverlap = (draggingId, leftPercent, topPercent) => {
        for (const v of houses) {
            if (v._id === draggingId) continue;

            const dx = Math.abs(v.leftPercent - leftPercent);
            const dy = Math.abs(v.topPercent - topPercent);

            if (Math.sqrt(dx * dx + dy * dy) < 5) {
                return v;
            }
        }
        return null;
    };

    const handleHouseMouseDown = (e, house) => {
        e.stopPropagation();
        e.preventDefault();

        const rect = e.currentTarget.getBoundingClientRect();
        dragOffsetRef.current = {
            x: e.clientX - (rect.left + rect.width / 2),
            y: e.clientY - (rect.top + rect.height / 2),
        };

        setDraggingHouse(house._id);
        suppressClickRef.current = false;
    };

    useEffect(() => {
        fetchHouses();
    }, []);

    // refetch houses when coinlings change
    useEffect(() => {
        fetchHouses();
    }, [coinlings]);

    useEffect(() => {
        fetchCount();
    }, [houses, coinlings]);

    // drag logic (houses)
    useEffect(() => {
        if (!draggingHouse) return;

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

            const overlappingHouse = checkHouseOverlap(draggingHouse, leftPercent, topPercent);
            setHoveredHouse(overlappingHouse ? overlappingHouse._id : null);

            setHouses((prev) =>
                prev.map((v) =>
                    v._id === draggingHouse ? { ...v, leftPercent, topPercent } : v
                )
            );

            suppressClickRef.current = true;
        };

        const handleMouseUp = async () => {
            const source = houses.find(v => v._id === draggingHouse);
            const target = houses.find(v => v._id === hoveredHouse);

            if (source && target && canMergeUI(source, target)) {
                await mergeHouses(source._id, target._id);
            } else if (source) {
                // if didn't merge update house position
                await updateHousePosition(source._id, source.leftPercent, source.topPercent);
            }

            setDraggingHouse(null);
            setHoveredHouse(null);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [draggingHouse, houses]);

    // move coinlings across houses
    const moveCoinling = async (coinlingId, houseId) => {
        const token = localStorage.getItem("token");
        await apiFetch(`/coinling/${coinlingId}/house`, {
            method: "PATCH",
            body: {houseId},
            token
        });
    }

    const handleCoinlingMouseDown = useCallback((e, coinling, house) => {
        if (deleteMode) return; // don't drag in delete mode

        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setCoinlingDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setDraggingCoinling({...coinling, sourceHouse: house});
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

        // find which house the coinling was dropped on
        const targetHouse = houses.find(v => {
            const distance = Math.sqrt(
                Math.pow(v.leftPercent - draggingCoinling.leftPercent, 2) +
                Math.pow(v.topPercent - draggingCoinling.topPercent, 2)
            );
            return distance < 5;
        });

        // if dropped on a different house, move it
        if (targetHouse && targetHouse._id !== draggingCoinling.sourceHouse._id) {
            try {
                await moveCoinling(draggingCoinling._id, targetHouse._id);
                onRefresh();
            } catch (error) {
                console.error("Failed to move coinling ->", error);
                if (onError) onError("Failed to move coinling. House might be full.");
            }
        }

        setDraggingCoinling(null);
    }, [draggingCoinling, houses, onRefresh]);

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
                {houses.map((v) => {
                    const isDragging = draggingHouse === v._id;
                    const isHovered = hoveredHouse === v._id;
                    const count = residentAmount[v._id] || 0;
                    const source = houses.find(vl => vl._id === draggingHouse);
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
                                src={getHouseSprite(v.capacity)}
                                alt={v.name || "House"}
                                onMouseDown={(e) => {
                                    if (deleteMode) return;
                                    handleHouseMouseDown(e, v);
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
                                        onDeleteHouse(v._id);
                                        return;
                                    }

                                    navigate(`/house/${v._id}`);
                                }}
                                style={{
                                    width: "auto",
                                    height: "auto",
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
                                        {v.name || "House"}
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
                {/* render coinlings from each house */}
                {show && houses.map(house => {
                    const houseCoinlings = coinlings.filter(g => g.house === house._id && !g.dead);

                    return houseCoinlings.map((coinling, index) => {
                        // position coinlings around their house in a circle pattern
                        const angle = (index / Math.max(houseCoinlings.length, 1)) * 2 * Math.PI;

                        // calculate radius dynamically 
                        const spacing = 2; // space between coinlings
                        const minRadius = { 8: 4, 16: 5.5, 32: 7, 64: 9, 128: 12 }[house.capacity] || 4;
                        const maxRadius = { 8: 5, 16: 7, 32: 9, 64: 12, 128: 15 }[house.capacity] || 10;

                        // calculate required radius for even spacing: circumference = 2πr, spacing = circumference / count
                        const requiredRadius = (houseCoinlings.length * spacing) / (2 * Math.PI);
                        const radius = Math.min(maxRadius, Math.max(minRadius, requiredRadius));

                        const offsetX = Math.cos(angle) * radius;
                        const offsetY = Math.sin(angle) * radius;

                        const left = house.leftPercent + offsetX;
                        const top = house.topPercent + offsetY;

                        // if coinling is being dragged, use dragging position
                        const isBeingDragged = draggingCoinling?._id === coinling._id;
                        const displayLeft = isBeingDragged ? draggingCoinling.leftPercent : left;
                        const displayTop = isBeingDragged ? draggingCoinling.topPercent : top;

                        return (
                            <div
                                key={coinling._id}
                                onMouseDown={(e) => handleCoinlingMouseDown(e, coinling, house)}
                                style={{
                                    position: "absolute",
                                    left: `${displayLeft}%`,
                                    top: `${displayTop}%`,
                                    width: "64px",
                                    height: "64px",
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