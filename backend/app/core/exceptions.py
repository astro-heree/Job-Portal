class AppError(Exception):
    """Base for all domain errors. Caught by a global handler and rendered
    as a consistent JSON envelope (see core/error_handlers.py)."""

    status_code = 400
    code = "BAD_REQUEST"

    def __init__(self, message: str, *, fields: dict[str, list[str]] | None = None):
        self.message = message
        self.fields = fields
        super().__init__(message)


class BadRequestError(AppError):
    status_code = 400
    code = "BAD_REQUEST"


class UnauthorizedError(AppError):
    status_code = 401
    code = "UNAUTHORIZED"


class ForbiddenError(AppError):
    status_code = 403
    code = "FORBIDDEN"


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"


class ConflictError(AppError):
    status_code = 409
    code = "CONFLICT"
