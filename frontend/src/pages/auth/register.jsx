import { useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"

import "../../css/auth.css"

export default function register({ onRegister }){
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPswd, setConfirmPswd] = useState("");
    const [error, setError] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();

        if(password !== confirmPswd){
            return setError("Passwords do not match!");
        }

        try{
            const { data } = await axios.post("http://localhost:5000/api/auth/register",
                { username, email, password },
                { headers: { "Content-Type": "application/json" } }
            );
            localStorage.setItem("userInfo", JSON.stringify(data));
            onRegister(data);
        }catch (err){
            if (err.response) {
                setError(err.response.data.message);
            } else {
                setError("An error occurred. Please try again.");
            }
        }
    };


    return (
        <div className="auth-page">
            <h2>Create an Account</h2>

            <form onSubmit={handleRegister}>
                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPswd}
                    onChange={(e) => setConfirmPswd(e.target.value)}
                />

                {error && <p style={{ color: "red" }}>{error}</p>}

                <button type="submit">Sign up</button>
            </form>

            <p>
                Already have an account? <Link to="/login">Login</Link>
            </p>
        </div>
    );
}