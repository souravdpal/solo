document.addEventListener('DOMContentLoaded', async () => {
  const backToQuestsBtn = document.getElementById('back-to-quests');
  const coinCount = document.getElementById('coin-count');
  const shopItems = document.getElementById('shop-items');

  async function fetchShopItems() {
    const response = await fetch('/js/json/shop.json');
    return (await response.json()).products || [];
  }

  async function fetchUserData() {
    const response = await fetch('/js/json/user.json');
    return await response.json();
  }

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

  backToQuestsBtn.addEventListener('click', () => {
    window.location.href = '/quests.html';
  });

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
        await fetch('/js/json/user.json', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        renderShop();
      }
    }
  });

  renderShop();
});