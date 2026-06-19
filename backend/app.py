from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app) # Allow frontend to make requests

DB_PATH = 'pokemon.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/pokemon', methods=['GET'])
def get_all_pokemon():
    conn = get_db_connection()
    pokemon = conn.execute('SELECT * FROM pokemon ORDER BY pokedex_number').fetchall()
    conn.close()
    
    return jsonify([dict(p) for p in pokemon])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
