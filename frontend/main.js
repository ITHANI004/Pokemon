import './style.css';

const API_URL = 'http://localhost:5000/api/pokemon';
let allPokemon = [];

// Advanced Filter State
let activeTypes = new Set();
let activeGens = new Set();
let showLegendaryOnly = false;
let showMythicalOnly = false;
let currentSearchTerm = '';

const grid = document.getElementById('pokemon-grid');
const searchInput = document.getElementById('searchInput');
const loading = document.getElementById('loading');

// Filter UI Elements
const toggleFiltersBtn = document.getElementById('toggleFiltersBtn');
const advancedFilters = document.getElementById('advancedFilters');
const typeFiltersContainer = document.getElementById('type-filters');
const genButtons = document.querySelectorAll('.gen-btn');
const legendaryToggle = document.getElementById('legendaryToggle');
const mythicalToggle = document.getElementById('mythicalToggle');

// Modal Elements
const modal = document.getElementById('pokeModal');
const closeBtn = document.querySelector('.close-btn');
const modalBody = document.getElementById('modal-body');

async function fetchPokemon() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Failed to fetch from backend');
        allPokemon = await res.json();
        loading.style.display = 'none';
        
        renderTypeFilters();
        setupFilterListeners();
        renderPokemon(allPokemon);
    } catch (err) {
        loading.textContent = 'Error connecting to backend database. Make sure Flask is running!';
        console.error(err);
    }
}

function setupFilterListeners() {
    toggleFiltersBtn.onclick = () => {
        advancedFilters.classList.toggle('collapsed');
        toggleFiltersBtn.classList.toggle('active');
    };

    genButtons.forEach(btn => {
        btn.onclick = () => {
            const gen = parseInt(btn.getAttribute('data-gen'));
            if (activeGens.has(gen)) {
                activeGens.delete(gen);
                btn.classList.remove('active');
            } else {
                activeGens.add(gen);
                btn.classList.add('active');
            }
            applyFilters();
        };
    });

    legendaryToggle.onchange = (e) => {
        showLegendaryOnly = e.target.checked;
        applyFilters();
    };

    mythicalToggle.onchange = (e) => {
        showMythicalOnly = e.target.checked;
        applyFilters();
    };
}

function renderTypeFilters() {
    const types = new Set();
    allPokemon.forEach(p => {
        if (p.type_1) types.add(p.type_1);
        if (p.type_2) types.add(p.type_2);
    });

    const sortedTypes = Array.from(types).sort();
    
    sortedTypes.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = type;
        btn.onclick = () => {
            if (activeTypes.has(type)) {
                activeTypes.delete(type);
                btn.classList.remove('active');
            } else {
                activeTypes.add(type);
                btn.classList.add('active');
            }
            applyFilters();
        };
        typeFiltersContainer.appendChild(btn);
    });
}

function applyFilters() {
    let filtered = allPokemon;

    // 1. Text Search
    if (currentSearchTerm) {
        filtered = filtered.filter(poke => {
            const nameMatch = poke.name.toLowerCase().includes(currentSearchTerm);
            const idMatch = poke.pokedex_number.toString().includes(currentSearchTerm);
            return nameMatch || idMatch;
        });
    }

    // 2. Multi-Type Filter (OR logic for types, i.e., "Fire OR Water")
    if (activeTypes.size > 0) {
        filtered = filtered.filter(poke => 
            activeTypes.has(poke.type_1) || activeTypes.has(poke.type_2)
        );
    }

    // 3. Multi-Generation Filter (OR logic for gens)
    if (activeGens.size > 0) {
        filtered = filtered.filter(poke => activeGens.has(poke.generation));
    }

    // 4. Legendary/Mythical Filter
    if (showLegendaryOnly) {
        filtered = filtered.filter(poke => poke.is_legendary);
    }
    if (showMythicalOnly) {
        filtered = filtered.filter(poke => poke.is_mythical);
    }

    renderPokemon(filtered);
}

function renderPokemon(pokemonList) {
    grid.innerHTML = '';
    
    pokemonList.forEach((poke, index) => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        card.style.animationDelay = `${(index % 20) * 0.05}s`;

        const displayId = '#' + poke.pokedex_number.toString().padStart(3, '0');

        let typesHTML = `<span class="type-badge type-${poke.type_1.toLowerCase()}">${poke.type_1}</span>`;
        if (poke.type_2) {
            typesHTML += `<span class="type-badge type-${poke.type_2.toLowerCase()}">${poke.type_2}</span>`;
        }

        let traitsHTML = '';
        if (poke.is_legendary) traitsHTML += '<span class="trait-badge trait-legendary">Legendary</span>';
        if (poke.is_mythical) traitsHTML += '<span class="trait-badge trait-mythical">Mythical</span>';

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
        
        card.onclick = () => openModal(poke);
        grid.appendChild(card);
    });
}

searchInput.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value.toLowerCase();
    applyFilters();
});

/* Modal Logic */
async function openModal(poke) {
    modal.classList.add('show');
    const displayId = '#' + poke.pokedex_number.toString().padStart(3, '0');
    
    modalBody.innerHTML = `
        <div class="modal-header">
            <div class="modal-img-container type-${poke.type_1.toLowerCase()}">
                <img class="modal-img" src="${poke.sprite_url || '/vite.svg'}" alt="${poke.name}">
            </div>
            <div class="modal-title">
                <h2>${poke.name}</h2>
                <div style="color: var(--text-secondary); font-size: 1.2rem;">${displayId} - Generation ${poke.generation}</div>
            </div>
        </div>
        <div style="text-align: center; color: var(--accent);">Fetching advanced stats...</div>
    `;

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${poke.pokedex_number}`);
        const data = await res.json();
        
        const maxStatValue = 255; // Blissey HP is 255
        
        let statsHTML = '<div class="stats-container">';
        data.stats.forEach(stat => {
            const statName = stat.stat.name.replace('-', ' ');
            const statVal = stat.base_stat;
            const percentage = (statVal / maxStatValue) * 100;
            
            // Color based on value
            let color = '#ff3333';
            if (statVal > 60) color = '#ff9d00';
            if (statVal > 90) color = '#7AC74C';
            if (statVal > 120) color = '#6390F0';
            
            statsHTML += `
                <div class="stat-row">
                    <div class="stat-label">${statName}</div>
                    <div class="stat-value">${statVal}</div>
                    <div class="stat-bar-bg">
                        <div class="stat-bar-fill" style="background: ${color}; width: 0%;" data-target="${percentage}%"></div>
                    </div>
                </div>
            `;
        });
        statsHTML += '</div>';

        // Additional physical traits
        const heightM = data.height / 10;
        const weightKg = data.weight / 10;
        
        const extraTraits = `
            <div style="display: flex; gap: 2rem; margin-top: 2rem; justify-content: center; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="text-align: center;">
                    <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Height</div>
                    <div style="font-size: 1.2rem; font-weight: bold;">${heightM} m</div>
                </div>
                <div style="text-align: center;">
                    <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Weight</div>
                    <div style="font-size: 1.2rem; font-weight: bold;">${weightKg} kg</div>
                </div>
            </div>
        `;

        // Fetch Evolution Line
        const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${poke.pokedex_number}`);
        const speciesData = await speciesRes.json();
        
        const evoRes = await fetch(speciesData.evolution_chain.url);
        const evoData = await evoRes.json();
        
        function getEvolutions(chain) {
            let evos = [chain.species.name];
            chain.evolves_to.forEach(child => {
                evos = evos.concat(getEvolutions(child));
            });
            return evos;
        }
        
        const evoNames = getEvolutions(evoData.chain);
        
        let evolutionsHTML = '<div class="evo-container">';
        
        evoNames.forEach(name => {
            const foundPoke = allPokemon.find(p => p.name.toLowerCase() === name.toLowerCase());
            if (foundPoke) {
                const isCurrent = foundPoke.pokedex_number === poke.pokedex_number;
                evolutionsHTML += `
                    <div class="evo-item ${isCurrent ? 'active' : ''}" data-id="${foundPoke.pokedex_number}">
                        <img src="${foundPoke.sprite_url || '/vite.svg'}" alt="${foundPoke.name}">
                        <span>${foundPoke.name}</span>
                    </div>
                `;
            }
        });
        evolutionsHTML += '</div>';

        modalBody.innerHTML = `
            <div class="modal-header">
                <div class="modal-img-container" style="background: radial-gradient(circle, var(--accent) 0%, transparent 70%);">
                    <img class="modal-img" src="${poke.sprite_url || '/vite.svg'}" alt="${poke.name}">
                </div>
                <div class="modal-title">
                    <h2>${poke.name}</h2>
                    <div style="color: var(--text-secondary); font-size: 1.2rem;">${displayId} - Generation ${poke.generation}</div>
                </div>
            </div>
            ${statsHTML}
            ${extraTraits}
            <div style="text-align: center; margin-top: 2.5rem; color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Evolutionary Line</div>
            ${evolutionsHTML}
        `;

        // Animate stat bars after render
        setTimeout(() => {
            const bars = document.querySelectorAll('.stat-bar-fill');
            bars.forEach(bar => {
                bar.style.width = bar.getAttribute('data-target');
            });
        }, 50);

        // Attach click events for evolutions
        document.querySelectorAll('.evo-item').forEach(el => {
            el.onclick = () => {
                const targetId = parseInt(el.getAttribute('data-id'));
                const targetPoke = allPokemon.find(p => p.pokedex_number === targetId);
                if (targetPoke) {
                    // Slight visual tweak: fade out current modal content slightly before opening next
                    modalBody.style.opacity = '0.5';
                    setTimeout(() => {
                        modalBody.style.opacity = '1';
                        openModal(targetPoke);
                    }, 150);
                }
            };
        });

    } catch (err) {
        modalBody.innerHTML += '<div style="color: red; text-align: center; margin-top: 1rem;">Failed to load stats.</div>';
    }
}

closeBtn.onclick = () => {
    modal.classList.remove('show');
};

window.onclick = (e) => {
    if (e.target == modal) {
        modal.classList.remove('show');
    }
};

// Initialize
fetchPokemon();
