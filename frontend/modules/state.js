export const state = {
    allPokemon: [],
    pokemonCardsMap: new Map(),
    activeTypes: new Set(),
    activeGens: new Set(),
    showLegendaryOnly: false,
    showMythicalOnly: false,
    showMegaOnly: false,
    showRegionalOnly: false,
    currentSearchTerm: '',
    showAllForms: false,
    currentPage: 1,
    itemsPerPage: 60,
    compareModePoke: null,
    pokeApiCache: new Map()
};
