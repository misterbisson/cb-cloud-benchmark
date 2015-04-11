import Chance from "chance";
import _ from "lodash";
import fs from "fs";

export default function (num, dir, docs=600000, progress=new Progress()) {
	let chance = new Chance();

	let owners = [];

	let tick = 1000;

	progress.start(docs);

	_.forEach(_.range(0, docs), () => {
		owners.push({
			"id": chance.guid(),
			"name": {
				"first": chance.first(),
				"last": chance.last()
			},
			"gender": chance.gender(),
			"ssn": chance.ssn(),
			"age": chance.age(),
			"phone": chance.phone(),
			"email": chance.email(),
			"address": {
				"street": chance.address({"short_suffix": true}),
				"city": chance.city(),
				"state": chance.state(),
				"zip": chance.zip({"plusfour": true})
			},
			"car": {
				"make": chance.pick(["Ford", "GM", "Honda", "Nissan", "Hyundai", "Toyota", "Mazda", "BMW", "Audi", "Volkswagen"]),
				"model": chance.pick(["Coupe", "Sedan", "SUV", "Truck", "Van", "Wagon", "Convertible"]),
				"year": chance.year({"min": 1990, "max": 2015})
			}
		});

		tick--;

		if (tick <= 0) {
			progress.completed();
			tick = 1000;
		}
	});

	owners = _.uniq(owners, "id");

	fs.ensureDir(dir, function (err) {
		if (err) return console.log(err);

		fs.writeFile(`${dir}/generated_docs_${num}.json`, JSON.stringify({"owners": owners}), (err) => {
			if (err) return console.log(err);

			progress.end();

			process.exit(0);
		});
	});
}
