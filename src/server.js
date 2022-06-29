import http from "http";
import { Server } from "socket.io"
import { instrument  } from "@socket.io/admin-ui";
import express from "express";

// const https = require('https');
// const fs = require('fs')

const HTTP_PORT = 3000;
// const HTTPS_PORT = 443;

// const privateKey = fs.readFileSync('openssl/private.pem');
// const certificate = fs.readFileSync('openssl/public.pem');
// const options = {
//     key: privateKey,
//     cert: certificate
// };


const app = express();

app.set ("view engine", "pug");
app.set ("views", __dirname + "/views");
app.use ("/public", express.static(__dirname+"/public"));
app.get ("/", (req,res) => res.render("home"));
app.get ("/*", (req,res) => res.redirect("/"));


const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
  }
});
instrument(wsServer, {
    auth: false
});

wsServer.on("connection", socket => {
    socket.on("join_room", (roomName) => {
        socket.join(roomName) ;        
        socket.to(roomName).emit("welcome")
    });

    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer)
    });

    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    })

    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice",ice);
    })
})
  
const handleListen = () => console.log(`Listening on http://localhost:3000`)
httpServer.listen(3000, handleListen);
// https.createServer(options,app).listen(HTTPS_PORT)