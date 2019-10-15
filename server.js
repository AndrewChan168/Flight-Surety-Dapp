//const Config = require("../../src/config.json");
//const FlightSuretyApp = require("../../build/contracts/FlightSuretyApp.json");
const path = require('path');
const Config = require(path.join(__dirname, "src/config.json"));
const FlightSuretyApp = require(path.join(__dirname, "build/contracts/FlightSuretyApp.json"));

const Web3 = require("web3");
const randomItem = require('random-item');

/** use web-socket version web3 */
let web3 = new Web3(new Web3.providers.WebsocketProvider(Config.ws));

let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, Config.appAddress);

const gasPrice = web3.utils.toWei('0.00001', 'ether');

/**
 * A one-off function that prepares data for demonstration.
 * It would automatically:
 * 1. Register 4 airlines (and all these 4 airlines would fund 15 ethers)
 * 2. Add 6 flights
 * 3. Buy insurance on flight AX0101 for 1 passenager (the default passenager in UI)
 * 4. Register 30 oracles who will submit oracle responses for flight status
 */

(async ()=>{
    try{
        const gasPrice = web3.utils.toWei('0.00001', 'ether');
        var estimateGas;
        var contractBalance;
        const accounts = await web3.eth.getAccounts();
        var flightKey;
        var oracleIndexes;
        var accountBalance;
        var isAuthor;
        
        /** Set the authors for FlightSuretyData & BuyerData smart contracts */
        await flightSuretyData.methods
                .addAuthorizedCaller(flightSuretyApp.options.address)
                .send({from:accounts[0]});
        await buyerData.methods
                .addAuthorizedCaller(flightSuretyApp.options.address)
                .send({from:accounts[0]});

        /** check if authors were set up correctly */
        isAuthor = await flightSuretyData.methods
                            .isAuthorizedCaller(flightSuretyApp.options.address)
                            .call({from:accounts[0]})
        console.log(`Is FlightSuretyApp author of FlightSuretyData: ${isAuthor}`);
        isAuthor = await buyerData.methods
                            .isAuthorizedCaller(flightSuretyApp.options.address)
                            .call({from:accounts[0]})
        console.log(`Is FlightSuretyApp author of FlightSuretyData: ${isAuthor}`);

        /** Register 4 airlines */
        estimateGas = await flightSuretyApp.methods
                                .registerAirline('Airline-01')
                                .estimateGas({from:accounts[0]});
        console.log(`Estimated gas for airline registering: ${estimateGas}`);
        await flightSuretyApp.methods
                .registerAirline('Airline-01')
                .send({from:accounts[1],gasPrice:gasPrice,gas: estimateGas+10000});
        await flightSuretyApp.methods
                .registerAirline('Airline-02')
                .send({from:accounts[2],gasPrice:gasPrice,gas: estimateGas+10000});
        await flightSuretyApp.methods
                .registerAirline('Airline-03')
                .send({from:accounts[3],gasPrice:gasPrice,gas: estimateGas+10000});
        await flightSuretyApp.methods
                .registerAirline('Airline-04')
                .send({from:accounts[4],gasPrice:gasPrice,gas: estimateGas+10000});
        
        const airlinesNum = await flightSuretyData.methods
                                    .queryRegisteredAirlinesCount()
                                    .call({from:accounts[0]});
        console.log(`Number of registered airlines: ${airlinesNum}`);
        
        /** Let 4 registered airline to fund */
        estimateGas = await flightSuretyApp.methods
                                .airlineFund()
                                .estimateGas({from:accounts[1],value:web3.utils.toWei('15', 'ether')});
        console.log(`Estimated gas for airline funding: ${estimateGas}`);
        await flightSuretyApp.methods
                .airlineFund()
                .send({ from:accounts[1], gasPrice:gasPrice,
                        gas:estimateGas+10000,
                        value:web3.utils.toWei('15', 'ether')});
        await flightSuretyApp.methods
                .airlineFund()
                .send({ from:accounts[2], gasPrice:gasPrice,
                        gas:estimateGas+10000,
                        value:web3.utils.toWei('15', 'ether')});
        await flightSuretyApp.methods
                .airlineFund()
                .send({ from:accounts[3], gasPrice:gasPrice,
                        gas:estimateGas+10000,
                        value:web3.utils.toWei('15', 'ether')});
        await flightSuretyApp.methods
                .airlineFund()
                .send({ from:accounts[4], gasPrice:gasPrice,
                        gas:estimateGas+10000,
                        value:web3.utils.toWei('15', 'ether')});
        
        /** Check if airline fund successfully (one sample) */
        contractBalance = await flightSuretyApp.methods
                                    .queryContractBalance()
                                    .call({from:accounts[0]});
        console.log(`Current Balance of FlightApp: ${web3.utils.fromWei(contractBalance.toString())}`);
        
        estimateGas = await flightSuretyApp.methods
                                .registerFlight('AX0101', 20191005)
                                .estimateGas({from:accounts[1]});

        /** Register 6 flights */
        console.log(`Estimated gas for registering flight: ${estimateGas}`);
        await flightSuretyApp.methods
                .registerFlight('AX0101', 20191005)
                .send({from:accounts[1], gasPrice:gasPrice,gas:estimateGas+10000});
        await flightSuretyApp.methods
                .registerFlight('AX0102', 20191005)
                .send({from:accounts[1], gasPrice:gasPrice,gas:estimateGas+10000});
        await flightSuretyApp.methods
                .registerFlight('AX0201', 20191005)
                .send({from:accounts[1], gasPrice:gasPrice,gas:estimateGas+10000});
        await flightSuretyApp.methods
                .registerFlight('BX0201', 20191005)
                .send({from:accounts[2], gasPrice:gasPrice,gas:estimateGas+10000});
        await flightSuretyApp.methods
                .registerFlight('BX0101', 20191005)
                .send({from:accounts[2], gasPrice:gasPrice,gas:estimateGas+10000});
        await flightSuretyApp.methods
                .registerFlight('CX001', 20191005)
                .send({from:accounts[3], gasPrice:gasPrice,gas:estimateGas+10000});
        
        flightKey = await flightSuretyData.methods
                            .generateFlightKey('AX0101', 20191005)
                            .call({from:accounts[0]})
        console.log(`Flight key of AX0101: ${flightKey}`);
        flightKey = await flightSuretyData.methods
                            .generateFlightKey('AX0102', 20191005)
                            .call({from:accounts[0]})
        console.log(`Flight key of AX0102: ${flightKey}`);
        flightKey = await flightSuretyData.methods
                            .generateFlightKey('AX0201', 20191005)
                            .call({from:accounts[0]})
        console.log(`Flight key of AX0201: ${flightKey}`);
        flightKey = await flightSuretyData.methods
                            .generateFlightKey('BX0201', 20191005)
                            .call({from:accounts[0]})
        console.log(`Flight key of BX0201: ${flightKey}`);
        flightKey = await flightSuretyData.methods
                            .generateFlightKey('BX0101', 20191005)
                            .call({from:accounts[0]})
        console.log(`Flight key of BX0101: ${flightKey}`);
        flightKey = await flightSuretyData.methods
                            .generateFlightKey('CX001', 20191005)
                            .call({from:accounts[0]})
        console.log(`Flight key of CX001: ${flightKey}`);
        const allFlightKeys = await flightSuretyData.methods
                                        .getAllFlightKeys()
                                        .call({from:accounts[0]});
        console.log(`Number of flights: ${allFlightKeys.length}`);
        
        estimateGas = await flightSuretyApp.methods
                                .registerOracle()
                                .estimateGas({from:accounts[11]});
        console.log(`Estimated gas for registering oracle: ${estimateGas}`);
        
        /** Register 30 oracles */
        for (let i=11; i<=40; i++){
            estimateGas = await flightSuretyApp.methods
                                    .registerOracle()
                                    .estimateGas({from:accounts[i]});

            await flightSuretyApp.methods
                    .registerOracle()
                    .send({ from:accounts[i],gasPrice:gasPrice,
                            gas:estimateGas*100, 
                            value:web3.utils.toWei('2')});
            oracleIndexes = await flightSuretyApp.methods
                                    .getMyIndexes()
                                    .call({from:accounts[i]});
            console.log(`Oracle-${i} ${accounts[i]}: ${oracleIndexes[0].toString()}, ${oracleIndexes[1].toString()}, ${oracleIndexes[2].toString()}`);
        }

        const allOracles = await flightSuretyApp.methods
                                    .getAllOracles()
                                    .call({from:accounts[0]});
        console.log(`Number of Oracles: ${allOracles.length}`);

        /** Let the default passenager to buy insurance */
        flightKey = await flightSuretyData.methods
                            .generateFlightKey('AX0101', 20191005)
                            .call({from:accounts[0]});
        estimateGas = await flightSuretyApp.methods
                                .passenagerBuyInsurance(flightKey,accounts[0])
                                .estimateGas({from:accounts[31], value:web3.utils.toWei('0.5', 'ether')});
        await flightSuretyApp.methods
                .passenagerBuyInsurance(flightKey,accounts[0])
                .send({
                        from:accounts[31], value:web3.utils.toWei('0.5', 'ether'),
                        gasPrice:gasPrice, gas:estimateGas+10000
                })
        console.log(`Passenager-${accounts[31]} buy insurance for flight-${flightKey}`);
    }catch(err){
        console.log(err.message);
    }
})();


/**
 * The web-socket server which simulates oracles responsing flight status once upon passenager fetching flight status.
 * There are 30 oracles who will randomly response 3 status: 1) ON TIME or 2) LATE (AIRLINE) or 3) LATE (OTHER REASONS).
 * Oracles are listening to OracleRequest event from FlightSuretyApp smart contract on URL: ws://localhost:8545.
 * Once OracleRequest event has arrived, oracle feedback response by submitOracleResponse() method
 */

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
                for(let i=0; i<oracles.length; i++){
                    randomStatusCode = randomItem([10,20,50]);
                    oracleIndexes = await flightSuretyApp.methods
                                            .getMyIndexes()
                                            .call({from:oracles[i]});
                    /* // unused code (for debugging)
                    console.log(`The status code sunmitted from oracles for ${event.returnValues.flight}-${parseInt(event.returnValues.flightTimestamp)}:${randomStatusCode}`);
                    console.log(`The fetch timestamp - ${parseInt(event.returnValues.fetchTimestamp)}`);
                    console.log(`Fetch Index:${parseInt(event.returnValues.index)} vs Oracle Indexes:${oracleIndexes}, for ${i+1}-th oracle `);
                    */
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