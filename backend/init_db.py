import sqlite3
import requests
import json
import os

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

def populate_db(conn):
    c = conn.cursor()
    # Check if we already have data
    c.execute("SELECT COUNT(*) FROM pokemon")
    if c.fetchone()[0] > 0:
        print("Database already populated.")
        return

    print("Fetching data from PokeAPI (first 151 Pokemon)...")
    url = "https://pokeapi.co/api/v2/pokemon?limit=151"
    response = requests.get(url)
    results = response.json().get('results', [])

    legendaries = {144, 145, 146, 150} # Articuno, Zapdos, Moltres, Mewtwo
    mythicals = {151} # Mew

    for item in results:
        pokemon_url = item['url']
        p_res = requests.get(pokemon_url).json()
        
        pokedex_number = p_res['id']
        name = p_res['name'].capitalize()
        
        types = p_res['types']
        type_1 = types[0]['type']['name'].capitalize()
        type_2 = types[1]['type']['name'].capitalize() if len(types) > 1 else None
        
        generation = 1 # We are just pulling gen 1 for speed
        is_legendary = pokedex_number in legendaries
        is_mythical = pokedex_number in mythicals
        is_mega = False
        is_regionalform = False
        sprite_url = p_res['sprites']['other']['official-artwork']['front_default'] or p_res['sprites']['front_default']

        c.execute('''
            INSERT INTO pokemon (
                pokedex_number, name, type_1, type_2, generation, 
                is_legendary, is_mythical, is_mega, is_regionalform, sprite_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (pokedex_number, name, type_1, type_2, generation, 
              is_legendary, is_mythical, is_mega, is_regionalform, sprite_url))
        
        if pokedex_number % 20 == 0:
            print(f"Loaded {pokedex_number}...")

    conn.commit()
    print("Database populated successfully!")

if __name__ == '__main__':
    conn = init_db()
    populate_db(conn)
    conn.close()
