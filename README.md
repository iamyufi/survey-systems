📋 Survey System – Complete Installation Guide

Welcome to the Survey System! This open-source project allows you to evaluate website designs using an interactive survey. Follow this guide to install and configure the system.

📌 Table of Contents

🔧 Prerequisites

📂 Setting Up Project Structure

🛠 Backend Installation

🎨 Frontend Installation

📝 Configuring the XML File

🌐 Adding Website Designs

🚀 Running the Application

✅ Testing the System

🐛 Troubleshooting

📢 Final Remarks

🛑 Why node_modules is Not Included

📁 Project Structure Overview

🔧 Prerequisites

Before starting, make sure you have the following installed:

Node.js (version 14 or later)

npm (comes with Node.js)

Git (optional but recommended)

A code editor (Visual Studio Code recommended)

Check your installation with:

📂 Setting Up Project Structure

Create the project folder and structure:

🛠 Backend Installation

1️⃣ Initialize Node.js Project

2️⃣ Install Dependencies

3️⃣ Create .env File

Note: This is a project for demonstration purposes, so the JWT authentication keys and .env file are intentionally public.

4️⃣ Start Backend Server

Difference between node server.js and npm run dev:

npm run dev starts the backend in development mode, utilizing nodemon for automatic restarts on code changes.

node server.js starts the backend in production mode, without automatic restarts.

🎨 Frontend Installation

1️⃣ Create React Project

2️⃣ Install Dependencies

3️⃣ Start Frontend

📝 Configuring the XML File

Create a file at server/data/surveys/survey-questions.xml with the survey content.

Important: The XML survey sheets have pre-coded IDs. To ensure the system works correctly, the XML structure must be properly formatted and contain valid IDs that match the expected format in the code.

🌐 Adding Website Designs

Place your HTML files inside server/public/designs/.

Notice: The website design files must be named specifically as website1.html, website2.html, and website3.html. The system will not recognize them otherwise.

🚀 Running the Application

Open a terminal and start the backend and frontend in separate windows:

The system will be available at:

Frontend: http://localhost:3000

Backend: http://localhost:5000

✅ Testing the System

Navigate to http://localhost:3000

Complete the survey for different website designs

Verify that the data is stored correctly

🐛 Troubleshooting

Backend won't start? ➜ Check the terminal for errors

Frontend displays errors? ➜ Clear cache and restart (npm start)

XML errors? ➜ Ensure the file format is correct and IDs are properly defined

📢 Final Remarks

This project is open-source 🎉 – contributions are welcome! Fork the project and share your improvements with the community.

Disclaimer: This is a project for demonstration purposes. There are no potential security threats, and the coded JWT authentication keys and .env file are intentionally public.

🛑 Why node_modules is Not Included

The node_modules folder is excluded from the repository because:

It is very large (hundreds of megabytes), which would slow down repository performance and make pushes unnecessarily long.

Dependencies are already defined in package.json, meaning they can be reinstalled by running:

Keeping node_modules out of the repo ensures that every developer gets the latest dependencies when setting up the project, avoiding outdated or unnecessary files.

It is a standard practice in modern development to exclude node_modules using a .gitignore file.

By following this approach, developers can simply clone the repo and run npm install to set up the project properly.

📁 Project Structure Overview

sporgeskema-system/
│
├── client/                     # Frontend React application
│   ├── public/                 # Public static files
│   └── src/                    # Source code
│       ├── components/         # React components
│       │   ├── AdminDashboard.js  # Admin dashboard
│       │   ├── AdminLogin.js      # Admin login page
│       │   ├── FarewellScreen.js  # Thank you screen
│       │   ├── Question.js        # Single question component
│       │   ├── QuestionForm.js    # Questions form
│       │   ├── Survey.js          # Main survey component
│       │   ├── WebsiteDisplay.js  # Displays website designs
│       │   └── WelcomeSurvey.js   # Welcome and demographic questions
│       ├── App.css             # Main stylesheet
│       ├── App.js              # Main application component
│       └── index.js            # React entry point
│
└── server/                    # Backend Node.js/Express server
    ├── controllers/           # Business logic
    │   ├── adminController.js # Admin functionality
    │   └── surveyController.js # Survey functionality
    ├── data/                  # Data storage
    │   ├── responses/         # Saved survey responses
    │   └── surveys/           # XML survey definitions
    ├── middleware/            # Express middleware
    │   └── authMiddleware.js  # JWT authentication
    ├── public/                # Public files
    │   └── designs/           # HTML files for website designs
    ├── routes/                # API routes
    │   ├── adminRoutes.js     # Admin route definitions
    │   └── surveyRoutes.js    # Survey route definitions
    ├── utils/                 # Helper functions
    │   └── xmlParser.js       # XML parsing and transformation
    ├── .env                   # Environment variables
    ├── package.json           # NPM dependencies
    └── server.js              # Main server entry point
