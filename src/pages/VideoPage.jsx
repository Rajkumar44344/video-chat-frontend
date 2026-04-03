import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useWebSocket from '../hooks/useWebSocket';

const VideoPage = () => {
  const [status, setStatus] = useState('Starting camera...');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [camReady, setCamReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [pipMode, setPipMode] = useState(false);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef();
  const localStreamRef = useRef();
  const roomIdRef = useRef(null);
  const isOffererRef = useRef(false);
  const navigate = useNavigate();

  const { connect, send, on, off, disconnect } = useWebSocket();

  // Start camera immediately
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setCamReady(true);
        setStatus('Searching for stranger...');
      })
      .catch((err) => setStatus('Camera error: ' + err.message));

    return () => localStreamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const createPeerConnection = useCallback((currentRoomId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    });

    localStreamRef.current?.getTracks().forEach(track =>
      pc.addTrack(track, localStreamRef.current)
    );

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      setConnected(true);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate)
        send('signal', { room_id: currentRoomId, type: 'ice-candidate', candidate: e.candidate });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setConnected(false);
        setStatus('Stranger disconnected');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [send]);

  useEffect(() => {
    connect(async (socket) => {
      // Join queue
      socket.emit('join');

      // Match event
      socket.on('match', async (data) => {
        if (data === 'Searching...' || data === 'Stranger left. Searching...') {
          setStatus('Searching for stranger...');
          setConnected(false);
          roomIdRef.current = null;
          isOffererRef.current = false;
          peerConnectionRef.current?.close();
          peerConnectionRef.current = null;
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          return;
        }

        roomIdRef.current = data;
        setStatus('Connected! Setting up call...');
        const pc = createPeerConnection(data);

        // Random delay to decide offerer
        setTimeout(async () => {
          if (pc.signalingState === 'stable' && !pc.remoteDescription) {
            isOffererRef.current = true;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            send('signal', { room_id: data, type: 'offer', sdp: offer.sdp });
          }
        }, Math.random() * 500 + 100);
      });

      // Signal event
      socket.on('signal', async (data) => {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        if (data.type === 'offer' && !isOffererRef.current) {
          await pc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send('signal', { room_id: roomIdRef.current, type: 'answer', sdp: answer.sdp });
        } else if (data.type === 'answer' && isOffererRef.current) {
          await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
        } else if (data.type === 'ice-candidate') {
          try { await pc.addIceCandidate(data.candidate); } catch (_) {}
        }
      });
    });

    return disconnect;
  }, [connect, disconnect, createPeerConnection, send]);

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = isMuted; setIsMuted(!isMuted); }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = isCamOff; setIsCamOff(!isCamOff); }
  };

  const nextStranger = () => {
    send('next', {});
    setStatus('Searching for stranger...');
    setConnected(false);
    roomIdRef.current = null;
    isOffererRef.current = false;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/50 shrink-0">
        <button onClick={() => navigate('/')} className="text-white/60 text-sm active:opacity-50">← Back</button>
        <span className="text-xs font-medium text-white/70 truncate mx-2">{status}</span>
        <button
          onClick={() => setPipMode(p => !p)}
          className="text-white/60 text-lg w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 active:opacity-50"
        >
          {pipMode ? '⊞' : '⧉'}
        </button>
      </div>

      {/* HALF-HALF MODE */}
      {!pipMode && (
        <div className="flex-1 flex flex-col sm:flex-row min-h-0 gap-0.5 bg-black">
          <div className="relative flex-1 bg-gray-900 min-h-0">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {!connected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                <div className="text-5xl mb-3 animate-pulse">👤</div>
                <p className="text-white/40 text-sm">Waiting for stranger...</p>
              </div>
            )}
            <span className="absolute top-2 left-2 text-xs bg-black/50 px-2 py-1 rounded-full">Stranger</span>
            {connected && <span className="absolute top-2 right-2 text-xs bg-green-500/80 px-2 py-1 rounded-full">🟢 Live</span>}
          </div>
          <div className="relative flex-1 bg-gray-800 min-h-0">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {!camReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <p className="text-white/40 text-sm">Starting camera...</p>
              </div>
            )}
            <span className="absolute top-2 left-2 text-xs bg-black/50 px-2 py-1 rounded-full">You</span>
          </div>
        </div>
      )}

      {/* PiP MODE */}
      {pipMode && (
        <div className="flex-1 relative min-h-0 bg-gray-900">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {!connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
              <div className="text-5xl mb-3 animate-pulse">👤</div>
              <p className="text-white/40 text-sm">Waiting for stranger...</p>
            </div>
          )}
          {connected && <span className="absolute top-2 left-2 text-xs bg-green-500/80 px-2 py-1 rounded-full">🟢 Live</span>}
          <div className="absolute bottom-3 right-3 w-28 sm:w-36 aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <span className="absolute bottom-1 left-1 text-xs bg-black/50 px-1.5 py-0.5 rounded-full">You</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="shrink-0 px-4 py-3 bg-black/50 flex items-center justify-center gap-4">
        <button onClick={toggleMute}
          className={`flex flex-col items-center gap-1 w-16 py-2 rounded-2xl text-xs font-semibold transition-colors ${isMuted ? 'bg-red-600' : 'bg-white/15 active:bg-white/25'}`}>
          <span className="text-2xl">{isMuted ? '🔇' : '🎤'}</span>
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        <button onClick={nextStranger}
          className="flex flex-col items-center gap-1 w-16 py-2 rounded-2xl text-xs font-semibold bg-yellow-500 active:bg-yellow-600">
          <span className="text-2xl">⏭️</span>
          Next
        </button>
        <button onClick={toggleCam}
          className={`flex flex-col items-center gap-1 w-16 py-2 rounded-2xl text-xs font-semibold transition-colors ${isCamOff ? 'bg-red-600' : 'bg-white/15 active:bg-white/25'}`}>
          <span className="text-2xl">{isCamOff ? '📵' : '📷'}</span>
          {isCamOff ? 'Cam On' : 'Cam Off'}
        </button>
      </div>
    </div>
  );
};

export default VideoPage;
