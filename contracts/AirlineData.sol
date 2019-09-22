pragma solidity ^0.5.8;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";


contract AirlineData{
    uint256 constant public MIN_FUND = 10 ether;

    struct Airline{
        string name;
        string code;
        AirlineStatus status;
        uint8 votesCount;
        uint256 fund;
        bool isExist;
    }
    enum AirlineStatus {Entered, Registered, Funded}

    address[] private airlinesList;
    mapping(address=>Airline) private airlines;

    address[] private registeredAirlinesList;
    mapping(address=>Airline) private registeredAirlines;

    event AirlineEntered(string name, string code, address airline);
    event AirlineRegistered(string name, string code, address airline);
    event AirlineFunded(string name, string code, address airline, uint256 fund);
    
    function queryRegisteredAirlinesCount() public view returns(uint256){
        return registeredAirlinesList.length;
    }

    function queryAirlinesCount() public view returns(uint256){
        return airlinesList.length;
    }
    
    function isAirlineExist(address _testingAddress) public view returns(bool){
        return airlines[_testingAddress].isExist;
    }
    
    function isAirlineEntered(address _testingAddress) public view returns(bool){
        return airlines[_testingAddress].status == AirlineStatus.Entered;
    }
    modifier requireAirlineNotExist(address _testingAddress){
        require(!isAirlineExist(_testingAddress), "Address has registered as Airline before");
        _;
    }
    modifier requireAirlineExist(address _testingAddress){
        require(isAirlineExist(_testingAddress), "Address does not exist");
        _;
    }
    modifier requireAirlineEntered(address _testingAddress){
        require(isAirlineEntered(_testingAddress), "Airline must be in entered status");
        _;
    }
    function isAirlineRegistered(address _testingAddress) public view returns (bool){
        return airlines[_testingAddress].status == AirlineStatus.Registered;
    }
    modifier requireAirlineRegistered(address _testingAddress){
        require(isAirlineRegistered(_testingAddress), "Airline must be in registered status");
        _;
    }
    function isAirlineFunded(address _testingAddress) public view returns (bool){
        return airlines[_testingAddress].status == AirlineStatus.Funded;
    }
    modifier requireAirlineFunded(address _testingAddress){
        require(isAirlineFunded(_testingAddress), "Airline must be in funded status");
        _;
    }

    function isEnoughToPay(uint256 _funds, address _funder) public view returns(bool){
        return _funder.balance > _funds;
    }

    modifier requireEnoughToPay(uint256 _funds, address _funder){
        require(isEnoughToPay(_funds, _funder), "Balance is not enought to fund");
        _;
    }

    modifier requireMoreThanMin(uint256 _funds){
        require(_funds>MIN_FUND, "Cannot pay less than minium fund");
        _;
    }

    function addAirline(string memory _name, string memory _code, address _airline) public requireAirlineNotExist(_airline){
        Airline memory airline;
        airline.name = _name;
        airline.code = _code;
        airline.status = AirlineStatus.Entered;
        airline.votesCount = 0;
        airline.fund = 0;
        airline.isExist = true;
        airlines[_airline] = airline;
        airlinesList.push(_airline);
        emit AirlineEntered(_name, _code, _airline);
        if (isAirlineFulfill(_airline)) addToRegisteredAirlines(_airline);
    }

    function _setAirlineRegistered(address _candidate) private requireAirlineEntered(_candidate) {
        airlines[_candidate].status = AirlineStatus.Registered;
        string memory _name = airlines[_candidate].name;
        string memory _code = airlines[_candidate].code;
        emit AirlineRegistered(_name, _code, _candidate);
    }

    function _setAirlineFunded(address _candidate) private requireAirlineRegistered(_candidate) {
        airlines[_candidate].status = AirlineStatus.Funded;
        string memory _name = airlines[_candidate].name;
        string memory _code = airlines[_candidate].code;
        uint256 _fund = airlines[_candidate].fund;
        emit AirlineFunded(_name, _code, _candidate, _fund);
    }

    function vote(address _candidate, address voter) public requireAirlineRegistered(voter){
        require(isAirlineExist(_candidate), "Airline does not exist");
        require(isAirlineEntered(_candidate), "Airline must be in entered status");
        airlines[_candidate].votesCount += 1;
        if (isAirlineFulfill(_candidate)) addToRegisteredAirlines(_candidate);
    }

    function isFewAirlines() public view returns (bool){
        return registeredAirlinesList.length<4;
    }
    
    function moreThanHalf(address _candidate) public view returns(bool){
        return airlines[_candidate].votesCount >= ((registeredAirlinesList.length/2)+1);
    }
    
    function checkVotes(address _candidate) public view returns (uint8) {
        return airlines[_candidate].votesCount;
    }

    function isAirlineFulfill(address _candidate) public view returns (bool){
        if (isFewAirlines()||moreThanHalf(_candidate)){
            return true;
        } else {
            return false;
        }
    }
    
    function getNumberOfRegisteredAirlines() public view returns (uint) {
        return registeredAirlinesList.length;
    }

    function addToRegisteredAirlines(address _candidate) private {
        require(isAirlineEntered(_candidate), "Candidate must be in entered status");
        registeredAirlines[_candidate] = airlines[_candidate];
        registeredAirlinesList.push(_candidate);
        _setAirlineRegistered(_candidate);
    }

    function fund(uint256 _funds, address _funder) public payable requireEnoughToPay(_funds, _funder) requireAirlineExist(_funder) requireAirlineRegistered(_funder){
        airlines[_funder].fund = _funds;
        _setAirlineFunded(_funder);
    }
    
    function isEven(uint256 value) private pure returns(bool){
        return (value%2)==0;
    }

    function queryAirline(address _airline) public view 
        returns(string memory name, string memory code, AirlineStatus status, uint8 votesCount, uint256 funds){
            name = airlines[_airline].name;
            code = airlines[_airline].code;
            status = airlines[_airline].status;
            votesCount = airlines[_airline].votesCount;
            funds = airlines[_airline].fund;
        }
}