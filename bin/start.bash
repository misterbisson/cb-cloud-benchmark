#!/bin/bash

echo "Uncompressing source data..."
cd /data && ./expand.sh

echo "Creating the bucket"
BUCKET_RAM=100
curl -i -X POST -u Administrator:password -d name=newbucket -d ramQuotaMB=$BUCKET_RAM -d authType=none -d proxyPort=11239 -d replicaNumber=1 http://$COUCHBASE_HOST:8091/pools/default/buckets

echo "Setting up views..."
cloud-benchmark setup -c couchbase://$COUCHBASE_HOST

echo "Executing benchmarks..."
cloud-benchmark run -d /data -c couchbase://$COUCHBASE_HOST