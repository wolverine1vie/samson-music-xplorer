const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const genreSelect = document.getElementById("genreSelect");
const filterSelect = document.getElementById("filterSelect");
const musicResults = document.getElementById("musicResults");
const statusMessage = document.getElementById("statusMessage");
const databaseMessage = document.getElementById("databaseMessage");
const backButton = document.getElementById("backButton");

let searchSongs = [];
let savedSongs = [];

// SEARCH FORM

searchForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const searchText = searchInput.value.trim();

    if (searchText === "") {
        statusMessage.textContent = "Please enter an artist or song name.";
        return;
    }

    searchMusic(searchText);
});


// GET DATA FROM ITUNES API

async function searchMusic(searchText) {
    statusMessage.textContent = "Loading music...";
    musicResults.innerHTML = "";

    try {
        const url = "https://itunes.apple.com/search?term="
            + encodeURIComponent(searchText)
            + "&entity=song&limit=30";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("The music service returned an error.");
        }

        const data = await response.json();

        searchSongs = data.results.map(function(song) {
            return {
                id: song.trackId,
                artist: song.artistName,
                title: song.trackName,
                album: song.collectionName || "Unknown album",
                genre: song.primaryGenreName || "Unknown",
                artwork: song.artworkUrl100,
                preview: song.previewUrl || ""
            };
        });

        showSearchResults();

    } catch (error) {
        statusMessage.textContent =
            "Could not load music. Please try again later.";

        console.error(error);
    }
}


// FILTER SEARCH RESULTS

function showSearchResults() {
    backButton.hidden = false;
    const selectedGenre = genreSelect.value;

    let filteredSongs = searchSongs;

    if (selectedGenre !== "all") {
        filteredSongs = searchSongs.filter(function(song) {
            return song.genre === selectedGenre;
        });
    }

    if (filteredSongs.length === 0) {
        musicResults.innerHTML = "";
        statusMessage.textContent = "No songs found.";
        return;
    }

    statusMessage.textContent = filteredSongs.length + " songs found.";

    displaySongs(filteredSongs, true);
}


// FILTER SAVED SONGS

async function showSavedSongs() {
    
    backButton.hidden = false;
    statusMessage.textContent = "Loading saved songs...";
    
    try {

        const response = await fetch(
            "https://samson-music-xplorer.lxi.be/get_songs.php"
        );

        const data = await response.json();

        if (data.status !== "success") {
            throw new Error("Could not retrieve saved songs.");
        }

        savedSongs = data.songs;

        console.log("Database songs:", savedSongs);

    } catch (error) {

        statusMessage.textContent = "Could not load saved songs.";
        console.error(error);
        return;
    }

    const selectedGenre = filterSelect.value;

    let filteredSongs = savedSongs;

    if (selectedGenre !== "all") {
        filteredSongs = savedSongs.filter(function(song) {
            return song.genre === selectedGenre;
        });
    }

    if (filteredSongs.length === 0) {
        musicResults.innerHTML = "";
        statusMessage.textContent = "No saved songs found.";
        return;
    }

    statusMessage.textContent =
        filteredSongs.length + " saved songs.";

    displaySongs(filteredSongs, false);
}

// DISPLAY SONGS ON WEBSITE

function displaySongs(songs, showSaveButton) {

    musicResults.innerHTML = "";

    songs.forEach(function(song) {

        const card = document.createElement("div");
        card.className = "music-card";

        const image = document.createElement("img");
        image.src = song.artwork;
        image.alt = "Album cover";

        const title = document.createElement("h3");
        title.textContent = song.title;

        const artist = document.createElement("p");
        artist.textContent = song.artist;

        const album = document.createElement("p");
        album.textContent = song.album;

        const genre = document.createElement("p");
        genre.textContent = song.genre;

        // CREATE ACTION BUTTON

        let actionButton = document.createElement("button");

        if (showSaveButton) {

            actionButton.textContent = "Save to My Collection";

            actionButton.addEventListener("click", function() {
                saveSong(song);
            });

        } else {

            actionButton.textContent = "Remove from Collection";

            actionButton.addEventListener("click", function() {
                deleteSong(song.db_id);
            });

        }

        // ADD ELEMENTS TO CARD

        card.appendChild(image);
        card.appendChild(title);
        card.appendChild(artist);
        card.appendChild(album);
        card.appendChild(genre);
        card.appendChild(actionButton);

        // PLAY MUSIC PREVIEW

        if (song.preview) {

            const previewButton = document.createElement("button");
            previewButton.textContent = "Play Preview";
            previewButton.style.marginTop = "8px";

            previewButton.addEventListener("click", function() {

                const audio = new Audio(song.preview);

                audio.play().catch(function() {
                    statusMessage.textContent =
                        "The preview could not be played.";
                });

            });

            card.appendChild(previewButton);
        }

        musicResults.appendChild(card);

    });
}


// SAVE SONG

function saveSong(song) {

    databaseMessage.textContent = "Saving to database server...";

    saveSongToDatabase(song);

}


// FILTER DROPDOWNS

genreSelect.addEventListener("change", function() {
    showSearchResults();
});

filterSelect.addEventListener("change", function() {
    showSavedSongs();
});

backButton.addEventListener("click", function() {

    musicResults.innerHTML = "";

    statusMessage.textContent = "Search for an artist to get started.";

    searchInput.value = "";
    genreSelect.value = "all";
    filterSelect.value = "all";

    databaseMessage.textContent = "";

    backButton.hidden = true;

    window.scrollTo({ top: 0, behavior: "smooth" });

});


// NAVIGATION BUTTONS

document.getElementById("showSavedButton")
    .addEventListener("click", function() {
        showSavedSongs();
    });

document.getElementById("showSearchButton")
    .addEventListener("click", function() {
        showSearchResults();
    });

// Push to GitHub

function saveSongToDatabase(songData) {

    const backendUrl = 'https://samson-music-xplorer.lxi.be/save_song.php';

    fetch(backendUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: songData.id,
            email: 'demo@example.com',
            title: songData.title,
            artist: songData.artist,
            album: songData.album || '',
            genre: songData.genre,
            artwork: songData.artwork,
            preview: songData.preview || ''
        })
    })
    .then(response => response.json())
    .then(data => {

        databaseMessage.textContent = data.message;

        if (data.status === 'success') {
            showSavedSongs();
        }

    })
    .catch(error => {
        console.error('Network or Server Error:', error);
        databaseMessage.textContent = 'Could not connect to the database.';
    });
}

// DELETE SONG FROM DATABASE

async function deleteSong(songId) {

    if (!confirm("Are you sure you want to remove this song?")) {
        return;
    }

    try {

        const response = await fetch(
            "https://samson-music-xplorer.lxi.be/delete_song.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: songId
                })
            }
        );

        const data = await response.json();

        if (data.status === "success") {

            databaseMessage.textContent = data.message;

            // Reload collection from database
            showSavedSongs();

        } else {

            databaseMessage.textContent = data.message;
        }

    } catch (error) {

        console.error("Delete error:", error);
        databaseMessage.textContent = "Could not delete song.";

    }
}
