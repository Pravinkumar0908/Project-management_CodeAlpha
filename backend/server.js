const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize Firebase Admin SDK
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://promanag-6b374.firebaseapp.com"
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

const db = admin.firestore();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API Routes
app.post('/signup', async (req, res) => {
  const { email, password, role } = req.body;
  
  if (!email || !password || !role) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email, password, and role are required' 
    });
  }

  try {
    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false
    });

    // Store additional user data in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ 
      success: true, 
      message: "Account created successfully! You can now login.",
      uid: userRecord.uid
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ 
      success: false, 
      message: "Error: " + error.message 
    });
  }
});

// Protected routes example (requires auth middleware)
app.get('/api/projects', async (req, res) => {
  // You would add an auth middleware here
  res.json({ message: 'Projects API endpoint' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});