import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useWebSocket from '../hooks/useWebSocket';

const ChatPage = () => {
  const [roomId, setRoomId] = useState(null);
  const [status, setStatus] = useState('Searching...');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const roomIdRef = useRef(null);
  const navigate = useNavigate();

  const { connect, send, disconnect } = useWebSocket();

  useEffect(() => {
    connect((socket) => {
      socket.emit('join');

      socket.on('match', (data) => {
        if (data === 'Searching...' || data === 'Stranger left. Searching...') {
          setStatus(data);
          setRoomId(null);
          roomIdRef.current = null;
          setMessages([]);
        } else {
          setRoomId(data);
          roomIdRef.current = data;
          setStatus('Connected ✓');
        }
      });

      socket.on('chat', (data) => {
        setMessages(prev => [...prev, { text: data.message, mine: false }]);
      });
    });

    return disconnect;
  }, [connect, disconnect]);

  const sendMessage = () => {
    if (input.trim() && roomIdRef.current) {
      send('chat', { room_id: roomIdRef.current, message: input });
      setMessages(prev => [...prev, { text: input, mine: true }]);
      setInput('');
      inputRef.current?.focus();
    }
  };

  const nextStranger = () => {
    send('next', {});
    setStatus('Searching...');
    setRoomId(null);
    roomIdRef.current = null;
    setMessages([]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 text-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 bg-black/30 backdrop-blur-sm flex items-center gap-3 border-b border-white/10">
        <button onClick={() => navigate('/')} className="text-white/60 text-sm active:opacity-50 shrink-0">← Back</button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base leading-none">Anonymous Chat</h1>
          <p className="text-xs text-white/60 mt-0.5 truncate">{status}</p>
        </div>
        {roomId && (
          <button onClick={nextStranger}
            className="shrink-0 bg-yellow-500 active:bg-yellow-600 text-black text-xs font-bold px-3 py-1.5 rounded-full">
            Next ⏭
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/30 text-sm text-center">
              {roomId ? 'Say hi! 👋' : 'Waiting for a stranger...'}
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
              ${msg.mine ? 'bg-blue-500 rounded-br-sm' : 'bg-white/15 backdrop-blur-sm rounded-bl-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 py-3 bg-black/30 backdrop-blur-sm border-t border-white/10">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={roomId ? 'Type a message...' : 'Waiting for match...'}
            disabled={!roomId}
            className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2.5 text-sm outline-none text-white placeholder-white/40 disabled:opacity-40"
          />
          <button onClick={sendMessage} disabled={!roomId || !input.trim()}
            className="shrink-0 bg-blue-500 active:bg-blue-600 disabled:opacity-40 w-10 h-10 rounded-full flex items-center justify-center text-lg">
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
