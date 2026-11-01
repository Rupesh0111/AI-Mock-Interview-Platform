import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { socketUpdateSession } from '../features/sessions/sessionSlice';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');

const useSocket = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !user._id) return;

    const socket = io(BACKEND_URL, {
      query: { userId: user._id },
      transports: ['polling', 'websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.io connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket.io disconnected.');
    });

    socket.on('sessionUpdate', (payload) => {
      console.log('Real-time Session Update:', payload);
      dispatch(socketUpdateSession(payload));

      const status = (payload.status || '').toLowerCase();

      // Check if generation finished (ready, completed, or questions_ready)
      if (
        status === 'questions_ready' || 
        status === 'ready' || 
        status.includes('ready') || 
        status === 'completed'
      ) {
        const id = payload._id || payload.session || payload.sessionId;
        if (id) {
          navigate(`/interview/${id}`);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id]); // <-- Stable dependency prevents the infinite connect/disconnect loop

  return socketRef.current;
};

export default useSocket;