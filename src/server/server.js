const Config = require("../../src/config.json");
const FlightSuretyApp = require("../../build/contracts/FlightSuretyApp.json");
//const FlightSuretyData = require("../../build/contracts/FlightSuretyData.json");
const Web3 = require("web3");
const randomItem = require('random-item');

//let web3 = new Web3(Config.url);
let web3 = new Web3(new Web3.providers.WebsocketProvider(Config.ws));

/** when contracts have been deployed */
//let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, Config.dataAddress);
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, Config.appAddress);

/** get all oracleAddress and corresponding indexes*/

const gasPrice = web3.utils.toWei('0.00001', 'ether');

web3.eth.getAccounts()
    .then(accounts=>{
        //console.log(accounts);
        return flightSuretyApp.methods
                .getAllOracles().call({from:accounts[0]});
    })
    .then(async(oracles)=>{
        console.log(`Listening to ${Config.ws} for OracleRequest event`);
        flightSuretyApp.events.OracleRequest()
            .on('data', async(event)=>{
                console.log(`event type: ${event.event}`);
                console.log(event.returnValues);
                var oracleIndexes;
                var estimateGas;
                var randomStatusCode;
                for(let i=0; i<oracles.length; i++){
                    oracleIndexes = await flightSuretyApp.methods
                                            .getMyIndexes()
                                            .call({from:oracles[i]});
                    for(let idx=0; idx<oracleIndexes.length; idx++){
                        if(oracleIndexes[idx]==event.fetchIndex){
                            randomStatusCode = randomItem([0,10,20,30,40,50]);
                            estimateGas = await flightSuretyApp.methods
                                            .submitOracleResponse(
                                                event.returnValues.fetchIndex,
                                                event.returnValues.airline,
                                                event.returnValues.flightCode,
                                                event.returnValues.flightTimestamp,
                                                randomStatusCode
                                            )
                                            .estimateGas({from:oracles[i]});
                            
                            await flightSuretyApp.methods
                                    .submitOracleResponse(
                                        event.returnValues.fetchIndex,
                                        event.returnValues.airline,
                                        event.returnValues.flightCode,
                                        event.returnValues.flightTimestamp,
                                        randomStatusCode
                                    )
                                    .send({from:oracles[i],gas:estimateGas+10000,gasPrice:gasPrice});
                        }
                    }
                }
            })
            .on('error', console.error);
    })
    .catch(err=>console.log(err.message));