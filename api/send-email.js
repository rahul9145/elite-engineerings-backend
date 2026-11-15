const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { dataToBind, escapeHtml } = require("../helper");
require("dotenv").config({ path: "./.env.local" });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, max) {
  return String(value == null ? "" : value).replace(/\r\n?/g, "\n").trim().slice(0, max);
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  const body = req.body || {};

  // Honeypot: bots fill hidden fields. Pretend success, send nothing.
  if (body.company_website) {
    return res.status(200).json({ message: "Email sent successfully!" });
  }

  const name = clean(body.name, 100);
  const email = clean(body.email, 120);
  const subject = clean(body.subject, 140).replace(/\n/g, " ") || "Website enquiry";
  const message = clean(body.message, 5000);
  const company = clean(body.company, 120);
  const phone = clean(body.phone, 30);

  if (!name || !message || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Name, a valid email and a message are required" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail", // Use Gmail or configure for your service
      auth: {
        user: process.env.EMAIL, // Fetch from environment variables
        pass: process.env.PASSWORD, // Fetch from environment variables
      },
    });

    // custom smtp
    /* const transporter = nodemailer.createTransport({
      host: "smtp.example.com",
      port: 587,
      secure: false, // true for port 465, false for 587
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    }); */

    const htmlContent = await fs.promises.readFile(path.join(__dirname, "mailContent.html"), { encoding: "utf-8" });
    const formattedHtml = dataToBind(htmlContent, {
      name: escapeHtml(name),
      email: escapeHtml(email),
      title: escapeHtml(subject),
      company: escapeHtml(company || "—"),
      phone: escapeHtml(phone || "—"),
      message: escapeHtml(message).replace(/\n/g, "<br>"),
    });

    const text = [
      `Name: ${name}`,
      `Email: ${email}`,
      company && `Company: ${company}`,
      phone && `Phone: ${phone}`,
      `Subject: ${subject}`,
      "",
      message,
    ].filter((l) => l !== false && l !== "").join("\n");

    const mailOptions = {
      from: `"Elite Engineerings Website" <${process.env.EMAIL}>`,
      to: process.env.EMAIL,
      replyTo: { name, address: email }, // "Reply" in your inbox goes straight to the customer
      subject: `Elite Engineerings Contact Us: ${subject}`,
      html: formattedHtml,
      text,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
};
