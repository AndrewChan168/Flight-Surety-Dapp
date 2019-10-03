const FlightSuretyApp = require("../../build/contracts/FlightSuretyApp.json");
const FlightSuretyData = require("../../build/contracts/FlightSuretyData.json");
const Config = require("./config.json");
const Web3 = require("web3");




//console.log(FlightSuretyApp.abi);
let web3 = new Web3("http://localhost:8545");

let flightSuretyData = FlightSuretyData.new()
let flightSuretyApp = FlightSuretyApp.new(flightSuretyData.address)
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, Config.dataAddress);
//console.log(flightSuretyData);
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, Config.appAddress);

//var accounts;

//web3.eth.getAccounts().then(e=>console.log(e));

//web3.eth.getAccounts()
//    .then(e=>accounts=e);


async function addAuthorizedCaller(owner){
    await flightSuretyData.methods
        .addAuthorizedCaller(Config.appAddress)
        .send({from:owner})
}

async function registerAirline(name, address){
    await flightSuretyApp.methods
        .registerAirline(name)
        .send({from:address});
}

async function voteAirline(candidate, voter){
    await flightSuretyApp.methods
        .airlineVote(candidate)
        .send({from:voter});
}

async function fundAirline(airline, fund_wei){
    await flightSuretyApp.methods
        .airlineFund()
        .send({from:airline, value:fund_wei});
}

async function registerFlight(code, timestamp, airline){
    await flightSuretyApp.methods
        .registerFlight(code, timestamp)
        .send({from:airline});
    return await flightSuretyData.methods
        .generateFlightKey(code, timestamp)
        .call({from:airline});
}

async function buyInsurance(flightKey, timestamp, airline, passenager, fee_wei){
    await flightSuretyApp.methods
        .passenagerBuyInsurance(flightKey, timestamp, airline)
        .send({from:passenager, value:fee_wei});
    return await flightSuretyData.methods
        .generateInsuranceKey(passenager, timestamp, airline)
        .call({from:passenager});
}

async function withdrawCredits(insuranee){
    await flightSuretyApp.methods
        .passenagerWithdrawCredits()
        .send({from:insuranee});
}

/*
async function buyInsurance(){

}
*/

try{
    addAuthorizedCaller("0xe45cf0cd14dd5d5b4cf807813544eee2987212f1");
    registerAirline('Airline-01', '0x1569561bbfb31cc106aa1dfc6665255e2840b4e4');
    registerAirline('Airline-02', '0x8b0e005bb06610d2ed4919d0a203a290899143b4');
    registerAirline('Airline-03', '0xbf8f952fc016968e71994934d5d2daf109206d6d');
    registerAirline('Airline-04', '0xd19998692acee9a34f005608505e26b9842526f5');
    registerAirline('Airline-05', '0x017acc6d615cdd8ef2638b93da2dd32aba121d93');
    voteAirline('0x017acc6d615cdd8ef2638b93da2dd32aba121d93', '0x1569561bbfb31cc106aa1dfc6665255e2840b4e4');
    const fund_wei = web3.utils.toWei('20');
    fundAirline('0x1569561bbfb31cc106aa1dfc6665255e2840b4e4', fund_wei);
    //registerFlight("AX01", 20191003, "0x1569561bbfb31cc106aa1dfc6665255e2840b4e4");
    /*
    flightSuretyData.methods
        .generateFlightKey("AX01", 20191003)
        .call({from:'0x1569561bbfb31cc106aa1dfc6665255e2840b4e4'})
        .then(key=>console.log(key));
    */
}catch(err){
    console.log(err.message);
}