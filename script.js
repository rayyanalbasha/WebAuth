// DEFAULT ADMIN ACCOUNT SETUP
const DEFAULT_ADMIN = {
  username: "Admin",
  nickname: "System Admin",
  password: "spongebob"
};

// INITIALIZE USERS IN LOCALSTORAGE
function getUsers() {
  const users = JSON.parse(localStorage.getItem("users")) || [];
  if (!users.some(u => u.username === DEFAULT_ADMIN.username)) {
    users.push(DEFAULT_ADMIN);
    localStorage.setItem("users", JSON.stringify(users));
  }
  return users;
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

// DOM ELEMENTS
const authContainer = document.getElementById("authContainer");
const dashboardContainer = document.getElementById("dashboardContainer");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");
const usernameError = document.getElementById("usernameError");
const loginError = document.getElementById("loginError");

const displayUsername = document.getElementById("displayUsername");
const adminBadge = document.getElementById("adminBadge");
const adminPanel = document.getElementById("adminPanel");
const userTableBody = document.getElementById("userTableBody");

const editProfileForm = document.getElementById("editProfileForm");
const editUsername = document.getElementById("editUsername");
const editNickname = document.getElementById("editNickname");
const oldPassword = document.getElementById("oldPassword");
const newPassword = document.getElementById("newPassword");
const profileMsg = document.getElementById("profileMsg");
const editUsernameError = document.getElementById("editUsernameError");

const logoutBtn = document.getElementById("logoutBtn");
const switchAccountBtn = document.getElementById("switchAccountBtn");

// TOGGLE LOGIN / SIGNUP
showSignup.addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.classList.add("hidden");
  signupForm.classList.remove("hidden");
});

showLogin.addEventListener("click", (e) => {
  e.preventDefault();
  signupForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

// REAL-TIME USERNAME AVAILABILITY CHECK
document.getElementById("signupUsername").addEventListener("input", (e) => {
  const users = getUsers();
  const exists = users.some(u => u.username.toLowerCase() === e.target.value.trim().toLowerCase());
  if (exists && e.target.value.trim() !== "") {
    usernameError.textContent = "Username already taken";
  } else {
    usernameError.textContent = "";
  }
});

// SIGN UP LOGIC
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("signupUsername").value.trim();
  const nickname = document.getElementById("signupNickname").value.trim();
  const password = document.getElementById("signupPassword").value;

  const users = getUsers();
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    usernameError.textContent = "Username already taken";
    return;
  }

  const newUser = { username, nickname, password };
  users.push(newUser);
  saveUsers(users);

  // Auto-login after signup
  loginUser(newUser);
});

// LOGIN LOGIC
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

  if (user) {
    loginError.textContent = "";
    loginUser(user);
  } else {
    loginError.textContent = "Invalid username or password";
  }
});

function loginUser(user) {
  currentUser = user;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  renderDashboard();
}

// LOGOUT & SWITCH ACCOUNT
logoutBtn.addEventListener("click", logout);
switchAccountBtn.addEventListener("click", logout);

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  dashboardContainer.classList.add("hidden");
  authContainer.classList.remove("hidden");
  signupForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
}

// DASHBOARD RENDER LOGIC
function renderDashboard() {
  if (!currentUser) return;

  authContainer.classList.add("hidden");
  dashboardContainer.classList.remove("hidden");

  displayUsername.textContent = currentUser.nickname || currentUser.username;
  editUsername.value = currentUser.username;
  editNickname.value = currentUser.nickname || "";
  oldPassword.value = "";
  newPassword.value = "";
  profileMsg.textContent = "";

  const isAdmin = currentUser.username === DEFAULT_ADMIN.username;
  if (isAdmin) {
    adminBadge.classList.remove("hidden");
    adminPanel.classList.remove("hidden");
    renderAdminTable();
  } else {
    adminBadge.classList.add("hidden");
    adminPanel.classList.add("hidden");
  }
}

// EDIT PROFILE
editProfileForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newUn = editUsername.value.trim();
  const newNick = editNickname.value.trim();
  const oldPassVal = oldPassword.value;
  const newPassVal = newPassword.value;

  let users = getUsers();
  const userIdx = users.findIndex(u => u.username === currentUser.username);

  // Validate Username change
  if (newUn.toLowerCase() !== currentUser.username.toLowerCase()) {
    if (users.some(u => u.username.toLowerCase() === newUn.toLowerCase())) {
      editUsernameError.textContent = "Username already taken";
      return;
    }
  }
  editUsernameError.textContent = "";

  // Validate Password change if attempting to change
  if (newPassVal !== "") {
    if (oldPassVal !== currentUser.password) {
      profileMsg.style.color = "var(--danger)";
      profileMsg.textContent = "Old password is incorrect";
      return;
    }
    users[userIdx].password = newPassVal;
  }

  // Save edits
  users[userIdx].username = newUn;
  users[userIdx].nickname = newNick;
  currentUser = users[userIdx];

  saveUsers(users);
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  profileMsg.style.color = "var(--success)";
  profileMsg.textContent = "Profile updated successfully!";
  displayUsername.textContent = currentUser.nickname || currentUser.username;

  if (currentUser.username === DEFAULT_ADMIN.username) {
    renderAdminTable();
  }
});

// ADMIN PANEL: RENDER & MANAGE ALL ACCOUNTS
function renderAdminTable() {
  const users = getUsers();
  userTableBody.innerHTML = "";

  users.forEach((u) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.username}</td>
      <td>${u.nickname || '-'}</td>
      <td>${u.password}</td>
      <td>
        <div class="action-btns">
          <button class="btn-sm btn-action" onclick="impersonateUser('${u.username}')">Sign In</button>
          ${u.username !== DEFAULT_ADMIN.username ? `<button class="btn-sm btn-danger" onclick="deleteUser('${u.username}')">Delete</button>` : ''}
        </div>
      </td>
    `;

    userTableBody.appendChild(tr);
  });
}

// ADMIN ACTIONS
window.impersonateUser = function(username) {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    loginUser(user);
  }
};

window.deleteUser = function(username) {
  if (confirm(`Are you sure you want to delete user "${username}"?`)) {
    let users = getUsers();
    users = users.filter(u => u.username !== username);
    saveUsers(users);
    renderAdminTable();
  }
};

// CHECK LOGIN ON INITIAL LOAD
if (currentUser) {
  renderDashboard();
} else {
  getUsers(); // Initialize Admin account
}