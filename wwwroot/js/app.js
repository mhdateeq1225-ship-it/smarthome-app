// App script placeholder
// This file simulates a web application entry script in wwwroot.

console.log('wwwroot app script loaded');

async function signupUser() {
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("http://localhost:3000/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();

  if (data.success) {
    alert("Signup successful!");
  } else {
    alert("Signup failed!");
  }
}