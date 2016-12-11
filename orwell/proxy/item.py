import orwell.messages.server_game_pb2 as pb_server_game


class Item(object):
    def __init__(self, pb_item):
        self._pb_item = pb_item
        self._capture_status = None
        self._short_status = None

    @property
    def name(self):
        return self._pb_item.name

    @property
    def type(self):
        return self._pb_item.type

    @property
    def short_status(self):
        if (self._short_status is None):
            self._short_status = self._get_short_status()
        # print(
            # "Item(" + self.name + ")::short_status = " +
            # self._short_status)
        return self._short_status

    def _get_short_status(self):
        item = self._pb_item
        short_status = item.name
        if (item.HasField("capture_status")):
            if (pb_server_game.STARTED ==
                    item.capture_status):
                short_status += " + "
                if (item.HasField("capturer")):
                    short_status += item.capturer + " "
            elif (pb_server_game.FAILED ==
                    item.capture_status):
                short_status += " - "
            elif (pb_server_game.SUCCEEDED ==
                    item.capture_status):
                short_status += " ! "
            if (item.HasField("owner")):
                short_status += "[" + item.owner + "]"
        return short_status

    @property
    def capture_status(self):
        if (self._capture_status is None):
            self._capture_status = self._get_capture_status()
        return self._capture_status

    def _get_capture_status(self):
        item = self._pb_item
        if (pb_server_game.FLAG == item.type):
            capture_status = "Flag"
        else:
            capture_status = "Something"
        capture_status += " " + item.name
        if (item.HasField("capture_status")):
            if (pb_server_game.STARTED ==
                    item.capture_status):
                capture_status += " being captured"
            elif (pb_server_game.FAILED ==
                    item.capture_status):
                capture_status += " not being captured any longer"
            elif (pb_server_game.SUCCEEDED ==
                    item.capture_status):
                capture_status += " just captured"
            if (item.HasField("capturer")):
                capture_status += " by " + item.capturer
        return capture_status
