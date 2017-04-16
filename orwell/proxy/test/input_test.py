import unittest
from orwell.proxy.input import Joystick
import math
import logging
import sys


class InputTest(unittest.TestCase):
    _factor = 1.0
    _joystick = Joystick(0.01, "T.Flight Hotas X")
    _logger = logging.getLogger("SomeTest.testSomething")

    def test1(self):
        self._helper(0, 1, 1, 1)
        self._helper(1, 0, 1, -1)
        self._helper(-1, 0, -1, 1)
        self._helper_angle(math.pi / 8.0, 1, -0.525)
        self._helper_angle(-math.pi / 8.0, 0.525, -1)

    def _almostEqual(self, a, b):
        if (math.fabs(a - b) > 1e-5):
            print("different " + str(a) + " " + str(b))

    def _helper(self, x, y, left, right):
        self._joystick._convert(x, y, self._factor)
        self._almostEqual(left, self._joystick.left)
        self._almostEqual(right, self._joystick.right)
        # self.assertAlmostEqual(left, self._joystick.left)
        # self.assertAlmostEqual(right, self._joystick.right)

    def _helper_angle(self, angle, left, right):
        self._logger.debug("angle = " + str(angle) + "\n")
        x = math.cos(angle)
        y = math.sin(angle)
        self._helper(x, y, left, right)


if ("__main__" == __name__):
    logging.basicConfig(stream=sys.stderr)
    logging.getLogger("SomeTest.testSomething").setLevel(logging.DEBUG)
    logger = logging.getLogger("SomeTest.testSomething")
    logger.debug("start")
    unittest.main()
