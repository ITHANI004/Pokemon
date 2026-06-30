import Chart from 'chart.js/auto';
import { state } from './state.js';
import { typeColorMap, getTypeEffectiveness } from './utils.js';
import { loadEvolutionTree } from './evolution.js';

let currentChart = null;

export function setupModalListeners() {
    const modal = document.getElementById('pokeModal');
    const closeBtn = document.querySelector('.close-btn');

    if (closeBtn && modal) {
        closeBtn.onclick = () => {
            modal.classList.remove('show');
        };
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

export function showPokedexView(pushHistory = true) {
    const pokedexView = document.getElementById('pokedexView');
    const detailView = document.getElementById('detailView');
    const modal = document.getElementById('pokeModal');
    if (modal) modal.classList.remove('show');
    if (detailView) detailView.style.display = 'none';
    if (pokedexView) pokedexView.style.display = 'block';
    if (pushHistory && window.location.hash.startsWith('#pokemon-')) {
        window.history.pushState({}, '', window.location.pathname);
    }
}

export async function openModal(poke, pushHistory = true) {
    const pokedexView = document.getElementById('pokedexView');
    const detailView = document.getElementById('detailView');
    if (!detailView) return;

    if (pushHistory) {
        window.history.pushState({ id: poke.pokedex_number }, '', `#pokemon-${poke.pokedex_number}`);
    }

    if (pokedexView) pokedexView.style.display = 'none';
    detailView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const displayId = '#' + poke.pokedex_number.toString().padStart(3, '0');
    const mainColor = typeColorMap[poke.type_1.toLowerCase()] || '#ffffff';

    detailView.innerHTML = `
        <button id="backNavBtn" class="back-nav-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <span>Back to Pokédex</span>
        </button>
        <div class="detail-page-container">
            <div class="modal-header-top" style="text-align: center; margin-bottom: 2rem;">
                <h2 style="font-size: 2.5rem; font-family: var(--font-heading); margin-bottom: 0.5rem;">${poke.name}</h2>
                <div style="color: var(--text-secondary); font-size: 1.2rem;">${displayId} - Generation ${poke.generation}</div>
                <button id="compareBtn" class="compare-btn" style="margin-top: 1.5rem; padding: 0.6rem 2rem; background: ${mainColor}; color: #121212; border: none; border-radius: 25px; font-weight: bold; cursor: pointer; transition: transform 0.2s; font-size: 1rem;">Compare with another Pokémon</button>
            </div>
            <div class="modal-body-grid three-col">
                <div class="modal-left">
                    <div id="modal-details-area">
                        <div style="text-align: center; color: ${mainColor}; margin: 2rem; font-weight: bold;">Loading details...</div>
                    </div>
                </div>
                <div class="modal-center" style="display: flex; flex-direction: column; align-items: center;">
                    <div class="modal-img-container" style="background: radial-gradient(circle, ${mainColor}88 0%, transparent 70%); width: 240px; height: 240px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin-bottom: 1.5rem;">
                        <img class="modal-img" src="${poke.sprite_url || '/vite.svg'}" alt="${poke.name}" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 15px 15px rgba(0,0,0,0.4)); transform: scale(1.1);">
                    </div>
                    <div id="modal-lore-area" style="text-align: center; font-style: italic; color: var(--text-secondary); min-height: 40px; font-size: 1rem; line-height: 1.5; max-width: 320px;">
                        Loading Pokédex entry...
                    </div>
                </div>
                <div class="modal-right">
                    <div id="modal-chart-area">
                        <div style="text-align: center; color: ${mainColor}; margin: 2rem; font-weight: bold;">Fetching advanced stats...</div>
                    </div>
                </div>
            </div>
            <div id="evo-section" style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); min-height: 100px;">
                <div style="text-align: center; color: var(--text-secondary); font-size: 0.9rem;">Loading evolutionary line...</div>
            </div>
        </div>
    `;

    const backNavBtn = document.getElementById('backNavBtn');
    if (backNavBtn) {
        backNavBtn.onclick = () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                showPokedexView(true);
            }
        };
    }

    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn) {
        compareBtn.onclick = () => {
            state.compareModePoke = poke;
            showPokedexView(true);
            const compareTargetName = document.getElementById('compareTargetName');
            const compareBanner = document.getElementById('compareBanner');
            if (compareTargetName && compareBanner) {
                compareTargetName.textContent = poke.name;
                compareBanner.style.display = 'flex';
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
                <div style="display: flex; flex-direction: column; gap: 1.2rem; align-items: center; background: rgba(0,0,0,0.2); border-radius: 16px; padding: 1.5rem; box-shadow: inset 0 0 20px rgba(0,0,0,0.2);">
                    <div style="text-align: center; width: 100%;">
                        <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.2rem;">Height</div>
                        <div style="font-size: 1.4rem; font-weight: bold; color: ${mainColor}">${heightM} m</div>
                    </div>
                    <div style="width: 80%; height: 1px; background: rgba(255,255,255,0.05);"></div>
                    <div style="text-align: center; width: 100%;">
                        <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.2rem;">Weight</div>
                        <div style="font-size: 1.4rem; font-weight: bold; color: ${mainColor}">${weightKg} kg</div>
                    </div>
                    <div style="width: 80%; height: 1px; background: rgba(255,255,255,0.05);"></div>
                    <div style="text-align: center; width: 100%;">
                        <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.2rem;">Ability</div>
                        <div style="font-size: 1.2rem; font-weight: bold; text-transform: capitalize;">${abilityName}</div>
                    </div>
                    <div style="width: 80%; height: 1px; background: rgba(255,255,255,0.05);"></div>
                    <div style="text-align: center; width: 100%;">
                        <div style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.2rem;">Special Move</div>
                        <div style="font-size: 1.2rem; font-weight: bold; text-transform: capitalize;">${moveName}</div>
                    </div>
                </div>
            `;
        }

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
        if (!resistHTML) resistHTML = '<span style="color:var(--text-secondary); font-size: 0.8rem;">None</span>';

        const chartArea = document.getElementById('modal-chart-area');
        if (chartArea) {
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
                            pointLabels: { color: 'rgba(255,255,255,0.9)', font: { size: 10, family: 'Inter' } },
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
