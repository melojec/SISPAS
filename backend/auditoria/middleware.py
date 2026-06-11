import threading

_thread_local = threading.local()


def get_current_user():
    request = getattr(_thread_local, 'request', None)
    if request is None:
        return None
    user = getattr(request, 'user', None)
    if user is None:
        return None
    if not getattr(user, 'is_authenticated', False):
        return None
    return user


def get_current_ip():
    return getattr(_thread_local, 'ip', None)


class AuditoriaMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_local.request = request
        _thread_local.ip = self._get_ip(request)
        return self.get_response(request)

    def _get_ip(self, request):
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
