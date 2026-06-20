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
  { value: "anime-movie", label: "Anime" },
  { value: "korean-movie", label: "Korean" },
];

export const bookSubtypeOptions = [
  { value: "all", label: "All" },
  { value: "book", label: "General" },
  { value: "korean-book", label: "Korean" },
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
    rating: 5,
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
    rating: 5,
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
    rating: 0,
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
    creator: "Madhouse",
    rating: 5,
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
    rating: 0,
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
  durationMinutesPerEpisode: "",
  studio: "",
  rating: 3,
  notes: "",
  imageUrl: "",
  addedAt: "",
};

export const sortOptions = [
  { value: "recent", label: "Recently added", icon: ClockArrowDown },
  { value: "rating-desc", label: "Highest rated", icon: Star },
  { value: "title-asc", label: "A to Z", icon: ArrowDownAZ },
  { value: "title-desc", label: "Z to A", icon: ArrowUpZA },
];
