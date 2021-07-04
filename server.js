require("dotenv").config();
const express = require("express");
const http = require("http");
const { Socket } = require("net");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
let namesdict = {}

const rooms = {};

const socketdict = {};

const isEmpty = (dic) =>{
    for(var i in dic){ return false;}
   return true;
}

io.on('connection', socket => {
    socket.on("join room", (roomID,username) => {
        if (rooms[roomID]) {
            const length = rooms[roomID].length;
            // if (length === 4) {
            //     socket.emit("room full");
            //     return;
            // }
            rooms[roomID].push(socket.id);
        } else {
            namesdict[roomID] = {}
            rooms[roomID] = [socket.id];
        }
        namesdict[roomID][socket.id] = username
        socketdict[socket.id] = roomID;
        const usersInThisRoom = rooms[roomID].filter(id => id !== socket.id);

        socket.emit("all users", usersInThisRoom);
    });

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on("cut call",()=> {
        const roomID = socketdict[socket.id];  
        let room = null;
        if (rooms[roomID]) {
            room = rooms[roomID];
        }
        if (!isEmpty(namesdict)) 
        {
            if(!isEmpty(namesdict[roomID]))
            {
                if(namesdict[roomID][socket.id])
                {
                    console.log(`${namesdict[roomID][socket.id]} Left`);
                    delete namesdict[roomID][socket.id];
                    if (isEmpty(namesdict[roomID])) 
                    {
                        delete namesdict[roomID];
                        delete rooms[roomID]
                    }
                    else if (room) 
                    {
                        room = room.filter(id => id !== socket.id);
                        rooms[roomID] = room;
                    }
                }
            }
        }
        socket.broadcast.emit('user left',socket.id);
    });

    socket.on("display users", ()=> {
        const roomID = socketdict[socket.id];
        let room = rooms[roomID];
        let allnames = []
        for(let i in namesdict[roomID])
        {
            allnames.push(namesdict[roomID][i])
        }
        socket.emit('all names',allnames)
    })

    socket.on("get name", (id)=> {
        const roomID = socketdict[id]
        socket.emit('fetch name',namesdict[roomID][id])
    })

    socket.on("send message",(message)=>{
        const roomID = socketdict[socket.id];
        socket.broadcast.emit('recieve message',{message: message,name: namesdict[roomID][socket.id]} )
    })

    socket.on('disconnect', () => {
        const roomID = socketdict[socket.id];
        let room = null;
        if (rooms[roomID]) {
            room = rooms[roomID];
        }
        if (!isEmpty(namesdict)) 
        {
            if(!isEmpty(namesdict[roomID]))
            {
                if(namesdict[roomID][socket.id])
                {
                    console.log(`${namesdict[roomID][socket.id]} Left`)
                    delete namesdict[roomID][socket.id];
                    if (isEmpty(namesdict[roomID])) 
                    {
                     delete namesdict[roomID];
                     delete rooms[roomID];
                    }
                    else if (room) 
                    {
                    room = room.filter(id => id !== socket.id);
                    rooms[roomID] = room;
                    }
                }
            }
        }
        
        socket.broadcast.emit('user left',socket.id)
    });

});
const port = process.env.PORT || 3030
server.listen(port,()=>{console.log(`server running at port ${port}`)});
