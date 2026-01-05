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
const DAILY_ROOM_URL = "https://subversion-games.daily.co/TrivialTunes";

let dailyCallObject = null;

function initializeDailyCo() {
    if (!window.DailyIframe) {
        console.error('Daily.co SDK not loaded');
        return;
    }
    
    // Create a call object (gives us more control than iframe)
    dailyCallObject = window.DailyIframe.createCallObject({
        audioSource: true,
        videoSource: true
    });
    
    // Set up event listeners BEFORE joining
    dailyCallObject
        .on('joined-meeting', handleJoinedMeeting)
        .on('participant-joined', handleParticipantUpdate)
        .on('participant-updated', handleParticipantUpdate)
        .on('participant-left', handleParticipantLeft);
    
    // Determine username based on profile
    let userName = currentProfile.toUpperCase();
    if (currentProfile === 'team1') {
        userName = 'TEAM1';
    } else if (currentProfile === 'team2') {
        userName = 'TEAM2';
    } else if (currentProfile === 'stream') {
        userName = 'STREAM';
    } else if (currentProfile === 'host') {
        userName = 'HOST';
    }
    
    // Join the room with the username
    dailyCallObject.join({ 
        url: DAILY_ROOM_URL,
        userName: userName
    }).catch(err => {
        console.error('Failed to join Daily.co:', err);
    });
}

function handleJoinedMeeting(event) {
    console.log('Joined meeting as:', event.participants.local.user_name);
    
    // Add local video to the appropriate container
    addVideoToContainer(event.participants.local);
    
    // Add all existing remote participants
    Object.values(event.participants).forEach(participant => {
        if (!participant.local) {
            addVideoToContainer(participant);
        }
    });
}

function handleParticipantUpdate(event) {
    console.log('Participant updated:', event.participant.user_name);
    addVideoToContainer(event.participant);
}

function handleParticipantLeft(event) {
    console.log('Participant left:', event.participant.user_name);
    removeVideoFromContainer(event.participant);
}

function addVideoToContainer(participant) {
    const userName = (participant.user_name || '').toUpperCase();
    let containerId = null;
    
    // Map username to container
    if (userName.includes('HOST')) {
        containerId = 'videoHost';
    } else if (userName.includes('TEAM1')) {
        containerId = 'videoTeam1';
    } else if (userName.includes('TEAM2')) {
        containerId = 'videoTeam2';
    } else if (userName.includes('STREAM')) {
        containerId = 'videoStream';
    }
    
    if (!containerId) {
        console.warn('No container found for participant:', userName);
        return;
    }
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    // Check if participant has video track
    if (participant.video && participant.tracks?.video?.persistentTrack) {
        // Remove existing content
        container.innerHTML = '';
        
        // Create video element
        const videoEl = document.createElement('video');
        videoEl.id = `video-${participant.session_id}`;
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        videoEl.muted = participant.local; // Mute own video to avoid echo
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'cover';
        
        // Set video source
        const stream = new MediaStream([participant.tracks.video.persistentTrack]);
        if (participant.audio && participant.tracks?.audio?.persistentTrack) {
            stream.addTrack(participant.tracks.audio.persistentTrack);
        }
        videoEl.srcObject = stream;
        
        container.appendChild(videoEl);
    } else {
        // No video, show username
        container.innerHTML = `<span>${userName}</span>`;
    }
}

function removeVideoFromContainer(participant) {
    const userName = (participant.user_name || '').toUpperCase();
    let containerId = null;
    
    if (userName.includes('HOST')) {
        containerId = 'videoHost';
    } else if (userName.includes('TEAM1')) {
        containerId = 'videoTeam1';
    } else if (userName.includes('TEAM2')) {
        containerId = 'videoTeam2';
    } else if (userName.includes('STREAM')) {
        containerId = 'videoStream';
    }
    
    if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<span>${userName}</span>`;
        }
    }
}

// Clean up Daily call when leaving
window.addEventListener('beforeunload', () => {
    if (dailyCallObject) {
        dailyCallObject.leave();
        dailyCallObject.destroy();
    }
});
