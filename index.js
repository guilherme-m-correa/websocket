require('dotenv/config')
const mongoose = require('mongoose');
const express = require('express')
const app = express()
const cors = require('cors')
const server = require('http').Server(app);
const io = require('socket.io')(server, {
  wsEngine: 'ws',
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});
const port = process.env.PORT || 5007;

app.use(express.json({ limit: '10mb' }))

const dbUrl = 'mongodb://localhost:27017/websocket'

mongoose.connect(dbUrl, { useUnifiedTopology: true, useNewUrlParser: true })

const MessageSchema = new mongoose.Schema({
  appointment_id: Number,
  correspondent_id: String,
  requester_id: String,
  message_type: String,
  message_sender: String,
  message: String,
  file_url: String,
}, {
  timestamps: true
})

const Message = mongoose.model('Message', MessageSchema)

io.on('connection', async (socket) => {
  const { user_id } = socket.handshake.query;


  socket.on('appointment', async (data) => {
    const messages = await Message.find({ appointment_id: data.appointment_id })

    io.emit(`previousMessages_${user_id}_${data.appointment_id}`, messages);
  });

  socket.on('sendMessage', data => {
    const message = new Message(data);

    message.save((err) => {
      if (err) {
        console.log(err)
      }

      io.emit(`appointment_${data.appointment_id}`, data);
    })
  });

  socket.on('sendOffer', data => {
    socket.broadcast.emit('receivedOffer', data);
  });

  socket.on('updateAppointment', data => {
    socket.broadcast.emit('receiveUpdateAppointment', data);
  });
});

server.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
