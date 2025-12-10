import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Camera } from "./camera.js"
import { apiFetch } from "../../fetch.js"

import "../../css/overworld.css";

function overworld({coinlings}) {
    const [villages, setVillages] = useState([]);
    const {
        camera,
        MIN_SCALE,
        handleCameraDown,
        handleCameraMove,
        handleCameraUp,
    } = Camera();

    const navigate = useNavigate();

    const fetchVillages = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await apiFetch("/villages", { token });

            setVillages(data);
        } catch (err) {
            console.error("Failed to load villages:", err);
        }
    };

    useEffect(() => {
        fetchVillages();
    }, []);

    // refetch villages when coinlings change
    useEffect(() => {
        fetchVillages();
    }, [coinlings]);

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
                style={{
                    width: "300vw",
                    height: "300vh",
                    transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
                    transformOrigin: "top left",
                    position: "relative",
                }}
            >
                {villages.map((v) => {
                    // place village by percent
                    const sizePercent = 5; 
                    const left = Math.min(Math.max(v.leftPercent, 0), 100);
                    const top = Math.min(Math.max(v.topPercent, 0), 100);
                    const style = {
                        position: "absolute",
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${sizePercent}%`,
                        height: `${sizePercent}%`,
                        transform: `translate(-50%, -50%)`, // center
                        background: "black",
                        cursor: "pointer",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "0.9rem",
                        userSelect: "none",
                    };
                    return (
                        <div
                            key={v._id}
                            title={v.name || "Village"}
                            style={style}
                            onClick={() => navigate(`/villages/${v._id}`)}
                        >
                            {v.name || "V"}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default overworld;