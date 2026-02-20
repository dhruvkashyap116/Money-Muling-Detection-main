from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import io
import time

from services.graph_analyzer import build_graph, detect_fraud

app = Flask(__name__)
CORS(app)

@app.route('/api/analyze', methods=['POST'])
def analyze_csv():
    start_time = time.time()

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if not file or not file.filename:
        return jsonify({"error": "No selected file"}), 400

    if file.filename.endswith('.csv'): 
        try:
            file_content = file.read()


            if isinstance(file_content, bytes):
                try:
                    file_content = file_content.decode('utf-8')
                except UnicodeDecodeError: 
                    return jsonify({"error": "File encoding error - please use UTF-8 encoded CSV"}), 400

            stream = io.StringIO(file_content)
            df = pd.read_csv(stream)

            G = build_graph(df)
            results = detect_fraud(G, start_time)

            return jsonify(results), 200

        except ValueError as ve:
            return jsonify({"error": f"CSV parsing error: {str(ve)}"}), 400
        except Exception as e:
            return jsonify({"error": f"Server error: {str(e)}"}), 500

    return jsonify({"error": "Invalid file type. Only CSV allowed."}), 400

if __name__ == '__main__':
    app.run(debug=False, port=5500)
