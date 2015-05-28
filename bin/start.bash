#!/bin/bash

cd /data && ./expand.sh

# Install Couchbase Views
# cloud-benchmark setup -c couchbase://$couchbase_host

# Run Benchmark
# cloud-benchmark run -d /data -c couchbase://$couchbase_host
