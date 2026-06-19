import './style.css';

const API_URL = 'http://localhost:5000/api/pokemon';
let allPokemon = [];

const grid = document.getElementById('pokemon-grid');
const searchInput = document.getElementById('searchInput');
const loading = document.getElementById('loading');

async function fetchPokemon() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Failed to fetch from backend');
        allPokemon = await res.json();
        loading.style.display = 'none';
        renderPokemon(allPokemon);
    } catch (err) {
        loading.textContent = 'Error connecting to backend database. Make sure Flask is running!';
        console.error(err);
    }
}

function renderPokemon(pokemonList) {
    grid.innerHTML = '';
    
    pokemonList.forEach((poke, index) => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        card.style.animationDelay = `${(index % 20) * 0.05}s`; // Stagger animation for max 20 items at a time

        // Format ID to 3 digits (e.g., #001)
        const displayId = '#' + poke.pokedex_number.toString().padStart(3, '0');

        let typesHTML = `<span class="type-badge type-${poke.type_1.toLowerCase()}">${poke.type_1}</span>`;
        if (poke.type_2) {
            typesHTML += `<span class="type-badge type-${poke.type_2.toLowerCase()}">${poke.type_2}</span>`;
        }

        let traitsHTML = '';
        if (poke.is_legendary) traitsHTML += '<span class="trait-badge trait-legendary">Legendary</span>';
        if (poke.is_mythical) traitsHTML += '<span class="trait-badge trait-mythical">Mythical</span>';
        if (poke.is_mega) traitsHTML += '<span class="trait-badge">Mega</span>';
        if (poke.is_regionalform) traitsHTML += '<span class="trait-badge">Regional Form</span>';

        card.innerHTML = `
            <div class="card-bg-shape"></div>
            <div class="poke-id">${displayId}</div>
            <div class="poke-img-container">
                <img class="poke-img" src="${poke.sprite_url || '/vite.svg'}" alt="${poke.name}" loading="lazy">
            </div>
            <h2 class="poke-name">${poke.name}</h2>
            <div class="poke-types">
                ${typesHTML}
            </div>
            <div class="poke-traits">
                ${traitsHTML}
            </div>
        `;
        
        grid.appendChild(card);
    });
}

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    const filtered = allPokemon.filter(poke => {
        const nameMatch = poke.name.toLowerCase().includes(searchTerm);
        const idMatch = poke.pokedex_number.toString().includes(searchTerm);
        const type1Match = poke.type_1.toLowerCase().includes(searchTerm);
        const type2Match = poke.type_2 ? poke.type_2.toLowerCase().includes(searchTerm) : false;
        
        return nameMatch || idMatch || type1Match || type2Match;
    });
    
    renderPokemon(filtered);
});

// Initialize
fetchPokemon();
