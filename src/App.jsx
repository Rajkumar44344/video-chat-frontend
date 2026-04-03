import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Component } from 'react'
import Landing from './pages/Landing'
import VideoPage from './pages/VideoPage'
import ChatPage from './pages/ChatPage'

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: 'white', padding: 40, fontFamily: 'monospace', background: '#1a1a2e', minHeight: '100vh' }}>
          <h2>Runtime Error:</h2>
          <pre style={{ color: '#ff6b6b', marginTop: 16 }}>{this.state.error.message}</pre>
          <pre style={{ color: '#888', marginTop: 8, fontSize: 12 }}>{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/video" element={<VideoPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App
