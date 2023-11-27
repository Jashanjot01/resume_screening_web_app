"use strict";
require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const nodemailer = require("nodemailer");
const port = process.env.PORT || 3000;
const secretKey = process.env.SECRET_KEY;

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

// const connection = mysql.createConnection(process.env.DATABASE_URL);
/*
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "archPRoject1",
});

if (connection) {
  console.log("Connected to database");
} else {
  console.log("Failed to connect to database");
}
*/
const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt; 
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        
        res.clearCookie("jwt"); 
        res.redirect("/login"); 
      } else {
        // Token is valid
        req.user = decoded; 
        next(); 
      }
    });
  } else {
    res.redirect("/login"); 
  }
};

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "archPRoject1",
});

if (connection) {
  console.log("Connected to database");
}

app.get("/index", verifyToken, (req, res) => {
  res.send("Hello World");
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const token = req.cookies && req.cookies.jwt;
    if (token) {
      try {
        const decoded = jwt.verify(token, secretKey);
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log("No token found in cookies");
    }
  } catch (error) {
    console.error("Error:", error);
  }
  const query = "SELECT * FROM users WHERE username = ?";
  connection.query(query, [username], async (error, results) => {
    if (error) {
      console.error("Error querying database:", error);
      res.status(500).json({ message: "Error querying database" });
    } else {
      if (results.length > 0) {
        const hashedPassword = results[0].password;
        const match = await bcrypt.compare(password, hashedPassword);
        if (match) {
          const token = jwt.sign({ username }, secretKey, {
            expiresIn: "1h",
          }); 
          res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: 3600000, // 1 hour
            sameSite: "strict",
          });
          res.json({ message: "Login successful" });
        } else {
          res.status(401).json({ message: "Invalid credentials" });
        }
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    }
  });
});



app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10); 
    const insertQuery =
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    connection.query(
      insertQuery,
      [username, email, hashedPassword],
      (error, results) => {
        if (error) {
          console.error("Error registering user:", error); 
          res
            .status(500)
            .json({ message: "Error registering user", error: error.message }); 
        } else {
          res.status(201).json({ message: "User registered successfully" });
        }
      }
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});


// Route to handle password reset request
app.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  const query = "SELECT * FROM users WHERE email = ?";
  connection.query(query, [email], (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error querying database" });
    }
    if (results.length > 0) {
      // Generate a reset token
      const resetToken = jwt.sign({ email }, secretKey, { expiresIn: '15m' });
      const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

      // Setup email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Password Reset',
        text: `Please click on the following link to reset your password: ${resetLink}`
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
          return res.status(500).json({ message: "Error sending reset email" });
        } else {
          console.log('Email sent: ' + info.response);
          return res.status(200).json({ message: 'Password reset email sent' });
        }
      });
    } else {
      return res.status(200).json({ message: 'If your email is registered, you will receive a password reset link.' });
    }
  });
});


// Route to handle password reset confirmation
app.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, secretKey);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateQuery = "UPDATE users SET password = ? WHERE email = ?";
    connection.query(updateQuery, [hashedPassword, decoded.email], (error, results) => {
      if (error) {
        return res.status(500).json({ message: "Error updating password" });
      }
      res.status(200).json({ message: "Password updated successfully" });
    });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

module.exports = app;
