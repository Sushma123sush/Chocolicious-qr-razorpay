import hmac
import os
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24  # 24 hours


class AuthConfigError(Exception):
    pass


def _serializer():
    secret = os.environ.get("FLASK_SECRET_KEY")
    if not secret:
        raise AuthConfigError("FLASK_SECRET_KEY is not set. Add it to backend/.env.")
    return URLSafeTimedSerializer(secret, salt="owner-auth")


def check_owner_credentials(username, password):
    expected_username = os.environ.get("OWNER_USERNAME")
    expected_password = os.environ.get("OWNER_PASSWORD")
    if not expected_username or not expected_password:
        raise AuthConfigError("OWNER_USERNAME / OWNER_PASSWORD are not set. Add them to backend/.env.")
    username_ok = hmac.compare_digest(username or "", expected_username)
    password_ok = hmac.compare_digest(password or "", expected_password)
    return username_ok and password_ok


def issue_owner_token():
    return _serializer().dumps({"role": "owner"})


def verify_owner_token(token):
    if not token:
        return False
    try:
        data = _serializer().loads(token, max_age=TOKEN_MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired):
        return False
    return data.get("role") == "owner"