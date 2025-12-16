import { useState } from "react"
import Modal from "../../components/modal.jsx"
import { apiFetch } from "../../fetch.js"

function history({ onClose, transactions, onError }) {
    const [selectedTx, setSelectedTx] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [localTransactions, setLocalTransactions] = useState(transactions);
    
    // sort transactions by date, latest first
    const sortedTransactions = [...localTransactions].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    const updateWorthIt = async (transactionId, worthIt) => {
        setIsUpdating(true);
        try {
            const token = localStorage.getItem("token");
            const updatedTx = await apiFetch(`/transactions/${transactionId}`, {
                method: "PATCH",
                token,
                body: { worthIt }
            });
            
            // update the selected transaction
            setSelectedTx(updatedTx);
            
            // update the local transactions list
            setLocalTransactions(prev => 
                prev.map(tx => tx._id === transactionId ? updatedTx : tx)
            );
        } catch (err) {
            console.error("Failed to update transaction:", err);
            if (onError) onError(err.message || "Failed to update transaction");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            <h2>Transaction History</h2>

            <div 
                className="history-list"
                onWheel={(e) => e.stopPropagation()}
            >
                {sortedTransactions.length === 0 && <p>No transactions yet...</p>}

                {sortedTransactions.map((t, index) => {
                    if (!t || typeof t !== "object") return null;

                    return (
                        <div
                            key={t._id || t.id || index}
                            className="transaction-box"
                            onClick={() => setSelectedTx(t)}
                        >
                            <div className="transaction-summary">
                                <span className="amount-sign">
                                    <strong className={t.type === "add" ? "add-sign" : "subtract-sign"}>
                                        {t.type === "add" ? "+" : "-"}
                                    </strong>
                                    <strong> ₱{t.amount}</strong>
                                </span>
                                <span className="transaction-date">{t.date}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedTx && (
                <Modal onClose={() => setSelectedTx(null)}>
                    <h3>Transaction Details</h3>
                    <div className="transaction-detail">
                        <p>
                            <strong>Type:</strong> {selectedTx.type === "add" ? "Added" : "Spent"}
                        </p>
                        <p>
                            <strong>Amount:</strong> ₱{selectedTx.amount}
                        </p>
                        <p>
                            <strong>Date:</strong> {selectedTx.date}
                        </p>
                        {selectedTx.category && (
                            <p>
                                <strong>Category:</strong> {selectedTx.category}
                            </p>
                        )}
                        {selectedTx.notes && (
                            <p>
                                <strong>Notes:</strong> {selectedTx.notes}
                            </p>
                        )}
                        {selectedTx.type === "subtract" && (
                            <p style={{display: "flex", alignItems: "center", gap: "8px"}}>
                                <strong>Worth it?</strong>
                                <div style={{display: "flex", gap: "8px"}}>
                                    <button
                                        onClick={() => updateWorthIt(selectedTx._id, true)}
                                        disabled={isUpdating || selectedTx.worthIt === true}
                                        style={{
                                            padding: "4px 16px",
                                            backgroundColor: selectedTx.worthIt === true ? "#22c55e" : "#374151",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: isUpdating || selectedTx.worthIt === true ? "not-allowed" : "pointer",
                                            opacity: isUpdating || selectedTx.worthIt === true ? 0.6 : 1,
                                            fontSize: "12px",
                                            transition: "transform 0.3s ease", 
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'} 
                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'} 
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={() => updateWorthIt(selectedTx._id, false)}
                                        disabled={isUpdating || selectedTx.worthIt === false}
                                        style={{
                                            padding: "4px 16px",
                                            backgroundColor: selectedTx.worthIt === false ? "#ef4444" : "#374151",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: isUpdating || selectedTx.worthIt === false ? "not-allowed" : "pointer",
                                            opacity: isUpdating || selectedTx.worthIt === false ? 0.6 : 1,
                                            fontSize: "12px",
                                            transition: "transform 0.3s ease", 
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'} 
                                    >
                                        No
                                    </button>
                                </div>
                            </p>
                        )}
                    </div>
                </Modal>
            )}
        </Modal>
    );
}

export default history;