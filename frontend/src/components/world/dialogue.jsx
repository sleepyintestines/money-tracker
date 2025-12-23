import { useState } from "react"
import axios from "axios"
import "../../css/dialogue.css"

function Dialogue({ resident, screenRect, onClose, cameraScale = 1, onNameUpdated }) {
    // chooses random index
    const [index] = useState(() => resident?.dialogues && resident.dialogues.length ? Math.floor(Math.random() * resident.dialogues.length) : 0);

    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(resident?.name ?? "");
    const [isSaving, setIsSaving] = useState(false);

    if (!resident || !screenRect) return null;

    // assigns dialogue line based on index
    const line = resident.dialogues && resident.dialogues.length ? resident.dialogues[index] : "They have nothing to say...";
    
    // calculates position for dialogue box
    const container = document.querySelector(".field > div");
    const containerRect = container.getBoundingClientRect();

    const localX = (screenRect.left - containerRect.left) / cameraScale;
    const localY = (screenRect.top - containerRect.top) / cameraScale;

    const bubbleX = localX + (screenRect.width / cameraScale) / 2;
    const bubbleY = localY;

    const updateResidentName = async (residentId, name) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
            const token = userInfo.token;
            const res = await axios.patch(`/api/resident/${residentId}/name`, 
                { name },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return res.data;
        } catch (err) {
            console.error("Failed to update resident name:", err);
            throw err;
        }
    };

    const handleSave = async () => {
        if (!newName.trim() || newName === resident.name) {
            setIsEditing(false);
            setNewName(resident.name);
            return;
        }

        setIsSaving(true);
        try {
            const updatedResident = await updateResidentName(resident._id, newName);
            if (onNameUpdated) {
                onNameUpdated(updatedResident);
            }
            setIsEditing(false);
        } catch (err) {
            console.error("Error saving name:", err);
            setNewName(resident.name);
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
            setNewName(resident.name);
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
            className="resident-speech-container"
            style={style}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="resident-speech-bubble above">
                <div className="resident-dialogue-header">
                    {isEditing ? (
                        <input
                            type="text"
                            value={newName}
                            disabled={isSaving}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="resident-name-input"
                        />
                    ) : (
                        <strong
                                className="resident-name"
                            onClick={() => setIsEditing(true)}
                            style={{ cursor: 'pointer' }}
                        >
                            {resident.name ?? ""}
                        </strong>
                    )}
                    <button onClick={onClose} style={{ marginLeft: 8 }}>
                        ✕
                    </button>
                </div>

                <div className="resident-dialogue-line">{line}</div>
            </div>
        </div>
    );
}

export default Dialogue;