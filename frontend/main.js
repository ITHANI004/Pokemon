import './style.css';
import { state } from './modules/state.js';
import { buildAllPokemonCards, setupPaginationListeners } from './modules/cards.js';
import { applyFilters, renderTypeFilters, setupFilterListeners, setupSearchAndSort } from './modules/filters.js';
import { setupModalListeners, openModal, showPokedexView } from './modules/modal.js';
import { setupCompareBanner } from './modules/compare.js';

const API_URL = '/pokemon.json';

async function fetchPokemon() {
    const loading = document.getElementById('loading');
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Failed to fetch from backend');
        state.allPokemon = await res.json();
        if (loading) loading.style.display = 'none';

        renderTypeFilters();
        setupFilterListeners();
        setupSearchAndSort();
        buildAllPokemonCards(state.allPokemon);
        applyFilters();

        if (window.location.hash && window.location.hash.startsWith('#pokemon-')) {
            const id = parseInt(window.location.hash.replace('#pokemon-', ''));
            const poke = state.allPokemon.find(p => p.pokedex_number === id);
            if (poke) openModal(poke, false);
        }
    } catch (err) {
        if (loading) {
            loading.textContent = 'Error connecting to backend database. Make sure Flask is running!';
        }
        console.error(err);
    }
}

function setupGlobalListeners() {
    setupModalListeners();
    setupCompareBanner();
    setupPaginationListeners((resetPage) => applyFilters(resetPage));

    window.addEventListener('popstate', () => {
        if (!window.location.hash || !window.location.hash.startsWith('#pokemon-')) {
            showPokedexView(false);
        } else {
            const id = parseInt(window.location.hash.replace('#pokemon-', ''));
            const poke = state.allPokemon.find(p => p.pokedex_number === id);
            if (poke) openModal(poke, false);
        }
    });

    const backToTopBtn = document.getElementById('backToTopBtn');
    window.addEventListener('scroll', () => {
        if (backToTopBtn) {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }
    });

    if (backToTopBtn) {
        backToTopBtn.onclick = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }

    const searchInput = document.getElementById('searchInput');
    window.addEventListener('keydown', (e) => {
        if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && document.activeElement !== searchInput) {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });
}

setupGlobalListeners();
fetchPokemon();
