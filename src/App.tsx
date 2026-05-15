import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import QrScanPage from './pages/QrScanPage'
import GlobalStyles from './styles/GlobalStyles'

function App() {
  return (
    <>
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/qr-scan" replace />} />
          <Route path="/qr-scan" element={<QrScanPage />} />
          <Route path="*" element={<Navigate to="/qr-scan" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App