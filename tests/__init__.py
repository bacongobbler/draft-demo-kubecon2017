import unittest
import uuid

import uuidgen

class AppTestCase(unittest.TestCase):

    def setUp(self):
        self.client = uuidgen.app.test_client()

    def test_uuid_generated(self):
        resp = self.client.get('/')
        self.assertIsInstance(uuid.UUID(resp.data), uuid.UUID)
