import { Mock, Cluster } from "couchbase";

export default function (uri) {
	let cluster;

	if (uri) {
		cluster = new Cluster(uri);
	} else {
		cluster = new Cluster("couchbase://127.0.0.1");
	}

	return cluster.openBucket("benchmark");
}
