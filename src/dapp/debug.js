const Contract = require("../dapp/contract");
const contract = new Contract(()=>{console.log("Successful Setup Contract instance")});
//const contract = new Contract((accts)=>console.log(accts));

//contract.isOperational((err, res)=>console.log(res));
/*
contract.isOperational()
    .then((operational)=>{
        console.log(operational);
        //return contract.getAllFlightKeys()
        return contract.getAllFlights()
    })
    .then((flights)=>{
        console.log(flights);
        let flightInfo = flights[0];
        return contract.fetchFlightStatus(flightInfo.code, flightInfo.airline, parseInt(flightInfo.timestamp));
    })
    .catch(console.error);
*/

const Web3 = require("web3");
const FlightSuretyApp = require("../../build/contracts/FlightSuretyApp.json");
const FlightSuretyData = require("../../build/contracts/FlightSuretyData.json");
const Config = require("../../src/config.json");

let web3 = new Web3(new Web3.providers.WebsocketProvider(Config.ws));
/*
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, Config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, Config.dataAddress);
const gasPrice = web3.utils.toWei('0.00001', 'ether');

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
*/

const contractTimestamp = Math.floor(Date.now() / 1000);

contract.withdrawCredits('0xa002b919a7a4d057e2c87862b046f47b39830304');
/*
contract.queryPassenagerCredits('0xa002b919a7a4d057e2c87862b046f47b39830304')
    .then(credit=>console.log(`The credit of ${'0xa002b919a7a4d057e2c87862b046f47b39830304'}: ${credit}`));
*/

/*
contract.getAllFlights()
    .then(flightInfos=>{
        let flightInfo = flightInfos[1];
        const fetchTimestamp = Math.floor(Date.now() / 1000);
        console.log(`fetch timestamp: ${fetchTimestamp}`);
        return contract.fetchFlightStatus(
            flightInfo.airline, 
            flightInfo.code,
            parseInt(flightInfo.timestamp),
            fetchTimestamp,
            '0xa002b919a7a4d057e2c87862b046f47b39830304'
        )
    });*/
/*
contract.getAllFlights()
    .then(flightInfos=>{
        console.log(flightInfos);
        let flightInfo = flightInfos[1];
        return contract
                .buyInsurance(
                    flightInfo.flightKey, 
                    parseInt(flightInfo.timestamp), 
                    flightInfo.airline, 
                    '0xa002b919a7a4d057e2c87862b046f47b39830304',
                    web3.utils.toWei('1')
                )
    })
    .then(()=>{
        console.log("bought insurance");
        return contract.getAllFlights()
    })
    .then(flightInfos=>{
        const fetchTimestamp = Math.floor(Date.now() / 1000)
        console.log(`fetch timestamp: ${fetchTimestamp}`);
        let flightInfo = flightInfos[1];
        return contract.fetchFlightStatus(
            flightInfo.airline, 
            flightInfo.code,
            parseInt(flightInfo.timestamp),
            fetchTimestamp
        )
    })
    .then(()=>console.log('Fetched insurance'));
    //.then(()=>{});
*/

/** buy insurance */
/*
web3.eth.getAccounts()
    .then(accounts=>{
        return flightSuretyData.methods
                .getAllFlightKeys()
                .call({from:accounts[0]})
    })
    .then(keys=>{
        const key = keys[0];
        console.log(`FLightKey:${key}`);
        return flightSuretyData.methods
                .queryFlightInfo(key)
                .call({from:Config.contractOwner})
    })
    .then(info=>{
        flightSuretyApp.methods
            .passenagerBuyInsurance(
                info.flightKey, 
                contractTimestamp, 
                info.airline
            )
            .estimateGas({
                from:'0xa1254e8ef9da718e357a7e0f9698284784c2b9c3',
                value:web3.utils.toWei('0.5', 'ether')
            })
            .then((esimtateGas)=>{
                flightSuretyApp.methods
                    .passenagerBuyInsurance(
                        info.flightKey,
                        contractTimestamp, 
                        info.airline
                    )
                    .send({
                        from:'0xa1254e8ef9da718e357a7e0f9698284784c2b9c3',
                        value:web3.utils.toWei('0.5', 'ether'),
                        gas:esimtateGas+5000,
                        gasPrice:gasPrice
                    })
            })
    })
    .catch((err)=>console.log(err.message));
*/

/** fetchFlightStatus */
/*
web3.eth.getAccounts()
    .then(accounts=>{
        return flightSuretyData.methods
                .getAllFlightKeys()
                .call({from:accounts[0]})
    })
    .then(keys=>{
        const key = keys[0];
        console.log(`FLightKey:${key}`);
        return flightSuretyData.methods
                .queryFlightInfo(key)
                .call({from:Config.contractOwner})
    })
    .then((info)=>{
        const fetchTimestamp = Math.floor(Date.now() / 1000)
        return flightSuretyApp.methods
                .fetchFlightStatus(info.airline, info.code, info.timestamp, fetchTimestamp)
                .estimateGas({from:Config.contractOwner})
                .then((esimtaGas)=>{
                    return flightSuretyApp.methods
                            .fetchFlightStatus(info.airline, info.code, info.timestamp, fetchTimestamp)
                            .send({
                                from:Config.contractOwner,
                                gas:esimtaGas+5000,
                                gasPrice:gasPrice
                            })
                })
    })
    .catch((err)=>console.log(err.message));
*/
