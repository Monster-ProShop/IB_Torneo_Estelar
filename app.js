// ==========================================
// 1. STATE MANAGEMENT (The "Database")
// ==========================================
let leagueState = JSON.parse(localStorage.getItem('torneo_estelar')) || {
    season: 1,
    teams: [],
    bowlers: [],
    schedule: [],
    scores: [],
    honorScores: [], // Stores 300s and 800+
    totalWeeks: 36,
    currentWeek: 1
};

function saveState() {
    localStorage.setItem('torneo_estelar', JSON.stringify(leagueState));
}

// ==========================================
// 2. BACKUP: EXPORT & IMPORT
// ==========================================
function exportTournament() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leagueState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Torneo_Estelar_Backup_S${leagueState.season}_W${leagueState.currentWeek}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importTournament(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if(confirm("Warning: This will overwrite the current league data. Proceed?")) {
                leagueState = importedData;
                saveState();
                alert("Tournament data restored successfully.");
                location.reload(); // Refresh UI with new data
            }
        } catch (error) {
            alert("Invalid tournament file format.");
        }
    };
    reader.readAsText(file);
}

// ==========================================
// 3. THE HANDICAP ENGINE
// ==========================================
function calculateHandicap(bowler, weekGamesPlayedArray) {
    // Determine the base average to use
    let activeAvg = bowler.enteringAvg; 
    let baseHdcp = 0;

    // Is this a New Bowler (no entering avg) on their very first session?
    if (bowler.enteringAvg === null && bowler.gamesPlayed < 3) {
        let validGamesThisSession = weekGamesPlayedArray.filter(g => typeof g === 'number' && g !== 'blind').length;
        if (validGamesThisSession < 2) {
            return 0; // The 2-game minimum rule for new entries
        }
    }

    // Freeze average for 9 games
    if (bowler.gamesPlayed >= 9 || bowler.enteringAvg === null) {
        activeAvg = bowler.liveAverage; 
    }

    // Core formula
    baseHdcp = Math.floor((220 - activeAvg) * 0.90);
    if (baseHdcp < 0) baseHdcp = 0;

    // Category Maximum Limits
    switch(bowler.category) {
        case 'Oro': return Math.min(baseHdcp, 10);
        case 'Plata': return Math.min(baseHdcp, 20);
        case 'Bronze': return Math.min(baseHdcp, 30);
        case 'Niquel': 
            return bowler.gender === 'F' ? Math.min(baseHdcp, 50) : Math.min(baseHdcp, 40);
        default: return 0;
    }
}

// ==========================================
// 4. SCORE ENTRY LOGIC (Handling Blinds)
// ==========================================
function processGameScore(inputStr) {
    if (inputStr.trim().toLowerCase() === 'b') {
        return { score: 190, isBlind: true, handicapApplied: 0 }; // Automated blind protocol
    }
    const score = parseInt(inputStr);
    return { score: isNaN(score) ? 0 : score, isBlind: false };
}

// ==========================================
// 5. SEASON ROLLOVER (End Tournament)
// ==========================================
function endTournament() {
    if(!confirm("Are you sure you want to end the season? This will permanently archive current scores and recalculate rollover averages for the new season.")) {
        return;
    }

    // Step 1: Export a final safety backup automatically
    exportTournament();

    // Step 2: Process Bowlers for Rollover
    leagueState.bowlers.forEach(bowler => {
        if (bowler.gamesPlayed >= 12) {
            // Veteran: Lock in ending average for next season's frozen 9 games
            bowler.enteringAvg = bowler.liveAverage;
        } else {
            // New Entry: Wipe clean, handicap will calculate dynamically weekly
            bowler.enteringAvg = null;
        }
        
        // Reset counters for the new season
        bowler.gamesPlayed = 0;
        bowler.totalPinfall = 0;
        bowler.liveAverage = 0;
    });

    // Step 3: Archive current tables
    leagueState.season += 1;
    leagueState.currentWeek = 1;
    leagueState.scores = [];
    leagueState.schedule = [];
    leagueState.honorScores = [];
    
    saveState();
    alert("Season ended successfully. Rollover averages applied. New season initialized.");
    location.reload();
}

// ==========================================
// 6. UI NAVIGATION
// ==========================================
function switchTab(tabId) {
    console.log("Switching to UI tab:", tabId);
    // Logic to toggle .active class on HTML sections
}
