import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Login from "../pages/auth/login.jsx"
import Register from "../pages/auth/register.jsx"

import reactLogo from "../assets/react.svg"
import viteLogo from "/vite.svg"

import "../css/app.css"

function App() {
  const [count, setCount] = useState(0);
  const  [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  return (
    <BrowserRouter>
      <Routes>
        {/* login */}
        <Route path="/login" element={
          user ? (<Navigate to="/" />) : (<Login onLogin={(u) => setUser(u)}/>)
        }/>

        {/* register */}
        <Route path="/register" element={
          user ? (<Navigate to="/"/>) : (<Register onRegister={(u) => setUser(u)}/>)
        }/>

        {/* main page */}
        <Route path="/" element={
          user ? (
            <>
              <div>
                <a href="https://vite.dev" target="_blank">
                  <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                  <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
              </div>
              <h1>Vite + React</h1>
              <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                  count is {count}
                </button>
                <p>
                  Edit <code>src/App.jsx</code> and save to test HMR
                </p>
              </div>
              <p className="read-the-docs">
                Click on the Vite and React logos to learn more
              </p>
            </>
          ) : (<Navigate to="/Login"/>)
        }/>
      </Routes>
    </BrowserRouter>
  )
}

export default App

 