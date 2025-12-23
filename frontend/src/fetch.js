import axios from "axios"

// helper function to make http requests to the api
export const apiFetch = async (path, { body, method = "GET", token, headers = {} } = {}) => {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    
    try {
        const res = await axios({
            url: `${apiUrl}/api${path}`,
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : undefined,
                ...headers,
            },
            data: body || undefined, 
        });
        return res.data;
    } catch (err) {
        console.error("API Error:", err);
        const message = err.response?.data?.message || err.message || "Request failed";
        throw new Error(message);
    }
};
