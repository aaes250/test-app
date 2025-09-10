const CLIENT_ID = "821c2e004b094b928bdf7d4ab553e034";
const REDIRECT_URI = "https://aaes250.github.io/test-app/"; // must match Spotify dashboard
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const SCOPES = ["user-read-recently-played"];
// ===== FACTS BANK =====
const facts = {
  Energetic: [
    "Hummingbirds can flap their wings up to 80 times per second!",
    "The fastest land animal, the cheetah, can accelerate faster than a sports car.",
  ],
  Reflective: [
    "Petrichor is the smell of rain, created by oils plants release during dry periods.",
    "Your brain uses more energy when daydreaming than during some tasks.",
  ],
  Calm: [
    "Sea otters hold hands when they sleep to avoid drifting apart.",
    "Listening to certain music can slow your heart rate and reduce stress.",
  ],
  Anxious: [
    "Deep breathing can activate the vagus nerve, calming your nervous system.",
    "Writing about your thoughts can reduce anxiety over time.",
  ],
  Curious: [
    "Octopuses have three hearts and blue blood.",
    "There are more stars in the universe than grains of sand on Earth.",
  ],
};

// ===== SELECTORS =====
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const contentDiv = document.getElementById("content");
const moodSpan = document.getElementById("mood");
const factP = document.getElementById("fact");
const errorDiv = document.getElementById("error");

// ===== UTILS =====
function getTokenFromUrl() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get("access_token");
}

function logout() {
  window.localStorage.removeItem("spotify_token");
  window.location.href = REDIRECT_URI; // reload to clear token from URL
}

function getMood(valence, energy) {
  if (valence > 0.6 && energy > 0.6) return "Energetic";
  if (valence < 0.4 && energy < 0.4) return "Reflective";
  if (valence < 0.5 && energy > 0.5) return "Anxious";
  if (valence > 0.7 && energy < 0.5) return "Calm";
  return "Curious";
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");
}

function pickFact(mood) {
  const moodFacts = facts[mood] || facts["Curious"];
  return moodFacts[Math.floor(Math.random() * moodFacts.length)];
}

// ===== FETCH FUNCTIONS =====
async function fetchRecentlyPlayed(token) {
  const res = await fetch(
    `https://api.spotify.com/v1/me/player/recently-played?limit=20`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error("Failed to fetch recently played tracks.");
  return await res.json();
}

async function fetchAudioFeatures(token, trackIds) {
  const idsParam = trackIds.join(",");
  const res = await fetch(
    `https://api.spotify.com/v1/audio-features?ids=${idsParam}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error("Failed to fetch audio features.");
  return await res.json();
}

function averageFeatures(features) {
  const valenceSum = features.reduce((acc, cur) => acc + cur.valence, 0);
  const energySum = features.reduce((acc, cur) => acc + cur.energy, 0);
  return {
    valence: valenceSum / features.length,
    energy: energySum / features.length,
  };
}

// ===== MAIN FLOW =====
async function main() {
  let token = window.localStorage.getItem("spotify_token");

  if (!token) {
    token = getTokenFromUrl();
    if (token) {
      window.localStorage.setItem("spotify_token", token);
      window.history.replaceState({}, document.title, REDIRECT_URI);
    }
  }

  if (!token) {
    loginBtn.classList.remove("hidden");
    contentDiv.classList.add("hidden");
    errorDiv.classList.add("hidden");
    return;
  }

  loginBtn.classList.add("hidden");
  errorDiv.classList.add("hidden");
  contentDiv.classList.remove("hidden");

  try {
    const recentData = await fetchRecentlyPlayed(token);
    const trackIds = recentData.items.map(item => item.track.id).filter(Boolean);

    if (trackIds.length === 0) {
      showError("No recent tracks found.");
      return;
    }

    const audioFeaturesData = await fetchAudioFeatures(token, trackIds);
    const features = audioFeaturesData.audio_features.filter(Boolean);

    if (features.length === 0) {
      showError("No audio features available.");
      return;
    }

    const avg = averageFeatures(features);
    const mood = getMood(avg.valence, avg.energy);
    const fact = pickFact(mood);

    moodSpan.textContent = mood;
    factP.textContent = fact;
  } catch (err) {
    showError(err.message);
  }
}

// ===== EVENT LISTENERS =====
loginBtn.addEventListener("click", () => {
  const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(SCOPES.join(" "))}&response_type=${RESPONSE_TYPE}`;

  console.log("AUTH URL:", authUrl); // 👈 Add this line
  window.location = authUrl;
});



logoutBtn.addEventListener("click", logout);

// ===== INIT =====
main();
