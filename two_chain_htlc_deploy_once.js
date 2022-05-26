const Web3 = require('web3');
const {
	bufToStr,
	getBalance,
	htlcArrayToObj,
	isSha256Hash,
	newSecretHashPair,
	nowSeconds,
	random32,
	txContractId,
	txGas,
	txLoggedArgs,
  } = require('./utils')


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

// have to hardcode gas to just enough for tx. 
// Higher gas value than actual usage makes the miner include less tx to the block than actual.
// TODO: better use web3 estimate gas.
// below is for base htlc (transfer eth). For erc20 htlc, it is more expensive 
// contract deploy : 1,039,331 gas
// create new htlc : 142582  
// withdraw : 87105
const new_htlc_gas = 145000; //larger than measured because gas may change a little bit depends on input data
const withdraw_gas = 90000;
// Create Contract proxy class
let SampleContract_1 = new web3_1.eth.Contract(abi);
let SampleContract_2 = new web3_2.eth.Contract(abi);

// const acc1_addr =  '0x2c7536E3605D9C16a7a3D7b1898e529396a65c23';
// const acc1_priv =  '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318';
// const acc2_addr =  '0xb8CE9ab6943e0eCED004cDe8e3bBed6568B2Fa01';
// const acc2_priv =  '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709';
// web3_1.eth.accounts.wallet.add(acc1_priv);
// web3_1.eth.accounts.wallet.add(acc2_priv);
// https://github.com/ChainSafe/web3.js/issues/1846
// having problem using the same address asynchronously. Nonce management is a nightmare
// current solution: create an account pool & transfer eth to all of them;
const num_acc= 200;

const gas_price_normal = web3_1.utils.toWei('1', 'gwei')  ;
const gas_price_priority = web3_1.utils.toWei('1', 'gwei') ; 

//create same accounts list for two w3 instances
web3_1.eth.accounts.wallet.create(num_acc, '54674321§3456764321§345674321§3453647544±±±§±±±!!!43534534534534');
web3_2.eth.accounts.wallet.create(num_acc, '54674321§3456764321§345674321§3453647544±±±§±±±!!!43534534534534');
// console.log(web3_1.eth.accounts.wallet[0].address);
// console.log(web3_2.eth.accounts.wallet[0].address);


var counter = 0;

//const num_tx = 1;

function run_tx(contract_1,contract_2){
	console.log(contract_1,contract_2);
	var Contract_1 = new web3_1.eth.Contract(abi, contract_1);
	var Contract_2 = new web3_2.eth.Contract(abi, contract_2);
	//A sends B 11ether, B sends A 1 ether
	//console.log(newSecretHashPair(1));
	console.time("tx-loop");
	var count_htlc = 0;
	for (let i = 0; i < num_acc/2; i++) {
		const acc1_addr_chain1 = web3_1.eth.accounts.wallet[i].address;
		const acc2_addr_chain1 = web3_1.eth.accounts.wallet[num_acc/2+i].address;
		
		const acc1_addr_chain2 = web3_2.eth.accounts.wallet[i].address;
		const acc2_addr_chain2 = web3_2.eth.accounts.wallet[num_acc/2+i].address;
				
		// console.log("START HTLC number ", i, " acc1 ", acc1_addr_chain1, " acc2 ", acc2_addr_chain2);
		const hash_pair = newSecretHashPair();
		console.log("START HTLC ", i);
		// console.log (hash_pair);

		Contract_1.methods.newContract(acc2_addr_chain1, hash_pair.hash, Math.floor(Date.now() / 1000) + 3600)
								.send({from: acc1_addr_chain1, gas: new_htlc_gas, value: web3_1.utils.toWei('1', 'ether'), gasPrice: gas_price_normal})
								.on('receipt', function(receipt){
									
									// console.log("gas used ", receipt.gasUsed);
									const contractId1 = receipt.events['LogHTLCNew'].returnValues.contractId;
									//console.log("contractid 1 ", contractId1);
									// console.log("create contract 2");
									Contract_2.methods.newContract(acc1_addr_chain2, hash_pair.hash, Math.floor(Date.now() / 1000) + 3600)
									.send({from: acc2_addr_chain2, gas: new_htlc_gas, value: web3_1.utils.toWei('1', 'ether'), gasPrice: gas_price_normal})
									.on('receipt', function(receipt){
										const contractId2 = receipt.events['LogHTLCNew'].returnValues.contractId;
										// console.log("gas used ", receipt.gasUsed);
										// console.log("contractid 2 ", contractId2);
										
										console.log("HTLC ", i, " A withdraw contract 2 ");
										Contract_2.methods.withdraw(contractId2,hash_pair.secret).send({from: acc1_addr_chain2, gas: withdraw_gas, gasPrice: gas_price_priority})
														.on('receipt', function(receipt){
															// console.log("gas used ", receipt.gasUsed);

															console.log("HTLC ", i," B withdraw contract 1 ");
															
															Contract_1.methods.withdraw(contractId1,hash_pair.secret).send({from: acc2_addr_chain1, gas: withdraw_gas, gasPrice: gas_price_priority})
															.on('receipt', function(receipt){
																// console.log("gas used ", receipt.gasUsed);
																console.log("DONE HTLC ", i);
																count_htlc = count_htlc + 1;
																if (count_htlc == num_acc/2){
																	console.timeEnd('tx-loop');
																}
															});
														});

									});
									
								});
	}
								
}
function deploy_htlpwrapper(){
	console.log("deploy_htlcwrapper");
	var deployed_count = 0;
	var contract_1, contract_2;
	let contract1 = SampleContract_1.deploy({data: code}).send({from: web3_1.eth.accounts.wallet[0].address, gas: 2000000, gasPrice: 0}).on('receipt', function(receipt){
		console.log("deployed contract 1 ",receipt.contractAddress);
		deployed_count = deployed_count + 1;
		contract_1 = receipt.contractAddress; 
		if (deployed_count ==2 ){
			run_tx(contract_1,contract_2);
		}

	});


	let contract2 = SampleContract_2.deploy({data: code}).send({from: web3_2.eth.accounts.wallet[1].address , gas: 2000000, gasPrice: 0}).on('receipt', function(receipt){
		console.log("deployed contract 2 ",receipt.contractAddress);
		deployed_count = deployed_count + 1;
		contract_2 = receipt.contractAddress; 
		if (deployed_count ==2 ){
			run_tx(contract_1,contract_2);
		}
	});
	
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
					deploy_htlpwrapper();
			}
		});
	}
});


