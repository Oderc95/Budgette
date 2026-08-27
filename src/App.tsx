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
import { sectionsOuvertes } from './domain/progression'

export function App() {
  const authenticated = useApp((s) => s.authenticated)
  const onboarded = useApp((s) => s.onboarded)
  const role = useApp((s) => s.profile.role)

  /*
   * Les sections encore fermées sont renvoyées vers l'accueil. Masquer l'onglet
   * ne suffirait pas : l'application est routée par ancre, et une adresse
   * gardée en favori ouvrirait un écran vide de sens.
   */
  const budgets = useApp((s) => s.budgets)
  const goals = useApp((s) => s.goals)
  const profile = useApp((s) => s.profile)
  const activeMonth = useApp((s) => s.activeMonth)
  const ouvertes = sectionsOuvertes({ budgets, goals, profile, activeMonth })

  if (!authenticated) return <SignIn />
  if (!onboarded) return <Onboarding />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="mois" element={<MonthEntry />} />
        <Route path="annee" element={ouvertes.has('annee') ? <Year /> : <Navigate to="/" replace />} />
        <Route path="quetes" element={ouvertes.has('quetes') ? <Quests /> : <Navigate to="/" replace />} />
        <Route path="objectifs" element={<Goals />} />
        <Route path="jardin" element={ouvertes.has('jardin') ? <Garden /> : <Navigate to="/" replace />} />
        <Route path="profil" element={<ProfileScreen />} />
        <Route path="admin" element={role === 'admin' ? <Admin /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
