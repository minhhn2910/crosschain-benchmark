// Simplest trusted crosschain tx 
// A send B then B send A 2-step transaction
const { performance } = require('perf_hooks');
const Web3 = require('web3');

// const chain1_path = "http://localhost:7777";
// const chain2_path = "http://localhost:8888";
// https://github.com/ChainSafe/web3.js/issues/1846
// having problem using the same address asynchronously. Nonce management is a nightmare
// current solution: create an account pool & transfer eth to all of them;
var num_tx = 100;
const myArgs = process.argv.slice(2);
if (myArgs.length > 0)
	num_tx = parseInt(myArgs);


console.log("Running ", num_tx, " txs")

const num_acc= num_tx*2;

const use_ganache = false;
var net = require('net');
if (use_ganache){
	// the below doesnt work, ganache cli does not mine transaction based on time, blocktime does not have much meaning. 
	// const gas_limit_chain1 =  210000; //ganache problem, if gas just enough for N transaction we got round down to N-1 tx
	// const block_time_chain1 = 1;
	// const gas_limit_chain2 =  21000; //ganache problem, if gas just enough for N transaction we got round down to N-1 tx
	// const block_time_chain2 = 2;
	// const ganache = require("ganache");

	// const options_chain1 = {chain: {chainId: 123 }, 
	// 						miner: {blockTime: block_time_chain1, blockGasLimit: gas_limit_chain1 + 1 }, 
	// 						logging: {quiet:false},
	// 						wallet:  {totalAccounts: num_acc}
	// 					};
	// const options_chain2 = {chain: {chainId: 456 },
	// 						miner: {blockTime: block_time_chain2, blockGasLimit: gas_limit_chain2 + 1 }, 
	// 						logging: {quiet:true},
	// 						wallet:  {totalAccounts: num_acc}
	// 					};

	// var w3_1_provider = ganache.provider(options_chain1);
	// var w3_2_provider = ganache.provider(options_chain2);
	var w3_1_provider = "http://localhost:7777";
	var w3_2_provider = "http://localhost:8888";

} else{

	// var w3_1_provider = "http://localhost:7777";
	// var w3_2_provider = "http://localhost:8888";
	
	var w3_1_provider = new Web3.providers.IpcProvider('./test-chain-dir/chain1.ipc', net);
	var w3_2_provider = new Web3.providers.IpcProvider('./test-chain-dir/chain2.ipc', net)

}


const web3_1 = new Web3(w3_1_provider);
const web3_2 = new Web3(w3_2_provider);


let fs = require("fs");
const { exit } = require('process');

let source = fs.readFileSync("contracts/htlc_base.json");
let contracts = JSON.parse(source)["contracts"];
// console.log(contracts);


// ABI description as JSON structure
let abi = JSON.parse(contracts['htlc_base.sol:HashedTimelock'].abi);

// Smart contract EVM bytecode as hex
let code = '0x' + contracts['htlc_base.sol:HashedTimelock'].bin;

web3_1.eth.transactionBlockTimeout = 1000;
web3_2.eth.transactionBlockTimeout = 1000;
web3_2.eth.transactionPollingTimeout = 10000;
web3_1.eth.transactionPollingTimeout = 10000;



const gas_price_normal = web3_1.utils.toWei('1', 'gwei')  ;
const gas_price_priority = web3_1.utils.toWei('1', 'gwei') ; 

if (use_ganache == false){
	//create same accounts list for two w3 instances
	web3_1.eth.accounts.wallet.create(num_acc, '54674321§3456764321§345674321§3453647544±±±§±±±!!!43534534534534');
	web3_2.eth.accounts.wallet.create(num_acc, '54674321§3456764321§345674321§3453647544±±±§±±±!!!43534534534534');
}

var counter = 0;



function run_tx(account_list_1, account_list_2){
	console.log("run tx with this address list on two chains");
	console.log(account_list_1);
	console.log(account_list_2);
	//A sends B 11ether, B sends A 1 ether
	//console.log(newSecretHashPair(1));
	console.log("run tx");
	var start_block, end_block;
	web3_1.eth.getBlockNumber()
	.then( number => {
		console.log("start at #blocknumber Chain1", number);
		start_block = number;
	});
	var startTime = performance.now();
	var count_tx = 0;
	for (let i = 0; i < num_acc/2; i++) {
		const acc1_addr_chain1 = account_list_1[i];
		const acc2_addr_chain1 = account_list_1[num_acc/2+i];
		
		const acc1_addr_chain2 = account_list_1[i];
		const acc2_addr_chain2 = account_list_2[num_acc/2+i];
				
		// console.log("START Crosschain TX ", i);
		// A send B in chain 1
		web3_1.eth.sendTransaction({from: acc1_addr_chain1, gas: 21000, to:acc2_addr_chain1, value: web3_1.utils.toWei('1', 'ether')})
			.on('receipt', function(receipt){
				console.log("Crosschain TX ", i, " A sent B Chain 1");
				// B send A in chain 2
				web3_2.eth.sendTransaction({from: acc2_addr_chain2, gas: 21000, to:acc1_addr_chain2, value: web3_2.utils.toWei('1', 'ether')})
				.on('receipt', function(receipt){
					console.log("Crosschain TX ", i, " B sent A Chain 2");
					count_tx = count_tx + 1;
					if (count_tx == num_acc/2){
						var endTime = performance.now();
						console.log("Elapsed time ", (endTime-startTime)/1000, " sec");
						console.log("Estimated TPS: ", count_tx/((endTime-startTime)/1000));
						web3_1.eth.getBlockNumber()
						.then( number => {
							end_block = number;
							console.log("number of Blocks passed in chain1 ", end_block - start_block);
							
						});
					}
				});
			
			});

	}
								
}
function sleep (time) {
	return new Promise((resolve) => setTimeout(resolve, time));
  }
  
function delayed_run_tx(account_list_1, account_list_2){
	sleep(1000).then(() => {
		run_tx(account_list_1, account_list_2)
	});
}

var funded_chain = 0; 
var account_list_1 = [];
var account_list_2 = [];
//if we use geth, we have to transfer fund to all account created
if (use_ganache == false){
	web3_1.eth.getAccounts().then(accounts =>{
		console.log("Prepare step: Chain 1 funding ", num_acc, " accounts");
		var funded = 0;
		for (let i = 0; i < num_acc; i ++){
			web3_1.eth.sendTransaction({
				from: accounts[0],
				to: web3_1.eth.accounts.wallet[i].address,
				value: web3_1.utils.toWei('4', 'ether')
			}).on('receipt', function(receipt){
				account_list_1.push(web3_1.eth.accounts.wallet[i].address);
				funded = funded + 1;
				if (funded == num_acc){
					console.log("done funding chain1 ");
					funded_chain = funded_chain + 1;
					if (funded_chain == 2)
						delayed_run_tx(account_list_1,account_list_2);
				}
			});
		}
	});
	web3_2.eth.getAccounts().then(accounts =>{
		console.log("Prepare step: Chain 2 funding ", num_acc, " accounts");
		var funded = 0;
		for (let i = 0; i < num_acc; i ++){
			web3_2.eth.sendTransaction({
				from: accounts[0],
				to: web3_2.eth.accounts.wallet[i].address,
				value: web3_2.utils.toWei('4', 'ether')
			}).on('receipt', function(receipt){
				account_list_2.push(web3_2.eth.accounts.wallet[i].address);
				funded = funded + 1;
				if (funded == num_acc){
					console.log("done funding chain2 ");
					funded_chain = funded_chain + 1;
					if (funded_chain == 2)
						delayed_run_tx(account_list_1,account_list_2);
				}
			});
		}
	});
} else {
	web3_1.eth.getAccounts().then(accounts => {
		funded_chain = funded_chain + 1; 
		account_list_1 = accounts;
		if (funded_chain == 2)
			delayed_run_tx(account_list_1,account_list_2);
	})
	web3_2.eth.getAccounts().then(accounts => {
		funded_chain = funded_chain + 1;
		account_list_2 = accounts;
		if (funded_chain == 2)
			delayed_run_tx(account_list_1,account_list_2);
	})

}