"""Rate limiting for the two unauthenticated auth endpoints.

Uses slowapi's in-memory store (no Redis). That's a deliberate choice, not
an oversight: this deployment runs the backend as a single container/single
process, so there's no horizontal scaling that would fragment the counters
across processes. See README "Known Limitations" for the production-scale
alternative (swap `storage_uri` for a `redis://` URL -- slowapi supports
that as a drop-in change).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
