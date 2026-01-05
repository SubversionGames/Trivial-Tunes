// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaVkjG2zXHVnY1NXpwsDXPvg_uCNrDsJ8",
  authDomain: "trivial-tunes.firebaseapp.com",
  databaseURL: "https://trivial-tunes-default-rtdb.firebaseio.com",
  projectId: "trivial-tunes",
  storageBucket: "trivial-tunes.firebasestorage.app",
  messagingSenderId: "320428434618",
  appId: "1:320428434618:web:e8c09a5a7a8e47a34fce83"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ============================================
// DAILY.CO VIDEO CHAT CONFIGURATION
// ============================================

// IMPORTANT: Replace this with your Daily.co room URL
// Get this by signing up at https://daily.co (free account)
// Then create a room and paste the URL here
const DAILY_ROOM_URL = "https://subversion-games.daily.co/TrivialTunes";

let dailyCallObject = null;

function initializeDailyCo() {
    if (!window.DailyIframe) {
        console.error('Daily.co SDK not loaded');
        return;
    }
    
    // Determine which container to use based on current profile
    let targetContainer;
    if (currentProfile === 'host') {
        targetContainer = document.getElementById('videoHost');
    } else if (currentProfile === 'team1') {
        targetContainer = document.getElementById('videoTeam1');
    } else if (currentProfile === 'team2') {
        targetContainer = document.getElementById('videoTeam2');
    } else if (currentProfile === 'stream') {
        targetContainer = document.getElementById('videoStream');
    }
    
    if (!targetContainer) {
        console.error('Video container not found for profile:', currentProfile);
        return;
    }
    
    // Create Daily call frame in the appropriate container
    dailyCallObject = window.DailyIframe.createFrame(targetContainer, {
        showLeaveButton: false,
        showFullscreenButton: false,
        iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '10px'
        }
    });
    
    // Join the room
    dailyCallObject.join({ url: DAILY_ROOM_URL });
    
    // Set username based on profile
    let userName = currentProfile;
    if (currentProfile === 'team1') {
        userName = teams.team1.players.join(' / ');
    } else if (currentProfile === 'team2') {
        userName = teams.team2.players.join(' / ');
    }
    
    dailyCallObject.setUserName(userName);
}

// Clean up Daily call when leaving
window.addEventListener('beforeunload', () => {
    if (dailyCallObject) {
        dailyCallObject.leave();
    }
});
