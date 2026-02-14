const API_URL = "https://sea.navynui.cc/api/animating/api.php";

const ui = {
  codeContainer: document.getElementById("code-container"),
  code: document.getElementById("my-code"),
  timer: document.getElementById("expiration-timer"),
  newCodeBtn: document.getElementById("btn-new-code"),
  status: document.getElementById("status"),
  targetInput: document.getElementById("target-code"),
  sendBtn: document.getElementById("btn-send"),
  inboxList: document.getElementById("inbox-list"),
  refreshBtn: document.getElementById("btn-refresh"),
};

let expirationInterval;

function setStatus(msg, color = "#86efac") {
  ui.status.textContent = msg;
  ui.status.style.color = color;
  setTimeout(() => {
    ui.status.textContent = "";
  }, 3000);
}

// FORMAT TIME HELPER
function formatTime(seconds) {
  if (seconds <= 0) return "EXPIRED";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// START TIMER (using UNIX timestamp)
function startTimer(createdTs) {
  if (expirationInterval) clearInterval(expirationInterval);

  // createdTs is in seconds (UNIX timestamp from MySQL)
  // Expires 1 hour (3600 seconds) after creation
  const expiresAt = createdTs + 3600;

  function update() {
    const now = Math.floor(Date.now() / 1000); // Current Client Time (seconds)
    const diff = expiresAt - now;

    if (diff <= 0) {
      ui.timer.textContent = "EXPIRED";
      ui.timer.style.color = "#f87171"; // Red
      clearInterval(expirationInterval);
      // Optional: Auto-hide if desired
    } else {
      ui.timer.textContent = "Expires in: " + formatTime(diff);
      ui.timer.style.color = "#9ca3af"; // Gray
    }
  }

  update();
  expirationInterval = setInterval(update, 1000);
}

// REGISTER / GENERATE NEW CODE
async function generateNewCode() {
  ui.newCodeBtn.textContent = "Generating...";
  try {
    const res = await fetch(`${API_URL}?action=register`);
    const data = await res.json();
    if (data.code) {
      await chrome.storage.local.set({ my_code: data.code });
      ui.code.textContent = data.code;
      ui.codeContainer.classList.remove("hidden");
      ui.newCodeBtn.textContent = "GENERATE NEW CODE";
      setStatus("New Code Generated!", "#86efac");
      checkCodeStatus(data.code); // Start timer
      checkInbox(data.code);
    } else {
      setStatus("Error", "#f87171");
      ui.newCodeBtn.textContent = "TRY AGAIN";
    }
  } catch (e) {
    setStatus("Network Error", "#f87171");
    ui.newCodeBtn.textContent = "TRY AGAIN";
  }
}

// CHECK STATUS (VALIDITY & TIMER)
async function checkCodeStatus(code) {
  try {
    const res = await fetch(`${API_URL}?action=status&code=${code}`);
    const data = await res.json();

    if (data.valid) {
      ui.codeContainer.classList.remove("hidden");
      ui.code.textContent = code;
      // Use created_ts from new API
      startTimer(data.created_ts);
      checkInbox(code);
    } else {
      // Invalid or Expired on Server
      ui.codeContainer.classList.add("hidden");
      setStatus("Code Expired/Invalid", "#f87171");
    }
  } catch (e) {
    console.error(e);
  }
}

// INIT
async function init() {
  const res = await chrome.storage.local.get(["my_code"]);
  const code = res.my_code;

  if (code) {
    checkCodeStatus(code);
  }
}

// EVENT LISTENERS
ui.newCodeBtn.addEventListener("click", generateNewCode);

ui.code.addEventListener("click", () => {
  navigator.clipboard.writeText(ui.code.textContent);
  setStatus("Copied!");
});

// --- INBOX LOGIC (Existing) ---

async function checkInbox(code) {
  ui.inboxList.innerHTML = '<div style="text-align:center;">Loading...</div>';
  try {
    const res = await fetch(`${API_URL}?action=check&code=${code}`);
    const data = await res.json();

    ui.inboxList.innerHTML = "";
    if (data && data.shares && data.shares.length > 0) {
      data.shares.forEach((share) => {
        const el = document.createElement("div");
        el.className = "share-item";
        el.innerHTML = `
                    <div>From: <strong>${share.from}</strong></div>
                    <div style="font-size: 10px; color: #9ca3af;">${share.date}</div>
                    <div class="share-actions">
                        <button class="btn-sm btn-accept" data-id="${share.id}">ACCEPT</button>
                        <button class="btn-sm btn-decline" data-id="${share.id}">DECLINE</button>
                    </div>
                `;
        ui.inboxList.appendChild(el);
      });

      // Add listeners
      document
        .querySelectorAll(".btn-accept")
        .forEach((b) =>
          b.addEventListener("click", () => acceptShare(b.dataset.id, code)),
        );
      document
        .querySelectorAll(".btn-decline")
        .forEach((b) =>
          b.addEventListener("click", () =>
            resolveShare(b.dataset.id, code, "decline"),
          ),
        );
    } else {
      ui.inboxList.innerHTML =
        '<div style="font-size: 12px; color: #9ca3af; text-align: center; padding: 10px;">No new shares</div>';
    }
  } catch (e) {
    ui.inboxList.innerHTML =
      '<div style="color: #f87171; text-align:center;">Error checking inbox</div>';
  }
}

ui.refreshBtn.addEventListener("click", () => {
  chrome.storage.local.get(["my_code"], (res) => {
    if (res.my_code) checkInbox(res.my_code);
  });
});

// SEND LOGIC
ui.sendBtn.addEventListener("click", async () => {
  const target = ui.targetInput.value.trim().toUpperCase();
  if (target.length !== 6) {
    setStatus("Invalid Code", "#f87171");
    return;
  }

  chrome.storage.local.get(["my_code"], async (res) => {
    const myCode = res.my_code;
    if (!myCode) {
      setStatus("Generate Code First!", "#f87171");
      return;
    }

    setStatus("Getting data...");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "GET_ANIMATION_DATA" },
        async (response) => {
          if (chrome.runtime.lastError || !response || !response.data) {
            setStatus("Content error", "#f87171");
            return;
          }

          setStatus("Sending...");
          try {
            const res = await fetch(`${API_URL}?action=send`, {
              method: "POST",
              body: JSON.stringify({
                my_code: myCode,
                target_code: target,
                data: response.data,
              }),
            });
            const data = await res.json();
            if (data.success) {
              setStatus("Sent!", "#86efac");
              ui.targetInput.value = "";
            } else {
              setStatus(data.error || "Failed", "#f87171");
            }
          } catch (e) {
            setStatus("Net Error", "#f87171");
          }
        },
      );
    });
  });
});

// ACCEPT/RESOLVE LOGIC
async function acceptShare(id, myCode) {
  setStatus("Downloading...");
  try {
    const res = await fetch(`${API_URL}?action=get&id=${id}`);
    const data = await res.json();

    if (data.data) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) return;
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "LOAD_ANIMATION_DATA",
            data: data.data, // Pass the animation data object directly
          },
          (response) => {
            if (response && response.success) {
              setStatus("Loaded!", "#86efac");
              resolveShare(id, myCode);
            }
          },
        );
      });
    }
  } catch (e) {
    setStatus("Load Error", "#f87171");
  }
}

async function resolveShare(id, myCode) {
  try {
    await fetch(`${API_URL}?action=resolve`, {
      method: "POST",
      body: JSON.stringify({ id: id }),
    });
    checkInbox(myCode);
  } catch (e) {
    console.error(e);
  }
}

// Start
init();
