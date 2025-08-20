import fastapi
from fastapi import Request, Depends, HTTPException
from fastapi.responses import StreamingResponse
from models.chat import ChatModel
from azure.ai.projects import AIProjectClient
from azure.ai.agents.models import AgentEventHandler, MessageDeltaChunk, ThreadMessage, ThreadRun, RunStep, RunStepDeltaChunk, AgentStreamEvent
import json

router = fastapi.APIRouter()

def get_ai_project(request: fastapi.Request) -> AIProjectClient:
    return request.app.state.ai_project

@router.get("/hi")
async def hi():
    return {"message": "Hello from the /hi endpoint!"}


@router.post("/api/chat")
async def chat(request: Request):
    client = get_ai_project(request)
    agent_client = client.agents

    chat = await request.json()
    chat_model = ChatModel(**chat)

    agent_client.messages.create(
        thread_id=chat_model.thread_id,
        role="user",
        content=chat_model.message
    )

    def generate_stream():
        try:
            yield f"data: {json.dumps({'type': 'start', 'thread_id': chat_model.thread_id, 'agent_id': chat_model.agent_id})}\n\n"
            
            with agent_client.runs.stream(thread_id=chat_model.thread_id, agent_id=chat_model.agent_id) as stream:
                for event_type, event_data, _ in stream:

                    if isinstance(event_data, MessageDeltaChunk):
                        # Stream text chunks as they arrive
                        chunk_data = {
                            'type': 'text_delta',
                            'content': event_data.text
                        }
                        yield f"data: {json.dumps(chunk_data)}\n\n"

                    elif isinstance(event_data, ThreadMessage):
                        # Send message metadata
                        message_data = {
                            'type': 'message',
                            'id': event_data.id,
                            'status': event_data.status
                        }
                        yield f"data: {json.dumps(message_data)}\n\n"

                    elif isinstance(event_data, ThreadRun):
                        # Send run status updates
                        run_data = {
                            'type': 'run_status',
                            'status': event_data.status
                        }
                        yield f"data: {json.dumps(run_data)}\n\n"

                    elif isinstance(event_data, RunStep):
                        # Send step information
                        step_data = {
                            'type': 'run_step',
                            'step_type': event_data.type,
                            'status': event_data.status
                        }
                        yield f"data: {json.dumps(step_data)}\n\n"

                    elif event_type == AgentStreamEvent.ERROR:
                        # Send error information
                        error_data = {
                            'type': 'error',
                            'error': str(event_data)
                        }
                        yield f"data: {json.dumps(error_data)}\n\n"

                    elif event_type == AgentStreamEvent.DONE:
                        # Send completion signal
                        done_data = {
                            'type': 'done',
                            'message': 'Stream completed'
                        }
                        yield f"data: {json.dumps(done_data)}\n\n"
                        break

        except Exception as e:
            error_data = {
                'type': 'error',
                'error': str(e)
            }
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    )