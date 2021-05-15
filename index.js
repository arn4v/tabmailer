require("dotenv").config();
const nodemailer = require("nodemailer");
const { dbPath } = require("./config");
const sqlite3 = require("better-sqlite3");
const cron = require("node-cron");
const child_process = require("child_process")
const htmlTemplate = String.raw;

const main = async () => {
	const transport = nodemailer.createTransport({
		service: "Gmail",
		auth: {
			user: process.env.NODEMAILER_USER,
			pass: process.env.NODEMAILER_PASS,
		},
	});

	const sendEmail = async () => {
		const clone_command = `git clone https://arn4v:${process.env.GITHUB_PAT}@github.com/arn4v/onetab-backup`
		child_process.execSync("rm -rf onetab-backup")
		child_process.execSync(clone_command, {
			stdio: [0, 1, 2], // we need this so node will print the command output
		})
		child_process.execSync("cp ./onetab-backup/onetab.sqlite3 .")
		const conn = sqlite3(dbPath, {
			readonly: true,
		});
		const rows = await Promise.all(
			Array.from(Array(10).keys()).map(() =>
				conn.prepare("SELECT * FROM links ORDER BY RANDOM() LIMIT 1").get()
			))
		const text = rows
			.map((item, idx, arr) => {
				return `${idx + 1}. ${item.title} - ${item.url}`;
			})
			.join("\n\n");
		const html = htmlTemplate`
        ${rows
				.map((item, idx, arr) => {
					return `<strong>${idx + 1}.</strong> <a href=${item.url}>${
						item.title
						}</a>
            <br>`;
				})
				.join("\n\n")}
      `;
		const date = new Date();
		try {
			await transport.sendMail({
				subject: `Your links - ${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`,
				to: process.env.RECEIVER_EMAIL,
				text,
				html,
			})
			console.log("Sent email")
		} catch (err) {
			console.log(err)
		}

		child_process.execSync("rm ./onetab.sqlite3")
		child_process.execSync("rm -rf onetab-backup")
	};

	sendEmail();
	cron.schedule("0 08 */2 * *", sendEmail);
};

main();
