import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import App from './App.jsx'
import Admin from './Admin.jsx'

const Root = () => {
  const path = window.location.pathname

  if (path.startsWith('/admin')) {
    return <Admin />
  } else {
    return <App />
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
