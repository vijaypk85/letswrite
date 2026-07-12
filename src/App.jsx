import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Write from './pages/Write.jsx'
import StoryDetail from './pages/StoryDetail.jsx'
import MyStories from './pages/MyStories.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/story/:id" element={<StoryDetail />} />
        <Route
          path="/write"
          element={
            <ProtectedRoute>
              <Write />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-stories"
          element={
            <ProtectedRoute>
              <MyStories />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}
