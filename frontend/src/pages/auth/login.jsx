import { useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"

import "../../css/auth.css"

export default function login({ onLogin }){
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        try{
            const {data} = await axios.post("http://localhost:5000/api/auth/login", 
                { username, password },
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
        }
    };

    return (
        <div className="auth-page">
            <h2>Welcome Back</h2>

            <form onSubmit={handleLogin}>
                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p style={{ color: "red" }}>{error}</p>}
                
                <button type="submit">Sign in</button>
            </form>

            <p>
                Don't have an account? <Link to="/register">Register</Link>
            </p>
        </div>
    );
}