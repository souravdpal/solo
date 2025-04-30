document.addEventListener('DOMContentLoaded', async () => {
  const backToQuestsBtn = document.getElementById('back-to-quests');
  const skillsList = document.getElementById('skills-list');

  async function fetchSkills() {
    const response = await fetch('/js/json/skills.json');
    return (await response.json()).skills || [];
  }

  async function fetchUserData() {
    const response = await fetch('/js/json/user.json');
    return await response.json();
  }

  async function renderSkills() {
    const skills = await fetchSkills();
    const userData = await fetchUserData();
    const username = sessionStorage.getItem('username');
    const user = userData[username];

    if (!user.skills) user.skills = {};

    skillsList.innerHTML = '';
    skills.forEach(skill => {
      const userSkill = user.skills[skill.name] || { level: 0 };
      const canUnlock = user.xp >= skill.unlockCriteria.xp && user.rank >= skill.unlockCriteria.rank;
      const isUnlocked = userSkill.level > 0;
      const canUpgrade = isUnlocked && userSkill.level < skill.maxLevel && user.xp >= skill.upgradeCost;

      const li = document.createElement('li');
      li.innerHTML = `
        <span class="username">${skill.name} - Level ${userSkill.level}</span>
        <span class="xp">${skill.description}</span>
        ${!isUnlocked ? `<button class="unlock-btn" ${!canUnlock ? 'disabled' : ''}>Unlock (${skill.unlockCriteria.xp} XP)</button>` : 
        `<button class="upgrade-btn" ${!canUpgrade ? 'disabled' : ''}>Upgrade (${skill.upgradeCost} XP)</button>`}
      `;
      skillsList.appendChild(li);
    });
  }

  backToQuestsBtn.addEventListener('click', () => {
    window.location.href = '/quests.html';
  });

  skillsList.addEventListener('click', async (e) => {
    const userData = await fetchUserData();
    const username = sessionStorage.getItem('username');
    const user = userData[username];

    if (e.target.classList.contains('unlock-btn')) {
      const skillName = e.target.parentElement.querySelector('.username').textContent.split(' - ')[0];
      const skills = await fetchSkills();
      const skill = skills.find(s => s.name === skillName);

      if (user.xp >= skill.unlockCriteria.xp && user.rank >= skill.unlockCriteria.rank) {
        if (!user.skills) user.skills = {};
        user.skills[skillName] = { level: 1 };
        userData[username] = user;
        await fetch('/js/json/user.json', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        renderSkills();
      }
    }

    if (e.target.classList.contains('upgrade-btn')) {
      const skillName = e.target.parentElement.querySelector('.username').textContent.split(' - ')[0];
      const skills = await fetchSkills();
      const skill = skills.find(s => s.name === skillName);

      if (user.skills[skillName].level < skill.maxLevel && user.xp >= skill.upgradeCost) {
        user.xp -= skill.upgradeCost;
        user.skills[skillName].level += 1;
        userData[username] = user;
        await fetch('/js/json/user.json', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        renderSkills();
      }
    }
  });

  renderSkills();
});