import os

bind = "0.0.0.0:%d" % os.environ.get("PORT", 8000)
