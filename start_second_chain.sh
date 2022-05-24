rm -rf test-dir-2; geth --datadir test-dir-2 --http.port $1 --http --dev --http.corsdomain '*' --dev.period $2 --dev.gaslimit $3 --miner.gaslimit $3


