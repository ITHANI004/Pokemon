import Chart from 'chart.js/auto';
import { state } from './state.js';
import { typeColorMap, getTypeEffectiveness } from './utils.js';
import { loadEvolutionTree } from './evolution.js';

let currentChart = null;

export function setupModalListeners() {
    window.addEventListener('popstate', () => {
        handleRoute(false);
    });
}

export function handleRoute(pushToHistory = false) {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    if (idParam) {
        const id = parseInt(idParam);
        const foundPoke = state.allPokemon.find(p => p.pokedex_number === id);
        if (foundPoke) {
            openModal(foundPoke, pushToHistory);
            return;
        }
    }
    if (window.location.hash && window.location.hash.startsWith('#pokemon/')) {
        const id = parseInt(window.location.hash.replace('#pokemon/', ''));
        const foundPoke = state.allPokemon.find(p => p.pokedex_number === id);
        if (foundPoke) {
            openModal(foundPoke, pushToHistory);
            return;
        }
    }
    closeModal(false);
}

export function closeModal(pushToHistory = true) {
    const pokedexView = document.getElementById('pokedexView');
    const detailView = document.getElementById('detailView');
    if (detailView) detailView.style.display = 'none';
    if (pokedexView) pokedexView.style.display = 'block';

    if (pushToHistory) {
        const url = new URL(window.location);
        url.searchParams.delete('id');
        const cleanSearch = url.searchParams.toString() ? '?' + url.searchParams.toString() : '';
        window.history.pushState({}, '', url.pathname + cleanSearch);
    }
}

export async function openModal(poke, pushToHistory = true) {
    const pokedexView = document.getElementById('pokedexView');
    const detailView = document.getElementById('detailView');
    if (!detailView) return;

    if (pushToHistory) {
        const url = new URL(window.location);
        url.searchParams.set('id', poke.pokedex_number);
        window.history.pushState({ id: poke.pokedex_number }, '', url);
    }

    if (pokedexView) pokedexView.style.display = 'none';
    detailView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const displayId = '#' + poke.pokedex_number.toString().padStart(3, '0');
    const mainColor = typeColorMap[poke.type_1.toLowerCase()] || '#ffffff';

    let typesHTML = `<span class="type-badge type-${poke.type_1.toLowerCase()}" style="font-size: 1rem; padding: 0.5rem 1.2rem;">${poke.type_1}</span>`;
    if (poke.type_2) {
        typesHTML += `<span class="type-badge type-${poke.type_2.toLowerCase()}" style="font-size: 1rem; padding: 0.5rem 1.2rem;">${poke.type_2}</span>`;
    }

    detailView.innerHTML = `
        <div class="detail-top-nav" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;">
            <button id="backToGridBtn" class="back-nav-btn" style="margin-bottom: 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                <span>Back to Pokédex</span>
            </button>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <button id="sharePageBtn" class="random-btn" style="height: 46px; border-color: rgba(255,255,255,0.2); color: white;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    <span id="shareBtnText">Share Link</span>
                </button>
                <button id="compareBtn" class="compare-btn" style="height: 46px; padding: 0 1.8rem; background: ${mainColor}; color: #121212; border: none; border-radius: 50px; font-weight: bold; cursor: pointer; transition: transform 0.2s; font-size: 0.95rem;">Compare Pokémon</button>
            </div>
        </div>

        <div class="detail-page-container" style="border-color: ${mainColor}55; box-shadow: 0 20px 60px rgba(0,0,0,0.6);">
            <div class="detail-header" style="text-align: center; margin-bottom: 3rem;">
                <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-secondary); margin-bottom: 0.5rem; letter-spacing: 2px;">${displayId}</div>
                <h1 style="font-size: 3.8rem; font-family: var(--font-heading); margin-bottom: 1.2rem; color: #fff; text-shadow: 0 0 30px ${mainColor}55;">${poke.name}</h1>
                <div style="display: flex; justify-content: center; gap: 0.8rem; align-items: center; flex-wrap: wrap;">
                    ${typesHTML}
                    <span class="trait-badge" style="background: rgba(255,255,255,0.1); color: #fff; padding: 0.5rem 1.2rem; font-size: 0.95rem;">Generation ${poke.generation}</span>
                </div>
            </div>

            <div class="modal-body-grid three-col" style="gap: 3rem; align-items: center;">
                <div class="modal-left">
                    <div id="modal-details-area">
                        <div style="text-align: center; color: ${mainColor}; padding: 2rem; font-weight: bold;">Loading details...</div>
                    </div>
                </div>
                <div class="modal-center" style="display: flex; flex-direction: column; align-items: center;">
                    <div class="detail-img-container" style="background: radial-gradient(circle, ${mainColor}88 0%, transparent 70%); width: 300px; height: 300px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin-bottom: 2rem;">
                        <img class="detail-img" src="${poke.sprite_url || '/vite.svg'}" alt="${poke.name}" style="width: 95%; height: 95%; object-fit: contain; filter: drop-shadow(0 20px 25px rgba(0,0,0,0.6));">
                    </div>
                    <div id="modal-lore-area" style="text-align: center; font-style: italic; color: var(--text-secondary); font-size: 1.1rem; line-height: 1.6; max-width: 360px; background: rgba(0,0,0,0.25); padding: 1.2rem 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                        Loading Pokédex entry...
                    </div>
                </div>
                <div class="modal-right">
                    <div id="modal-chart-area">
                        <div style="text-align: center; color: ${mainColor}; padding: 2rem; font-weight: bold;">Fetching advanced stats...</div>
                    </div>
                </div>
            </div>

            <div id="evo-section" style="margin-top: 4rem; padding-top: 3rem; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="text-align: center; color: var(--text-secondary); font-size: 0.9rem;">Loading evolutionary line...</div>
            </div>
        </div>
    `;

    const backToGridBtn = document.getElementById('backToGridBtn');
    if (backToGridBtn) {
        backToGridBtn.onclick = () => closeModal(true);
    }

    const sharePageBtn = document.getElementById('sharePageBtn');
    const shareBtnText = document.getElementById('shareBtnText');
    if (sharePageBtn && shareBtnText) {
        sharePageBtn.onclick = () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                shareBtnText.textContent = 'Link Copied!';
                sharePageBtn.style.background = '#7AC74C';
                sharePageBtn.style.color = '#121212';
                sharePageBtn.style.borderColor = '#7AC74C';
                setTimeout(() => {
                    shareBtnText.textContent = 'Share Link';
                    sharePageBtn.style.background = '';
                    sharePageBtn.style.color = 'white';
                    sharePageBtn.style.borderColor = 'rgba(255,255,255,0.2)';
                }, 2000);
            });
        };
    }

    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn) {
        compareBtn.onclick = () => {
            state.compareModePoke = poke;
            closeModal(true);
            const compareTargetName = document.getElementById('compareTargetName');
            const compareBanner = document.getElementById('compareBanner');
            if (compareTargetName && compareBanner) {
                compareTargetName.textContent = poke.name;
                compareBanner.style.display = 'flex';
            }
        };
    }

    try {
        let data;
        const cacheKey = `poke_${poke.pokedex_number}`;
        if (state.pokeApiCache.has(cacheKey)) {
            data = state.pokeApiCache.get(cacheKey);
        } else {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${poke.pokedex_number}`);
            data = await res.json();
            state.pokeApiCache.set(cacheKey, data);
        }

        const heightM = data.height / 10;
        const weightKg = data.weight / 10;
        const abilityName = data.abilities.length > 0 ? data.abilities[0].ability.name.replace('-', ' ') : 'Unknown';

        let moveName = 'None';
        if (data.moves && data.moves.length > 0) {
            moveName = data.moves[data.moves.length - 1].move.name.replace('-', ' ');
        }

        const detailsArea = document.getElementById('modal-details-area');
        if (detailsArea) {
            detailsArea.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 1.2rem; align-items: center; background: rgba(0,0,0,0.25); border-radius: 20px; padding: 2rem; border: 1px solid rgba(255,255,255,0.05); box-shadow: inset 0 0 20px rgba(0,0,0,0.3);">
                    <div style="text-align: center; width: 100%;">
                        <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.3rem;">Height</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${mainColor}">${heightM} m</div>
                    </div>
                    <div style="width: 80%; height: 1px; background: rgba(255,255,255,0.08);"></div>
                    <div style="text-align: center; width: 100%;">
                        <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.3rem;">Weight</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${mainColor}">${weightKg} kg</div>
                    </div>
                    <div style="width: 80%; height: 1px; background: rgba(255,255,255,0.08);"></div>
                    <div style="text-align: center; width: 100%;">
                        <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.3rem;">Ability</div>
                        <div style="font-size: 1.3rem; font-weight: bold; text-transform: capitalize;">${abilityName}</div>
                    </div>
                    <div style="width: 80%; height: 1px; background: rgba(255,255,255,0.08);"></div>
                    <div style="text-align: center; width: 100%;">
                        <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.3rem;">Special Move</div>
                        <div style="font-size: 1.3rem; font-weight: bold; text-transform: capitalize;">${moveName}</div>
                    </div>
                </div>
            `;
        }

        const effectiveness = getTypeEffectiveness(poke.type_1, poke.type_2);
        let weaknessHTML = '';
        effectiveness.weak.forEach(w => {
            weaknessHTML += `<span class="type-badge type-${w.type}" style="font-size: 0.75rem; margin: 0.2rem; padding: 0.3rem 0.6rem;">${w.type} ${w.mult}x</span>`;
        });
        let resistHTML = '';
        effectiveness.resist.forEach(r => {
            resistHTML += `<span class="type-badge type-${r.type}" style="font-size: 0.75rem; margin: 0.2rem; opacity: 0.8; padding: 0.3rem 0.6rem;">${r.type} ${r.mult}x</span>`;
        });
        effectiveness.immune.forEach(i => {
            resistHTML += `<span class="type-badge type-${i}" style="font-size: 0.75rem; margin: 0.2rem; opacity: 0.5; padding: 0.3rem 0.6rem;">${i} 0x</span>`;
        });
        if (!resistHTML) resistHTML = '<span style="color:var(--text-secondary); font-size: 0.85rem;">None</span>';

        const chartArea = document.getElementById('modal-chart-area');
        if (chartArea) {
            chartArea.innerHTML = `
                <div style="width: 100%; max-width: 350px; position: relative; margin: 0 auto;">
                    <canvas id="statChart"></canvas>
                </div>
                <div style="margin-top: 1.5rem; background: rgba(0,0,0,0.25); border-radius: 16px; padding: 1.5rem; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="margin-bottom: 1.2rem;">
                        <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 0.6rem; font-weight: bold; letter-spacing: 1px;">Weaknesses</div>
                        <div style="display: flex; flex-wrap: wrap;">${weaknessHTML}</div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 0.6rem; font-weight: bold; letter-spacing: 1px;">Resistances & Immunities</div>
                        <div style="display: flex; flex-wrap: wrap;">${resistHTML}</div>
                    </div>
                </div>
            `;
        }

        if (currentChart) currentChart.destroy();
        const statChartEl = document.getElementById('statChart');
        if (statChartEl) {
            const ctx = statChartEl.getContext('2d');
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
                            pointLabels: { color: 'rgba(255,255,255,0.9)', font: { size: 11, family: 'Inter', weight: '600' } },
                            ticks: { display: false, max: 255, min: 0 }
                        }
                    },
                    plugins: { legend: { display: false } },
                    maintainAspectRatio: true
                }
            });
        }

        loadEvolutionTree(poke, data, mainColor, openModal);

    } catch (err) {
        const detailsArea = document.getElementById('modal-details-area');
        if (detailsArea) {
            detailsArea.innerHTML = '<div style="color: red; text-align: center; margin-top: 1rem;">Failed to load stats.</div>';
        }
    }
}
