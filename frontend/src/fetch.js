import axios from "axios"

// helper function to make http requests to the api
export const apiFetch = async (path, { body, method = "GET", token, headers = {} } = {}) => {
    try {
        const res = await axios({
            url: `/api${path}`,
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
