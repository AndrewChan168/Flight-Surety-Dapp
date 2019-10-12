const FlightSuretyApp = require("../../build/contracts/FlightSuretyApp.json");
const FlightSuretyData = require("../../build/contracts/FlightSuretyData.json");
const Config = require("../../src/config.json");
const Web3 = require("web3");

let web3 = new Web3(new Web3.providers.WebsocketProvider(Config.ws));

class Contract{
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
            if (error){
                console.log(error.message);
            } else{
                this.owner = accts[0];
                let counter = 1;
                while(this.airlines.length < 5) {
                    this.airlines.push(accts[counter++]);
                }
                while(this.passengers.length < 5) {
                    this.passengers.push(accts[counter++]);
                }
            }
            callback();
        });
    }

    /*isOperational(callback) {
        let self = this;
        self.flightSuretyApp.methods
             .isOperational()
             .call({ from: self.owner}, callback);
     }*/
     isOperational(){
        let self = this;
        return new Promise((res,rej)=>{
            self.flightSuretyApp.methods
                .isOperational()
                .call({ from: self.owner}, (err, result)=>(err) ? rej(err) : res(result));
        });
     }

     getAllFlights(){
         let self = this;
         return new Promise((res, rej)=>{
             var allFlights = [];
             self.flightSuretyData.methods
                    .getAllFlightKeys()
                    .call({ from: self.owner})
                    .then(async(keys)=>{
                        for(let i=0; i<keys.length; i++){
                            let flight = await self.flightSuretyData.methods
                                                    .queryFlightInfo(keys[i])
                                                    .call({from:self.owner});
                            allFlights.push(flight)
                        }
                        res(allFlights);
                    })
                    .catch(rej);
         });
     }

     buyInsurance(flightKey, timestamp, airline, passenager, fee_wei){
        let self = this;
        return new Promise((res, rej)=>{
            self.flightSuretyApp.methods
                .passenagerBuyInsurance(flightKey, timestamp, airline)
                .estimateGas({from:passenager, value:fee_wei})
                .then(estimatedGas=>{
                    //res(estimatedGas);
                    self.flightSuretyApp.methods
                        .passenagerBuyInsurance(flightKey, timestamp, airline)
                        .send({
                            from:passenager, value:fee_wei, 
                            gas:estimatedGas+5000,
                            gasPrice:web3.utils.toWei('0.00001', 'ether')
                        })
                })
                .catch(err=>rej(err.message));
        });
     }

     fetchFlightStatus(airline, flightCode, flightTimestamp, fetchTimestamp, passenager){
        let self = this;
        return new Promise((res, req)=>{
            self.flightSuretyApp.methods
                .fetchFlightStatus(airline, flightCode, flightTimestamp, fetchTimestamp)
                .estimateGas({from:passenager})
                .then(estimatedGas=>{
                    //res(estimatedGas);
                    self.flightSuretyApp.methods
                        .fetchFlightStatus(airline, flightCode, flightTimestamp, fetchTimestamp)
                        .send({
                            from:passenager,
                            gas:estimatedGas+5000,
                            gasPrice:web3.utils.toWei('0.00001', 'ether')
                        });
                })
                .catch(err=>rej(err.message));
        });
     }

     queryPassenagerCredits(insuranee){
        let self = this;
        return new Promise((res, rej)=>{
            self.flightSuretyData.methods
                .queryBuyerCredit(insuranee)
                .call({from:insuranee})
                .then(credit=>res(credit))
                .catch(err=>rej(err));
        });
     }

     withdrawCredits(insuranee){
        let self = this;
        return new Promise((res, rej)=>{
            self.flightSuretyApp.methods
                .passenagerWithdrawCredits()
                .estimateGas({from:insuranee})
                .then(estimatedGas=>{
                    self.flightSuretyApp.methods
                        .passenagerWithdrawCredits()
                        .send({
                            from:insuranee, 
                            gas:estimatedGas+5000,
                            gasPrice:web3.utils.toWei('0.00001', 'ether')
                        });
                });
        })
        .catch(err=>rej(err.message));
    }

    listen2App(res, rej){
        let self = this
        self.flightSuretyApp.events.allEvents()
            .on('data', (event)=>{
                res(event);
            })
            .on('error', (error)=>rej(error));
    }

    listen2Data(res, rej){
        let self = this
        self.flightSuretyData.events.allEvents()
            .on('data', (event)=>{
                res(event);
            })
            .on('error', (error)=>rej(error));
    }
}
/*
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
*/
module.exports = Contract;