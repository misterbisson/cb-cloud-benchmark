import fs from "fs";
import _ from "lodash";
import JSONStream from "JSONStream";
import { ViewQuery } from "couchbase";

import connect from "./connect";

export default function (num, dir, uri, loadProgress) {
	let bucket = connect(uri);

	let stream = fs.createReadStream(`${dir}/generated_docs_${num}.json`, {"encoding": "utf8"});
	let parser = JSONStream.parse("owners.*");

	stream.pipe(parser);

	let owners = [];

	parser.on("data", (owner) => {
		owners.push(owner);
	});

	parser.on("end", () => {

		let chunks = _.chunk(owners, 1000);

		loadProgress.start(owners.length);

		let insertStage = Promise.resolve([]);

		_.forEach(_.range(0, chunks.length), (chunkIndex) => {

			let ownersChunk = chunks[chunkIndex];

			insertStage = insertStage.then(() => {

				return new Promise((resolve, reject) => {

					let inserts = ownersChunk.map((owner) => {

						return new Promise((resolve, reject) => {

							bucket.insert(owner.id, owner, (err) => {
								if (err) {
									console.log(err);
									return reject(err);
								}

								resolve();
							});
						});

					});

					Promise.all(inserts).then(() => {
						loadProgress.completed(chunkIndex);

						resolve();
					}, reject).catch(reject);

				});
			}, (err) => {
				console.log(err);
				throw err;
			});
		});

		insertStage.then(() => {

			loadProgress.end();

			return new Promise((resolve, reject) => {

				console.log("query people with SUVs");

				let start = new Date();

				let vq = ViewQuery.from("benchmark", "withSUVs");

				vq.stale(ViewQuery.Update.BEFORE);

				bucket.query(vq, (err, results) => {
					if (err) return reject(err);

					let end = new Date();

					console.log(`people with SUVs in: ${Math.round((end.getTime() - start.getTime()) / 10) / 100}s`);

					return resolve(results);
				});

			});

		}, (err) => {
			console.log(err);
			throw err;
		}).then(() => {

			loadProgress.end();

			return new Promise((resolve, reject) => {

				console.log("query number of convertibles");

				let start = new Date();

				let vq = ViewQuery.from("benchmark", "numConvertibles");

				vq.stale(ViewQuery.Update.BEFORE);

				bucket.query(vq, (err, results) => {
					if (err) return reject(err);

					let end = new Date();

					console.log(`number of convertibles: ${results[0].value}`);

					console.log(`number of convertibles in: ${Math.round((end.getTime() - start.getTime()) / 10) / 100}s`);

					return resolve(results);
				});

			});

		}, (err) => {
			console.log(err);
			throw err;
		}).then(() => {

			loadProgress.end();

			return new Promise((resolve, reject) => {

				console.log("query age by manufacturer");

				let start = new Date();

				let vq = ViewQuery.from("benchmark", "ageByManufacturer");

				vq.stale(ViewQuery.Update.BEFORE);

				bucket.query(vq, (err, results) => {
					if (err) return reject(err);

					let end = new Date();

					console.log(`age by manufacturer: ${Math.round(results[0].value)}`);

					console.log(`age by manufacturer in: ${Math.round((end.getTime() - start.getTime()) / 10) / 100}s`);

					process.exit(0);
				});

			});

		}, (err) => {
			console.log(err);
			throw err;
		}).catch((err) => {
			console.log(err);
			throw err;
		});
	});
}
