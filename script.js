const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const genreSelect = document.getElementById("genreSelect");
const filterSelect = document.getElementById("filterSelect");
const musicResults = document.getElementById("musicResults");
const statusMessage = document.getElementById("statusMessage");
const databaseMessage = document.getElementById("databaseMessage");

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

    displaySongs(filteredSongs);
}


// FILTER SAVED SONGS

async function showSavedSongs() {
        try {

        const response = await fetch(
            "https://samson-music-xplorer.lxi.be/get_songs.php"
        );

        const data = await response.json();

        if (data.status !== "success") {
            throw new Error("Could not retrieve saved songs.");
        }

        savedSongs = data.songs;

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

    displaySongs(filteredSongs);
}


// DISPLAY SONGS ON WEBSITE

function displaySongs(songs) {

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

        const saveButton = document.createElement("button");
        saveButton.textContent = "Save to My Collection";

        saveButton.addEventListener("click", function() {
            saveSong(song);
        });

        card.appendChild(image);
        card.appendChild(title);
        card.appendChild(artist);
        card.appendChild(album);
        card.appendChild(genre);
        card.appendChild(saveButton);

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

    const alreadySaved = savedSongs.some(function(savedSong) {
        return savedSong.id === song.id;
    });

    if (alreadySaved) {
        databaseMessage.textContent = "This song is already saved.";
        return;
    }

    savedSongs.push(song);

    databaseMessage.textContent = "Saving to database server...";
    //database transfer function here 
    saveSongToDatabase(song);

}


// FILTER DROPDOWNS

genreSelect.addEventListener("change", function() {
    showSearchResults();
});

filterSelect.addEventListener("change", function() {
    showSavedSongs();
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
    // Specify the full path pointing to your LXI domain
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
            preview_url: songData.preview || ''
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Song saved successfully to your remote MariaDB database!');
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Network or Server Error:', error);
    });
}
