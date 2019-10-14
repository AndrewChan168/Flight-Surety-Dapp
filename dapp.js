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
const BuyerData = require(path.join(__dirname, "build/contracts/BuyerData.json"));
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, Config.dataAddress);
let buyerData = new web3.eth.Contract(BuyerData.abi, Config.buyerDataAddress);
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

app.get("/passenagers", async(req, res)=>{
    let accounts = await web3.eth.getAccounts()
    let passenagers = accounts.slice(31,40);
    console.log("All Passenagers")
    res.status(200).send(passenagers);
});

app.get("/flights/all/:sender", async(req, res)=>{
    //console.log(`Get all flights`)
    var allFlights = [];
    try{
        const sender = req.params.sender;
        const keys = await flightSuretyData.methods
                            .getAllFlightKeys()
                            .call({ from: sender});
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
    } catch(err){
        console.log(`Error in fetching all flights: ${err.message}`);
        res.status(200).send(allFlights);
    }
});

app.get("/flights/passenager/:sender", async(req, res)=>{
    var allFlights = [];
    try{
        const sender = req.params.sender;
        const keys = await buyerData.methods
                            .queryBuyerFlightKeys(sender)
                            .call({from:sender});
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
    }catch(err){
        console.log(`Error in fetching flights of passenager: ${err.message}`);
        res.status(200).send(allFlights);
    }
})

app.post("/insurances/buy", async (req, res)=>{
    console.log("buy insurance for flight");
    try{
        const feeWei = web3.utils.toWei(req.body.fee, 'ether');
        const key = await flightSuretyData.methods
                            .generateFlightKey(req.body.flightCode, req.body.flightTimestamp)
                            .call({from:res.body.sender});
        const cost = await flightSuretyApp.methods
                                .passenagerBuyInsurance(key,req.body.airline)
                                .estimateGas({from:req.body.sender, value:feeWei});
        await flightSuretyApp.methods
                .passenagerBuyInsurance(key,req.body.airline)
                .send({from:req.body.sender, value:feeWei, gas:cost+5000, gasPrice:gasPrice});
        res.status(200).send({result:true});
    } catch(err){
        res.status(200).send({result:false, msg:err.message});
    }
});

app.get("/insurance/passenager/:sender", async(req, res)=>{
    var allInsurances = [];
    try{
        const keys = await buyerData.methods
                            .queryBuyerFlightKeys(req.params.sender)
                            .call({from:req.params.sender});
        for(let i=0; i<keys.length; i++){
            let insurance = await flightSuretyData.methods
                                    .queryInsuranceInfo(keys[i])
                                    .call({from:req.params.sender});
            allInsurances.push({
                insuranceKey:keys[i],
                buyer:insurance.buyer,
                flightKey:insurance.flightKey,
                airline:insurance.airline,
                fee:insurance.fee,
                credits:insurance.credits,
                status:insurance.insuranceStatus
            })
        }
        res.status(200).send(allInsurances);
    } catch(err){
        res.status(200).send(allInsurances);
    }
});

app.get("/insurance/credits/fetch/:sender", async(req, res)=>{
    try{
        const credits = await flightSuretyData.methods
                                .queryBuyerCredit(req.params.sender)
                                .call({from:req.params.sender});
        res.status(200).send(credits);
    }catch(err){
        console.log(`Error in fethcing passenager's credits:${err.message}`)
        res.status(200).send('0');
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