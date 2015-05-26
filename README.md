# Couchbase Cloud Benchmarking

A module to benchmark various clouds by loading and accessing a large dataset in a Couchbase cluster

## Using

- On [Joyent Triton](https://www.joyent.com/) in Docker containers: See [clustered-couchbase-in-containers](https://github.com/misterbisson/clustered-couchbase-in-containers) repo.
- On [Joyent Triton](https://www.joyent.com/) in an infrastructure container: documentation to be developed.


## Building

Be sure you have everything, including the git submodule content:

```bash
git submodule update --init --recursive
```

Then build the image:

```bash
docker build....
```