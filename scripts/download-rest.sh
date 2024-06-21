scp root@49.13.11.203:/root/relic/benchmarks/server/rest.tar.gz data
rm -rf data/results-rest
tar -xvf data/rest.tar.gz -C data
rm data/rest.tar.gz