from flask import Flask
import os
import socket

app = Flask(__name__)

@app.route('/')
def hello():
    hostname = socket.gethostname()
    version = os.environ.get('APP_VERSION', '1.0.0')
    return f"<h1>Hello from TRUE GITOPS! 🚀</h1><p>Running on pod: {hostname}</p><p>Version: {version}</p>"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
