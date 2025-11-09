# Quick Setup Guide

## Environment Variables Setup

The application requires MongoDB connection. Follow these steps:

### Option 1: Local MongoDB

1. Install MongoDB locally if not already installed
2. Start MongoDB service:
   ```bash
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On macOS with Homebrew
   brew services start mongodb-community
   ```

3. Your `.env.local` should have:
   ```
   MONGODB_URI=mongodb://localhost:27017/tax-calculator
   ```

### Option 2: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/tax-calculator?retryWrites=true&w=majority
   ```

## Database Seeding

After setting up MongoDB, seed the database:

```bash
npm run seed
```

You should see output like:
```
Connected to MongoDB
Cleared existing tax slabs
Inserted 3 tax slabs
Created index on assessmentYear and regime

Seeded tax slabs:
  - 2023-24 (new regime)
  - 2024-25 (new regime)
  - 2025-26 (new regime)

Database seeding completed!
```

## Running the Application

```bash
npm run dev
```

Visit http://localhost:3000

## Troubleshooting

### MongoDB Connection Error

If you see a MongoDB connection error:

1. Check if MongoDB is running (for local MongoDB)
2. Verify your connection string in `.env.local`
3. For Atlas, ensure your IP is whitelisted
4. Check your username and password are correct

### No Tax Slabs Showing

If the dropdown is empty:

1. Make sure you ran `npm run seed`
2. Check the browser console for API errors
3. Verify MongoDB connection

### Port Already in Use

If port 3000 is busy:

```bash
npm run dev -- -p 3001
```

This will start the app on port 3001 instead.
