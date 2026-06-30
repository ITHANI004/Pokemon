import { state } from './state.js';
import { openModal } from './modal.js';
import { openCompareModal } from './compare.js';

export function buildAllPokemonCards(pokemonList) {
    const grid = document.getElementById('pokemon-grid');
    if (!grid) return;
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

        card.onclick = () => {
            if (state.compareModePoke) {
                openCompareModal(state.compareModePoke, poke);
            } else {
                openModal(poke);
            }
        };
        grid.appendChild(card);
        state.pokemonCardsMap.set(poke.pokedex_number, card);
    });
}

export function updateGridDisplay(filteredPokemon, sortValue) {
    state.pokemonCardsMap.forEach(card => {
        card.style.display = 'none';
    });

    const totalPages = Math.max(1, Math.ceil(filteredPokemon.length / state.itemsPerPage));
    if (state.currentPage > totalPages) state.currentPage = totalPages;

    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const pageItems = filteredPokemon.slice(startIndex, startIndex + state.itemsPerPage);

    pageItems.forEach((poke, idx) => {
        const card = state.pokemonCardsMap.get(poke.pokedex_number);
        if (card) {
            card.style.display = '';
            card.style.order = idx;

            let sortBadge = card.querySelector('.poke-sort-badge');
            if (!sortBadge) {
                sortBadge = document.createElement('span');
                sortBadge.className = 'trait-badge poke-sort-badge';
                sortBadge.style.background = 'rgba(255, 203, 5, 0.2)';
                sortBadge.style.color = '#ffcb05';
                sortBadge.style.fontWeight = 'bold';
                const traitsContainer = card.querySelector('.poke-traits');
                if (traitsContainer) traitsContainer.prepend(sortBadge);
            }
            if (sortValue === 'weight-desc') sortBadge.textContent = `Weight: ${poke.weight || 0} kg`;
            else if (sortValue === 'height-desc') sortBadge.textContent = `Height: ${poke.height || 0} m`;
            else if (sortValue === 'speed-desc') sortBadge.textContent = `Speed: ${poke.speed || 0}`;
            else if (sortValue === 'attack-desc') sortBadge.textContent = `Attack: ${poke.attack || 0}`;

            if (['weight-desc', 'height-desc', 'speed-desc', 'attack-desc'].includes(sortValue)) {
                sortBadge.style.display = 'inline-block';
            } else if (sortBadge) {
                sortBadge.style.display = 'none';
            }
        }
    });

    const paginationContainer = document.getElementById('paginationContainer');
    const pageIndicator = document.getElementById('pageIndicator');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    if (paginationContainer) {
        if (filteredPokemon.length > 0) {
            paginationContainer.style.display = 'flex';
            if (pageIndicator) pageIndicator.textContent = `Page ${state.currentPage} of ${totalPages}`;
            if (prevPageBtn) prevPageBtn.classList.toggle('disabled', state.currentPage === 1);
            if (nextPageBtn) nextPageBtn.classList.toggle('disabled', state.currentPage === totalPages);
        } else {
            paginationContainer.style.display = 'none';
        }
    }
}

export function setupPaginationListeners(onPageChange) {
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    if (prevPageBtn) {
        prevPageBtn.onclick = () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                onPageChange(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
    }

    if (nextPageBtn) {
        nextPageBtn.onclick = () => {
            nextPageBtn.blur();
            if (!nextPageBtn.classList.contains('disabled')) {
                state.currentPage++;
                onPageChange(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
    }
}
