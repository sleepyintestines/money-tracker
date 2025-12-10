import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom"

import Login from "../pages/auth/login.jsx"
import Register from "../pages/auth/register.jsx"

import Overworld from "../components/world/overworld.jsx"
import View from "../components/world/view.jsx"

import Add from "../pages/functions/add.jsx"
import Subtract from "../pages/functions/subtract.jsx"
import History from "../pages/functions/history.jsx"

import { apiFetch } from "../fetch.js"

import "../css/app.css"

function Content() {
  // gets user from localstorage
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("userInfo");
    return stored ? JSON.parse(stored) : null;
  });

  const [balance, setBalance] = useState(() => user?.balance ?? 0);
  const [transactions, setTransactions] = useState([]);
  const [coinlings, setCoinlings] = useState([]);
  const [modal, setModal] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const goToField = () => {
    navigate("/");
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // get transactions 
        const tx = await apiFetch("/transactions", { token: user.token });
        console.log("Transactions fetched:", tx);
        setTransactions(tx);

        // get coinlings
        const g = await apiFetch("/coinling", { token: user.token });
        console.log("Coinlings fetched:", g);
        setCoinlings(g);

        // set balance
        setBalance(user.balance ?? 0);
      } catch (err) {
        console.error("Error fetching data ->", err);
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    fetchData();
  }, [user]); // runs when the `user` changes

  // handles logout logic
  const logout = () => {
    // clears current user data from localstorage
    // remove the stored user info (key used on login/register)
    localStorage.removeItem("userInfo");
    setUser(null);
  };

  // adds an amount to the balance and records the transaction
  const handleAdd = async (amount, date, notes) => {
    if (!user) return;

    try {
      const res = await apiFetch("/transactions", {
        method: "POST",
        token: user.token,
        body: { type: "add", amount, date, notes },
      });

      // saves new transaction
      const newTx = res.transaction;
      setTransactions(prev => [newTx, ...prev]);
      // update balance
      setBalance(res.balance);
      setUser(prev => ({ ...prev, balance: res.balance }));

      // refresh & update amount of coinlings
      const g = await apiFetch("/coinling", { token: user.token });
      setCoinlings(g);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // subtracts an amount from the balance and records the transaction
  const handleSubtract = async (amount, date, notes, worthIt) => {
    if (!user) return;

    try {
      const res = await apiFetch("/transactions", {
        method: "POST",
        token: user.token,
        body: { type: "subtract", amount, date, notes, worthIt },
      });

      // saves new transaction
      const newTx = res.transaction;
      setTransactions(prev => [newTx, ...prev]);
      // update balance
      setBalance(res.balance);
      setUser(prev => ({ ...prev, balance: res.balance }));

      // refresh & update amount of coinlings
      const g = await apiFetch("/coinling", { token: user.token });
      setCoinlings(g);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return (
    <Routes>

      {/* login */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" />
          ) : (
            <Login onLogin={(u) => { localStorage.setItem("token", u.token); setIsLoading(true); setUser(u); }} />
          )
        }
      />

      {/* register */}
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to="/" />
          ) : (
              <Register onRegister={(u) => { localStorage.setItem("token", u.token); setIsLoading(true); setUser(u); }} />
          )
        }
      />

      {/* village page */}
      <Route
        path="/villages/:id"
        element={
          !user ? (
            <Navigate to="/login" />
          ) : (
            <div>
              <View />
              <div className="taskbar">
                <button onClick={goToField}>
                  <img src="/icons/taskbar-icons/back-arrow.png" />
                </button>
              </div>
            </div>
          )
        }
      />

      {/* MAIN APP (Field) */}
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" />
          ) : isLoading ? (
            <div className="loading-screen">Loading...</div>
          ) : (
            <>
              <Overworld coinlings={coinlings} />

              {modal === "add" && (
                <Add onClose={() => setModal(null)} onAdd={handleAdd} />
              )}
              {modal === "subtract" && (
                <Subtract
                  onClose={() => setModal(null)}
                  onSubtract={handleSubtract}
                  balance={balance}
                />
              )}
              {modal === "history" && (
                <History
                  onClose={() => setModal(null)}
                  transactions={transactions}
                />
              )}

              {!hidden && (
                <div className="app">
                  <h1 className="balance">₱ {balance.toLocaleString()}</h1>
                  <div className="controls">
                    <button onClick={() => setModal("add")}>Add</button>
                    <button onClick={() => setModal("subtract")}>Subtract</button>
                    <button onClick={() => setModal("history")}>History</button>
                  </div>
                </div>
              )}

              <div className="taskbar">
                <button onClick={() => setHidden(!hidden)}>
                  {hidden ? (
                    <img src="/icons/taskbar-icons/eye-closed-icon.png" />
                  ) : (
                    <img src="/icons/taskbar-icons/eye-icon.png" />
                  )}
                </button>
                <button onClick={logout}>
                  <img src="/icons/taskbar-icons/logout-icon.png" />
                </button>
              </div>
            </>
          )
        }
      />

    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Content />
    </BrowserRouter>
  );
}

export default App

