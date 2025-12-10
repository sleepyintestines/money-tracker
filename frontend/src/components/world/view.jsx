import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Coinling from "./coinling.jsx"
import useCoinlings from "./useCoinlings.js"
import { Camera } from "./camera.js"
import { apiFetch } from "../../fetch.js"

function view() {
    const { id } = useParams();
    const [village, setVillage] = useState(null);
    const [coinlings, setCoinlings] = useState([]);
    const { 
        camera, 
        MIN_SCALE, 
        handleCameraDown, 
        handleCameraMove, 
        handleCameraUp } 
    = Camera();

    useEffect(() => {
        async function fetchVillage() {
            try {
                const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
                const token = userInfo.token;
                const payload = await apiFetch(`/villages/${id}`, { token });

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
                        position={p}
                        canDrag={true}
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
                                prev.map((pos, idx) => (idx === i ? { ...pos, dragging: false } : pos))
                            );
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

export default view;