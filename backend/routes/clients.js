const express = require("express");
const router = express.Router();
const Client = require("../models/Clients");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Middleware để validate token (nếu cần)
const validateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "wellspring");
    req.client = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Hash passwords for existing clients
async function hashClientPasswords() {
  try {
    const clients = await Client.find({});
    for (const client of clients) {
      if (client.password && client.password.startsWith("$2a$")) {
        client.password = await bcrypt.hash(client.password, 10);
        await client.save();
        console.log(`Hashed password for client: ${client.username}`);
      }
    }
    console.log("Completed password hashing for all clients.");
  } catch (error) {
    console.error("Error hashing passwords:", error);
  }
}

hashClientPasswords();

// Login API for Clients
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const client = await Client.findOne({ username });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const isMatch = await bcrypt.compare(password, client.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid login credentials" });
    }

    const token = jwt.sign(
      { id: client._id, role: client.role },
      process.env.JWT_SECRET || "wellspring",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      client: {
        id: client._id,
        username: client.username,
        email: client.email,
        role: client.role,
      },
      token,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Get all clients
router.get("/", validateToken, async (req, res) => {
  try {
    const clients = await Client.find({});
    res.status(200).json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Error fetching clients", error });
  }
});

// Create a new client
router.post("/", validateToken, async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newClient = new Client({
      username,
      password: hashedPassword,
      email,
    });
    await newClient.save();
    res.status(201).json({ message: "Client created successfully", client: newClient });
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ message: "Error creating client", error });
  }
});

// Update a client
router.put("/:id", validateToken, async (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;

  try {
    const updatedData = { username, email };
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    const updatedClient = await Client.findByIdAndUpdate(id, updatedData, { new: true });
    if (!updatedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json({ message: "Client updated successfully", client: updatedClient });
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ message: "Error updating client", error });
  }
});

// Delete a client
router.delete("/:id", validateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedClient = await Client.findByIdAndDelete(id);
    if (!deletedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ message: "Error deleting client", error });
  }
});


module.exports = { router };