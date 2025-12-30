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
    
    // Create Daily call frame in the video container
    dailyCallObject = window.DailyIframe.createFrame(
        document.getElementById('videoContainer'),
        {
            showLeaveButton: false,
            showFullscreenButton: true,
            iframeStyle: {
                width: '100%',
                height: '400px',
                border: '2px solid white',
                borderRadius: '15px'
            }
        }
    );
    
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
