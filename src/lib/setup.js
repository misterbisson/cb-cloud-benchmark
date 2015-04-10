import connect from "./connect";

export default function (uri) {
	let bucket = connect(uri);

	let designDoc = {
		"withSUVs": {
			"map": `
function (doc, meta) {
	if (doc.car.model === "SUV") {
		emit(null, doc);
	}
}`
		},
		"numConvertibles": {
			"map": `
function (doc, meta) {
	if (doc.car.model === "Convertible") {
		emit(null, doc);
	}
}`,
			"reduce": "_count"
		},
		"ageByManufacturer": {
			"map": `
function (doc, meta) {
	emit(doc.make, doc.age);
}`,
			"reduce": `
function (key, values, rereduce) {
	var sum = 0;

	for(i=0; i < values.length; i++) {
		sum = sum + values[i];
	}

	return (sum / values.length);
}`
		}
	};

	bucket.manager().upsertDesignDocument("benchmark", {"views": designDoc}, (err) => {
		if (err) return console.log(err);

		console.log("views setup");

		process.exit(0);
	});
}
