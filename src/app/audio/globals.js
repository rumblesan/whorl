/* @flow */

AudioParam.prototype.set = function (newValue: any) {
    this.value = newValue;
};

AudioParam.prototype.setNow = function (newValue: any, audioCtx) {
    this.value.setValueAtTime(newValue, audioCtx.currentTime);
};

OscillatorNode.prototype.getWaveParam = function () {
    var self = this;
    return {
        set: function (waveType: string): void {
            self.type = waveType;
        },
        get: function (): string {
            return self.type;
        }
    };
};

BiquadFilterNode.prototype.getFilterTypeParam = function () {
    var self = this;
    return {
        set: function (filterType: string): void {
            self.type = filterType;
        },
        get: function (): void {
            return self.type;
        }
    };
};

module.exports = {
    imported: true
};

