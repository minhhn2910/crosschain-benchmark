const Web3 = require('web3');
//const web3 = new Web3("http://localhost:7545");
const web3 = new Web3("http://localhost:7777");
let fs = require("fs");

let source = fs.readFileSync("contracts.json");
let contracts = JSON.parse(source)["contracts"];
console.log(contracts);
// ABI description as JSON structure
let abi = JSON.parse(contracts['test.sol:Test'].abi);

// Smart contract EVM bytecode as hex
let code = '0x' + contracts['test.sol:Test'].bin;

// Create Contract proxy class
let SampleContract = new web3.eth.Contract(abi);

// Unlock the coinbase account to make transactions out of it
web3.eth.getAccounts().then(accounts =>{
	console.log("Deploying the contract");
	console.log(accounts[0]);
	console.log(code);
	let contract = SampleContract.deploy({data: code}).send({from: accounts[0], gas: 2000000}).on('receipt', function(receipt){
		console.log(receipt);
	});
});

