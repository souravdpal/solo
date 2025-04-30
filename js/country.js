document.addEventListener('DOMContentLoaded', async () => {
    
  
    const countrySelect = document.getElementById('country-select');
    const saveCountryBtn = document.getElementById('save-country');
    const countryDisplay = document.getElementById('country-display');
    const backToProfileBtn = document.getElementById('back-to-profile');
    if (!countrySelect || !saveCountryBtn || !countryDisplay || !backToProfileBtn) return;
  
    // Expanded country codes and flags
    const countries = {
      'in': '🇮🇳 India',
      'kr': '🇰🇷 Korea',
      'us': '🇺🇸 USA',
      'ca': '🇨🇦 Canada',
      'jp': '🇯🇵 Japan',
      'gb': '🇬🇧 United Kingdom',
      'fr': '🇫🇷 France',
      'de': '🇩🇪 Germany',
      'au': '🇦🇺 Australia',
      'br': '🇧🇷 Brazil',
    };
  
    // Populate country select
    Object.entries(countries).forEach(([code, name]) => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = name;
      countrySelect.appendChild(option);
    });
  
    // Set current country flag
    countryDisplay.innerHTML = user.country
      ? `<span class="flag">${countries[Object.keys(countries).find(c => countries[c].split(' ')[1].toLowerCase() === user.country.toLowerCase())]?.split(' ')[0] || '🌐'}</span> Current Country: ${user.country || 'Not set'}`
      : '<span class="flag">🌐</span> Current Country: Not set';
  
    saveCountryBtn.addEventListener('click', async () => {
      const countryCode = countrySelect.value;
      if (countryCode) {
        const countryName = countries[countryCode].split(' ')[1];
        user.country = countryName;
        localStorage.setItem('user', JSON.stringify(user));
        await fetch('/js/json/user.json', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });
        countryDisplay.innerHTML = `<span class="flag">${countries[countryCode].split(' ')[0]}</span> Current Country: ${countryName}`;
        alert('Country saved!');
      } else {
        alert('Please select a country!');
      }
    });
  
    backToProfileBtn.addEventListener('click', () => window.location.href = 'profile.html');
  });