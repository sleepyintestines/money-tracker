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

    return (
        <Modal onClose={onClose}>
            <div>
                <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>
                    Transaction Analytics
                </h2>

                {/* this week summary */}
                <div style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                <div style={{
                    background: "#f8f9fa",
                    padding: "20px",
                    borderRadius: "12px",
                    marginBottom: "20px"
                }}>
                    <h3 style={{ marginTop: 0, color: "#333" }}>Weekly Spending Trend</h3>
                    <div style={{ display: "flex", alignItems: "flex-end", height: "200px", gap: "10px" }}>
                        {analytics.weeklyComparison.map((week, index) => {
                            const barHeight = (week.spent / maxWeeklySpent) * 180; // 180px max (leaving room for label)
                            const isThisWeek = week.week === "This week";
                            return (
                                <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                                    <div style={{
                                        width: "100%",
                                        height: `${barHeight}px`,
                                        background: isThisWeek
                                            ? "linear-gradient(to top, #667eea, #764ba2)"
                                            : "linear-gradient(to top, #60a5fa, #3b82f6)",
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
                                        color: isThisWeek ? "#667eea" : "#666",
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

                {/* this month summary */}
                <div style={{
                    background: "white",
                    border: "2px solid #e5e7eb",
                    padding: "20px",
                    borderRadius: "12px",
                    marginBottom: "20px"
                }}>
                    <h3 style={{ marginTop: 0, color: "#333" }}>This Month</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
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
                        <div>
                            <p style={{ fontSize: "0.85rem", color: "#666", margin: "0 0 5px 0" }}>Remaining</p>
                            <p style={{
                                fontSize: "1.5rem",
                                margin: 0,
                                color: analytics.thisMonth.net >= 0 ? "#10b981" : "#ef4444",
                                fontWeight: "bold"
                            }}>
                                ₱{analytics.thisMonth.net.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* category analysis */}
                {analytics.categories.mostUsed && (
                    <div style={{
                        background: "#fff7ed",
                        border: "2px solid #fed7aa",
                        padding: "20px",
                        borderRadius: "12px",
                        marginBottom: "20px"
                    }}>
                        <h3 style={{ marginTop: 0, color: "#333" }}>Most Used Category</h3>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <p style={{ fontSize: "1.8rem", margin: 0, color: "#f59e0b", fontWeight: "bold" }}>
                                    {analytics.categories.mostUsed.name}
                                </p>
                                <p style={{ fontSize: "0.9rem", color: "#666", margin: "5px 0 0 0" }}>
                                    {analytics.categories.mostUsed.count} transactions
                                </p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <p style={{ fontSize: "1.5rem", margin: 0, fontWeight: "bold", color: "#333" }}>
                                    ₱{analytics.categories.mostUsed.total.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

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
                                // create a set of categories to display
                                const categoriesToShow = new Set();
                                const categoryMap = new Map();
                                
                                // add top 5 by spending
                                analytics.categories.spendingBreakdown.slice(0, 5).forEach(cat => {
                                    categoriesToShow.add(cat.name);
                                    categoryMap.set(cat.name, cat);
                                });
                                
                                // add most used category if not already included
                                if (analytics.categories.mostUsed && !categoriesToShow.has(analytics.categories.mostUsed.name)) {
                                    const mostUsedCat = analytics.categories.spendingBreakdown.find(
                                        cat => cat.name === analytics.categories.mostUsed.name
                                    );
                                    if (mostUsedCat) {
                                        categoryMap.set(mostUsedCat.name, mostUsedCat);
                                    }
                                }
                                
                                // convert to array and sort by amount
                                const finalCategories = Array.from(categoryMap.values())
                                    .sort((a, b) => b.amount - a.amount);
                                
                                const maxAmount = finalCategories[0]?.amount || 1;
                                
                                return finalCategories.map((cat, index) => {
                                    const percentage = (cat.amount / maxAmount) * 100;
                                    const isMostUsed = analytics.categories.mostUsed?.name === cat.name;
                                    
                                    return (
                                        <div key={index}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                                <span style={{ fontSize: "0.9rem", color: "#333", fontWeight: "500" }}>
                                                    {cat.name} {isMostUsed && <span style={{ color: "#f59e0b" }}>⭐</span>}
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
                                                    background: isMostUsed 
                                                        ? "linear-gradient(90deg, #f59e0b, #d97706)"
                                                        : "linear-gradient(90deg, #667eea, #764ba2)",
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
                                    <div style={{
                                        flex: 1,
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
