pragma solidity ^0.5.8;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract InsuranceData{
    using SafeMath for uint256;
    uint256 constant MAX_FEE = 1 ether;
    
    struct Insurance{
        address payable buyer;
        bytes32 flightKey;
        address airline;
        uint256 fee;
        uint256 credits;
        uint256 contractTimestamp;
        InsuranceStatus status;
        bool isExist;
    }

    struct Buyer{
        uint256 credits;
        bool isExist;
    }

    enum InsuranceStatus{Activated, Expired, Credited, Withdrawn}
    mapping(bytes32=>Insurance) insurances;
    mapping(address=>Buyer) buyers;

    event BuyInsurance(bytes32 flightKey, bytes32 insuranceKey, address buyer, uint256 fee);
    event CreditInsurance(bytes32 flightKey, bytes32 insuranceKey, address buyer, uint256 credits);
    
    // the key for extracting insurance
    function generateInsuranceKey(address _buyer, bytes32 _flightKey, uint256 _contractTimestamp) public pure returns(bytes32){
        return keccak256(abi.encodePacked(_buyer, _flightKey, _contractTimestamp));    
    }

    /**
    Functions for conditions checking and modifiers
     */
    
    function isExist(bytes32 _insuranceKey) public view returns(bool){
        return insurances[_insuranceKey].isExist;
    }
    
    function isActivated(bytes32 _insuranceKey) public view returns(bool){
        return insurances[_insuranceKey].status == InsuranceStatus.Activated;
    }

    modifier requireActivated(bytes32 _insuranceKey){
        require(isActivated(_insuranceKey), "Insurance must be in Activated status");
        _;
    }

    function isCredited(bytes32 _insuranceKey) public view returns(bool){
        return insurances[_insuranceKey].status == InsuranceStatus.Credited;
    }

    modifier requireCredited(bytes32 _insuranceKey){
        require(isCredited(_insuranceKey), "Insurance must be in Credited status");
        _;
    }

    function isBuyer(bytes32 _insuranceKey, address _candidate) public view returns(bool){
        return insurances[_insuranceKey].buyer == _candidate;
    }

    modifier requireBuyer(bytes32 _insuranceKey, address buyer){
        require(isBuyer(_insuranceKey, buyer), "Only buyer of insurance could withdraw credit");
        _;
    }
/*
    function isAirline(bytes32 _insuranceKey, address _candidate) public view returns(bool){
        return insurances[_insuranceKey].airline == _candidate;
    }

    modifier requireAirline(bytes32 _insuranceKey, address _airline){
        require(isAirline(_insuranceKey, _airline), "Only airline of insurance could pay insurance");
        _;
    }
*/
    function isBuyerExist(address _buyer) public view returns(bool){
        return buyers[_buyer].isExist;
    }

    modifier requireBuyerExist(address _buyer) {
        require(isBuyerExist(_buyer), "Buyer doesn't exist");
        _;
    }

    function isLessThanMax(uint256 fee) public pure returns(bool){
        return fee<=MAX_FEE;
    }

    modifier requireLessThanMax(uint256 fee){
        require(isLessThanMax(fee), "Insurance Fee must be less than 1 ether");
        _;
    }

    /**
    function for adding and crediting insurance
     */
    function addInsurance(address _buyer, bytes32 _flightKey, uint256 _contractTimestamp, address _airline, uint256 _fee) requireLessThanMax(_fee) 
    public{
        bytes32 insuranceKey = generateInsuranceKey(_buyer, _flightKey, _contractTimestamp);
        Insurance memory insurance;
        insurance.buyer = address(uint160(_buyer));
        insurance.flightKey = _flightKey;
        insurance.airline = _airline;
        insurance.fee = _fee;
        insurance.credits = 0;
        insurance.contractTimestamp = _contractTimestamp;
        insurance.status = InsuranceStatus.Activated;
        insurance.isExist = true;

        insurances[insuranceKey] = insurance;

        if(!isBuyerExist(_buyer)){
            buyers[_buyer] = Buyer({credits:0, isExist:true});
        }
        emit BuyInsurance(_flightKey, insuranceKey, _buyer, _fee);
    }

    function creditInsurance(bytes32 _insuranceKey) public requireActivated(_insuranceKey) returns(uint256 credits){
        uint256 fee = insurances[_insuranceKey].fee;
        address buyer = insurances[_insuranceKey].buyer;
        uint256 half = fee.div(2);
        credits = fee.add(half);
        insurances[_insuranceKey].credits = credits;
        buyers[buyer].credits += credits;
        setInsuranceCredited(_insuranceKey);
        //emit CreditInsurance(insurances[_insuranceKey].flightKey,_insuranceKey,buyer,credits);
    }

    function deductCredits(address _buyer) public requireBuyerExist(_buyer){
        buyers[_buyer].credits = 0;
    }

    /** 
    functions for setting insurance state
    */

    function setInsuranceExpired(bytes32 _insuranceKey) public requireActivated(_insuranceKey){
        insurances[_insuranceKey].status = InsuranceStatus.Expired;
    }

    function setInsuranceCredited(bytes32 _insuranceKey) public requireActivated(_insuranceKey){
        insurances[_insuranceKey].status = InsuranceStatus.Credited;
    }

    function setInsuranceWithdrawn(bytes32 _insuranceKey) public requireCredited(_insuranceKey){
        insurances[_insuranceKey].status = InsuranceStatus.Withdrawn;
    }

    /**
    functions for querying insurance info
     */
    function queryBuyerCredit(address _buyer) public view returns(uint256){
        return buyers[_buyer].credits;
    }
    
    function queryInsuranceInfo(bytes32 _insuranceKey) public view returns(address buyer, bytes32 flightKey, address airline, uint256 fee, uint256 credits, uint256 contractTimestamp, InsuranceStatus insuranceStatus) {
        buyer = insurances[_insuranceKey].buyer;
        flightKey = insurances[_insuranceKey].flightKey;
        airline = insurances[_insuranceKey].airline;
        fee = insurances[_insuranceKey].fee;
        credits = insurances[_insuranceKey].credits;
        contractTimestamp = insurances[_insuranceKey].contractTimestamp;
        insuranceStatus = insurances[_insuranceKey].status;
    }

    function queryInsuranceBuyer(bytes32 _insuranceKey) public view returns(address){
        require(isExist(_insuranceKey), "Insurance doesn't exist");
        return insurances[_insuranceKey].buyer;
    }
}