import { useState } from "react";

export default function PasswordInput({
    label = "Password",
    value,
    onChange,
    placeholder = "",
    required = false
}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div style={{ marginBottom: "20px" }}>
            <label style={{
                display: "block",
                color: "#555",
                fontSize: "20px",
                fontWeight: "bold",
                textAlign: "left"
            }}>
                {label}
            </label>

            <div style={{ position: "relative" }}>
                <input
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    style={{
                        width: "100%",
                        padding: "12px 52px 12px 12px",
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

                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                        position: "absolute",
                        left: "210px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#4f3fcc",
                        fontWeight: "600",
                        fontSize: "13px"
                    }}
                >
                    {showPassword ? "Hide" : "Show"}
                </button>
            </div>
        </div>
    );
}
