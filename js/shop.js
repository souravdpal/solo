document.addEventListener('DOMContentLoaded', async () => {
  const backToQuestsBtn = document.getElementById('back-to-quests');
  const coinCount = document.getElementById('coin-count');
  const shopItems = document.getElementById('shop-items');

  // Fetch shop products
  async function fetchShopItems() {
    const response = await fetch('/js/json/shop.json');
    return (await response.json()).products || [];
  }

  // Fetch user data
  async function fetchUserData() {
    const response = await fetch('/js/json/user.json');
    return await response.json();
  }

  // Fetch buy history
  async function fetchBuyData() {
    const response = await fetch('/js/json/buy.json');
    return await response.json();
  }

  // Log the purchase in buy.json
  async function logPurchase(username, item, cost) {
    const buyData = await fetchBuyData();

    if (!buyData[username]) {
      buyData[username] = [];
    }

    buyData[username].push({
      item: item,
      cost: cost,
      time: new Date().toISOString()
    });

    await fetch('/js/json/buy.json', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buyData)
    });
  }

  // Render the shop items
  async function renderShop() {
    const products = await fetchShopItems();
    const userData = await fetchUserData();
    const username = sessionStorage.getItem('username');
    const user = userData[username];

    coinCount.textContent = user.coins || 0;
    shopItems.innerHTML = '';

    products.forEach(product => {
      const canAfford = user.coins >= product.cost;
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="username">${product.name}</span>
        <span class="xp">${product.description}</span>
        <button class="buy-btn" ${!canAfford ? 'disabled' : ''}>Buy (${product.cost} Coins)</button>
      `;
      shopItems.appendChild(li);
    });
  }

  // Handle shop purchase
  shopItems.addEventListener('click', async (e) => {
    if (e.target.classList.contains('buy-btn')) {
      const productName = e.target.parentElement.querySelector('.username').textContent;
      const products = await fetchShopItems();
      const userData = await fetchUserData();
      const username = sessionStorage.getItem('username');
      const user = userData[username];
      const product = products.find(p => p.name === productName);

      if (user.coins >= product.cost) {
        user.coins -= product.cost;
        if (!user.inventory.includes(product.name)) {
          user.inventory.push(product.name);
        }

        userData[username] = user;

        // Update user.json
        await fetch('/js/json/user.json', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });

        // Update buy.json
        await logPurchase(username, product.name, product.cost);

        // Refresh shop
        renderShop();
      }
    }
  });

  // Navigation
  backToQuestsBtn.addEventListener('click', () => {
    window.location.href = '/quests.html';
  });

  // Initial load
  renderShop();
});
