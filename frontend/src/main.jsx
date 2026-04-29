import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { SubjectProvider } from './context/SubjectContext'
import './tokens.css'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <SubjectProvider>
      <App />
    </SubjectProvider>
  </BrowserRouter>
)
