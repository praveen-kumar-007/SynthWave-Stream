// --- CONFIGURATION ---
// !!! IMPORTANT: Replace with your actual YouTube Data API v3 Key !!!
// !!! KEEP THIS SECRET IF DEPLOYING PUBLICLY (use a backend instead) !!!
const API_KEY = <Replace With your API>;
const MAX_RESULTS = 15; // Number of search results to fetch

// --- DOM ELEMENTS ---
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchResultsContainer = document.getElementById('searchResults');
const playerContainer = document.getElementById('youtubePlayer');
const nowPlayingTitle = document.getElementById('nowPlayingTitle');

// --- YOUTUBE PLAYER ---
let player; // Variable to hold the YT.Player instance

// This function is called automatically by the YouTube IFrame Player API
// *after* the API code downloads.
window.onYouTubeIframeAPIReady = function() {
    console.log("YouTube IFrame API Ready");
    // Initialize player placeholder - it won't load a video until search/click
    player = new YT.Player('youtubePlayer', {
        height: '100%', // Takes height from wrapper
        width: '100%',  // Takes width from wrapper
        videoId: '',    // No initial video
        playerVars: {
            'playsinline': 1, // Important for mobile playback
            'autoplay': 1,    // Autoplay when a new video is loaded
            'controls': 1,    // Show default YouTube controls
            'modestbranding': 1, // Less YouTube branding
            'rel': 0 // Don't show related videos at the end
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// Called when the player is ready
function onPlayerReady(event) {
    console.log("Player Ready");
    // You could potentially play a default video here if you wanted
    // event.target.playVideo();
}

// Called when the player's state changes (playing, paused, ended, etc.)
function onPlayerStateChange(event) {
    console.log("Player State Changed: ", event.data);
    // You can add logic here based on player state
    // For example, update UI when video ends (event.data == YT.PlayerState.ENDED)
}

// --- SEARCH FUNCTIONALITY ---

// Function to perform search when button clicked or Enter pressed
function performSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        alert("Please enter a search term.");
        return;
    }
    if (API_KEY === 'YOUR_API_KEY') {
        alert("ERROR: Please replace 'YOUR_API_KEY' in script.js with your actual YouTube API key.");
        return;
    }

    console.log(`Searching for: ${query}`);
    searchYouTube(query);
}

// Add event listeners for search
searchButton.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
});

// Function to call the YouTube Data API v3
async function searchYouTube(query) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${API_KEY}&type=video&maxResults=${MAX_RESULTS}&topicId=/m/04rlf`; // /m/04rlf is the topic ID for Music

    searchResultsContainer.innerHTML = '<p class="placeholder-text">Searching...</p>'; // Show loading indicator

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            console.error("YouTube API Error:", errorData);
            throw new Error(`API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
        }
        const data = await response.json();
        console.log("API Response:", data);
        displayResults(data.items);
    } catch (error) {
        console.error("Failed to fetch from YouTube API:", error);
        searchResultsContainer.innerHTML = `<p class="placeholder-text error-text">Error searching YouTube: ${error.message}. Check API key and console.</p>`;
        nowPlayingTitle.textContent = "Error loading results";
    }
}

// Function to display search results in the UI
function displayResults(items) {
    searchResultsContainer.innerHTML = ''; // Clear previous results or placeholder

    if (!items || items.length === 0) {
        searchResultsContainer.innerHTML = '<p class="placeholder-text">No results found.</p>';
        return;
    }

    items.forEach(item => {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const channel = item.snippet.channelTitle;
        // Use high quality thumbnail if available, otherwise default
        const thumbnailUrl = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url;

        const resultElement = document.createElement('div');
        resultElement.classList.add('result-item');
        resultElement.setAttribute('data-video-id', videoId);
        resultElement.setAttribute('data-video-title', title); // Store title for Now Playing

        resultElement.innerHTML = `
            <img src="${thumbnailUrl}" alt="${title} thumbnail">
            <div class="info">
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(channel)}</p>
            </div>
        `;

        // Add click listener to play the video
        resultElement.addEventListener('click', () => {
            playVideo(videoId, title);
        });

        searchResultsContainer.appendChild(resultElement);
    });
}

// Function to load and play a selected video
function playVideo(videoId, title) {
    if (player && typeof player.loadVideoById === 'function') {
        console.log(`Playing video: ${videoId} - ${title}`);
        player.loadVideoById(videoId);
        nowPlayingTitle.textContent = title; // Update the 'Now Playing' text
        nowPlayingTitle.title = title; // Add tooltip for long titles
    } else {
        console.error("Player is not ready or loadVideoById function is not available.");
        nowPlayingTitle.textContent = "Error: Player not ready.";
        // Optionally try to re-initialize the player or alert the user
        // It might mean the onYouTubeIframeAPIReady function hasn't fired yet
    }
}

// Simple HTML escaping function to prevent XSS from video titles/descriptions
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, '"')
         .replace(/'/g, "'");
 }

// --- Initial Setup ---
// Display initial placeholder text if needed (already in HTML, but could be done here too)
// searchResultsContainer.innerHTML = '<p class="placeholder-text">Search for music to get started...</p>';

