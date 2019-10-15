var owner;
var buyingFee;
var socket=io("http://localhost:8000");
/**
 * Functions that support Single-Page UI. There are 3 pages and 1 fixed navigator bar.
 * User could browse the page by clicking on item on navigator bar. 
 * Navigator bar has 1 drop-down menu and text area. 
 *  The text area displaying the passenager you are using.
 *  The Passenagers drop-down menu allows you to switch from different passenager
 * 
 * Flights Page: Showing all available flights and passenager's flights. It also provide flight status fetching function
 * Insurance Page: Showing all insurances of the passenager and provide button for withdrawing credits
 * Airline Page: Showing all registered airlines status and their fund
 * 
 * The default page is Flight page. Switching passenagr would also returning to the default page
 */


 /**
  * functions generating Flight page
  */

// function supporting switching color of status column according to flight status 
function flightStatusCodeToString(statusCode){
    switch(statusCode){
        case '0': return('<td><p class="text-primary">PENDING</p></td>');
        case '10':return('<td><p class="text-success">ONTIME</p></td>');
        case '20':return('<td><p class="text-danger">LATE(airline)</p></td>');
        default:return('<td class="bg-secondary text-white">Not In Use</td>');
    }
}

function buyInsurance(inputJSON_str){
    let inputJSON = JSON.parse(inputJSON_str);
    try{
        axios.post("/insurances/buy", {
            key:inputJSON.flightKey,
            airline:inputJSON.airline,
            sender:owner,
            fee:'1'
        })
        .then(console.log);
        
    } catch (err){
        console.log(`Error in buyInsurance function:${err.message}`);
    }
    $(`#buy-${inputJSON.flightKey}`)
        .removeClass("btn-outline-primary btn small")
        .addClass("btn btn-success btn small")
        .text("Bought");
}

function statusToBuyOption(flightKey, airline, statusCode, flightCode, flightTimestamp){
    if (statusCode==='0'){
        return(`
            <td><button class="btn btn-outline-primary btn small" id="buy-${flightKey}" value='{"flightKey":"${flightKey}", "airline":"${airline}"}' href=# onclick="buyInsurance(this.value)">
                Buy
            </button></td>
        `)
    } else {
        return(`
            <td class="bg-secondary text-white">Not In Use</td>
        `)
    }
}

function fetchStatus(inputJSON_str){
    let inputJSON = JSON.parse(inputJSON_str);
    try{
        axios.post("http://localhost:8000/flights/fetch",{
            sender:owner,
            airline:inputJSON.airline,
            flightCode:inputJSON.flightCode,
            flightTimestamp:parseInt(inputJSON.flightTimestamp),
            fetchTimestamp:Math.floor(Date.now())
        })
        .then(console.log);
    }catch(err){
        console.log(`Error on fetchStatus function:${err.message}`);
    }
}

function statusToFetchOption(flightKey, airline, statusCode, flightCode, flightTimestamp){
    if (statusCode==='0'){
        return(`
            <td><button class="btn btn-outline-success btn small" id="fetch-${flightKey}" href=# onclick="fetchStatus(this.value)"
                        value='{"flightKey":"${flightKey}", "airline":"${airline}", "statusCode":"${statusCode}", "flightCode":"${flightCode}", "flightTimestamp":"${flightTimestamp}"}'>
                Fetch Status
            </button></td>
        `)
    } else {
        return(`
            <td class="bg-secondary text-white">Not In Use</td>
        `)
    }
}

function fillFlightsTableRow(flight, ajax_obj, action_func){
    //$("#all-flights-card-table > tbody").append(`
    ajax_obj.append(`
        <tr class='all-flights-table-row' id='${flight.flightKey}'>
            <td value=${flight.code}>${flight.code}</td>
            <td value=${flight.timestamp}>${flight.timestamp}</td>
            <td value=${flight.airline}>${flight.airline}</td>
            ${flightStatusCodeToString(flight.status)}
            ${action_func(flight.flightKey, flight.airline, flight.status, flight.code, flight.timestamp)}
        </tr>
    `)
}

function generateFlightsTable(flightsArray, tableName, action_func){
    flightsArray.forEach(flight=>fillFlightsTableRow(flight, $(`#${tableName} > tbody`), action_func));
}

function generateFlightsPage(owner){
    $(".navbar-text").text(owner);
    $('#html-main').empty();

    $('#html-main').append(`
        <div class="card" id="all-flights-card">
            <div class="card-header text-left">
                <h5>All Flights</h5>
            </div>
        </div>
        <br>
        <div class="card" id="my-flights-card">
            <div class="card-header text-left">
                <h5>My Flights</h5>
            </div>
        </div>
        <br>
        <div class="card">
            <div class="card-header text-left">
                <h5>Messages from FlightSurety</h5>
            </div>
            <div class="card-body text-left">
                <p id="card-message"></p>
            </div>
        </div>
    `);

    $('#all-flights-card').append(`
        <div class="card-body">
            <table class="table table-border" id="all-flights-card-table">
                <thead>
                    <tr>
                        <th>Flight Code</th>
                        <th>Flight Timestamp</th>
                        <th>Airline Address</th>
                        <th>Flight Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `);

    $('#my-flights-card').append(`
        <div class="card-body">
            <table class="table table-border" id="my-flights-card-table">
                <thead>
                    <tr>
                        <th>Flight Code</th>
                        <th>Flight Timestamp</th>
                        <th>Airline Address</th>
                        <th>Flight Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `);

    axios.get(`http://localhost:8000/flights/all/${owner}`)
        .then(res=>generateFlightsTable(res.data, "all-flights-card-table", statusToBuyOption))
        .catch(err=>console.log(`Error in fetching all flights: ${err.message}`));
    
    axios.get(`http://localhost:8000/flights/passenager/${owner}`)
        .then(res=>generateFlightsTable(res.data, "my-flights-card-table", statusToFetchOption))
        .catch(err=>console.log(`Error in fetching my flights: ${err.message}`));
}

function insuranceStatusToString(statusCode){
    //console.log(`Insurance Status Code: ${statusCode}`);
    switch(statusCode){
        case '1':return('<td class="bg-secondary text-white">Expired</td>');
        case '2':return('<td class="bg-warning text-white">Credited</td>');
        case '3':return('<td class="bg-success text-white">Withdrawn</td>');
        default:return('<td class="bg-primary text-white">Pending</td>');
    }
}

function fillInsurancesTableRow(insurance, ajax_obj){
    ajax_obj.append(`
        <tr>
            <td>${insurance.insuranceKey}</td>
            <td>${insurance.flightKey}</td>
            <td>${insurance.fee}</td>
            <td>${insurance.credits}</td>
            ${insuranceStatusToString(insurance.status)}
        </tr>
    `)
}

function generateInsurancesTable(insurancesArray, tableName){
    insurancesArray.forEach(insurance=>fillInsurancesTableRow(insurance, $(`#${tableName} > tbody`)));
}

function fillCredits(credit){
    $('#card-credits-text').html(`${credit} <b>ether</b>`);
}

function generateInsurancesPage(owner){
    $('#html-main').empty();

    $('#html-main').append(`
        <div class="row">
            <div class="col-sm-4">
                <div class="card text-center" id="my-credits">
                    <div class="card-body">
                        <h5 class="card-title">My Credits</h5>
                        <p class="card-text" id='card-credits-text'></p>
                        <a href="#" class="btn btn-primary">Withdraw my Credits</a>
                    </div>
                </div>
            </div>
            <div class="col-sm-8">
                <div class="card">
                    <div class="card-header text-left">
                        <h5>Messages from FlightSurety</h5>
                    </div>
                    <div class="card-body text-left scroll">
                        <p id="card-message"></p>
                    </div>
                </div>
            </div>
        <div>
        <br>
        <div class="row">
            <div class="col-sm-12 card" id="my-insurances">
                <div class="card-header text-left">
                    <h5>All My Insurances</h5>
                </div>
                <div class="card-body">
                    <table class="table table-border" id="my-insurances-table">
                        <thead>
                            <tr>
                                <th>Insurance Key</th>
                                <th>Flight Key</th>
                                <th>Fee</th>
                                <th>Credits</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>
    `)

    axios.get(`http://localhost:8000/insurance/passenager/${owner}`)
    .then(res=>{
        //console.log(res.data);
        generateInsurancesTable(res.data, "my-insurances-table");
    })
    .catch(err=>console.log(`Error in fetching all flights: ${err.message}`));

    axios.get(`http://localhost:8000/insurance/credits/fetch/${owner}`)
    .then(res=>{
        //console.log(`The credits is ${res.data}`);
        //$('#card-credits-text').html(`${res.data} <b>ether</b>`);
        fillCredits(res.data);
    })
    .catch(err=>{
        console.log(`Error in fetching passenager's credits: ${err.message}`);
        $('#card-credits-text').html(`0 <b>ether</b>`);
    });
}

function appendSocketMessage(msg){
    $("#card-message").append(`${msg.event}<br>`);
}

$(document).ready(()=>{
    console.log(`Document is ready`);

    axios.get("http://localhost:8000/passenagers")
        .then(res=>{
            owner = res.data[0];
            $(".navbar-text").text(res.data[0]);
            console.log(`Owner: ${owner}`);
            res.data.forEach(element => {
                $('#passenagers-dropdown').append(`<a class="dropdown-item" href=# value="${element}" onclick="generateFlightsPage(owner)">${element}</a>`)
            });
            generateFlightsPage(owner);
        })
        .catch(err=>console.log(err.message));

    socket.on('event emit', (msg)=>{
        console.log(msg);
        //console.log(msg.content);
        appendSocketMessage(msg);
    });
})
