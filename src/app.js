require("dotenv").config();
const nodemailer = require("nodemailer");
const fs = require("fs");
const sqlite3 = require("better-sqlite3");
const cron = require("node-cron");
const child_process = require("child_process");
const { dbPath, clonePath, ogDbPath } = require("../config");
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
		fs.rmSync(clonePath, { recursive: true, force: true });
		fs.rmSync(dbPath, { force: true });
		child_process.execSync(
			`git clone https://arn4v:${process.env.GITHUB_PAT}@github.com/arn4v/onetab-backup ${clonePath}`,
			{
				// stdio: [0, 1, 2], // we need this so node will print the command output
			}
		);
		fs.copyFileSync(ogDbPath, dbPath);
		const conn = sqlite3(dbPath, {
			readonly: true,
		});
		const rows = await Promise.all(
			Array.from(Array(10).keys()).map(() =>
				conn.prepare("SELECT * FROM links ORDER BY RANDOM() LIMIT 1").get()
			)
		);
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
			});
			console.log("Sent email");
		} catch (err) {
			console.log(err);
		}
		conn.close();
		fs.rmSync(dbPath);
		fs.rmSync(clonePath, { recursive: true, force: true });
	};

	sendEmail();
	cron.schedule("0 08 */2 * *", sendEmail);
};

module.exports = main;
