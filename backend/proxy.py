from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
import uvicorn
from typing import Any

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Backend server URL
BACKEND_URL = "http://13.221.248.158"

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "CORS proxy server is running"}

# Proxy function
async def proxy_request(request: Request, path: str) -> Response:
    async with httpx.AsyncClient() as client:
        # Get the request method, headers, and body
        method = request.method
        headers = dict(request.headers)

        # Remove host header to avoid conflicts
        headers.pop("host", None)

        # Get query parameters
        query_params = dict(request.query_params)

        # Get request body
        body = await request.body()

        try:
            # Make the proxy request
            response = await client.request(
                method=method,
                url=f"{BACKEND_URL}{path}",
                headers=headers,
                params=query_params,
                content=body,
                timeout=30.0
            )

            # Create response with the same status code and content
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.headers.get("content-type")
            )

        except httpx.RequestError as e:
            return Response(
                content=f"Proxy error: {str(e)}",
                status_code=503,
                media_type="text/plain"
            )

# Proxy endpoints
@app.api_route("/api/v2/execute", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_execute(request: Request):
    return await proxy_request(request, "/api/v2/execute")

@app.api_route("/api/v2/runtimes", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_runtimes(request: Request):
    return await proxy_request(request, "/api/v2/runtimes")

@app.api_route("/api/v2/execute/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_execute_subpath(request: Request, path: str):
    return await proxy_request(request, f"/api/v2/execute/{path}")

@app.api_route("/api/v2/runtimes/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_runtimes_subpath(request: Request, path: str):
    return await proxy_request(request, f"/api/v2/runtimes/{path}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3001)
