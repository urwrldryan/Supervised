import { getUV } from "./prxy.mjs";

// Wait for UV to be ready
function waitForUV() {
  return new Promise((resolve, reject) => {
    if (window.__uv$config) {
      resolve();
      return;
    }
    
    let attempts = 0;
    const maxAttempts = 100; // 5 seconds max wait
    
    const checkInterval = setInterval(() => {
      attempts++;
      if (window.__uv$config) {
        clearInterval(checkInterval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error("UV config failed to load"));
      }
    }, 50);
  });
}

// Settings management
function loadSettings() {
  const defaultSettings = {
    searchEngine: "duckduckgo",
    wispUrl: "wss://wisp.rhw.one/"
  };
  
  const saved = localStorage.getItem("proxySettings");
  return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
}

function saveSettings(settings) {
  localStorage.setItem("proxySettings", JSON.stringify(settings));
}

// Get search engine URL
function getSearchEngineUrl(engine, query) {
  const engines = {
    duckduckgo: `https://html.duckduckgo.com/html?t=h_&q=${encodeURIComponent(query)}`,
    google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
    yahoo: `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`
  };
  return engines[engine] || engines.duckduckgo;
}

// Popular games list with icons
const popularGames = [
  { name: "Slope", url: "https://slope-game.online", icon: "https://slope-game.online/favicon.ico", fallback: "🎮" },
  { name: "1v1.LOL", url: "https://1v1.lol", icon: "https://1v1.lol/favicon.ico", fallback: "🔫" },
  { name: "Temple Run 2", url: "https://templerun2.com", icon: "https://templerun2.com/favicon.ico", fallback: "🏃" },
  { name: "Subway Surfers", url: "https://subwaysurfers.com", icon: "https://subwaysurfers.com/favicon.ico", fallback: "🚇" },
  { name: "Minecraft", url: "https://classic.minecraft.net", icon: "https://www.minecraft.net/favicon.ico", fallback: "⛏️" },
  { name: "Among Us", url: "https://www.roblox.com/games/2753915549/Among-Us", icon: "https://www.roblox.com/favicon.ico", fallback: "👾" },
  { name: "Roblox", url: "https://www.roblox.com", icon: "https://www.roblox.com/favicon.ico", fallback: "🎲" },
  { name: "Cool Math Games", url: "https://www.coolmathgames.com", icon: "https://www.coolmathgames.com/favicon.ico", fallback: "🧮" },
  { name: "Krunker", url: "https://krunker.io", icon: "https://krunker.io/favicon.ico", fallback: "🎯" },
  { name: "Shell Shockers", url: "https://shellshock.io", icon: "https://shellshock.io/favicon.ico", fallback: "🥚" },
  { name: "2048", url: "https://play2048.co", icon: "https://play2048.co/favicon.ico", fallback: "🔢" },
  { name: "Tetris", url: "https://tetris.com/play-tetris", icon: "https://tetris.com/favicon.ico", fallback: "🧩" },
  { name: "Lone Wolf", url: "/active/games/cllonewolf.html", icon: "🐺", fallback: "🐺", isLocal: true }
];

// Initialize when DOM and UV are ready
async function init() {
  try {
    await waitForUV();
  } catch (error) {
    console.error("Failed to load UV:", error);
    alert("Failed to initialize proxy. Please refresh the page.");
    return;
  }
  
  // Load settings
  const settings = loadSettings();
  
  // URL Bar
  const urlForm = document.getElementById("url-form");
  const urlInput = document.getElementById("url-input");
  const proxyFrame = document.getElementById("proxy-frame");
  const mainWrapper = document.querySelector(".main-wrapper");
  const loading = document.getElementById("loading");
  
  if (!urlForm || !urlInput || !proxyFrame || !mainWrapper) {
    console.error("Required DOM elements not found");
    return;
  }
  
  // Populate games
  const gamesGrid = document.getElementById("games-grid");
  if (gamesGrid) {
    popularGames.forEach(game => {
      const gameIcon = document.createElement("div");
      gameIcon.className = "app-icon";
      
      // Use image icon if available, otherwise use emoji fallback
      if (game.icon && game.icon.startsWith("http")) {
        const img = document.createElement("img");
        img.src = game.icon;
        img.alt = game.name;
        const fallback = document.createElement("span");
        fallback.className = "icon-text";
        fallback.textContent = game.fallback || "🎮";
        fallback.style.display = "none";
        img.onerror = () => {
          img.style.display = "none";
          fallback.style.display = "block";
        };
        gameIcon.appendChild(img);
        gameIcon.appendChild(fallback);
      } else {
        const iconSpan = document.createElement("span");
        iconSpan.className = "icon-text";
        iconSpan.textContent = game.icon || game.fallback || "🎮";
        gameIcon.appendChild(iconSpan);
      }
      
      const nameSpan = document.createElement("span");
      nameSpan.className = "app-name";
      nameSpan.textContent = game.name;
      gameIcon.appendChild(nameSpan);
      gameIcon.title = game.name;
      gameIcon.addEventListener("click", async () => {
        try {
          loading.classList.add("active");
          mainWrapper.style.opacity = "0.5";
          mainWrapper.style.pointerEvents = "none";
          
          let targetUrl;
          
          // Handle local HTML files differently
          if (game.isLocal) {
            targetUrl = game.url;
          } else {
            const currentSettings = loadSettings();
            targetUrl = await getUV(game.url, currentSettings.wispUrl);
          }
          
          mainWrapper.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out";
          mainWrapper.style.opacity = "0";
          mainWrapper.style.transform = "translateY(-20px) scale(0.95)";
          
          setTimeout(() => {
            proxyFrame.src = targetUrl;
            proxyFrame.classList.add("active");
            mainWrapper.style.display = "none";
            document.body.classList.add("iframe-active");
            
            // Update browser controls URL
            const browserUrlBar = document.getElementById("browser-url-bar");
            if (browserUrlBar) {
              browserUrlBar.value = game.url;
            }
            
            loading.classList.remove("active");
          }, 500);
        } catch (error) {
          console.error("Error loading game:", error);
          loading.classList.remove("active");
          mainWrapper.style.opacity = "1";
          mainWrapper.style.pointerEvents = "auto";
          alert("Failed to load game. Please try again.");
        }
      });
      gamesGrid.appendChild(gameIcon);
    });
  }
  
  // Settings Modal
  const settingsModal = document.getElementById("settings-modal");
  const closeSettings = document.getElementById("close-settings");
  const footerSettings = document.getElementById("footer-settings");
  const saveButton = document.getElementById("save-settings");
  const searchEngineSelect = document.getElementById("search-engine");
  const wispUrlInput = document.getElementById("wisp-url");
  
  if (searchEngineSelect) {
    searchEngineSelect.value = settings.searchEngine;
  }
  if (wispUrlInput) {
    wispUrlInput.value = settings.wispUrl;
  }
  
  if (footerSettings) {
    footerSettings.addEventListener("click", (e) => {
      e.preventDefault();
      settingsModal.classList.add("active");
    });
  }
  
  if (closeSettings) {
    closeSettings.addEventListener("click", () => {
      settingsModal.classList.remove("active");
    });
  }
  
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const newSettings = {
        searchEngine: searchEngineSelect.value,
        wispUrl: wispUrlInput.value
      };
      saveSettings(newSettings);
      settingsModal.classList.remove("active");
      alert("Settings saved successfully!");
    });
  }
  
  // Close modal on outside click
  if (settingsModal) {
    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove("active");
      }
    });
  }
  
  // Search form submission
  urlForm.onsubmit = async (e) => {
    e.preventDefault();
    const input = urlInput.value.trim();
    
    if (!input) return;
    
    // Show loading animation
    loading.classList.add("active");
    mainWrapper.style.opacity = "0.5";
    mainWrapper.style.pointerEvents = "none";
    
    try {
      // Use custom search engine if it's a search query
      const currentSettings = loadSettings();
      let urlToProxy = input;
      
      // Check if it's a URL or search query
      try {
        new URL(input);
      } catch {
        // Not a valid URL, treat as search query
        urlToProxy = getSearchEngineUrl(currentSettings.searchEngine, input);
      }
      
      const proxiedUrl = await getUV(urlToProxy, currentSettings.wispUrl);
      
      // Add fade out animation
      mainWrapper.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out";
      mainWrapper.style.opacity = "0";
      mainWrapper.style.transform = "translateY(-20px) scale(0.95)";
      
      setTimeout(() => {
        proxyFrame.src = proxiedUrl;
        proxyFrame.classList.add("active");
        mainWrapper.style.display = "none";
        document.body.classList.add("iframe-active");
        
        // Update browser controls URL
        const browserUrlBar = document.getElementById("browser-url-bar");
        if (browserUrlBar) {
          browserUrlBar.value = urlToProxy;
        }
        
        loading.classList.remove("active");
      }, 500);
    } catch (error) {
      console.error("Error loading proxy:", error);
      loading.classList.remove("active");
      mainWrapper.style.opacity = "1";
      mainWrapper.style.pointerEvents = "auto";
      alert("Failed to load proxy. Please try again.");
    }
  };

  // Check for URL parameter injection
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("inject")) {
    const injection = urlParams.get("inject");
    urlInput.value = injection;
    urlForm.dispatchEvent(new Event("submit"));
  }
}

// Start initialization
init();
