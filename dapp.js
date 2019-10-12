const path = require('path');

const Web3 = require("web3");
const Config = require(path.join(__dirname, "src/config.json"));
let web3 = new Web3(new Web3.providers.WebsocketProvider(Config.ws));


const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

const app = express();
const server = http.createServer(app);
var socketIO = require('socket.io')(server);

const PORT = 8000;
const gasPrice = web3.utils.toWei('0.00001', 'ether');

/** setup websocket server */

socketIO.on('connection', socket=>{
    console.log(`A user connected`);
    socket.on('disconnect', ()=>{
        console.log('user disconnected');
    })
})

const FlightSuretyApp = require(path.join(__dirname, "build/contracts/FlightSuretyApp.json"));
const FlightSuretyData = require(path.join(__dirname, "build/contracts/FlightSuretyData.json"));
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, Config.dataAddress);
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, Config.appAddress);

flightSuretyApp.events.allEvents()
    .on('data', (event)=>{
        console.log(event);
        socketIO.emit('event emit', {event:event.event, content:event.returnValues});
    })
    .on('error', (error)=>rej(error));

flightSuretyData.events.allEvents()
    .on('data', (event)=>{
        console.log(event);
        socketIO.emit('event emit', {event:event.event, content:event.returnValues});
    })
    .on('error', (error)=>rej(error));



app.use(bodyParser.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get("/flights/:sender", async(req, res)=>{
    console.log(`Get all flights`)
    var allFlights = [];
    const sender = req.params.owner
    const keys = await flightSuretyData.methods
                            .getAllFlightKeys()
                            .call({ from: sender})
    for(let i=0; i<keys.length; i++){
        let flight = await flightSuretyData.methods
                                .queryFlightInfo(keys[i])
                                .call({from:sender});
        allFlights.push({
            flightKey:flight.flightKey,
            code:flight.code,
            airline:flight.airline,
            timestamp:flight.timestamp,
            status:flight.status
        });
    }
    res.status(200).send(allFlights);
});

app.post("/insurances/buy", async (req, res)=>{
    console.log("buy insurance for flight");
    try{
        const feeWei = web3.utils.toWei(req.body.fee, 'ether');
        const key = await flightSuretyData.methods
                            .generateFlightKey(req.body.flightCode, req.body.flightTimestamp)
                            .call({from:res.body.sender});
        const contractTimestamp = Math.floor(Date.now() / 1000);
        const cost = await flightSuretyApp.methods
                                .passenagerBuyInsurance(key,contractTimestamp,req.body.airline)
                                .estimateGas({from:req.body.sender, value:feeWei});
        await flightSuretyApp.methods
                .passenagerBuyInsurance(key,contractTimestamp,req.body.airline)
                .send({from:req.body.sender, value:feeWei, gas:cost+5000, gasPrice:gasPrice});
        res.status(200).send({result:true});
    } catch(err){
        res.status(400).send({result:false, msg:err.message});
    }
});

app.get("/insurance/credits/:sender", async(req, res)=>{
    try{
        const credits = await flightSuretyData.methods
                                .queryBuyerCredit(req.params.sender)
                                .call({from:req.params.sender});
        res.status(200).send({result:true, credits:credits});
    }catch(err){
        res.status(400).send({result:false, msg:err.message});
    }
})

app.post("/insurance/credits/withdraw", async(req, res)=>{
    try{
        const cost = await flightSuretyApp.methods
                            .passenagerWithdrawCredits()
                            .estimateGas({from:req.body.sender});
        await flightSuretyApp.methods
                .passenagerWithdrawCredits()
                .send({from:req.body.sender, gas:cost+5000, gasPrice:gasPrice});
        res.status(200).send({result:true});
    }catch(err){
        res.status(400).send({result:false, msg:err.message});
    }
});

app.use("/", async(req, res) => {
    console.log(`Root`)
    const appValid = await flightSuretyApp.methods.isOperational().call({from:Config.contractOwner});
    const dataValid = await flightSuretyData.methods.isOperational().call({from:Config.contractOwner});
    //res.status(200).sendFile(path.join(__dirname, 'public', 'views', 'index.html'));
    if(appValid && dataValid){
        res.status(200).sendFile(path.join(__dirname, 'public', 'views', 'index.html'));
    } else {
        res.status(400).sendFile(path.join(__dirname, 'public', 'views', 'error.html'));
    }
});

server.listen(PORT, ()=>console.log(`Listening on Port: ${PORT}`));