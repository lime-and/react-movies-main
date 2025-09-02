import { Client, Databases, ID, Query } from 'appwrite'

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

// Check if Appwrite configuration is available
if (!PROJECT_ID || !DATABASE_ID || !COLLECTION_ID) {
  console.warn('Appwrite configuration is incomplete. Some features may not work properly.');
}

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject(PROJECT_ID || 'dummy-project-id')

const database = new Databases(client);

export const updateSearchCount = async (searchTerm, movie) => {
  // Skip if Appwrite is not configured
  if (!PROJECT_ID || !DATABASE_ID || !COLLECTION_ID) {
    console.log('Appwrite not configured, skipping search count update');
    return;
  }

  // 1. Use Appwrite SDK to check if the search term exists in the database
 try {
  const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal('searchTerm', searchTerm),
  ])

  // 2. If it does, update the count
  if(result.documents.length > 0) {
   const doc = result.documents[0];

   await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
    count: doc.count + 1,
   })
  // 3. If it doesn't, create a new document with the search term and count as 1
  } else {
   await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
    searchTerm,
    count: 1,
    movie_id: movie.id,
    poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
   })
  }
 } catch (error) {
  console.error(error);
 }
}

export const getTrendingMovies = async () => {
  // Skip if Appwrite is not configured
  if (!PROJECT_ID || !DATABASE_ID || !COLLECTION_ID) {
    console.log('Appwrite not configured, returning empty trending movies');
    return [];
  }

 try {
  const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.limit(5),
    Query.orderDesc("count")
  ])

  return result.documents;
 } catch (error) {
  console.error(error);
  return [];
 }
}