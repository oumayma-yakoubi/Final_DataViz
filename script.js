// ****************************************
// ************* DATA LOADING *************
// ****************************************

async function loadAllUsersData() {
    return d3.json('data.json') // Use D3's `json` method to fetch and parse the JSON file
        .then(function(data) {
            return data;
        })
        .catch(function(error) {
            console.error('Error loading the JSON file:', error);
        });
}



// ***************************************************
// ********* fetch the genre for each artist *********
// ***************************************************

// Function to get Spotify access token
async function getSpotifyAccessToken(clientId, clientSecret) {
    const tokenUrl = "https://accounts.spotify.com/api/token";
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");

    const authString = btoa(`${clientId}:${clientSecret}`);

    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
            Authorization: `Basic ${authString}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
    });

    const data = await response.json();
    return data.access_token;
}


// Function to extract unique artists
function extractUniqueArtists(streamingHistory) {
    const artistSet = new Set();

    streamingHistory.forEach(track => {
        artistSet.add(track.artistName); // Adjust based on JSON structure
    });

    return Array.from(artistSet); 
}


// Helper to split an array into smaller chunks
function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

async function fetchArtistsBatchWithGlobalRateLimit(artistNames, accessToken) {
    const batches = chunkArray(artistNames, 10); // Split into batches of 10
    let allArtistData = [];

    for (const batch of batches) {
        const query = batch.map(name => encodeURIComponent(name)).join(",");
        const url = `https://api.spotify.com/v1/search?q=${query}&type=artist&limit=10`; // 10 artists per batch

        let attempt = 0;
        const maxRetries = 5;

        while (attempt < maxRetries) {
            try {
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (response.status === 429) {
                    const retryAfter = parseInt(response.headers.get("Retry-After")) || 1;
                    console.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    attempt++;
                    continue;
                }

                if (!response.ok) throw new Error(`Error fetching batch: ${response.statusText}`);
                const data = await response.json();
                allArtistData = allArtistData.concat(data.artists.items.map(artist => ({
                    name: artist.name,
                    genres: artist.genres,
                })));
                break; 
            } catch (error) {
                console.error(`Attempt ${attempt + 1} failed: ${error.message}`);
                attempt++;
                const backoffDelay = Math.pow(2, attempt) * 1000; 
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }
        }
    }

    return allArtistData;
}


async function init() {
    const clientId = "f4f33c59da0a42d98cedcedbd7d86c96"; 
    const clientSecret = "6ba45acf833d4f8ebc258145594d730f"; 

    // Load all users' data
    const allData = await loadAllUsersData();
   
    for (const userData of allData) {

        try {
            // Change this to false if you want to fetch the artist genre (if it's not done yet)
            const genreDataExists = true;

            // Check if the genre data file already exists in the genre repository            
            if (genreDataExists) {
                console.log(`Genre data already exists for user: ${userData.user}. Skipping fetch.`);
                continue; // Skip the whole process if genre data file exists
            }
            
            const uniqueArtists = extractUniqueArtists(userData.streamingHistory.music);
            console.log(`User: ${userData.user}, Unique Artists: ${uniqueArtists.length}`);

            // Authenticate with Spotify API
            const accessToken = await getSpotifyAccessToken(clientId, clientSecret);

            const artistGenreData = {};
            try {
                const batchData = await fetchArtistsBatchWithGlobalRateLimit(uniqueArtists, accessToken);
                batchData.forEach(artist => {
                    artistGenreData[artist.name] = artist.genres;
                });
                console.log(`Fetched genres for all artists.`);
            } catch (error) {
                console.error("Error fetching artist data:", error.message);
            }

            // Save to JSON file
            const fileName = `artistGenres_${userData.user}.json`;
            const blob = new Blob([JSON.stringify(artistGenreData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            console.log(`Genre data saved for user: ${userData.user}`);

            } catch (error) {
                console.error(`Error for user ${userData.user}:`, error.message);
            }
        
    }
}

init();
