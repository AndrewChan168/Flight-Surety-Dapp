var BigNumber = require('big-number');
var Test = require('../config/testConfig.js');

contract(`Test FlightSuretyData`, async(accounts)=>{
    var config;
    const owner = accounts[0];
    const firstAirline = accounts[1];
    const secondAirline = accounts[2];
    const thirdAirline = accounts[3];
    const forthAirline = accounts[4];
    const fifthAirline = accounts[5];
    const sixthAirline = accounts[6];
    const sevethAirline = accounts[7];
    const passenagerA = accounts[8];
    const passenagerB = accounts[9];

    before('setup contract', async () => {
        config = await Test.Config(accounts);
    });


    describe("test operational status", function(){
        it(`(multiparty) has correct initial isOperational() value`, async ()=>{
            let status = await config.flightSuretyData.isOperational.call();
            assert.equal(status, true, "Incorrect initial operating status value");
        });


        it(`has correct contract owner`, async()=>{
            let feedbackOwner = await config.flightSuretyData.getOwner.call();
            assert.equal(feedbackOwner, config.owner, "FlightSuretyData's contract owner is incorrect")
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


        it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
            let accessDenied = false;
            try 
            {
                await config.flightSuretyData.setOperatingStatus(false, { from: firstAirline });
            }
            catch(e) {
                accessDenied = true;
            }
            assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
          });
    });


    describe('test AirlineData', function(){
        it(`could register four airlines without voting`, async()=>{
            await config.flightSuretyData.registerAirline("The First Airline", "01", firstAirline, {from:firstAirline});
            await config.flightSuretyData.registerAirline("The Second Airline", "02", secondAirline, {from:secondAirline});
            await config.flightSuretyData.registerAirline("The Third Airline", "03", thirdAirline, {from:thirdAirline});
            await config.flightSuretyData.registerAirline("The Forth Airline", "04", forthAirline, {from:forthAirline});

            const length = await config.flightSuretyData.queryRegisteredAirlinesCount.call();
            assert.equal(4, length, "Number of registered Airlines is incorrect");

            const firstAirlineDetail = await config.flightSuretyData.queryAirline.call(firstAirline);
            assert.equal(1, firstAirlineDetail.status, "The first Airline is not in Registered status");

            const secondAirlineDetail = await config.flightSuretyData.queryAirline.call(secondAirline);
            assert.equal(1, secondAirlineDetail.status, "The second Airline is not in Registered status");

            const thirdAirlineDetail = await config.flightSuretyData.queryAirline.call(thirdAirline);
            assert.equal(1, thirdAirlineDetail.status, "The third Airline is not in Registered status");

            const forthAirlineDetail = await config.flightSuretyData.queryAirline.call(forthAirline);
            assert.equal(1, forthAirlineDetail.status, "The forth Airline is not in Registered status");
        });


        it(`could not register airline after the forth airline unless voting`, async()=>{
            await config.flightSuretyData.registerAirline("The Fifth Airline", "05", fifthAirline, {from:fifthAirline});

            const length = await config.flightSuretyData.queryRegisteredAirlinesCount.call();
            assert.equal(4, length, "Number of registered Airlines is incorrect");

            const fifthAirlineDetail = await config.flightSuretyData.queryAirline.call(fifthAirline);
            assert.equal(0, fifthAirlineDetail.status.toNumber(), "The fifth Airline is not in Entered status");
        });


        it(`could regsister airline after more than half of airlines voted`, async()=>{
            await config.flightSuretyData.vote(fifthAirline, firstAirline, {from:firstAirline});
            await config.flightSuretyData.vote(fifthAirline, secondAirline, {from:secondAirline});
            await config.flightSuretyData.vote(fifthAirline, thirdAirline, {from:thirdAirline});

            const fifthAirlineDetail = await config.flightSuretyData.queryAirline.call(fifthAirline);
            assert.equal(1, fifthAirlineDetail.status.toNumber(), "The fifth Airline is not in Registered status");
    
            const length = await config.flightSuretyData.queryRegisteredAirlinesCount.call();
            assert.equal(5, length.toNumber(), "Number of registered Airlines is incorrect");
        });


        it(`could allow regsistered to fund and block funding from unregistered`, async()=>{
            await config.flightSuretyData.registerAirline("The sixth Airline", "06", sixthAirline, {from:sixthAirline});
            let fifthAllowedFund = true;
            const fundFee = 10;
            const fundFeeWei = web3.utils.toWei(fundFee.toString());
            try{
                await config.flightSuretyData.fund(fundFeeWei, fifthAirline, {from:fifthAirline});
            } catch(err){
                fifthAllowedFund=false;
                console.log(err.message);
            }
            const fifthAirlineDetail = await config.flightSuretyData.queryAirline.call(fifthAirline);
            assert.equal(fifthAllowedFund, true, `Registered Airline could not fund`);
            assert.equal(fifthAirlineDetail.status.toNumber(), 2, `Status of funded airline could not change to Funded`);

            let sixthAllowedFund = true;
            try{
                await config.flightSuretyData.fund(fundFeeWei, sixthAirline, {from:sixthAirline});
            } catch(error) {
                sixthAllowedFund=false;
            }
            const sixthAirlineDetail = await config.flightSuretyData.queryAirline.call(sixthAirline);
            assert.equal(sixthAllowedFund, false, `Not registered Airline could fund`);
            assert.equal(sixthAirlineDetail.status.toNumber(), 0, `Status of unfunded airline remained as entered`);
        });
    });


    describe('test FlightData', function(){
        it(`only allows funded airline to add flight`, async()=>{
            let fifthAllowed = true;
            try{
                await config.flightSuretyData.registerFlight("AX01", 201808272200, fifthAirline, {from:fifthAirline});
                const flightKey05 = await config.flightSuretyData.generateFlightKey.call("AX01", 201808272200);
                const regiestedFlightDetail05 = await config.flightSuretyData.queryFlightInfo.call(flightKey05, {from:fifthAirline});
                assert.equal(regiestedFlightDetail05.code, "AX01", "Flight code is incorrect");
                assert.equal(regiestedFlightDetail05.airline, fifthAirline, "Airline address is incorrect");
                assert.equal(regiestedFlightDetail05.timestamp.toNumber(), 201808272200, "Airline address is incorrect");
            }catch(err){
                fifthAllowed = false;
                console.log(err.message);
            }
            assert.equal(fifthAllowed, true, `Funded airline could not register flight`);

            let firstAllowed = true;
            try{
                await config.flightSuretyData.registerFlight("AX00", 201808272200, firstAirline, {from:firstAirline});
            } catch(err){
                firstAllowed = false;
            }
            assert.equal(firstAllowed, false, `Not Funded airline could register flight`);
        });


        it(`could block duplicated flights`, async()=>{
            let fifthAllowed = true;
            try{
                await config.flightSuretyData.registerFlight("AX01", 201808272200, fifthAirline, {from:fifthAirline});
            } catch(err){
                fifthAllowed = false;
            }
            assert.equal(fifthAllowed, false, `Duplicated flight could be registered`);
        });


        it(`could set flight state correctly`, async()=>{
            const expectedFlight02Status = 1;
            const flightKey2 = await config.flightSuretyData.generateFlightKey.call("AX02", 201808272200);
            await config.flightSuretyData.registerFlight("AX02", 201808272200, fifthAirline, {from:fifthAirline});
            await config.flightSuretyData.setFlightOnTime(flightKey2);
            const regiestedFlight02Detail = await config.flightSuretyData.queryFlightInfo.call(flightKey2);
            assert.equal(regiestedFlight02Detail.status.toNumber(), expectedFlight02Status, "Flight status could not be changed to OnTime");

            const expectedFlight03Status = 2;
            await config.flightSuretyData.registerFlight("AX03", 201808272200, fifthAirline, {from:fifthAirline});
            const flightKey3 = await config.flightSuretyData.generateFlightKey.call("AX03", 201808272200);
            await config.flightSuretyData.setFlightLateAirline(flightKey3);
            const regiestedFlight03Detail = await config.flightSuretyData.queryFlightInfo.call(flightKey3);
            assert.equal(regiestedFlight03Detail.status.toNumber(), expectedFlight03Status, "Flight status could not be changed to Late Airline");

            const expectedFlight04Status = 3;
            await config.flightSuretyData.registerFlight("AX04", 201808272200, fifthAirline, {from:fifthAirline});
            const flightKey4 = await config.flightSuretyData.generateFlightKey.call("AX04", 201808272200);
            await config.flightSuretyData.setFlightLateNotAirline(flightKey4);
            const regiestedFlight04Detail = await config.flightSuretyData.queryFlightInfo.call(flightKey4);
            assert.equal(regiestedFlight04Detail.status.toNumber(), expectedFlight04Status, "Flight status could not be changed to Late Not Airline");
        });
    });


    describe('test InsuranceData', function(){
        before(async () => {
            this.flightCode = "EX00";
            this.fligtTimestamp = 201808272200;
            this.buyTimestamp = 201808250900;
            this.feeValue = 1;
            await config.flightSuretyData.registerFlight(this.flightCode, this.fligtTimestamp, fifthAirline, {from:fifthAirline});
        });


        it(`could let passenager buy insurance for flight correctly`, async()=>{
            const feeValueWei = web3.utils.toWei(this.feeValue.toString())
            const flightKey = await config.flightSuretyData.generateFlightKey.call(this.flightCode, this.fligtTimestamp);
            await config.flightSuretyData.buy(this.flightCode,fifthAirline,this.fligtTimestamp,this.buyTimestamp,passenagerA,feeValueWei,{from:passenagerA,value:feeValueWei});
            let insuranceKey = await config.flightSuretyData.generateInsuranceKey.call(passenagerA,flightKey,this.buyTimestamp);
            let insuranceResult = await config.flightSuretyData.queryInsuranceInfo.call(insuranceKey);
            assert.equal(web3.utils.fromWei(insuranceResult.credits), 0, "Insurance credit is not equal to zero");
            assert.equal(insuranceResult.flightKey, flightKey, "Flightkey in insurance contract is incorrect");
            assert.equal(insuranceResult.airline, fifthAirline, "Airline in insurance contract is incorrect");
            assert.equal(web3.utils.fromWei(insuranceResult.fee), this.feeValue, "Fee in insurance contract is incorrect");
            assert.equal(insuranceResult.contractTimestamp.toNumber(), this.buyTimestamp, "Contract time in insurance contract is incorrect");

            let canBuy = true;
            try{
              await config.flightSuretyData.buy('XX00',fifthAirline,this.fligtTimestamp,this.buyTimestamp+10,passenagerA,feeValueWei,{from:passenagerA,value:feeValueWei});
            } catch(err){
              canBuy = false;
            }
            assert.equal(canBuy, false, `Can buy insurance for not existing flight`);

            await config.flightSuretyData.buy(this.flightCode,fifthAirline,this.fligtTimestamp,this.buyTimestamp,passenagerB,feeValueWei,{from:passenagerB,value:feeValueWei});
            const insuranceNum = await config.flightSuretyData.getNumberOfInsurance.call(flightKey);
            assert.equal(insuranceNum.toNumber(), 2, "Incorrect number of insurance in flight");
        });


        it(`could credit to all passenagers of late flight due to airline`, async()=>{
            const flightKey = await config.flightSuretyData.generateFlightKey.call(this.flightCode, this.fligtTimestamp);
            await config.flightSuretyData.setFlightLateAirline(flightKey);
            await config.flightSuretyData.creditInsurees(flightKey);

            const insuranceKeyA = await config.flightSuretyData.generateInsuranceKey.call(passenagerA, flightKey, this.buyTimestamp);
            const insuranceResultA = await config.flightSuretyData.queryInsuranceInfo.call(insuranceKeyA);
            assert.equal(insuranceResultA.credits.toString(), web3.utils.toWei('1.5'), "Incorrect credits for Passenager A");

            const insuranceKeyB = await config.flightSuretyData.generateInsuranceKey.call(passenagerB, flightKey, this.buyTimestamp);
            const insuranceResultB = await config.flightSuretyData.queryInsuranceInfo.call(insuranceKeyB);
            
            
            
        });


        it(`allows customer withdraw their credit Insurance`, async()=>{
            const passenagerABalanceBefore = await web3.eth.getBalance(passenagerA);
            const airlineBalanceBefore = await web3.eth.getBalance(fifthAirline);

            const flightKey = await config.flightSuretyData.generateFlightKey.call(this.flightCode, this.fligtTimestamp);
            const insuranceKeyA = await config.flightSuretyData.generateInsuranceKey.call(passenagerA, flightKey, this.buyTimestamp);
            await config.flightSuretyData.payInsurance(insuranceKeyA, fifthAirline, {from:fifthAirline});

            const passenagerABalanceAfter = await web3.eth.getBalance(passenagerA);
            const airlineBalanceAfter = await web3.eth.getBalance(fifthAirline);
            assert.equal(passenagerABalanceAfter>passenagerABalanceBefore,true, `Passenage's balance didn't increase after withdrawn`);
            assert.equal(airlineBalanceAfter<airlineBalanceBefore,true, `Airline's balance didn't decrease after withdrawn`);
        });
    });


    describe('test authorizable part', function(){
        it('only allow contract owner to set authorized state', async()=>{
            let canOther = true;
            try{
                await config.flightSuretyData.setAuthorizable(true, {from:passenagerB});
            }catch(err){
                canOther = false;
            }
            assert.equal(canOther, false, "Not owner could set authorized state");

            let canOwner = true;
            try{
                await config.flightSuretyData.setAuthorizable(true, {from:owner});
            }catch(err){
                canOwner = false;
            }
            assert.equal(canOwner, true, "Owner could not set authorized state");

            const isAuthorizable = await config.flightSuretyData.isAuthorizable.call();
            assert.equal(isAuthorizable, true, "Authorized state cannot be set correctly");
        });


        it("Test can block register airline not from authorized caller", async()=>{
            let blocked = false;
            try{
                await config.flightSuretyData.registerAirline("The Seventh Airline", "07", sevethAirline, {from:sevethAirline});
            } catch(err){
                blocked = true;
            }
            assert.equal(blocked, true, "Cannot block from non-authorized caller register airline");

            blocked = false;
            try{
                await config.flightSuretyData.vote(fifthAirline, forthAirline, {from:forthAirline});
            } catch(err){
                blocked = true;
            }
            assert.equal(blocked, true, "Cannot block from non-authorized caller vote airline");
        });
    });
})

