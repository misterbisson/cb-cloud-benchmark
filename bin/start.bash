#!/bin/bash

echo "Uncompressing source data..."
cd /data && ./expand.sh

echo '#'
echo '# Looking for the Couchbase cluster'
echo '#'

CLUSTERFOUND=0
while [ "$CLUSTERFOUND" -lt 3 ]; do
    echo -n '.'
    sleep 19

    CLUSTERFOUND=$(curl -sL http://consul:8500/v1/catalog/service/couchbase | json -aH ServiceAddress | wc -l)
done
sleep 3

CLUSTERFOUND=0
while [ $CLUSTERFOUND != 1 ]; do
    echo -n '.'

    CLUSTERIP=$(curl -sL http://consul:8500/v1/catalog/service/couchbase | json -aH ServiceAddress | head -1)
    if [ -n "$CLUSTERIP" ]
    then
        let CLUSTERFOUND=1
    else
        sleep 3
    fi
done
sleep 3

echo
echo '#'
echo '# Setting up views'
echo "# cloud-benchmark setup -c couchbase://$CLUSTERIP"
echo '#'

cloud-benchmark setup -c couchbase://$CLUSTERIP

echo '#'
echo '# Executing benchmarks...'
echo "# cloud-benchmark run -d /data -c couchbase://$CLUSTERIP"
echo '#'

#for i in {1..100}; do
while true; do
    cloud-benchmark run -d /data -c couchbase://$CLUSTERIP
    sleep 15
done

