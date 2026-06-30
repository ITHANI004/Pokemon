export const typeColorMap = {
    'normal': '#A8A77A', 'fire': '#EE8130', 'water': '#6390F0', 'electric': '#F7D02C',
    'grass': '#7AC74C', 'ice': '#96D9D6', 'fighting': '#C22E28', 'poison': '#A33EA1',
    'ground': '#E2BF65', 'flying': '#A98FF3', 'psychic': '#F95587', 'bug': '#A6B91A',
    'rock': '#B6A136', 'ghost': '#735797', 'dragon': '#6F35FC', 'dark': '#705746',
    'steel': '#B7B7CE', 'fairy': '#D685AD'
};

export const typeChart = {
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

export function isAlternateForm(poke) {
    if (poke.pokedex_number > 1025) return true;
    if (poke.is_mega || poke.is_regionalform) return true;
    const name = poke.name.toLowerCase();
    return name.includes('-mega') || name.includes('-gmax') || name.includes('-alola') || name.includes('-galar') || name.includes('-hisui') || name.includes('-paldea');
}

export function getTypeEffectiveness(type1, type2) {
    const multipliers = {};
    Object.keys(typeChart).forEach(t => multipliers[t] = 1);

    const applyType = (type) => {
        if (!type) return;
        const t = type.toLowerCase();
        if (!typeChart[t]) return;
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
        if (multipliers[t] >= 2) weak.push({ type: t, mult: multipliers[t] });
        else if (multipliers[t] === 0.5 || multipliers[t] === 0.25) resist.push({ type: t, mult: multipliers[t] });
        else if (multipliers[t] === 0) immune.push(t);
    });

    return { weak, resist, immune };
}
