const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

// new Email(user,url).sendWelcome

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Jonas Schmedtmann <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      //Sendgrid
      // return nodemailer.createTransport({
      //   service: "gmail",
      //   port: 587,
      //   secure: false,
      // });

      return 1;
    }

    return nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // send the actual email

    //1)Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    //2)Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
      // html:
    };

    // 3)Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the Natours Family!");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your Password Reset Token (valid for only 10 minutes)"
    );
  }
};
