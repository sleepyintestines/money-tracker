import { useState, useEffect } from "react"
import Modal from "../../components/modal.jsx"
import { apiFetch } from "../../fetch.js"

function Analytics({ onClose, onError }) {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await apiFetch("/transactions/analytics/summary", { token });
            setAnalytics(data);
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
            if (onError) onError(err.message || "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Modal onClose={onClose}>
                <h2 style={{ textAlign: "center" }}>Loading Analytics...</h2>
            </Modal>
        );
    }

    if (!analytics) {
        return (
            <Modal onClose={onClose}>
                <h2>No data available</h2>
            </Modal>
        );
    }

    const maxWeeklySpent = Math.max(...analytics.weeklyComparison.map(w => w.spent), 1);
    const maxMonthlySpent = Math.max(...analytics.monthlyComparison.map(m => m.spent), 1);

    return (
        <Modal onClose={onClose}>
            <div>
                <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>
                    Transaction Analytics
                </h2>

                {/* this week summary */}
                <div style={{
                    background: "linear-gradient(135deg, #4f3fcc 0%, #372a9f 100%)",
                    padding: "20px",
                    borderRadius: "12px",
                    color: "white",
                    marginBottom: "20px"
                }}>
                    <h3 style={{ margin: "0 0 10px 0" }}>This Week</h3>
                    <p style={{ fontSize: "2rem", margin: 0, fontWeight: "bold" }}>
                        ₱ {analytics.thisWeek.spent.toLocaleString()}
                    </p>
                    <p style={{ fontSize: "0.9rem", opacity: 0.9, margin: "5px 0 0 0" }}>
                        Total spent
                    </p>
                </div>

                {/* weekly comparison bar chart */}
                {maxWeeklySpent > 1 && (
                    <div style={{
                        background: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "12px",
                        marginBottom: "20px"
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: "50px", color: "#333" }}>Weekly Spending Trend</h3>
                        <div style={{ display: "flex", alignItems: "flex-end", height: "200px", gap: "10px" }}>
                            {analytics.weeklyComparison.map((week, index) => {
                            const barHeight = (week.spent / maxWeeklySpent) * 180;
                            const isThisWeek = week.week === "This week";
                            return (
                                <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                                    <div style={{
                                        width: "100%",
                                        height: `${barHeight}px`,
                                        background: isThisWeek
                                            ? "linear-gradient(to top, #4f3fcc, #372a9f)"
                                            : "linear-gradient(to top, #9b8fd9, #7a6fc4)",
                                        borderRadius: "8px 8px 0 0",
                                        position: "relative",
                                        transition: "all 0.3s ease",
                                        minHeight: week.spent > 0 ? "20px" : "0"
                                    }}>
                                        <div style={{
                                            position: "absolute",
                                            top: "-25px",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            fontSize: "0.85rem",
                                            fontWeight: "bold",
                                            color: "#333",
                                            whiteSpace: "nowrap"
                                        }}>
                                            ₱{week.spent.toLocaleString()}
                                        </div>
                                    </div>
                                    <p style={{
                                        fontSize: "0.75rem",
                                        marginTop: "8px",
                                        color: isThisWeek ? "#4f3fcc" : "#666",
                                        fontWeight: isThisWeek ? "bold" : "normal",
                                        textAlign: "center"
                                    }}>
                                        {week.week}
                                    </p>
                                </div>
                            );
                        })}
                        </div>
                    </div>
                )}

                {/* monthly comparison bar chart */}
                {maxMonthlySpent > 1 && (
                    <div style={{
                        background: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "12px",
                        marginBottom: "20px"
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: "50px", color: "#333" }}>Monthly Spending Comparison</h3>
                        <div style={{ display: "flex", alignItems: "flex-end", height: "200px", gap: "10px" }}>
                            {analytics.monthlyComparison.map((month, index) => {
                                const barHeight = (month.spent / maxMonthlySpent) * 180;
                                const isThisMonth = index === analytics.monthlyComparison.length - 1;
                                return (
                                    <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                                        <div style={{
                                            width: "100%",
                                            height: `${barHeight}px`,
                                            background: isThisMonth
                                                ? "linear-gradient(to top, #4f3fcc, #372a9f)"
                                                : "linear-gradient(to top, #9b8fd9, #7a6fc4)",
                                            borderRadius: "8px 8px 0 0",
                                            position: "relative",
                                            transition: "all 0.3s ease",
                                            minHeight: month.spent > 0 ? "20px" : "0"
                                        }}>
                                            <div style={{
                                                position: "absolute",
                                                top: "-25px",
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                fontSize: "0.85rem",
                                                fontWeight: "bold",
                                                color: "#333",
                                                whiteSpace: "nowrap"
                                            }}>
                                                ₱{month.spent.toLocaleString()}
                                            </div>
                                        </div>
                                        <p style={{
                                            fontSize: "0.75rem",
                                            marginTop: "8px",
                                            color: isThisMonth ? "#4f3fcc" : "#666",
                                            fontWeight: isThisMonth ? "bold" : "normal",
                                            textAlign: "center"
                                        }}>
                                            {month.month}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* this month summary */}
                <div style={{
                    background: "white",
                    border: "2px solid #e5e7eb",
                    padding: "20px",
                    borderRadius: "12px",
                    marginBottom: "20px"
                }}>
                    <h3 style={{ marginTop: 0, color: "#333" }}>This Month</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                        <div>
                            <p style={{ fontSize: "0.85rem", color: "#666", margin: "0 0 5px 0" }}>Income</p>
                            <p style={{ fontSize: "1.5rem", margin: 0, color: "#10b981", fontWeight: "bold" }}>
                                ₱{analytics.thisMonth.income.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: "0.85rem", color: "#666", margin: "0 0 5px 0" }}>Spent</p>
                            <p style={{ fontSize: "1.5rem", margin: 0, color: "#ef4444", fontWeight: "bold" }}>
                                ₱{analytics.thisMonth.spent.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* lifetime summary */}
                <div style={{
                    background: "linear-gradient(135deg, #4f3fcc 0%, #372a9f 100%)",
                    padding: "20px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    color: "white"
                }}>
                    <h3 style={{ marginTop: 0, color: "white" }}>Lifetime</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div>
                            <p style={{ fontSize: "0.85rem", opacity: 0.9, margin: "0 0 5px 0" }}>Total Income</p>
                            <p style={{ fontSize: "1.8rem", margin: 0, fontWeight: "bold" }}>
                                ₱{analytics.lifetime.income.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: "0.85rem", opacity: 0.9, margin: "0 0 5px 0" }}>Total Spent</p>
                            <p style={{ fontSize: "1.8rem", margin: 0, fontWeight: "bold" }}>
                                ₱{analytics.lifetime.spent.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* spending by category */}
                {analytics.categories.spendingBreakdown.length > 0 && (
                    <div style={{
                        background: "white",
                        border: "2px solid #e5e7eb",
                        padding: "20px",
                        borderRadius: "12px",
                        marginBottom: "20px"
                    }}>
                        <h3 style={{ marginTop: 0, color: "#333" }}>Spending by Category</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {(() => {
                                // create a set of categories to display (top 5 by spending)
                                const finalCategories = analytics.categories.spendingBreakdown.slice(0, 5);
                                const maxAmount = finalCategories[0]?.amount || 1;
                                
                                return finalCategories.map((cat, index) => {
                                    const percentage = (cat.amount / maxAmount) * 100;
                                    
                                    return (
                                        <div key={index}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                                <span style={{ fontSize: "0.9rem", color: "#333", fontWeight: "500" }}>
                                                    {cat.name}
                                                </span>
                                                <span style={{ fontSize: "0.9rem", color: "#666" }}>
                                                    ₱{cat.amount.toLocaleString()} ({cat.count}x)
                                                </span>
                                            </div>
                                            <div style={{
                                                width: "100%",
                                                height: "8px",
                                                background: "#e5e7eb",
                                                borderRadius: "4px",
                                                overflow: "hidden"
                                            }}>
                                                <div style={{
                                                    width: `${percentage}%`,
                                                    height: "100%",
                                                    background: "linear-gradient(90deg, #4f3fcc, #372a9f)",
                                                    transition: "width 0.3s ease"
                                                }} />
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                )}

                {/* worth it analysis */}
                {(analytics.worthIt.worthIt > 0 || analytics.worthIt.notWorthIt > 0) && (
                    <div style={{
                        background: "white",
                        border: "2px solid #e5e7eb",
                        padding: "20px",
                        borderRadius: "12px"
                    }}>
                        <h3 style={{ marginTop: 0, color: "#333" }}>Worth It Analysis</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                            <div style={{
                                padding: "15px",
                                background: "#f0fdf4",
                                borderRadius: "8px",
                                border: "1px solid #86efac"
                            }}>
                                <p style={{ fontSize: "0.85rem", color: "#666", margin: "0 0 5px 0" }}>
                                    Worth It ✓
                                </p>
                                <p style={{ fontSize: "1.3rem", margin: "0 0 5px 0", color: "#10b981", fontWeight: "bold" }}>
                                    {analytics.worthIt.worthIt} transactions
                                </p>
                            </div>
                            <div style={{
                                padding: "15px",
                                background: "#fef2f2",
                                borderRadius: "8px",
                                border: "1px solid #fca5a5"
                            }}>
                                <p style={{ fontSize: "0.85rem", color: "#666", margin: "0 0 5px 0" }}>
                                    Not Worth It ✗
                                </p>
                                <p style={{ fontSize: "1.3rem", margin: "0 0 5px 0", color: "#ef4444", fontWeight: "bold" }}>
                                    {analytics.worthIt.notWorthIt} transactions
                                </p>
                            </div>
                        </div>
                        {(analytics.worthIt.worthIt + analytics.worthIt.notWorthIt) > 0 && (
                            <div style={{ marginTop: "15px" }}>
                                <div style={{
                                    display: "flex",
                                    height: "30px",
                                    borderRadius: "8px",
                                    overflow: "hidden"
                                }}>
                                    {analytics.worthIt.worthIt > 0 && (
                                        <div style={{
                                            width: `${(analytics.worthIt.worthIt / (analytics.worthIt.worthIt + analytics.worthIt.notWorthIt)) * 100}%`,
                                            background: "#10b981",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                            fontSize: "0.8rem",
                                            fontWeight: "bold"
                                        }}>
                                            {Math.round((analytics.worthIt.worthIt / (analytics.worthIt.worthIt + analytics.worthIt.notWorthIt)) * 100)}%
                                        </div>
                                    )}
                                    {analytics.worthIt.notWorthIt > 0 && (
                                        <div style={{
                                            width: `${(analytics.worthIt.notWorthIt / (analytics.worthIt.worthIt + analytics.worthIt.notWorthIt)) * 100}%`,
                                            background: "#ef4444",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                            fontSize: "0.8rem",
                                            fontWeight: "bold"
                                        }}>
                                            {Math.round((analytics.worthIt.notWorthIt / (analytics.worthIt.worthIt + analytics.worthIt.notWorthIt)) * 100)}%
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default Analytics;
