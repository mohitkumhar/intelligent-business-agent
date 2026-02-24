from flask import Flask, request, jsonify
from flask import Response, stream_with_context
import json
from uuid import uuid4
from basic_web_search_agent_utils import general_information_graph_workflow

app = Flask(__name__)


@app.route('/api/v1/', methods=['GET'])


@app.route('/api/v1/', methods=['GET'])
def query_agent():
	try:
		user_query = request.args.get("user_query")
		thread_id = request.args.get("thread_id")

		if not user_query:
			return jsonify({"error": "Missing 'user_query' in query parameters"}), 400

		initial_state = {
			"user_query": user_query
		}

		config = {"configurable": {"thread_id": thread_id}}

		def generate():
			for result in general_information_graph_workflow.stream(
				initial_state,
				config=config
			):
				response = {
					"user_query": user_query,
					"thread_id": thread_id,
				}
				response.update(result)

				yield json.dumps(response) + "\n"

		return Response(
			stream_with_context(generate()),
			content_type="application/json"
		)

	except Exception as e:
		return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
	app.run(debug=False)

