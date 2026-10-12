// Mock data for immediate preview and testing without needing Spotify API keys
export const mockData = {
  short_term: { // Past 4 Weeks
    user: {
      display_name: "Alex Rivera",
      id: "alexrivera_vibes",
      images: [{ url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" }],
      followers: { total: 482 },
      product: "premium"
    },
    topTracks: [
      {
        id: "mock_t1",
        name: "Starboy",
        artists: [{ name: "The Weeknd" }, { name: "Daft Punk" }],
        album: {
          name: "Starboy",
          images: [{ url: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=500&q=80" }],
          release_date: "2016-11-25"
        },
        duration_ms: 230453,
        popularity: 94,
        preview_url: null, // synthesized preview will be used
        energy: 0.85,
        danceability: 0.78,
        valence: 0.62
      },
      {
        id: "mock_t2",
        name: "Midnight City",
        artists: [{ name: "M83" }],
        album: {
          name: "Hurry Up, We're Dreaming",
          images: [{ url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80" }],
          release_date: "2011-10-18"
        },
        duration_ms: 243266,
        popularity: 88,
        preview_url: null,
        energy: 0.91,
        danceability: 0.71,
        valence: 0.55
      },
      {
        id: "mock_t3",
        name: "Levitating",
        artists: [{ name: "Dua Lipa" }],
        album: {
          name: "Future Nostalgia",
          images: [{ url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80" }],
          release_date: "2020-03-27"
        },
        duration_ms: 203064,
        popularity: 90,
        preview_url: null,
        energy: 0.88,
        danceability: 0.85,
        valence: 0.92
      },
      {
        id: "mock_t4",
        name: "505",
        artists: [{ name: "Arctic Monkeys" }],
        album: {
          name: "Favourite Worst Nightmare",
          images: [{ url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=500&q=80" }],
          release_date: "2007-04-23"
        },
        duration_ms: 253586,
        popularity: 87,
        preview_url: null,
        energy: 0.74,
        danceability: 0.42,
        valence: 0.38
      },
      {
        id: "mock_t5",
        name: "After Hours",
        artists: [{ name: "The Weeknd" }],
        album: {
          name: "After Hours",
          images: [{ url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=500&q=80" }],
          release_date: "2020-03-20"
        },
        duration_ms: 361000,
        popularity: 89,
        preview_url: null,
        energy: 0.82,
        danceability: 0.67,
        valence: 0.45
      }
    ],
    topArtists: [
      {
        id: "mock_a1",
        name: "The Weeknd",
        genres: ["canadian contemporary r&b", "pop", "synth-pop"],
        images: [{ url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80" }],
        popularity: 98
      },
      {
        id: "mock_a2",
        name: "Dua Lipa",
        genres: ["dance pop", "pop", "uk pop"],
        images: [{ url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" }],
        popularity: 92
      },
      {
        id: "mock_a3",
        name: "M83",
        genres: ["dream pop", "indietronica", "shoegaze"],
        images: [{ url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80" }],
        popularity: 82
      },
      {
        id: "mock_a4",
        name: "Arctic Monkeys",
        genres: ["garage rock", "indie rock", "modern rock"],
        images: [{ url: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=400&q=80" }],
        popularity: 88
      },
      {
        id: "mock_a5",
        name: "Daft Punk",
        genres: ["electro", "french synth-disco", "house"],
        images: [{ url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80" }],
        popularity: 89
      }
    ],
    stats: {
      dominantGenre: "Synthwave / Dark Disco",
      vibeLabel: "Neon Night Drive",
      energyScore: 86,
      danceScore: 78,
      obscurityScore: 64, // 100 = full underground, 0 = mainstream radio
      tempoBpm: 124
    }
  },
  medium_term: { // Past 6 Months
    user: {
      display_name: "Alex Rivera",
      id: "alexrivera_vibes",
      images: [{ url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" }],
      followers: { total: 482 },
      product: "premium"
    },
    topTracks: [
      {
        id: "mock_m1",
        name: "Instant Crush",
        artists: [{ name: "Daft Punk" }, { name: "Julian Casablancas" }],
        album: {
          name: "Random Access Memories",
          images: [{ url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=80" }],
          release_date: "2013-05-17"
        },
        duration_ms: 337560,
        popularity: 85,
        preview_url: null,
        energy: 0.79,
        danceability: 0.65,
        valence: 0.58
      },
      {
        id: "mock_m2",
        name: "Do I Wanna Know?",
        artists: [{ name: "Arctic Monkeys" }],
        album: {
          name: "AM",
          images: [{ url: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=500&q=80" }],
          release_date: "2013-09-09"
        },
        duration_ms: 272394,
        popularity: 93,
        preview_url: null,
        energy: 0.71,
        danceability: 0.55,
        valence: 0.41
      },
      {
        id: "mock_m3",
        name: "Blinding Lights",
        artists: [{ name: "The Weeknd" }],
        album: {
          name: "After Hours",
          images: [{ url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=500&q=80" }],
          release_date: "2020-03-20"
        },
        duration_ms: 200040,
        popularity: 96,
        preview_url: null,
        energy: 0.94,
        danceability: 0.81,
        valence: 0.86
      },
      {
        id: "mock_m4",
        name: "Space Song",
        artists: [{ name: "Beach House" }],
        album: {
          name: "Depression Cherry",
          images: [{ url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=500&q=80" }],
          release_date: "2015-08-28"
        },
        duration_ms: 320466,
        popularity: 89,
        preview_url: null,
        energy: 0.52,
        danceability: 0.39,
        valence: 0.28
      },
      {
        id: "mock_m5",
        name: "Genesis",
        artists: [{ name: "Grimes" }],
        album: {
          name: "Visions",
          images: [{ url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80" }],
          release_date: "2012-01-31"
        },
        duration_ms: 255280,
        popularity: 79,
        preview_url: null,
        energy: 0.83,
        danceability: 0.73,
        valence: 0.60
      }
    ],
    topArtists: [
      {
        id: "mock_am1",
        name: "Daft Punk",
        genres: ["electro", "synthpop", "disco"],
        images: [{ url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80" }],
        popularity: 91
      },
      {
        id: "mock_am2",
        name: "The Weeknd",
        genres: ["pop", "r&b"],
        images: [{ url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80" }],
        popularity: 98
      },
      {
        id: "mock_am3",
        name: "Beach House",
        genres: ["dream pop", "indie pop"],
        images: [{ url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80" }],
        popularity: 83
      },
      {
        id: "mock_am4",
        name: "Arctic Monkeys",
        genres: ["sheffield indie", "rock"],
        images: [{ url: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=400&q=80" }],
        popularity: 88
      },
      {
        id: "mock_am5",
        name: "Grimes",
        genres: ["art pop", "electropop"],
        images: [{ url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80" }],
        popularity: 79
      }
    ],
    stats: {
      dominantGenre: "Dream Pop / French House",
      vibeLabel: "Ethereal Nostalgia",
      energyScore: 78,
      danceScore: 68,
      obscurityScore: 76,
      tempoBpm: 118
    }
  },
  long_term: { // All Time
    user: {
      display_name: "Alex Rivera",
      id: "alexrivera_vibes",
      images: [{ url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" }],
      followers: { total: 482 },
      product: "premium"
    },
    topTracks: [
      {
        id: "mock_l1",
        name: "Heroes",
        artists: [{ name: "David Bowie" }],
        album: {
          name: "\"Heroes\"",
          images: [{ url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80" }],
          release_date: "1977-10-14"
        },
        duration_ms: 367200,
        popularity: 82,
        preview_url: null,
        energy: 0.81,
        danceability: 0.51,
        valence: 0.54
      },
      {
        id: "mock_l2",
        name: "Get Lucky",
        artists: [{ name: "Daft Punk" }, { name: "Pharrell Williams" }],
        album: {
          name: "Random Access Memories",
          images: [{ url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=80" }],
          release_date: "2013-05-17"
        },
        duration_ms: 369626,
        popularity: 87,
        preview_url: null,
        energy: 0.89,
        danceability: 0.89,
        valence: 0.88
      },
      {
        id: "mock_l3",
        name: "Blue Monday",
        artists: [{ name: "New Order" }],
        album: {
          name: "Substance",
          images: [{ url: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=500&q=80" }],
          release_date: "1983-03-07"
        },
        duration_ms: 450000,
        popularity: 78,
        preview_url: null,
        energy: 0.93,
        danceability: 0.82,
        valence: 0.74
      },
      {
        id: "mock_l4",
        name: "The Less I Know The Better",
        artists: [{ name: "Tame Impala" }],
        album: {
          name: "Currents",
          images: [{ url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=500&q=80" }],
          release_date: "2015-07-17"
        },
        duration_ms: 216320,
        popularity: 91,
        preview_url: null,
        energy: 0.76,
        danceability: 0.74,
        valence: 0.78
      },
      {
        id: "mock_l5",
        name: "Bizarre Love Triangle",
        artists: [{ name: "New Order" }],
        album: {
          name: "Brotherhood",
          images: [{ url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=500&q=80" }],
          release_date: "1986-09-29"
        },
        duration_ms: 262333,
        popularity: 76,
        preview_url: null,
        energy: 0.86,
        danceability: 0.77,
        valence: 0.82
      }
    ],
    topArtists: [
      {
        id: "mock_al1",
        name: "Daft Punk",
        genres: ["french house", "electronic", "electro"],
        images: [{ url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80" }],
        popularity: 90
      },
      {
        id: "mock_al2",
        name: "David Bowie",
        genres: ["glam rock", "art rock", "classic rock"],
        images: [{ url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80" }],
        popularity: 84
      },
      {
        id: "mock_al3",
        name: "New Order",
        genres: ["madchester", "post-punk", "synthpop"],
        images: [{ url: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80" }],
        popularity: 77
      },
      {
        id: "mock_al4",
        name: "Tame Impala",
        genres: ["neo-psychedelia", "indie rock"],
        images: [{ url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80" }],
        popularity: 89
      },
      {
        id: "mock_al5",
        name: "The Weeknd",
        genres: ["pop", "r&b"],
        images: [{ url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80" }],
        popularity: 98
      }
    ],
    stats: {
      dominantGenre: "Post-Punk & Neo-Psychedelia",
      vibeLabel: "Timeless Sonic Architecture",
      energyScore: 84,
      danceScore: 76,
      obscurityScore: 82,
      tempoBpm: 126
    }
  }
};
