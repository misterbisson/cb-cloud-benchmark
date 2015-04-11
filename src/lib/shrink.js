import _ from "lodash";
import del from "del";
import fs from "fs-extra";
import concat from "concat";

export default function (original, to, dir) {
	if (original < to) throw new Error("original is less then to");
	if (original === to) {
		console.log("completed");
		return;
	}

	let concatenations = [];
	let num = Math.floor(original / to);
	let remainder = (original % to);

	let current = 1;

	_.forEach(_.range(1, to + 1), (i) => {
		let concatenation = [];

		_.forEach(_.range(0, num), () => {
			concatenation.push(`${dir}/generated_docs_${current++}.json`);
		});

		concatenations.push([concatenation, `${dir}/concatenation_docs_${i}.json`]);
	});

	_.forEach(_.range(0, remainder), (i) => {
		concatenations[i][0].push(`${dir}/generated_docs_${current++}.json`);
	});

	concatenations = concatenations.map((concatenation) => {

		return new Promise((resolve, reject) => {
			concat(concatenation[0], concatenation[1], (err) => {
				if (err) return reject(err);

				resolve();
			});
		});

	});

	Promise.all(concatenations).then(() => {

		return new Promise((resolve, reject) => {

			del([`${dir}/generated_docs_*.json`], (err) => {
				if (err) return reject(err);

				resolve();
			});
		});

	}, (err) => {
		console.log(err);
		throw err;
	}).then(() => {

		let moves = [];

		_.forEach(_.range(1, to + 1), (i) => {

			moves.push(new Promise((resolve, reject) => {

				fs.move(`${dir}/concatenation_docs_${i}.json`, `./data/generated_docs_${i}.json`, (err) => {
					if (err) return reject(err);

					resolve();
				});
			}));
		});

		return Promise.all(moves);

	}, (err) => {
		console.log(err);
		throw err;
	}).then(() => {

		del([`${dir}/concatenation_docs_*.json`], (err) => {
			if (err) {
				console.log(err);
				throw err;
			}

			console.log("completed");
		});
	}, (err) => {
		console.log(err);
		throw err;
	}).catch((err) => {
		console.log(err);
		throw err;
	});

}
