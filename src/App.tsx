import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useApp } from './store/useApp'
import { SignIn } from './screens/SignIn'
import { Onboarding } from './screens/Onboarding'
import { Dashboard } from './screens/Dashboard'
import { MonthEntry } from './screens/MonthEntry'
import { Year } from './screens/Year'
import { Quests } from './screens/Quests'
import { Goals } from './screens/Goals'
import { Garden } from './screens/Garden'
import { ProfileScreen } from './screens/ProfileScreen'
import { Admin } from './screens/Admin'

export function App() {
  const authenticated = useApp((s) => s.authenticated)
  const onboarded = useApp((s) => s.onboarded)
  const role = useApp((s) => s.profile.role)

  if (!authenticated) return <SignIn />
  if (!onboarded) return <Onboarding />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="mois" element={<MonthEntry />} />
        <Route path="annee" element={<Year />} />
        <Route path="quetes" element={<Quests />} />
        <Route path="objectifs" element={<Goals />} />
        <Route path="jardin" element={<Garden />} />
        <Route path="profil" element={<ProfileScreen />} />
        <Route path="admin" element={role === 'admin' ? <Admin /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
