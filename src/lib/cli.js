import _ from "lodash";
import yargs from "yargs";
import del from "del";
import path from "path";
import ProgressBar from "progress";
import { install } from "source-map-support";

import generate from "./generate";
import Progress from "./progress";
import setup from "./setup";
import benchmark from "./benchmark";

install();

class ProgressProgressBar {

	constructor(num, operation) {
		this.operation = operation;
		this.num = num;
		this.started = 0;
		this.total = 0;
		this.qued = 0;
	}

	start(total) {
		this.started++;
		this.total += total;

		if (this.started >= this.num) {
			console.log();

			this.bar = new ProgressBar(`${this.operation} [:bar] :current/:total :percent :elapseds elapsed`, {
				"complete": "=",
				"incomplete": " ",
				"width": 20,
				"total": this.total
			});

			_.forEach(_.range(0, this.qued), () => {
				this.bar.tick(1000);
			});
		}
	}

	completed() {
		if (this.bar) {
			this.bar.tick(1000);
		} else {
			this.qued++;
		}
	}
}

class WorkerProgress extends Progress {

	constructor(num) {
		super();

		this.num = num;
	}

	start(total) {
		process.send({
			"num": this.num,
			"type": "start",
			"total": total
		});
	}

	completed() {
		process.send({
			"num": this.num,
			"type": "completed"
		});
	}
}

function spinCluster(cluster, dir, num, series, progress, command) {

	return new Promise((resolve) => {

		let numWorkers = 0;

		_.forEach(_.range(1, num + 1), (i) => {
			let worker = cluster.fork();

			numWorkers++;
			worker.send({
				"num": i,
				"series": series,
				"dir": dir,
				"command": command
			});
		});

		if (progress) {
			Object.keys(cluster.workers).forEach((id) => {
				cluster.workers[id].on("message", (message) => {

					switch (message.type) {
						case "start":
							progress.start(message.total);
							break;
						case "completed":
							progress.completed();
							break;
					}

				});
			});
		}

		cluster.on("exit", () => {
			numWorkers--;

			if (numWorkers === 0) {
				console.log(`completed series ${series}`);

				resolve();
			}
		});
	});
}

export default function (cluster) {

	if (cluster.isMaster) {
		let argv = yargs.usage("cloud-benchmark <command> [options]")
			.command("generate", "generate test data")
			.command("setup", "setup view models")
			.command("run", "run tests")
			.option("n", {
				"alias": "num",
				"default": 150000,
				"describe": "number of docs to generate per process (generate only)",
				"type": "number"
			})
			.option("p", {
				"alias": "process",
				"default": 2,
				"describe": "number of processes to use",
				"type": "number"
			})
			.option("s", {
				"alias": "series",
				"default": 8,
				"describe": "number of times to run the import",
				"type": "number"
			})
			.option("d", {
				"alias": "dir",
				"default": path.resolve(__dirname, "../../data"),
				"describe": "directory to use",
				"type": "string"
			})
			.option("c", {
				"alias": "cluster",
				"default": "couchbase://127.0.0.1",
				"describe": "couchbase cluster uri (setup and test only)",
				"type": "string"
			})
			.demand(1, "must provide a valid command")
			.argv;

		let command = argv._[0];

		switch (command) {
			case "generate":

				del([`${argv.dir}/generated_docs_*_*.json`], (err) => {
					if (err) throw err;

					let generateSeries = Promise.resolve();

					_.forEach(_.range(1, argv.series + 1), (seriesIndex) => {

						generateSeries = generateSeries.then(() => {

							return spinCluster(cluster, argv.dir, argv.process, seriesIndex, new ProgressProgressBar(argv.process, `series ${seriesIndex}: generate test docs`), {
								"name": "generate",
								"options": {
									"docs": argv.num
								}
							});
						});
					});

					generateSeries.then(() => {
						console.log("completed");
					});
				});

				break;
			case "setup":
				setup(argv.cluster);
				break;
			case "run":

				let clusterSeries = Promise.resolve();

				_.forEach(_.range(1, argv.series + 1), (seriesIndex) => {

					clusterSeries = clusterSeries.then(() => {

						return spinCluster(cluster, argv.dir, argv.process, seriesIndex, new ProgressProgressBar(argv.process, `series ${seriesIndex}: load test docs`), {
							"name": "run",
							"options": {
								"cluster": argv.cluster
							}
						});
					});
				});


				clusterSeries.then(() => {
					return benchmark.query(argv.cluster);
				}).then(() => {
					return new Promise((resolve) => {
						console.log("waiting 60 seconds to run queries again");
						setTimeout(resolve, 60000);
					});
				}).then(() => {
					return benchmark.query(argv.cluster);
				}).then(() => process.exit(0), (err) => {
					console.log(err);
					throw err;
				}).catch((err) => {
					console.log(err);
					throw err;
				});
				break;
			default:
				yargs.showHelp();
		}

	} else {

		process.on("message", function (message) {
			let num = message.num;
			let command = message.command;

			switch (command.name) {

				case "generate":
					generate(num, message.series, message.dir, command.options.docs, new WorkerProgress(num));
					break;
				case "run":
					benchmark.load(num, message.series, message.dir, command.options.cluster, new WorkerProgress(num));
			}
		});

	}
}
