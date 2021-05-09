from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
import os.path
import httpx

app = FastAPI()

# api key -> api key record
users = {}



API_URL = "https://api.hypixel.net"

@app.get("/api/uuid")
async def uuid(username: str):
    url = f"https://api.mojang.com/users/profiles/minecraft/{username}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        resp.raise_for_status()

    return resp.json()


# Proxy requests to /api to hypixel's api at API_URL.
@app.get("/api/{path:path}")
async def api_proxy(path: str, request: Request, response: Response):
    async with httpx.AsyncClient() as client:
        url = os.path.join(API_URL, path) + '?' + str(request.query_params)
        resp = await client.get(url, headers={'API-Key': request.headers['API-Key']})

    response.body = resp.content
    response.status_code = resp.status_code
    return response


app.mount("/", StaticFiles(directory="public", html=True))
