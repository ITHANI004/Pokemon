import './style.css';

const API_URL = '/pokemon.json';
let allPokemon = [];
const pokemonCardsMap = new Map();

// Advanced Filter State
let activeTypes = new Set();
let activeGens = new Set();
let showLegendaryOnly = false;
let showMythicalOnly = false;
let showMegaOnly = false;
let showRegionalOnly = false;
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
const megaToggle = document.getElementById('megaToggle');
const regionalToggle = document.getElementById('regionalToggle');

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
        buildAllPokemonCards(allPokemon);
        applyFilters();
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

    megaToggle.onchange = (e) => {
        showMegaOnly = e.target.checked;
        applyFilters();
    };

    regionalToggle.onchange = (e) => {
        showRegionalOnly = e.target.checked;
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
    allPokemon.forEach(poke => {
        let isVisible = true;

        // 1. Text Search
        if (currentSearchTerm) {
            const nameMatch = poke.name.toLowerCase().includes(currentSearchTerm);
            const idMatch = poke.pokedex_number.toString().includes(currentSearchTerm);
            if (!nameMatch && !idMatch) isVisible = false;
        }

        // 2. Multi-Type Filter (AND logic for types)
        if (isVisible && activeTypes.size > 0) {
            const pokeTypes = [poke.type_1, poke.type_2].filter(Boolean);
            if (!Array.from(activeTypes).every(t => pokeTypes.includes(t))) isVisible = false;
        }

        // 3. Multi-Generation Filter (OR logic for gens)
        if (isVisible && activeGens.size > 0) {
            if (!activeGens.has(poke.generation)) isVisible = false;
        }

        // 4. Legendary/Mythical Filter
        if (isVisible && showLegendaryOnly && !poke.is_legendary) isVisible = false;
        if (isVisible && showMythicalOnly && !poke.is_mythical) isVisible = false;
        if (isVisible && showMegaOnly && !poke.is_mega) isVisible = false;
        if (isVisible && showRegionalOnly && !poke.is_regionalform) isVisible = false;

        const card = pokemonCardsMap.get(poke.pokedex_number);
        if (card) {
            card.style.display = isVisible ? '' : 'none';
        }
    });
}

function buildAllPokemonCards(pokemonList) {
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
        if (poke.is_mega) traitsHTML += '<span class="trait-badge" style="background: rgba(183, 183, 206, 0.2); color: #B7B7CE;">Mega</span>';
        if (poke.is_regionalform) traitsHTML += '<span class="trait-badge" style="background: rgba(169, 143, 243, 0.2); color: #A98FF3;">Regional</span>';

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
        pokemonCardsMap.set(poke.pokedex_number, card);
    });
}

let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearchTerm = e.target.value.toLowerCase();
        applyFilters();
    }, 250);
});

// Mobile Keyboard Fix: Prevent page reload on Enter and dismiss keyboard
const searchForm = document.getElementById('searchForm');
if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        searchInput.blur(); // Drops the mobile keyboard
    });
}

/* Modal Logic */
import Chart from 'chart.js/auto';

const pokeApiCache = new Map();
let currentChart = null;

const typeChart = {
    normal: { weak: ['fighting'], resist: [], immune: ['ghost'] },
    fire: { weak: ['water', 'ground', 'rock'], resist: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'], immune: [] },
    water: { weak: ['electric', 'grass'], resist: ['fire', 'water', 'ice', 'steel'], immune: [] },
    electric: { weak: ['ground'], resist: ['electric', 'flying', 'steel'], immune: [] },
    grass: { weak: ['fire', 'ice', 'poison', 'flying', 'bug'], resist: ['water', 'electric', 'grass', 'ground'], immune: [] },
    ice: { weak: ['fire', 'fighting', 'rock', 'steel'], resist: ['ice'], immune: [] },
    fighting: { weak: ['flying', 'psychic', 'fairy'], resist: ['bug', 'rock', 'dark'], immune: [] },
    poison: { weak: ['ground', 'psychic'], resist: ['grass', 'fighting', 'poison', 'bug', 'fairy'], immune: [] },
    ground: { weak: ['water', 'grass', 'ice'], resist: ['poison', 'rock'], immune: ['electric'] },
    flying: { weak: ['electric', 'ice', 'rock'], resist: ['grass', 'fighting', 'bug'], immune: ['ground'] },
    psychic: { weak: ['bug', 'ghost', 'dark'], resist: ['fighting', 'psychic'], immune: [] },
    bug: { weak: ['fire', 'flying', 'rock'], resist: ['grass', 'fighting', 'ground'], immune: [] },
    rock: { weak: ['water', 'grass', 'fighting', 'ground', 'steel'], resist: ['normal', 'fire', 'poison', 'flying'], immune: [] },
    ghost: { weak: ['ghost', 'dark'], resist: ['poison', 'bug'], immune: ['normal', 'fighting'] },
    dragon: { weak: ['ice', 'dragon', 'fairy'], resist: ['fire', 'water', 'electric', 'grass'], immune: [] },
    dark: { weak: ['fighting', 'bug', 'fairy'], resist: ['ghost', 'dark'], immune: ['psychic'] },
    steel: { weak: ['fire', 'fighting', 'ground'], resist: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'], immune: ['poison'] },
    fairy: { weak: ['poison', 'steel'], resist: ['fighting', 'bug', 'dark'], immune: ['dragon'] }
};

function getTypeEffectiveness(type1, type2) {
    const multipliers = {};
    Object.keys(typeChart).forEach(t => multipliers[t] = 1);

    const applyType = (type) => {
        if (!type) return;
        const t = type.toLowerCase();
        if(!typeChart[t]) return;
        typeChart[t].weak.forEach(w => multipliers[w] *= 2);
        typeChart[t].resist.forEach(r => multipliers[r] *= 0.5);
        typeChart[t].immune.forEach(i => multipliers[i] *= 0);
    };

    applyType(type1);
    applyType(type2);

    const weak = [];
    const resist = [];
    const immune = [];

    Object.keys(multipliers).forEach(t => {
        if (multipliers[t] >= 2) weak.push({type: t, mult: multipliers[t]});
        else if (multipliers[t] === 0.5 || multipliers[t] === 0.25) resist.push({type: t, mult: multipliers[t]});
        else if (multipliers[t] === 0) immune.push(t);
    });

    return { weak, resist, immune };
}

/* Modal Logic */
async function openModal(poke) {
    modal.classList.add('show');
    const displayId = '#' + poke.pokedex_number.toString().padStart(3, '0');
    
    const typeColorMap = {
        'normal': '#A8A77A', 'fire': '#EE8130', 'water': '#6390F0', 'electric': '#F7D02C',
        'grass': '#7AC74C', 'ice': '#96D9D6', 'fighting': '#C22E28', 'poison': '#A33EA1',
        'ground': '#E2BF65', 'flying': '#A98FF3', 'psychic': '#F95587', 'bug': '#A6B91A',
        'rock': '#B6A136', 'ghost': '#735797', 'dragon': '#6F35FC', 'dark': '#705746',
        'steel': '#B7B7CE', 'fairy': '#D685AD'
    };
    const mainColor = typeColorMap[poke.type_1.toLowerCase()] || '#ffffff';

    modalBody.innerHTML = `
        <div class="modal-body-grid">
            <div class="modal-left">
                <div class="modal-header" style="flex-direction: column; text-align: center; margin-bottom: 1rem;">
                    <div class="modal-img-container" style="background: radial-gradient(circle, ${mainColor}88 0%, transparent 70%); margin: 0 auto 1rem auto; width: 180px; height: 180px;">
                        <img class="modal-img" src="${poke.sprite_url || '/vite.svg'}" alt="${poke.name}">
                    </div>
                    <div class="modal-title">
                        <h2>${poke.name}</h2>
                        <div style="color: var(--text-secondary); font-size: 1.2rem;">${displayId} - Generation ${poke.generation}</div>
                    </div>
                </div>
                <div id="modal-lore-area" style="margin-top: 1.5rem; margin-bottom: 1.5rem; text-align: center; font-style: italic; color: var(--text-secondary); min-height: 40px; font-size: 0.9rem; line-height: 1.4;">
                    Loading Pokédex entry...
                </div>
                <div id="modal-details-area">
                    <div style="text-align: center; color: ${mainColor}; margin: 2rem; font-weight: bold;">Loading details...</div>
                </div>
            </div>
            <div class="modal-right">
                <div id="modal-chart-area">
                    <div style="text-align: center; color: ${mainColor}; margin: 2rem; font-weight: bold;">Fetching advanced stats...</div>
                </div>
                <div id="evo-section" style="margin-top: 2rem; min-height: 100px;">
                    <div style="text-align: center; color: var(--text-secondary); font-size: 0.9rem;">Loading evolutionary line...</div>
                </div>
            </div>
        </div>
    `;

    try {
        let data;
        const cacheKey = `poke_${poke.pokedex_number}`;
        if (pokeApiCache.has(cacheKey)) {
            data = pokeApiCache.get(cacheKey);
        } else {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${poke.pokedex_number}`);
            data = await res.json();
            pokeApiCache.set(cacheKey, data);
        }

        const heightM = data.height / 10;
        const weightKg = data.weight / 10;
        
        const abilityName = data.abilities.length > 0 ? data.abilities[0].ability.name.replace('-', ' ') : 'Unknown';
        
        let moveName = 'None';
        if (data.moves && data.moves.length > 0) {
            moveName = data.moves[data.moves.length - 1].move.name.replace('-', ' ');
        }
        
        const detailsArea = document.getElementById('modal-details-area');
        detailsArea.innerHTML = `
            <div style="display: flex; gap: 3rem; justify-content: center; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); width: 100%;">
                <div style="text-align: center;">
                    <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Height</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: ${mainColor}">${heightM} m</div>
                </div>
                <div style="text-align: center;">
                    <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Weight</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: ${mainColor}">${weightKg} kg</div>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 2rem; align-items: center;">
                <div style="text-align: center; background: rgba(255,255,255,0.05); padding: 1rem 2rem; border-radius: 12px; width: 100%; max-width: 250px;">
                    <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Ability</div>
                    <div style="font-size: 1.2rem; font-weight: bold; text-transform: capitalize;">${abilityName}</div>
                </div>
                <div style="text-align: center; background: rgba(255,255,255,0.05); padding: 1rem 2rem; border-radius: 12px; width: 100%; max-width: 250px;">
                    <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Special Attack</div>
                    <div style="font-size: 1.2rem; font-weight: bold; text-transform: capitalize;">${moveName}</div>
                </div>
            </div>
        `;

        // Calculate Weaknesses
        const effectiveness = getTypeEffectiveness(poke.type_1, poke.type_2);
        let weaknessHTML = '';
        effectiveness.weak.forEach(w => {
            weaknessHTML += `<span class="type-badge type-${w.type}" style="font-size: 0.7rem; margin: 0.2rem; padding: 0.2rem 0.5rem;">${w.type} ${w.mult}x</span>`;
        });
        let resistHTML = '';
        effectiveness.resist.forEach(r => {
            resistHTML += `<span class="type-badge type-${r.type}" style="font-size: 0.7rem; margin: 0.2rem; opacity: 0.8; padding: 0.2rem 0.5rem;">${r.type} ${r.mult}x</span>`;
        });
        effectiveness.immune.forEach(i => {
            resistHTML += `<span class="type-badge type-${i}" style="font-size: 0.7rem; margin: 0.2rem; opacity: 0.5; padding: 0.2rem 0.5rem;">${i} 0x</span>`;
        });
        if(!resistHTML) resistHTML = '<span style="color:var(--text-secondary); font-size: 0.8rem;">None</span>';
        
        const chartArea = document.getElementById('modal-chart-area');
        chartArea.innerHTML = `
            <div style="width: 100%; max-width: 350px; position: relative; margin: 0 auto;">
                <canvas id="statChart"></canvas>
            </div>
            <div style="margin-top: 1.5rem; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 1.2rem;">
                <div style="margin-bottom: 1rem;">
                    <div style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 0.5rem; font-weight: bold; letter-spacing: 1px;">Weaknesses</div>
                    <div style="display: flex; flex-wrap: wrap;">${weaknessHTML}</div>
                </div>
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 0.5rem; font-weight: bold; letter-spacing: 1px;">Resistances & Immunities</div>
                    <div style="display: flex; flex-wrap: wrap;">${resistHTML}</div>
                </div>
            </div>
        `;

        if (currentChart) currentChart.destroy();
        const ctx = document.getElementById('statChart').getContext('2d');
        
        const statNames = data.stats.map(s => s.stat.name.toUpperCase().replace('-', ' '));
        const statValues = data.stats.map(s => s.base_stat);

        currentChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: statNames,
                datasets: [{
                    label: 'Base Stats',
                    data: statValues,
                    backgroundColor: `${mainColor}44`,
                    borderColor: mainColor,
                    pointBackgroundColor: mainColor,
                    pointBorderColor: '#121212',
                    pointHoverBackgroundColor: '#121212',
                    pointHoverBorderColor: mainColor,
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255,255,255,0.1)' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: 'rgba(255,255,255,0.9)', font: { size: 10, family: 'Inter' } },
                        ticks: { display: false, max: 255, min: 0 }
                    }
                },
                plugins: { legend: { display: false } },
                maintainAspectRatio: true
            }
        });

        // Load evolution & lore asynchronously!
        loadEvolutionTree(poke, data, mainColor);

    } catch (err) {
        document.getElementById('modal-content-area').innerHTML = '<div style="color: red; text-align: center; margin-top: 1rem;">Failed to load stats.</div>';
    }
}

async function loadEvolutionTree(poke, data, mainColor) {
    const evoSection = document.getElementById('evo-section');
    try {
        let chain = null;
        let flavorText = "No Pokédex data available.";
        const cacheKey = `evo_tree_${poke.pokedex_number}`;
        
        if (pokeApiCache.has(cacheKey)) {
            const cachedData = pokeApiCache.get(cacheKey);
            chain = cachedData.chain;
            flavorText = cachedData.flavorText;
        } else {
            let speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${poke.pokedex_number}`;
            if (data.species && data.species.url) {
                speciesUrl = data.species.url;
            }
            const speciesRes = await fetch(speciesUrl);
            const speciesData = await speciesRes.json();
            
            const flavorTextEntry = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en');
            if (flavorTextEntry) {
                flavorText = flavorTextEntry.flavor_text.replace(/[\n\f]/g, ' ');
            }
            
            const evoRes = await fetch(speciesData.evolution_chain.url);
            const evoData = await evoRes.json();
            
            chain = evoData.chain;
            pokeApiCache.set(cacheKey, { chain, flavorText });
        }

        const loreSection = document.getElementById('modal-lore-area');
        if (loreSection) {
            loreSection.innerHTML = `"${flavorText}"`;
        }

        function getEvolutionMethod(details) {
            if (!details || details.length === 0) return '';
            const d = details[0];
            let method = '';
            
            if (d.trigger.name === 'level-up') {
                if (d.min_level) method = `Lvl ${d.min_level}`;
                else if (d.min_happiness) method = `High Friendship`;
                else method = `Level Up`;
                if (d.time_of_day) method += ` (${d.time_of_day})`;
            } else if (d.trigger.name === 'use-item') {
                method = d.item ? d.item.name.replace(/-/g, ' ') : 'Stone';
            } else if (d.trigger.name === 'trade') {
                method = 'Trade';
                if (d.held_item) method += ` w/ ${d.held_item.name.replace(/-/g, ' ')}`;
            } else {
                method = d.trigger.name.replace(/-/g, ' ');
            }
            return method;
        }

        function buildEvoTree(node, mainColor, currentId) {
            const speciesName = node.species.name;
            const foundPoke = allPokemon.find(p => p.name.toLowerCase() === speciesName.toLowerCase() || p.name.toLowerCase() === speciesName.toLowerCase().replace('-', ' '));
            if (!foundPoke) return '';

            const isCurrent = foundPoke.pokedex_number === currentId;
            let html = `
                <div style="display: flex; align-items: center; justify-content: center;">
                    <div class="evo-item ${isCurrent ? 'active' : ''}" data-id="${foundPoke.pokedex_number}" style="${isCurrent ? `border-color: ${mainColor}; box-shadow: 0 0 15px ${mainColor}66;` : ''}">
                        <img src="${foundPoke.sprite_url || '/vite.svg'}" alt="${foundPoke.name}">
                        <span>${foundPoke.name}</span>
                    </div>
            `;

            if (node.evolves_to.length > 0) {
                if (node.evolves_to.length === 1) {
                    const child = node.evolves_to[0];
                    const methodStr = getEvolutionMethod(child.evolution_details);
                    html += `
                        <div class="evo-arrow-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 1rem;">
                            <div class="evo-method" style="font-size: 0.65rem; color: var(--text-secondary); text-transform: capitalize; margin-bottom: -0.2rem; text-align: center; max-width: 80px; line-height: 1.2;">${methodStr}</div>
                            <div class="evo-arrow" style="color: ${mainColor}; font-size: 1.5rem; margin: 0;">➔</div>
                        </div>
                    `;
                    html += buildEvoTree(child, mainColor, currentId);
                } else {
                    html += `
                        <div class="evo-arrow-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 1.5rem;">
                            <div class="evo-arrow" style="color: ${mainColor}; font-size: 2rem; margin: 0;">➔</div>
                        </div>
                        <div class="evo-branches" style="display: flex; flex-wrap: wrap; gap: 1.5rem; max-width: 500px; justify-content: flex-start; border-left: 2px solid rgba(255,255,255,0.05); padding-left: 1.5rem;">
                    `;
                    node.evolves_to.forEach(child => {
                        const methodStr = getEvolutionMethod(child.evolution_details);
                        html += `
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <div class="evo-method" style="font-size: 0.65rem; color: var(--text-secondary); text-transform: capitalize; margin-bottom: 0.5rem; text-align: center; max-width: 80px; line-height: 1.1; background: rgba(0,0,0,0.3); padding: 0.3rem 0.5rem; border-radius: 6px;">${methodStr}</div>
                                ${buildEvoTree(child, mainColor, currentId)}
                            </div>
                        `;
                    });
                    html += `</div>`;
                }
            }

            html += `</div>`;
            return html;
        }

        const evolutionsHTML = buildEvoTree(chain, mainColor, poke.pokedex_number);

        evoSection.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-bottom: 1rem;">Evolutionary Line</div>
            <div class="evo-container" style="justify-content: center; overflow-x: auto; padding-bottom: 1rem; margin-top: 1.5rem;">
                ${evolutionsHTML}
            </div>
        `;

        document.querySelectorAll('.evo-item').forEach(el => {
            el.onclick = () => {
                const targetId = parseInt(el.getAttribute('data-id'));
                const targetPoke = allPokemon.find(p => p.pokedex_number === targetId);
                if (targetPoke) {
                    modalBody.style.opacity = '0.5';
                    setTimeout(() => {
                        modalBody.style.opacity = '1';
                        openModal(targetPoke);
                    }, 150);
                }
            };
        });

    } catch (err) {
        evoSection.innerHTML = '<div style="color: var(--text-secondary); text-align: center;">Could not load evolutionary line.</div>';
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

