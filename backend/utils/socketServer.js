import { Server } from 'socket.io';

let ioInstance;
const localFrontendOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

export function initSocketServer(server) {
  if (ioInstance) return ioInstance;

  const allowedOrigins = Array.from(
    new Set(localFrontendOrigins),
  );

  ioInstance = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log('📡 Socket connected:', socket.id);

    socket.on('join-driver-room', ({ ambulanceId, vehicleNumber, contact } = {}) => {
      if (ambulanceId) {
        socket.join(`driver:ambulance:${ambulanceId}`);
      }

      if (vehicleNumber) {
        socket.join(`driver:vehicle:${vehicleNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
      }

      if (contact) {
        socket.join(`driver:contact:${contact.replace(/[^\d]/g, '')}`);
      }
    });

    socket.on('join-tracking-room', ({ trackingCode } = {}) => {
      if (trackingCode) {
        socket.join(`tracking:${trackingCode}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('📴 Socket disconnected:', socket.id);
    });
  });

  return ioInstance;
}

export function getSocketServer() {
  return ioInstance;
}
