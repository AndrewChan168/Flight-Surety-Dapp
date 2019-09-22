pragma solidity ^0.5.8;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract InsuranceData{
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

    enum InsuranceStatus{Activated, Expired, Credited, Withdrawn}
    mapping(bytes32=>Insurance) insurances;
    
    function generateInsuranceKey(address _owner, bytes32 _flightKey, uint256 _contractTimestamp) public pure returns(bytes32){
        return keccak256(abi.encodePacked(_owner, _flightKey, _contractTimestamp));    
    }
    
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

    function setInsuranceExpired(bytes32 _insuranceKey) internal requireActivated(_insuranceKey){
        insurances[_insuranceKey].status = InsuranceStatus.Expired;
    }

    function setInsuranceCredited(bytes32 _insuranceKey) public requireActivated(_insuranceKey){
        insurances[_insuranceKey].status = InsuranceStatus.Credited;
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

    function isAirline(bytes32 _insuranceKey, address _candidate) public view returns(bool){
        return insurances[_insuranceKey].airline == _candidate;
    }

    modifier requireAirline(bytes32 _insuranceKey, address _airline){
        require(isAirline(_insuranceKey, _airline), "Only airline of insurance could pay insurance");
        _;
    }

    function setInsuranceWithdrawn(bytes32 _insuranceKey) public requireCredited(_insuranceKey){
        insurances[_insuranceKey].status = InsuranceStatus.Withdrawn;
    }

    function buyInsurance(bytes32 _flightKey, address _airline, uint256 _contractTimestamp, address _buyer, uint256 _fee) public payable returns(bytes32 _insuranceKey){
        //uint256 _contractTimestamp = now;
        address payable _payableBuyer = address(uint160(_buyer));
        _insuranceKey = generateInsuranceKey(_buyer, _flightKey, _contractTimestamp);
        Insurance memory insurance;
        insurance.buyer = _payableBuyer;
        insurance.flightKey = _flightKey;
        insurance.airline = _airline;
        insurance.fee = _fee;
        insurance.credits = 0;
        insurance.contractTimestamp = _contractTimestamp;
        insurance.status = InsuranceStatus.Activated;
        insurance.isExist = true;

        insurances[_insuranceKey] = insurance;
    }

    function creditInsurance(bytes32 _insuranceKey) public {
        insurances[_insuranceKey].credits = onePointFive(insurances[_insuranceKey].fee);
        setInsuranceCredited(_insuranceKey);
    }

    function onePointFive(uint256 input) public pure returns(uint256 result){
        result = input + input/2;
    }

    function payInsurance(bytes32 _insuranceKey, address _airline) public payable requireAirline(_insuranceKey, _airline){
        uint256 payment = insurances[_insuranceKey].credits;
        insurances[_insuranceKey].credits = 0;
        address payable insuree = insurances[_insuranceKey].buyer;
        setInsuranceWithdrawn(_insuranceKey);
        insuree.transfer(payment);
    }

    function queryInsuranceInfo(bytes32 _insuranceKey) public view returns(address buyer, bytes32 flightKey, address airline, uint256 fee, uint256 credits, uint256 contractTimestamp, InsuranceStatus insuranceStatus) {
        buyer = insurances[_insuranceKey].buyer;
        flightKey = insurances[_insuranceKey].flightKey;
        airline = insurances[_insuranceKey].airline;
        fee = insurances[_insuranceKey].fee;
        credits = insurances[_insuranceKey].credits;
        contractTimestamp = insurances[_insuranceKey].contractTimestamp;
        //returnStatus = insurances[_insuranceKey].status;
        insuranceStatus = insurances[_insuranceKey].status;
    }
}