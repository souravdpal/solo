document.addEventListener('DOMContentLoaded', async () => {
 

  const battleDisplay = document.getElementById('battle-display');
  const monsterOptions = document.getElementById('monster-options');
  const fightBtn = document.getElementById('fight-btn');
  const defeatedMonsters = document.getElementById('defeated-monsters');
  let notifications = await getNotifications() || [];
  let battles = await getBattles();

  const monsters = [
    { id: 1, name: 'Goblin', hp: 50, xp: 50 },
    { id: 2, name: 'Orc', hp: 100, xp: 100 },
    { id: 3, name: 'Troll', hp: 200, xp: 200 },
    { id: 4, name: 'Dragon', hp: 500, xp: 500 }
  ];

  function renderBattle() {
    battleDisplay.innerHTML = `<p>HP: ${user.hp || 100}</p><p>XP: ${user.xp}</p>`;
    monsterOptions.innerHTML = monsters.map(monster => `
      <div class="battle-option" data-id="${monster.id}">
        <p>${monster.name} (HP: ${monster.hp})</p>
        <input type="radio" name="monster" value="${monster.id}">
      </div>
    `).join('');
    defeatedMonsters.innerHTML = battles.defeated.length ? `
      <p>Defeated: ${battles.defeated.map(m => m.name).join(', ')}</p>
    ` : '<p>No monsters defeated yet!</p>';
  }

  monsterOptions.addEventListener('change', () => {
    fightBtn.disabled = !monsterOptions.querySelector('input:checked');
  });

  fightBtn.addEventListener('click', async () => {
    const selectedMonsterId = parseInt(monsterOptions.querySelector('input:checked').value);
    const monster = monsters.find(m => m.id === selectedMonsterId);
    if (user.hp > 0 && monster) {
      const damage = Math.floor(Math.random() * 20) + 10;
      let userDamage = Math.floor(Math.random() * 15);
      if ((await getInventory())[user.username]?.includes('Shadow Strike')) {
        userDamage *= 1.2; // 20% boost from Shadow Strike skill
      }
      monster.hp -= damage;
      user.hp -= userDamage;
      if (monster.hp <= 0) {
        user.xp += monster.xp;
        battles.defeated.push({ name: monster.name, xp: monster.xp, time: new Date().toISOString() });
        notifications.push({ message: `Defeated ${monster.name}! +${monster.xp} XP`, timestamp: new Date().toISOString() });
        showToast(`Victory! +${monster.xp} XP`);
      } else if (user.hp <= 0) {
        notifications.push({ message: 'You were defeated!', timestamp: new Date().toISOString() });
        showToast('Game Over! Respawn in progress...');
        user.hp = 100; // Respawn
      }
      await saveUserData(user);
      await saveBattles(battles);
      await saveNotifications(notifications);
      renderBattle();
    }
  });

  renderBattle();
});

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}