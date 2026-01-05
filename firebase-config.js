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
    
    // Everyone joins the same call, but we'll create ONE shared frame
    // that shows all participants
    
    // We'll use a single container that shows all participants
    // Each profile will join the same room and see everyone
    
    let targetContainer = document.getElementById('videoHost'); // Use host container as main view
    
    // For non-host profiles, we still want to show all participants
    // So let's create the frame in a way that shows everyone
    
    dailyCallObject = window.DailyIframe.createCallObject({
        showLeaveButton: false,
        showFullscreenButton: false
    });
    
    // Join the room
    dailyCallObject.join({ url: DAILY_ROOM_URL })
        .then(() => {
            console.log('Successfully joined Daily.co room');
            
            // Set username based on profile
            let userName = currentProfile.toUpperCase();
            if (currentProfile === 'team1') {
                userName = teams.team1.players.join(' / ');
            } else if (currentProfile === 'team2') {
                userName = teams.team2.players.join(' / ');
            }
            
            dailyCallObject.setUserName(userName);
            
            // Now we need to show the video in the appropriate container
            setupVideoDisplay();
        })
        .catch(err => {
            console.error('Failed to join Daily.co room:', err);
        });
}

function setupVideoDisplay() {
    // Get all participants
    dailyCallObject.on('participant-joined', updateVideoLayout);
    dailyCallObject.on('participant-updated', updateVideoLayout);
    dailyCallObject.on('participant-left', updateVideoLayout);
    
    // Initial layout
    updateVideoLayout();
}

function updateVideoLayout() {
    const participants = dailyCallObject.participants();
    
    // Clear all video containers first
    ['videoHost', 'videoTeam1', 'videoTeam2', 'videoStream'].forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            // Keep the label but prepare for video
            const existingVideo = container.querySelector('video');
            if (existingVideo) {
                existingVideo.remove();
            }
        }
    });
    
    // Place each participant in their designated container based on username
    Object.values(participants).forEach(participant => {
        const userName = (participant.user_name || '').toLowerCase();
        let targetContainerId = null;
        
        if (userName.includes('host')) {
            targetContainerId = 'videoHost';
        } else if (userName.includes('team1') || userName.includes('team 1')) {
            targetContainerId = 'videoTeam1';
        } else if (userName.includes('team2') || userName.includes('team 2')) {
            targetContainerId = 'videoTeam2';
        } else if (userName.includes('stream')) {
            targetContainerId = 'videoStream';
        }
        
        if (targetContainerId && participant.video) {
            const container = document.getElementById(targetContainerId);
            const videoTrack = participant.tracks.video.persistentTrack;
            
            if (container && videoTrack) {
                // Create video element
                const videoEl = document.createElement('video');
                videoEl.srcObject = new MediaStream([videoTrack]);
                videoEl.autoplay = true;
                videoEl.playsInline = true;
                videoEl.style.width = '100%';
                videoEl.style.height = '100%';
                videoEl.style.objectFit = 'cover';
                
                // Clear container and add video
                container.innerHTML = '';
                container.appendChild(videoEl);
            }
        }
    });
}

// Clean up Daily call when leaving
window.addEventListener('beforeunload', () => {
    if (dailyCallObject) {
        dailyCallObject.leave();
    }
});
