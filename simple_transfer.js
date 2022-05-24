const Web3 = require('web3');
//const web3 = new Web3("http://localhost:7545");
const web3 = new Web3("http://localhost:8545");
const num_tx = 200;
var tx_done_count = 0;
web3.eth.getAccounts().then(accounts => {
	console.log(accounts);
	web3.eth.getBalance(accounts[0]).then(
		balance => { console.log("Account "+ accounts[0] + " Balance "+ balance)}
	)
	// web3.eth.getBalance(accounts[1]).then(
	// 	balance => { console.log("Account "+ accounts[1] + " Balance "+ balance)}
	// )
	web3.eth.getBlockNumber()
	.then( number => {
		console.log("begin block ", number);
		console.time("tx-loop");
		for (let i = 0; i < num_tx; i++) {
			web3.eth.sendTransaction({
				from: accounts[0],
				to: "0x00000000000000000000000000000000deadbeef",
				value: 1
			}).on('receipt', function(receipt){
				tx_done_count = tx_done_count + 1;
				if (tx_done_count == num_tx){ // everything is done
					console.timeEnd('tx-loop');
					web3.eth.getBalance(accounts[0]).then(
						balance => { console.log("Account "+ accounts[0] + " Balance "+ balance)}
					)
					web3.eth.getBlockNumber().then( number => {
							console.log("end block ", number);
							});
				}
			});  
		}
		console.log("after loop");
	});

	

});

