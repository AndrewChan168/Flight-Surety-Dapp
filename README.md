# Flight-Surety-Dapp
Flight-Surety Dapp is the 7-th Project for Udacity Nanadegree - Blockchain developer. It is a blockchain smart contract that allows for purchasing insurance on airline flights. Including a browser UI allowing for simple contact interaction.

## Install
***
There are smart contracts written in Solidity and could be tested with Truffle. The dapp works as server interacting with deployed smart contracts and supporting browser UI.

Before installation of node packages, please check that Truffle is installed in your machine.

To install the Dapp, input install command in root of Dapp:
```
npm install
```

## Compile & Test the smart contracts
***
To compile all smart contracts to JSON
```
truffle compile
```

To test all smart contracts
```
truffle test
```



## Deploy Contracts to local testing net
***

```
truffle develop
// inside truffle console
migrate --reset


2_deploy_contracts.js
=====================

   Replacing 'FlightSuretyData'
   ----------------------------
   > transaction hash:    0xe0f1c2395c74272081fd8ae8272bdd2251ce28d782c36ba76a064bd0af71dedb
   > Blocks: 0            Seconds: 0
   > contract address:    0x6221D95e8c12655419e1872CDA133B729A0c22B4
   > block number:        3
   > block timestamp:     1571077352
   > account:             0xe45cf0CD14dd5D5B4CF807813544Eee2987212F1
   > balance:             99.86877448
   > gas used:            6257860
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.1251572 ETH


   Replacing 'BuyerData'
   ---------------------
   > transaction hash:    0x7a2d257f6e54a5fa27bc2b7e1811401351323df2d47fbf0fc56a56d995a338f4
   > Blocks: 0            Seconds: 0
   > contract address:    0xF6BAD220a6C2964DA6166a954A1A38EFE35559D3
   > block number:        4
   > block timestamp:     1571077353
   > account:             0xe45cf0CD14dd5D5B4CF807813544Eee2987212F1
   > balance:             99.84549592
   > gas used:            1163928
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.02327856 ETH


   Replacing 'FlightSuretyApp'
   ---------------------------
   > transaction hash:    0xc0ec31642d8330b5d24f68c300784d6380d39acdda82181c66a5ca241d3823ad
   > Blocks: 0            Seconds: 0
   > contract address:    0x34792a7645172D37C895f41B5dF4c0D828FaFe16
   > block number:        5
   > block timestamp:     1571077354
   > account:             0xe45cf0CD14dd5D5B4CF807813544Eee2987212F1
   > balance:             99.76248408
   > gas used:            4150592
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.08301184 ETH


   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:           0.2314476 ETH
```

Then copy the contract addresses (FlightSuretyData & FlightSuretyApp & BuyerData) to `/src/config.json`. The json should be:
```
{
    "url": "http://localhost:8545",
    "ws":"ws://localhost:8545",
    "dataAddress": "<FlightSuretyData contract address>",
    "buyerDataAddress":"<BuyerData contract address>",
    "appAddress": "<FlightSuretyApp contract address>",
    "contractOwner":"0xe45cf0cd14dd5d5b4cf807813544eee2987212f1"
}
```
## Startup the Dapp
### Step-1: Start Oracle simulating server
***
All the code of oracle simulating server would be in `/src/server/server.js`. The Oracle simulating would automatically: 
1. Register 4 airlines (and all these 4 airlines would fund 15 ethers)
2. Add 6 flights
3. Buy insurance on flight AX0101 for 1 passenager (the default passenager in UI)
4. Register 30 oracles who will submit oracle responses for flight status

To start the oracle simulating server, turn on new terminal and go to directory `src/server`. Then,

```
node server.js
```

Command line would show up the status of setting up simulating data. If all succeed, you would find below on command line:
```
Listening to ws://localhost:8545 for OracleRequest event
```

### Step-2: start web service server
***
To set up web servers supporting UI, turn on terminal and use below command in the root of project,
```
node server.js
```

### Step-3: Browing the UI for buying insurance
In new browser, input `http://localhost:8000` .

## Some features of UI
***
The feature of JQuery interacting wiht websocket is not completed. Press `[F5]` button after you press `buy` and `fetched` button on UI. 
