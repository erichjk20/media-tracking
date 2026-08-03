import {
  ArrowDownAZ,
  ArrowUpZA,
  BookOpen,
  Clapperboard,
  ClockArrowDown,
  PanelsTopLeft,
  Star,
  Tv,
} from "lucide-react";

export const categories = [
  { id: "books", label: "Books", creatorLabel: "Author", action: "Read", icon: BookOpen },
  { id: "movies", label: "Movies", creatorLabel: "Director", action: "Watch", icon: Clapperboard },
  { id: "tv", label: "TV Shows", creatorLabel: "Studio / Creator", action: "Watch", icon: Tv },
  { id: "manga", label: "Manga", creatorLabel: "Author / Artist", action: "Read", icon: PanelsTopLeft },
];

export const statuses = ["Completed", "Want to Watch/Read"];

export const statusLabels = {
  Completed: "Done",
  "Want to Watch/Read": "Want",
};

export const omdbTypesByCategory = {
  movies: "movie",
  tv: "series",
};

export const tmdbCanonicalMediaLanguage = "en-US";
export const openLibraryCanonicalBookLanguage = "en";

export const movieSubtypeOptions = [
  { value: "all", label: "All" },
  { value: "movie", label: "General" },
  { value: "anime-movie", label: "Anime", formLabel: "Anime movie" },
  { value: "korean-movie", label: "Korean", formLabel: "Korean movie" },
];

export const bookSubtypeOptions = [
  { value: "all", label: "All" },
  { value: "book", label: "General" },
  { value: "korean-book", label: "Korean", formLabel: "Korean book" },
];

export const tvSubtypeOptions = [
  { value: "all", label: "All" },
  { value: "tv", label: "General" },
  { value: "anime", label: "Anime" },
  { value: "kdrama", label: "Korean" },
];

export const defaultItems = [
  {
    id: "book-1",
    category: "books",
    subtype: "book",
    status: "Completed",
    title: "Piranesi",
    creator: "Susanna Clarke",
    author: "Susanna Clarke",
    pageCount: 245,
    publisher: "Bloomsbury Publishing",
    isbn: "9781635575637",
    rating: 5,
    synopsis: "A man living in an endless house of halls and tides records its wonders while slowly uncovering the truth of who he is and how he arrived there.",
    notes: "",
    imageUrl:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "movie-1",
    category: "movies",
    subtype: "movie",
    status: "Completed",
    title: "Arrival",
    creator: "Denis Villeneuve",
    director: "Denis Villeneuve",
    genre: "Drama, Mystery, Sci-Fi",
    releaseYear: 2016,
    durationMinutes: 116,
    rating: 5,
    synopsis: "A linguist is recruited by the military to communicate with mysterious alien visitors, forcing her to rethink language, time, and the shape of her own life.",
    notes: "",
    imageUrl:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "tv-1",
    category: "tv",
    status: "Want to Watch/Read",
    title: "Severance",
    creator: "Dan Erickson",
    genre: "Sci-Fi, Psychological Thriller",
    releaseYear: 2022,
    seasonCount: 2,
    episodeCount: 19,
    seasonBreakdown: [
      { seasonNumber: 1, name: "Season 1", episodeCount: 9, airDate: "2022-02-18", status: "released" },
      { seasonNumber: 2, name: "Season 2", episodeCount: 10, airDate: "2025-01-17", status: "released" },
    ],
    durationMinutesPerEpisode: 50,
    studio: "Red Hour Productions, Fifth Season",
    rating: 0,
    synopsis: "Employees at Lumon Industries undergo a procedure that splits work memories from personal memories, exposing a strange corporate world beneath the office routine.",
    notes: "",
    imageUrl:
      "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "anime-1",
    category: "tv",
    subtype: "anime",
    status: "Completed",
    title: "Frieren: Beyond Journey's End",
    creator: "Kanehito Yamada, Tsukasa Abe",
    genre: "Adventure, Drama, Fantasy",
    releaseYear: 2023,
    seasonCount: 2,
    episodeCount: 38,
    durationMinutesPerEpisode: 24,
    studio: "Madhouse",
    rating: 5,
    synopsis: "An elf mage reflects on time, grief, and companionship as she retraces the journey she once shared with the heroes who defeated the Demon King.",
    notes: "",
    imageUrl:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "manga-1",
    category: "manga",
    status: "Want to Watch/Read",
    title: "Witch Hat Atelier",
    creator: "Kamome Shirahama",
    author: "Kamome Shirahama",
    artist: "Kamome Shirahama",
    volumeCount: 16,
    chapterCount: 97,
    rating: 0,
    synopsis: "A young girl who dreams of magic discovers a hidden world of spells and apprenticeships after a forbidden act changes her life.",
    notes: "",
    imageUrl:
      "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=600&q=80",
  },
];

export const emptyDraft = {
  id: "",
  category: "books",
  subtype: "",
  status: "Completed",
  title: "",
  creator: "",
  director: "",
  genre: "",
  releaseYear: "",
  durationMinutes: "",
  pageCount: "",
  publisher: "",
  isbn: "",
  author: "",
  artist: "",
  volumeCount: "",
  chapterCount: "",
  seasonCount: "",
  episodeCount: "",
  seasonBreakdown: [],
  durationMinutesPerEpisode: "",
  studio: "",
  rating: 3,
  synopsis: "",
  notes: "",
  imageUrl: "",
  addedAt: "",
  statusChangedAt: "",
};

export const sortOptions = [
  { value: "recent", label: "Recently added", icon: ClockArrowDown },
  { value: "rating-desc", label: "Highest rated", icon: Star },
  { value: "title-asc", label: "A to Z", icon: ArrowDownAZ },
  { value: "title-desc", label: "Z to A", icon: ArrowUpZA },
];
