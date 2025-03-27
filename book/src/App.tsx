import React, { useState, useEffect } from 'react';
import { BookOpen, Search, BookMarked, TrendingUp, Loader2, Filter, X, Heart, HeartOff, Globe2, Calendar, User, Library, ArrowLeft } from 'lucide-react';
import InfiniteScroll from 'react-infinite-scroll-component';

type Book = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  language?: string[];
  description?: string;
  publisher?: string[];
  number_of_pages?: number;
};

const genres = [
  "All",
  "Fiction",
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Romance",
  "Thriller",
  "Horror",
  "Biography",
  "History",
  "Science",
  "Philosophy",
  "Poetry",
  "Drama",
  "Art"
];

const languages = [
  "eng", "fre", "spa", "ger", "ita", "rus", "chi", "jpn", "kor", "ara", 
  "hin", "por", "dut", "swe", "pol", "tur", "dan", "nor", "fin", "gre", 
  "hun", "cze", "rum", "vie", "tha", "heb", "ukr", "ben", "tam"
];

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("eng");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showReadingList, setShowReadingList] = useState(false);
  const [readingList, setReadingList] = useState<string[]>(() => {
    const saved = localStorage.getItem('readingList');
    return saved ? JSON.parse(saved) : [];
  });
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);

  useEffect(() => {
    localStorage.setItem('readingList', JSON.stringify(readingList));
    if (showReadingList) {
      fetchSavedBooks();
    }
  }, [readingList, showReadingList]);

  const fetchSavedBooks = async () => {
    const savedBooksData = [];
    for (const key of readingList) {
      const bookId = key.replace('/works/', '');
      try {
        const response = await fetch(`https://openlibrary.org/works/${bookId}.json`);
        const data = await response.json();
        savedBooksData.push({
          key: key,
          title: data.title,
          author_name: data.authors?.map((a: any) => a.name) || [],
          cover_i: data.covers?.[0],
          first_publish_year: data.first_publish_year,
          subject: data.subjects || [],
        });
      } catch (error) {
        console.error("Error fetching saved book:", error);
      }
    }
    setSavedBooks(savedBooksData);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
      setBooks([]);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!showReadingList) {
      fetchBooks();
    }
  }, [debouncedSearch, selectedGenre, selectedLanguage, page, showReadingList]);

  const fetchBooks = async () => {
    if (loading) return;
    setLoading(true);

    try {
      let query = debouncedSearch || "popular";
      if (selectedGenre !== "All") {
        query += ` subject:${selectedGenre.toLowerCase()}`;
      }

      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&language=${selectedLanguage}&page=${page}&limit=20`
      );
      const data = await response.json();

      if (page === 1) {
        setBooks(data.docs);
      } else {
        setBooks(prev => [...prev, ...data.docs]);
      }

      setHasMore(data.docs.length > 0);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const getCoverUrl = (coverId: number) => {
    return coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400";
  };

  const toggleReadingList = (bookKey: string) => {
    setReadingList(prev => 
      prev.includes(bookKey)
        ? prev.filter(key => key !== bookKey)
        : [...prev, bookKey]
    );
  };

  const renderBookGrid = (bookList: Book[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {bookList.map((book, index) => (
        <div
          key={`${book.key}-${index}`}
          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <div 
            className="relative h-64 cursor-pointer"
            onClick={() => setSelectedBook(book)}
          >
            <img
              src={getCoverUrl(book.cover_i || 0)}
              alt={book.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button 
              className="absolute bottom-4 right-4 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                toggleReadingList(book.key);
              }}
            >
              {readingList.includes(book.key) ? (
                <Heart className="h-5 w-5 text-red-500 fill-current" />
              ) : (
                <HeartOff className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer"
                onClick={() => setSelectedBook(book)}>
              {book.title}
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              {book.author_name?.[0] || 'Unknown Author'}
            </p>
            {book.first_publish_year && (
              <p className="text-gray-500 text-sm mb-3">
                First published: {book.first_publish_year}
              </p>
            )}
            {book.subject && (
              <div className="flex flex-wrap gap-2">
                {book.subject.slice(0, 3).map((subject, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-indigo-50 text-indigo-800 text-xs px-2 py-1 rounded-full"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-10 w-10" />
              <h1 className="text-3xl font-bold tracking-tight">BookMind</h1>
            </div>
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none md:min-w-[300px]">
                <input
                  type="text"
                  placeholder="Search millions of books..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 bg-white/90 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors duration-200"
              >
                <Filter className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setShowReadingList(!showReadingList);
                  setSearchQuery('');
                }}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors duration-200"
              >
                {showReadingList ? (
                  <ArrowLeft className="h-5 w-5" />
                ) : (
                  <Library className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Genre</h4>
                  <div className="flex flex-wrap gap-2">
                    {genres.map(genre => (
                      <button
                        key={genre}
                        onClick={() => setSelectedGenre(genre)}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                          selectedGenre === genre
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 hover:bg-white/20'
                        } transition-colors duration-200`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Language</h4>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang}>
                        {new Intl.DisplayNames(['en'], { type: 'language' }).of(lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="flex items-center space-x-2 mb-8">
            {showReadingList ? (
              <>
                <Library className="h-6 w-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">Reading List ({savedBooks.length} books)</h2>
              </>
            ) : (
              <>
                <TrendingUp className="h-6 w-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchQuery ? 'Search Results' : 'Popular Books'}
                </h2>
              </>
            )}
          </div>

          {showReadingList ? (
            savedBooks.length > 0 ? (
              renderBookGrid(savedBooks)
            ) : (
              <div className="text-center py-12">
                <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Your reading list is empty</h3>
                <p className="text-gray-500">Start adding books by clicking the heart icon on any book card.</p>
              </div>
            )
          ) : (
            <InfiniteScroll
              dataLength={books.length}
              next={loadMore}
              hasMore={hasMore}
              loader={
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                </div>
              }
            >
              {renderBookGrid(books)}
            </InfiniteScroll>
          )}
        </section>
      </main>

      {/* Book Details Modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedBook.title}</h2>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <img
                    src={getCoverUrl(selectedBook.cover_i || 0)}
                    alt={selectedBook.title}
                    className="w-full rounded-lg shadow-lg"
                  />
                  <button
                    onClick={() => toggleReadingList(selectedBook.key)}
                    className="mt-4 w-full py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    {readingList.includes(selectedBook.key) ? (
                      <>
                        <Heart className="h-5 w-5 fill-current" />
                        <span>Remove from Reading List</span>
                      </>
                    ) : (
                      <>
                        <HeartOff className="h-5 w-5" />
                        <span>Add to Reading List</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <User className="h-5 w-5 text-indigo-600" />
                      Authors
                    </h3>
                    <p className="text-gray-700">
                      {selectedBook.author_name?.join(', ') || 'Unknown Author'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-indigo-600" />
                      Publication Details
                    </h3>
                    <p className="text-gray-700">
                      First published: {selectedBook.first_publish_year || 'Unknown'}
                      {selectedBook.publisher && (
                        <>
                          <br />
                          Publisher: {selectedBook.publisher[0]}
                        </>
                      )}
                      {selectedBook.number_of_pages && (
                        <>
                          <br />
                          Pages: {selectedBook.number_of_pages}
                        </>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Globe2 className="h-5 w-5 text-indigo-600" />
                      Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBook.language?.map((lang, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-indigo-50 text-indigo-800 px-3 py-1 rounded-full text-sm"
                        >
                          {new Intl.DisplayNames(['en'], { type: 'language' }).of(lang)}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {selectedBook.subject && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Subjects</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedBook.subject.slice(0, 8).map((subject, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-purple-50 text-purple-800 px-3 py-1 rounded-full text-sm"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-6 w-6" />
                <span className="text-xl font-bold">BookMind</span>
              </div>
              <p className="text-gray-400">
                Discover millions of books from around the world.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Popular Books
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    New Releases
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Top Authors
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <ul className="space-y-2 text-gray-400">
                {genres.slice(1, 5).map(genre => (
                  <li key={genre}>
                    <a href="#" className="hover:text-white transition-colors duration-200">
                      {genre}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">About</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2024 BookMind. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;