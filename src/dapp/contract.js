const FlightSuretyApp = require("../../build/contracts/FlightSuretyApp.json");
const FlightSuretyData = require("../../build/contracts/FlightSuretyData.json");
const Config = require("./config.json");
const Web3 = require("web3");

export default class Contract{
    constructor(callback){
        this.setWeb(Config.url);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, Config.dataAddress);
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, Config.appAddress);
        this.initialize(callback);
        //this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    setWeb(url){
        if (url){
            this.web3 = new Web3(url);
        } else {
            this.web3 = new Web3("http://localhost:8545");
        } 
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
        let self = this;
        self.flightSuretyApp.methods
             .isOperational()
             .call({ from: self.owner}, callback);
     }

     fetchFlightStatus(flightcode, callback) {
        let self = this;
        let payload = {
            airline: this.airlines[0],
            flightcode: flightcode,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        this.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flightcode, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    registerAirline(name, address, callback){
        this.flightSuretyApp.methods
            .registerAirline(name)
            .send({from:address})
            .then(callback);
    }

    voteAirline(candidate, voter, callback){
        this.flightSuretyApp.methods
            .airlineVote(candidate)
            .send({from:voter})
            .then(callback);
    }

    fundAirline(airline, fund_wei, callback){
        this.flightSuretyApp.methods
            .airlineFund()
            .send({from:airline, value:fund_wei})
            .then(callback)
    }

    registerFlight(code, timestamp, airline){
        this.flightSuretyApp.methods
            .registerFlight(code, timestamp)
            .send({from:airline})
            .then(()=>{
                return this.flightSuretyData.methods
                            .generateFlightKey(code, timestamp)
                            .call({from:airline})
            })
            .then(key=>callback(key));
    }

    buyInsurance(flightKey, timestamp, airline, passenager, fee_wei, callback){
        this.flightSuretyApp.methods
            .passenagerBuyInsurance(flightKey, timestamp, airline)
            .send({from:passenager, value:fee_wei})
            .then(()=>{
                return this.flightSuretyData.methods
                            .generateInsuranceKey(passenager, timestamp, airline)
                            .send({from:passenager})
            })
            .then(key=>callback(key));
    }

    withdrawCredits(insuranee, callback){
        this.flightSuretyApp.methods
            .passenagerWithdrawCredits()
            .send({from:insuranee})
            .then(callback);
    }
}