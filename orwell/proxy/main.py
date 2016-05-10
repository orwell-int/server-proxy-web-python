"""Web site"""

import logging
import sys
import os
import socket
import struct

import tornado.ioloop
import tornado.web
import tornado.template


class MainHandler(tornado.web.RequestHandler):
    def initialize(self):
        print(os.getcwd())
        self._loader = tornado.template.Loader("data")
        broadcast = Broadcast()
        print(broadcast.push_address + " / " + broadcast.subscribe_address)
        self._push_address = broadcast.push_address
        self._subscribe_address = broadcast.subscribe_address

    def get(self):
        content = self._loader.load("index.html").generate(
                videofeed="oups I forgot the video",
                status="well let's say pending")
        self.write(content)


def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
    ])


class Broadcast(object):
    def __init__(self, port=9080, retries=5, timeout=10):
        self._size = 512
        self._retries = retries
        self._group = ('225.0.0.42', port)
        self._socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self._socket.settimeout(timeout)
        ttl = struct.pack('b', 1)
        self._socket.setsockopt(
            socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, ttl)
        self._received = False
        self._data = None
        self._sender = None
        self._decding_successful = False
        self.send_all_broadcast_messages()

    def send_all_broadcast_messages(self):
        tries = 0
        while ((tries < self._retries) and (not self._received)):
            self.send_one_broadcast_message()
            tries += 1
        if (self._received):
            self.decode_data()

    def send_one_broadcast_message(self):
        try:
            sent = self._socket.sendto("<broadcast>".encode("ascii"), self._group)
            while not self._received:
                try:
                    self._data, self._sender = self._socket.recvfrom(self._size)
                    self._received = True
                except socket.timeout:
                    print('timed out, no more responses', file=sys.stderr)
                    break
                else:
                    print(
                        'received "%s" from %s' % (self._data, self._sender),
                        file=sys.stderr)
        finally:
            print('closing socket', file=sys.stderr)
            self._socket.close()

    def decode_data(self):
        # data (split on different lines for clarity):
        # 0xA0
        # size on 8 bytes
        # Address of puller
        # 0xA1
        # size on 8 bytes
        # Address of publisher
        # 0x00
        assert(self._data[0] == 0xA0)
        puller_size = self._data[1]
        # print("puller_size = " + str(puller_size))
        end_puller = 2 + puller_size
        puller_address = self._data[2:end_puller].decode("ascii")
        # print("puller_address = " + puller_address)
        assert(self._data[end_puller] == 0xA1)
        publisher_size = self._data[end_puller + 1]
        # print("publisher_size = " + str(publisher_size))
        end_publisher = end_puller + 2 + publisher_size
        publisher_address = self._data[end_puller + 2:end_publisher].decode("ascii")
        # print("publisher_address = " + publisher_address)
        assert(self._data[end_publisher] == 0x00)
        sender_ip, _ = self._sender
        self._push_address = puller_address.replace('*', sender_ip)
        self._subscribe_address = publisher_address.replace('*', sender_ip)
        self._decding_successful = True

    @property
    def push_address(self):
        return self._push_address

    @property
    def subscribe_address(self):
        return self._subscribe_address


def main(argv=sys.argv[1:]):
    """Entry point for the tests and program."""
    app = make_app()
    app.listen(5000)
    tornado.ioloop.IOLoop.current().start()


if ("__main__" == __name__):
    sys.exit(main(sys.argv[1:]))  # pragma: no coverage
