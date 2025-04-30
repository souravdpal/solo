document.addEventListener('DOMContentLoaded', async () => {
  const backToQuestsBtn = document.getElementById('back-to-quests');
  const clearAllBtn = document.getElementById('clear-all');
  const notificationsList = document.getElementById('notifications-list');

  async function fetchNotifications() {
    try {
      const response = await fetch('/js/json/notifications.json');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error.message);
      return {};
    }
  }

  async function renderNotifications() {
    const notificationsData = await fetchNotifications();
    const username = sessionStorage.getItem('username');
    const notifications = notificationsData[username] || [];

    if (notificationsList) {
      notificationsList.innerHTML = '';
      notifications.forEach(notification => {
        const li = document.createElement('li');
        li.className = notification.read ? '' : 'unread';
        li.innerHTML = `
          <span class="notification-message">${notification.message}</span>
          <span class="notification-timestamp">${new Date(notification.timestamp).toLocaleString()}</span>
          ${!notification.read ? `<button class="mark-read-btn" data-id="${notification.id}">Mark as Read</button>` : ''}
        `;
        notificationsList.appendChild(li);
      });
    }
  }

  if (backToQuestsBtn) {
    backToQuestsBtn.addEventListener('click', () => {
      window.location.href = '/quests.html';
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', async () => {
      const notificationsData = await fetchNotifications();
      const username = sessionStorage.getItem('username');
      notificationsData[username] = [];
      await fetch('/js/json/notifications.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationsData)
      });
      renderNotifications();
    });
  }

  if (notificationsList) {
    notificationsList.addEventListener('click', async (e) => {
      if (e.target.classList.contains('mark-read-btn')) {
        const notificationId = parseInt(e.target.dataset.id);
        const notificationsData = await fetchNotifications();
        const username = sessionStorage.getItem('username');
        const notification = notificationsData[username].find(n => n.id === notificationId);
        if (notification) {
          notification.read = true;
          await fetch('/js/json/notifications.json', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notificationsData)
          });
          renderNotifications();
        }
      }
    });

    renderNotifications();
  }
});
