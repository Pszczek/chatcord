const path = require('path');
const cors = require('cors');
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
// import { Server } from "socket.io";
// const io = new Server(server);

// const io = require('socket.io')();
// const { Server } = require("socket.io");
// const io = new Server();

//const server = http.createServer(app);
const io = require('socket.io')(server);

const formatMessage = require('./utils/messages');
const { 
    userJoin, 
    getCurrentUser,
    userLeave,
    getRoomUsers 
} = require('./utils/users');

// const app = express();
// const server = http.createServer(app);
// const io = socketio.listen(server);

// Set static folder
// app.use(cors);
app.use(express.static(path.join(__dirname, 'public')));

// app.use("static", express.static('./static'));

// app.get('/', function(req, res) {
//     res.sendFile(__dirname + '/index.html');
// });

const botName = 'ChatCord Bot';

// Run when client connects
io.on('connection', socket => {
    console.log('New WS Connection...');
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // Welcome current user
        // socket.emit('message', 'Welcome to ChatCord');
        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord'));

        // Broadcast when a user connects
        socket.broadcast
            .to(user.room)
            .emit(
                'message', 
                // formatMessage(botName, 'A user has joined the chat')
                formatMessage(botName, `${user.username} has joined the chat`)
            );

             // Send users and room info
             io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
    });

    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        console.log(msg);
        const user = getCurrentUser(socket.id);
        // const user = getCurrentUser(socket.id);
        // io.emit('message', formatMessage(botName, msg));
        // io.emit('message', formatMessage('USER', msg));
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        console.log("A user has just left the chat");

        if(user) {
            io.to(user.room).emit(
            // socket.broadcast.to(user.room).emit(
                'message', 
                formatMessage(botName, `${user.username} has left the chat`)
            );

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});

const PORT = 3000 || process.env.PORT;

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));