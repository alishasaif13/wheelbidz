import { Server as SocketIOServer } from "socket.io";
 
let io;
 
export { io };
 
export async function connect(httpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // or restrict to your frontend domain
      methods: ["GET", "POST"],
    },
  });
 
  io.on("connection", (socket) => {
    console.log(" New client connected:", socket.id);
 
    // join a vehicle room
    socket.on("joinVehicleRoom", ({ vehicleId }) => {
      console.log(`Received joinVehicleRoom event.`);
 
      socket.join(`vehicle_${vehicleId}`);
      console.log(`Socket ${socket.id} joined room vehicle_${vehicleId}`);
    });
 
    // leave room
    socket.on("leaveVehicleRoom", ({ vehicleId }) => {
      socket.leave(`vehicle_${vehicleId}`);
      console.log(` Socket ${socket.id} left room vehicle_${vehicleId}`);
    });
 
    // Cleanup when disconnected
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}