# React Movies App Setup

## Environment Variables Setup

To fix the black screen issue, you need to create a `.env` file in the root directory with the following environment variables:

### 1. Create a `.env` file

Create a file named `.env` in the root directory of your project with the following content:

```env
# TMDB API Configuration
# Get your API key from https://www.themoviedb.org/settings/api
VITE_TMDB_API_KEY=your_tmdb_api_key_here

# Appwrite Configuration (Optional - for trending movies feature)
# Replace with your actual Appwrite project details
VITE_APPWRITE_PROJECT_ID=your_appwrite_project_id_here
VITE_APPWRITE_DATABASE_ID=your_appwrite_database_id_here
VITE_APPWRITE_COLLECTION_ID=your_appwrite_collection_id_here
```

### 2. Get TMDB API Key

1. Go to [The Movie Database (TMDB)](https://www.themoviedb.org/)
2. Create an account or log in
3. Go to Settings > API
4. Request an API key (it's free)
5. Copy your API key and replace `your_tmdb_api_key_here` in the `.env` file

### 3. Appwrite Setup (Optional)

The Appwrite configuration is optional. If you don't set it up, the trending movies feature won't work, but the main movie search functionality will still work.

1. Go to [Appwrite](https://appwrite.io/)
2. Create a project
3. Set up a database and collection
4. Copy the project ID, database ID, and collection ID to your `.env` file

### 4. Restart the Development Server

After creating the `.env` file:

```bash
npm run dev
```

## What Was Fixed

The black screen issue was caused by:
1. Missing environment variables causing API calls to fail
2. The app crashing when trying to access undefined API keys
3. No error handling for missing configuration

The app now:
- Shows helpful error messages when configuration is missing
- Gracefully handles missing Appwrite configuration
- Continues to work even without Appwrite setup (trending movies feature will be disabled)
