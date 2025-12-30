// ============================================
// GAME DATA - EDIT THIS SECTION FOR EACH MATCH
// ============================================

const gameData = {
    round1: {
        categories: [
            "Category 1",
            "Category 2", 
            "Category 3",
            "Category 4",
            "Artist Feature" // This is the rightmost category (no artist needed for Final)
        ],
        clues: {
            // Format: "Category-PointValue": { youtubeId, startTime, artist, song }
            "Category 1-200": {
                youtubeId: "dQw4w9WgXcQ",
                startTime: 0,
                artist: "Rick Astley",
                song: "Never Gonna Give You Up"
            },
            "Category 1-400": {
                youtubeId: "dQw4w9WgXcQ",
                startTime: 10,
                artist: "Rick Astley",
                song: "Never Gonna Give You Up"
            },
            // ... continue for all clues in Round 1
        },
        trivialTunes: [
            {
                position: "Category 2-400", // Which clue this replaces
                artist: "The Beatles",
                albumCover: "https://upload.wikimedia.org/wikipedia/en/5/53/Beatles_-_Abbey_Road.jpg",
                songs: [
                    "Come Together",
                    "Something",
                    "Maxwell's Silver Hammer",
                    "Oh! Darling",
                    "Octopus's Garden",
                    "I Want You (She's So Heavy)",
                    "Here Comes the Sun",
                    "Because",
                    "You Never Give Me Your Money",
                    "Sun King",
                    "Mean Mr. Mustard",
                    "Polythene Pam",
                    "She Came In Through the Bathroom Window",
                    "Golden Slumbers",
                    "Carry That Weight",
                    "The End",
                    "Her Majesty"
                ]
            },
            {
                position: "Category 4-600", // Second TRIVIAL TUNES location
                artist: "Fleetwood Mac",
                albumCover: "https://example.com/rumours-album.jpg",
                songs: [
                    "Second Hand News",
                    "Dreams",
                    "Never Going Back Again",
                    "Don't Stop",
                    "Go Your Own Way",
                    "Songbird",
                    "The Chain",
                    "You Make Loving Fun",
                    "I Don't Want to Know",
                    "Oh Daddy",
                    "Gold Dust Woman"
                ]
            }
        ]
    },
    
    round2: {
        categories: [
            "Category 6",
            "Category 7",
            "Category 8",
            "Category 9",
            "Artist Feature 2"
        ],
        clues: {
            "Category 6-400": {
                youtubeId: "example123",
                startTime: 5,
                artist: "Example Artist",
                song: "Example Song"
            },
            // ... continue for all Round 2 clues
        }
        // No trivialTunes in Round 2
    },
    
    finalJeopardy: {
        youtubeId: "finalSongId",
        startTime: 0,
        artist: "Final Artist",
        song: "Final Song"
    }
};

// ============================================
// GLOBAL VARIABLES
// ============================================

let currentProfile = null;
let currentRound = 1;
let currentClue = null;
let youtubePlayer = null;
let playerReady = false;
let currentSongPausedTime = 0;
let buzzedPlayers = []; // Tracks who has buzzed for current clue
let gameState = {};

// Team data
let teams = {
    team1: {
        players: ["Player 1", "Player 2"],
        score: 0
    },
    team2: {
        players: ["Player 1", "Player 2"],
        score: 0
    }
};

// TRIVIAL TUNES state
let trivialTunesActive = false;
let trivialTunesTimer = null;
let trivialTunesData = null;
let selectedSongCount = 0;

// Final Jeopardy state
let finalWagers = {
    team1: null,
    team2: null
};
let finalCategory = null;

// ============================================
// PROFILE SELECTION
// ============================================

function selectProfile(profile) {
    currentProfile = profile;
    
    // Hide profile selection, show game container
    document.getElementById('profileSelection').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    
    // If Host, show team name entry screen
    if (profile === 'host') {
        document.getElementById('teamNameEntry').style.display = 'block';
    } else {
        // For non-host profiles, wait for game to start via Firebase
        document.getElementById('teamNameEntry').style.display = 'none';
        listenForGameStart();
    }
    
    // Initialize Firebase listener for this profile
    initializeFirebaseListeners();
}

// ============================================
// GAME START (HOST ONLY)
// ============================================

function startGame() {
    // Get team names from inputs
    teams.team1.players[0] = document.getElementById('team1Player1').value || "Player 1";
    teams.team1.players[1] = document.getElementById('team1Player2').value || "Player 2";
    teams.team2.players[0] = document.getElementById('team2Player1').value || "Player 1";
    teams.team2.players[1] = document.getElementById('team2Player2').value || "Player 2";
    
    // Update display names
    updateTeamNames();
    
    // Hide team entry, show game screen
    document.getElementById('teamNameEntry').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    
    // Generate the game board
    generateBoard(currentRound);
    
    // Show host controls
    if (currentProfile === 'host') {
        document.getElementById('hostControls').style.display = 'block';
    }
    
    // Sync to Firebase so other profiles see the game start
    syncGameStateToFirebase({
        gameStarted: true,
        teams: teams,
        round: currentRound
    });
}

function updateTeamNames() {
    const team1Name = teams.team1.players[0] + " / " + teams.team1.players[1];
    const team2Name = teams.team2.players[0] + " / " + teams.team2.players[1];
    
    document.getElementById('team1NameDisplay').textContent = team1Name;
    document.getElementById('team2NameDisplay').textContent = team2Name;
    
    // Also update Final Jeopardy displays
    document.getElementById('finalTeam1Name').textContent = team1Name;
    document.getElementById('finalTeam2Name').textContent = team2Name;
    document.getElementById('finalScoringTeam1Name').textContent = team1Name;
    document.getElementById('finalScoringTeam2Name').textContent = team2Name;
}

function listenForGameStart() {
    // Non-host profiles listen for when Host starts the game
    database.ref('gameState').on('value', (snapshot) => {
        const state = snapshot.val();
        if (state && state.gameStarted) {
            // Update local teams data
            teams = state.teams;
            updateTeamNames();
            
            // Show game screen
            document.getElementById('teamNameEntry').style.display = 'none';
            document.getElementById('gameScreen').style.display = 'block';
            
            // Generate board
            generateBoard(state.round);
            
            // Update scores
            updateScoreDisplay();
        }
    });
}

// ============================================
// BOARD GENERATION
// ============================================

function generateBoard(round) {
    const boardContainer = document.getElementById('gameBoard');
    boardContainer.innerHTML = ''; // Clear existing board
    
    const roundData = round === 1 ? gameData.round1 : gameData.round2;
    const pointValues = round === 1 ? [200, 400, 600, 800, 1000] : [400, 800, 1200, 1600, 2000];
    
    // Create category headers
    const categoryRow = document.createElement('div');
    categoryRow.className = 'board-row category-row';
    
    roundData.categories.forEach(category => {
        const categoryCell = document.createElement('div');
        categoryCell.className = 'board-cell category-cell';
        categoryCell.textContent = category;
        categoryRow.appendChild(categoryCell);
    });
    
    boardContainer.appendChild(categoryRow);
    
    // Create clue rows
    pointValues.forEach(points => {
        const clueRow = document.createElement('div');
        clueRow.className = 'board-row';
        
        roundData.categories.forEach(category => {
            const clueKey = `${category}-${points}`;
            const clueCell = document.createElement('div');
            clueCell.className = 'board-cell clue-cell';
            clueCell.textContent = points;
            clueCell.dataset.clueKey = clueKey;
            
            // Check if this is a TRIVIAL TUNES position
            const isTrivialTunes = round === 1 && roundData.trivialTunes.some(tt => tt.position === clueKey);
            
            if (isTrivialTunes) {
                clueCell.classList.add('trivial-tunes-cell');
                clueCell.textContent = 'TT'; // Show "TT" instead of points
            }
            
            // Only host can click clues
            if (currentProfile === 'host') {
                clueCell.onclick = () => selectClue(clueKey, points, round);
            }
            
            clueRow.appendChild(clueCell);
        });
        
        boardContainer.appendChild(clueRow);
    });
}

// ============================================
// CLUE SELECTION
// ============================================

function selectClue(clueKey, points, round) {
    // Check if this is a TRIVIAL TUNES
    const roundData = round === 1 ? gameData.round1 : gameData.round2;
    const trivialTune = roundData.trivialTunes?.find(tt => tt.position === clueKey);
    
    if (trivialTune) {
        startTrivialTunes(trivialTune, clueKey);
        return;
    }
    
    // Regular clue
    const clueData = roundData.clues[clueKey];
    if (!clueData) {
        console.error('Clue not found:', clueKey);
        return;
    }
    
    currentClue = {
        key: clueKey,
        points: points,
        ...clueData
    };
    
    // Disable the selected clue on the board
    const clueCell = document.querySelector(`[data-clue-key="${clueKey}"]`);
    if (clueCell) {
        clueCell.classList.add('disabled');
        clueCell.onclick = null;
        clueCell.textContent = '';
    }
    
    // Reset buzzer state
    buzzedPlayers = [];
    
    // Show clue display
    displayClue();
    
    // Play the song
    playYouTubeSong(clueData.youtubeId, clueData.startTime);
    
    // Sync to Firebase
    syncGameStateToFirebase({
        currentClue: currentClue,
        clueActive: true,
        buzzedPlayers: []
    });
}

function displayClue() {
    // Hide board, show clue display
    document.getElementById('gameBoard').style.display = 'none';
    document.getElementById('clueDisplay').style.display = 'block';
    document.getElementById('buzzerWindow').style.display = 'block';
    
    // Extract category name from clue key
    const categoryName = currentClue.key.split('-')[0];
    
    document.getElementById('clueCategory').textContent = categoryName;
    document.getElementById('clueValue').textContent = `$${currentClue.points}`;
    
    // Show answer for Host only (dimmed)
    if (currentProfile === 'host') {
        const answerDiv = document.getElementById('clueAnswer');
        answerDiv.style.display = 'block';
        answerDiv.style.opacity = '0.3';
        document.getElementById('answerText').textContent = 
            `${currentClue.artist} - ${currentClue.song}`;
    }
}

// ============================================
// YOUTUBE PLAYER
// ============================================

// YouTube API Ready callback
function onYouTubeIframeAPIReady() {
    youtubePlayer = new YT.Player('youtubePlayer', {
        height: '0',
        width: '0',
        playerVars: {
            'autoplay': 0,
            'controls': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    playerReady = true;
    console.log('YouTube player ready');
}

function onPlayerStateChange(event) {
    // Stop the video after 30 seconds
    if (event.data === YT.PlayerState.PLAYING) {
        setTimeout(() => {
            if (youtubePlayer && youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING) {
                youtubePlayer.pauseVideo();
                currentSongPausedTime = youtubePlayer.getCurrentTime();
            }
        }, 30000); // 30 seconds
    }
}

function playYouTubeSong(videoId, startTime) {
    if (!playerReady) {
        console.error('YouTube player not ready');
        setTimeout(() => playYouTubeSong(videoId, startTime), 500);
        return;
    }
    
    youtubePlayer.loadVideoById({
        videoId: videoId,
        startSeconds: startTime
    });
    
    currentSongPausedTime = startTime;
}

function resumeSong() {
    if (youtubePlayer && currentSongPausedTime) {
        youtubePlayer.seekTo(currentSongPausedTime);
        youtubePlayer.playVideo();
    }
}

function pauseSong() {
    if (youtubePlayer) {
        youtubePlayer.pauseVideo();
        currentSongPausedTime = youtubePlayer.getCurrentTime();
    }
}

// ============================================
// BUZZER SYSTEM
// ============================================

// Listen for spacebar press
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && currentClue && !trivialTunesActive) {
        event.preventDefault(); // Prevent page scrolling
        buzzIn();
    }
});

function buzzIn() {
    // Check if this profile can buzz
    if (currentProfile === 'stream' || currentProfile === 'host') {
        return; // Stream and Host cannot buzz
    }
    
    // Check if this player already buzzed for this clue
    const playerIdentifier = currentProfile; // "team1" or "team2"
    if (buzzedPlayers.some(b => b.player === playerIdentifier)) {
        console.log('Already buzzed for this clue');
        return;
    }
    
    // Record the buzz
    const buzzTime = Date.now();
    const buzzEntry = {
        player: playerIdentifier,
        timestamp: buzzTime,
        displayName: playerIdentifier === 'team1' ? 
            teams.team1.players.join(' / ') : 
            teams.team2.players.join(' / ')
    };
    
    buzzedPlayers.push(buzzEntry);
    
    // If this is the first buzz, pause the song
    if (buzzedPlayers.length === 1) {
        pauseSong();
    }
    
    // Update buzzer display
    updateBuzzerDisplay();
    
    // Sync to Firebase
    syncGameStateToFirebase({
        buzzedPlayers: buzzedPlayers
    });
}

function updateBuzzerDisplay() {
    const buzzerList = document.getElementById('buzzerList');
    buzzerList.innerHTML = '';
    
    // Sort by timestamp (earliest first)
    const sortedBuzzers = [...buzzedPlayers].sort((a, b) => a.timestamp - b.timestamp);
    
    sortedBuzzers.forEach((buzz, index) => {
        const buzzEntry = document.createElement('div');
        buzzEntry.className = 'buzz-entry';
        
        const position = document.createElement('span');
        position.className = 'buzz-position';
        position.textContent = `${index + 1}.`;
        
        const playerName = document.createElement('span');
        playerName.className = 'buzz-player';
        playerName.textContent = buzz.displayName;
        
        const timestamp = document.createElement('span');
        timestamp.className = 'buzz-timestamp';
        // Calculate time since first buzz
        const timeDiff = buzz.timestamp - sortedBuzzers[0].timestamp;
        timestamp.textContent = `+${timeDiff}ms`;
        
        buzzEntry.appendChild(position);
        buzzEntry.appendChild(playerName);
        buzzEntry.appendChild(timestamp);
        
        buzzerList.appendChild(buzzEntry);
    });
}

// ============================================
// SCORE ADJUSTMENT
// ============================================

function adjustScore(type) {
    if (currentProfile !== 'host') return;
    
    // Get selected team
    const selectedTeam = document.querySelector('input[name="scoreTeam"]:checked').value;
    const points = currentClue.points;
    
    let adjustment = 0;
    
    switch(type) {
        case 'plusFull':
            adjustment = points;
            break;
        case 'plusHalf':
            adjustment = points / 2;
            break;
        case 'minusHalf':
            adjustment = -(points / 2);
            break;
        case 'minusFull':
            adjustment = -points;
            break;
    }
    
    teams[selectedTeam].score += adjustment;
    updateScoreDisplay();
    
    // Sync to Firebase
    syncGameStateToFirebase({
        teams: teams
    });
}

function updateScoreDisplay() {
    document.getElementById('team1Score').textContent = teams.team1.score;
    document.getElementById('team2Score').textContent = teams.team2.score;
}

function editScore(team) {
    if (currentProfile !== 'host') return;
    
    const currentScore = teams[team].score;
    const newScore = prompt(`Enter new score for ${team === 'team1' ? 'Team 1' : 'Team 2'}:`, currentScore);
    
    if (newScore !== null && !isNaN(newScore)) {
        teams[team].score = parseInt(newScore);
        updateScoreDisplay();
        
        // Sync to Firebase
        syncGameStateToFirebase({
            teams: teams
        });
    }
}

function revealAnswer() {
    if (currentProfile !== 'host') return;
    
    // Make answer fully visible on host screen
    const answerDiv = document.getElementById('clueAnswer');
    answerDiv.style.opacity = '1';
    
    // Sync to Firebase to show on Stream profile
    syncGameStateToFirebase({
        answerRevealed: true
    });
}

function backToBoard() {
    if (currentProfile !== 'host') return;
    
    // Stop the song
    if (youtubePlayer) {
        youtubePlayer.stopVideo();
    }
    
    // Hide clue display, show board
    document.getElementById('clueDisplay').style.display = 'none';
    document.getElementById('buzzerWindow').style.display = 'none';
    document.getElementById('gameBoard').style.display = 'block';
    
    // Reset clue state
    currentClue = null;
    buzzedPlayers = [];
    
    // Check if round is complete
    checkRoundComplete();
    
    // Sync to Firebase
    syncGameStateToFirebase({
        currentClue: null,
        clueActive: false,
        answerRevealed: false,
        buzzedPlayers: []
    });
}

function checkRoundComplete() {
    const roundData = currentRound === 1 ? gameData.round1 : gameData.round2;
    const pointValues = currentRound === 1 ? [200, 400, 600, 800, 1000] : [400, 800, 1200, 1600, 2000];
    
    // Count total clues (including TRIVIAL TUNES)
    let totalClues = roundData.categories.length * pointValues.length;
    
    // Count disabled clues
    const disabledClues = document.querySelectorAll('.clue-cell.disabled').length;
    
    if (disabledClues >= totalClues) {
        // Round complete
        if (currentRound === 1) {
            // Move to Round 2
            if (confirm('Round 1 complete! Start Round 2?')) {
                currentRound = 2;
                generateBoard(2);
                syncGameStateToFirebase({
                    round: 2
                });
            }
        } else {
            // Round 2 complete, go to Final Jeopardy
            if (confirm('Round 2 complete! Start Final Jeopardy?')) {
                startWheelSpinner();
            }
        }
    }
}

// ============================================
// TRIVIAL TUNES
// ============================================

function startTrivialTunes(trivialTune, clueKey) {
    trivialTunesActive = true;
    trivialTunesData = trivialTune;
    
    // Disable the clue on board
    const clueCell = document.querySelector(`[data-clue-key="${clueKey}"]`);
    if (clueCell) {
        clueCell.classList.add('disabled');
        clueCell.onclick = null;
        clueCell.textContent = '';
    }
    
    // Hide board, show TRIVIAL TUNES
    document.getElementById('gameBoard').style.display = 'none';
    document.getElementById('trivialTunesDisplay').style.display = 'block';
    
    // Show artist name
    document.getElementById('ttArtist').textContent = `Artist: ${trivialTune.artist}`;
    
    // Show number selection
    document.getElementById('ttNumberSelection').style.display = 'block';
    
    // Sync to Firebase
    syncGameStateToFirebase({
        trivialTunesActive: true,
        trivialTunesData: trivialTune
    });
}

function selectSongCount(count) {
    if (currentProfile !== 'host') return;
    
    selectedSongCount = count;
    
    // Hide number selection, show album
    document.getElementById('ttNumberSelection').style.display = 'none';
    document.getElementById('ttAlbum').style.display = 'block';
    document.getElementById('ttSongs').style.display = 'block';
    
    // Load album cover
    document.getElementById('ttAlbumCover').src = trivialTunesData.albumCover;
    
    // Generate song list
    generateTrivialTunesSongList();
    
    // Show host controls
    if (currentProfile === 'host') {
        document.getElementById('ttHostControls').style.display = 'block';
    }
    
    // Start 30 second timer
    startTrivialTunesTimer();
    
    // Sync to Firebase
    syncGameStateToFirebase({
        selectedSongCount: count,
        ttTimerStarted: true
    });
}

function generateTrivialTunesSongList() {
    const songList = document.getElementById('ttSongList');
    songList.innerHTML = '';
    
    trivialTunesData.songs.forEach((song, index) => {
        const songButton = document.createElement('button');
        songButton.className = 'tt-song-button';
        songButton.textContent = `${index + 1}. ${song}`;
        songButton.dataset.songIndex = index;
        
        // Only host can click to reveal
        if (currentProfile === 'host') {
            songButton.onclick = () => revealTrack(index);
        }
        
        songList.appendChild(songButton);
    });
}

function revealTrack(index) {
    const songButton = document.querySelector(`[data-song-index="${index}"]`);
    if (songButton) {
        songButton.classList.add('revealed');
    }
    
    // Sync to Firebase
    syncGameStateToFirebase({
        ttRevealedTracks: getRevealedTracks()
    });
}

function revealAllTracks() {
    if (currentProfile !== 'host') return;
    
    const allButtons = document.querySelectorAll('.tt-song-button');
    allButtons.forEach(button => {
        button.classList.add('revealed');
    });
    
    // Sync to Firebase
    syncGameStateToFirebase({
        ttRevealedTracks: getRevealedTracks()
    });
}

function getRevealedTracks() {
    const revealed = [];
    document.querySelectorAll('.tt-song-button.revealed').forEach(button => {
        revealed.push(parseInt(button.dataset.songIndex));
    });
    return revealed;
}

function startTrivialTunesTimer() {
    let timeLeft = 30;
    document.getElementById('ttTimer').textContent = timeLeft;
    
    trivialTunesTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('ttTimer').textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(trivialTunesTimer);
        }
    }, 1000);
}

function ttSuccess() {
    if (currentProfile !== 'host') return;
    
    // Count revealed tracks
    const revealedCount = getRevealedTracks().length;
    
    // Check if they met their goal
    if (revealedCount >= selectedSongCount) {
        // Award 100 points per song in their selected count
        const teamRadio = document.querySelector('input[name="scoreTeam"]:checked');
        if (teamRadio) {
            const team = teamRadio.value;
            teams[team].score += (selectedSongCount * 100);
            updateScoreDisplay();
            
            alert(`Success! ${selectedSongCount * 100} points awarded!`);
        }
    } else {
        alert(`Only ${revealedCount} correct. Needed ${selectedSongCount}. No points awarded.`);
    }
    
    endTrivialTunes();
}

function ttFail() {
    if (currentProfile !== 'host') return;
    
    alert('Failed! No points awarded.');
    endTrivialTunes();
}

function endTrivialTunes() {
    // Clear timer
    if (trivialTunesTimer) {
        clearInterval(trivialTunesTimer);
    }
    
    // Hide TRIVIAL TUNES, show board
    document.getElementById('trivialTunesDisplay').style.display = 'none';
    document.getElementById('gameBoard').style.display = 'block';
    
    // Reset state
    trivialTunesActive = false;
    trivialTunesData = null;
    selectedSongCount = 0;
    
    // Check if round complete
    checkRoundComplete();
    
    // Sync to Firebase
    syncGameStateToFirebase({
        trivialTunesActive: false,
        teams: teams
    });
}

// ============================================
// FINAL JEOPARDY - WHEEL SPINNER
// ============================================

let wheelSpinning = false;
let wheelRotation = 0;

function startWheelSpinner() {
    // Hide board, show wheel
    document.getElementById('gameBoard').style.display = 'none';
    document.getElementById('wheelSpinner').style.display = 'block';
    
    // Draw the wheel
    drawWheel();
    
    // Sync to Firebase
    syncGameStateToFirebase({
        wheelActive: true
    });
}

function drawWheel() {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 200;
    
    // Get eligible categories (all except rightmost from each round)
    const eligibleCategories = [];
    
    // Round 1 categories (exclude last one)
    for (let i = 0; i < gameData.round1.categories.length - 1; i++) {
        eligibleCategories.push({
            name: gameData.round1.categories[i],
            round: 1
        });
    }
    
    // Round 2 categories (exclude last one)
    for (let i = 0; i < gameData.round2.categories.length - 1; i++) {
        eligibleCategories.push({
            name: gameData.round2.categories[i],
            round: 2
        });
    }
    
    const numSegments = eligibleCategories.length;
    const anglePerSegment = (2 * Math.PI) / numSegments;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw segments
    eligibleCategories.forEach((category, index) => {
        const startAngle = wheelRotation + (index * anglePerSegment);
        const endAngle = startAngle + anglePerSegment;
        
        // Alternate colors
        ctx.fillStyle = index % 2 === 0 ? '#0066cc' : '#004080';
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        
        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(category.name, radius / 2, 5);
        ctx.restore();
    });
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw pointer at top
    ctx.beginPath();
    ctx.moveTo(centerX - 10, 30);
    ctx.lineTo(centerX + 10, 30);
    ctx.lineTo(centerX, 50);
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();
    
    // Store categories for selection
    canvas.eligibleCategories = eligibleCategories;
}

function spinWheel() {
    if (wheelSpinning || currentProfile !== 'host') return;
    
    wheelSpinning = true;
    
    const canvas = document.getElementById('wheelCanvas');
    const eligibleCategories = canvas.eligibleCategories;
    const numSegments = eligibleCategories.length;
    const anglePerSegment = (2 * Math.PI) / numSegments;
    
    // Random number of spins (3-6 full rotations) plus random angle
    const spins = 3 + Math.random() * 3;
    const randomAngle = Math.random() * 2 * Math.PI;
    const totalRotation = (spins * 2 * Math.PI) + randomAngle;
    
    const startTime = Date.now();
    const duration = 4000; // 4 seconds
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        wheelRotation = totalRotation * easeOut;
        drawWheel();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            wheelSpinning = false;
            selectWheelCategory();
        }
    }
    
    animate();
}

function selectWheelCategory() {
    const canvas = document.getElementById('wheelCanvas');
    const eligibleCategories = canvas.eligibleCategories;
    const numSegments = eligibleCategories.length;
    const anglePerSegment = (2 * Math.PI) / numSegments;
    
    // Normalize rotation to 0-2π
    const normalizedRotation = wheelRotation % (2 * Math.PI);
    
    // Calculate which segment is at the top (pointing at the red arrow)
    // The top is at angle 3π/2 (270 degrees), so we adjust
    const adjustedAngle = (2 * Math.PI - normalizedRotation + (3 * Math.PI / 2)) % (2 * Math.PI);
    const selectedIndex = Math.floor(adjustedAngle / anglePerSegment);
    
    finalCategory = eligibleCategories[selectedIndex];
    
    // Display result
    document.getElementById('wheelResult').textContent = 
        `Selected Category: ${finalCategory.name}`;
    document.getElementById('startFinalBtn').style.display = 'block';
    
    // Sync to Firebase
    syncGameStateToFirebase({
        finalCategory: finalCategory
    });
}

function startFinalJeopardy() {
    if (currentProfile !== 'host') return;
    
    // Hide wheel, show wagering
    document.getElementById('wheelSpinner').style.display = 'none';
    document.getElementById('finalWagering').style.display = 'block';
    
    // Display category
    document.getElementById('finalCategory').textContent = 
        `Category: ${finalCategory.name}`;
    
    // Sync to Firebase
    syncGameStateToFirebase({
        finalWageringActive: true
    });
}

// ============================================
// FINAL JEOPARDY - WAGERING & SCORING
// ============================================

function submitWager(team) {
    if (currentProfile !== 'host') return;
    
    const wagerInput = document.getElementById(`${team}Wager`);
    const wager = parseInt(wagerInput.value);
    
    // Validate wager
    if (isNaN(wager) || wager < 0 || wager > teams[team].score) {
        alert(`Invalid wager. Must be between 0 and ${teams[team].score}`);
        return;
    }
    
    finalWagers[team] = wager;
    wagerInput.disabled = true;
    
    // Disable the button
    event.target.disabled = true;
    event.target.textContent = 'Locked ✓';
    
    // Check if both wagers are in
    if (finalWagers.team1 !== null && finalWagers.team2 !== null) {
        document.getElementById('finalReady').style.display = 'block';
    }
    
    // Sync to Firebase
    syncGameStateToFirebase({
        finalWagers: finalWagers
    });
}

function playFinalClue() {
    if (currentProfile !== 'host') return;
    
    // Hide wagering, show clue
    document.getElementById('finalWagering').style.display = 'none';
    document.getElementById('finalClueDisplay').style.display = 'block';
    
    // Show scoring controls for host
    if (currentProfile === 'host') {
        document.getElementById('finalScoring').style.display = 'block';
        
        // Display wagers
        document.getElementById('team1WagerDisplay').textContent = finalWagers.team1;
        document.getElementById('team2WagerDisplay').textContent = finalWagers.team2;
    }
    
    // Play the final clue song
    const finalData = gameData.finalJeopardy;
    playYouTubeSong(finalData.youtubeId, finalData.startTime);
    
    // Show answer for host (dimmed)
    if (currentProfile === 'host') {
        setTimeout(() => {
            const answerDiv = document.getElementById('finalAnswer');
            answerDiv.style.display = 'block';
            answerDiv.style.opacity = '0.3';
            document.getElementById('finalAnswerText').textContent = 
                `${finalData.artist} - ${finalData.song}`;
        }, 1000);
    }
    
    // Sync to Firebase
    syncGameStateToFirebase({
        finalClueActive: true
    });
}

function finalAdjustScore(team, result) {
    if (currentProfile !== 'host') return;
    
    const wager = finalWagers[team];
    let adjustment = 0;
    
    switch(result) {
        case 'full': // Both correct
            adjustment = wager;
            break;
        case 'half': // One correct
            adjustment = wager / 2;
            break;
        case 'wrongHalf': // One wrong
            adjustment = -(wager / 2);
            break;
        case 'wrongFull': // Both wrong
            adjustment = -wager;
            break;
    }
    
    teams[team].score += adjustment;
    updateScoreDisplay();
    
    // Disable the buttons for this team
    const buttons = document.querySelectorAll(`#finalScoring .final-score-team button`);
    const teamIndex = team === 'team1' ? 0 : 1;
    const teamButtons = document.querySelectorAll(`#finalScoring .final-score-team:nth-child(${teamIndex + 1}) button`);
    teamButtons.forEach(btn => btn.disabled = true);
    
    // Check if both teams scored
    const allDisabled = document.querySelectorAll('#finalScoring button:not(:disabled)').length === 0;
    if (allDisabled) {
        setTimeout(() => {
            announceWinner();
        }, 2000);
    }
    
    // Sync to Firebase
    syncGameStateToFirebase({
        teams: teams
    });
}

function announceWinner() {
    const team1Name = teams.team1.players.join(' / ');
    const team2Name = teams.team2.players.join(' / ');
    const team1Score = teams.team1.score;
    const team2Score = teams.team2.score;
    
    let message = `FINAL SCORES:\n\n`;
    message += `${team1Name}: $${team1Score}\n`;
    message += `${team2Name}: $${team2Score}\n\n`;
    
    if (team1Score > team2Score) {
        message += `🏆 ${team1Name} WINS! 🏆`;
    } else if (team2Score > team1Score) {
        message += `🏆 ${team2Name} WINS! 🏆`;
    } else {
        message += `🤝 IT'S A TIE! 🤝`;
    }
    
    alert(message);
}

// ============================================
// FIREBASE SYNCHRONIZATION
// ============================================

function syncGameStateToFirebase(updates) {
    // Merge updates into current gameState
    gameState = { ...gameState, ...updates };
    
    // Push to Firebase
    database.ref('gameState').update(gameState);
}

function initializeFirebaseListeners() {
    database.ref('gameState').on('value', (snapshot) => {
        const state = snapshot.val();
        if (!state) return;
        
        // Update local gameState
        gameState = state;
        
        // Don't process updates if this is the host (host makes the changes)
        if (currentProfile === 'host') return;
        
        // Handle different state updates
        if (state.teams) {
            teams = state.teams;
            updateScoreDisplay();
            updateTeamNames();
        }
        
        if (state.currentClue && state.clueActive) {
            currentClue = state.currentClue;
            displayClue();
            playYouTubeSong(currentClue.youtubeId, currentClue.startTime);
        }
        
        if (state.clueActive === false && document.getElementById('clueDisplay').style.display === 'block') {
            // Clue ended, return to board
            document.getElementById('clueDisplay').style.display = 'none';
            document.getElementById('buzzerWindow').style.display = 'none';
            document.getElementById('gameBoard').style.display = 'block';
            if (youtubePlayer) {
                youtubePlayer.stopVideo();
            }
        }
        
        if (state.buzzedPlayers) {
            buzzedPlayers = state.buzzedPlayers;
            updateBuzzerDisplay();
            
            // If someone buzzed and we're playing, pause
            if (buzzedPlayers.length > 0 && youtubePlayer && youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING) {
                pauseSong();
            }
        }
        
        if (state.answerRevealed && currentProfile === 'stream') {
            // Show answer on stream profile
            const answerDiv = document.getElementById('clueAnswer');
            answerDiv.style.display = 'block';
            answerDiv.style.opacity = '1';
            document.getElementById('answerText').textContent = 
                `${currentClue.artist} - ${currentClue.song}`;
        }
        
        if (state.round && state.round !== currentRound) {
            currentRound = state.round;
            generateBoard(currentRound);
        }
        
        // TRIVIAL TUNES sync
        if (state.trivialTunesActive && !trivialTunesActive) {
            trivialTunesActive = true;
            trivialTunesData = state.trivialTunesData;
            document.getElementById('gameBoard').style.display = 'none';
            document.getElementById('trivialTunesDisplay').style.display = 'block';
            document.getElementById('ttArtist').textContent = `Artist: ${trivialTunesData.artist}`;
        }
        
        if (state.selectedSongCount && currentProfile !== 'host') {
            selectedSongCount = state.selectedSongCount;
            document.getElementById('ttNumberSelection').style.display = 'none';
            document.getElementById('ttAlbum').style.display = 'block';
            document.getElementById('ttSongs').style.display = 'block';
            document.getElementById('ttAlbumCover').src = trivialTunesData.albumCover;
            generateTrivialTunesSongList();
        }
        
        if (state.ttTimerStarted && !trivialTunesTimer) {
            startTrivialTunesTimer();
        }
        
        if (state.ttRevealedTracks) {
            state.ttRevealedTracks.forEach(index => {
                const button = document.querySelector(`[data-song-index="${index}"]`);
                if (button) button.classList.add('revealed');
            });
        }
        
        if (state.trivialTunesActive === false && trivialTunesActive) {
            endTrivialTunes();
        }
        
        // Final Jeopardy sync
        if (state.wheelActive && document.getElementById('wheelSpinner').style.display === 'none') {
            document.getElementById('gameBoard').style.display = 'none';
            document.getElementById('wheelSpinner').style.display = 'block';
            drawWheel();
        }
        
        if (state.finalCategory) {
            finalCategory = state.finalCategory;
            document.getElementById('wheelResult').textContent = 
                `Selected Category: ${finalCategory.name}`;
        }
        
        if (state.finalWageringActive && document.getElementById('finalWagering').style.display === 'none') {
            document.getElementById('wheelSpinner').style.display = 'none';
            document.getElementById('finalWagering').style.display = 'block';
            document.getElementById('finalCategory').textContent = 
                `Category: ${finalCategory.name}`;
        }
        
        if (state.finalWagers) {
            finalWagers = state.finalWagers;
        }
        
        if (state.finalClueActive && document.getElementById('finalClueDisplay').style.display === 'none') {
            document.getElementById('finalWagering').style.display = 'none';
            document.getElementById('finalClueDisplay').style.display = 'block';
            
            const finalData = gameData.finalJeopardy;
            playYouTubeSong(finalData.youtubeId, finalData.startTime);
            
            if (currentProfile === 'stream' && state.answerRevealed) {
                const answerDiv = document.getElementById('finalAnswer');
                answerDiv.style.display = 'block';
                answerDiv.style.opacity = '1';
                document.getElementById('finalAnswerText').textContent = 
                    `${finalData.artist} - ${finalData.song}`;
            }
        }
    });
}

// Initialize YouTube API
onYouTubeIframeAPIReady();
