const Config = require("../../src/config.json");
const FlightSuretyApp = require("../../build/contracts/FlightSuretyApp.json");
const FlightSuretyData = require("../../build/contracts/FlightSuretyData.json");
const Web3 = require("web3");

let web3 = new Web3(Config.url);
/** when contracts have been deployed */
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, Config.dataAddress);
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, Config.appAddress);

(async ()=>{
    try{
        const gasPrice = web3.utils.toWei('0.00001', 'ether');
        var estimateGas;
        var contractBalance;
        const accounts = await web3.eth.getAccounts();
        var flightKey;
        var oracleIndexes;
        var accountBalance;
        
        await flightSuretyData.methods
                .addAuthorizedCaller(flightSuretyApp.options.address)
                .send({from:accounts[0]});
        const isAuthor = await flightSuretyData.methods
                            .isAuthorizedCaller(flightSuretyApp.options.address)
                            .call({from:accounts[0]})
        console.log(`Is FlightSuretyApp author of FlightSuretyData: ${isAuthor}`);
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
        
        contractBalance = await flightSuretyApp.methods
                                    .queryContractBalance()
                                    .call({from:accounts[0]});
        console.log(`Current Balance of FlightApp: ${web3.utils.fromWei(contractBalance.toString())}`);
        
        estimateGas = await flightSuretyApp.methods
                                .registerFlight('AX0101', 20191005)
                                .estimateGas({from:accounts[1]});
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
    }catch(err){
        console.log(err.message);
    }
})();