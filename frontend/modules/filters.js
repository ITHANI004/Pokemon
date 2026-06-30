import { state } from './state.js';
import { isAlternateForm } from './utils.js';
import { updateGridDisplay } from './cards.js';
import { openModal } from './modal.js';

export function applyFilters(resetPage = true) {
    if (resetPage) state.currentPage = 1;
    const sortSelect = document.getElementById('sortSelect');
    const sortValue = sortSelect ? sortSelect.value : 'id-asc';

    const filteredPokemon = state.allPokemon.filter(poke => {
        if (!state.showAllForms && !state.showMegaOnly && !state.showRegionalOnly) {
            if (isAlternateForm(poke)) return false;
        }

        // 1. Text Search
        if (state.currentSearchTerm) {
            const nameMatch = poke.name.toLowerCase().includes(state.currentSearchTerm);
            const idMatch = poke.pokedex_number.toString().includes(state.currentSearchTerm);
            if (!nameMatch && !idMatch) return false;
        }

        // 2. Multi-Type Filter (AND logic for types)
        if (state.activeTypes.size > 0) {
            const pokeTypes = [poke.type_1, poke.type_2].filter(Boolean);
            if (!Array.from(state.activeTypes).every(t => pokeTypes.includes(t))) return false;
        }

        // 3. Multi-Generation Filter (OR logic for gens)
        if (state.activeGens.size > 0) {
            if (!state.activeGens.has(poke.generation)) return false;
        }

        // 4. Legendary/Mythical Filter
        if (state.showLegendaryOnly && !poke.is_legendary) return false;
        if (state.showMythicalOnly && !poke.is_mythical) return false;
        if (state.showMegaOnly && !poke.is_mega) return false;
        if (state.showRegionalOnly && !poke.is_regionalform) return false;

        return true;
    });

    filteredPokemon.sort((a, b) => {
        if (sortValue === 'name-asc') return a.name.localeCompare(b.name);
        if (sortValue === 'weight-desc') return (b.weight || 0) - (a.weight || 0);
        if (sortValue === 'height-desc') return (b.height || 0) - (a.height || 0);
        if (sortValue === 'speed-desc') return (b.speed || 0) - (a.speed || 0);
        if (sortValue === 'attack-desc') return (b.attack || 0) - (a.attack || 0);
        return a.pokedex_number - b.pokedex_number;
    });

    updateGridDisplay(filteredPokemon, sortValue);
}

export function renderTypeFilters() {
    const typeFiltersContainer = document.getElementById('type-filters');
    if (!typeFiltersContainer) return;
    typeFiltersContainer.innerHTML = '';

    const types = new Set();
    state.allPokemon.forEach(p => {
        if (p.type_1) types.add(p.type_1);
        if (p.type_2) types.add(p.type_2);
    });

    const sortedTypes = Array.from(types).sort();

    sortedTypes.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = type;
        btn.onclick = () => {
            if (state.activeTypes.has(type)) {
                state.activeTypes.delete(type);
                btn.classList.remove('active');
            } else {
                state.activeTypes.add(type);
                btn.classList.add('active');
            }
            applyFilters();
        };
        typeFiltersContainer.appendChild(btn);
    });
}

export function setupFilterListeners() {
    const toggleFiltersBtn = document.getElementById('toggleFiltersBtn');
    const advancedFilters = document.getElementById('advancedFilters');
    const genButtons = document.querySelectorAll('.gen-btn');
    const legendaryToggle = document.getElementById('legendaryToggle');
    const mythicalToggle = document.getElementById('mythicalToggle');
    const megaToggle = document.getElementById('megaToggle');
    const regionalToggle = document.getElementById('regionalToggle');

    if (toggleFiltersBtn && advancedFilters) {
        toggleFiltersBtn.onclick = () => {
            advancedFilters.classList.toggle('collapsed');
            toggleFiltersBtn.classList.toggle('active');
        };
    }

    genButtons.forEach(btn => {
        btn.onclick = () => {
            const gen = parseInt(btn.getAttribute('data-gen'));
            if (state.activeGens.has(gen)) {
                state.activeGens.delete(gen);
                btn.classList.remove('active');
            } else {
                state.activeGens.add(gen);
                btn.classList.add('active');
            }
            applyFilters();
        };
    });

    if (legendaryToggle) {
        legendaryToggle.onchange = (e) => {
            state.showLegendaryOnly = e.target.checked;
            applyFilters();
        };
    }

    if (mythicalToggle) {
        mythicalToggle.onchange = (e) => {
            state.showMythicalOnly = e.target.checked;
            applyFilters();
        };
    }

    if (megaToggle) {
        megaToggle.onchange = (e) => {
            state.showMegaOnly = e.target.checked;
            applyFilters();
        };
    }

    if (regionalToggle) {
        regionalToggle.onchange = (e) => {
            state.showRegionalOnly = e.target.checked;
            applyFilters();
        };
    }
}

export function setupSearchAndSort() {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const toggleFormsBtn = document.getElementById('toggleFormsBtn');
    const formsToggleText = document.getElementById('formsToggleText');
    const searchForm = document.getElementById('searchForm');
    const randomPokeBtn = document.getElementById('randomPokeBtn');

    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                state.currentSearchTerm = e.target.value.toLowerCase();
                applyFilters();
            }, 250);
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            applyFilters();
        });
    }

    if (toggleFormsBtn) {
        toggleFormsBtn.onclick = () => {
            state.showAllForms = !state.showAllForms;
            toggleFormsBtn.classList.toggle('active', state.showAllForms);
            if (formsToggleText) {
                formsToggleText.textContent = state.showAllForms ? 'Showing All Forms' : 'Base Pokémon Only';
            } else {
                toggleFormsBtn.textContent = state.showAllForms ? 'Showing All Forms' : 'Base Pokémon Only';
            }
            applyFilters();
        };
    }

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (searchInput) searchInput.blur();
        });
    }

    if (randomPokeBtn) {
        randomPokeBtn.onclick = () => {
            const filtered = state.allPokemon.filter(poke => {
                if (!state.showAllForms && !state.showMegaOnly && !state.showRegionalOnly) {
                    if (isAlternateForm(poke)) return false;
                }
                if (state.currentSearchTerm) {
                    const nameMatch = poke.name.toLowerCase().includes(state.currentSearchTerm);
                    const idMatch = poke.pokedex_number.toString().includes(state.currentSearchTerm);
                    if (!nameMatch && !idMatch) return false;
                }
                if (state.activeTypes.size > 0) {
                    const pokeTypes = [poke.type_1, poke.type_2].filter(Boolean);
                    if (!Array.from(state.activeTypes).every(t => pokeTypes.includes(t))) return false;
                }
                if (state.activeGens.size > 0) {
                    if (!state.activeGens.has(poke.generation)) return false;
                }
                if (state.showLegendaryOnly && !poke.is_legendary) return false;
                if (state.showMythicalOnly && !poke.is_mythical) return false;
                if (state.showMegaOnly && !poke.is_mega) return false;
                if (state.showRegionalOnly && !poke.is_regionalform) return false;
                return true;
            });

            if (filtered.length > 0) {
                const randomPoke = filtered[Math.floor(Math.random() * filtered.length)];
                openModal(randomPoke);
            }
        };
    }
}
