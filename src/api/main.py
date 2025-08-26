from contextlib import asynccontextmanager
from fastapi import FastAPI
from azure.identity import DefaultAzureCredential
import os
from azure.ai.projects import AIProjectClient
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()

import routes

@asynccontextmanager
async def lifespan(app: FastAPI):

    ai_project = AIProjectClient(
    endpoint=os.getenv("AI_FOUNDRY_ENDPOINT"),
    credential=DefaultAzureCredential())

    app.state.ai_project = ai_project

    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)