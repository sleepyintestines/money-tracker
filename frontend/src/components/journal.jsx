import { useState, useEffect } from "react"
import Modal from "./modal.jsx"
import { apiFetch } from "../fetch.js"

import "../css/modal.css"

export default function journal({ onClose, token }) {
    const [allSprites, setAllSprites] = useState({ common: [], rare: [], legendary: [] });
    const [unlockedSprites, setUnlockedSprites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJournalData = async () => {
            try {
                // fetch all available sprites
                const sprites = await apiFetch("/journal/sprites");
                console.log("All sprites:", sprites);
                setAllSprites(sprites);

                // fetch user's unlocked sprites
                const { unlocked } = await apiFetch("/journal/unlocked", { token });
                console.log("Unlocked sprites:", unlocked);
                setUnlockedSprites(unlocked);
            } catch (err) {
                console.error("Failed to load journal:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchJournalData();
    }, [token]);

    const isUnlocked = (spritePath) => {
        return unlockedSprites.includes(spritePath);
    };

    const renderSpriteGrid = (sprites, rarity) => {
        if (sprites.length === 0) {
            return <p style={{ color: "#999", fontStyle: "italic" }}>No sprites available</p>;
        }

        return (
            <div 
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px",
                }}
                onWheel={(e) => e.stopPropagation()}
            >
                {sprites.map((sprite, idx) => {
                    const unlocked = isUnlocked(sprite);
                    return (
                        <div
                            key={idx}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            <div
                                style={{
                                    width: "80px",
                                    height: "80px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: unlocked ? "#f5f5f5" : "#e0e0e0",
                                    borderRadius: "8px",
                                    border: `2px solid ${unlocked ? "#4CAF50" : "#999"}`,
                                    position: "relative",
                                    overflow: "hidden"
                                }}
                            >
                                {unlocked ? (
                                    <img
                                        src={sprite}
                                        alt={`${rarity} sprite`}
                                        style={{
                                            width: "70px",
                                            height: "70px",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: "70px",
                                            height: "70px",
                                            backgroundColor: "#000",
                                            WebkitMaskImage: `url(${sprite})`,
                                            WebkitMaskRepeat: "no-repeat",
                                            WebkitMaskSize: "contain",
                                            WebkitMaskPosition: "center",
                                            maskImage: `url(${sprite})`,
                                            maskRepeat: "no-repeat",
                                            maskSize: "contain",
                                            maskPosition: "center",
                                        }}
                                    />
                                )}
                            </div>
                            <span style={{
                                fontSize: "10px",
                                color: unlocked ? "#4CAF50" : "#999",
                                fontWeight: unlocked ? "bold" : "normal"
                            }}>
                                {unlocked ? "Unlocked" : "Locked"}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Modal onClose={onClose} style={{width: "128px"}}>
            <div 
                className="journal-box" 
                style={{
                    maxHeight: "526px", 
                    overflowY: "auto", 
                    padding: "2px"                     
                }}
            >
                <h2 style={{ marginBottom: "24px", textAlign: "center" }}>Sprite Journal</h2>
                
                {loading ? (
                    <p style={{ textAlign: "center", color: "#999" }}>Loading...</p>
                ) : (
                    <>
                        <div style={{ marginBottom: "32px" }}>
                            <h3 style={{
                                color: "#8B4513",
                                marginBottom: "12px",
                                borderBottom: "2px solid #8B4513",
                                paddingBottom: "4px"
                            }}>
                                Common ({unlockedSprites.filter(s => s.includes('/common/')).length}/{allSprites.common.length})
                            </h3>
                            {renderSpriteGrid(allSprites.common, "common")}
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <h3 style={{
                                color: "#4169E1",
                                marginBottom: "12px",
                                borderBottom: "2px solid #4169E1",
                                paddingBottom: "4px"
                            }}>
                                Rare ({unlockedSprites.filter(s => s.includes('/rare/')).length}/{allSprites.rare.length})
                            </h3>
                            {renderSpriteGrid(allSprites.rare, "rare")}
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <h3 style={{
                                color: "#FFD700",
                                marginBottom: "12px",
                                borderBottom: "2px solid #FFD700",
                                paddingBottom: "4px"
                            }}>
                                Legendary ({unlockedSprites.filter(s => s.includes('/legendary/')).length}/{allSprites.legendary.length})
                            </h3>
                            {renderSpriteGrid(allSprites.legendary, "legendary")}
                        </div>

                        <div style={{
                            marginTop: "24px",
                            padding: "12px",
                            background: "#f5f5f5",
                            borderRadius: "8px",
                            textAlign: "center"
                        }}>
                            <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
                                Total Unlocked: {unlockedSprites.length} / {allSprites.common.length + allSprites.rare.length + allSprites.legendary.length}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
