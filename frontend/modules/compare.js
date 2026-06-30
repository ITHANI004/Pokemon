import { state } from './state.js';
import { typeColorMap } from './utils.js';

export function setupCompareBanner() {
    const cancelCompareBtn = document.getElementById('cancelCompareBtn');
    const compareBanner = document.getElementById('compareBanner');
    if (cancelCompareBtn && compareBanner) {
        cancelCompareBtn.onclick = () => {
            state.compareModePoke = null;
            compareBanner.style.display = 'none';
        };
    }
}

export async function openCompareModal(poke1, poke2) {
    const modal = document.getElementById('pokeModal');
    const modalBody = document.getElementById('modal-body');
    const compareBanner = document.getElementById('compareBanner');

    state.compareModePoke = null;
    if (compareBanner) compareBanner.style.display = 'none';
    if (!modal || !modalBody) return;

    modal.classList.add('show');
    modalBody.innerHTML = `<div style="text-align: center; margin: 3rem; font-size: 1.5rem;">Loading Comparison...</div>`;

    try {
        const fetchDetails = async (poke) => {
            const cacheKey = `poke_${poke.pokedex_number}`;
            if (state.pokeApiCache.has(cacheKey)) return state.pokeApiCache.get(cacheKey);
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${poke.pokedex_number}`);
            const data = await res.json();
            state.pokeApiCache.set(cacheKey, data);
            return data;
        };

        const [data1, data2] = await Promise.all([fetchDetails(poke1), fetchDetails(poke2)]);

        const renderColumn = (poke, data) => {
            const mainColor = typeColorMap[poke.type_1.toLowerCase()] || '#ffffff';
            const totalStats = data.stats.reduce((acc, s) => acc + s.base_stat, 0);

            return `
                <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 20px; border: 1px solid ${mainColor}55;">
                    <h3 style="font-size: 2rem; font-family: var(--font-heading); margin-bottom: 0.5rem; color: ${mainColor};">${poke.name}</h3>
                    <div style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 1.1rem;">#${poke.pokedex_number.toString().padStart(3, '0')}</div>

                    <img src="${poke.sprite_url || '/vite.svg'}" style="width: 180px; height: 180px; object-fit: contain; filter: drop-shadow(0 15px 15px rgba(0,0,0,0.5)); margin-bottom: 2rem; transform: scale(1.1);">

                    <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; text-align: center; margin-bottom: 2rem;">
                        <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 12px;">
                            <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.3rem;">Height</div>
                            <div style="font-weight: bold; font-size: 1.2rem;">${data.height / 10}m</div>
                        </div>
                        <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 12px;">
                            <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.3rem;">Weight</div>
                            <div style="font-weight: bold; font-size: 1.2rem;">${data.weight / 10}kg</div>
                        </div>
                    </div>

                    <div style="width: 100%; text-align: left; background: rgba(0,0,0,0.15); padding: 1.5rem; border-radius: 12px;">
                        <div style="font-size: 0.9rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 1rem; font-weight: bold; text-align: center;">Base Stats (Total: ${totalStats})</div>
                        ${data.stats.map(s => `
                            <div style="display: flex; align-items: center; margin-bottom: 0.6rem;">
                                <div style="width: 100px; font-size: 0.85rem; font-weight: 600;">${s.stat.name.replace('-', ' ').toUpperCase()}</div>
                                <div style="flex-grow: 1; background: rgba(255,255,255,0.05); height: 10px; border-radius: 5px; margin: 0 12px; overflow: hidden;">
                                    <div style="width: ${(s.base_stat / 255) * 100}%; background: ${mainColor}; height: 100%; border-radius: 5px; box-shadow: 0 0 10px ${mainColor};"></div>
                                </div>
                                <div style="width: 35px; text-align: right; font-size: 1rem; font-weight: bold;">${s.base_stat}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        };

        modalBody.innerHTML = `
            <div style="text-align: center; margin-bottom: 2.5rem;">
                <h2 style="font-size: 2.5rem; font-family: var(--font-heading); margin-bottom: 0.5rem; background: linear-gradient(90deg, #ffcb05, #fff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Head-to-Head Comparison</h2>
                <div style="color: var(--text-secondary);">Comparing stats and details</div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 3rem; align-items: stretch;">
                ${renderColumn(poke1, data1)}
                ${renderColumn(poke2, data2)}
            </div>
        `;

    } catch (e) {
        modalBody.innerHTML = '<div style="color: red; text-align: center; font-size: 1.2rem; margin: 2rem;">Error loading comparison data. Check console.</div>';
        console.error(e);
    }
}
