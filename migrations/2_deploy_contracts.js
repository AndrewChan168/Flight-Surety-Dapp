//const Operational = artifacts.require("Operational");
//const AirlineData = artifacts.require("AirlineData");
//const FlightData = artifacts.require("FlightData");
//const InsuranceData = artifacts.require("InsuranceData");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const BuyerData = artifacts.require("BuyerData");
//const OracleManagement = artifacts.require("OracleManagement");
const FlightSuretyApp = artifacts.require("FlightSuretyApp");
//const Authorizable = artifacts.require("Authorizable");

module.exports = function(deployer) {
  //deployer.deploy(Operational);
  //deployer.deploy(Authorizable);
  //deployer.deploy(AirlineData);
  //deployer.deploy(FlightData);
  //deployer.deploy(InsuranceData);
  //deployer.deploy(OracleManagement);
  //deployer.deploy(FlightSuretyApp);
  deployer.deploy(FlightSuretyData).then(()=>{
    //return deployer.deploy(FlightSuretyApp, FlightSuretyData.address)
    return deployer.deploy(BuyerData)
  }).then(()=>{
    return deployer.deploy(FlightSuretyApp, FlightSuretyData.address, BuyerData.address);
  })
};
