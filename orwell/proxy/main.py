"""Web site"""

import logging
import sys
import socket

import tornado.ioloop
import tornado.web


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")


def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
    ])


def main(argv=sys.argv[1:]):
    """Entry point for the tests and program."""
    app = make_app()
    app.listen(5000)
    tornado.ioloop.IOLoop.current().start()


if ("__main__" == __name__):
    sys.exit(main(sys.argv[1:]))  # pragma: no coverage
