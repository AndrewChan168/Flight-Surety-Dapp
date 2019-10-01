pragma solidity ^0.5.8;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";


contract AirlineData{
    using SafeMath for uint256;
    uint256 constant public MIN_FUND = 10 ether;

    struct Airline{
        string name;
        AirlineStatus status;
        address[] voters;
        uint256 fund;
        bool isExist;
    }
    enum AirlineStatus {Entered, Registered, Funded}

    address[] private airlinesList;
    mapping(address=>Airline) private airlines;

    address[] private registeredAirlinesList;
    //mapping(address=>Airline) private registeredAirlines;

    event AirlineEntered(string name, address airline);
    event AirlinePendingVote(string name, address airline);
    event AirlineVoted(address candidate, address voter, uint256 votes);
    event AirlineRegistered(string name, address airline);
    event AirlineFunded(string name, address airline, uint256 fund);

    /**
    Functions for checking condition of Airline & modifiers
     */
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

    function couldFund(address _testingAddress) public view returns(bool){
        return (isAirlineRegistered(_testingAddress))||(isAirlineFunded(_testingAddress));
    }

    modifier requireCouldFund(address _testingAddress){
        require(couldFund(_testingAddress), "Airline must either be in registered or funded status to fund");
        _;
    }

    function isAirlineHasEnoughFund(address _airline) public view returns(bool){
        return airlines[_airline].fund>MIN_FUND;
    }

    modifier requireAirlinesHasEnoughFund(address _airline){
        require(isAirlineHasEnoughFund(_airline), "Airline's fund is less than MINIUM fund requirement");
        _;
    }

    /*
    function isEnoughToPay(uint256 _funds, address _funder) public view returns(bool){
        return _funder.balance > _funds;
    }

    modifier requireEnoughToPay(uint256 _funds, address _funder){
        require(isEnoughToPay(_funds, _funder), "Balance is not enought to fund");
        _;
    }*/

    modifier requireMoreThanMin(uint256 _funds){
        require(_funds>MIN_FUND, "Cannot pay less than minium fund");
        _;
    }
    /**
    functions for handling airline register and vote
     */

    function addAirline(string memory _name, address _airline) public requireAirlineNotExist(_airline){
        Airline memory airline;
        airline.name = _name;
        airline.status = AirlineStatus.Entered;
        airline.fund = 0;
        airline.isExist = true;
        airlines[_airline] = airline;
        airlinesList.push(_airline);
        emit AirlineEntered(_name, _airline);
        if (isAirlineFulfill(_airline)) {
            addToRegisteredAirlines(_airline);
        } else {
            emit AirlinePendingVote(_name, _airline);
        }
    }

    function addFund(address _airline, uint256 _fund) public requireCouldFund(_airline) requireAirlineExist(_airline){
        if (!isAirlineFunded(_airline)){
            _setAirlineFunded(_airline);
        }
        airlines[_airline].fund += _fund;
    }

    function deductFund(address _airline, uint256 _fund) public requireCouldFund(_airline) requireAirlineExist(_airline){
        require(_fund<airlines[_airline].fund, "Airline's fund is not enough to pay now");
        airlines[_airline].fund -= _fund;
    }

    function isFewAirlines() public view returns (bool){
        return registeredAirlinesList.length<4;
    }
    
    function moreThanHalf(address _candidate) public view returns(bool){
        return airlines[_candidate].voters.length >= ((registeredAirlinesList.length/2)+1);
    }
        
    function checkVotes(address _candidate) public view returns (uint256) {
        return airlines[_candidate].voters.length;
    }

    function isAirlineFulfill(address _candidate) public view returns (bool){
        if (isFewAirlines()||moreThanHalf(_candidate)){
            return true;
        } else {
            return false;
        }
    }
    
    function vote(address _candidate, address voter) public requireAirlineRegistered(voter){
        require(isAirlineExist(_candidate), "Airline does not exist");
        require(isAirlineEntered(_candidate), "Airline must be in entered status");
        airlines[_candidate].voters.push(voter);
        if (isAirlineFulfill(_candidate)) addToRegisteredAirlines(_candidate);
        emit AirlineVoted(_candidate, voter, airlines[_candidate].voters.length);
    }
    /**
    functions for setting airline status
     */

    function _setAirlineRegistered(address _candidate) internal requireAirlineEntered(_candidate) {
        airlines[_candidate].status = AirlineStatus.Registered;
        string memory _name = airlines[_candidate].name;
        emit AirlineRegistered(_name, _candidate);
    }

    function _setAirlineFunded(address _candidate) internal requireAirlineRegistered(_candidate) {
        airlines[_candidate].status = AirlineStatus.Funded;
        string memory _name = airlines[_candidate].name;
        uint256 _fund = airlines[_candidate].fund;
        emit AirlineFunded(_name, _candidate, _fund);
    }

    function addToRegisteredAirlines(address _candidate) public {
        require(isAirlineEntered(_candidate), "Candidate must be in entered status");
        //registeredAirlines[_candidate] = airlines[_candidate];
        registeredAirlinesList.push(_candidate);
        _setAirlineRegistered(_candidate);
    }

    /**
    functions for query airline data
     */
    function queryFund(address _airline)public view requireAirlineFunded(_airline) returns(uint256){
        return airlines[_airline].fund;
    }

    function queryAirline(address _airline) public view returns(string memory name, AirlineStatus status, uint256 votesCount, uint256 funds){
            name = airlines[_airline].name;
            status = airlines[_airline].status;
            votesCount = airlines[_airline].voters.length;
            funds = airlines[_airline].fund;
        }

    function queryRegisteredAirlinesCount() public view returns(uint256){
        return registeredAirlinesList.length;
    }

    function queryAirlinesCount() public view returns(uint256){
        return airlinesList.length;
    }
}