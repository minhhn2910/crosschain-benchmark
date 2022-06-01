const { performance } = require('perf_hooks');
const Web3 = require('web3');
//const web3 = new Web3("http://localhost:7545");
const web3 = new Web3("http://localhost:7777");

var num_tx = 950;
const myArgs = process.argv.slice(2);
if (myArgs.length > 0)
	num_tx = parseInt(myArgs);

console.log("Running ", num_tx, " txs")
var tx_done_count = 0;

web3.eth.getAccounts().then(accounts => {
	console.log(accounts);
	web3.eth.getBalance(accounts[0]).then(
		balance => { console.log("Account "+ accounts[0] + " Balance "+ balance)}
	)
	web3.eth.getBlockNumber()
	.then( number => {
		console.log("begin block ", number);
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
							console.log("end block ", number);
							});
				}
			});  
		}
		// console.log("after loop");
	});

	

});

