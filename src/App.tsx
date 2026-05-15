import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import QrDisplayPage from './pages/QrDisplayPage'
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
          <Route path="/qr-display" element={<QrDisplayPage />} />
          <Route path="*" element={<Navigate to="/qr-scan" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App