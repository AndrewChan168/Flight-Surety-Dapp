const Web3 = require("web3");
const FlightSuretyApp = require("../../build/contracts/FlightSuretyApp.json");
const FlightSuretyData = require("../../build/contracts/FlightSuretyData.json");
const Config = require("../../src/config.json");

let web3 = new Web3(new Web3.providers.WebsocketProvider(Config.ws));

let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, Config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, Config.dataAddress);

flightSuretyData.events.allEvents()
    .on('data', (event)=>{
        console.log(`event type: ${event.event}`);
        console.log(event.returnValues);
    })
    .on('error', (error)=>console.log(error.message));

flightSuretyApp.events.allEvents()
    .on('data', (event)=>{
        console.log(`event type: ${event.event}`);
        console.log(event.returnValues);
    })
    .on('error', (error)=>console.log(error.message));