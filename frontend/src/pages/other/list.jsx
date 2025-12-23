import { useEffect } from "react"
import "../../css/modal.css"

function list({ onClose, list, type = "dead" }){
    useEffect(() => {
        const handleEscape = (e) => {
            if(e.key === "Escape") onClose();
        };
        
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const isNew = type === "new";
    const title = isNew ? "New COINLINGS!" : "COINLINGS Killed!";
    const message = isNew
        ? `${list.length} new COINLINGS${list.length !== 1 ? "s" : ""} joined your world!`
        : `${list.length} COINLINGS${list.length !== 1 ? "s" : ""} died in this transaction`;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className="modal-content" 
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "white",
                    padding: "5px 15px"
                }}
            >
                <h2>{title}</h2>
                <p style={{
                    marginBottom: "20px",
                    color: "#666"
                }}>
                    {message}
                </p>
                <div
                    style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                        padding: "10px",
                        overscrollBehavior: "contain"
                    }}
                    onWheel={(e) => {e.stopPropagation();}}
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5, 1fr)",
                            gap: "20px",
                            justifyItems: "center",
                        }}
                    >
                        {list.map((coinling) => {
                            return(
                                <div
                                    key={coinling._id}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "8px"
                                    }}
                                >
                                    <img
                                        src={coinling.sprite}
                                        alt={coinling.name}
                                        style={{
                                            width: "64px",
                                            height: "64px",
                                            border: "2px solid #ccc",
                                            borderRadius: "8px",
                                            background: "#f5f5f5"
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: "0.75rem",
                                            textAlign: "center",
                                            maxWidth: "80px",
                                            wordWrap: "break-word",
                                            overflowWrap: "break-word",
                                            lineHeight: "1.2",
                                        }}
                                    >
                                        {coinling.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div 
                    style={{
                        display: "flex",
                        justifyContent: "center"
                    }}
                >
                    <button
                        className="list-btn"
                        onClick={onClose}
                        style={{
                            marginTop: "10px",
                            marginBottom: "10px",
                            padding: "10px 30px",
                            fontSize: "1rem",
                            cursor: "pointer"
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default list;