document.getElementById("sub").addEventListener('click', function(e) { 
  e.preventDefault();
  
  let name = document.getElementById("username").value;
  let key = document.getElementById("password").value;

  let work = async () => {
    try {
      let response = await fetch("/js/json/user.json");
      let extdata = await response.json();

      // Convert the object to an array of user objects
      let usersArray = Object.values(extdata);

      // Find the matching user
      let user = usersArray.find(user => user.username === name && user.password === key);

      if (user) {
        console.log("Login successful. Redirecting...");
        alert(`Welcome back, ${user.username}!`);
        window.location.href = "quests.html";
      } else {
        alert("Invalid username or password. Please try again.");
        console.warn("Login failed: No matching user.");
      }

    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  work(); // Call the async function
});
