/**
 * Server that connecting UI to Dapp. It involves two parts: 1) web-socket & web-server.
 * The web-socket part use socket-io to push smart contract events to UI as messages.
 * The web server part supports GET & POST function from UI and interact with Dapp
 */

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

// define PORT and gas-price as constant
const PORT = 8000;
const gasPrice = web3.utils.toWei('0.00001', 'ether');

// set dapp instances for web-socket and web-server
const FlightSuretyApp = require(path.join(__dirname, "build/contracts/FlightSuretyApp.json"));
const FlightSuretyData = require(path.join(__dirname, "build/contracts/FlightSuretyData.json"));
const BuyerData = require(path.join(__dirname, "build/contracts/BuyerData.json"));
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, Config.dataAddress);
let buyerData = new web3.eth.Contract(BuyerData.abi, Config.buyerDataAddress);
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, Config.appAddress);

/**
 * Web-Socket part. Use socket of web3 instances to listen on events. 
 * Once events arrival, use socket-io emit message to UI
 */
// listening to socket connection from UI
socketIO.on('connection', socket=>{
    console.log(`A user connected`);
    socket.on('disconnect', ()=>{
        console.log('user disconnected');
    })
})
// listening to events from Dapp
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

buyerData.events.allEvents()
.on('data', (event)=>{
    console.log(event);
    socketIO.emit('event emit', {event:event.event, content:event.returnValues});
})
.on('error', (error)=>rej(error));

/**
 * Web-server that support UI functionalities. There are 3 pages in UI and nav-bar on UI.
 * 1) Flights UI: Showing all available flights and passenager's flights. It also provide flight status fetching function
 * 2) Insurance UI: Showing all insurances of the passenager and provide button for withdrawing credits
 * 3) Airline UI: Showing all registered airlines status and their fund
 */
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API supporting all passenagers available for selection on nav-bar
app.get("/passenagers", async(req, res)=>{
    let accounts = await web3.eth.getAccounts()
    let passenagers = accounts.slice(31,40);
    console.log("All Passenagers")
    res.status(200).send(passenagers);
});

/**
 * API functions supporting Flights UI
 * 
 */

// API support all-flight tables
app.get("/flights/all/:sender", async(req, res)=>{
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

// API support fetch flight status button
app.post("/flights/fetch", async(req, res)=>{
    const cost = await flightSuretyApp.methods
                        .fetchFlightStatus(
                            req.body.airline, 
                            req.body.flightCode, 
                            req.body.flightTimestamp,
                            req.body.fetchTimestamp
                        )
                        .estimateGas({from:req.body.sender});
    await flightSuretyApp.methods
            .fetchFlightStatus(
                req.body.airline, 
                req.body.flightCode, 
                req.body.flightTimestamp,
                req.body.fetchTimestamp
            )
            .send({from:req.body.sender,gas:cost+5000, gasPrice:gasPrice});
});

// API support flights table of the selected passenager
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

// API support button buying insurance for flight
app.post("/insurances/buy", async (req, res)=>{
    console.log("buy insurance for flight");
    try{
        const feeWei = web3.utils.toWei(req.body.fee, 'ether');
        console.log(req.body);
        const cost = await flightSuretyApp.methods
                                .passenagerBuyInsurance(req.body.key, req.body.airline)
                                .estimateGas({from:req.body.sender, value:feeWei});
        await flightSuretyApp.methods
                .passenagerBuyInsurance(req.body.key,req.body.airline)
                .send({from:req.body.sender, value:feeWei, gas:cost+5000, gasPrice:gasPrice});
        res.status(200).send({result:true});
    } catch(err){
        res.status(200).send({result:false, msg:err.message});
    }
});

/**
 * API functions supporting Insurances UI
 * 
 */

// API support passenager's insurances table 
app.get("/insurance/passenager/:sender", async(req, res)=>{
    var allInsurances = [];
    try{
        const keys = await buyerData.methods
                            .queryBuyerInsuranceKeys(req.params.sender)
                            .call({from:req.params.sender});
        for(let i=0; i<keys.length; i++){
            let insurance = await flightSuretyData.methods
                                    .queryInsuranceInfo(keys[i])
                                    .call({from:req.params.sender});
            console.log(insurance);
            allInsurances.push({
                insuranceKey:keys[i],
                buyer:insurance.buyer,
                flightKey:insurance.flightKey,
                airline:insurance.airline,
                fee:web3.utils.fromWei(insurance.fee),
                credits:web3.utils.fromWei(insurance.credits),
                status:insurance.insuranceStatus
            });
        }
        res.status(200).send(allInsurances);
    } catch(err){
        res.status(200).send(allInsurances);
    }
});

// API support card showing passenager's current credits
app.get("/insurance/credits/fetch/:sender", async(req, res)=>{
    try{
        const credits = await buyerData.methods
                                .queryBuyerCredit(req.params.sender)
                                .call({from:req.params.sender});
        res.status(200).send(credits);
    }catch(err){
        console.log(`Error in fethcing passenager's credits:${err.message}`)
        res.status(200).send('0');
    }
})

// API support withdraw button for withdrawing passenager's credits
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

// API support routing the main HTML to UI
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