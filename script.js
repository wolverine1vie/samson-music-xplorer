const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const genreSelect = document.getElementById("genreSelect");
const filterSelect = document.getElementById("filterSelect");
const musicResults = document.getElementById("musicResults");
const statusMessage = document.getElementById("statusMessage");
const databaseMessage = document.getElementById("databaseMessage");

let searchSongs = [];
let savedSongs = [];

searchForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const searchText = searchInput.value.trim();

    if (searchText === "") {
        statusMessage.textContent = "Please enter an artist or song name.";
        return;
    }

    searchMusic(searchText);
});

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

function showSearchResults() {
    musicResults.innerHTML = "";

    const selectedGenre = genreSelect.value;

    let filteredSongs = searchSongs;

    if (selectedGenre !== "all") {
        filteredSongs = searchSongs.filter(function(song) {
            return song.genre === selectedGenre;
        });
    }

    if (filteredSongs.length === 0) {
        statusMessage.textContent = "No songs found for this filter.";
        return;
    }

    statusMessage.textContent =
        filteredSongs.length + " songs found.";

    filteredSongs.forEach(function(song) {
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

function saveSong(song) {
    const alreadySaved = savedSongs.some(function(savedSong) {
        return savedSong.id === song.id;
    });

    if (alreadySaved) {
        databaseMessage.textContent = "This song is already saved.";
        return;
    }

    savedSongs.push(song);

    databaseMessage.textContent =
        "Song added to the temporary collection. "
        + "Database connection will be added next.";
}

function showSavedSongs() {
    musicResults.innerHTML = "";

    if (savedSongs.length === 0) {
        statusMessage.textContent = "Your collection is empty.";
        return;
    }

    statusMessage.textContent =
        savedSongs.length + " saved songs.";

    const previousSongs = searchSongs;
    searchSongs = savedSongs;

    showSearchResults();

    searchSongs = previousSongs;
}

genreSelect.addEventListener("change", function() {
    showSearchResults();
});

filterSelect.addEventListener("change", function() {
    const selectedGenre = filterSelect.value;

    if (selectedGenre === "all") {
        showSavedSongs();
        return;
    }

    musicResults.innerHTML = "";

    const filteredSongs = savedSongs.filter(function(song) {
        return song.genre === selectedGenre;
    });

    if (filteredSongs.length === 0) {
        statusMessage.textContent =
            "No saved songs match this genre.";
        return;
    }

    const previousSongs = searchSongs;
    searchSongs = filteredSongs;

    showSearchResults();

    searchSongs = previousSongs;
});

document.getElementById("showSavedButton")
    .addEventListener("click", function() {
        showSavedSongs();
    });

document.getElementById("showSearchButton")
    .addEventListener("click", function() {
        showSearchResults();
    });
