// Simplest trusted crosschain tx 
// A send B then B send A 2-step transaction
const { performance } = require('perf_hooks');
const Web3 = require('web3');

const web3_1 = new Web3("http://localhost:7777");
const web3_2 = new Web3("http://localhost:8888");
let fs = require("fs");

let source = fs.readFileSync("contracts/htlc_base.json");
let contracts = JSON.parse(source)["contracts"];
// console.log(contracts);


// ABI description as JSON structure
let abi = JSON.parse(contracts['htlc_base.sol:HashedTimelock'].abi);

// Smart contract EVM bytecode as hex
let code = '0x' + contracts['htlc_base.sol:HashedTimelock'].bin;


// https://github.com/ChainSafe/web3.js/issues/1846
// having problem using the same address asynchronously. Nonce management is a nightmare
// current solution: create an account pool & transfer eth to all of them;
var num_tx = 100;
const myArgs = process.argv.slice(2);
if (myArgs.length > 0)
	num_tx = parseInt(myArgs);

console.log("Running ", num_tx, " txs")

const num_acc= num_tx*2;

const gas_price_normal = web3_1.utils.toWei('1', 'gwei')  ;
const gas_price_priority = web3_1.utils.toWei('1', 'gwei') ; 

//create same accounts list for two w3 instances
web3_1.eth.accounts.wallet.create(num_acc, '54674321§3456764321§345674321§3453647544±±±§±±±!!!43534534534534');
web3_2.eth.accounts.wallet.create(num_acc, '54674321§3456764321§345674321§3453647544±±±§±±±!!!43534534534534');

var counter = 0;



function run_tx(){
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
		const acc1_addr_chain1 = web3_1.eth.accounts.wallet[i].address;
		const acc2_addr_chain1 = web3_1.eth.accounts.wallet[num_acc/2+i].address;
		
		const acc1_addr_chain2 = web3_2.eth.accounts.wallet[i].address;
		const acc2_addr_chain2 = web3_2.eth.accounts.wallet[num_acc/2+i].address;
				
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

var funded_chain = 0; 
web3_1.eth.getAccounts().then(accounts =>{
	console.log("Prepare step: Chain 1 funding ", num_acc, " accounts");
	var funded = 0;
	for (let i = 0; i < num_acc; i ++){
		web3_1.eth.sendTransaction({
			from: accounts[0],
			to: web3_1.eth.accounts.wallet[i].address,
			value: web3_1.utils.toWei('4', 'ether')
		}).on('receipt', function(receipt){

			funded = funded + 1;
			if (funded == num_acc){
				console.log("done funding chain1 ");
				funded_chain = funded_chain + 1;
				if (funded_chain == 2)
					deploy_htlpwrapper();
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

			funded = funded + 1;
			if (funded == num_acc){
				console.log("done funding chain2 ");
				funded_chain = funded_chain + 1;
				if (funded_chain == 2)
					run_tx();
			}
		});
	}
});
