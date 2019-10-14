/*
const Websocket = require('ws');
const url = 'ws://localhost:8000';
const connection = new Websocket(url);
connection.onopen = () =>{
    console.log("Connect from client")
    connection.send("andrew", "Confirm send")
}


connection.onerror = (error) => {
    console.log(`Websocket error: ${error.message}`);
}

connection.onmessage = (msg) => {
    console.log(`ONMESSAGE: ${msg.data}`);
}
*/


var socket = require('socket.io-client')('http://localhost:8000');
socket.on('connect', ()=>{
    console.log('Client connected');
});
socket.on('event emit', (data)=>{
    console.log(`On message received:`);
    console.log(data)
});
socket.on('disconnect', ()=>{
    console.log(`Client disconnected`);
});
