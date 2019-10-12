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
        for(let i=0; i<oracles.length; i++){
            console.log(`${i+1} oracle: ${oracles[i]}`);
        }
        console.log(`Listening to ${Config.ws} for OracleRequest event`);
        flightSuretyApp.events.OracleRequest()
            .on('data', async(event)=>{
                console.log(`event type: ${event.event}`);
                console.log(event.returnValues);
                var oracleIndexes;
                var estimateGas;
                var randomStatusCode;
                randomStatusCode = randomItem([10,20,50]);
                for(let i=0; i<oracles.length; i++){
                    oracleIndexes = await flightSuretyApp.methods
                                            .getMyIndexes()
                                            .call({from:oracles[i]});
                    //console.log(`Fetch Index:${event.returnValues.index.toNumber()} vs Oracle Indexes:${oracleIndexes}, for ${i+1} oracle `);
                    console.log(`The status code sunmitted from oracles for ${event.returnValues.flight}-${parseInt(event.returnValues.flightTimestamp)}:${randomStatusCode}`);
                    console.log(`The fetch timestamp - ${parseInt(event.returnValues.fetchTimestamp)}`);
                    console.log(`Fetch Index:${parseInt(event.returnValues.index)} vs Oracle Indexes:${oracleIndexes}, for ${i+1}-th oracle `);
                    for(let idx=0; idx<oracleIndexes.length; idx++){
                        if(oracleIndexes[idx]===event.returnValues.index){
                            try{
                                estimateGas = await flightSuretyApp.methods
                                            .submitOracleResponse(
                                                parseInt(event.returnValues.index),
                                                event.returnValues.airline,
                                                event.returnValues.flight,
                                                parseInt(event.returnValues.flightTimestamp),
                                                parseInt(event.returnValues.fetchTimestamp),
                                                randomStatusCode
                                            )
                                            .estimateGas({from:oracles[i]});
                            
                            await flightSuretyApp.methods
                                    .submitOracleResponse(
                                        parseInt(event.returnValues.index),
                                        event.returnValues.airline,
                                        event.returnValues.flight,
                                        parseInt(event.returnValues.flightTimestamp),
                                        parseInt(event.returnValues.fetchTimestamp),
                                        randomStatusCode
                                    )
                                    .send({from:oracles[i],gas:estimateGas+10000,gasPrice:gasPrice});
                            }catch(err){
                                console.log(`Error when submitOracleResponse():${err.message}`);
                            }
                        }
                    }
                console.log(`Proceeded ${i+1}-oracle: ${oracles[i]}`);
                }
            })
            .on('error', (error)=>console.log(error.message));
    })
    .catch(err=>console.log(err.message));