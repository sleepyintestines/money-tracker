import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "./pages/app.jsx"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
