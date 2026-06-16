import { Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from './LandingPage'
import { SignupPage } from './SignupPage'

/**
 * App pública del apex (amaradental.mx): landing de marketing + alta self-service.
 * Sin auth ni tenant. Se monta cuando isLandingHost() es true.
 */
export function LandingApp() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/registro" element={<SignupPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
