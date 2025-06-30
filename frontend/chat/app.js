import { openProfile } from "../profile.js";

// const buf = localStorage.getItem("userInfo");
// if (!buf) {
//   // keep any stray chat panel hidden
//   document.getElementById("chat-block")?.classList.add("hidden");
//   // the router will land on /login; nothing below should run
//   window.location.href = "/login";
// }
// const userInfoGlobal = JSON.parse(buf);      // parsed once, reused below

let ws;
let userInfoGlobal;

const buf = localStorage.getItem("userInfo");
if (!buf) {
  document.getElementById("chat-block")?.classList.add("hidden");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
} else {
  userInfoGlobal = JSON.parse(buf);

let __CURRENT_USER_ID = null;
window.__CURRENT_USER_ID = null;
(async () => {
   /* Pull token from the userInfo blob and expose it */
   const userInfo = userInfoGlobal;
   localStorage.setItem("token", userInfo.token);          // <-- make profile.js happy

   const me = await fetch("/currentuser", {
     headers: { Authorization:`Bearer ${userInfo.token}` } // use the fresh token
   }).then(r=>r.json()).catch(()=>null);
   if (!me) { window.location.href = "/login"; return; }
   __CURRENT_USER_ID = window.__CURRENT_USER_ID = me.id;
   document.getElementById('navAvatar').dataset.userid = me.id;   // NEW
   const nameEl = document.getElementById('navUsername');
	nameEl.dataset.userid = me.id;                // same id as avatar
	nameEl.classList.add('view-profile', 'cursor-pointer');
})();

document.body.addEventListener("click", e => {
	const t = e.target.closest(".view-profile");
	if (!t) return;

	// parse & validate
	const raw = t.dataset.userid;
	const userId = parseInt(raw, 10);
	if (Number.isNaN(userId)) {
	console.warn("view-profile clicked but data-userid is invalid:", raw);
		return;
	}
	
		openProfile(userId);
	});

document.getElementById("view-my-profile")?.addEventListener("click", () => {
	if (window.__CURRENT_USER_ID)
		openProfile(window.__CURRENT_USER_ID);
});

ws = new WebSocket(
	`ws://${window.location.host}/chat?token=${userInfoGlobal.token}`
);
const messages = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const userIdDestination = document.getElementById("userIdDestination");


//this and next new
// make the navbar username behave like the avatar
const nameEl = document.getElementById("navUsername");
if (nameEl) {
  nameEl.dataset.userid = userInfoGlobal.id;
  nameEl.classList.add("view-profile", "cursor-pointer");
}

// logout button
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  try { ws?.close(); } catch {}
  localStorage.removeItem("userInfo");
  localStorage.removeItem("token");
  window.location.href = "/login";
});

ws.onopen = () => {
	console.log("Connected to the server");
};

ws.onmessage = (event) => {
	const message = document.createElement("div");
	message.textContent = JSON.parse(event.data).message;
	messages.appendChild(message);
};

ws.onerror = (error) => {
	console.error("WebSocket error:", error);
};

ws.onclose = (e) => {
	if (e.code === 4000) {
		console.log("No token provided");
	} else if (e.code === 4001) {
		console.log("Invalid token");
	} else {
		console.log("Disconnected from the server");
	}
};

sendButton.onclick = () => {
	const message = messageInput.value;
	ws.send(
		JSON.stringify({ message: message, userId: userIdDestination.value })
	);
	messageInput.value = "";
};
messageInput.onkeydown = (event) => {
        if (event.key === "Enter") {
                const message = messageInput.value;
                ws.send(
                        JSON.stringify({ message: message, userId: userIdDestination.value })
                );
                messageInput.value = "";
        }
};
}
