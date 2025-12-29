import os
# ---- Silence TensorFlow logs ----
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

from flask import Flask, render_template, request, jsonify
import json
import torch
from sentence_transformers import SentenceTransformer, util
from transformers import pipeline
from dotenv import load_dotenv

# ---------------- ENV ----------------
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # optional for future use

# ---------------- FLASK ----------------
app = Flask(__name__, template_folder="templates", static_folder="static")

# ---------------- DATA ----------------
DATA_FILE = "chatbot_data.json"

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"questions": [], "answers": []}

data = load_data()
questions = data.get("questions", [])
answers = data.get("answers", [])

# ---------------- MODELS (LAZY LOAD) ----------------
bert_model = None
question_embeddings = None
qa_pipeline = None

def load_models():
    global bert_model, question_embeddings, qa_pipeline

    if bert_model is None:
        print("Loading SentenceTransformer model...")
        bert_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

        if questions:
            question_embeddings = bert_model.encode(
                questions, convert_to_tensor=True
            )
        print("SentenceTransformer loaded")

    # OPTIONAL: Only load if you REALLY need QA
    # Uncomment if required
    """
    if qa_pipeline is None:
        print("Loading QA model...")
        qa_pipeline = pipeline(
            "question-answering",
            model="deepset/roberta-base-squad2"
        )
        print("QA model loaded")
    """

# ---------------- CHATBOT LOGIC ----------------
def chatbot_response(user_input):
    load_models()

    if questions and question_embeddings is not None:
        input_embedding = bert_model.encode(
            user_input, convert_to_tensor=True
        )
        similarities = util.pytorch_cos_sim(
            input_embedding, question_embeddings
        )[0]

        best_match_idx = torch.argmax(similarities).item()
        confidence = similarities[best_match_idx].item()

        if confidence > 0.5:
            return answers[best_match_idx]

    return "I can't understand that. Please ask something else."

# ---------------- ROUTES ----------------
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def get_response():
    data = request.get_json()
    user_input = data.get("message", "").strip()

    if not user_input:
        return jsonify({"response": "Please enter a message."})

    response = chatbot_response(user_input)
    return jsonify({"response": response})

# ---------------- MAIN ----------------
if __name__ == "__main__":
    print("Starting Flask chatbot...")
    app.run(debug=True)
