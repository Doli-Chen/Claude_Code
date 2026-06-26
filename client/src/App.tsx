import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DesignPage from './pages/DesignPage'
import HostPage from './pages/HostPage'
import DisplayPage from './pages/DisplayPage'
import PlayerPage from './pages/PlayerPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/design" element={<DesignPage />} />
        <Route path="/design/:quizId" element={<DesignPage />} />
        <Route path="/host/:gameCode" element={<HostPage />} />
        <Route path="/display/:gameCode" element={<DisplayPage />} />
        <Route path="/play" element={<PlayerPage />} />
        <Route path="/play/:gameCode" element={<PlayerPage />} />
      </Routes>
    </BrowserRouter>
  )
}
