// Mock data with real studio preview audio and high-resolution cover artwork
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg" }],
          release_date: "2016-11-25"
        },
        duration_ms: 230453,
        popularity: 94,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/11/71/d6/1171d6ad-3c96-e027-2af6-58028426588c/mzaf_15137631797407745471.plus.aac.p.m4a",
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/cb/7b/a9/cb7ba903-b5f1-cc21-90db-7a81b7aa0997/724596951057.jpg/600x600bb.jpg" }],
          release_date: "2011-10-18"
        },
        duration_ms: 243266,
        popularity: 88,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/24/09/79/2409794c-3d5d-af26-580e-7dc00ee4f207/mzaf_369629549966021675.plus.aac.p.m4a",
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/600x600bb.jpg" }],
          release_date: "2020-03-27"
        },
        duration_ms: 203064,
        popularity: 90,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/dc/4d/59dc4dda-93ff-8f1c-c536-f005f6ea6af5/mzaf_3066686759813252385.plus.aac.p.m4a",
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/82/90/14/829014ad-a301-62ab-bee6-f4cca4457411/mzi.hozudery.jpg/600x600bb.jpg" }],
          release_date: "2007-04-23"
        },
        duration_ms: 253586,
        popularity: 87,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d1/0d/ab/d10dabc8-cceb-e718-401f-01516b009460/mzaf_13845311225859403599.plus.aac.p.m4a",
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/6f/bc/e6/6fbce6c4-c38c-72d8-4fd0-66cfff32f679/20UMGIM12176.rgb.jpg/600x600bb.jpg" }],
          release_date: "2020-03-20"
        },
        duration_ms: 361000,
        popularity: 89,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/54/2b/61/542b6133-80f7-f30f-4dcf-059490db9d84/mzaf_1539067797902127760.plus.aac.p.m4a",
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
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg" }],
        popularity: 98
      },
      {
        id: "mock_a2",
        name: "Dua Lipa",
        genres: ["dance pop", "pop", "uk pop"],
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/600x600bb.jpg" }],
        popularity: 92
      },
      {
        id: "mock_a3",
        name: "M83",
        genres: ["dream pop", "indietronica", "shoegaze"],
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/cb/7b/a9/cb7ba903-b5f1-cc21-90db-7a81b7aa0997/724596951057.jpg/600x600bb.jpg" }],
        popularity: 82
      },
      {
        id: "mock_a4",
        name: "Arctic Monkeys",
        genres: ["garage rock", "indie rock", "modern rock"],
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/82/90/14/829014ad-a301-62ab-bee6-f4cca4457411/mzi.hozudery.jpg/600x600bb.jpg" }],
        popularity: 88
      },
      {
        id: "mock_a5",
        name: "Daft Punk",
        genres: ["electro", "french synth-disco", "house"],
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e8/43/5f/e8435ffa-b6b9-b171-40ab-4ff3959ab661/886443919266.jpg/600x600bb.jpg" }],
        popularity: 89
      }
    ],
    stats: {
      dominantGenre: "Synthwave / Dark Disco",
      vibeLabel: "Neon Night Drive",
      energyScore: 86,
      danceScore: 78,
      obscurityScore: 64,
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e8/43/5f/e8435ffa-b6b9-b171-40ab-4ff3959ab661/886443919266.jpg/600x600bb.jpg" }],
          release_date: "2013-05-17"
        },
        duration_ms: 337560,
        popularity: 85,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/dc/1e/c2/dc1ec21b-96a0-470c-ee89-2b09346fa847/mzaf_7827098614541126525.plus.aac.p.m4a",
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/69/9c/b5/699cb5d6-115c-ff73-9d26-e57ea4350d72/887828031795.png/600x600bb.jpg" }],
          release_date: "2013-09-09"
        },
        duration_ms: 272394,
        popularity: 93,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/89/ae/42/89ae4206-048a-7eae-3eaf-c3abd02914fb/mzaf_15551176804491638370.plus.aac.p.m4a",
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/600x600bb.jpg" }],
          release_date: "2020-03-20"
        },
        duration_ms: 200040,
        popularity: 96,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/73/ca/1273ca46-233a-5331-189b-25ac1d656533/mzaf_976341070785891411.plus.aac.p.m4a",
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/09/e0/d5/09e0d559-0682-f0f0-5e0c-3cd11e3114fd/beachhouse_depressioncherry_2400_300.jpg/600x600bb.jpg" }],
          release_date: "2015-08-28"
        },
        duration_ms: 320466,
        popularity: 89,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/41/61/14/416114cc-282e-4c76-2808-a3eb9c3f973d/mzaf_6665874998714897722.plus.aac.p.m4a",
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/5e/07/53/5e0753c1-f3fb-e464-908f-8efc0a249b9b/652637320886.png/600x600bb.jpg" }],
          release_date: "2012-01-31"
        },
        duration_ms: 255280,
        popularity: 79,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c4/c3/ef/c4c3ef1f-532d-d5db-21df-8ac5af81a993/mzaf_11908992876567282921.plus.aac.p.m4a",
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
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e8/43/5f/e8435ffa-b6b9-b171-40ab-4ff3959ab661/886443919266.jpg/600x600bb.jpg" }],
        popularity: 91
      },
      {
        id: "mock_am2",
        name: "The Weeknd",
        genres: ["pop", "r&b"],
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg" }],
        popularity: 98
      },
      {
        id: "mock_am3",
        name: "Beach House",
        genres: ["dream pop", "indie pop"],
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/09/e0/d5/09e0d559-0682-f0f0-5e0c-3cd11e3114fd/beachhouse_depressioncherry_2400_300.jpg/600x600bb.jpg" }],
        popularity: 83
      },
      {
        id: "mock_am4",
        name: "Arctic Monkeys",
        genres: ["sheffield indie", "rock"],
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/69/9c/b5/699cb5d6-115c-ff73-9d26-e57ea4350d72/887828031795.png/600x600bb.jpg" }],
        popularity: 88
      },
      {
        id: "mock_am5",
        name: "Grimes",
        genres: ["art pop", "electropop"],
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/5e/07/53/5e0753c1-f3fb-e464-908f-8efc0a249b9b/652637320886.png/600x600bb.jpg" }],
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e2/65/b2/e265b2ae-48d5-9dd8-0251-6cd6c6c4eb53/190295842826.jpg/600x600bb.jpg" }],
          release_date: "1977-10-14"
        },
        duration_ms: 367200,
        popularity: 82,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/1f/f3/12/1ff3122a-eb3e-373d-d524-cfe00de9b19a/mzaf_8446634475827049231.plus.aac.p.m4a",
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e8/43/5f/e8435ffa-b6b9-b171-40ab-4ff3959ab661/886443919266.jpg/600x600bb.jpg" }],
          release_date: "2013-05-17"
        },
        duration_ms: 369626,
        popularity: 87,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/57/a5/85/57a585aa-f1bc-7619-881b-f8a04a5541d5/mzaf_6906185026678279401.plus.aac.p.m4a",
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/31/2e/2d/312e2da7-6277-3f91-221a-bc0739a8183b/mzi.kjsrfisp.jpg/600x600bb.jpg" }],
          release_date: "1983-03-07"
        },
        duration_ms: 450000,
        popularity: 78,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/0f/43/1c/0f431c1a-119c-6614-2736-3fbc4c8a597c/mzaf_3646998447648845325.plus.aac.p.m4a",
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a0/9a/2c/a09a2ca3-a5a6-814b-0af7-640dc0aef0aa/091012682261.jpg/600x600bb.jpg" }],
          release_date: "2015-07-17"
        },
        duration_ms: 216320,
        popularity: 91,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8b/55/f3/8b55f3a3-3204-8930-f156-82843546950e/mzaf_9370328603131228430.plus.aac.p.m4a",
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
          images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e4/4c/dc/e44cdc30-89d8-1b46-8e1f-57c0bbbc9ce7/825646051175.jpg/600x600bb.jpg" }],
          release_date: "1986-09-29"
        },
        duration_ms: 262333,
        popularity: 76,
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/fe/1d/62/fe1d62bd-f1f0-6293-20f0-a20d436e0e69/mzaf_4982129497529076018.plus.aac.p.m4a",
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
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e8/43/5f/e8435ffa-b6b9-b171-40ab-4ff3959ab661/886443919266.jpg/600x600bb.jpg" }],
        popularity: 90
      },
      {
        id: "mock_al2",
        name: "David Bowie",
        genres: ["glam rock", "art rock", "classic rock"],
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e2/65/b2/e265b2ae-48d5-9dd8-0251-6cd6c6c4eb53/190295842826.jpg/600x600bb.jpg" }],
        popularity: 84
      },
      {
        id: "mock_al3",
        name: "New Order",
        genres: ["madchester", "post-punk", "synthpop"],
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/31/2e/2d/312e2da7-6277-3f91-221a-bc0739a8183b/mzi.kjsrfisp.jpg/600x600bb.jpg" }],
        popularity: 77
      },
      {
        id: "mock_al4",
        name: "Tame Impala",
        genres: ["neo-psychedelia", "indie rock"],
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a0/9a/2c/a09a2ca3-a5a6-814b-0af7-640dc0aef0aa/091012682261.jpg/600x600bb.jpg" }],
        popularity: 89
      },
      {
        id: "mock_al5",
        name: "The Weeknd",
        genres: ["pop", "r&b"],
        images: [{ url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg" }],
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
