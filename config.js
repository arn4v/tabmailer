const path = require("path");
module.exports = Object.freeze({
	/** Change this to wherever your database is */
	dbPath: path.resolve(process.cwd(), "onetab.sqlite3"),
	get clonePath() {
		return path.resolve(process.cwd(), "onetab-backup");
	},
	get ogDbPath() {
		return path.join(this.clonePath, "onetab.sqlite3");
	},
});
