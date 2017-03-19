import math
from enum import Enum

XINPUT = "xinput"
T_FLIGHT_HOTAS_X = "T.Flight Hotas X"


class JoystickType(Enum):
    xinput = 1
    t_flight_hots_x = 2

    @staticmethod
    def build(str_value):
        if (XINPUT in str_value):
            return JoystickType.xinput
        else:
            assert(T_FLIGHT_HOTAS_X in str_value)
            return JoystickType.t_flight_hots_x


# No test yet
class Joystick(object):
    ANGLE_MIN = 0.0
    ANGLE_MAX = math.pi * 0.5

    def __init__(
            self,
            dead_zone,
            joystick_type,
            angle=math.pi * 0.25,
            precision=0.025):
        assert(Joystick.ANGLE_MIN < angle < Joystick.ANGLE_MAX)
        self._dead_zone = dead_zone
        self._joystick_type = JoystickType.build(joystick_type)
        self._angle = angle
        self._invert_direction = -1
        self._precision = float(precision)
        self.left = 0
        self.right = 0
        self.fire_weapon1 = False
        self.fire_weapon2 = False
        self.start = False
        self._debug = False

    def _round(self, value):
        new_value = int(value / self._precision) * self._precision
        if (math.fabs(new_value) < self._dead_zone):
            new_value = 0
        return new_value

    def process(self, message):
        buttons = {}
        axes = {}
        for key_value in message.split(";"):
            what, _, value = key_value.partition("=")
            if (what.startswith("a")):
                axis = what[1:]
                axis = int(axis)
                axes[axis] = float(value)
            elif (what.startswith("b")):
                button = what[1:]
                button = int(button)
                buttons[button] = float(value)
        x = -axes.get(0, 0.0)
        # print("x = " + str(x))
        y = axes.get(1, 0.0)
        # print("y = " + str(y))
        if (self._debug):
            if (buttons.get(2, 0) != 0):
                # X
                self._angle -= 0.0001
                print("angle = " + str(self._angle))
            if (buttons.get(1, 0) != 0):
                # B
                self._angle += 0.0001
                print("angle = " + str(self._angle))
            if (buttons.get(3, 0) != 0):
                # Y
                self._toggle_direction()
        if (buttons.get(11, 0) != 0):
            self.start = True
        if (JoystickType.xinput == self._joystick_type):
            # Gamepad
            factor = self._invert_direction * buttons.get(7, 0.0)
            # print("factor = " + str(factor))
            # left button (not arrow)
            self.fire_weapon1 = (buttons.get(4, 0) != 0)
            # left trigger
            self.fire_weapon2 = (buttons.get(6, 0) != 0)
        else:
            # HOTAS
            factor = -self._invert_direction * axes.get(2, 0.0)
            # print("factor = " + str(factor))
            self.fire_weapon1 = (buttons.get(1, 0) != 0)
            self.fire_weapon2 = (buttons.get(0, 0) != 0)
        self._convert(x, y, factor)

    def _toggle_direction(self):
        self._invert_direction = -self._invert_direction

    def _convert(self, x, y, factor):
        cosine = math.cos(self._angle)
        sine = math.sin(self._angle)
        self.left = self._round(factor * (
                x * cosine +
                y * sine))
        self.right = self._round(factor * (
                y * cosine -
                x * sine))
