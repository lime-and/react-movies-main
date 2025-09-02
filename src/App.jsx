import { useEffect, useState } from 'react'
import Search from './components/Search.jsx'
import Spinner from './components/Spinner.jsx'
import MovieCard from './components/MovieCard.jsx'
import { useDebounce } from 'react-use'
import { getTrendingMovies, updateSearchCount } from './appwrite.js'

const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Check if API key is available
if (!API_KEY) {
  console.error('VITE_TMDB_API_KEY is not set. Please create a .env file with your TMDB API key.');
}

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('');

  const [movieList, setMovieList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [movieVideos, setMovieVideos] = useState(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  // Debounce the search term to prevent making too many API requests
  // by waiting for the user to stop typing for 500ms
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');

    // Check if API key is available
    if (!API_KEY) {
      setErrorMessage('TMDB API key is not configured. Please check your environment variables.');
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);

      if(!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();

      if(data.Response === 'False') {
        setErrorMessage(data.Error || 'Failed to fetch movies');
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);

      if(query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Error fetching movies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    // Check if API key is available
    if (!API_KEY) {
      console.log('TMDB API key not available, skipping trending movies');
      return;
    }

    setIsLoadingTrending(true);
    try {
      // First try to get trending movies from TMDB API
      const response = await fetch(`${API_BASE_URL}/trending/movie/week`, API_OPTIONS);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trending movies');
      }
      
      const data = await response.json();
      setTrendingMovies(data.results?.slice(0, 5) || []); // Get top 5 trending movies
    } catch (error) {
      console.error(`Error fetching trending movies from TMDB: ${error}`);
      
      // Fallback to Appwrite if TMDB fails
      try {
        const movies = await getTrendingMovies();
        setTrendingMovies(movies);
      } catch (appwriteError) {
        console.error(`Error fetching trending movies from Appwrite: ${appwriteError}`);
        setTrendingMovies([]);
      }
    } finally {
      setIsLoadingTrending(false);
    }
  }

  const fetchMovieDetails = async (movieId) => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`${API_BASE_URL}/movie/${movieId}`, API_OPTIONS);
      
      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }
      
      const data = await response.json();
      setMovieDetails(data);
    } catch (error) {
      console.error(`Error fetching movie details: ${error}`);
    } finally {
      setIsLoadingDetails(false);
    }
  }

  const fetchMovieVideos = async (movieId) => {
    setIsLoadingVideos(true);
    try {
      const response = await fetch(`${API_BASE_URL}/movie/${movieId}/videos`, API_OPTIONS);
      
      if (!response.ok) {
        throw new Error('Failed to fetch movie videos');
      }
      
      const data = await response.json();
      setMovieVideos(data);
    } catch (error) {
      console.error(`Error fetching movie videos: ${error}`);
      setMovieVideos(null);
    } finally {
      setIsLoadingVideos(false);
    }
  }

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    fetchMovieDetails(movie.id);
    fetchMovieVideos(movie.id);
  }

  const closeMovieDetails = () => {
    setSelectedMovie(null);
    setMovieDetails(null);
    setMovieVideos(null);
  }

  // Helper function to get the best trailer from videos
  const getTrailerVideo = () => {
    if (!movieVideos?.results) return null;
    
    // Look for official trailers first
    const officialTrailer = movieVideos.results.find(video => 
      video.type === 'Trailer' && video.official === true
    );
    
    if (officialTrailer) return officialTrailer;
    
    // Fallback to any trailer
    const anyTrailer = movieVideos.results.find(video => 
      video.type === 'Trailer'
    );
    
    if (anyTrailer) return anyTrailer;
    
    // Fallback to teaser
    const teaser = movieVideos.results.find(video => 
      video.type === 'Teaser'
    );
    
    return teaser || null;
  }

  // Helper function to get the trailer embed URL
  const getTrailerEmbedUrl = (video) => {
    if (!video) return null;
    
    if (video.site === 'YouTube') {
      return `https://www.youtube.com/embed/${video.key}`;
    } else if (video.site === 'Vimeo') {
      return `https://player.vimeo.com/video/${video.key}`;
    }
    
    return null;
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern"/>

      <div className="wrapper">
        <header className="hero">
          <div className="hero__col hero__content">
            <p className="badge">New • Weekly picks powered by TMDB</p>
            <h1>
              Find <span className="text-gradient">movies</span> you'll love
            </h1>
            <p className="subtitle">
              Discover trending hits and hidden gems. Search thousands of titles and watch trailers instantly.
            </p>

            <div className="hero__actions">
              <a href="#trending" className="btn btn--primary">Browse Trending</a>
              <button type="button" className="btn btn--ghost" onClick={() => {
                if (trendingMovies.length > 0) {
                  const random = trendingMovies[Math.floor(Math.random() * trendingMovies.length)];
                  handleMovieClick(random);
                }
              }}>Surprise Me</button>
            </div>

            <div className="hero__search">
              <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>
          </div>

          <div className="hero__col hero__visual">
            <img className="hero__image" src="./hero.png" alt="Enjoy movies" />
          </div>
        </header>

        <section id="trending" className="trending">
          <h2>Trending Movies This Week</h2>

          {isLoadingTrending ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : trendingMovies.length > 0 ? (
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.id || movie.$id} className="cursor-pointer hover:scale-105 transition-transform duration-200" onClick={() => handleMovieClick(movie)}>
                  <p className="fancy-text">{index + 1}</p>
                  <img 
                    src={movie.poster_path ? 
                      `https://image.tmdb.org/t/p/w500/${movie.poster_path}` : 
                      movie.poster_url || '/no-movie.png'
                    } 
                    alt={movie.title} 
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center py-8">No trending movies available</p>
          )}
        </section>

        <section className="all-movies">
          <h2>All Movies</h2>

          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onClick={() => handleMovieClick(movie)} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Movie Details Modal */}
      {selectedMovie && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeMovieDetails}
        >
          <div 
            className="bg-dark-100 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-white">{selectedMovie.title}</h2>
                <button 
                  onClick={closeMovieDetails}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              {isLoadingDetails ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : movieDetails ? (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <img 
                      src={movieDetails.poster_path ? 
                        `https://image.tmdb.org/t/p/w500/${movieDetails.poster_path}` : 
                        '/no-movie.png'
                      }
                      alt={movieDetails.title}
                      className="w-full md:w-64 h-auto rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <img src="star.svg" alt="Star" className="w-4 h-4" />
                        <span className="text-white font-bold">
                          {movieDetails.vote_average ? movieDetails.vote_average.toFixed(1) : 'N/A'}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-400">
                          {movieDetails.release_date ? movieDetails.release_date.split('-')[0] : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-white font-semibold mb-2">Genres:</h3>
                        <div className="flex flex-wrap gap-2">
                          {movieDetails.genres?.map(genre => (
                            <span key={genre.id} className="bg-purple-600 text-white px-2 py-1 rounded text-sm">
                              {genre.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-white font-semibold mb-2">Runtime:</h3>
                        <p className="text-gray-300">{movieDetails.runtime} minutes</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-semibold mb-2">Overview:</h3>
                    <p className="text-gray-300 leading-relaxed">{movieDetails.overview}</p>
                  </div>
                  
                  {/* Trailer Section */}
                  <div>
                    <h3 className="text-white font-semibold mb-2">Trailer:</h3>
                    {isLoadingVideos ? (
                      <div className="flex justify-center py-4">
                        <Spinner />
                      </div>
                    ) : getTrailerVideo() ? (
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute top-0 left-0 w-full h-full rounded-lg"
                          src={getTrailerEmbedUrl(getTrailerVideo())}
                          title={`${movieDetails.title} Trailer`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">No trailer available for this movie</p>
                    )}
                  </div>
                  
                  {movieDetails.production_companies && movieDetails.production_companies.length > 0 && (
                    <div>
                      <h3 className="text-white font-semibold mb-2">Production Companies:</h3>
                      <p className="text-gray-300">
                        {movieDetails.production_companies.map(company => company.name).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-red-500">Failed to load movie details</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
