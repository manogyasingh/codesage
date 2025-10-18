from fastapi import APIRouter, WebSocket, WebSocketDisconnect


router = APIRouter()


@router.websocket("/ws/interviews/{session_id}")
async def ws_interview(websocket: WebSocket, session_id: str):
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_text()
            await websocket.send_text(message)
    except WebSocketDisconnect:
        pass


