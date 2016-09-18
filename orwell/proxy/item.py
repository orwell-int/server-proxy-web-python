import orwell.messages.server_game_pb2


class Item(object):
    def __init__(self, pb_item):
        self._pb_item = pb_item
        self._capture_status = None

    @property
    def capture_status(self):
        if (self._capture_status is None):
            self._capture_status = self._get_capture_status()
        return self._capture_status

    def _get_capture_status(self):
        with self._pb_item as item:
            if (orwell.messages.ItemType.FLAG == item.type):
                capture_status = "Flag"
            else:
                capture_status = "Something"
            capture_status += " " + item.name
            if (item.HasField("capture_status")):
                if (orwell.messages.CaptureStatus.STARTED ==
                        item.capture_status):
                    capture_status += " being captured"
                elif (orwell.messages.CaptureStatus.FAILED ==
                        item.capture_status):
                    capture_status += " not being captured any longer"
                elif (orwell.messages.CaptureStatus.SUCCEEDED ==
                        item.capture_status):
                    capture_status += " just captured"
                if (item.HasField("capturer")):
                    capture_status += " by " + item.capturer
        return capture_status
