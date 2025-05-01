document.addEventListener('DOMContentLoaded', () => {
  const notificationsList = document.getElementById('notifications-list');
  const clearBtn = document.getElementById('clear-btn');

  // Load global notifications
  function loadNotifications() {
    // If user has cleared notifications this session, show nothing
    if (sessionStorage.getItem('notificationsCleared') === 'true') {
      notificationsList.innerHTML = '<p>No notifications available.</p>';
      return;
    }

    fetch('/js/json/notifications.json')
      .then(response => response.json())
      .then(data => {
        const notifications = data.notifications || [];
        if (notifications.length === 0) {
          notificationsList.innerHTML = '<p>No notifications available.</p>';
        } else {
          notificationsList.innerHTML = notifications
            .map(notification => `<div class="notification">${notification}</div>`)
            .join('');
        }
      })
      .catch(error => {
        console.error('Error loading notifications:', error);
        notificationsList.innerHTML = '<p>Error loading notifications.</p>';
      });
  }

  // Initial load
  loadNotifications();

  // Frontend-only: Clear notifications temporarily
  clearBtn.addEventListener('click', () => {
    sessionStorage.setItem('notificationsCleared', 'true');
    notificationsList.innerHTML = '<p>No notifications available.</p>';
  });

  // Auto-refresh every 30 seconds (only if not cleared)
  setInterval(() => {
    if (sessionStorage.getItem('notificationsCleared') !== 'true') {
      loadNotifications();
    }
  }, 30000);
});
