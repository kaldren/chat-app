from pydantic import BaseModel


class ChatModel(BaseModel):
    message: str
    thread_id: str
    agent_id: str