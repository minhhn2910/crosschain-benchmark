const { performance } = require('perf_hooks');
const Web3 = require('web3');


var num_tx = 950;
const myArgs = process.argv.slice(2);
if (myArgs.length > 0)
	num_tx = parseInt(myArgs);

console.log("Running ", num_tx, " txs")

const use_ganache = false;

if (use_ganache){
	const block_gas_limit =  210000; //ganache problem, if gas just enough for N transaction we got round down to N-1 tx
	const block_time = 1;
	const ganache = require("ganache");
	
	const options = { chain: {  chainId: 123 }, miner: {blockTime: block_time, blockGasLimit: block_gas_limit + 1 }, logging: {quiet:true}};
	var w3_provider = ganache.provider(options);

} else{
	var w3_provider = "http://localhost:7777";
}

const web3 = new Web3(w3_provider);
web3.eth.getChainId().then(id=>{
	console.log("net id ", id);
});
var tx_done_count = 0;
var start_block, end_block;
web3.eth.getAccounts().then(accounts => {
	console.log(accounts);
	web3.eth.getBalance(accounts[0]).then(
		balance => { console.log("Account "+ accounts[0] + " Balance "+ balance)}
	)
	web3.eth.getBlockNumber()
	.then( number => {
		console.log("start at #blocknumber Chain1", number);
		start_block = number;
		var startTime = performance.now();
		for (let i = 0; i < num_tx; i++) {
			web3.eth.sendTransaction({
				from: accounts[0],
				to: "0x00000000000000000000000000000000deadbeef",
				value: 1
			}).on('receipt', function(receipt){
				tx_done_count = tx_done_count + 1;
				if (tx_done_count == num_tx){ // everything is done
					var endTime = performance.now();
					console.log("Elapsed time ", (endTime-startTime)/1000, " sec");
					console.log("Estimated TPS: ", tx_done_count/((endTime-startTime)/1000));
					
					web3.eth.getBalance(accounts[0]).then(
						balance => { console.log("Account "+ accounts[0] + " Balance "+ balance)}
					)
					web3.eth.getBlockNumber().then( number => {
							end_block = number;
							console.log("number of Blocks passed in chain1 ", end_block - start_block);
							});
				}
			});  
		}
		// console.log("after loop");
	});

	

});

