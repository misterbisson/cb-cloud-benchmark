#!/bin/bash

echo "Uncompressing source data..."
cd /data && ./expand.sh


echo "Setting up views..."
cloud-benchmark setup -c couchbase://$COUCHBASE_HOST

echo "Executing benchmarks..."
cloud-benchmark run -d /data -c couchbase://$COUCHBASE_HOST