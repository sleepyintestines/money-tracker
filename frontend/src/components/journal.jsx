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
        <Modal onClose={onClose}>
            <div>
                <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>
                    Sprite Journal
                </h2>
                
                {loading ? (
                    <p style={{ textAlign: "center", color: "#999" }}>Loading...</p>
                ) : (
                    <>
                        {/* Total Progress */}
                        <div style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            padding: "20px",
                            borderRadius: "12px",
                            color: "white",
                            marginBottom: "20px"
                        }}>
                            <h3 style={{ margin: "0 0 10px 0" }}>Collection Progress</h3>
                            <p style={{ fontSize: "2rem", margin: 0, fontWeight: "bold" }}>
                                {unlockedSprites.length} / {allSprites.common.length + allSprites.rare.length + allSprites.legendary.length}
                            </p>
                            <p style={{ fontSize: "0.9rem", opacity: 0.9, margin: "5px 0 0 0" }}>
                                Sprites unlocked
                            </p>
                        </div>

                        {/* Common Sprites */}
                        <div style={{
                            background: "#f8f9fa",
                            padding: "20px",
                            borderRadius: "12px",
                            marginBottom: "20px"
                        }}>
                            <h3 style={{ 
                                marginTop: 0, 
                                marginBottom: "15px", 
                                color: "#8B4513",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <span>Common</span>
                                <span style={{ fontSize: "0.9rem", fontWeight: "normal", color: "#666" }}>
                                    {unlockedSprites.filter(s => s.includes('/common/')).length}/{allSprites.common.length}
                                </span>
                            </h3>
                            {renderSpriteGrid(allSprites.common, "common")}
                        </div>

                        {/* Rare Sprites */}
                        <div style={{
                            background: "#f8f9fa",
                            padding: "20px",
                            borderRadius: "12px",
                            marginBottom: "20px"
                        }}>
                            <h3 style={{ 
                                marginTop: 0, 
                                marginBottom: "15px", 
                                color: "#4169E1",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <span>Rare</span>
                                <span style={{ fontSize: "0.9rem", fontWeight: "normal", color: "#666" }}>
                                    {unlockedSprites.filter(s => s.includes('/rare/')).length}/{allSprites.rare.length}
                                </span>
                            </h3>
                            {renderSpriteGrid(allSprites.rare, "rare")}
                        </div>

                        {/* Legendary Sprites */}
                        <div style={{
                            background: "#f8f9fa",
                            padding: "20px",
                            borderRadius: "12px",
                            marginBottom: "20px"
                        }}>
                            <h3 style={{ 
                                marginTop: 0, 
                                marginBottom: "15px", 
                                color: "#FFD700",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <span>Legendary</span>
                                <span style={{ fontSize: "0.9rem", fontWeight: "normal", color: "#666" }}>
                                    {unlockedSprites.filter(s => s.includes('/legendary/')).length}/{allSprites.legendary.length}
                                </span>
                            </h3>
                            {renderSpriteGrid(allSprites.legendary, "legendary")}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
