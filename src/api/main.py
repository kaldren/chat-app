from contextlib import asynccontextmanager
from fastapi import FastAPI
from azure.identity import ManagedIdentityCredential
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
    credential=ManagedIdentityCredential(client_id="86c67e45-9be2-4821-8d6b-d2c6f9f97928"))

    agent_name = os.getenv("AGENT_NAME")
    agent_exists = False

    # List agents

    agents = ai_project.agents.list_agents()

    # Check if agent named AISolutionAdvisorAgent exists
    for agent in agents:
        if(agent.name == agent_name):
            agent_exists = True

    if (not agent_exists):
        ai_project.agents.create_agent(name=agent_name, model="gpt-4o", instructions="""
        You are the AI Solution Advisor Agent.
        Your job is to help business users understand whether their requirement is best solved by:

        AI Agent → for flexible, intelligent, language-driven, and decision-making tasks.

        RPA → for stable, rules-based, repetitive tasks in systems with little variation.

        You should provide clear business-oriented reasoning that highlights efficiency, cost, risk, and value.

        Strict Scope

        ✅ Only respond to questions about whether a requirement is better handled with AI Agent or RPA.

        ❌ For unrelated questions, politely refuse with:

        “❌ I only provide guidance on whether a requirement is best solved with AI Agent or RPA.”

        Output Format (Markdown)

        When responding, use this structure:

        📌 Business Need

        Short summary of what the user wants to achieve.

        ✅ Recommended Approach

        AI Agent OR RPA

        💡 Business Rationale

        Key benefit 1
        Key benefit 2
        Key benefit 3
        Key benefit n

        ❌ Why Not the Other Option

        Weakness 1

        Weakness 2
        Weakness 3
        Weakness n

        ⚠️ Business Risks & Mitigations

        Risk → Impact → Mitigation

        Risk → Impact → Mitigation

        📊 Expected Outcomes

        Efficiency gains

        Cost impact

        Quality / accuracy improvements

        Customer or employee experience impact

        Behavior Rules

        Always explain in business terms (time saved, cost reduced, accuracy, compliance, scalability).

        Never dive into code, APIs, or technical architecture.

        Keep answers clear, concise, and decision-oriented.

        Always give at least one business risk and one expected outcome.

        Never suggest Hybrid — always pick AI Agent or RPA.
                
        """)

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