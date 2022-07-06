import http from "http";
import { Server } from "socket.io"
import { instrument  } from "@socket.io/admin-ui";
import express from "express";

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

    // (1) 소켓 접속되면 일단 nickname 을 Anonymous로 디폴트 설정해줌
    socket["nickname"] = "Anonymous"

    // 모든 socket 이벤트에 대한 log 표시
    socket.onAny((event) => {
        console.log(wsServer.sockets.adapter);
        console.log(`Socket Event : ${event}`)        
    });

    // (3) 전달받은 room name 으로 입장한다 (없는 경우 room 만들면서 입장)
    socket.on("join_room", (roomName) => {
        socket.join(roomName) ;        
        socket.to(roomName).emit("welcome")
    });

    // 아래 offer, answer, ice : WebRTC peer-to-peer 연결을 위해 socket으로 시그널링
    
    // (5) offer 내용을 전달받고 같은 방에 offer를 보낸다. 
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer)
    });

    // (7) answer의 내용을 전달받아 같은 방에 answer를 보낸다. 
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    })

    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice",ice);
    })

    // 이하 text chat을 병합하기 위해 추가하는 socket 통신 + 방 나가기 핸들링
    socket.on("new_message", (msg, roomName, done) => {
        socket.to(roomName).emit("new_message", `${socket.nickname}: ${msg}`);        
        done();
    });

    socket.on("nickname", nickname => socket["nickname"] = nickname);    

    // socket.on("disconnecting", () => {
    //     socket.rooms.forEach((room) => socket.to(room).emit("bye", socket.nickname));      
    // });

    // socket.on("disconnect", () => {
    //     wsServer.sockets.emit("room_change", publicRooms());
    // })

})
  
const handleListen = () => console.log(`Listening on http://localhost:3000`)
httpServer.listen(3000, handleListen);