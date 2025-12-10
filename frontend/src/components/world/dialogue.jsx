import { useState } from "react"
import axios from "axios"
import "../../css/dialogue.css"

function Dialogue({ coinling, screenRect, onClose, cameraScale = 1, onNameUpdated }) {
    // chooses random index
    const [index] = useState(() => coinling?.dialogues && coinling.dialogues.length ? Math.floor(Math.random() * coinling.dialogues.length) : 0);

    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(coinling?.name ?? "");
    const [isSaving, setIsSaving] = useState(false);

    if (!coinling || !screenRect) return null;

    // assigns dialogue line based on index
    const line = coinling.dialogues && coinling.dialogues.length ? coinling.dialogues[index] : "They have nothing to say...";
    
    // calculates position for dialogue box
    const container = document.querySelector(".field > div");
    const containerRect = container.getBoundingClientRect();

    const localX = (screenRect.left - containerRect.left) / cameraScale;
    const localY = (screenRect.top - containerRect.top) / cameraScale;

    const bubbleX = localX + (screenRect.width / cameraScale) / 2;
    const bubbleY = localY;

    const updateCoinlingName = async (coinlingId, name) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
            const token = userInfo.token;
            const res = await axios.patch(`/api/coinling/${coinlingId}/name`, 
                { name },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return res.data;
        } catch (err) {
            console.error("Failed to update coinling name:", err);
            throw err;
        }
    };

    const handleSave = async () => {
        if (!newName.trim() || newName === coinling.name) {
            setIsEditing(false);
            setNewName(coinling.name);
            return;
        }

        setIsSaving(true);
        try {
            const updatedCoinling = await updateCoinlingName(coinling._id, newName);
            if (onNameUpdated) {
                onNameUpdated(updatedCoinling);
            }
            setIsEditing(false);
        } catch (err) {
            console.error("Error saving name:", err);
            setNewName(coinling.name);
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
            setNewName(coinling.name);
            setIsEditing(false);
        }
    };

    const style = {
        position: "absolute",
        top: `${bubbleY}px`,
        left: `${bubbleX}px`,
        transform: "translate(-50%, -110%)",
        pointerEvents: "auto",
        zIndex: 10,
    };

    return (
        <div
            className="coinling-speech-container"
            style={style}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="coinling-speech-bubble above">
                <div className="coinling-dialogue-header">
                    {isEditing ? (
                        <input
                            type="text"
                            value={newName}
                            disabled={isSaving}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="coinling-name-input"
                        />
                    ) : (
                        <strong
                            className="coinling-name"
                            onClick={() => setIsEditing(true)}
                            style={{ cursor: 'pointer' }}
                        >
                            {coinling.name ?? ""}
                        </strong>
                    )}
                    <button onClick={onClose} style={{ marginLeft: 8 }}>
                        ✕
                    </button>
                </div>

                <div className="coinling-dialogue-line">{line}</div>
            </div>
        </div>
    );
}

export default Dialogue;