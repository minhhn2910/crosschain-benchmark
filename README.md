# Cross-chain Transaction Benchmark
Crosschain Transaction per second (TPS) benchmarking
### Requirements
* `nodejs` 
* `geth` in PATH. If it's not in PATH, run: `export PATH=[path to geth folder]:$PATH`
* adjust the num_account `num_acc` in each js file for different testing settings. 
### Single-chain benchmark
Run: 
* `npm install`
* `rm -rf test-chain-dir/`
* `start_first_chain.sh 2 2000000` with configurable params: `2` is the block time , `2000000` is the block limit.
* `node single_chain_htlc_deploy_once.js` for htlc testing or `node simple_transfer.js` for simple transfer testing.
### Multi-Chain benchmark
Similarly, run:
* `rm -rf test-chain-dir/`
* `start_first_chain.sh 2 2000000` with configurable params: `2` seconds is the block time , `2000000` is the block limit.
* `start_second_chain.sh 2 4000000` with configurable params: `2` seconds is the block time , `4000000` is the block limit.
* `node two_chain_htlc_deploy_once.js`

### Note: 
Currently tx scheduling is not implemented, [TODO]
