document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      const currentSelection = activitySelect.value;
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantItems = details.participants
          .map(
            (participant) => `
              <li class="activity-card__participant-item">
                <span>${participant}</span>
                <button
                  type="button"
                  class="participant-remove"
                  data-activity="${name}"
                  data-email="${participant}"
                  aria-label="Remove ${participant} from ${name}"
                  title="Remove participant"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M9 3.75h6l.75 1.5H21v1.5h-1.5l-.89 11.14A2.25 2.25 0 0 1 16.36 20H7.64a2.25 2.25 0 0 1-2.25-2.11L4.5 6.75H3V5.25h5.25L9 3.75Zm1.5 5.25v7.5H9V9h1.5Zm3 0v7.5H12V9h1.5Zm3.75-4.5h-9l.45.75h8.1l.45-.75Z"/>
                  </svg>
                </button>
              </li>
            `
          )
          .join("");

        activityCard.innerHTML = `
          <div class="activity-card__header">
            <h4>${name}</h4>
            <span class="activity-card__badge ${spotsLeft > 0 ? "is-open" : "is-full"}">${spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}</span>
          </div>
          <p class="activity-card__description">${details.description}</p>
          <dl class="activity-card__meta">
            <div>
              <dt>Schedule</dt>
              <dd>${details.schedule}</dd>
            </div>
            <div>
              <dt>Availability</dt>
              <dd>${spotsLeft} spots left</dd>
            </div>
          </dl>
          <div class="activity-card__participants">
            <h5>Participants</h5>
            <ul class="activity-card__participant-list">
              ${participantItems}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      if (currentSelection && activities[currentSelection]) {
        activitySelect.value = currentSelection;
      }
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove");

    if (!removeButton) {
      return;
    }

    const activity = removeButton.dataset.activity;
    const email = removeButton.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
