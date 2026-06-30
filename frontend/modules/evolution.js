import { state } from './state.js';

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
    const foundPoke = state.allPokemon.find(p => p.name.toLowerCase() === speciesName.toLowerCase() || p.name.toLowerCase() === speciesName.toLowerCase().replace('-', ' '));
    if (!foundPoke) return '';

    const isCurrent = foundPoke.pokedex_number === currentId;
    let html = `
        <div class="evo-node-wrapper" style="display: flex; align-items: center; justify-content: center;">
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
                    <div class="evo-method" style="font-size: 0.75rem; color: var(--text-secondary); text-transform: capitalize; margin-bottom: 0.5rem; text-align: center; max-width: 90px; line-height: 1.2; background: rgba(0,0,0,0.3); padding: 0.3rem 0.6rem; border-radius: 6px;">${methodStr}</div>
                    <div class="evo-arrow" style="color: ${mainColor}; font-size: 2rem; margin: 0;">➔</div>
                </div>
            `;
            html += buildEvoTree(child, mainColor, currentId);
        } else {
            html += `
                <div class="evo-arrow-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 1.5rem;">
                    <div class="evo-arrow" style="color: ${mainColor}; font-size: 2.5rem; margin: 0;">➔</div>
                </div>
                <div class="evo-branches" style="display: flex; flex-wrap: wrap; gap: 1.5rem; max-width: 500px; justify-content: flex-start; border-left: 2px solid rgba(255,255,255,0.05); padding-left: 1.5rem;">
            `;
            node.evolves_to.forEach(child => {
                const methodStr = getEvolutionMethod(child.evolution_details);
                html += `
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <div class="evo-method" style="font-size: 0.75rem; color: var(--text-secondary); text-transform: capitalize; margin-bottom: 0.5rem; text-align: center; max-width: 90px; line-height: 1.1; background: rgba(0,0,0,0.3); padding: 0.3rem 0.6rem; border-radius: 6px;">${methodStr}</div>
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

export async function loadEvolutionTree(poke, data, mainColor, onSelectPokemon) {
    const evoSection = document.getElementById('evo-section');
    if (!evoSection) return;

    try {
        let chain = null;
        let flavorText = "No Pokédex data available.";
        const cacheKey = `evo_tree_${poke.pokedex_number}`;

        if (state.pokeApiCache.has(cacheKey)) {
            const cachedData = state.pokeApiCache.get(cacheKey);
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
            state.pokeApiCache.set(cacheKey, { chain, flavorText });
        }

        const loreSection = document.getElementById('modal-lore-area');
        if (loreSection) {
            loreSection.innerHTML = `"${flavorText}"`;
        }

        const evolutionsHTML = buildEvoTree(chain, mainColor, poke.pokedex_number);

        evoSection.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-bottom: 0.5rem;">Evolutionary Line</div>
            <div class="evo-container" style="justify-content: center; overflow-x: auto; padding-top: 1.5rem; padding-bottom: 1.5rem; margin-top: 0.5rem;">
                ${evolutionsHTML}
            </div>
        `;

        document.querySelectorAll('.evo-item').forEach(el => {
            el.onclick = () => {
                const targetId = parseInt(el.getAttribute('data-id'));
                const targetPoke = state.allPokemon.find(p => p.pokedex_number === targetId);
                if (targetPoke && onSelectPokemon) {
                    onSelectPokemon(targetPoke);
                }
            };
        });

    } catch (err) {
        evoSection.innerHTML = '<div style="color: var(--text-secondary); text-align: center;">Could not load evolutionary line.</div>';
    }
}
