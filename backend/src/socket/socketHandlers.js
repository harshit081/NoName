const { User, Message, Room } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Connected users storage
const connectedUsers = new Map();

const handleSocketConnection = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins
    socket.on('user-join', async (userData) => {
      try {
        const { username, avatar } = userData;
        
        // Update or create user
        await User.findOneAndUpdate(
          { username },
          { avatar, isOnline: true, lastSeen: new Date() },
          { upsert: true, new: true }
        );

        connectedUsers.set(socket.id, { username, avatar });
        socket.broadcast.emit('user-online', { username, avatar });
        
        // Send current online users
        const onlineUsers = Array.from(connectedUsers.values());
        socket.emit('online-users', onlineUsers);
      } catch (error) {
        console.error('Error in user-join:', error);
      }
    });

    // Join room
    socket.on('join-room', async (roomId) => {
      console.log('User joining room:', roomId);
      socket.join(roomId);
      
      // Send recent messages
      try {
        const messages = await Message.find({ roomId })
          .sort({ timestamp: -1 })
          .limit(50)
          .exec();
        
        console.log(`Found ${messages.length} messages for room ${roomId}`);
        const reversedMessages = messages.reverse();
        console.log('Emitting room-messages event with', reversedMessages.length, 'messages');
        socket.emit('room-messages', reversedMessages);
        console.log('room-messages event emitted successfully');
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    });

    // Send message
    socket.on('send-message', async (messageData) => {
      try {
        console.log('Received message:', messageData);
        const messageId = uuidv4();
        const message = new Message({
          id: messageId,
          content: messageData.content,
          sender: messageData.sender,
          roomId: messageData.roomId,
          type: messageData.type || 'text',
          fileUrl: messageData.fileUrl || ''
        });

        await message.save();
        console.log('Message saved:', message);
        
        // Send to all users in the room including sender
        io.to(messageData.roomId).emit('new-message', message);
        console.log('Message broadcasted to room:', messageData.roomId);
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });

    // Create room (for DMs and groups)
    socket.on('create-room', async (roomData) => {
      try {
        const { id, name, type, participants, createdBy } = roomData;
        
        // Check if room already exists
        const existingRoom = await Room.findOne({ id });
        if (existingRoom) {
          socket.emit('room-created', existingRoom);
          return;
        }

        const room = new Room({
          id,
          name,
          type,
          participants: participants || [],
          createdBy
        });

        await room.save();
        console.log('Room created:', room);
        
        // Join the creator to the room
        socket.join(id);
        
        // Notify other participants for DMs
        if (type === 'private' && participants) {
          participants.forEach(participant => {
            if (participant !== createdBy) {
              socket.broadcast.emit('new-dm-room', room);
            }
          });
        }
        
        socket.emit('room-created', room);
      } catch (error) {
        console.error('Error creating room:', error);
        socket.emit('room-error', { message: 'Failed to create room' });
      }
    });

    // Typing indicators
    socket.on('typing-start', (data) => {
      socket.to(data.roomId).emit('user-typing', {
        username: data.username,
        roomId: data.roomId
      });
    });

    socket.on('typing-stop', (data) => {
      socket.to(data.roomId).emit('user-stopped-typing', {
        username: data.username,
        roomId: data.roomId
      });
    });

    // Mark message as read
    socket.on('mark-read', async (data) => {
      try {
        const { messageId, username } = data;
        await Message.findOneAndUpdate(
          { id: messageId },
          { $addToSet: { readBy: { user: username, timestamp: new Date() } } }
        );
        
        socket.to(data.roomId).emit('message-read', { messageId, username });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // User disconnects
    socket.on('disconnect', async () => {
      const userData = connectedUsers.get(socket.id);
      if (userData) {
        try {
          await User.findOneAndUpdate(
            { username: userData.username },
            { isOnline: false, lastSeen: new Date() }
          );
          
          connectedUsers.delete(socket.id);
          socket.broadcast.emit('user-offline', userData.username);
          console.log('User disconnected:', userData.username);
        } catch (error) {
          console.error('Error updating user offline status:', error);
        }
      }
    });
  });
};

module.exports = { handleSocketConnection, connectedUsers };
