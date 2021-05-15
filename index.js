require("dotenv").config();
const nodemailer = require("nodemailer");
const { dbPath } = require("./config");
const sqlite3 = require("better-sqlite3");
const cron = require("node-cron");
const htmlTemplate = String.raw;

const main = async () => {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  });
  const conn = sqlite3(dbPath, {
    readonly: true,
  });

  const sendEmail = () => {
    Promise.all(
      Array.from(Array(10).keys()).map(() =>
        conn.prepare("SELECT * FROM links ORDER BY RANDOM() LIMIT 1").get()
      )
    ).then((rows) => {
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
      transport.sendMail({
        subject: `Your links - ${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`,
        to: process.env.RECEIVER_EMAIL,
        text,
        html,
      });
    });
  };

  sendEmail();
  cron.schedule("0 08 */2 * *", sendEmail);
};

main();
