import { useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"

export default function login({ onLogin }){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try{
            const {data} = await axios.post("http://localhost:5000/api/auth/login", 
                { email, password },
                {headers: {"Content-Type": "application/json"}}
            );

            localStorage.setItem("userInfo", JSON.stringify(data));
            onLogin(data);
        }catch (err){
            if(err.response){
                setError(err.response.data.message);
            }else{
                setError("An error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: "url('/backgrounds/authbg.png')",
            padding: "20px"
        }}>
            <div style={{
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                padding: "40px",
                width: "100%",
                maxWidth: "400px"
            }}>
                <h2 style={{
                    textAlign: "center",
                    color: "#333",
                    marginBottom: "30px",
                    fontSize: "43px",
                    fontWeight: "bold"
                }}>Welcome Back</h2>
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{
                            display: "block",
                            color: "#555",
                            fontSize: "20px",
                            fontWeight: "bold",
                            textAlign: "left"
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: "100%",
                                padding: "12px",
                                fontSize: "15px",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                                boxSizing: "border-box",
                                transition: "border-color 0.3s",
                                outline: "none"
                            }}
                            onFocus={(e) => e.target.style.borderColor = "#4f3fcc"}
                            onBlur={(e) => e.target.style.borderColor = "#ddd"}
                        />
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label style={{
                            display: "block",
                            color: "#555",
                            fontSize: "20px",
                            fontWeight: "bold",
                            textAlign: "left"
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: "100%",
                                padding: "12px",
                                fontSize: "15px",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                                boxSizing: "border-box",
                                transition: "border-color 0.3s",
                                outline: "none"
                            }}
                            onFocus={(e) => e.target.style.borderColor = "#4f3fcc"}
                            onBlur={(e) => e.target.style.borderColor = "#ddd"}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: "12px",
                            marginBottom: "20px",
                            backgroundColor: "#fee",
                            color: "#c33",
                            borderRadius: "6px",
                            fontSize: "14px",
                            border: "1px solid #fcc"
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "14px",
                            backgroundColor: loading ? "#4f3fcc" : "#372a9f",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "16px",
                            fontWeight: "600",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "background-color 0.3s",
                            marginTop: "10px"
                        }}
                        onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = "#372a9f")}
                        onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = "#4f3fcc")}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p style={{
                    marginTop: "24px",
                    textAlign: "center",
                    color: "#666",
                    fontSize: "14px"
                }}>
                    Don't have an account?{" "}
                    <Link to="/register" style={{
                        color: "#4f3fcc",
                        textDecoration: "none",
                        fontWeight: "600"
                    }}>
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
}