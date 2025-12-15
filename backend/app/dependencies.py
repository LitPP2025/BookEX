from fastapi import Request

def get_socket_manager(request: Request):
    """Dependency для получения socket_manager из состояния приложения"""
    return request.app.state.socket_manager
