import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom"

import Login from "../pages/auth/login.jsx"
import Register from "../pages/auth/register.jsx"

import Overworld from "../components/world/overworld.jsx"
import View from "../components/world/view.jsx"

import Add from "../pages/functions/add.jsx"
import Subtract from "../pages/functions/subtract.jsx"
import History from "../pages/functions/history.jsx"
import Analytics from "../pages/functions/analytics.jsx"
import Journal from "../components/journal.jsx"
import ErrorModal from "../components/errorModal.jsx"

import List from "../pages/other/list.jsx"

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
  const [deleteMode, setDeleteMode] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [show, setShow] = useState(true);
  const [list, setList] = useState([]);

  const navigate = useNavigate();

  const goToField = () => {
    navigate("/");
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
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
        if(isLoading){
          setTimeout(() => setIsLoading(false), 800);
        }
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
  const handleAdd = async (amount, date, notes, category) => {
    if (!user) return;

    try {
      const res = await apiFetch("/transactions", {
        method: "POST",
        token: user.token,
        body: { type: "add", amount, date, notes, category },
      });

      // saves new transaction
      const newTx = res.transaction;
      setTransactions(prev => [newTx, ...prev]);
      // update balance
      setBalance(res.balance);
      const updatedUser = { ...user, balance: res.balance };
      setUser(updatedUser);
      // persist to localStorage
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));

      // refresh & update amount of coinlings
      const g = await apiFetch("/coinling", { token: user.token });
      setCoinlings(g);

      // show list of new coinlings
      if (res.birthed && res.birthed.length > 0) {
        setList(res.birthed);
        setModal("birthed");
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // subtracts an amount from the balance and records the transaction
  const handleSubtract = async (amount, date, notes, worthIt, category) => {
    if (!user) return;

    try {
      const res = await apiFetch("/transactions", {
        method: "POST",
        token: user.token,
        body: { type: "subtract", amount, date, notes, worthIt, category },
      });

      // saves new transaction
      const newTx = res.transaction;
      setTransactions(prev => [newTx, ...prev]);
      // update balance
      setBalance(res.balance);
      const updatedUser = { ...user, balance: res.balance };
      setUser(updatedUser);
      // persist to localStorage
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));

      // refresh & update amount of coinlings
      const g = await apiFetch("/coinling", { token: user.token });
      setCoinlings(g);

      // show list of killed coinlings
      if(res.dead && res.dead.length > 0){
        setList(res.dead);
        setModal("dead");
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const refreshCoinlings = async () => {
    if (!user) return;
    try{
      const g = await apiFetch("/coinling", {token: user.token});
      setCoinlings(g);
    }catch (err){
      console.error("Failed to refresh coinlings ->", err);
    }
  }

  // create a new house
  const createNewHouse = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      await apiFetch("/houses/create", {
        method: "POST",
        token
      });

      await refreshCoinlings();
    } catch (err) {
      console.error("Failed to create house ->", err);
      setErrorMessage(err.message || "Failed to create house");
    }
  };

  const toggleDeleteMode = () => {
    setDeleteMode(prev => !prev);
  };

  // delete an empty house
  const deleteHouse = async (houseId) => {
    if (!user) return;
    try {
      await apiFetch(`/houses/${houseId}`, {
        method: "DELETE",
        token: user.token
      });

      await refreshCoinlings();
    } catch (err) {
      console.error("Failed to delete house ->", err);
      setErrorMessage(err.message || "House must be empty!");
    }
  };

  // toggle to show coinlings residing in houses
  const toggleDisplay = () => {
    setShow(prev => !prev);
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
            <Login onLogin={(u) => { 
              localStorage.setItem("token", u.token); 
              setIsLoading(true); 
              setUser(u); 
            }} />
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
              <Register onRegister={(u) => { 
                localStorage.setItem("token", u.token); 
                setIsLoading(true); 
                setUser(u); 
              }} />
          )
        }
      />

      {/* house page */}
      <Route
        path="/house/:id"
        element={
          !user ? (
            <Navigate to="/login" />
          ) : (
            <div>
              <View hideHeader={hideHeader} />
              <div className="taskbar">
                <button onClick={goToField}>
                  <img src="/icons/taskbar-icons/back-arrow.png" />
                </button>
                <button onClick={() => setHideHeader(!hideHeader)}>
                  {hideHeader ? (
                      <img src="/icons/taskbar-icons/eye-closed-icon.png" />
                  ) : (
                      <img src="/icons/taskbar-icons/eye-icon.png" />
                  )}
                </button>
              </div>
            </div>
          )
        }
      />

      {/* main page */}
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" />
          ) : isLoading ? (
            <div className="loading-screen">Loading...</div>
          ) : (
            <>
              <Overworld 
                coinlings={coinlings} 
                onRefresh={refreshCoinlings} 
                deleteMode={deleteMode} 
                onDeleteHouse={deleteHouse}
                show={show}
                modal={modal}
                onError={setErrorMessage}
              />

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
                  onError={setErrorMessage}
                />
              )}
              {modal === "analytics" && (
                <Analytics
                  onClose={() => setModal(null)}
                  onError={setErrorMessage}
                />
              )}
              {modal === "journal" && (
                <Journal
                  onClose={() => setModal(null)}
                  token={user.token}
                />
              )}
              {modal === "dead" && (
                <List
                  onClose={() => {
                    setModal(null);
                    setList([]);
                  }}
                  list={list}
                  type="dead"
                />
              )}
              {modal === "birthed" && (
                <List
                  onClose={() => {
                    setModal(null);
                    setList([]);
                  }}
                  list={list}
                  type="new"
                />
              )}

              {errorMessage && (
                <ErrorModal
                  onClose={() => setErrorMessage(null)}
                  message={errorMessage}
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
                <button onClick={toggleDisplay}>
                  {show ? (
                    <img src="/icons/taskbar-icons/eye-icon.png" />
                  ) : (
                    <img src="/icons/taskbar-icons/eye-closed-icon.png" />
                  )}
                </button>
                <button onClick={createNewHouse} disabled={deleteMode}>
                  <img src="/icons/taskbar-icons/create.png" />
                </button>
                <button onClick={toggleDeleteMode}>
                  {deleteMode ? (
                      <img src="/icons/taskbar-icons/delete-on.png" />
                  ) : (
                      <img src="/icons/taskbar-icons/delete.png" />
                  )}
                </button>
                <button onClick={() => setModal("journal")}>
                    <img src="/icons/taskbar-icons/logout-icon.png" />
                </button>
                <button onClick={() => setModal("analytics")}>
                    <img src="/icons/taskbar-icons/logout-icon.png" />
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

