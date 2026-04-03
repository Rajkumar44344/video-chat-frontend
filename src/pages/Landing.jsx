import { useNavigate } from 'react-router-dom'

const Landing = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-4 text-gray-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.3)] leading-tight">
        Talk to Strangers
      </h1>
      <p className="text-base sm:text-xl mb-10 opacity-90 max-w-sm leading-relaxed">
        Connect instantly with random strangers via video call or message chat. Anonymous and fun!
      </p>
      <div className="flex flex-col w-full max-w-xs gap-4">
        <button
          onClick={() => navigate('/video')}
          className="w-full py-4 rounded-2xl font-bold text-lg bg-white/20 backdrop-blur-md border border-white/30 text-white active:scale-95 transition-transform"
        >
          🎥 Start Video Call
        </button>
        <button
          onClick={() => navigate('/chat')}
          className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-green-400 to-blue-500 text-white active:scale-95 transition-transform"
        >
          💬 Start Message Chat
        </button>
      </div>
    </div>
  )
}

export default Landing
