var BigNumber = require('big-number');
var Test = require('../config/testConfig.js');

contract(`Test FlightSuretyApp`, async(accounts)=>{
    var config;
    const owner = accounts[0];
    const firstAirline = accounts[1];
    const secondAirline = accounts[2];
    const thirdAirline = accounts[3];
    const forthAirline = accounts[4];
    const fifthAirline = accounts[5];
    const sixthAirline = accounts[6];
    const passenagerA = accounts[7];
    const passenagerB = accounts[8];
    const passenagerC = accounts[9];
    const fundFee = 11;
    const fundFeeWei = web3.utils.toWei(fundFee.toString());
    const insuranceFee = 2;
    const insuranceFeeWei = web3.utils.toWei(insuranceFee.toString());
    const registerFee = 2;
    const registerFeeWei = web3.utils.toWei(registerFee.toString());
    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;
    flightTimestamp = Math.floor((Date.now()) / 1000);
    console.log(`Flight Timestamp:${flightTimestamp}`);
    contractTimeStamp = Math.floor((Date.now()+1000) / 1000);
    console.log(`Constract Timestamp:${contractTimeStamp}`);

    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.addAuthorizedCaller(config.flightSuretyApp.address, {from:owner});
        await config.flightSuretyData.setAuthorizable(true, {from:owner});
    });


    describe("test operational status", function(){
        it(`(multiparty) has correct initial isOperational() value`, async ()=>{
            let dataStatus = await config.flightSuretyData.isOperational.call();
            assert.equal(dataStatus, true, "Incorrect FlightSuretyData initial operating status value");

            let appStatus = await config.flightSuretyData.isOperational.call();
            assert.equal(appStatus, true, "Incorrect FlightSuretyApp initial operating status value");
        });


        it(`has correct contract owner`, async()=>{
            let feedbackDataOwner = await config.flightSuretyData.getOwner.call();
            assert.equal(feedbackDataOwner, config.owner, "FlightSuretyData's contract owner is incorrect")

            let feedbackAppOwner = await config.flightSuretyApp.getOwner.call();
            assert.equal(feedbackAppOwner, config.owner, "FlightSuretyApp's contract owner is incorrect")
        });


        it(`(multiparty) could add authorized caller`, async ()=>{
            try{
                await config.flightSuretyData.addAuthorizedCaller(config.flightSuretyApp.address, {from:owner});
            } catch(err){
                assert.fail("Cannot add authorized caller");
            }

            const isAuthorized = await config.flightSuretyData.isAuthorizedCaller.call(config.flightSuretyApp.address);
            assert.equal(isAuthorized, true, "Fail to add authorized caller");

            const anotherIsAuthorized = await config.flightSuretyData.isAuthorizedCaller.call(passenagerB);
            assert.equal(anotherIsAuthorized, false, "Not authorized caller showed as authorized caller");
        });


        it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async()=>{
            let accessDataDenied = false;
            try{
                await config.flightSuretyData.setOperatingStatus(false, { from: firstAirline });
            } catch(err){
                accessDataDenied = true;
            }
            assert.equal(accessDataDenied, true, "Access to FlightSuretyData is not restricted to Contract Owner");

            let accessAppDenied = false;
            try{
                await config.flightSuretyApp.setOperatingStatus(false, { from: firstAirline});
            } catch(err){
                accessAppDenied = true;
            }
            assert.equal(accessAppDenied, true, "Access to FlightSuretyApp is not restricted to Contract Owner");
        });
    });


    describe('test AirlineData', function(){
        it(`could register four airlines without voting`, async()=>{
            await config.flightSuretyApp.registerAirline('Airline-01', {from:firstAirline});
            await config.flightSuretyApp.registerAirline('Airline-02', {from:secondAirline});
            await config.flightSuretyApp.registerAirline('Airline-03', {from:thirdAirline});
            await config.flightSuretyApp.registerAirline('Airline-04', {from:forthAirline});
            var length = await config.flightSuretyData.queryRegisteredAirlinesCount.call();
            assert.equal(4, length, `Number of registered airlines is not correct`);
            
            const firstAirlineStatus = await config.flightSuretyData.queryAirline.call(firstAirline);
            assert.equal(firstAirlineStatus.status.toNumber(), 1, "Status of the forth airline is incorrect");

            await config.flightSuretyApp.registerAirline('Airline-05', {from:fifthAirline});
            length = await config.flightSuretyData.queryRegisteredAirlinesCount.call();
            assert.equal(4, length, `The fifth enter airline was registered without voting`);

            const fifthAirlineStatus = await config.flightSuretyData.queryAirline.call(fifthAirline);
            assert.equal(fifthAirlineStatus.status.toNumber(), 0, "Status of the fifth airline is incorrect");
        });


        it(`Could vote airline`, async()=>{
            await config.flightSuretyApp.airlineVote(fifthAirline, {from:firstAirline});
            const fifthAirlineStatus = await config.flightSuretyData.queryAirline.call(fifthAirline);
            assert.equal(fifthAirlineStatus.votesCount.toNumber(), 1, "Number of votes is not correct");
        });


        it(`Only be registered unless more than half of regiestered airline voted`, async()=>{
            var fifthAirlineStatus;
            await config.flightSuretyApp.airlineVote(fifthAirline, {from:secondAirline});
            fifthAirlineStatus = await config.flightSuretyData.queryAirline.call(fifthAirline);
            assert.equal(fifthAirlineStatus.status.toNumber(), 0, "Airline is not in entered status after two votes")

            await config.flightSuretyApp.airlineVote(fifthAirline, {from:thirdAirline});
            fifthAirlineStatus = await config.flightSuretyData.queryAirline.call(fifthAirline);
            assert.equal(fifthAirlineStatus.status.toNumber(), 1, "Airline is not in registered status after three votes")

            const length = await config.flightSuretyData.queryRegisteredAirlinesCount.call();
            assert.equal(5, length, `The number of registered airlines is incorrect`);
        });


        it(`could allow regsistered to fund and block funding from unregistered`, async()=>{
            try{
                await config.flightSuretyApp.airlineFund({from:firstAirline, value:fundFeeWei});
            } catch(err){
                console.log(err.message);
                assert.fail("First airline could not fund");
            }
            const firstAirlineStatus = await config.flightSuretyData.queryAirline.call(firstAirline);
            assert.equal(firstAirlineStatus.status.toNumber(), 2, "Status of first airline is incorrect");

            await config.flightSuretyApp.registerAirline('Airline-06', {from:sixthAirline});
            var sixthCouldFund = true;
            try{
                await config.flightSuretyApp.airlineFund({from:sixthAirline, value:fundFeeWei});
            } catch(err){
                sixthCouldFund = false;
            }
            assert.equal(sixthCouldFund, false, "Not yet registered airline could fund");

            const contractBalanceWei = await config.flightSuretyApp.queryContractBalance.call();
            const contractBalanceEther = web3.utils.fromWei(contractBalanceWei.toString());
            assert.equal(parseInt(contractBalanceEther)>=10, true,"Balance of FlightSuretyApp is not more than ten ether");
            console.log(`Balance of FlightSuretyApp(Wei): ${contractBalanceWei.toString()}`);
        });
    });


    describe("Test FlightData", function(){
        it(`only allows funded airline to add flight and could block duplicated flights`, async()=>{
            try{
                await config.flightSuretyApp.registerFlight("AX01", flightTimestamp, {from:firstAirline});
            }catch(err){
                console.log(err.message);
                assert.fail("Funded airline could not register flight");
            }
            const flightKey01 = await config.flightSuretyData.generateFlightKey("AX01", flightTimestamp);
            const flightInfo01 = await config.flightSuretyData.queryFlightInfo.call(flightKey01);
            assert.equal(flightInfo01.status.toNumber(), 0, "The status of flight AX01 is incorrect");

            var couldRegFlight = true;
            try{
                await config.flightSuretyApp.registerFlight("AX02", flightTimestamp, {from:secondAirline});
            } catch(err){
                couldRegFlight = false;
            }
            assert.equal(couldRegFlight, false, "Unfunded airline could register flight");

            couldRegFlight = true;
            try{
                await config.flightSuretyApp.registerFlight("AX01", flightTimestamp, {from:firstAirline});
            }catch(err){
                couldRegFlight = false;
            }
            assert.equal(couldRegFlight, false, "Could not block duplicated flights");
        });

        it(`could set flight state correctly`, async()=>{
            const flightKey01 = await config.flightSuretyData.generateFlightKey("AX01", flightTimestamp);
            // late flight due to airline
            await config.flightSuretyApp.registerFlight("AX02", flightTimestamp, {from:firstAirline});
            const flightKey02 = await config.flightSuretyData.generateFlightKey("AX02", flightTimestamp);
            // late flight due to other reason
            await config.flightSuretyApp.registerFlight("AX03", flightTimestamp, {from:firstAirline});
            const flightKey03 = await config.flightSuretyData.generateFlightKey("AX03", flightTimestamp);

            try{
                await config.flightSuretyApp.setFlightOnTime(flightKey01);
            } catch(err){
                console.log(err.message);
                assert.fail("Could not set flight on time");
            }
            const flightInfo01 = await config.flightSuretyData.queryFlightInfo.call(flightKey01);
            assert.equal(flightInfo01.status.toNumber(), 1, "The status of flight AX01 is incorrect");


            try{
                await config.flightSuretyApp.setFlightLateAirline(flightKey02);
            } catch(err){
                console.log(err.message);
                assert.fail("Could not set flight late due to airline");
            }
            const flightInfo02 = await config.flightSuretyData.queryFlightInfo.call(flightKey02);
            assert.equal(flightInfo02.status.toNumber(), 2, "The status of flight AX02 is incorrect");

            try{
                await config.flightSuretyApp.setFlightLateNotAirline(flightKey03);
            } catch(err){
                console.log(err.message);
                assert.fail("Could not set flight late due to other reason");
            }
            const flightInfo03 = await config.flightSuretyData.queryFlightInfo.call(flightKey03);
            assert.equal(flightInfo03.status.toNumber(), 3, "The status of flight AX03 is incorrect");
        });
    });


    describe("Test InsuranceData", function(){
        before('set up for insuranceData tasks', async()=>{
            await config.flightSuretyApp.registerFlight("LATE01", flightTimestamp, {from:firstAirline});
            await config.flightSuretyApp.registerFlight("LATE00", flightTimestamp, {from:firstAirline});
            //await config.flightSuretyApp.registerFlight("LATE02", flightTimestamp, {from:firstAirline});
            //await config.flightSuretyApp.registerFlight("LATE03", flightTimestamp, {from:firstAirline});
        });

        it(`could let passenager buy insurance for flight correctly`, async()=>{
            const flightKeyLate01 = await config.flightSuretyData.generateFlightKey("LATE01", flightTimestamp);
            try{
                await config.flightSuretyApp
                    .passenagerBuyInsurance(flightKeyLate01, contractTimeStamp, firstAirline,
                        {from:passenagerA, value:insuranceFeeWei});
                await config.flightSuretyApp
                    .passenagerBuyInsurance(flightKeyLate01, contractTimeStamp, firstAirline,
                        {from:passenagerB, value:insuranceFeeWei});
            } catch(err){
                console.log(err.message);
                assert.fail("Passenager could not buy insurance for flight LATE01");
            }

            const insurancesNum = await config.flightSuretyData.getNumberOfInsurance.call(flightKeyLate01);
            console.log(`Number of Insurances: ${insurancesNum}`);

            const insuranceKeyPassAlate01 = await config.flightSuretyData
                .generateInsuranceKey.call(passenagerA, flightKeyLate01, contractTimeStamp);
            const insuranceKeyPassBlate01 = await config.flightSuretyData
                .generateInsuranceKey.call(passenagerB, flightKeyLate01, contractTimeStamp);

            assert.equal(await config.flightSuretyData.isExist.call(insuranceKeyPassAlate01), true, "Insurance from passenager A on flight LATE01 doesn't exist");
            assert.equal(await config.flightSuretyData.isExist.call(insuranceKeyPassBlate01), true, "Insurance from passenager B on flight LATE01 doesn't exist");

            const insuranceInfoPassAlate01 = await config.flightSuretyData.queryInsuranceInfo.call(insuranceKeyPassAlate01);
            const insuranceInfoPassBlate01 = await config.flightSuretyData.queryInsuranceInfo.call(insuranceKeyPassBlate01);

            assert.equal(insuranceInfoPassAlate01.insuranceStatus.toNumber(), 0, "Status of insurance from passenager A on flight LATE01 is incorrect");
            assert.equal(insuranceInfoPassBlate01.insuranceStatus.toNumber(), 0, "Status of insurance from passenager B on flight LATE01 is incorrect");

            assert.equal(insuranceInfoPassAlate01.fee.toString(), insuranceFeeWei.toString(), "Fee of insurance from passenager A on flight LATE01 is incorrect");
            assert.equal(parseInt(insuranceInfoPassAlate01.credits.toString()), 0, "Credits of insurance from passenager A on flight LATE01 is incorrect");
        });

        it(`could credit to passenagers of late flight correctly`, async()=>{
            const flightKeyLate01 = await config.flightSuretyData.generateFlightKey("LATE01", flightTimestamp);

            const insuranceKeyPassAlate01 = await config.flightSuretyData
                .generateInsuranceKey.call(passenagerA, flightKeyLate01, contractTimeStamp);
            const insuranceKeyPassBlate01 = await config.flightSuretyData
                .generateInsuranceKey.call(passenagerB, flightKeyLate01, contractTimeStamp);

            await config.flightSuretyApp.setFlightLateAirline(flightKeyLate01);

            /*
            await config.flightSuretyApp.creditInsurance(insuranceKeyPassAlate01);
            await config.flightSuretyApp.creditInsurance(insuranceKeyPassBlate01);
            */
           await config.flightSuretyApp.creditAllInsurances(flightKeyLate01);

            const insuranceInfoPassAlate01 = await config.flightSuretyData.queryInsuranceInfo.call(insuranceKeyPassAlate01);
            const insuranceInfoPassBlate01 = await config.flightSuretyData.queryInsuranceInfo.call(insuranceKeyPassBlate01);

            assert.equal(insuranceInfoPassAlate01.credits.toString(), web3.utils.toWei('3'), "Credits of insurance from passenager A on flight LATE01 is incorrect");
            assert.equal(insuranceInfoPassBlate01.credits.toString(), web3.utils.toWei('3'), "Credits of insurance from passenager A on flight LATE01 is incorrect");
        });

        it(`could block passenager buy insurance after flight was declated as late`, async()=>{
            const flightKeyLate00 = await config.flightSuretyData.generateFlightKey("LATE00", flightTimestamp);
            await config.flightSuretyApp.setFlightLateAirline(flightKeyLate00);

            let flightStatus00 = await config.flightSuretyData.queryFlightInfo.call(flightKeyLate00);
            console.log(`Status of flight-00: ${flightStatus00.status.toNumber()}`);

            var couldBlock = false;
            try{
                await config.flightSuretyApp
                    .passenagerBuyInsurance(flightKeyLate00, contractTimeStamp, firstAirline,
                        {from:passenagerA, value:insuranceFeeWei});
            }catch(err){
                //console.log(err.message);
                couldBlock = true;
            }

            assert.equal(couldBlock, true, "Could not block passenager buying after flight was declated as late")
        });
    });

    describe(`Test Oracle Management tasks`, function(){
        before(`Set up for oracle tasks`, async()=>{
            await config.flightSuretyApp.registerFlight("AX00", flightTimestamp, {from:firstAirline});

            await config.flightSuretyApp.registerFlight("LATE02", flightTimestamp, {from:firstAirline});
            await config.flightSuretyApp.registerFlight("LATE03", flightTimestamp, {from:firstAirline});

            const flightKeyLate02 = await config.flightSuretyData.generateFlightKey("LATE02", flightTimestamp);
            await config.flightSuretyApp
                .passenagerBuyInsurance(flightKeyLate02, contractTimeStamp, firstAirline, 
                    {from:passenagerA, value:insuranceFeeWei});
            await config.flightSuretyApp
                .passenagerBuyInsurance(flightKeyLate02, contractTimeStamp, firstAirline, 
                    {from:passenagerB, value:insuranceFeeWei});


            const flightKeyLate03 = await config.flightSuretyData.generateFlightKey("LATE03", flightTimestamp);
            await config.flightSuretyApp
                .passenagerBuyInsurance(flightKeyLate03, contractTimeStamp, firstAirline, 
                    {from:passenagerA, value:insuranceFeeWei});
            await config.flightSuretyApp
                .passenagerBuyInsurance(flightKeyLate03, contractTimeStamp, firstAirline, 
                    {from:passenagerB, value:insuranceFeeWei});
        });

        it(`allows oracles to register`, async()=>{
            var oracleIndexes;
            for (let i=11; i<30; i++){
                try{
                    await config.flightSuretyApp.registerOracle({from:accounts[i], value:registerFeeWei});
                    oracleIndexes = await await config.flightSuretyApp.getMyIndexes({from:accounts[i]});
                    console.log(`Oracle-${i} ${accounts[i]}: ${oracleIndexes[0].toString()}, ${oracleIndexes[1].toString()}, ${oracleIndexes[2].toString()}`);
                } catch(err){
                    assert.fail(`Error at ${i}-oracle: ${err.message}`);
                }
            }
        });

        it(`allows passenager to fetch flight status`, async()=>{
            try{
                await config.flightSuretyApp.fetchFlightStatus(firstAirline, "AX00", flightTimestamp, {from:passenagerA});
            }catch(err){
                console.log(err.message);
                assert.fail("Passenager could not fetch flight status");
            }
            let oracleRequestEvents = await config.flightSuretyApp.getPastEvents('OracleRequest',{fromBlock: 0, toBlock: 'latest'});
            let fetchIndex = parseInt(oracleRequestEvents.slice(-1)[0].returnValues.index);
            console.log(`Fetching index: ${fetchIndex}`);
            //console.log("events list:");
            //console.log(oracleRequestEvents.slice(-1)[0].returnValues);

            const responses = await config.flightSuretyApp.getAllResponseKeys.call();
            assert.equal(responses.length, 1, "Length of responses array is incorrect");

            let fetchKey = await config.flightSuretyApp.generateResponseKey.call(fetchIndex, firstAirline, "AX00", flightTimestamp);
            let responseInfo = await config.flightSuretyApp.queryResponseInfo.call(fetchKey);
            assert.equal(responseInfo.statusCode.toNumber(), 0, "Status code of responesInfo is incorrect");
            assert.equal(responseInfo.isOpen, true, "ResponseInfo status is not opened");
            assert.equal(responseInfo.responsedOracles.length, 0, "The length of reponsed oracles array is incorrect");            
        });

        it(`allow oracle submit responses and could proceed flight on time correctly`, async()=>{
            let oracleRequestEvents = await config.flightSuretyApp.getPastEvents('OracleRequest',{fromBlock: 0, toBlock: 'latest'});
            let fetchIndex = parseInt(oracleRequestEvents.slice(-1)[0].returnValues.index);
            console.log(`Fetching index: ${fetchIndex}`);
            //console.log("events list:");
            //console.log(oracleRequestEvents.slice(-1)[0].returnValues);
            
            var oracleIndexes;
            var responseCount = 0;
            for(let i=11; i<30; i++){
                oracleIndexes = await config.flightSuretyApp.getMyIndexes({from:accounts[i]});
                for (let idx=0; idx<3; idx++){
                    try{
                        await config.flightSuretyApp
                            .submitOracleResponse(oracleIndexes[idx], firstAirline, "AX00", flightTimestamp, STATUS_CODE_ON_TIME, {from: accounts[i]});
                        responseCount+=1;
                    }catch(err){
                        if (oracleIndexes[idx] == fetchIndex) {
                            console.log(err.message);
                            assert.fail(`Cannot submitOracleResponse when oracle-index is same as fetch index at i=${i} with idx=${idx} where fetchIndex=${fetchIndex} and oracleIndex=${oracleIndexes[idx]}`);
                        }
                    }
                }
            }
            
            let oracleReportEvents = await config.flightSuretyApp.getPastEvents('OracleReport',{fromBlock: 0, toBlock: 'latest'});
            assert.equal(oracleReportEvents.length, responseCount, "Count of responses is not equal to number of events emitted");
            
            let fetchKey = await config.flightSuretyApp.generateResponseKey.call(fetchIndex, firstAirline, "AX00", flightTimestamp);
            let responseInfo = await config.flightSuretyApp.queryResponseInfo.call(fetchKey);
            assert.equal(responseInfo.statusCode.toNumber(), 10, "Status code of responesInfo is incorrect");

            let flightStatusInfoEvents = await config.flightSuretyApp.getPastEvents('FlightStatusInfo',{fromBlock: 0, toBlock: 'latest'});
            const feedBackStatus = parseInt(flightStatusInfoEvents.slice(-1)[0].returnValues.status);
            assert.equal(feedBackStatus, 10, "The status code in ResponseInfo is incorrect");
        });

        it(`Oracles could proceed flight late due to airline and proceed credits correctly`, async()=>{
            await config.flightSuretyApp.fetchFlightStatus(firstAirline, "LATE02", flightTimestamp, {from:passenagerA});

            let oracleRequestEvents = await config.flightSuretyApp.getPastEvents('OracleRequest',{fromBlock: 0, toBlock: 'latest'});
            let fetchIndex = parseInt(oracleRequestEvents.slice(-1)[0].returnValues.index);
            console.log(`Fetching index: ${fetchIndex}`);
            //console.log("events list:");
            //console.log(oracleRequestEvents.slice(-1)[0].returnValues);
            
            const lateFlightKey02 = await config.flightSuretyData.generateFlightKey.call("LATE02", flightTimestamp);

            var oracleIndexes;
            var responseCount = 0;
            for(let i=11; i<30; i++){
                oracleIndexes = await config.flightSuretyApp.getMyIndexes({from:accounts[i]});
                for (let idx=0; idx<3; idx++){
                    try{
                        await config.flightSuretyApp
                                    .submitOracleResponse(oracleIndexes[idx], firstAirline, "LATE02", 
                                                            flightTimestamp, STATUS_CODE_LATE_AIRLINE, 
                                                            {from: accounts[i]});
                        responseCount+=1;
                    }catch(err){
                        if (oracleIndexes[idx] == fetchIndex) {
                            console.log(err.message);
                            assert.fail(`Cannot submitOracleResponse-${responseCount} when oracle-index is same as fetch index at i=${i} with idx=${idx} where fetchIndex=${fetchIndex} and oracleIndex=${oracleIndexes[idx]}`);
                        }
                    }
                }
            }
            
            let fetchKey = await config.flightSuretyApp.generateResponseKey.call(fetchIndex, firstAirline, "LATE02", flightTimestamp);
            let responseInfo = await config.flightSuretyApp.queryResponseInfo.call(fetchKey);

            assert.equal(responseInfo.statusCode.toNumber(), 20, "Status code of responesInfo is incorrect");

            const insuranceKeyPassAlate02 = await config.flightSuretyData
                .generateInsuranceKey.call(passenagerA, lateFlightKey02, contractTimeStamp);

            const insuranceInfoPassAlate02 = await config.flightSuretyData.queryInsuranceInfo.call(insuranceKeyPassAlate02);
            assert.equal(insuranceInfoPassAlate02.credits.toString(), web3.utils.toWei('3'), "Credits of insurance from passenager A on flight LATE01 is incorrect");

            const passenagerATotalCredits = await config.flightSuretyData.queryBuyerCredit.call(passenagerA);
            assert.equal(passenagerATotalCredits.toString(), web3.utils.toWei('6'), "Total credits of passenager A is incorrect");
        });


        it(`Oracles could proceed flight late due to other reason and block to credit`, async()=>{
            await config.flightSuretyApp.fetchFlightStatus(firstAirline, "LATE03", flightTimestamp, {from:passenagerA});

            let oracleRequestEvents = await config.flightSuretyApp.getPastEvents('OracleRequest',{fromBlock: 0, toBlock: 'latest'});
            let fetchIndex = parseInt(oracleRequestEvents.slice(-1)[0].returnValues.index);
            console.log(`Fetching index: ${fetchIndex}`);

            const lateFlightKey03 = await config.flightSuretyData.generateFlightKey.call("LATE03", flightTimestamp);

            var oracleIndexes;
            var responseCount = 0;
            for(let i=11; i<30; i++){
                oracleIndexes = await config.flightSuretyApp.getMyIndexes({from:accounts[i]});
                for (let idx=0; idx<3; idx++){
                    try{
                        await config.flightSuretyApp
                                    .submitOracleResponse(oracleIndexes[idx], firstAirline, "LATE03", 
                                                            flightTimestamp, STATUS_CODE_LATE_WEATHER, 
                                                            {from: accounts[i]});
                        responseCount+=1;
                    }catch(err){
                        if (oracleIndexes[idx] == fetchIndex) {
                            console.log(err.message);
                            assert.fail(`Cannot submitOracleResponse-${responseCount} when oracle-index is same as fetch index at i=${i} with idx=${idx} where fetchIndex=${fetchIndex} and oracleIndex=${oracleIndexes[idx]}`);
                        }
                    }
                }
            }
            let fetchKey = await config.flightSuretyApp.generateResponseKey.call(fetchIndex, firstAirline, "LATE03", flightTimestamp);
            let responseInfo = await config.flightSuretyApp.queryResponseInfo.call(fetchKey);
            assert.equal(responseInfo.statusCode.toNumber(), 30, "Status code of responesInfo is incorrect");

            const insuranceKeyPassAlate03 = await config.flightSuretyData
                .generateInsuranceKey.call(passenagerA, lateFlightKey03, contractTimeStamp);

            const insuranceInfoPassAlate03 = await config.flightSuretyData.queryInsuranceInfo.call(insuranceKeyPassAlate03);
            assert.equal(insuranceInfoPassAlate03.credits.toString(), web3.utils.toWei('0'), "Credits of insurance from passenager A on flight LATE01 is incorrect");

            const contractBalanceWei = await config.flightSuretyApp.queryContractBalance.call();
            //const contractBalanceEther = web3.utils.fromWei(contractBalanceWei.toString());
            console.log(`Balance of FlightSuretyApp(Wei): ${contractBalanceWei.toString()}`);
        });

        it(`let passenagers withdraw their credits`, async()=>{
            const balanceB4PassenagerAWei = await web3.eth.getBalance(passenagerA);
            //const balanceB4PassenagerBWei = await web3.eth.getBalance(passenagerB);
            const balanceB4PassenagerAEther = parseFloat(web3.utils.fromWei(balanceB4PassenagerAWei));
            //console.log(`Balance of passenager-A before withdraw (ether): ${web3.utils.fromWei(balanceB4PassenagerA)}`);
            //console.log(`Balance of passenager-B before withdraw (ether): ${web3.utils.fromWei(balanceB4PassenagerB)}`);

            await config.flightSuretyApp.passenagerWithdrawCredits({from:passenagerA});
            const balanceAfterPassenagerA = await web3.eth.getBalance(passenagerA);
            const balanceAfterPassenagerAEther = parseFloat(web3.utils.fromWei(balanceAfterPassenagerA));
            assert.equal(balanceAfterPassenagerAEther>balanceB4PassenagerAEther, true, "Balance of passenager-A didn't increase after withdrawn");
            //console.log(`Balance of passenager-A after withdraw (ether): ${web3.utils.fromWei(balanceAfterPassenagerA)}`);
        });
    });
});