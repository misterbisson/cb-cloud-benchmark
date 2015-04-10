import fs from "fs";
import JSONStream from "JSONStream";
import _ from "lodash";

import connect from "./connect";

export default function (num, uri, loadProgress) {
	let bucket = connect(uri);

	let stream = fs.createReadStream(`./data/generated_docs_${num}.json`, {"encoding": "utf8"});
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
				return err;
			});
		});

		insertStage.then(() => {

			loadProgress.end();

			process.exit(0);

		}, (err) => {
			throw err;
		}).catch((err) => {
			throw err;
		});
	});
}
