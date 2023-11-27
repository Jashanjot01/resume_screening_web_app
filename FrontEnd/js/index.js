document.addEventListener("DOMContentLoaded", () => {
    // Fetch user information from the server
    fetch("http://localhost:3000/index", {
      method: "GET",
      headers: {
        "Content-Type": "text/html",
        "Authorization": "Bearer " + getCookie("jwt"),
      },
    })
    .then(response => response.json())
    .then(data => {
      // Populate the table with user information
      const userTableBody = document.getElementById("userTableBody");
      data.users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${user.id}</td>
          <td>${user.username}</td>
          <td>${user.email}</td>
        `;
        userTableBody.appendChild(row);
      });
    })
    .catch(error => console.error("Error fetching user information:", error));
  });
  
  // Function to get the value of a cookie by name
  function getCookie(name) {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.split("=");
      if (cookieName === name) {
        return cookieValue;
      }
    }
    return null;
  }
  