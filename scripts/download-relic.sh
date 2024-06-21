scp root@49.13.11.203:/root/relic/benchmarks/server/relic.tar.gz data
rm -rf data/results
tar -xvf data/relic.tar.gz -C data
rm data/relic.tar.gz
