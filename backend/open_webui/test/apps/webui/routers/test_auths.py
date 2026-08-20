from open_webui.test.util.abstract_integration_test import AbstractPostgresTest
from open_webui.test.util.mock_user import mock_webui_user


class TestAuths(AbstractPostgresTest):
    BASE_PATH = "/api/v1/auths"

    def setup_class(cls):
        super().setup_class()
        from open_webui.models.auths import Auths

        cls.auths = Auths

    def test_get_session_user(self):
        with mock_webui_user():
            response = self.fast_api_client.get(self.create_url(""))
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "1"
        assert data["email"] == "john.doe@openwebui.com"
        assert data["token_type"] == "Bearer"

    def test_signin(self):
        from open_webui.utils.auth import get_password_hash

        user = self.auths.insert_new_auth(
            email="john.doe@openwebui.com",
            password=get_password_hash("password"),
            name="John Doe",
            profile_image_url="/user.png",
            role="user",
        )
        response = self.fast_api_client.post(
            self.create_url("/signin"),
            json={"email": "john.doe@openwebui.com", "password": "password"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user.id
        assert data["email"] == "john.doe@openwebui.com"
        assert data["role"] == "user"
        assert "/api/v1/users/" in data["profile_image_url"]
        assert data["token"] is not None and len(data["token"]) > 0
        assert data["token_type"] == "Bearer"

    def test_signup(self):
        response = self.fast_api_client.post(
            self.create_url("/signup"),
            json={
                "name": "John Doe",
                "email": "john.doe@openwebui.com",
                "password": "password",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] is not None and len(data["id"]) > 0
        assert data["email"] == "john.doe@openwebui.com"
        assert data["token"] is not None and len(data["token"]) > 0

    def test_add_user(self):
        with mock_webui_user():
            response = self.fast_api_client.post(
                self.create_url("/add"),
                json={
                    "name": "John Doe 2",
                    "email": "john.doe2@openwebui.com",
                    "password": "password2",
                    "role": "admin",
                },
            )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "John Doe 2"
        assert data["email"] == "john.doe2@openwebui.com"

    def test_api_key_roundtrip(self):
        user = self.auths.insert_new_auth(
            email="john.doe@openwebui.com",
            password="password",
            name="John Doe",
            profile_image_url="/user.png",
            role="admin",
        )
        with mock_webui_user(id=user.id):
            create_response = self.fast_api_client.post(self.create_url("/api_key"))
            assert create_response.status_code == 200
            api_key = create_response.json()["api_key"]
            assert api_key

            get_response = self.fast_api_client.get(self.create_url("/api_key"))
            assert get_response.status_code == 200
            assert get_response.json()["api_key"] == api_key

            delete_response = self.fast_api_client.delete(self.create_url("/api_key"))
            assert delete_response.status_code == 200
            assert delete_response.json() is True
