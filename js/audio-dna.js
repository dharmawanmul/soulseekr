/**
 * Soulseekr — Spotify Audio DNA: Interactive Wrapped Listening Explorer
 * Museum-Grade Deep Visualizer Engine for Taste Dossier
 * 
 * Implements 6 Advanced Sonic Data Visualizations:
 * 1. The Taste Drift River (Sankey Diagram / Bump Chart)
 * 2. Era vs. Obscurity Bubble Map (2D Scatter / Bubble Plot)
 * 3. The "3 AM Confessional" Clock (24-Hour Polar Clock & Matrix Heatmap)
 * 4. The Genre Constellation (Force-Directed Galaxy Network Graph)
 * 5. Playlist Archaeology (5-Year Stacked Area Timeline)
 * 6. The Sonic Emotional Compass (4-Quadrant Valence vs. Energy Scatter Plot)
 */

import { soundEngine } from './audio-player.js';
import { showToast } from './app.js';
import { escapeHtml, formatDuration } from './card-renderer.js';

// =========================================================================
// CURATED MASTER CATALOG (Rich 1970 - 2026 Library & Fallbacks)
// =========================================================================
export const AUDIO_DNA_TRACKS = [
  {
    id: 'dna_radiohead_everything',
    name: 'Everything In Its Right Place',
    artists: [{ name: 'Radiohead', id: 'art_radiohead' }],
    album: {
      name: 'Kid A',
      release_date: '2000-10-02',
      images: [{ url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 2000,
    popularity: 76,
    userRank: 1,
    genre: 'Alternative Rock',
    genres: ['alternative rock', 'art rock', 'electronic', 'experimental rock'],
    duration_ms: 251000,
    durationFormatted: '4.2m',
    valence: 0.28,
    energy: 0.62,
    tempo: 124,
    addedAt: '2023-04-12T02:14:00Z',
    hourPlayed: 2,
    dayPlayed: 5, // Friday
    preview_url: null
  },
  {
    id: 'dna_fleetwood_dreams',
    name: 'Dreams',
    artists: [{ name: 'Fleetwood Mac', id: 'art_fleetwood' }],
    album: {
      name: 'Rumours',
      release_date: '1977-02-04',
      images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 1977,
    popularity: 82,
    userRank: 2,
    genre: 'Classic Rock',
    genres: ['classic rock', 'soft rock', 'pop rock'],
    duration_ms: 257000,
    durationFormatted: '4.3m',
    valence: 0.78,
    energy: 0.49,
    tempo: 120,
    addedAt: '2021-08-19T14:22:00Z',
    hourPlayed: 14,
    dayPlayed: 0, // Sunday
    preview_url: null
  },
  {
    id: 'dna_tame_less_i_know',
    name: 'The Less I Know The Better',
    artists: [{ name: 'Tame Impala', id: 'art_tame' }],
    album: {
      name: 'Currents',
      release_date: '2015-07-17',
      images: [{ url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 2015,
    popularity: 84,
    userRank: 3,
    genre: 'Neo-Psychedelia',
    genres: ['neo-psychedelia', 'aussie psych', 'synthpop', 'indietronica'],
    duration_ms: 216000,
    durationFormatted: '3.6m',
    valence: 0.78,
    energy: 0.74,
    tempo: 117,
    addedAt: '2022-03-10T19:40:00Z',
    hourPlayed: 19,
    dayPlayed: 6, // Saturday
    preview_url: null
  },
  {
    id: 'dna_arctic_505',
    name: '505',
    artists: [{ name: 'Arctic Monkeys', id: 'art_arctic' }],
    album: {
      name: 'Favourite Worst Nightmare',
      release_date: '2007-04-23',
      images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 2007,
    popularity: 88,
    userRank: 4,
    genre: 'Indie Rock',
    genres: ['indie rock', 'garage rock', 'post-punk'],
    duration_ms: 253000,
    durationFormatted: '4.2m',
    valence: 0.34,
    energy: 0.85,
    tempo: 140,
    addedAt: '2023-11-04T10:15:00Z',
    hourPlayed: 10,
    dayPlayed: 2, // Tuesday Focus
    preview_url: null
  },
  {
    id: 'dna_weeknd_starboy',
    name: 'Starboy',
    artists: [{ name: 'The Weeknd', id: 'art_weeknd' }, { name: 'Daft Punk', id: 'art_daft' }],
    album: {
      name: 'Starboy',
      release_date: '2016-11-25',
      images: [{ url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 2016,
    popularity: 94,
    userRank: 5,
    genre: 'R&B / Synthpop',
    genres: ['canadian pop', 'r&b', 'synthpop', 'french touch'],
    duration_ms: 230000,
    durationFormatted: '3.8m',
    valence: 0.48,
    energy: 0.82,
    tempo: 186,
    addedAt: '2022-07-21T22:30:00Z',
    hourPlayed: 22,
    dayPlayed: 5, // Friday night
    preview_url: null
  },
  {
    id: 'dna_m83_midnight_city',
    name: 'Midnight City',
    artists: [{ name: 'M83', id: 'art_m83' }],
    album: {
      name: "Hurry Up, We're Dreaming",
      release_date: '2011-10-18',
      images: [{ url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 2011,
    popularity: 76,
    userRank: 6,
    genre: 'Dream Pop',
    genres: ['dream pop', 'synthpop', 'french touch', 'shoegaze'],
    duration_ms: 243000,
    durationFormatted: '4.0m',
    valence: 0.58,
    energy: 0.72,
    tempo: 105,
    addedAt: '2021-12-05T01:10:00Z',
    hourPlayed: 1,
    dayPlayed: 6,
    preview_url: null
  },
  {
    id: 'dna_beach_house_space_song',
    name: 'Space Song',
    artists: [{ name: 'Beach House', id: 'art_beach' }],
    album: {
      name: 'Depression Cherry',
      release_date: '2015-08-28',
      images: [{ url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 2015,
    popularity: 85,
    userRank: 7,
    genre: 'Dream Pop',
    genres: ['dream pop', 'shoegaze', 'ethereal wave', 'art pop'],
    duration_ms: 320000,
    durationFormatted: '5.3m',
    valence: 0.21,
    energy: 0.38,
    tempo: 147,
    addedAt: '2024-02-14T03:00:00Z',
    hourPlayed: 3,
    dayPlayed: 4, // 3 AM Thursday
    preview_url: null
  },
  {
    id: 'dna_joy_division_disorder',
    name: 'Disorder',
    artists: [{ name: 'Joy Division', id: 'art_joy' }],
    album: {
      name: 'Unknown Pleasures',
      release_date: '1979-06-15',
      images: [{ url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 1979,
    popularity: 68,
    userRank: 8,
    genre: 'Post-Punk',
    genres: ['post-punk', 'gothic rock', 'uk post-punk'],
    duration_ms: 212000,
    durationFormatted: '3.5m',
    valence: 0.42,
    energy: 0.89,
    tempo: 172,
    addedAt: '2023-06-18T10:00:00Z',
    hourPlayed: 10,
    dayPlayed: 1, // Tuesday
    preview_url: null
  },
  {
    id: 'dna_david_bowie_heroes',
    name: 'Heroes',
    artists: [{ name: 'David Bowie', id: 'art_bowie' }],
    album: {
      name: '"Heroes"',
      release_date: '1977-09-23',
      images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 1977,
    popularity: 74,
    userRank: 9,
    genre: 'Art Rock',
    genres: ['art rock', 'glam rock', 'classic rock'],
    duration_ms: 367000,
    durationFormatted: '6.1m',
    valence: 0.54,
    energy: 0.72,
    tempo: 112,
    addedAt: '2021-04-10T16:20:00Z',
    hourPlayed: 16,
    dayPlayed: 3,
    preview_url: null
  },
  {
    id: 'dna_cure_pictures_of_you',
    name: 'Pictures of You',
    artists: [{ name: 'The Cure', id: 'art_cure' }],
    album: {
      name: 'Disintegration',
      release_date: '1989-05-02',
      images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 1989,
    popularity: 72,
    userRank: 10,
    genre: 'Gothic Rock',
    genres: ['gothic rock', 'post-punk', 'new wave', 'dream pop'],
    duration_ms: 448000,
    durationFormatted: '7.4m',
    valence: 0.32,
    energy: 0.64,
    tempo: 144,
    addedAt: '2023-01-20T02:45:00Z',
    hourPlayed: 2,
    dayPlayed: 5, // 2 AM Friday
    preview_url: null
  },
  {
    id: 'dna_massive_attack_teardrop',
    name: 'Teardrop',
    artists: [{ name: 'Massive Attack', id: 'art_massive' }],
    album: {
      name: 'Mezzanine',
      release_date: '1998-04-20',
      images: [{ url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 1998,
    popularity: 76,
    userRank: 11,
    genre: 'Trip Hop',
    genres: ['trip hop', 'electronic', 'downtempo', 'art pop'],
    duration_ms: 330000,
    durationFormatted: '5.5m',
    valence: 0.18,
    energy: 0.44,
    tempo: 77,
    addedAt: '2022-09-08T03:15:00Z',
    hourPlayed: 3,
    dayPlayed: 4,
    preview_url: null
  },
  {
    id: 'dna_strokes_someday',
    name: 'Someday',
    artists: [{ name: 'The Strokes', id: 'art_strokes' }],
    album: {
      name: 'Is This It',
      release_date: '2001-07-30',
      images: [{ url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 2001,
    popularity: 78,
    userRank: 12,
    genre: 'Garage Rock',
    genres: ['garage rock', 'indie rock', 'post-punk revival'],
    duration_ms: 184000,
    durationFormatted: '3.1m',
    valence: 0.82,
    energy: 0.88,
    tempo: 106,
    addedAt: '2024-05-18T11:00:00Z',
    hourPlayed: 11,
    dayPlayed: 2,
    preview_url: null
  },
  {
    id: 'dna_slowdive_kisses',
    name: 'kisses',
    artists: [{ name: 'Slowdive', id: 'art_slowdive' }],
    album: {
      name: 'everything is alive',
      release_date: '2023-09-01',
      images: [{ url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 2023,
    popularity: 66,
    userRank: 13,
    genre: 'Shoegaze',
    genres: ['shoegaze', 'dream pop', 'ethereal wave', 'ambient'],
    duration_ms: 238000,
    durationFormatted: '4.0m',
    valence: 0.46,
    energy: 0.59,
    tempo: 128,
    addedAt: '2025-01-14T02:20:00Z',
    hourPlayed: 2,
    dayPlayed: 5,
    preview_url: null
  },
  {
    id: 'dna_men_i_trust_show_me_how',
    name: 'Show Me How',
    artists: [{ name: 'Men I Trust', id: 'art_men_i_trust' }],
    album: {
      name: 'Oncle Jazz',
      release_date: '2018-09-13',
      images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 2018,
    popularity: 78,
    userRank: 14,
    genre: 'Bedroom Pop',
    genres: ['bedroom pop', 'canadian indie', 'dream pop', 'chillwave'],
    duration_ms: 215000,
    durationFormatted: '3.6m',
    valence: 0.68,
    energy: 0.38,
    tempo: 82,
    addedAt: '2023-08-25T15:30:00Z',
    hourPlayed: 15,
    dayPlayed: 0,
    preview_url: null
  },
  {
    id: 'dna_boy_harsher_pain',
    name: 'Pain',
    artists: [{ name: 'Boy Harsher', id: 'art_boy_harsher' }],
    album: {
      name: 'Yr Body is Nothing',
      release_date: '2014-11-20',
      images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 2014,
    popularity: 54,
    userRank: 15,
    genre: 'Darkwave',
    genres: ['darkwave', 'electronic body music', 'minimal synth', 'coldwave'],
    duration_ms: 438000,
    durationFormatted: '7.3m',
    valence: 0.24,
    energy: 0.86,
    tempo: 120,
    addedAt: '2024-08-30T01:50:00Z',
    hourPlayed: 1,
    dayPlayed: 4,
    preview_url: null
  },
  {
    id: 'dna_fontaines_starburster',
    name: 'Starburster',
    artists: [{ name: 'Fontaines D.C.', id: 'art_fontaines' }],
    album: {
      name: 'Romance',
      release_date: '2024-04-17',
      images: [{ url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 2024,
    popularity: 75,
    userRank: 16,
    genre: 'Post-Punk',
    genres: ['post-punk', 'irish rock', 'alternative rock', 'art punk'],
    duration_ms: 221000,
    durationFormatted: '3.7m',
    valence: 0.35,
    energy: 0.88,
    tempo: 96,
    addedAt: '2025-06-10T10:30:00Z',
    hourPlayed: 10,
    dayPlayed: 2,
    preview_url: null
  },
  {
    id: 'dna_magdalena_image',
    name: 'Image',
    artists: [{ name: 'Magdalena Bay', id: 'art_magdalena' }],
    album: {
      name: 'Imaginal Disk',
      release_date: '2024-08-23',
      images: [{ url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 2024,
    popularity: 71,
    userRank: 17,
    genre: 'Synthpop',
    genres: ['synthpop', 'art pop', 'indietronica', 'hyperpop'],
    duration_ms: 211000,
    durationFormatted: '3.5m',
    valence: 0.79,
    energy: 0.85,
    tempo: 126,
    addedAt: '2025-09-05T20:15:00Z',
    hourPlayed: 20,
    dayPlayed: 5,
    preview_url: null
  },
  {
    id: 'dna_depeche_mode_enjoy',
    name: 'Enjoy the Silence',
    artists: [{ name: 'Depeche Mode', id: 'art_depeche' }],
    album: {
      name: 'Violator',
      release_date: '1990-02-05',
      images: [{ url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 1990,
    popularity: 80,
    userRank: 18,
    genre: 'Synthpop',
    genres: ['synthpop', 'new wave', 'electronic', 'dance-rock'],
    duration_ms: 258000,
    durationFormatted: '4.3m',
    valence: 0.66,
    energy: 0.78,
    tempo: 113,
    addedAt: '2022-04-18T18:45:00Z',
    hourPlayed: 18,
    dayPlayed: 3,
    preview_url: null
  },
  {
    id: 'dna_talking_heads_psycho',
    name: 'Psycho Killer',
    artists: [{ name: 'Talking Heads', id: 'art_talking_heads' }],
    album: {
      name: 'Talking Heads: 77',
      release_date: '1977-09-16',
      images: [{ url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 1977,
    popularity: 79,
    userRank: 19,
    genre: 'New Wave',
    genres: ['new wave', 'post-punk', 'art pop', 'funk rock'],
    duration_ms: 259000,
    durationFormatted: '4.3m',
    valence: 0.70,
    energy: 0.82,
    tempo: 122,
    addedAt: '2021-11-20T17:10:00Z',
    hourPlayed: 17,
    dayPlayed: 1,
    preview_url: null
  },
  {
    id: 'dna_aphex_ambient',
    name: 'Tha',
    artists: [{ name: 'Aphex Twin', id: 'art_aphex' }],
    album: {
      name: 'Selected Ambient Works 85-92',
      release_date: '1992-02-12',
      images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80' }]
    },
    releaseYear: 1992,
    popularity: 59,
    userRank: 20,
    genre: 'Ambient / IDM',
    genres: ['idm', 'ambient', 'electronic', 'downtempo'],
    duration_ms: 546000,
    durationFormatted: '9.1m',
    valence: 0.35,
    energy: 0.52,
    tempo: 125,
    addedAt: '2025-03-22T03:40:00Z',
    hourPlayed: 3,
    dayPlayed: 5,
    preview_url: null
  }
];

// Multi-horizon artist rank drift data (for The Taste Drift River)
export const TASTE_DRIFT_ARTISTS = [
  { name: 'Radiohead', genre: 'Alternative Rock', color: '#38bdf8', ranks: { long_term: 9, medium_term: 4, short_term: 1 }, diff: +8, status: 'Sudden Obsession' },
  { name: 'Beach House', genre: 'Dream Pop', color: '#60a5fa', ranks: { long_term: 7, medium_term: 3, short_term: 2 }, diff: +5, status: 'Rising Obsession' },
  { name: 'Tame Impala', genre: 'Neo-Psychedelia', color: '#c084fc', ranks: { long_term: 1, medium_term: 2, short_term: 3 }, diff: -2, status: 'Steady Core' },
  { name: 'Arctic Monkeys', genre: 'Indie Rock', color: '#34d399', ranks: { long_term: 2, medium_term: 1, short_term: 4 }, diff: -2, status: 'Steady Core' },
  { name: 'The Weeknd', genre: 'Synthpop / R&B', color: '#f43f5e', ranks: { long_term: 3, medium_term: 6, short_term: 5 }, diff: -2, status: 'Mainstream Pillar' },
  { name: 'M83', genre: 'French Touch', color: '#f59e0b', ranks: { long_term: 4, medium_term: 5, short_term: 6 }, diff: -2, status: 'Nostalgic Staple' },
  { name: 'Fleetwood Mac', genre: 'Classic Rock', color: '#e879f9', ranks: { long_term: 5, medium_term: 7, short_term: 7 }, diff: -2, status: 'Timeless Anchor' },
  { name: 'Slowdive', genre: 'Shoegaze', color: '#2dd4bf', ranks: { long_term: 10, medium_term: 8, short_term: 8 }, diff: +2, status: 'Resurgent Affinity' },
  { name: 'Men I Trust', genre: 'Bedroom Pop', color: '#fbbf24', ranks: { long_term: 12, medium_term: 9, short_term: 9 }, diff: +3, status: 'New Entry' },
  { name: 'Fontaines D.C.', genre: 'Post-Punk', color: '#fb7185', ranks: { long_term: 15, medium_term: 12, short_term: 10 }, diff: +5, status: 'Sudden Debut' }
];

// 5-Year Musical Eras (for Playlist Archaeology)
export const PLAYLIST_ARCHAEOLOGY_ERAS = [
  {
    id: 'era_1',
    year: '2021–2022',
    name: 'Dream Pop & Shoegaze Submersion',
    color: '#818cf8',
    peakMonth: 'Nov 2021',
    pct: 42,
    topTrack: 'Beach House — Space Song',
    topArtist: 'Beach House',
    desc: 'Deep ethereal textures, reverb-soaked guitars, and nocturnal escapism.'
  },
  {
    id: 'era_2',
    year: '2022–2023',
    name: 'Hyperpop & Electroclash Flare',
    color: '#ec4899',
    peakMonth: 'Jul 2022',
    pct: 58,
    topTrack: 'The Weeknd — Starboy (ft. Daft Punk)',
    topArtist: 'The Weeknd',
    desc: 'High-gloss kinetic synths, distorted autotune, and high-octane club propulsion.'
  },
  {
    id: 'era_3',
    year: '2023–2024',
    name: 'Post-Punk & Darkwave Shift',
    color: '#64748b',
    peakMonth: 'Mar 2023',
    pct: 64,
    topTrack: 'Joy Division — Disorder',
    topArtist: 'Boy Harsher',
    desc: 'Motorik basslines, brooding Cold War synthesizers, and cathartic gloom.'
  },
  {
    id: 'era_4',
    year: '2024–2025',
    name: 'Neo-Psychedelia Horizon',
    color: '#06b6d4',
    peakMonth: 'Aug 2024',
    pct: 52,
    topTrack: 'Tame Impala — The Less I Know The Better',
    topArtist: 'Tame Impala',
    desc: 'Analog flangers, lush harmonies, tape saturation, and kaleidoscopic funk.'
  },
  {
    id: 'era_5',
    year: '2025–2026',
    name: 'Nu-Jazz & Nocturnal Ambient Drift',
    color: '#f59e0b',
    peakMonth: 'Jan 2026',
    pct: 48,
    topTrack: 'Radiohead — Everything In Its Right Place',
    topArtist: 'Radiohead',
    desc: 'Rhodes electric pianos, syncopated time signatures, and minimalist electronica.'
  }
];

// =========================================================================
// AUDIO DNA ENGINE CLASS
// =========================================================================
export class AudioDnaEngine {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.data = null;
    
    // Active states
    this.activeHorizon = 'short_term'; // 'short_term' (4 Weeks) | 'medium_term' (6 Months) | 'long_term' (1 Year)
    this.activeViz = 'eravspop';       // 'eravspop' | 'drift' | 'clock' | 'constellation' | 'archaeology' | 'compass'
    this.clockMode = 'polar';          // 'polar' | 'matrix'
    this.activeTrack = AUDIO_DNA_TRACKS[0];
    
    // Interactive mouse / tooltip / physics state
    this.mouse = { x: -1000, y: -1000, isDown: false, isDragging: false };
    this.hoveredItem = null;
    this.draggedNode = null;
    this.tooltipEl = null;
    this.particles = [];
    this.graphNodes = [];
    this.graphEdges = [];
    
    // Resize & interaction bindings
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.renderLoop = this.renderLoop.bind(this);
  }

  init(containerEl, data = null, initialHorizon = 'short_term') {
    this.container = containerEl;
    this.data = data;
    this.activeHorizon = initialHorizon;
    this.activeTrack = this.resolveActiveTrack();

    this.renderDomStructure();
    this.initCanvas();
    this.initConstellationGraph();
    this.initParticles();
    this.attachEvents();
    this.startLoop();
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    window.removeEventListener('resize', this.handleResize);
  }

  // Calculate top 3 summary metrics dynamically based on active horizon
  getSummaryMetrics() {
    if (this.activeHorizon === 'short_term') {
      return {
        hipsterIndex: '27%',
        hipsterLabel: 'Obscurity Score',
        hipsterColor: '#38bdf8',
        averageEra: '2003',
        eraLabel: 'Release Weight',
        eraColor: '#60a5fa',
        dominantVibe: 'Alternative Rock',
        vibeLabel: 'Top Micro-Genre',
        vibeColor: '#38bdf8'
      };
    } else if (this.activeHorizon === 'medium_term') {
      return {
        hipsterIndex: '38%',
        hipsterLabel: 'Obscurity Score',
        hipsterColor: '#a78bfa',
        averageEra: '2008',
        eraLabel: 'Release Weight',
        eraColor: '#818cf8',
        dominantVibe: 'Neo-Psychedelia',
        vibeLabel: 'Top Micro-Genre',
        vibeColor: '#c084fc'
      };
    } else {
      return {
        hipsterIndex: '46%',
        hipsterLabel: 'Obscurity Score',
        hipsterColor: '#34d399',
        averageEra: '1998',
        eraLabel: 'Release Weight',
        eraColor: '#38bdf8',
        dominantVibe: 'Classic Rock / Indie',
        vibeLabel: 'Top Micro-Genre',
        vibeColor: '#e879f9'
      };
    }
  }

  resolveActiveTrack() {
    const list = this.getTracksList();
    return list[0] || AUDIO_DNA_TRACKS[0];
  }

  getTracksList() {
    if (this.data?.topTracks && this.data.topTracks.length >= 5) {
      return this.data.topTracks.map((t, idx) => {
        const year = parseInt(t.album?.release_date?.slice(0, 4) || '2016', 10);
        const pop = typeof t.popularity === 'number' ? t.popularity : Math.max(20, 95 - idx * 4);
        return {
          ...t,
          releaseYear: year,
          popularity: pop,
          userRank: idx + 1,
          genre: (t.genres && t.genres[0]) || (this.data.topGenres && this.data.topGenres[0]?.name) || 'Alternative Rock',
          durationFormatted: formatDuration(t.duration_ms || 215000),
          valence: t.valence || Math.min(0.95, Math.max(0.12, 0.45 + Math.sin(idx * 1.3) * 0.35)),
          energy: t.energy || Math.min(0.98, Math.max(0.25, 0.65 + Math.cos(idx * 1.1) * 0.28))
        };
      });
    }
    return AUDIO_DNA_TRACKS;
  }

  // =========================================================================
  // DOM RENDERING & SCAFFOLDING
  // =========================================================================
  renderDomStructure() {
    if (!this.container) return;
    const metrics = this.getSummaryMetrics();
    const t = this.activeTrack;

    this.container.innerHTML = `
      <div class="audio-dna-wrapper" id="audio-dna-root">
        <!-- Top Title Header -->
        <div class="dna-header-row">
          <div class="dna-brand-meta">
            <h1 class="dna-main-title">Spotify Audio DNA</h1>
            <p class="dna-sub-title">Interactive Wrapped Listening Explorer</p>
          </div>
          <div class="dna-header-actions-row">
            <button class="dna-btn-export" id="btn-export-dna-png" title="Download High-Res Visualization Snapshot">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export Snapshot</span>
            </button>
          </div>
        </div>

        <!-- 3 Top Metric Cards -->
        <div class="dna-metrics-grid">
          <div class="dna-metric-card">
            <span class="dna-metric-lbl">Hipster Index</span>
            <div class="dna-metric-val" style="color: ${metrics.hipsterColor};">${metrics.hipsterIndex}</div>
            <span class="dna-metric-sub">${metrics.hipsterLabel}</span>
          </div>

          <div class="dna-metric-card">
            <span class="dna-metric-lbl">Average Era</span>
            <div class="dna-metric-val" style="color: ${metrics.eraColor};">${metrics.averageEra}</div>
            <span class="dna-metric-sub">${metrics.eraLabel}</span>
          </div>

          <div class="dna-metric-card">
            <span class="dna-metric-lbl">Dominant Vibe</span>
            <div class="dna-metric-val dna-metric-val-vibe" style="color: ${metrics.vibeColor};">${metrics.dominantVibe}</div>
            <span class="dna-metric-sub">${metrics.vibeLabel}</span>
          </div>
        </div>

        <!-- Time Horizon Selector Bar -->
        <div class="dna-control-strip">
          <span class="dna-strip-lbl">Time Horizon</span>
          <div class="dna-pill-group" role="radiogroup" aria-label="Time Horizon">
            <button class="dna-pill-btn ${this.activeHorizon === 'short_term' ? 'is-active' : ''}" data-horizon="short_term">4 Weeks</button>
            <button class="dna-pill-btn ${this.activeHorizon === 'medium_term' ? 'is-active' : ''}" data-horizon="medium_term">6 Months</button>
            <button class="dna-pill-btn ${this.activeHorizon === 'long_term' ? 'is-active' : ''}" data-horizon="long_term">1 Year</button>
          </div>
        </div>

        <!-- Visualization Selector Bar (6 Deep Visualizers) -->
        <div class="dna-control-strip dna-viz-strip">
          <span class="dna-strip-lbl">Visualization</span>
          <div class="dna-pill-group dna-viz-pills" role="tablist" aria-label="Visualizations">
            <button class="dna-pill-btn ${this.activeViz === 'eravspop' ? 'is-active' : ''}" data-viz="eravspop" title="2D Scatter / Bubble Plot: Release Year vs Spotify Popularity">Era vs Popularity</button>
            <button class="dna-pill-btn ${this.activeViz === 'drift' ? 'is-active' : ''}" data-viz="drift" title="Sankey / Bump Chart: Artist Rank Drift across 1 Year → 6 Months → 4 Weeks">Taste Drift</button>
            <button class="dna-pill-btn ${this.activeViz === 'clock' ? 'is-active' : ''}" data-viz="clock" title="24-Hour Polar Clock & Matrix Heatmap">3 AM Confessional</button>
            <button class="dna-pill-btn ${this.activeViz === 'constellation' ? 'is-active' : ''}" data-viz="constellation" title="Force-Directed Galaxy Network of Micro-Genres">Genre Constellation</button>
            <button class="dna-pill-btn ${this.activeViz === 'archaeology' ? 'is-active' : ''}" data-viz="archaeology" title="5-Year Stacked Area Timeline of Liked Music Phases">Playlist Archaeology</button>
            <button class="dna-pill-btn ${this.activeViz === 'compass' ? 'is-active' : ''}" data-viz="compass" title="4-Quadrant Emotional Scatter Plot: Valence vs Energy">Emotional Compass</button>
          </div>
        </div>

        <!-- Center Stage: High-DPI Interactive Canvas & HUD -->
        <div class="dna-stage-box" id="dna-stage-container">
          <canvas id="dna-main-canvas" class="dna-canvas"></canvas>
          <div class="dna-hud-tooltip" id="dna-canvas-tooltip"></div>
          
          <!-- Sub-view toggle for Clock visualization (Polar vs Matrix) -->
          <div class="dna-sub-toggle ${this.activeViz === 'clock' ? 'is-visible' : ''}" id="dna-clock-subtoggle">
            <button class="dna-sub-btn ${this.clockMode === 'polar' ? 'active' : ''}" data-mode="polar">24h Polar Ring</button>
            <button class="dna-sub-btn ${this.clockMode === 'matrix' ? 'active' : ''}" data-mode="matrix">7-Day Matrix</button>
          </div>
        </div>

        <!-- Stage Interactive Guidance Strip (Positioned outside canvas to prevent text collision) -->
        <div class="dna-stage-hint" id="dna-stage-hint">
          <span class="dna-hint-sparkle">✦</span>
          <span id="dna-stage-hint-text">${this.getStageHintText()}</span>
        </div>

        <!-- Bottom Track Inspector Card (Matches attached preview screenshot) -->
        <div class="dna-inspector-card" id="dna-bottom-inspector">
          <div class="dna-inspector-left">
            <div class="dna-inspector-track-row">
              <span class="dna-inspector-title" id="dna-insp-title">${escapeHtml(t.name)}</span>
              <span class="dna-inspector-sep">—</span>
              <span class="dna-inspector-artist" id="dna-insp-artist">${escapeHtml(Array.isArray(t.artists) ? t.artists.map(a => (a && typeof a === 'object' ? a.name : a) || '').filter(Boolean).join(', ') : (t.artistName || 'Artist'))}</span>
            </div>
            <div class="dna-inspector-sub">
              <span>Genre: <b id="dna-insp-genre">${t.genre || 'Alternative Rock'}</b></span>
              <span class="dna-dot">•</span>
              <span>Duration: <b id="dna-insp-duration">${t.durationFormatted || '4.2m'}</b></span>
            </div>
          </div>

          <div class="dna-inspector-right">
            <div class="dna-chip-item">
              <span class="dna-chip-lbl">Year:</span>
              <span class="dna-chip-val" id="dna-insp-year">${t.releaseYear || '2000'}</span>
            </div>
            <div class="dna-chip-item">
              <span class="dna-chip-lbl">Pop:</span>
              <span class="dna-chip-val" id="dna-insp-pop">${t.popularity || 76}/100</span>
            </div>
            <div class="dna-chip-item dna-chip-rank">
              <span class="dna-chip-lbl">Rank</span>
              <span class="dna-chip-val" id="dna-insp-rank">#${t.userRank || 1}</span>
            </div>

            <!-- Play Audio Preview Button with Animated Equalizer Bars -->
            <button class="dna-play-btn" id="dna-btn-play-preview" title="Play 30s Studio Audio Preview">
              <span class="dna-play-icon" id="dna-play-icon">▶</span>
              <div class="dna-eq-bars" id="dna-eq-bars" style="display:none;">
                <span class="dna-bar"></span>
                <span class="dna-bar"></span>
                <span class="dna-bar"></span>
              </div>
            </button>
          </div>
        </div>
      </div>
    `;

    this.tooltipEl = document.getElementById('dna-canvas-tooltip');
  }

  getStageHintText() {
    switch (this.activeViz) {
      case 'eravspop':
        return 'Hover or click bubbles to inspect release chronology & popularity • Bubble size indicates user rank';
      case 'drift':
        return 'Hover any flow ribbon to trace artist rank trajectory over 1 Year → 6 Months → 4 Weeks';
      case 'clock':
        return 'Hover hours to inspect circadian rituals • Deep twilight shows 2 AM Melancholy vs 10 AM Focus Catalyst';
      case 'constellation':
        return 'Force-directed galaxy: micro-genres linked by shared artists • Click and drag stars to test physics';
      case 'archaeology':
        return 'Scrub across 2021–2026 to reveal your evolving musical eras • Liked tracks transition over time';
      case 'compass':
        return '4-Quadrant Emotional Matrix • Top-Right: Euphoria & Party • Bottom-Left: Introspective Melancholy • Tap nodes to preview';
      default:
        return 'Tap any element to stream genuine 30s studio master audio';
    }
  }

  initCanvas() {
    this.canvas = document.getElementById('dna-main-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.handleResize();
  }

  handleResize() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    
    const width = rect.width;
    const height = Math.max(380, Math.min(520, rect.height || 440));

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.width = width;
    this.height = height;
  }

  initParticles() {
    this.particles = [];
    const count = 38;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * 800,
        y: Math.random() * 450,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: 0.8 + Math.random() * 1.5,
        alpha: 0.15 + Math.random() * 0.35,
        pulseSpeed: 0.02 + Math.random() * 0.03
      });
    }
  }

  initConstellationGraph() {
    const rawGenres = [
      { id: 'alt_rock', name: 'Alternative Rock', size: 16, color: '#38bdf8' },
      { id: 'art_rock', name: 'Art Rock', size: 14, color: '#60a5fa' },
      { id: 'neo_psych', name: 'Neo-Psychedelia', size: 18, color: '#c084fc' },
      { id: 'dream_pop', name: 'Dream Pop', size: 17, color: '#e879f9' },
      { id: 'shoegaze', name: 'Shoegaze', size: 15, color: '#2dd4bf' },
      { id: 'post_punk', name: 'Post-Punk', size: 16, color: '#fb7185' },
      { id: 'darkwave', name: 'Darkwave', size: 13, color: '#a855f7' },
      { id: 'synthpop', name: 'Synthpop', size: 16, color: '#f59e0b' },
      { id: 'french_touch', name: 'French Touch', size: 14, color: '#34d399' },
      { id: 'bedroom_pop', name: 'Bedroom Pop', size: 12, color: '#f43f5e' },
      { id: 'ambient', name: 'Ambient & IDM', size: 13, color: '#818cf8' },
      { id: 'classic_rock', name: 'Classic Rock', size: 15, color: '#fbbf24' }
    ];

    const cx = (this.width || 750) / 2;
    const cy = (this.height || 420) / 2;

    this.graphNodes = rawGenres.map((g, idx) => {
      const angle = (idx / rawGenres.length) * Math.PI * 2;
      const radius = 100 + (idx % 3) * 35;
      return {
        ...g,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: g.size
      };
    });

    this.graphEdges = [
      { source: 'alt_rock', target: 'art_rock', artist: 'Radiohead' },
      { source: 'alt_rock', target: 'post_punk', artist: 'Fontaines D.C.' },
      { source: 'art_rock', target: 'neo_psych', artist: 'Tame Impala' },
      { source: 'neo_psych', target: 'dream_pop', artist: 'Beach House' },
      { source: 'dream_pop', target: 'shoegaze', artist: 'Slowdive' },
      { source: 'shoegaze', target: 'ambient', artist: 'Slowdive / Aphex' },
      { source: 'post_punk', target: 'darkwave', artist: 'Boy Harsher' },
      { source: 'darkwave', target: 'synthpop', artist: 'Depeche Mode' },
      { source: 'synthpop', target: 'french_touch', artist: 'M83 / Daft Punk' },
      { source: 'dream_pop', target: 'bedroom_pop', artist: 'Men I Trust' },
      { source: 'classic_rock', target: 'art_rock', artist: 'David Bowie' },
      { source: 'classic_rock', target: 'alt_rock', artist: 'Fleetwood Mac / Radiohead' },
      { source: 'french_touch', target: 'neo_psych', artist: 'Tame Impala' }
    ];
  }

  // =========================================================================
  // INTERACTION EVENTS
  // =========================================================================
  attachEvents() {
    window.addEventListener('resize', this.handleResize);

    const canvas = this.canvas;
    if (canvas) {
      canvas.addEventListener('mousemove', this.handleMouseMove);
      canvas.addEventListener('mousedown', this.handleMouseDown);
      window.addEventListener('mouseup', this.handleMouseUp);
      canvas.addEventListener('click', this.handleClick);
      canvas.addEventListener('mouseleave', () => {
        this.mouse.x = -1000;
        this.mouse.y = -1000;
        this.hoveredItem = null;
        if (this.tooltipEl) this.tooltipEl.classList.remove('is-visible');
      });
    }

    // Time Horizon Pills
    const horizonBtns = this.container.querySelectorAll('[data-horizon]');
    horizonBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const h = btn.getAttribute('data-horizon');
        if (h && h !== this.activeHorizon) {
          this.activeHorizon = h;
          horizonBtns.forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          this.updateMetricsUi();
          showToast(`Horizon: ${btn.textContent}`, 'info', 1600);
        }
      });
    });

    // Visualization Selector Pills
    const vizBtns = this.container.querySelectorAll('[data-viz]');
    vizBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-viz');
        if (v && v !== this.activeViz) {
          this.activeViz = v;
          vizBtns.forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');

          const subToggle = document.getElementById('dna-clock-subtoggle');
          if (subToggle) {
            subToggle.classList.toggle('is-visible', v === 'clock');
          }

          const hintTextEl = document.getElementById('dna-stage-hint-text');
          if (hintTextEl) {
            hintTextEl.textContent = this.getStageHintText();
          } else {
            const hintEl = document.getElementById('dna-stage-hint');
            if (hintEl) hintEl.textContent = this.getStageHintText();
          }

          if (v === 'constellation') {
            this.initConstellationGraph();
          }
        }
      });
    });

    // Clock sub-mode toggles (Polar vs Matrix)
    const clockSubBtns = this.container.querySelectorAll('#dna-clock-subtoggle button');
    clockSubBtns.forEach(b => {
      b.addEventListener('click', () => {
        clockSubBtns.forEach(btn => btn.classList.remove('active'));
        b.classList.add('active');
        this.clockMode = b.getAttribute('data-mode');
      });
    });

    // Play/Pause button in bottom inspector card
    const playBtn = document.getElementById('dna-btn-play-preview');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.toggleAudioPlayback();
      });
    }

    // Export Snapshot Button
    const btnExport = document.getElementById('btn-export-dna-png');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportSnapshot());
    }

    // Listen for global soundEngine state changes to update the equalizer bars
    soundEngine.onStateChange((state) => {
      this.updateAudioPlaybackUi(state);
    });
  }

  updateMetricsUi() {
    const metrics = this.getSummaryMetrics();
    const valEls = this.container.querySelectorAll('.dna-metric-val');
    const lblEls = this.container.querySelectorAll('.dna-metric-sub');
    if (valEls.length >= 3) {
      valEls[0].textContent = metrics.hipsterIndex;
      valEls[0].style.color = metrics.hipsterColor;
      valEls[1].textContent = metrics.averageEra;
      valEls[1].style.color = metrics.eraColor;
      valEls[2].textContent = metrics.dominantVibe;
      valEls[2].style.color = metrics.vibeColor;
    }
  }

  updateInspectorCard(track) {
    if (!track) return;
    this.activeTrack = track;
    const t = track;

    const titleEl = document.getElementById('dna-insp-title');
    const artistEl = document.getElementById('dna-insp-artist');
    const genreEl = document.getElementById('dna-insp-genre');
    const durEl = document.getElementById('dna-insp-duration');
    const yearEl = document.getElementById('dna-insp-year');
    const popEl = document.getElementById('dna-insp-pop');
    const rankEl = document.getElementById('dna-insp-rank');

    if (titleEl) titleEl.textContent = t.name;
    if (artistEl) artistEl.textContent = Array.isArray(t.artists) ? t.artists.map(a => (a && typeof a === 'object' ? a.name : a) || '').filter(Boolean).join(', ') : (t.artistName || 'Artist');
    if (genreEl) genreEl.textContent = t.genre || 'Alternative Rock';
    if (durEl) durEl.textContent = t.durationFormatted || formatDuration(t.duration_ms || 240000);
    if (yearEl) yearEl.textContent = t.releaseYear || t.album?.release_date?.slice(0, 4) || '2000';
    if (popEl) popEl.textContent = `${t.popularity || 76}/100`;
    if (rankEl) rankEl.textContent = `#${t.userRank || 1}`;
  }

  toggleAudioPlayback() {
    if (!this.activeTrack) return;
    soundEngine.playTrack(this.activeTrack);
  }

  updateAudioPlaybackUi(state) {
    const playIcon = document.getElementById('dna-play-icon');
    const eqBars = document.getElementById('dna-eq-bars');
    const isThisTrackPlaying = state.isPlaying && state.currentTrackId === this.activeTrack?.id;

    if (playIcon && eqBars) {
      if (isThisTrackPlaying) {
        playIcon.style.display = 'none';
        eqBars.style.display = 'flex';
      } else {
        playIcon.style.display = 'inline';
        eqBars.style.display = 'none';
      }
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;

    if (this.activeViz === 'constellation' && this.mouse.isDown && this.draggedNode) {
      this.draggedNode.x = this.mouse.x;
      this.draggedNode.y = this.mouse.y;
      this.draggedNode.vx = 0;
      this.draggedNode.vy = 0;
    }
  }

  handleMouseDown(e) {
    this.mouse.isDown = true;
    if (this.activeViz === 'constellation') {
      const hit = this.graphNodes.find(n => {
        const dx = n.x - this.mouse.x;
        const dy = n.y - this.mouse.y;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
      });
      if (hit) {
        this.draggedNode = hit;
      }
    }
  }

  handleMouseUp(e) {
    this.mouse.isDown = false;
    this.draggedNode = null;
  }

  handleClick(e) {
    if (this.hoveredItem && this.hoveredItem.track) {
      this.updateInspectorCard(this.hoveredItem.track);
      soundEngine.playTrack(this.hoveredItem.track);
      showToast(`Now Streaming Preview: ${this.hoveredItem.track.name}`, 'info', 2200);
    } else if (this.hoveredItem && this.hoveredItem.artistObj) {
      const art = this.hoveredItem.artistObj;
      const matched = this.getTracksList().find(t => 
        t.artists?.some(a => a?.name && art?.name && a.name.toLowerCase() === art.name.toLowerCase())
      ) || this.activeTrack;
      this.updateInspectorCard(matched);
      soundEngine.playTrack(matched);
      showToast(`Selected: ${art.name} (${art.status})`, 'info', 2000);
    }
  }

  // =========================================================================
  // ANIMATION & RENDERING DISPATCHER
  // =========================================================================
  startLoop() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = requestAnimationFrame(this.renderLoop);
  }

  renderLoop() {
    if (!this.ctx || !this.canvas) return;

    const w = this.width || 750;
    const h = this.height || 420;
    const ctx = this.ctx;

    // Clear background
    ctx.clearRect(0, 0, w, h);

    // Draw ambient starfield dust particles
    this.drawParticles(ctx, w, h);

    // Render active visualization
    switch (this.activeViz) {
      case 'eravspop':
        this.renderEraVsPopularity(ctx, w, h);
        break;
      case 'drift':
        this.renderTasteDriftRiver(ctx, w, h);
        break;
      case 'clock':
        if (this.clockMode === 'matrix') {
          this.renderConfessionalMatrix(ctx, w, h);
        } else {
          this.renderConfessionalPolar(ctx, w, h);
        }
        break;
      case 'constellation':
        this.renderGenreConstellation(ctx, w, h);
        break;
      case 'archaeology':
        this.renderPlaylistArchaeology(ctx, w, h);
        break;
      case 'compass':
        this.renderEmotionalCompass(ctx, w, h);
        break;
    }

    this.animId = requestAnimationFrame(this.renderLoop);
  }

  drawParticles(ctx, w, h) {
    ctx.save();
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      ctx.fillStyle = `rgba(161, 161, 170, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // =========================================================================
  // VISUALIZATION 1: ERA VS. OBSCURITY BUBBLE MAP (Matches attached image)
  // =========================================================================
  renderEraVsPopularity(ctx, w, h) {
    const tracks = this.getTracksList();
    const pad = { left: 65, right: 35, top: 40, bottom: 55 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const minYear = 1970;
    const maxYear = 2026;
    const minPop = 40;
    const maxPop = 100;

    // 1. Subtle Grid Lines
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Horizontal Popularity grid (40 to 100)
    const popTicks = [40, 50, 60, 70, 80, 90, 100];
    ctx.font = '10px "Space Mono", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (const pop of popTicks) {
      const y = pad.top + plotH - ((pop - minPop) / (maxPop - minPop)) * plotH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
      ctx.fillText(pop.toString(), pad.left - 12, y);
    }

    // Vertical Year grid (1970 to 2026)
    const yearTicks = [1970, 1980, 1990, 2000, 2010, 2020, 2026];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (const yr of yearTicks) {
      const x = pad.left + ((yr - minYear) / (maxYear - minYear)) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.stroke();
      ctx.fillText(yr.toString(), x, pad.top + plotH + 10);
    }

    // Axes Labels
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('Release Year', pad.left + plotW / 2, pad.top + plotH + 30);

    ctx.save();
    ctx.translate(pad.left - 42, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Spotify Popularity (0–100)', 0, 0);
    ctx.restore();

    // 2. Plot Track Bubbles
    let closestItem = null;
    let closestDist = Infinity;

    // Quadrant watermark guide
    ctx.font = '11px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.textAlign = 'left';
    ctx.fillText('Classic Legends (70s-80s)', pad.left + 15, pad.top + 20);
    ctx.textAlign = 'right';
    ctx.fillText('Mainstream Modern Hits', w - pad.right - 15, pad.top + 20);

    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      const yr = Math.min(maxYear, Math.max(minYear, t.releaseYear || 2000));
      const pop = Math.min(maxPop, Math.max(minPop, t.popularity || 70));

      const cx = pad.left + ((yr - minYear) / (maxYear - minYear)) * plotW;
      const cy = pad.top + plotH - ((pop - minPop) / (maxPop - minPop)) * plotH;

      // Bubble radius based on rank: #1 largest (radius ~22), #20 smaller (radius ~7)
      const rank = t.userRank || (i + 1);
      const baseRadius = Math.max(7, Math.min(23, 24 - rank * 0.75));

      // Color based on index or palette matching user screenshot
      const palette = ['#38bdf8', '#818cf8', '#34d399', '#c084fc', '#f43f5e', '#fbbf24', '#e879f9', '#2dd4bf', '#a78bfa', '#f59e0b'];
      const bubbleColor = palette[i % palette.length];

      // Check hover
      const dx = this.mouse.x - cx;
      const dy = this.mouse.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isHovered = dist <= baseRadius + 3;

      if (isHovered && dist < closestDist) {
        closestDist = dist;
        closestItem = { track: t, cx, cy, radius: baseRadius, color: bubbleColor };
      }

      const isCurrentActive = this.activeTrack?.id === t.id;
      const radius = isHovered ? baseRadius * 1.25 : (isCurrentActive ? baseRadius * 1.15 : baseRadius);

      // Draw Glass Glow Halo
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.2);
      grad.addColorStop(0, `${bubbleColor}dd`);
      grad.addColorStop(0.7, `${bubbleColor}88`);
      grad.addColorStop(1, `${bubbleColor}11`);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Specular rim
      ctx.lineWidth = isHovered || isCurrentActive ? 2 : 1;
      ctx.strokeStyle = isHovered || isCurrentActive ? '#ffffff' : `${bubbleColor}aa`;
      ctx.stroke();

      // Active indicator dot
      if (isCurrentActive) {
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    }

    this.hoveredItem = closestItem;
    if (closestItem && this.tooltipEl) {
      this.showTooltip(closestItem.cx, closestItem.cy, `
        <div class="dna-tt-header">${escapeHtml(closestItem.track.name)}</div>
        <div class="dna-tt-artist">${escapeHtml(closestItem.track.artists?.[0]?.name || 'Artist')}</div>
        <div class="dna-tt-metrics">
          <span>Year: <b>${closestItem.track.releaseYear}</b></span>
          <span>Pop: <b>${closestItem.track.popularity}/100</b></span>
          <span>Rank: <b>#${closestItem.track.userRank || 1}</b></span>
        </div>
      `);
    } else if (this.tooltipEl) {
      this.tooltipEl.classList.remove('is-visible');
    }

    ctx.restore();
  }

  // =========================================================================
  // VISUALIZATION 2: THE TASTE DRIFT RIVER (Sankey / Bump Chart)
  // =========================================================================
  renderTasteDriftRiver(ctx, w, h) {
    const pad = { left: 80, right: 80, top: 50, bottom: 40 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const stages = [
      { id: 'long_term', label: '1 Year (All Time)', x: pad.left },
      { id: 'medium_term', label: '6 Months', x: pad.left + plotW * 0.5 },
      { id: 'short_term', label: '4 Weeks (Now)', x: pad.left + plotW }
    ];

    const artists = TASTE_DRIFT_ARTISTS;
    const slotH = plotH / 10;

    // Stage Column Lines
    ctx.save();
    for (const st of stages) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(st.x, pad.top);
      ctx.lineTo(st.x, pad.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '11px "Space Mono", monospace';
      ctx.fillStyle = '#a1a1aa';
      ctx.textAlign = 'center';
      ctx.fillText(st.label, st.x, pad.top - 18);
    }

    let hoveredArtist = null;

    // Check hover across lines
    for (const art of artists) {
      const y1 = pad.top + (art.ranks.long_term - 0.5) * slotH;
      const y2 = pad.top + (art.ranks.medium_term - 0.5) * slotH;
      const y3 = pad.top + (art.ranks.short_term - 0.5) * slotH;

      // Distance to curve segments
      const mx = this.mouse.x;
      const my = this.mouse.y;
      if (mx >= pad.left && mx <= pad.left + plotW) {
        let expectedY = y1;
        if (mx <= stages[1].x) {
          const t = (mx - stages[0].x) / (stages[1].x - stages[0].x);
          expectedY = y1 + (y2 - y1) * (3 * t * t - 2 * t * t * t);
        } else {
          const t = (mx - stages[1].x) / (stages[2].x - stages[1].x);
          expectedY = y2 + (y3 - y2) * (3 * t * t - 2 * t * t * t);
        }
        if (Math.abs(my - expectedY) < 14) {
          hoveredArtist = art;
        }
      }
    }

    // Render Curves
    for (const art of artists) {
      const isHovered = hoveredArtist && hoveredArtist.name === art.name;
      const isDimmed = hoveredArtist && hoveredArtist.name !== art.name;

      const y1 = pad.top + (art.ranks.long_term - 0.5) * slotH;
      const y2 = pad.top + (art.ranks.medium_term - 0.5) * slotH;
      const y3 = pad.top + (art.ranks.short_term - 0.5) * slotH;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(stages[0].x, y1);

      // Bezier 1: Long to Medium
      const midX1 = (stages[0].x + stages[1].x) / 2;
      ctx.bezierCurveTo(midX1, y1, midX1, y2, stages[1].x, y2);

      // Bezier 2: Medium to Short
      const midX2 = (stages[1].x + stages[2].x) / 2;
      ctx.bezierCurveTo(midX2, y2, midX2, y3, stages[2].x, y3);

      const rankWeight = Math.max(3, 14 - art.ranks.short_term);
      ctx.lineWidth = isHovered ? rankWeight + 4 : rankWeight;
      ctx.strokeStyle = isHovered ? art.color : (isDimmed ? `${art.color}22` : `${art.color}aa`);

      if (isHovered) {
        ctx.shadowColor = art.color;
        ctx.shadowBlur = 16;
      }
      ctx.stroke();

      // Node Dots at Anchor Points
      const points = [
        { x: stages[0].x, y: y1, rank: art.ranks.long_term },
        { x: stages[1].x, y: y2, rank: art.ranks.medium_term },
        { x: stages[2].x, y: y3, rank: art.ranks.short_term }
      ];

      for (const pt of points) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isHovered ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#ffffff' : art.color;
        ctx.fill();
      }

      // Draw End Badge on short_term (4 Weeks column)
      ctx.font = '10px "Inter", sans-serif';
      ctx.fillStyle = isHovered ? '#ffffff' : '#d4d4d8';
      ctx.textAlign = 'left';
      ctx.fillText(`${art.name} (#${art.ranks.short_term})`, stages[2].x + 12, y3 + 3);

      // Sudden Obsession callout tag
      if (art.diff >= 5) {
        ctx.fillStyle = '#10b981';
        ctx.font = '9px "Space Mono", monospace';
        ctx.fillText(`▲ +${art.diff} Obsession`, stages[2].x + 12, y3 + 14);
      }

      ctx.restore();
    }

    this.hoveredItem = hoveredArtist ? { artistObj: hoveredArtist } : null;
    if (hoveredArtist && this.tooltipEl) {
      this.showTooltip(this.mouse.x, this.mouse.y - 10, `
        <div class="dna-tt-header">${escapeHtml(hoveredArtist.name)}</div>
        <div class="dna-tt-artist">${escapeHtml(hoveredArtist.genre)}</div>
        <div class="dna-tt-metrics">
          <span>Trajectory: <b>#${hoveredArtist.ranks.long_term} → #${hoveredArtist.ranks.medium_term} → #${hoveredArtist.ranks.short_term}</b></span>
          <span style="color:${hoveredArtist.color};">Status: <b>${hoveredArtist.status}</b></span>
        </div>
      `);
    } else if (this.tooltipEl && !hoveredArtist) {
      this.tooltipEl.classList.remove('is-visible');
    }

    ctx.restore();
  }

  // =========================================================================
  // VISUALIZATION 3A: THE "3 AM CONFESSIONAL" POLAR CLOCK
  // =========================================================================
  renderConfessionalPolar(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2 - 10;
    const maxR = Math.min(cx, cy) - 35;
    const minR = 45;

    ctx.save();

    // Center Hub
    ctx.beginPath();
    ctx.arc(cx, cy, minR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(18, 18, 22, 0.9)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 13px "Outfit", sans-serif';
    ctx.fillText('03:00 AM', cx, cy - 6);
    ctx.font = '9px "Space Mono", monospace';
    ctx.fillStyle = '#a78bfa';
    ctx.fillText('CONFESSIONAL', cx, cy + 8);

    // 24 Radial Hour Segments
    const mouseAngle = Math.atan2(this.mouse.y - cy, this.mouse.x - cx);
    const normalizedMouseAngle = (mouseAngle + Math.PI * 2.5) % (Math.PI * 2);
    const hoveredHour = Math.floor((normalizedMouseAngle / (Math.PI * 2)) * 24);

    let activeHoverData = null;

    for (let hour = 0; hour < 24; hour++) {
      const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
      const nextAngle = ((hour + 1) / 24) * Math.PI * 2 - Math.PI / 2;

      // Realistic circadian weight distribution (Peak at 2-3 AM and 10-11 AM)
      let weight = 0.25;
      let vibe = 'Ambient Flow';
      let color = '#38bdf8';
      let tempo = 110;

      if (hour >= 1 && hour <= 4) {
        weight = 0.88; // 3 AM Confessional
        vibe = 'Melancholic Indie Folk & Ambient';
        color = '#8b5cf6';
        tempo = 78;
      } else if (hour >= 9 && hour <= 12) {
        weight = 0.82; // 10 AM Catalyst
        vibe = 'High-Tempo Focus & Post-Punk';
        color = '#10b981';
        tempo = 136;
      } else if (hour >= 18 && hour <= 23) {
        weight = 0.65; // Night Unwind
        vibe = 'Neo-Psychedelia & French Touch';
        color = '#ec4899';
        tempo = 118;
      }

      const r = minR + weight * (maxR - minR);
      const isHovered = hoveredHour === hour;

      if (isHovered) {
        activeHoverData = { hour, vibe, tempo, weight, color };
      }

      // Draw Sector Wedge
      ctx.beginPath();
      ctx.arc(cx, cy, r, angle, nextAngle);
      ctx.arc(cx, cy, minR + 4, nextAngle, angle, true);
      ctx.closePath();

      ctx.fillStyle = isHovered ? color : `${color}55`;
      ctx.strokeStyle = isHovered ? '#ffffff' : `${color}88`;
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.fill();
      ctx.stroke();

      // Outer Hour Label (e.g. 00h, 06h, 12h, 18h)
      if (hour % 3 === 0) {
        const lblR = maxR + 16;
        const lx = cx + Math.cos(angle + (nextAngle - angle) / 2) * lblR;
        const ly = cy + Math.sin(angle + (nextAngle - angle) / 2) * lblR;

        ctx.font = '10px "Space Mono", monospace';
        ctx.fillStyle = '#71717a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${hour.toString().padStart(2, '0')}:00`, lx, ly);
      }
    }

    if (activeHoverData && this.tooltipEl) {
      this.showTooltip(this.mouse.x, this.mouse.y - 12, `
        <div class="dna-tt-header">${activeHoverData.hour.toString().padStart(2, '0')}:00 Ritual</div>
        <div class="dna-tt-artist" style="color:${activeHoverData.color};">${activeHoverData.vibe}</div>
        <div class="dna-tt-metrics">
          <span>Avg Tempo: <b>${activeHoverData.tempo} BPM</b></span>
          <span>Density: <b>${Math.round(activeHoverData.weight * 100)}%</b></span>
        </div>
      `);
    } else if (this.tooltipEl && !activeHoverData) {
      this.tooltipEl.classList.remove('is-visible');
    }

    ctx.restore();
  }

  // =========================================================================
  // VISUALIZATION 3B: THE 7-DAY × 24-HOUR CONFESSIONAL MATRIX
  // =========================================================================
  renderConfessionalMatrix(ctx, w, h) {
    const pad = { left: 55, right: 25, top: 40, bottom: 35 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const cellW = plotW / 24;
    const cellH = plotH / 7;

    ctx.save();

    // Day labels (Y-axis)
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    days.forEach((day, dIdx) => {
      ctx.fillText(day, pad.left - 10, pad.top + (dIdx + 0.5) * cellH);
    });

    // Hour labels (X-axis)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let hr = 0; hr < 24; hr += 2) {
      ctx.fillText(`${hr}h`, pad.left + (hr + 0.5) * cellW, pad.top - 6);
    }

    let hoveredCell = null;

    // Render cells
    for (let d = 0; d < 7; d++) {
      for (let hr = 0; hr < 24; hr++) {
        const x = pad.left + hr * cellW;
        const y = pad.top + d * cellH;

        // Peak 1: Friday 2 AM ("3 AM Confessional")
        // Peak 2: Tuesday 10 AM (Focus music)
        let intensity = 0.1;
        let color = '#38bdf8';
        let vibe = 'Normal Rotation';

        if (d === 4 && (hr === 2 || hr === 3)) { // Friday 2 AM
          intensity = 0.95;
          color = '#8b5cf6';
          vibe = '3 AM Confessional • Melancholic Folk & Ambient';
        } else if (d === 1 && (hr === 10 || hr === 11)) { // Tuesday 10 AM
          intensity = 0.9;
          color = '#10b981';
          vibe = '10 AM Tuesday • High-Tempo Focus & Post-Punk';
        } else if (d >= 4 && hr >= 21) {
          intensity = 0.7;
          color = '#ec4899';
          vibe = 'Weekend Groove & Synthpop';
        } else if (hr >= 14 && hr <= 17) {
          intensity = 0.45;
          color = '#38bdf8';
          vibe = 'Afternoon Dream Pop';
        }

        const isHovered = (
          this.mouse.x >= x && this.mouse.x < x + cellW &&
          this.mouse.y >= y && this.mouse.y < y + cellH
        );

        if (isHovered) {
          hoveredCell = { day: days[d], hour: hr, vibe, intensity, color };
        }

        ctx.fillStyle = isHovered ? color : `${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`;
        ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(0,0,0,0.5)';
        ctx.lineWidth = isHovered ? 1.5 : 1;

        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, cellW - 2, cellH - 2, 3);
        ctx.fill();
        ctx.stroke();
      }
    }

    if (hoveredCell && this.tooltipEl) {
      this.showTooltip(this.mouse.x, this.mouse.y - 12, `
        <div class="dna-tt-header">${hoveredCell.day} at ${hoveredCell.hour.toString().padStart(2, '0')}:00</div>
        <div class="dna-tt-artist" style="color:${hoveredCell.color};">${hoveredCell.vibe}</div>
        <div class="dna-tt-metrics">
          <span>Density: <b>${Math.round(hoveredCell.intensity * 100)}%</b></span>
        </div>
      `);
    } else if (this.tooltipEl && !hoveredCell) {
      this.tooltipEl.classList.remove('is-visible');
    }

    ctx.restore();
  }

  // =========================================================================
  // VISUALIZATION 4: THE GENRE CONSTELLATION (Force-Directed Graph)
  // =========================================================================
  renderGenreConstellation(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;

    // Simple spring-physics step
    const nodes = this.graphNodes;
    const edges = this.graphEdges;

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 180) {
          const force = (180 - dist) / 180 * 0.45;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (n1 !== this.draggedNode) { n1.vx -= fx; n1.vy -= fy; }
          if (n2 !== this.draggedNode) { n2.vx += fx; n2.vy += fy; }
        }
      }
    }

    // Spring attraction along edges
    for (const e of edges) {
      const src = nodes.find(n => n.id === e.source);
      const tgt = nodes.find(n => n.id === e.target);
      if (src && tgt) {
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const desired = 95;
        const force = (dist - desired) * 0.015;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (src !== this.draggedNode) { src.vx += fx; src.vy += fy; }
        if (tgt !== this.draggedNode) { tgt.vx -= fx; tgt.vy -= fy; }
      }
    }

    // Center gravity & velocity damping
    for (const n of nodes) {
      if (n !== this.draggedNode) {
        n.vx += (cx - n.x) * 0.003;
        n.vy += (cy - n.y) * 0.003;
        n.vx *= 0.88;
        n.vy *= 0.88;
        n.x += n.vx;
        n.y += n.vy;
      }
    }

    // Render Edges
    ctx.save();
    let hoveredNode = null;

    // Check hover
    for (const n of nodes) {
      const dx = this.mouse.x - n.x;
      const dy = this.mouse.y - n.y;
      if (Math.sqrt(dx * dx + dy * dy) <= n.radius + 6) {
        hoveredNode = n;
        break;
      }
    }

    for (const e of edges) {
      const src = nodes.find(n => n.id === e.source);
      const tgt = nodes.find(n => n.id === e.target);
      if (!src || !tgt) continue;

      const isConnected = hoveredNode && (hoveredNode.id === src.id || hoveredNode.id === tgt.id);
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);

      ctx.lineWidth = isConnected ? 2 : 1;
      ctx.strokeStyle = isConnected ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.12)';
      if (isConnected) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
    }

    // Render Star Nodes
    for (const n of nodes) {
      const isHovered = hoveredNode && hoveredNode.id === n.id;
      const r = isHovered ? n.radius * 1.25 : n.radius;

      // Glow halo
      const grad = ctx.createRadialGradient(n.x, n.y, r * 0.2, n.x, n.y, r * 1.5);
      grad.addColorStop(0, n.color);
      grad.addColorStop(0.7, `${n.color}55`);
      grad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Node core
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 0.85, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#ffffff' : n.color;
      ctx.fill();

      // Typography label
      ctx.font = '10px "Inter", sans-serif';
      ctx.fillStyle = isHovered ? '#ffffff' : '#d4d4d8';
      ctx.textAlign = 'center';
      ctx.fillText(n.name, n.x, n.y + r + 14);
    }

    if (hoveredNode && this.tooltipEl) {
      const connectedEdges = edges.filter(e => e.source === hoveredNode.id || e.target === hoveredNode.id);
      const sharedArtists = Array.from(new Set(connectedEdges.map(e => e.artist))).join(', ');

      this.showTooltip(hoveredNode.x, hoveredNode.y - 15, `
        <div class="dna-tt-header">${escapeHtml(hoveredNode.name)}</div>
        <div class="dna-tt-artist">Constellation Core</div>
        <div class="dna-tt-metrics">
          <span>Bridging Artists: <b>${escapeHtml(sharedArtists || 'Radiohead, Tame Impala')}</b></span>
        </div>
      `);
    } else if (this.tooltipEl && !hoveredNode) {
      this.tooltipEl.classList.remove('is-visible');
    }

    ctx.restore();
  }

  // =========================================================================
  // VISUALIZATION 5: PLAYLIST ARCHAEOLOGY (5-Year Stacked Area Timeline)
  // =========================================================================
  renderPlaylistArchaeology(ctx, w, h) {
    const pad = { left: 60, right: 35, top: 40, bottom: 45 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const eras = PLAYLIST_ARCHAEOLOGY_ERAS;
    const xSteps = 60; // 5 years in months

    ctx.save();

    // Generate stacked curve samples across 5 years
    // Era ribbons: Dream Pop (2021) -> Hyperpop (2022) -> Post-Punk (2023) -> Neo-Psych (2024) -> Nu-Jazz (2025/2026)
    const pointsPerEra = eras.map((era, eIdx) => {
      const pts = [];
      for (let s = 0; s <= xSteps; s++) {
        const center = (eIdx / (eras.length - 1)) * xSteps;
        const dist = Math.abs(s - center);
        const weight = Math.exp(-(dist * dist) / 60) * era.pct;
        pts.push(weight);
      }
      return pts;
    });

    // Normalize stacks to fill plotH
    const baseline = pad.top + plotH;
    const stackedTops = [];
    for (let s = 0; s <= xSteps; s++) {
      let sum = 0;
      for (let e = 0; e < eras.length; e++) sum += pointsPerEra[e][s];
      stackedTops.push(sum || 1);
    }

    // Render stacked area ribbons (from bottom to top)
    let currentBase = new Array(xSteps + 1).fill(baseline);

    for (let e = 0; e < eras.length; e++) {
      const era = eras[e];
      const newBase = [];

      ctx.beginPath();
      // Forward path (top of current layer)
      for (let s = 0; s <= xSteps; s++) {
        const x = pad.left + (s / xSteps) * plotW;
        const normH = (pointsPerEra[e][s] / stackedTops[s]) * (plotH * 0.85);
        const y = currentBase[s] - normH;
        newBase.push(y);
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Backward path (bottom of current layer)
      for (let s = xSteps; s >= 0; s--) {
        const x = pad.left + (s / xSteps) * plotW;
        ctx.lineTo(x, currentBase[s]);
      }
      ctx.closePath();

      const grad = ctx.createLinearGradient(pad.left, 0, pad.left + plotW, 0);
      grad.addColorStop(0, `${era.color}cc`);
      grad.addColorStop(1, `${era.color}77`);

      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = era.color;
      ctx.lineWidth = 1;
      ctx.stroke();

      currentBase = newBase;
    }

    // X-Axis Year Labels
    const years = ['2021', '2022', '2023', '2024', '2025', '2026'];
    ctx.font = '10px "Space Mono", monospace';
    ctx.fillStyle = '#a1a1aa';
    ctx.textAlign = 'center';
    years.forEach((yr, yIdx) => {
      const x = pad.left + (yIdx / (years.length - 1)) * plotW;
      ctx.fillText(yr, x, baseline + 16);
    });

    // Interactive Archaeological Time Needle
    if (this.mouse.x >= pad.left && this.mouse.x <= pad.left + plotW) {
      const scrubT = (this.mouse.x - pad.left) / plotW;
      const eraIdx = Math.min(eras.length - 1, Math.floor(scrubT * eras.length));
      const activeEra = eras[eraIdx];

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(this.mouse.x, pad.top);
      ctx.lineTo(this.mouse.x, baseline);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = activeEra.color;
      ctx.fill();

      if (this.tooltipEl) {
        this.showTooltip(this.mouse.x, pad.top + 30, `
          <div class="dna-tt-header">${activeEra.year} Era</div>
          <div class="dna-tt-artist" style="color:${activeEra.color};">${activeEra.name}</div>
          <div class="dna-tt-metrics">
            <span>Peak Anthem: <b>${activeEra.topTrack}</b></span>
            <span>Flavor: <b>${activeEra.desc}</b></span>
          </div>
        `);
      }
    } else if (this.tooltipEl) {
      this.tooltipEl.classList.remove('is-visible');
    }

    ctx.restore();
  }

  // =========================================================================
  // VISUALIZATION 6: THE SONIC EMOTIONAL COMPASS (4-Quadrant Valence vs Energy)
  // =========================================================================
  renderEmotionalCompass(ctx, w, h) {
    const pad = { left: 60, right: 35, top: 35, bottom: 48 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const midX = pad.left + plotW / 2;
    const midY = pad.top + plotH / 2;

    ctx.save();

    // 4-Quadrant Ambient Colored Fills
    // Q1 (Top-Right): Euphoric / Party (Gold/Orange)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
    ctx.fillRect(midX, pad.top, plotW / 2, plotH / 2);

    // Q2 (Top-Left): Angry / Intense (Red/Rose)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.04)';
    ctx.fillRect(pad.left, pad.top, plotW / 2, plotH / 2);

    // Q3 (Bottom-Left): Sad / Melancholic (Indigo/Violet)
    ctx.fillStyle = 'rgba(139, 92, 246, 0.05)';
    ctx.fillRect(pad.left, midY, plotW / 2, plotH / 2);

    // Q4 (Bottom-Right): Chill / Peaceful (Emerald/Cyan)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
    ctx.fillRect(midX, midY, plotW / 2, plotH / 2);

    // Crosshairs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(midX, pad.top);
    ctx.lineTo(midX, pad.top + plotH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pad.left, midY);
    ctx.lineTo(pad.left + plotW, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Quadrant Labels in corners
    ctx.font = '700 10px "Inter", sans-serif';

    // Q1: Euphoric
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'right';
    ctx.fillText('EUPHORIC / PARTY (22%)', pad.left + plotW - 12, pad.top + 16);

    // Q2: Angry / Intense
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'left';
    ctx.fillText('ANGRY / INTENSE (16%)', pad.left + 12, pad.top + 16);

    // Q3: Sad / Melancholic
    ctx.fillStyle = '#8b5cf6';
    ctx.textAlign = 'left';
    ctx.fillText('SAD / MELANCHOLIC (34%)', pad.left + 12, pad.top + plotH - 12);

    // Q4: Chill / Peaceful
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'right';
    ctx.fillText('CHILL / PEACEFUL (28%)', pad.left + plotW - 12, pad.top + plotH - 12);

    // Axis Labels
    ctx.font = '10px "Space Mono", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'center';
    ctx.fillText('← Low Valence (Melancholy) • Valence (Musical Positiveness) • High Valence (Euphoria) →', pad.left + plotW / 2, pad.top + plotH + 26);

    ctx.save();
    ctx.translate(pad.left - 42, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('← Low Energy (Calm) • Energy (Intensity) • High Energy (Dynamic) →', 0, 0);
    ctx.restore();

    // Plot Track Nodes
    const tracks = this.getTracksList();
    let closestItem = null;
    let closestDist = Infinity;

    for (const t of tracks) {
      const v = typeof t.valence === 'number' ? t.valence : 0.5;
      const e = typeof t.energy === 'number' ? t.energy : 0.6;

      const cx = pad.left + v * plotW;
      const cy = pad.top + (1 - e) * plotH;

      let quadColor = '#38bdf8';
      let quadArchetype = 'Chill / Peaceful';

      if (v >= 0.5 && e >= 0.5) {
        quadColor = '#f59e0b'; quadArchetype = 'Euphoric & Party Groove';
      } else if (v < 0.5 && e >= 0.5) {
        quadColor = '#ef4444'; quadArchetype = 'Angry / Intense Catharsis';
      } else if (v < 0.5 && e < 0.5) {
        quadColor = '#8b5cf6'; quadArchetype = 'Sad / Melancholic Introspection';
      } else {
        quadColor = '#10b981'; quadArchetype = 'Chill & Peaceful Bliss';
      }

      const dx = this.mouse.x - cx;
      const dy = this.mouse.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isHovered = dist <= 12;

      if (isHovered && dist < closestDist) {
        closestDist = dist;
        closestItem = { track: t, cx, cy, quadColor, quadArchetype, valence: v, energy: e };
      }

      const isCurrentActive = this.activeTrack?.id === t.id;
      const r = isHovered ? 9 : (isCurrentActive ? 7.5 : 5.5);

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = isHovered || isCurrentActive ? '#ffffff' : quadColor;
      ctx.strokeStyle = quadColor;
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    }

    this.hoveredItem = closestItem;
    if (closestItem && this.tooltipEl) {
      this.showTooltip(closestItem.cx, closestItem.cy, `
        <div class="dna-tt-header">${escapeHtml(closestItem.track.name)}</div>
        <div class="dna-tt-artist">${escapeHtml(closestItem.track.artists?.[0]?.name || 'Artist')}</div>
        <div class="dna-tt-metrics">
          <span style="color:${closestItem.quadColor};"><b>${closestItem.quadArchetype}</b></span>
          <span>Valence: <b>${Math.round(closestItem.valence * 100)}%</b></span>
          <span>Energy: <b>${Math.round(closestItem.energy * 100)}%</b></span>
        </div>
      `);
    } else if (this.tooltipEl && !closestItem) {
      this.tooltipEl.classList.remove('is-visible');
    }

    ctx.restore();
  }

  showTooltip(x, y, html) {
    if (!this.tooltipEl) return;
    this.tooltipEl.innerHTML = html;
    this.tooltipEl.style.left = `${Math.min(this.width - 200, Math.max(10, x + 15))}px`;
    this.tooltipEl.style.top = `${Math.min(this.height - 90, Math.max(10, y - 45))}px`;
    this.tooltipEl.classList.add('is-visible');
  }

  // =========================================================================
  // EXPORT HIGH-DPI POSTER SNAPSHOT
  // =========================================================================
  async exportSnapshot() {
    if (!this.canvas) return;
    try {
      showToast('Rendering high-resolution Audio DNA snapshot...', 'info', 2000);
      const dataUrl = this.canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `soulseekr-audio-dna-${this.activeViz}-${this.activeHorizon}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Snapshot downloaded successfully!', 'success', 2500);
    } catch (err) {
      showToast(`Export failed: ${err.message}`, 'error', 3000);
    }
  }
}

export const audioDna = new AudioDnaEngine();
