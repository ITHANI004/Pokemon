import sqlite3
import requests
import json
import os
import concurrent.futures

DB_PATH = 'pokemon.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS pokemon (
            pokedex_number INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            type_1 TEXT NOT NULL,
            type_2 TEXT,
            generation INTEGER,
            is_legendary BOOLEAN DEFAULT 0,
            is_mythical BOOLEAN DEFAULT 0,
            is_mega BOOLEAN DEFAULT 0,
            is_regionalform BOOLEAN DEFAULT 0,
            sprite_url TEXT
        )
    ''')
    conn.commit()
    return conn

def fetch_pokemon_data(url):
    return requests.get(url).json()

def populate_db(conn):
    c = conn.cursor()
    
    # Drop table to force refresh
    c.execute("DROP TABLE IF EXISTS pokemon")
    conn.commit()
    
    # Re-run create table
    init_db()

    print("Fetching data from PokeAPI (Fetching all entities including Megas)...")
    url = "https://pokeapi.co/api/v2/pokemon?limit=2000"
    response = requests.get(url)
    results = response.json().get('results', [])

    legendaries = {144, 145, 146, 150, 243, 244, 245, 249, 250, 377, 378, 379, 380, 381, 382, 383, 384, 480, 481, 482, 483, 484, 485, 486, 487, 488, 638, 639, 640, 641, 642, 643, 644, 645, 646, 716, 717, 718, 772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800, 888, 889, 890, 891, 892, 894, 895, 896, 897, 898, 905, 1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024}
    mythicals = {151, 251, 385, 386, 489, 490, 492, 493, 494, 647, 648, 649, 719, 720, 721, 801, 802, 807, 808, 809, 893, 1025}

    print("Fetching individual details concurrently. This will be fast!")
    pokemon_records = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(fetch_pokemon_data, item['url']): item for item in results}
        completed = 0
        for future in concurrent.futures.as_completed(futures):
            p_res = future.result()
            pokedex_number = p_res['id']
            name = p_res['name'].capitalize()
            
            types = p_res['types']
            type_1 = types[0]['type']['name'].capitalize()
            type_2 = types[1]['type']['name'].capitalize() if len(types) > 1 else None
            
            generation = 1
            if pokedex_number > 151: generation = 2
            if pokedex_number > 251: generation = 3
            if pokedex_number > 386: generation = 4
            if pokedex_number > 493: generation = 5
            if pokedex_number > 649: generation = 6
            if pokedex_number > 721: generation = 7
            if pokedex_number > 809: generation = 8
            if pokedex_number > 905: generation = 9
            
            is_legendary = pokedex_number in legendaries
            is_mythical = pokedex_number in mythicals
            is_mega = '-mega' in name.lower()
            is_regionalform = ('-alola' in name.lower() or '-galar' in name.lower() or 
                               '-hisui' in name.lower() or '-paldea' in name.lower())
            
            # Skip forms we don't care about (like pikachu wearing hats, totem pokemon, gmax)
            if pokedex_number > 1025:
                if not (is_mega or is_regionalform):
                    continue
                # For megas/regionals, we map their generation to the base pokemon if we wanted to, 
                # but leaving them as gen 9 or their base gen is fine. We will inherit base gen roughly
                # from the species ID later if needed, but for now we'll just set them to Generation 0 or similar so they stand out.
                # Actually, PokeAPI uses IDs like 10033 for Mega Venusaur.
                generation = 0 
                # Attempt to extract base ID from species URL to determine true generation
                species_url = p_res.get('species', {}).get('url', '')
                if species_url:
                    try:
                        base_id = int(species_url.rstrip('/').split('/')[-1])
                        if base_id <= 151: generation = 1
                        elif base_id <= 251: generation = 2
                        elif base_id <= 386: generation = 3
                        elif base_id <= 493: generation = 4
                        elif base_id <= 649: generation = 5
                        elif base_id <= 721: generation = 6
                        elif base_id <= 809: generation = 7
                        elif base_id <= 905: generation = 8
                        elif base_id <= 1025: generation = 9
                        
                        is_legendary = base_id in legendaries
                        is_mythical = base_id in mythicals
                    except:
                        pass
                        
            # Format name beautifully (e.g., "Venusaur-mega" -> "Mega Venusaur")
            formatted_name = name.capitalize()
            if is_mega:
                parts = name.lower().split('-')
                if parts[-1] in ['x', 'y']:
                    formatted_name = f"Mega {parts[0].capitalize()} {parts[-1].upper()}"
                else:
                    formatted_name = f"Mega {parts[0].capitalize()}"
            elif is_regionalform:
                parts = name.lower().split('-')
                region = parts[1].capitalize() # Alola, Galar, etc.
                formatted_name = f"{region}n {parts[0].capitalize()}"

            sprites = p_res['sprites']
            sprite_url = (sprites.get('other', {}).get('official-artwork', {}).get('front_default') or 
                          sprites.get('front_default'))
            
            if not sprite_url:
                continue

            pokemon_records.append((
                pokedex_number, formatted_name, type_1, type_2, generation, 
                is_legendary, is_mythical, is_mega, is_regionalform, sprite_url
            ))
            
            completed += 1
            if completed % 100 == 0:
                print(f"Fetched {completed}/1025...")

    print("Inserting into database...")
    c = conn.cursor()
    c.executemany('''
        INSERT INTO pokemon (
            pokedex_number, name, type_1, type_2, generation, 
            is_legendary, is_mythical, is_mega, is_regionalform, sprite_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', pokemon_records)
    
    conn.commit()
    print("Database populated successfully with 1025 Pokémon!")

if __name__ == '__main__':
    conn = init_db()
    populate_db(conn)
    conn.close()
