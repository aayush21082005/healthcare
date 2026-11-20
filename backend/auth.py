import base64
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

PASSWORD_HASH_SCHEME = "scrypt"
PASSWORD_HASH_N = 2**14
PASSWORD_HASH_R = 8
PASSWORD_HASH_P = 1
PASSWORD_HASH_LENGTH = 64
TOKEN_LIFETIME = timedelta(minutes=30)
ALGORITHM = "HS256"

_bearer = HTTPBearer(auto_error=False)


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=PASSWORD_HASH_N,
        r=PASSWORD_HASH_R,
        p=PASSWORD_HASH_P,
        dklen=PASSWORD_HASH_LENGTH,
        maxmem=128 * 1024 * 1024,
    )
    return "$".join(
        (
            PASSWORD_HASH_SCHEME,
            str(PASSWORD_HASH_N),
            str(PASSWORD_HASH_R),
            str(PASSWORD_HASH_P),
            _encode(salt),
            _encode(digest),
        )
    )


def verify_password(password: str, password_hash: str) -> bool:
    try:
        scheme, n_value, r_value, p_value, salt_value, digest_value = (
            password_hash.split("$")
        )
        n, r, p = int(n_value), int(r_value), int(p_value)
        if (
            scheme != PASSWORD_HASH_SCHEME
            or n != PASSWORD_HASH_N
            or r != PASSWORD_HASH_R
            or p != PASSWORD_HASH_P
        ):
            return False

        expected = _decode(digest_value)
        actual = hashlib.scrypt(
            password.encode("utf-8"),
            salt=_decode(salt_value),
            n=n,
            r=r,
            p=p,
            dklen=len(expected),
            maxmem=128 * 1024 * 1024,
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError, UnicodeError):
        return False


def _auth_config() -> tuple[str, str, str]:
    username = os.getenv("ADMIN_USERNAME", "")
    password_hash = os.getenv("ADMIN_PASSWORD_HASH", "")
    secret = os.getenv("JWT_SECRET", "")
    if not username or not password_hash or len(secret) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured.",
        )
    return username, password_hash, secret


def create_access_token(username: str, password: str) -> str:
    configured_username, password_hash, secret = _auth_config()
    username_is_valid = hmac.compare_digest(username, configured_username)
    password_is_valid = verify_password(password, password_hash)

    if not username_is_valid or not password_is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": configured_username,
            "iat": now,
            "exp": now + TOKEN_LIFETIME,
            "jti": secrets.token_urlsafe(16),
        },
        secret,
        algorithm=ALGORITHM,
    )


def require_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username, _, secret = _auth_config()
    try:
        payload = jwt.decode(
            credentials.credentials,
            secret,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "iat", "sub"]},
        )
        subject = payload["sub"]
    except (jwt.InvalidTokenError, KeyError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not isinstance(subject, str) or not hmac.compare_digest(subject, username):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return subject


if __name__ == "__main__":
    from getpass import getpass

    print(hash_password(getpass("Admin password: ")))
