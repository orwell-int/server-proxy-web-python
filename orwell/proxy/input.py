import math


# No test yet
class Joystick(object):
    AMGLE_MIN = 0.0
    ANGLE_MAX = math.pi * 0.5

    def __init__(
            self,
            dead_zone,
            angle=math.pi * 0.25,
            precision=0.05):
        assert(Joystick.ANGLE_MIN < angle < Joystick.ANGLE_MAX)
        self._dead_zone = dead_zone
        self._angle = angle
        self._invert_direction = -1
        self._precision = float(precision)
        self.left = 0
        self.right = 0
        self.fire_weapon1 = False
        self.fire_weapon2 = False

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
        y = axes.get(1, 0.0)
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
        # left button (not arrow)
        self.fire_weapon1 = (buttons.get(4, 0) != 0)
        # left trigger
        self.fire_weapon2 = (buttons.get(6, 0) != 0)
        factor = self._invert_direction * buttons.get(7, 0.0)
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
