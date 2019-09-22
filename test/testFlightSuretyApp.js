var BigNumber = require('big-number');
var Test = require('../config/testConfig.js');

contract(`Test FlightSuretyApp`, async(accounts)=>{
    const owner = accounts[0];
    const airline = accounts[1];
    const secondAirline = accounts[2];
    const thirdAirline = accounts[3];
    const forthAirline = accounts[4];
    const fifthAirline = accounts[5];
    const sixthAirline = accounts[6];
    const sevethAirline = accounts[7];
    const passenagerA = accounts[8];
    const passenagerB = accounts[9];
    const airlineName = 'Udacity Airline';
    const flightcode = 'ND1309'; // Course number
    const timestamp = Math.floor(Date.now() / 1000);
    const contractTimestamp = Math.floor(Date.now() / 1000);
    const airlineCode = 'UND01';
    const fundFee = 10;
    const fundFeeWei = web3.utils.toWei(fundFee.toString());
    const feeValue = 1;
    const feeValueWei = web3.utils.toWei(feeValue.toString());
    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;

    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.addAuthorizedCaller(config.flightSuretyApp.address, {from:owner});
        await config.flightSuretyData.setAuthorizable(true, {from:owner});
    });


    describe("test operational status", async()=>{
        it(`(multiparty) has correct initial isOperational() value`, async ()=>{
            let status = await config.flightSuretyApp.isOperational.call();
            assert.equal(status, true, "Incorrect initial operating status value");
        });


        it(`has correct contract owner`, async()=>{
            let feedbackOwner = await config.flightSuretyApp.getOwner.call();
            assert.equal(feedbackOwner, config.owner, "flightSuretyApp's contract owner is incorrect")
        });


        it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
            let accessDenied = false;
            try 
            {
                await config.flightSuretyApp.setOperatingStatus(false, { from: airline });
            }
            catch(e) {
                accessDenied = true;
            }
            assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
        });
    });


    describe('Could set up flight correctly', async()=>{
        it(`Could register airline`, async()=>{
            await config.flightSuretyApp.registerAirline(airlineName, airlineCode, {from:airline});
            await config.flightSuretyApp.registerAirline("The Second Airline", "02", {from:secondAirline});
            await config.flightSuretyApp.registerAirline("The Third Airline", "03", {from:thirdAirline});
            await config.flightSuretyApp.registerAirline("The Forth Airline", "04", {from:forthAirline});
            await config.flightSuretyApp.registerAirline("The Fifth Airline", "05", {from:fifthAirline});

            const length = await config.flightSuretyData.queryRegisteredAirlinesCount.call();
            assert.equal(4, length, "Number of registered Airlines is incorrect");

            const fifthAirlineDetail = await config.flightSuretyData.queryAirline.call(fifthAirline);
            assert.equal(0, fifthAirlineDetail.status.toNumber(), "The fifth Airline is not in Entered status");
        });


        it(`Could vote airline`, async()=>{
            await config.flightSuretyApp.airlineVote(fifthAirline, {from:secondAirline});
            await config.flightSuretyApp.airlineVote(fifthAirline, {from:thirdAirline});
            await config.flightSuretyApp.airlineVote(fifthAirline, {from:forthAirline});

            const length = await config.flightSuretyData.queryRegisteredAirlinesCount.call();
            assert.equal(5, length, "Number of registered Airlines is incorrect");

            const fifthAirlineDetail = await config.flightSuretyData.queryAirline.call(fifthAirline);
            assert.equal(1, fifthAirlineDetail.status.toNumber(), "The fifth Airline is not in Registered status");
        });


        it(`Allows airline to fund`, async()=>{
            let allowedFund = true;
            try{
                await config.flightSuretyApp.airlineFund(fundFeeWei, {from:airline});
            } catch(err){
                allowedFund=false;
                console.log(err.message);
            }
            const airlineDetail = await config.flightSuretyData.queryAirline.call(airline);
            assert.equal(allowedFund, true, `Registered Airline could not fund`);
            assert.equal(airlineDetail.status.toNumber(), 2, `Status of funded airline could not change to Funded`);
        });


        it(`Could add flight`, async()=>{
            try{
                await config.flightSuretyApp.registerFlight(flightcode, timestamp, {from:airline});
            } catch(err){
                console.log(err.message);
                assert.fail("Funded airline could not add flight");
            }
            let flightKey = await config.flightSuretyApp.generateFlightKey.call(flightcode, timestamp);
            const regiestedFlightDetail = await config.flightSuretyData.queryFlightInfo.call(flightKey, {from:airline});
            assert.equal(regiestedFlightDetail.code, flightcode, "Flight code is incorrect");
            assert.equal(regiestedFlightDetail.airline, airline, "Airline address is incorrect");
            assert.equal(regiestedFlightDetail.timestamp.toNumber(), timestamp, "Airline address is incorrect");
        });
    });

    describe(`let passenagers buy insurance`, async()=>{
        it(`could let passenager buy insurance for flight correctly`, async()=>{
            try{
                await config.flightSuretyApp.passenagerBuyInsurance(flightcode, airline, timestamp, contractTimestamp, {from:passenagerA, value:feeValueWei});
                await config.flightSuretyApp.passenagerBuyInsurance(flightcode, airline, timestamp, contractTimestamp, {from:passenagerB, value:feeValueWei});
            } catch(err){
                assert.fail("Passenager could not buy insurance");
            }
        });
    });


    describe(`Test Oracle Management tasks`, async()=>{
        it(`allows oracles to register`, async()=>{
            const registerFee = await config.flightSuretyApp.REGISTRATION_FEE.call();
            const registerFeeWei = parseInt(registerFee.toString());
            var oracleIndexes;
            for (let i=11; i<30; i++){
                try {
                    await config.flightSuretyApp.registerOracle({from:accounts[i], value:registerFeeWei});
                    oracleIndexes = await await config.flightSuretyApp.getMyIndexes({from:accounts[i]});
                    console.log(`Oracle-${i} ${accounts[i]}: ${oracleIndexes[0].toString()}, ${oracleIndexes[1].toString()}, ${oracleIndexes[2].toString()}`);
                } catch(err) {
                    //console.log("Error on registerOracle(): "+err.message);
                    assert.fail(`Error at ${i}-oracle: ${err.message}`);
                }
            }
        });


        it(`allows passenager to fetch flight status`, async()=>{
            try{
                await config.flightSuretyApp.fetchFlightStatus(airline, flightcode, timestamp, {from:passenagerA});
            }catch(err){
                assert.fail("Passenager could not fetch flight status");
            }

            const responses = await config.flightSuretyApp.getAllResponseKeys.call();
            assert.equal(responses.length, 1, "Length of responses array is incorrect")

            let oracleRequestEvents = await config.flightSuretyApp.getPastEvents('OracleRequest',{fromBlock: 0, toBlock: 'latest'});
            let fetchIndex = parseInt(oracleRequestEvents[0].returnValues.index);
            console.log(`Fetching index: ${fetchIndex}`);

            let fetchKey = await config.flightSuretyApp.getResponseKey.call(fetchIndex, airline, flightcode, timestamp);
            console.log(`Fetch key: ${fetchKey}`);

            let responseInfo = await config.flightSuretyApp.queryResponseInfo.call(fetchKey);
            //console.log(responseInfo);
            assert.equal(responseInfo.requester, passenagerA, "ResponseInfo requester is incorrect");
            assert.equal(responseInfo.isOpen, true, "ResponseInfo status is not opened");
            assert.equal(responseInfo.responsedOracles.length, 0, "The length of reponsed oracles array is incorrect");
        });


        it(`allow oracle submit responses`, async()=>{
            let oracleRequestEvent = await config.flightSuretyApp.getPastEvents('OracleRequest',{fromBlock: 0, toBlock: 'latest'});
            let fetchIndex = parseInt(oracleRequestEvent.pop().returnValues.index);
            console.log(`Fetch Index: ${fetchIndex}`);

            var oracleIndexes;
            var responseCount = 0;
            for(let i=11; i<30; i++){
                oracleIndexes = await config.flightSuretyApp.getMyIndexes({from:accounts[i]});
                for (let idx=0; idx<3; idx++){
                    try{
                        await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], airline, flightcode, timestamp, STATUS_CODE_ON_TIME, {from: accounts[i]});
                        console.log(`Oracle-${i} submit successfully`);
                        responseCount+=1;
                    }catch(err){
                        if (oracleIndexes[idx] == fetchIndex) {
                            assert.fail(`Cannot submitOracleResponse when oracle-index is same as fetch index at i=${i} with idx=${idx} where fetchIndex=${fetchIndex} and oracleIndex=${oracleIndexes[idx]}`);
                        }
                    }
                }
            }
            let oracleReportEvents = await config.flightSuretyApp.getPastEvents('OracleReport',{fromBlock: 0, toBlock: 'latest'});
            assert.equal(oracleReportEvents.length, responseCount, "Count of responses is not equal to number of events emitted");

            let fetchKey = await config.flightSuretyApp.getResponseKey.call(fetchIndex, airline, flightcode, timestamp);
            let responseInfo = await config.flightSuretyApp.queryResponseInfo.call(fetchKey);
            assert.equal(responseInfo.statusCode.toNumber(), 10, "Status code of responesInfo is incorrect");

            let flightStatusInfoEvents = await config.flightSuretyApp.getPastEvents('FlightStatusInfo',{fromBlock: 0, toBlock: 'latest'});
            const feedBackStatus = flightStatusInfoEvents.pop().args.status.toNumber();
            assert.equal(feedBackStatus, 10, "The status code in ResponseInfo is incorrect");
        });
    });


    describe(`Test Oracle Management could proceed credit correctly`, async()=>{
        it(`oracle management proceed on time insurances`, async()=>{
            let flightKey = await config.flightSuretyData.generateFlightKey.call(flightcode, timestamp);
            //console.log(`Flightkey: ${flightKey}`);
            let insuranceKey = await config.flightSuretyData.generateInsuranceKey.call(passenagerA,flightKey,contractTimestamp);
            //console.log(`InsuranceKey: ${insuranceKey}`);
            let insuranceResult = await config.flightSuretyData.queryInsuranceInfo.call(insuranceKey);
            //console.log(insuranceResult.insuranceStatus.toNumber());
            assert.equal(insuranceResult.insuranceStatus.toNumber(), 1, "Insurance status for ON-TIME is incorrect");
        });


        it(`oracle management proceed late insurances (not due to airline)`, async()=>{
            const lateFightCode = 'LATE01';
            await config.flightSuretyApp.registerFlight(lateFightCode, timestamp, {from:airline});
            let flightKey = await config.flightSuretyData.generateFlightKey.call(lateFightCode, timestamp);

            await config.flightSuretyApp.passenagerBuyInsurance(lateFightCode, airline, timestamp, contractTimestamp, {from:passenagerA, value:feeValueWei});
            let insuranceKey = await config.flightSuretyData.generateInsuranceKey.call(passenagerA,flightKey,contractTimestamp);

            await config.flightSuretyApp.fetchFlightStatus(airline, lateFightCode, timestamp, {from:passenagerA});
            let oracleRequestEvent = await config.flightSuretyApp.getPastEvents('OracleRequest',{fromBlock: 0, toBlock: 'latest'});
            let fetchIndex = parseInt(oracleRequestEvent.pop().returnValues.index);
            console.log(`Fetch Index: ${fetchIndex}`);

            let fetchKey = await config.flightSuretyApp.getResponseKey.call(fetchIndex, airline, lateFightCode, timestamp);
            console.log(`Fetch key: ${fetchKey}`);

            var oracleIndexes;
            for(let i=11; i<30; i++){
                oracleIndexes = await config.flightSuretyApp.getMyIndexes({from:accounts[i]});
                for (let idx=0; idx<3; idx++){
                    try{
                        await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], airline, lateFightCode, timestamp, STATUS_CODE_LATE_WEATHER, {from: accounts[i]});
                        //console.log(`Oracle-${i} submit successfully`);
                    }catch(err){
                        if (oracleIndexes[idx] == fetchIndex) {
                            assert.fail(`Cannot submitOracleResponse when oracle-index is same as fetch index at i=${i} with idx=${idx} where fetchIndex=${fetchIndex} and oracleIndex=${oracleIndexes[idx]}`);
                        }
                    }
                }
            }

            let insuranceResult = await config.flightSuretyData.queryInsuranceInfo.call(insuranceKey);
            assert.equal(insuranceResult.insuranceStatus.toNumber(), 1, "Insurance status for LATE (not due to airline) is incorrect");
            assert.equal(insuranceResult.credits.toString(), web3.utils.toWei('0'), "Incorrect credits for Passenager B");
        });


        it(`oracle management proceed late insurances (due to airline)`, async()=>{
            const lateFightCode = 'LATE02';
            await config.flightSuretyApp.registerFlight(lateFightCode, timestamp, {from:airline});
            let flightKey = await config.flightSuretyData.generateFlightKey.call(lateFightCode, timestamp);

            await config.flightSuretyApp.passenagerBuyInsurance(lateFightCode, airline, timestamp, contractTimestamp, {from:passenagerA, value:feeValueWei});
            let insuranceKeyA = await config.flightSuretyData.generateInsuranceKey.call(passenagerA,flightKey,contractTimestamp);

            await config.flightSuretyApp.passenagerBuyInsurance(lateFightCode, airline, timestamp, contractTimestamp, {from:passenagerB, value:feeValueWei});
            let insuranceKeyB = await config.flightSuretyData.generateInsuranceKey.call(passenagerB,flightKey,contractTimestamp);

            await config.flightSuretyApp.fetchFlightStatus(airline, lateFightCode, timestamp, {from:passenagerA});
            let oracleRequestEvent = await config.flightSuretyApp.getPastEvents('OracleRequest',{fromBlock: 0, toBlock: 'latest'});
            let fetchIndex = parseInt(oracleRequestEvent.pop().returnValues.index);
            console.log(`Fetch Index: ${fetchIndex}`);

            let fetchKey = await config.flightSuretyApp.getResponseKey.call(fetchIndex, airline, lateFightCode, timestamp);
            console.log(`Fetch key: ${fetchKey}`);

            var oracleIndexes;
            for(let i=11; i<30; i++){
                oracleIndexes = await config.flightSuretyApp.getMyIndexes({from:accounts[i]});
                for (let idx=0; idx<3; idx++){
                    try{
                        await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], airline, lateFightCode, timestamp, STATUS_CODE_LATE_AIRLINE, {from: accounts[i]});
                        //console.log(`Oracle-${i} submit successfully`);
                    }catch(err){
                        if (oracleIndexes[idx] == fetchIndex) {
                            assert.fail(`Cannot submitOracleResponse when oracle-index is same as fetch index at i=${i} with idx=${idx} where fetchIndex=${fetchIndex} and oracleIndex=${oracleIndexes[idx]}`);
                        }
                    }
                }
            }

            let insuranceResult = await config.flightSuretyData.queryInsuranceInfo.call(insuranceKeyA);
            assert.equal(insuranceResult.insuranceStatus.toNumber(), 2, "Insurance status for LATE (due to airline) is incorrect");
            assert.equal(insuranceResult.credits.toString(), web3.utils.toWei('1.5'), "Incorrect credits for Passenager B");
        });
    });


    describe(`Test airline could pay insuranees correctly`, async()=>{
        before('get flight key before', async()=>{
            const lateFightCode = 'LATE02';
            this.lateFlightKey = await config.flightSuretyData.generateFlightKey.call(lateFightCode, timestamp);
        })


        it('Block non-flight owner to pay all insuranees', async()=>{
            var couldPay = true;
            try{
                await config.flightSuretyApp.airlinePayInsurees(this.lateFlightKey, {from:secondAirline});
            }catch(err){
                //console.log(err.message);
                couldPay = false;
            }
            assert.equal(couldPay, false, "Not the owner of flight could pay insuranees");
        });


        it("allow flight owner to pay all insuranees", async()=>{
            const airlineBalanceBefore = await web3.eth.getBalance(airline);
            console.log(`Balance of airline: ${airlineBalanceBefore}`);
            const insurancesList = await config.flightSuretyData.getInsuranceKeysList(this.lateFlightKey);
            let insuranceResult = await config.flightSuretyData.queryInsuranceInfo.call(insurancesList[0]);
            console.log(insuranceResult);
            await config.flightSuretyData.payInsurance(insurancesList[0], airline);
            /*try{
                await config.flightSuretyData.payInsurance(insurancesList[0], airline, {from:airline});
            } catch(err){
                console.log(err);
            }*/
            /*couldPay = true;
            try{
                await config.flightSuretyApp.airlinePayInsurees(this.lateFlightKey, {from:airline});
            }catch(err){
                console.log(err);
                couldPay = false;
            }
            assert.equal(couldPay, true, "Owner of flight could not pay insuranees");*/
        })
    });
});