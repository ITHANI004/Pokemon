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

    let typesHTML = `<span class="type-badge type-${poke.type_1.toLowerCase()}" style="font-size: 0.95rem; padding: 0.45rem 1.2rem;">${poke.type_1}</span>`;
    if (poke.type_2) {
        typesHTML += `<span class="type-badge type-${poke.type_2.toLowerCase()}" style="font-size: 0.95rem; padding: 0.45rem 1.2rem;">${poke.type_2}</span>`;
    }

    detailView.innerHTML = `
        <div class="detail-top-nav">
            <button id="backToGridBtn" class="back-nav-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                <span>Back to Pokédex</span>
            </button>
            <div style="display: flex; gap: 0.8rem; flex-wrap: wrap;">
                <button id="playCryBtn" class="random-btn" style="height: 44px; border-color: rgba(255,255,255,0.2); color: white;">
                    <span>🔊 Play Cry</span>
                </button>
                <button id="sharePageBtn" class="random-btn" style="height: 44px; border-color: rgba(255,255,255,0.2); color: white;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    <span id="shareBtnText">Share Link</span>
                </button>
                <button id="compareBtn" class="compare-btn" style="height: 44px; padding: 0 1.6rem; background: ${mainColor}; color: #121212; border: none; border-radius: 50px; font-weight: bold; cursor: pointer; transition: transform 0.2s; font-size: 0.95rem;">Compare Pokémon</button>
            </div>
        </div>

        <!-- Main 3-Column Hero Grid -->
        <div class="detail-main-grid">
            <!-- Left Column: Pokédex Profile & Bio + Export Image Card -->
            <div class="detail-info-card" style="border-color: ${mainColor}44; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div class="card-section-title">Pokédex Data & Profile</div>
                    <div id="modal-details-area">
                        <div style="text-align: center; color: ${mainColor}; padding: 2rem 0;">Loading profile...</div>
                    </div>
                    <div id="modal-lore-area" class="detail-lore-entry">
                        Loading Pokédex entry...
                    </div>
                </div>
                <div id="export-card-area" style="margin-top: 1.8rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.08);">
                    <div style="color: var(--text-secondary); font-size: 0.82rem; text-transform: uppercase; margin-bottom: 0.8rem; font-weight: 700; letter-spacing: 1px;">Download Card</div>
                    <button id="downloadCardBtn" class="export-card-btn" style="background: ${mainColor}; color: #121212;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        <span id="downloadCardBtnText">Download as Image</span>
                    </button>
                </div>
            </div>

            <!-- Center Column: Artwork & Identification -->
            <div class="detail-centerpiece">
                <div class="detail-id-tag">${displayId}</div>
                <h1 class="detail-title" style="text-shadow: 0 0 35px ${mainColor}66;">${poke.name}</h1>
                <div class="detail-badges-row">
                    ${typesHTML}
                    <span class="trait-badge" style="background: rgba(255,255,255,0.12); color: #fff; padding: 0.45rem 1.1rem; font-size: 0.9rem; border-radius: 50px;">Generation ${poke.generation}</span>
                </div>
                <div class="detail-img-container" style="background: radial-gradient(circle, ${mainColor}88 0%, transparent 70%);">
                    <img class="detail-img" src="${poke.sprite_url || '/vite.svg'}" alt="${poke.name}">
                </div>
            </div>

            <!-- Right Column: Base Stats & Radar Chart -->
            <div class="detail-info-card" style="border-color: ${mainColor}44;">
                <div class="card-section-title">Base Stats Breakdown</div>
                <div id="modal-chart-area">
                    <div style="text-align: center; color: ${mainColor}; padding: 2rem 0;">Fetching base stats...</div>
                </div>
            </div>
        </div>

        <!-- Secondary 2-Column Grid for Combat & Moves -->
        <div class="detail-secondary-grid">
            <div class="detail-info-card" style="border-color: rgba(255,255,255,0.08);">
                <div class="card-section-title">Type Defenses & Matchups</div>
                <div id="modal-combat-area">
                    <div style="text-align: center; color: ${mainColor}; padding: 1.5rem 0;">Calculating effectiveness...</div>
                </div>
            </div>
            <div class="detail-info-card" style="border-color: rgba(255,255,255,0.08);">
                <div class="card-section-title">Notable Learned Moves</div>
                <div id="modal-moves-area">
                    <div style="text-align: center; color: ${mainColor}; padding: 1.5rem 0;">Loading move pool...</div>
                </div>
            </div>
        </div>

        <!-- Evolutionary Line Card -->
        <div class="detail-info-card" style="border-color: rgba(255,255,255,0.08);">
            <div class="card-section-title">Evolutionary Line</div>
            <div id="evo-section">
                <div style="text-align: center; color: var(--text-secondary); padding: 1.5rem 0;">Loading evolutionary line...</div>
            </div>
        </div>
    `;

    const backToGridBtn = document.getElementById('backToGridBtn');
    if (backToGridBtn) {
        backToGridBtn.onclick = () => closeModal(true);
    }

    const playCryBtn = document.getElementById('playCryBtn');
    if (playCryBtn) {
        playCryBtn.onclick = () => {
            const audioUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${poke.pokedex_number}.ogg`;
            const audio = new Audio(audioUrl);
            audio.play().catch(err => console.log('Cry playback error:', err));
        };
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

        const heightM = (data.height / 10).toFixed(1);
        const heightFtTotal = data.height * 0.328084;
        const heightFt = Math.floor(heightFtTotal);
        const heightIn = Math.round((heightFtTotal - heightFt) * 12);

        const weightKg = (data.weight / 10).toFixed(1);
        const weightLbs = (data.weight * 0.220462).toFixed(1);
        const baseXp = data.base_experience || 'Unknown';
        const order = data.order || poke.pokedex_number;

        const abilitiesList = data.abilities.map(a => {
            const name = a.ability.name.replace('-', ' ');
            return a.is_hidden ? `${name} (Hidden)` : name;
        }).join(', ');

        const detailsArea = document.getElementById('modal-details-area');
        if (detailsArea) {
            detailsArea.innerHTML = `
                <div class="profile-list">
                    <div class="profile-row">
                        <span class="profile-label">Height</span>
                        <span class="profile-value" style="color: ${mainColor}">${heightM} m (${heightFt}'${heightIn}")</span>
                    </div>
                    <div class="profile-row">
                        <span class="profile-label">Weight</span>
                        <span class="profile-value" style="color: ${mainColor}">${weightKg} kg (${weightLbs} lbs)</span>
                    </div>
                    <div class="profile-row">
                        <span class="profile-label">Base Experience</span>
                        <span class="profile-value">${baseXp} XP</span>
                    </div>
                    <div class="profile-row">
                        <span class="profile-label">Abilities</span>
                        <span class="profile-value" style="text-transform: capitalize;">${abilitiesList}</span>
                    </div>
                    <div class="profile-row">
                        <span class="profile-label">Order</span>
                        <span class="profile-value">#${order}</span>
                    </div>
                </div>
            `;
        }

        const downloadCardBtn = document.getElementById('downloadCardBtn');
        if (downloadCardBtn) {
            downloadCardBtn.onclick = () => generateAndShareCard(poke, data, mainColor);
        }

        const totalStats = data.stats.reduce((acc, s) => acc + s.base_stat, 0);
        let statBarsHTML = '';
        data.stats.forEach(s => {
            const statName = s.stat.name.replace('-', ' ').toUpperCase();
            const shortName = statName === 'SPECIAL ATTACK' ? 'SP. ATK' :
                              statName === 'SPECIAL DEFENSE' ? 'SP. DEF' : statName;
            const pct = Math.min((s.base_stat / 255) * 100, 100);
            statBarsHTML += `
                <div class="stat-progress-row">
                    <span class="stat-label">${shortName}</span>
                    <div class="stat-bar-bg">
                        <div class="stat-bar-fill" style="width: ${pct}%; background: ${mainColor}; box-shadow: 0 0 10px ${mainColor};"></div>
                    </div>
                    <span class="stat-val">${s.base_stat}</span>
                </div>
            `;
        });

        const chartArea = document.getElementById('modal-chart-area');
        if (chartArea) {
            chartArea.innerHTML = `
                <div style="margin-bottom: 1.5rem;">${statBarsHTML}</div>
                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1rem; margin-bottom: 1.2rem; display: flex; justify-content: space-between; font-weight: bold; font-size: 1.05rem;">
                    <span style="color: var(--text-secondary);">TOTAL BASE STATS</span>
                    <span style="color: ${mainColor}; font-size: 1.2rem;">${totalStats}</span>
                </div>
                <div style="width: 100%; max-width: 280px; margin: 0 auto;">
                    <canvas id="statChart"></canvas>
                </div>
            `;
        }

        if (currentChart) currentChart.destroy();
        const statChartEl = document.getElementById('statChart');
        if (statChartEl) {
            const ctx = statChartEl.getContext('2d');
            const statNames = data.stats.map(s => {
                const n = s.stat.name.replace('-', ' ').toUpperCase();
                return n === 'SPECIAL ATTACK' ? 'SP. ATK' : n === 'SPECIAL DEFENSE' ? 'SP. DEF' : n;
            });
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
                            pointLabels: { color: 'rgba(255,255,255,0.85)', font: { size: 10, family: 'Inter', weight: '600' } },
                            ticks: { display: false, max: 255, min: 0 }
                        }
                    },
                    plugins: { legend: { display: false } },
                    maintainAspectRatio: true
                }
            });
        }

        const effectiveness = getTypeEffectiveness(poke.type_1, poke.type_2);
        let weaknessHTML = '';
        effectiveness.weak.forEach(w => {
            weaknessHTML += `<span class="type-badge type-${w.type}" style="font-size: 0.78rem; margin: 0.2rem; padding: 0.35rem 0.7rem;">${w.type} ${w.mult}x</span>`;
        });
        let resistHTML = '';
        effectiveness.resist.forEach(r => {
            resistHTML += `<span class="type-badge type-${r.type}" style="font-size: 0.78rem; margin: 0.2rem; opacity: 0.85; padding: 0.35rem 0.7rem;">${r.type} ${r.mult}x</span>`;
        });
        effectiveness.immune.forEach(i => {
            resistHTML += `<span class="type-badge type-${i}" style="font-size: 0.78rem; margin: 0.2rem; opacity: 0.55; padding: 0.35rem 0.7rem;">${i} 0x</span>`;
        });
        if (!resistHTML) resistHTML = '<span style="color:var(--text-secondary); font-size: 0.9rem;">None</span>';

        const combatArea = document.getElementById('modal-combat-area');
        if (combatArea) {
            combatArea.innerHTML = `
                <div style="margin-bottom: 1.5rem;">
                    <div style="color: var(--text-secondary); font-size: 0.82rem; text-transform: uppercase; margin-bottom: 0.7rem; font-weight: 700; letter-spacing: 1px;">Weaknesses (Vulnerable To)</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">${weaknessHTML}</div>
                </div>
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.82rem; text-transform: uppercase; margin-bottom: 0.7rem; font-weight: 700; letter-spacing: 1px;">Resistances & Immunities</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">${resistHTML}</div>
                </div>
            `;
        }

        const movesArea = document.getElementById('modal-moves-area');
        if (movesArea && data.moves) {
            const notableMoves = data.moves
                .slice(0, 16)
                .map(m => `<span class="move-tag">${m.move.name.replace('-', ' ')}</span>`)
                .join('');
            movesArea.innerHTML = `
                <div style="display: flex; flex-wrap: wrap; text-transform: capitalize;">
                    ${notableMoves || '<span style="color:var(--text-secondary);">No moves listed</span>'}
                </div>
            `;
        }

        loadEvolutionTree(poke, data, mainColor, openModal);

    } catch (err) {
        const detailsArea = document.getElementById('modal-details-area');
        if (detailsArea) {
            detailsArea.innerHTML = '<div style="color: red; text-align: center; margin-top: 1rem;">Failed to load stats.</div>';
        }
    }
}

function generateAndShareCard(poke, data, mainColor) {
    const btnText = document.getElementById('downloadCardBtnText');
    if (btnText) btnText.textContent = 'Generating Image...';

    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1020;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#141416';
    ctx.fillRect(0, 0, 720, 1020);

    const grad = ctx.createRadialGradient(360, 340, 50, 360, 340, 420);
    grad.addColorStop(0, mainColor + '77');
    grad.addColorStop(1, '#141416');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 1020);

    // Card Borders
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 680, 980);

    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, 648, 948);

    // Header
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = 'bold 28px sans-serif';
    const displayId = '#' + poke.pokedex_number.toString().padStart(3, '0');
    ctx.fillText(displayId, 70, 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 54px sans-serif';
    ctx.fillText(poke.name.toUpperCase(), 70, 165);

    // Type Badges (Supports dual types)
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.roundRect(70, 190, 135, 38, 19);
    ctx.fill();

    ctx.fillStyle = '#121212';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(poke.type_1.toUpperCase(), 137, 215);

    if (poke.type_2) {
        const type2Color = typeColorMap[poke.type_2.toLowerCase()] || '#888888';
        ctx.fillStyle = type2Color;
        ctx.beginPath();
        ctx.roundRect(218, 190, 135, 38, 19);
        ctx.fill();

        ctx.fillStyle = '#121212';
        ctx.fillText(poke.type_2.toUpperCase(), 285, 215);
    }
    ctx.textAlign = 'left';

    // Sprite
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        ctx.drawImage(img, 180, 240, 360, 360);

        // Stats Dashboard Card
        ctx.fillStyle = 'rgba(18, 18, 22, 0.9)';
        ctx.beginPath();
        ctx.roundRect(60, 620, 600, 290, 26);
        ctx.fill();
        ctx.strokeStyle = mainColor + '88';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = mainColor;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('PHYSICAL & COMBAT PROFILE', 95, 665);

        // Row 1: Height & Weight
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '16px sans-serif';
        ctx.fillText('HEIGHT', 95, 710);
        ctx.fillText('WEIGHT', 360, 710);

        const heightM = (data.height / 10).toFixed(1) + ' m';
        const weightKg = (data.weight / 10).toFixed(1) + ' kg';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(heightM, 95, 742);
        ctx.fillText(weightKg, 360, 742);

        // Row 2: Base Experience & Total Stats
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '16px sans-serif';
        ctx.fillText('BASE EXPERIENCE', 95, 785);
        ctx.fillText('TOTAL BASE STATS', 360, 785);

        const baseXp = (data.base_experience || 'Unknown') + ' XP';
        const totalStats = data.stats.reduce((acc, s) => acc + s.base_stat, 0);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(baseXp, 95, 817);
        ctx.fillText(totalStats.toString(), 360, 817);

        // Row 3: Primary Abilities (Full width across bottom row)
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '16px sans-serif';
        ctx.fillText('PRIMARY ABILITIES', 95, 860);

        const abilities = data.abilities.slice(0, 3).map(a => a.ability.name.replace('-', ' ')).join(', ').toUpperCase();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(abilities, 95, 890);

        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('POKÉDEX MODERN DB • OFFICIAL SUMMARY', 360, 960);

        canvas.toBlob((blob) => {
            if (!blob) return;
            triggerDownload(URL.createObjectURL(blob), poke.name, btnText);
        });
    };
    img.onerror = () => {
        if (btnText) btnText.textContent = 'Failed to load image';
        setTimeout(() => { if (btnText) btnText.textContent = 'Download as Image'; }, 3000);
    };
    img.src = poke.sprite_url || '/vite.svg';
}

function triggerDownload(url, name, btnText) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}-Summary-Card.png`;
    a.click();
    if (btnText) btnText.textContent = 'Card Downloaded! ✅';
    setTimeout(() => { if (btnText) btnText.textContent = 'Download as Image'; }, 3000);
}
