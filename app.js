(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){

var dsp = {};

var checkConst = function (v) {
    var out;
    switch (typeof v) {
    case 'number':
        out = dsp.Constant(v);
        break;
    case 'string':
        out = dsp.Constant(v);
        break;
    default:
        if (v.type !== undefined) {
            // Assuming v is a DSP Graph
            out = v;
        } else {
            throw Error.create('Invalid value in DSP Graph: ' + v);
        }
    }
    return out;
};

dsp.Constant = function (value) {
    return {
        type: 'CONSTANT',
        value: value
    };
};

dsp.Input = function (name) {
    return {
        type: 'INPUT',
        name: name
    };
};

dsp.Param = function (name, value) {
    return {
        type: 'PARAM',
        name: name,
        value: value
    };
};

dsp.Mix = function (/* args */) {
    return {
        type: 'MIX',
        sources: arguments
    };
};

/* only meant to be used for multiplying params
 * Amp should be used with signals
 */
dsp.Multiply = function (source, factor) {
    return {
        type: 'MULTIPLY',
        source: source,
        factor: factor
    };
};

dsp.AREnvelope = function (attack, decay) {
    return {
        type: 'ARENVELOPE',
        attack: checkConst(attack),
        decay: checkConst(decay)
    };
};

dsp.Oscillator = function (frequency, waveshape) {
    return {
        type: 'OSCILLATOR',
        frequency: checkConst(frequency),
        waveshape: checkConst(waveshape)
    };
};

dsp.Noise = function (noiseType) {
    return {
        type: 'NOISE',
        noiseType: checkConst(noiseType)
    };
};

dsp.Filter = function (source, filterType, frequency, resonance) {
    return {
        type: 'FILTER',
        source: source,
        filterType: checkConst(filterType),
        frequency: checkConst(frequency),
        resonance: checkConst(resonance)
    };
};

dsp.Delay = function (source, delayTime, delayMax, feedback) {
    return {
        type: 'DELAY',
        source: source,
        delayTime: checkConst(delayTime),
        delayMax: checkConst(delayMax),
        feedback: checkConst(feedback)
    };
};

dsp.Compressor = function (source, threshold, ratio, knee, reduction, attack, release) {
    return {
        type: 'COMPRESSOR',
        source: source,
        threshold: checkConst(threshold),
        ratio: checkConst(ratio),
        knee: checkConst(knee),
        reduction: checkConst(reduction),
        attack: checkConst(attack),
        release: checkConst(release)
    };
};

dsp.Amp = function (source, volume) {
    return {
        type: 'AMP',
        source: source,
        volume: checkConst(volume)
    };
};

module.exports = dsp;


},{}],5:[function(require,module,exports){

var dn = require('./dspnode');
var noise = require('./noise');

var DspGraph = {};

var internal = {};

var config = {
    defaultOutputName: 'default'
};

internal.createConstant = function (audioCtx, audioTargetNode, graphAst) {
    audioTargetNode.set(graphAst.value, audioCtx);
    return dn.create();
};

internal.createParam = function (audioCtx, audioTargetNode, graphAst) {

    var name  = graphAst.name;
    var value = graphAst.value;
    audioTargetNode.set(value, audioCtx);

    var node = dn.create();
    var paramObj = {
        set: function (newValue) {
            value = newValue;
            audioTargetNode.set(newValue, audioCtx);
        },
        get: function () {
            return value;
        }
    };

    dn.addParam(node, name, paramObj);

    return node;
};

internal.createInput = function (audioCtx, audioTargetNode, graphAst) {
    var inputName = graphAst.name;

    var node = dn.create();

    var inputObj = {
        connect: function (sourceNode) {
            sourceNode.connect(audioTargetNode);
        },
        get: function () {
            return audioTargetNode;
        }
    };

    dn.addInput(node, inputName, inputObj);

    return node;
};

/* node to sum all inputs together */
internal.createMix = function (audioCtx, audioTargetNode, graphAst) {
    var setFunction = function (value) {
        audioTargetNode.set(value, audioCtx);
    };

    var paramSum    = dn.createSummer(setFunction);
    var outputNodes = [];

    var s, n;
    for (s = 0; s < graphAst.sources; s += 1) {
        n = graphAst.sources[s];
        switch (n.type) {
        case 'CONSTANT':
            paramSum.incrConstant(n.value);
            break;
        case 'PARAM':
            outputNodes.push(
                DspGraph.evaluate(audioCtx, paramSum.createSetNode(n.name), n)
            );
            break;
        default:
            outputNodes.push(
                DspGraph.evaluate(audioCtx, audioTargetNode, n)
            );
            break;
        }
    }

    return dn.merge(outputNodes);
};

/* node to multiply all inputs together */
internal.createMultiply = function (audioCtx, audioTargetNode, graphAst) {

    // TODO Actually make this work

    var factor = graphAst.factor.value;

    var multSet = {
        set: function (value, audioCtx) {
            audioTargetNode.set(factor * value, audioCtx);
        }
    };

    var node = DspGraph.evaluate(
        audioCtx,
        multSet,
        graphAst.source
    );

    return node;
};

// No params for a noise source so return an empty param object
internal.createNoise = function (audioCtx, audioTargetNode, graphAst) {
    var audioNode;
    switch(graphAst.noiseType) {
    case 'white':
        audioNode = noise.createWhite(audioCtx);
        break;
    case 'pink':
        audioNode = noise.createPink(audioCtx);
        break;
    case 'brown':
        audioNode = noise.createBrown(audioCtx);
        break;
    default:
        audioNode = noise.createWhite(audioCtx);
        break;
    }

    var node = dn.create();
    dn.addOutput(node, config.defaultOutputName, audioNode);

    if (audioTargetNode) {
        audioNode.connect(audioTargetNode);
    }

    return node;
};

internal.createOscillator = function (audioCtx, audioTargetNode, graphAst) {
    var oscillator = audioCtx.createOscillator();
    oscillator.start();

    var waveNode = DspGraph.evaluate(
        audioCtx,
        oscillator.getWaveParam(),
        graphAst.waveshape
    );

    var freqNode = DspGraph.evaluate(
        audioCtx,
        oscillator.frequency,
        graphAst.frequency
    );

    var node = dn.merge([waveNode, freqNode]);
    dn.addOutput(node, config.defaultOutputName, oscillator);

    if (audioTargetNode) {
        oscillator.connect(audioTargetNode);
    }

    return node;
};

internal.createEnvelope = function (audioCtx, audioTargetNode, graphAst) {

    var attackAudioParam = dn.createParamNode();
    var decayAudioParam = dn.createParamNode();

    var attackNode = DspGraph.evaluate(
        audioCtx,
        attackAudioParam,
        graphAst.attack
    );

    var decayNode = DspGraph.evaluate(
        audioCtx,
        decayAudioParam,
        graphAst.decay
    );

    var play = function (length) {
        var t = audioCtx.currentTime + attackAudioParam.value;
        audioTargetNode.linearRampToValueAtTime(
            1.0, t
        );
        audioTargetNode.linearRampToValueAtTime(
            1.0, (t + length)
        );
        audioTargetNode.linearRampToValueAtTime(
            0.0, (t + length + attackAudioParam.value)
        );
    };
    var start = function () {
        var t = audioCtx.currentTime + decayAudioParam.value;
        audioTargetNode.linearRampToValueAtTime(
            1.0, t
        );
    };
    var stop = function () {
        var t = audioCtx.currentTime + decayAudioParam.value;
        audioTargetNode.linearRampToValueAtTime(
            0.0, t
        );
    };

    var envelopeNode = dn.create();
    dn.addEnvelope(envelopeNode, 'start', start);
    dn.addEnvelope(envelopeNode, 'stop', stop);
    dn.addEnvelope(envelopeNode, 'play', play);

    return dn.merge([attackNode, decayNode, envelopeNode]);
};

internal.createFilter = function (audioCtx, audioTargetNode, graphAst) {
    var filter = audioCtx.createBiquadFilter();

    var sourceNode = DspGraph.evaluate(
        audioCtx,
        filter,
        graphAst.source
    );

    var filterTypeNode = DspGraph.evaluate(
        audioCtx,
        filter.getFilterTypeParam(),
        graphAst.filterType
    );

    var freqNode = DspGraph.evaluate(
        audioCtx,
        filter.frequency,
        graphAst.frequency
    );

    var resonanceNode = DspGraph.evaluate(
        audioCtx,
        filter.Q,
        graphAst.resonance
    );

    var node =  dn.merge([sourceNode, filterTypeNode, freqNode, resonanceNode]);
    dn.addOutput(node, config.defaultOutputName, filter);

    if (audioTargetNode) {
        filter.connect(audioTargetNode);
    }

    return node;
};

internal.createAmp = function (audioCtx, audioTargetNode, graphAst) {
    var amp = audioCtx.createGain();
    amp.gain.value = 0;

    var sourceNode = DspGraph.evaluate(
        audioCtx,
        amp,
        graphAst.source
    );

    var volumeNode = DspGraph.evaluate(
        audioCtx,
        amp.gain,
        graphAst.volume
    );

    var node =  dn.merge([sourceNode, volumeNode]);
    dn.addOutput(node, config.defaultOutputName, amp);

    if (audioTargetNode) {
        amp.connect(audioTargetNode);
    }

    return node;
};

internal.createCompressor = function (audioCtx, audioTargetNode, graphAst) {
    var comp = audioCtx.createDynamicsCompressor();

    var sourceNode = DspGraph.evaluate(
        audioCtx,
        comp,
        graphAst.source
    );

    var thresholdNode = DspGraph.evaluate(audioCtx, comp.threshold, graphAst.threshold);
    var ratioNode     = DspGraph.evaluate(audioCtx, comp.ratio,     graphAst.ratio);
    var kneeNode      = DspGraph.evaluate(audioCtx, comp.knee,      graphAst.knee);
    var reductionNode = DspGraph.evaluate(audioCtx, comp.reduction, graphAst.reduction);
    var attackNode    = DspGraph.evaluate(audioCtx, comp.attack,    graphAst.attack);
    var releaseNode   = DspGraph.evaluate(audioCtx, comp.release,   graphAst.release);

    var node = dn.merge([
        sourceNode, thresholdNode, ratioNode, kneeNode, reductionNode, attackNode, releaseNode
    ]);
    dn.addOutput(node, config.defaultOutputName, comp);

    if (audioTargetNode) {
        comp.connect(audioTargetNode);
    }

    return node;
};

internal.createDelay = function (audioCtx, audioTargetNode, graphAst) {
    var feedbackAmp = audioCtx.createGain();
    var mainAmp = audioCtx.createGain();
    var delayNode = audioCtx.createDelay(graphAst.delayMax.value);

    mainAmp.gain.value = 1;

    var sourceNode = DspGraph.evaluate(
        audioCtx,
        mainAmp,
        graphAst.source
    );

    var delayTimeNode = DspGraph.evaluate(
        audioCtx,
        delayNode.delayTime,
        graphAst.delayTime
    );

    var feedbackNode = DspGraph.evaluate(
        audioCtx,
        feedbackAmp.gain,
        graphAst.feedback
    );

    mainAmp.connect(delayNode);
    delayNode.connect(feedbackAmp);
    feedbackAmp.connect(mainAmp);

    var node = dn.merge([sourceNode, delayTimeNode, feedbackNode]);
    dn.addOutput(node, config.defaultOutputName, mainAmp);

    if (audioTargetNode) {
        mainAmp.connect(audioTargetNode);
    }

    return node;
};

DspGraph.evaluate = function(audioCtx, audioTargetNode, graphAst) {
    var result;
    switch (graphAst.type) {
    case 'CONSTANT':
        result = internal.createConstant(audioCtx, audioTargetNode, graphAst);
        break;
    case 'PARAM':
        result = internal.createParam(audioCtx, audioTargetNode, graphAst);
        break;
    case 'INPUT':
        result = internal.createInput(audioCtx, audioTargetNode, graphAst);
        break;
    case 'MIX':
        result = internal.createMix(audioCtx, audioTargetNode, graphAst);
        break;
    case 'MULTIPLY':
        result = internal.createMultiply(audioCtx, audioTargetNode, graphAst);
        break;
    case 'ARENVELOPE':
        result = internal.createEnvelope(audioCtx, audioTargetNode, graphAst);
        break;
    case 'OSCILLATOR':
        result = internal.createOscillator(audioCtx, audioTargetNode, graphAst);
        break;
    case 'NOISE':
        result = internal.createNoise(audioCtx, audioTargetNode, graphAst);
        break;
    case 'FILTER':
        result = internal.createFilter(audioCtx, audioTargetNode, graphAst);
        break;
    case 'AMP':
        result = internal.createAmp(audioCtx, audioTargetNode, graphAst);
        break;
    case 'COMPRESSOR':
        result = internal.createCompressor(audioCtx, audioTargetNode, graphAst);
        break;
    case 'DELAY':
        result = internal.createDelay(audioCtx, audioTargetNode, graphAst);
        break;
    default:
        throw new Error('Unknown DSP graph type: ' + graphAst.type);
    }
    return result;
};


module.exports = DspGraph;


},{"./dspnode":6,"./noise":11}],6:[function(require,module,exports){

var util = require('./util');

var DSPNode = {};

/**
 * {
 *   params: {
 *     freq: [
 *       {
 *         set: function (value),
 *         get: function ()
 *       }
 *     ],
 *     volume: [
 *       {
 *         set: function (value),
 *         get: function ()
 *       }
 *     ]
 *   },
 *
 *   envelopes: {
 *     start: [ function (), ...],
 *     stop: [ function (), ...],
 *     play: [ function (), ...]
 *   },
 *
 *   inputs: {
 *     fxinput: [
 *       {
 *         connect: function (sourceNode),
 *         get: function ()
 *       }
 *     ]
 *   },
 *
 *   outputs: {
 *     l: AudioNode,
 *     r: AudioNode
 *   }
 * }
 */
DSPNode.create = function () {
    var dn = {};
    dn.params = {};

    dn.envelopes = {};

    dn.inputs = {};

    dn.outputs = {};

    return dn;
};

DSPNode.addParam = function (node, name, paramObj) {
    if (node.params[name] === undefined) {
        node.params[name] = [];
    }
    node.params[name].push(paramObj);
};

DSPNode.addEnvelope = function (node, name, envelopeFunc) {
    if (node.envelopes[name] === undefined) {
        node.envelopes[name] = [];
    }
    node.envelopes[name].push(envelopeFunc);
};

DSPNode.addInput = function (node, name, inputObj) {
    if (node.inputs[name] === undefined) {
        node.inputs[name] = [];
    }
    node.inputs[name].push(inputObj);
};

DSPNode.addOutput = function (node, name, outputObj) {
    if (node.outputs[name] === undefined) {
        node.outputs[name] = [];
    }
    node.outputs[name].push(outputObj);
};

/**
 * Merges parameters and inputs, but leaves outputs empty
 */
DSPNode.merge = function (nodes) {
    var dspnode = DSPNode.create();

    var mergeParams = function (paramName, paramObjs) {
        if (dspnode.params[paramName] === undefined) {
            dspnode.params[paramName] = [];
        }
        util.mapArray(paramObjs, function (f) {
            dspnode.params[paramName].push(f);
        });
    };

    var mergeInputs = function (inputName, inputObjs) {
        if (dspnode.inputs[inputName] === undefined) {
            dspnode.inputs[inputName] = [];
        }
        util.mapArray(inputObjs, function (i) {
            dspnode.inputs[inputName].push(i);
        });
    };

    var mergeEnvelopes = function (envelopeName, envelopeFunctions) {
        if (dspnode.envelopes[envelopeName] === undefined) {
            dspnode.envelopes[envelopeName] = [];
        }
        util.mapArray(envelopeFunctions, function (f) {
            dspnode.envelopes[envelopeName].push(f);
        });
    };

    util.mapArray(nodes, function (n) {
        util.mapObject(n.params, mergeParams);
        util.mapObject(n.inputs, mergeInputs);
        util.mapObject(n.envelopes, mergeEnvelopes);
    });

    return dspnode;
};

DSPNode.createSummer = function (setFunction) {
    var summer = {};

    summer.constant = 0;
    summer.values = {};

    summer.setTarget = function () {
        var value = util.foldObject(summer.values, summer.constant, function (c, n, v) {
            return c + v;
        });
        setFunction(value);
    };

    summer.incrConstant = function (constantValue) {
        summer.constant += constantValue;
    };

    summer.createSetNode = function (name) {
        if (summer.values[name] === undefined) {
            summer.values[name] = 0;
        }
        var setnode = {
            set: function (value) {
                summer.values[name] = value;
                summer.setTarget();
            }
        };
        return setnode;
    };

    return summer;
};

DSPNode.createParamNode = function () {
    var node = {
        value: 0
    };
    node.set = function (newValue) {
        node.value = newValue;
    };
    node.get = function () {
        return node.value;
    };
    return node;
};

module.exports = DSPNode;


},{"./util":13}],7:[function(require,module,exports){

var DspGraph = require('./dspGraph');

var Effects = {};

/**
 * returns
 *     FXChain: {
 *       params: [paramNames, ...],
 *       paramName1: [setFunctions, ...]
 *     }
 **/

Effects.createChain = function (audioCtx, dspAst) {
    var destinationNode = null;
    return DspGraph.evaluate(
        audioCtx,
        destinationNode,
        dspAst
    );
};

module.exports = Effects;


},{"./dspGraph":5}],8:[function(require,module,exports){
/*global AudioParam, OscillatorNode, BiquadFilterNode */

if (window || window.AudioContext || window.webkitAudioContext) {

    AudioParam.prototype.set = function (newValue, audioCtx) {
        if (this.setValueAtTime) {
            this.setValueAtTime(newValue, audioCtx.currentTime);
        } else {
            this.value = newValue;
        }
    };

    OscillatorNode.prototype.getWaveParam = function () {
        var self = this;
        return {
            set: function (waveType) {
                self.type = waveType;
            },
            get: function () {
                return self.type;
            }
        };
    };

    BiquadFilterNode.prototype.getFilterTypeParam = function () {
        var self = this;
        return {
            set: function (filterType) {
                self.type = filterType;
            },
            get: function () {
                return self.type;
            }
        };
    };

}

module.exports = {
    imported: true
};


},{}],9:[function(require,module,exports){

var Helpers = {};

Helpers.dbToNum = function (dbValue) {
    return Math.pow(10, (dbValue/10));
};

module.exports = Helpers;


},{}],10:[function(require,module,exports){
/*jslint browser: true */

require('./globals');

var graphAST = require('./dspAst');
var Synth = require('./synth');
var Effects = require('./effects');
var Helpers = require('./helpers');
var util = require('./util');

var Thicket = {};

Thicket.AST = graphAST;

Thicket.helpers = Helpers;

Thicket.createContext = function () {
    var context;
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    context = new window.AudioContext();
    return context;
};

Thicket.createSystem = function (audioCtx) {
    var AudioSystem = {};

    AudioSystem.Synth = {};
    AudioSystem.Effects = {};

    AudioSystem.Synth.create = function (dspAst, destination) {
        return Synth.create(audioCtx, dspAst, destination);
    };

    AudioSystem.Effects.create = function (dspAst, destination) {
        return Effects.createChain(audioCtx, dspAst, destination);
    };

    /**
     * synth
     * paramName
     * value
     */
    AudioSystem.Synth.setParam = Synth.setParam;

    /**
     * synth
     * paramName
     */
    AudioSystem.Synth.getParam = Synth.getParam;

    /**
     * synth
     * parameterList
     */
    AudioSystem.Synth.start = Synth.start;

    /**
     * synth
     */
    AudioSystem.Synth.stop = Synth.stop;

    /**
     * synth
     * length
     * parameterList
     */
    AudioSystem.Synth.play = Synth.play;

    /**
     * synth
     * inputName
     */
    AudioSystem.Synth.getInputs = Synth.getInputs;

    /**
     * synth
     * inputName
     * sourceSynth
     * sourceOutputName
     */
    AudioSystem.Synth.connectSynthToInputs = Synth.connectSynthToInputs;

    /**
     * synth
     * inputName
     * sourceNode
     */
    AudioSystem.Synth.connectToInputs = Synth.connectToInputs;

    /**
     * sourceSynth
     * sourceOutputsName
     */
    AudioSystem.Synth.connectToMasterOut = function (sourceSynth, sourceOutputsName) {
        var dest = audioCtx.destination;
        var outputs = Synth.getOutputs(sourceSynth, sourceOutputsName);
        util.mapArray(outputs, function (o) {
            o.connect(dest);
        });
    };

    /**
     * synth
     * outputName
     */
    AudioSystem.Synth.getOutputs = Synth.getOutputs;

    AudioSystem.out = [audioCtx.destination];

    return AudioSystem;
};

module.exports = Thicket;

},{"./dspAst":4,"./effects":7,"./globals":8,"./helpers":9,"./synth":12,"./util":13}],11:[function(require,module,exports){

/*
 * Plenty of help for this from
 * http://noisehack.com/generate-noise-web-audio-api/
 */

var noise = {};

noise.createWhite = function (audioCtx) {

    var bufferSize  = 2 * audioCtx.sampleRate,
        noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate),
        output      = noiseBuffer.getChannelData(0),
        i;

    for (i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    var whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.start(0);

    return whiteNoise;
};

noise.createPink = function (audioCtx) {
    // TODO make this actually white noise
    var white = noise.createWhite(audioCtx);
    return white;
};

noise.createBrown = function (audioCtx) {
    var white = noise.createWhite(audioCtx);
    var filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value.set(100, audioCtx);
    white.connect(filter);
    return filter;
};

module.exports = noise;


},{}],12:[function(require,module,exports){

var DspGraph = require('./dspGraph');
var util = require('./util');

var Synth = {};


Synth.create = function (audioCtx, dspAst) {
    var destinationNode = null;
    return DspGraph.evaluate(
        audioCtx,
        destinationNode,
        dspAst
    );
};

Synth.setParam = function (synth, paramName, value) {
    if (synth.params[paramName] === undefined) {
        throw new Error('Synth does not have ' + paramName + ' parameter');
    } else {
        util.mapArray(synth.params[paramName], function (p) {
            p.set(value);
        });
    }
};

Synth.getParam = function (synth, paramName) {
    var output = [];
    if (synth.params[paramName] === undefined) {
        throw new Error('Synth does not have ' + paramName + ' parameter');
    } else {
        output = util.mapArray(synth.params[paramName], function (p) {
            return p.get();
        });
    }
    return output;
};

Synth.start = function (synth, parameterList) {
    var plist = parameterList || [];
    var i;
    var paramName, paramValue;
    if (synth.envelopes.start === undefined) {
        throw new Error('Synth does not have start parameter');
    } else {
        for (i = 0; i < plist.length; i += 2) {
            paramName  = plist[i];
            paramValue = plist[i+1];
            Synth.setParam(synth, paramName, paramValue);
        }
        util.mapArray(synth.envelopes.start, function (e) {
            e();
        });
    }
};

Synth.stop = function (synth) {
    if (synth.envelopes.stop === undefined) {
        throw new Error('Synth does not have stop parameter');
    } else {
        util.mapArray(synth.envelopes.stop, function (e) {
            e();
        });
    }
};

Synth.play = function (synth, length, parameterList) {
    var plist = parameterList || [];
    var i;
    var paramName, paramValue;
    if (synth.envelopes.play === undefined) {
        throw new Error('Synth does not have play parameter');
    } else {
        for (i = 0; i < plist.length; i += 2) {
            paramName  = plist[i];
            paramValue = plist[i+1];
            Synth.setParam(synth, paramName, paramValue);
        }
        util.mapArray(synth.envelopes.play, function (e) {
            e(length);
        });
    }
};

Synth.getInputs = function (synth, inputName) {
    var inputs = [];
    if (synth.inputs[inputName] === undefined) {
        throw new Error('Synth does not have ' + inputName + ' input');
    } else {
        inputs = util.mapArray(synth.inputs[inputName], function (i) {
            return i.get();
        });
    }
    return inputs;
};

Synth.connectSynthToInputs = function (synth, inputName, sourceSynth, sourceOutputsName) {
    if (synth.inputs[inputName] === undefined) {
        throw new Error('Synth does not have ' + inputName + ' input');
    }
    var outputs = Synth.getOutputs(sourceSynth, sourceOutputsName);
    util.mapArray(synth.inputs[inputName], function (i) {
        util.mapArray(outputs, function (o) {
            i.connect(o);
        });
    });
};

Synth.connectToInputs = function (synth, inputName, sourceNodes) {
    if (synth.inputs[inputName] === undefined) {
        throw new Error('Synth does not have ' + inputName + ' input');
    }
    util.mapArray(synth.inputs[inputName], function (i) {
        util.mapArray(sourceNodes, function (o) {
            i.connect(o);
        });
    });
};

Synth.getOutputs = function (synth, outputsName) {
    var outputs = [];
    if (synth.outputs[outputsName] === undefined) {
        throw new Error('Synth does not have ' + outputsName + ' input');
    } else {
        outputs = synth.outputs[outputsName];
    }
    return outputs;
};


module.exports = Synth;


},{"./dspGraph":5,"./util":13}],13:[function(require,module,exports){

var util = {};

/**
 * obj:     Object
 * mapFunc: function (string, <V>): <T>
 * return:  Array<T>
 */
util.mapObject = function (obj, mapFunc) {
    var out = [];
    var key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            out.push(mapFunc(key, obj[key]));
        }
    }
    return out;
};

/**
 * obj:      Object
 * initial:  <T>
 * foldFunc: function (<T>, string, <V>): <T>
 * return:   <T>
 */
util.foldObject = function (obj, initial, foldFunc) {
    var out = initial;
    var key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            out = foldFunc(out, key, obj[key]);
        }
    }
    return out;
};

/**
 * obj:    Object
 * return: Array<String>
 */
util.getObjectKeys = function (obj) {
    var keys = [];
    util.mapObject(obj, function (k) {
        keys.push(k);
    });
    return keys;
};

/**
 * arr:     Array<A>
 * mapFunc: function (<A>): <B>
 * return:  Array<B>
 */
util.mapArray = function (arr, mapFunc) {
    var out = [];
    var i;
    for (i = 0; i < arr.length; i += 1) {
        out.push(mapFunc(arr[i]));
    }
    return out;
};

/**
 * arr:      Array<A>
 * initial:  <B>
 * foldFunc: function (<B>, <A>): <B>
 * return:   <B>
 */
util.foldArray = function (arr, initial, foldFunc) {
    var out = initial;
    var i;
    for (i = 0; i < arr.length; i += 1) {
        out = foldFunc(out, arr[i]);
    }
    return out;
};

module.exports = util;


},{}],14:[function(require,module,exports){
"use strict";

module.exports = {

    LetDefinition: function LetDefinition(name, expression) {
        return {
            type: "LETDEFINITION",
            name: name,
            expression: expression
        };
    },

    FunctionDefinition: function FunctionDefinition(name, args, body) {
        return {
            type: "FUNCTIONDEFINITION",
            name: name,
            args: args,
            body: body
        };
    },

    Body: function Body(definitions, expressions) {
        return {
            type: "BODY",
            definitions: definitions,
            expressions: expressions
        };
    },

    Variable: function Variable(name) {
        return {
            type: "VARIABLE",
            name: name
        };
    },

    Lambda: function Lambda(argNames, body) {
        return {
            type: "LAMBDA",
            argNames: argNames,
            body: body
        };
    },

    If: function If(predicate, expression) {
        return {
            type: "IF",
            predicate: predicate,
            expression: expression
        };
    },

    IfElse: function IfElse(predicate, trueExpression, falseExpression) {
        return {
            type: "IFELSE",
            predicate: predicate,
            trueExpression: trueExpression,
            falseExpression: falseExpression
        };
    },

    Application: function Application(target, args) {
        return {
            type: "APPLICATION",
            target: target,
            args: args
        };
    },

    Bool: function Bool(value) {
        return {
            type: "BOOLEAN",
            value: value
        };
    },

    Num: function Num(value) {
        return {
            type: "NUMBER",
            value: value
        };
    },

    Str: function Str(value) {
        return {
            type: "STRING",
            value: value
        };
    },

    Symbol: function Symbol(value) {
        return {
            type: "SYMBOL",
            value: value
        };
    },

    Note: function Note(note, octave) {
        return {
            type: "NOTE",
            value: note + " in octave " + octave,
            note: note,
            octave: octave
        };
    },

    Beat: function Beat(value) {
        return {
            type: "BEAT",
            value: value
        };
    },

    List: function List(values) {
        return {
            type: "LIST",
            values: values
        };
    },

    Map: function Map(entries) {
        return {
            type: "MAP",
            entries: entries
        };
    },

    MapPair: function MapPair(key, value) {
        return {
            type: "MAPPAIR",
            key: key,
            value: value
        };
    },

    /* Applications
     * Not created by parser but by interpreter
     **/
    Func: function Func(argNames, body) {
        return {
            type: "FUNCTION",
            argNames: argNames,
            body: body
        };
    },

    BuiltIn: function BuiltIn(func) {
        return {
            type: "BUILTIN",
            func: func
        };
    },

    Closure: function Closure(argNames, body, scope) {
        return {
            type: "CLOSURE",
            argNames: argNames,
            body: body,
            scope: scope
        };
    }

};

},{}],15:[function(require,module,exports){
'use strict';

var Thicket = require('thicket');

var Audio = {};

Audio.helpers = Thicket.helpers;

Audio.AST = Thicket.AST;

Audio.createContext = Thicket.createContext;

Audio.createSystem = function (audioCtx) {

    var thicket = Thicket.createSystem(audioCtx);

    var system = {};

    system.Synth = thicket.Synth;

    var masterOut = Audio.AST.Amp(Audio.AST.Compressor(Audio.AST.Amp(Audio.AST.Input('master'), 0.4), -50, 3, -20, -20, 0, 0.3), Audio.AST.Param('mastervolume', 0.5));

    system.masterOut = thicket.Effects.create(masterOut);
    thicket.Synth.connectToMasterOut(system.masterOut, 'default');

    return system;
};

module.exports = Audio;

},{"thicket":10}],16:[function(require,module,exports){
'use strict';

var StdLib = require('./stdlib');
var ScopeHandler = require('./scopeHandler');
var Interpreter = require('./interpreter');
var Error = require('./error');

var AudioSystem = require('./audio');

var Parser = require('./parser').create();

var createCore = function createCore(audioContext, dispatcher) {

    var Core = {};

    var audio = AudioSystem.createSystem(audioContext);
    var scopeHandler = ScopeHandler.create();
    var interpreter = Interpreter.create(scopeHandler);
    var globalScope = scopeHandler.createScope();

    StdLib.add(audio, dispatcher, scopeHandler, globalScope);

    Core.handleCode = function (code) {
        var ast;
        try {
            ast = Parser.parse(code);
            interpreter.evaluate(globalScope, ast);
        } catch (err) {
            if (err.internal === true) {
                Core.displayError(err);
            } else {
                throw err;
            }
        }
    };

    Core.scheduleCallback = function (time, closure) {
        setTimeout(function () {
            try {
                interpreter.apply(globalScope, closure, []);
            } catch (err) {
                if (err.internal === true) {
                    Core.displayError(err);
                } else {
                    throw err;
                }
            }
        }, time);
    };

    Core.displayError = function (err) {
        console.log(err);
        var errLines;
        if (typeof err.message === 'string') {
            errLines = [err.message];
        } else {
            errLines = err.message;
        }
        dispatcher.dispatch('term-error', errLines.join("\n"));
    };

    dispatcher.register('execute-code', function (code) {
        Core.handleCode(code);
    });

    dispatcher.register('schedule-callback', function (time, closure) {
        Core.scheduleCallback(time, closure);
    });

    return Core;
};

module.exports = {
    create: createCore
};

},{"./audio":15,"./error":18,"./interpreter":19,"./parser":21,"./scopeHandler":22,"./stdlib":25}],17:[function(require,module,exports){
'use strict';

var CodeMirror = require('../codemirror/lib/codemirror');
require('../codemirror/keymap/vim');
require('../codemirror/mode/scheme/scheme');

var createEditor = function createEditor(editorEl, dispatcher) {

    CodeMirror.Vim.defineAction('execute', function (cm, args, vim) {
        var code = cm.doc.getSelection();
        dispatcher.dispatch('execute-code', code);
    });

    // unwrap from jquery
    var editor = CodeMirror(editorEl[0], {
        mode: 'scheme'
    });

    editor.setOption("extraKeys", {
        "Ctrl-G": function CtrlG(cm) {
            var code = cm.doc.getSelection();
            dispatcher.dispatch('execute-code', code);
        }
    });

    dispatcher.register('load-program', function (programName, programData) {
        editor.doc.setValue(programData);
    });

    dispatcher.register('set-key-binding', function (bindingName) {
        editor.setOption('keymap', bindingName);
        if (bindingName === 'vim') {
            editor.setOption('vimMode', true);
        } else {
            editor.setOption('vimMode', false);
        }
    });

    return editor;
};

module.exports = {
    create: createEditor
};

},{"../codemirror/keymap/vim":35,"../codemirror/lib/codemirror":36,"../codemirror/mode/scheme/scheme":37}],18:[function(require,module,exports){
'use strict';

var createError = function createError(lines) {

    var InternalError = {
        internal: true,
        message: []
    };

    if (typeof lines === 'string') {
        InternalError.message = [lines];
    } else {
        InternalError.message = lines;
    }

    return InternalError;
};

module.exports = {
    create: createError
};

},{}],19:[function(require,module,exports){
'use strict';

var Error = require('./error');
var Ast = require('./ast');

var createInterpreter = function createInterpreter(ScopeHandler) {

    var Interpreter = {};
    var internal = {};

    // scope is a dictionary, stored in and passed in by the Core
    Interpreter.evaluate = function (scope, ast) {
        internal.evaluateBlock(scope, ast);
    };

    Interpreter.apply = function (scope, closure, args) {
        internal.handleApplication(scope, closure, args);
    };

    internal.evaluateBlock = function (scope, ast) {
        var i,
            r,
            expr,
            results = [];
        for (i = 0; i < ast.length; i += 1) {
            expr = ast[i];
            r = internal.evaluateExpression(scope, expr);
            results.push(r);
        }
        return results;
    };

    internal.evaluateExpression = function (scope, astExpr) {

        var output;

        switch (astExpr.type) {
            case "LETDEFINITION":
                output = internal.handleLetDefinition(scope, astExpr);
                break;
            case "FUNCTIONDEFINITION":
                output = internal.handleFunctionDefinition(scope, astExpr);
                break;
            case "BODY":
                output = internal.handleBody(scope, astExpr);
                break;
            case "VARIABLE":
                output = internal.handleVariable(scope, astExpr);
                break;
            case "LAMBDA":
                output = internal.handleLambda(scope, astExpr);
                break;
            case "IF":
                output = internal.handleIf(scope, astExpr);
                break;
            case "IFELSE":
                output = internal.handleIfElse(scope, astExpr);
                break;
            case "APPLICATION":
                output = internal.handleApplicationExpression(scope, astExpr);
                break;
            case "BOOLEAN":
                output = astExpr.value;
                break;
            case "NUMBER":
                output = astExpr.value;
                break;
            case "STRING":
                output = astExpr.value;
                break;
            case "SYMBOL":
                output = astExpr.value;
                break;
            case "NOTE":
                output = astExpr.value;
                break;
            case "BEAT":
                output = astExpr.value;
                break;
            case "LIST":
                output = internal.handleList(scope, astExpr);
                break;
            case "MAP":
                output = internal.handleMap(scope, astExpr);
                break;
            case "MAPPAIR":
                output = internal.handleMapPair(scope, astExpr);
                break;
            default:
                throw Error.create("AST Expression not valid: " + astExpr.type);
        }
        return output;
    };

    internal.handleLetDefinition = function (scope, define) {
        var defName = define.name;
        var defValue = internal.evaluateExpression(scope, define.expression);

        ScopeHandler.set(scope, defName, defValue);
        return defValue;
    };

    internal.handleFunctionDefinition = function (scope, defineFunction) {
        var functionName = defineFunction.name;
        var functionArgNames = defineFunction.args;
        var functionBody = defineFunction.body;
        var functionValue = Ast.Func(functionArgNames, functionBody);

        ScopeHandler.set(scope, functionName, functionValue);
        return functionValue;
    };

    internal.handleBody = function (scope, body) {
        internal.evaluateBlock(scope, body.definitions);
        return internal.evaluateBlock(scope, body.expressions);
    };

    internal.handleVariable = function (scope, variable) {
        return ScopeHandler.get(scope, variable.name);
    };

    internal.handleLambda = function (scope, lambda) {
        return Ast.Closure(lambda.argNames, lambda.body, scope);
    };

    internal.handleIf = function (scope, ifNode) {
        var predicate = internal.evaluateExpression(scope, ifNode.predicate);
        var value;
        if (predicate === true || predicate !== 0) {
            value = internal.evaluateBlock(scope, ifNode.expression);
        } else {
            value = false;
        }
        return value;
    };

    internal.handleIfElse = function (scope, ifElse) {
        var predicate = internal.evaluateExpression(scope, ifElse.predicate);
        var value;
        if (predicate === true || predicate !== 0) {
            value = internal.evaluateBlock(scope, ifElse.trueExpression);
        } else {
            value = internal.evaluateBlock(scope, ifElse.falseExpression);
        }
        return value;
    };

    internal.handleApplicationExpression = function (scope, application) {
        var target = internal.evaluateExpression(scope, application.target);
        var applicationArgs = application.args;

        var evaluatedArgs = [];
        var i;
        for (i = 0; i < applicationArgs.length; i += 1) {
            evaluatedArgs.push(internal.evaluateExpression(scope, applicationArgs[i]));
        }

        return internal.handleApplication(scope, target, evaluatedArgs);
    };

    internal.handleApplication = function (scope, applicationData, evaluatedArgs) {
        var result;
        switch (applicationData.type) {
            case "FUNCTION":
                result = internal.handleFunction(scope, applicationData, evaluatedArgs);
                break;
            case "BUILTIN":
                result = internal.handleBuiltIn(scope, applicationData, evaluatedArgs);
                break;
            case "CLOSURE":
                result = internal.handleFunction(applicationData.scope, applicationData, evaluatedArgs);
                break;
            default:
                throw Error.create("Application type not valid: " + applicationData.type);
        }
        return result;
    };

    internal.handleFunction = function (scope, func, functionArgs) {
        var functionArgNames = func.argNames;
        var functionBody = func.body;

        if (functionArgs.length !== functionArgNames.length) {
            throw Error.create("Incorrect argument number");
        }

        var childScope = ScopeHandler.createChildScope(scope);
        var i;
        for (i = 0; i < functionArgNames.length; i += 1) {
            ScopeHandler.set(childScope, functionArgNames[i], functionArgs[i]);
        }

        return internal.evaluateExpression(childScope, functionBody);
    };

    internal.handleBuiltIn = function (scope, builtIn, functionArgs) {
        var func = builtIn.func;

        if (functionArgs.length !== func.length) {
            throw Error.create("Incorrect argument number");
        }

        var childScope = ScopeHandler.createChildScope(scope);
        // function args have already been evaluated
        return func.apply(childScope, functionArgs);
    };

    internal.handleList = function (scope, list) {
        var i,
            r,
            listExpressions = list.values,
            results = [];
        for (i = 0; i < listExpressions.length; i += 1) {
            r = internal.evaluateExpression(scope, listExpressions[i]);
            results.push(r);
        }
        return results;
    };

    internal.handleMap = function (scope, map) {
        var i,
            e,
            entries = map.entries,
            result = {};
        for (i = 0; i < entries.length; i += 1) {
            e = internal.evaluateExpression(entries[i]);
            result[e.key] = e.value;
        }
        return result;
    };

    internal.handleMapPair = function (scope, pair) {
        var k, v;
        k = internal.evaluateExpression(scope, pair.key);
        v = internal.evaluateExpression(scope, pair.value);
        return { key: k, value: v };
    };

    return Interpreter;
};

module.exports = {
    create: createInterpreter
};

},{"./ast":14,"./error":18}],20:[function(require,module,exports){
'use strict';

var Demos = require('../generated/demos');
var Tutorials = require('../generated/tutorials');
var $ = require('../lib/jquery-2.1.3');

var NavBar = {};

NavBar.createBindingsMenu = function (dispatcher) {

    var keylist = $('#keybindings');
    keylist.append('<li><a data-binding="default">Default</a></li>');
    keylist.append('<li><a data-binding="vim">Vim</a></li>');

    keylist.find('a').click(function (e) {
        var bindingName = $(this).data('binding');
        dispatcher.dispatch('set-key-binding', bindingName);
    });
};

NavBar.createTutorialMenu = function (dispatcher) {

    var tutlist = $('#tutoriallist');
    var name;
    var listel;
    var t;
    for (t = 0; t < Tutorials.names.length; t += 1) {
        name = Tutorials.names[t];
        listel = $('<li><a data-prog="' + name + '">' + name + '</a></li>');
        tutlist.append(listel);
    }
    tutlist.find('a').click(function (e) {
        var programName = $(this).data('prog');
        var programData = Tutorials.data[programName];
        dispatcher.dispatch('load-program', programName, programData);
        dispatcher.dispatch('term-message', 'Loading tutorial: ' + programName);
    });
};

NavBar.createDemoMenu = function (dispatcher) {

    var demolist = $('#demolist');
    var name;
    var listel;
    var d;
    for (d = 0; d < Demos.names.length; d += 1) {
        name = Demos.names[d];
        listel = $('<li><a data-prog="' + name + '">' + name + '</a></li>');
        demolist.append(listel);
    }
    demolist.find('a').click(function (e) {
        var programName = $(this).data('prog');
        var programData = Demos.data[programName];
        dispatcher.dispatch('load-program', programName, programData);
        dispatcher.dispatch('term-message', 'Loading demo: ' + programName);
    });
};

NavBar.create = function (dispatcher) {
    NavBar.createTutorialMenu(dispatcher);
    NavBar.createDemoMenu(dispatcher);
    NavBar.createBindingsMenu(dispatcher);
};

module.exports = NavBar;

},{"../generated/demos":38,"../generated/tutorials":40,"../lib/jquery-2.1.3":41}],21:[function(require,module,exports){
'use strict';

var JisonParser = require('../generated/jison-parser').parser;
var Error = require('./error');

var createParser = function createParser() {

    var Parser = {};

    JisonParser.yy.parseError = function (message, details) {
        throw Error.create(message.split("\n"));
    };

    // Can raise an exception
    Parser.parse = function (code) {
        return JisonParser.parse(code);
    };

    return Parser;
};

module.exports = {
    create: createParser
};

},{"../generated/jison-parser":39,"./error":18}],22:[function(require,module,exports){
'use strict';

var Error = require('./error');
var Ast = require('./ast');

var createScopeHandler = function createScopeHandler() {

    var ScopeHandler = {};

    ScopeHandler.createScope = function () {
        return {};
    };

    ScopeHandler.createChildScope = function (parentScope) {
        return Object.create(parentScope);
    };

    ScopeHandler.set = function (scope, name, value) {
        scope[name] = value;
    };

    ScopeHandler.get = function (scope, name) {
        var v = scope[name];
        if (v === undefined) {
            throw Error.create("No variable with that name: " + name);
        } else {
            return v;
        }
    };

    ScopeHandler.addFF = function (scope, name, func) {
        scope[name] = Ast.BuiltIn(func);
    };

    return ScopeHandler;
};

module.exports = {
    create: createScopeHandler
};

},{"./ast":14,"./error":18}],23:[function(require,module,exports){
'use strict';

var Audio = require('../audio');

module.exports = {

    add: function add(audio, dispatcher, ScopeHandler, scope) {

        ScopeHandler.addFF(scope, 'input', function (name) {
            return Audio.AST.Input(name);
        });

        ScopeHandler.addFF(scope, 'param', function (name, defaultValue) {
            return Audio.AST.Param(name, defaultValue);
        });

        ScopeHandler.addFF(scope, 'mix', function () {
            var _Audio$AST;

            return (_Audio$AST = Audio.AST).Mix.apply(_Audio$AST, arguments);
        });

        ScopeHandler.addFF(scope, 'multiply', function (source, factor) {
            return Audio.AST.Multiply(source, factor);
        });

        ScopeHandler.addFF(scope, 'arEnv', function (attack, decay) {
            return Audio.AST.AREnvelope(attack, decay);
        });

        ScopeHandler.addFF(scope, 'osc', function (frequency, wave) {
            return Audio.AST.Oscillator(frequency, wave);
        });

        ScopeHandler.addFF(scope, 'noise', function (noiseType) {
            return Audio.AST.Noise(noiseType);
        });

        ScopeHandler.addFF(scope, 'filter', function (source, filterType, frequency, resonance) {
            return Audio.AST.Filter(source, filterType, frequency, resonance);
        });

        ScopeHandler.addFF(scope, 'delay', function (source, delayTime, delayMax, feedback) {
            return Audio.AST.Delay(source, delayTime, delayMax, feedback);
        });

        ScopeHandler.addFF(scope, 'compressor', function (source, threshold, ratio, knee, reduction, attack, release) {
            return Audio.AST.Compressor(source, threshold, ratio, knee, reduction, attack, release);
        });

        ScopeHandler.addFF(scope, 'amp', function (source, volume) {
            return Audio.AST.Amp(source, volume);
        });

        /**
         * Functions for playing built synths
         */
        ScopeHandler.addFF(scope, 'createSynth', function (dspGraph) {
            var s = audio.Synth.create(dspGraph);
            return s;
        });

        ScopeHandler.addFF(scope, 'setParam', function (synth, paramName, paramValue) {
            audio.Synth.setParam(synth, paramName, paramValue);
        });

        ScopeHandler.addFF(scope, 'getParam', function (synth, paramName) {
            return audio.Synth.getParam(synth, paramName);
        });

        ScopeHandler.addFF(scope, 'start', function (synth, parameterList) {
            audio.Synth.start(synth, parameterList);
        });

        ScopeHandler.addFF(scope, 'stop', function (synth) {
            audio.Synth.stop(synth);
        });

        ScopeHandler.addFF(scope, 'play', function (synth, playLength) {
            audio.Synth.play(synth, playLength, []);
        });

        ScopeHandler.addFF(scope, 'getInputs', function (synth, inputName) {
            audio.Synth.getInputs(synth, inputName);
        });

        ScopeHandler.addFF(scope, 'getOutput', function (synth, outputName) {
            audio.Synth.getOutput(synth, outputName);
        });

        ScopeHandler.addFF(scope, 'routeToMaster', function (sourceSynth) {
            audio.Synth.connectSynthToInputs(audio.masterOut, 'master', sourceSynth, 'default');
        });

        // TODO Thicket should really be handling the name of the input
        ScopeHandler.addFF(scope, 'connectSynthToInputs', function (synth, inputName, sourceSynth) {
            audio.Synth.connectSynthToInputs(synth, inputName, sourceSynth, 'default');
        });

        ScopeHandler.addFF(scope, 'connectToInput', function (synth, inputName, sourceSynth) {
            audio.Synth.connectToInput(synth, inputName, sourceSynth, 'default');
        });

        ScopeHandler.addFF(scope, 'setMultiple', function (synth, parameterList) {
            var i;
            for (i = 0; i < parameterList.length; i += 2) {
                audio.Synth.setParam(synth, parameterList[i], parameterList[i + 1]);
            }
        });
    }
};

},{"../audio":15}],24:[function(require,module,exports){
'use strict';

module.exports = {

    add: function add(audio, dispatcher, ScopeHandler, scope) {
        ScopeHandler.addFF(scope, '==', function (a, b) {
            return a === b;
        });
        ScopeHandler.addFF(scope, '!=', function (a, b) {
            return a !== b;
        });
        ScopeHandler.addFF(scope, '>', function (a, b) {
            return a > b;
        });
        ScopeHandler.addFF(scope, '<', function (a, b) {
            return a < b;
        });
        ScopeHandler.addFF(scope, '>=', function (a, b) {
            return a >= b;
        });
        ScopeHandler.addFF(scope, '<=', function (a, b) {
            return a <= b;
        });
    }

};

},{}],25:[function(require,module,exports){
'use strict';

var MathFuncs = require('./math');
var Comparison = require('./comparison');
var Logic = require('./logic');
var Timing = require('./timing');
var Audio = require('./audio');

module.exports = {

    add: function add(audio, dispatcher, ScopeHandler, scope) {
        MathFuncs.add(audio, dispatcher, ScopeHandler, scope);
        Comparison.add(audio, dispatcher, ScopeHandler, scope);
        Logic.add(audio, dispatcher, ScopeHandler, scope);
        Timing.add(audio, dispatcher, ScopeHandler, scope);
        Audio.add(audio, dispatcher, ScopeHandler, scope);

        ScopeHandler.addFF(scope, 'display', function (data) {
            dispatcher.dispatch('term-message', data);
        });
    }

};

},{"./audio":23,"./comparison":24,"./logic":26,"./math":27,"./timing":28}],26:[function(require,module,exports){
'use strict';

module.exports = {

    add: function add(audio, dispatcher, ScopeHandler, scope) {
        ScopeHandler.addFF(scope, '&&', function (a, b) {
            return a && b;
        });
        ScopeHandler.addFF(scope, '||', function (a, b) {
            return a || b;
        });
        ScopeHandler.addFF(scope, '!', function (a) {
            return !a;
        });
    }

};

},{}],27:[function(require,module,exports){
'use strict';

module.exports = {

    add: function add(audio, dispatcher, ScopeHandler, scope) {
        ScopeHandler.addFF(scope, '+', function (a, b) {
            return a + b;
        });
        ScopeHandler.addFF(scope, '-', function (a, b) {
            return a - b;
        });
        ScopeHandler.addFF(scope, '*', function (a, b) {
            return a * b;
        });
        ScopeHandler.addFF(scope, '/', function (a, b) {
            return a / b;
        });
        ScopeHandler.addFF(scope, '^', function (a, b) {
            return a ^ b;
        });
        ScopeHandler.addFF(scope, '%', function (a, b) {
            return a % b;
        });
    }

};

},{}],28:[function(require,module,exports){
'use strict';

module.exports = {

    add: function add(audio, dispatcher, ScopeHandler, scope) {
        // time in ms
        ScopeHandler.addFF(scope, 'schedule', function (time, closure) {
            dispatcher.dispatch('schedule-callback', time, closure);
        });
    }

};

},{}],29:[function(require,module,exports){
'use strict';

var createTerminal = function createTerminal(terminalBodyEl, dispatcher) {

    var Terminal = {};

    var tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        ' ': '&nbsp;'
    };
    var replaceTag = function replaceTag(tag) {
        return tagsToReplace[tag] || tag;
    };
    var symbolReplace = function symbolReplace(str) {
        return str.replace(/[&<> ]/g, replaceTag);
    };

    var safeToString = function safeToString(x) {
        switch (typeof x) {
            case 'object':
                return 'object';
            case 'function':
                return 'function';
            default:
                return String(x);
        }
    };

    var msgPrompt = "<msg>" + symbolReplace(">> ") + "</msg>";
    var errPrompt = "<err>" + symbolReplace(">> ") + "</err>";

    var header = ["#####################", "#                   #", "#     WEB SOUND     #", "#                   #", "#####################"];
    Terminal.displayHeader = function () {
        var el = terminalBodyEl.children("p:first");
        var i;
        for (i = 0; i < header.length; i += 1) {
            el.append("<heading>" + symbolReplace(header[i]) + "</heading><br>\n");
        }
    };

    Terminal.message = function (msg) {
        terminalBodyEl.children("p:first").append(msgPrompt + symbolReplace(safeToString(msg)) + "<br>\n");
        Terminal.scrollToBottom();
    };

    Terminal.error = function (err) {
        terminalBodyEl.children("p:first").append(errPrompt + symbolReplace(safeToString(err)) + "<br>\n");
        Terminal.scrollToBottom();
    };

    Terminal.scrollToBottom = function () {
        terminalBodyEl.scrollTop(terminalBodyEl.prop('scrollHeight'));
    };

    dispatcher.register('term-message', function (message) {
        Terminal.message(message);
    });

    dispatcher.register('term-error', function (error) {
        Terminal.error(error);
    });

    return Terminal;
};

module.exports = {
    create: createTerminal
};

},{}],30:[function(require,module,exports){
"use strict";

var createDispatcher = function createDispatcher() {

    var DispatcherObj = {};
    var callbacks = {};

    DispatcherObj.register = function (eventName, callback) {
        callbacks[eventName] = callbacks[eventName] || [];
        callbacks[eventName].push(callback);
    };

    DispatcherObj.dispatch = function (eventName /* , args... */) {
        var i;
        var cbList = callbacks[eventName] || [];
        for (i = 0; i < cbList.length; i += 1) {
            cbList[i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
    };
    DispatcherObj.unregister = function (eventName, callback) {
        var cbList = callbacks[eventName];
        var fIds = cbList.indexOf(callback);
        if (fIds > -1) {
            cbList.splice(fIds, 1);
        }
    };

    return DispatcherObj;
};

module.exports = {
    create: createDispatcher
};

},{}],31:[function(require,module,exports){
/*jslint browser: true */

'use strict';

var $ = require('../lib/jquery-2.1.3');

var Dispatch = require('./util/dispatcher');

var NavBar = require('./navbar');
var Editor = require('./editor');
var Terminal = require('./terminal');
var Core = require('./core');
var AudioSystem = require('./audio');

var Whorl = {};

Whorl.create = function () {

    var dispatcher = Dispatch.create();

    NavBar.create(dispatcher);

    var terminal = Terminal.create($('#terminal-body'), dispatcher);

    Editor.create($('#program'), dispatcher);

    try {
        var audioContext = AudioSystem.createContext(window);

        Core.create(audioContext, dispatcher);

        terminal.displayHeader();
    } catch (e) {
        console.log(e);
        terminal.error(e);
    }
};

module.exports = Whorl;

},{"../lib/jquery-2.1.3":41,"./audio":15,"./core":16,"./editor":17,"./navbar":20,"./terminal":29,"./util/dispatcher":30}],32:[function(require,module,exports){
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

"use strict";

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  function dialogDiv(cm, template, bottom) {
    var wrap = cm.getWrapperElement();
    var dialog;
    dialog = wrap.appendChild(document.createElement("div"));
    if (bottom) dialog.className = "CodeMirror-dialog CodeMirror-dialog-bottom";else dialog.className = "CodeMirror-dialog CodeMirror-dialog-top";

    if (typeof template == "string") {
      dialog.innerHTML = template;
    } else {
      // Assuming it's a detached DOM element.
      dialog.appendChild(template);
    }
    return dialog;
  }

  function closeNotification(cm, newVal) {
    if (cm.state.currentNotificationClose) cm.state.currentNotificationClose();
    cm.state.currentNotificationClose = newVal;
  }

  CodeMirror.defineExtension("openDialog", function (template, callback, options) {
    if (!options) options = {};

    closeNotification(this, null);

    var dialog = dialogDiv(this, template, options.bottom);
    var closed = false,
        me = this;
    function close(newVal) {
      if (typeof newVal == 'string') {
        inp.value = newVal;
      } else {
        if (closed) return;
        closed = true;
        dialog.parentNode.removeChild(dialog);
        me.focus();

        if (options.onClose) options.onClose(dialog);
      }
    }

    var inp = dialog.getElementsByTagName("input")[0],
        button;
    if (inp) {
      if (options.value) {
        inp.value = options.value;
        if (options.selectValueOnOpen !== false) {
          inp.select();
        }
      }

      if (options.onInput) CodeMirror.on(inp, "input", function (e) {
        options.onInput(e, inp.value, close);
      });
      if (options.onKeyUp) CodeMirror.on(inp, "keyup", function (e) {
        options.onKeyUp(e, inp.value, close);
      });

      CodeMirror.on(inp, "keydown", function (e) {
        if (options && options.onKeyDown && options.onKeyDown(e, inp.value, close)) {
          return;
        }
        if (e.keyCode == 27 || options.closeOnEnter !== false && e.keyCode == 13) {
          inp.blur();
          CodeMirror.e_stop(e);
          close();
        }
        if (e.keyCode == 13) callback(inp.value, e);
      });

      if (options.closeOnBlur !== false) CodeMirror.on(inp, "blur", close);

      inp.focus();
    } else if (button = dialog.getElementsByTagName("button")[0]) {
      CodeMirror.on(button, "click", function () {
        close();
        me.focus();
      });

      if (options.closeOnBlur !== false) CodeMirror.on(button, "blur", close);

      button.focus();
    }
    return close;
  });

  CodeMirror.defineExtension("openConfirm", function (template, callbacks, options) {
    closeNotification(this, null);
    var dialog = dialogDiv(this, template, options && options.bottom);
    var buttons = dialog.getElementsByTagName("button");
    var closed = false,
        me = this,
        blurring = 1;
    function close() {
      if (closed) return;
      closed = true;
      dialog.parentNode.removeChild(dialog);
      me.focus();
    }
    buttons[0].focus();
    for (var i = 0; i < buttons.length; ++i) {
      var b = buttons[i];
      (function (callback) {
        CodeMirror.on(b, "click", function (e) {
          CodeMirror.e_preventDefault(e);
          close();
          if (callback) callback(me);
        });
      })(callbacks[i]);
      CodeMirror.on(b, "blur", function () {
        --blurring;
        setTimeout(function () {
          if (blurring <= 0) close();
        }, 200);
      });
      CodeMirror.on(b, "focus", function () {
        ++blurring;
      });
    }
  });

  /*
   * openNotification
   * Opens a notification, that can be closed with an optional timer
   * (default 5000ms timer) and always closes on click.
   *
   * If a notification is opened while another is opened, it will close the
   * currently opened one and open the new one immediately.
   */
  CodeMirror.defineExtension("openNotification", function (template, options) {
    closeNotification(this, close);
    var dialog = dialogDiv(this, template, options && options.bottom);
    var closed = false,
        doneTimer;
    var duration = options && typeof options.duration !== "undefined" ? options.duration : 5000;

    function close() {
      if (closed) return;
      closed = true;
      clearTimeout(doneTimer);
      dialog.parentNode.removeChild(dialog);
    }

    CodeMirror.on(dialog, 'click', function (e) {
      CodeMirror.e_preventDefault(e);
      close();
    });

    if (duration) doneTimer = setTimeout(close, duration);

    return close;
  });
});
// Open simple dialogs on top of an editor. Relies on dialog.css.

},{"../../lib/codemirror":36}],33:[function(require,module,exports){
// CodeMirror, copyright (c) by Marijn Haverbeke and others
"use strict";

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  var ie_lt8 = /MSIE \d/.test(navigator.userAgent) && (document.documentMode == null || document.documentMode < 8);

  var Pos = CodeMirror.Pos;

  var matching = { "(": ")>", ")": "(<", "[": "]>", "]": "[<", "{": "}>", "}": "{<" };

  function findMatchingBracket(cm, where, strict, config) {
    var line = cm.getLineHandle(where.line),
        pos = where.ch - 1;
    var match = pos >= 0 && matching[line.text.charAt(pos)] || matching[line.text.charAt(++pos)];
    if (!match) return null;
    var dir = match.charAt(1) == ">" ? 1 : -1;
    if (strict && dir > 0 != (pos == where.ch)) return null;
    var style = cm.getTokenTypeAt(Pos(where.line, pos + 1));

    var found = scanForBracket(cm, Pos(where.line, pos + (dir > 0 ? 1 : 0)), dir, style || null, config);
    if (found == null) return null;
    return { from: Pos(where.line, pos), to: found && found.pos,
      match: found && found.ch == match.charAt(0), forward: dir > 0 };
  }

  // bracketRegex is used to specify which type of bracket to scan
  // should be a regexp, e.g. /[[\]]/
  //
  // Note: If "where" is on an open bracket, then this bracket is ignored.
  //
  // Returns false when no bracket was found, null when it reached
  // maxScanLines and gave up
  function scanForBracket(cm, where, dir, style, config) {
    var maxScanLen = config && config.maxScanLineLength || 10000;
    var maxScanLines = config && config.maxScanLines || 1000;

    var stack = [];
    var re = config && config.bracketRegex ? config.bracketRegex : /[(){}[\]]/;
    var lineEnd = dir > 0 ? Math.min(where.line + maxScanLines, cm.lastLine() + 1) : Math.max(cm.firstLine() - 1, where.line - maxScanLines);
    for (var lineNo = where.line; lineNo != lineEnd; lineNo += dir) {
      var line = cm.getLine(lineNo);
      if (!line) continue;
      var pos = dir > 0 ? 0 : line.length - 1,
          end = dir > 0 ? line.length : -1;
      if (line.length > maxScanLen) continue;
      if (lineNo == where.line) pos = where.ch - (dir < 0 ? 1 : 0);
      for (; pos != end; pos += dir) {
        var ch = line.charAt(pos);
        if (re.test(ch) && (style === undefined || cm.getTokenTypeAt(Pos(lineNo, pos + 1)) == style)) {
          var match = matching[ch];
          if (match.charAt(1) == ">" == dir > 0) stack.push(ch);else if (!stack.length) return { pos: Pos(lineNo, pos), ch: ch };else stack.pop();
        }
      }
    }
    return lineNo - dir == (dir > 0 ? cm.lastLine() : cm.firstLine()) ? false : null;
  }

  function matchBrackets(cm, autoclear, config) {
    // Disable brace matching in long lines, since it'll cause hugely slow updates
    var maxHighlightLen = cm.state.matchBrackets.maxHighlightLineLength || 1000;
    var marks = [],
        ranges = cm.listSelections();
    for (var i = 0; i < ranges.length; i++) {
      var match = ranges[i].empty() && findMatchingBracket(cm, ranges[i].head, false, config);
      if (match && cm.getLine(match.from.line).length <= maxHighlightLen) {
        var style = match.match ? "CodeMirror-matchingbracket" : "CodeMirror-nonmatchingbracket";
        marks.push(cm.markText(match.from, Pos(match.from.line, match.from.ch + 1), { className: style }));
        if (match.to && cm.getLine(match.to.line).length <= maxHighlightLen) marks.push(cm.markText(match.to, Pos(match.to.line, match.to.ch + 1), { className: style }));
      }
    }

    if (marks.length) {
      // Kludge to work around the IE bug from issue #1193, where text
      // input stops going to the textare whever this fires.
      if (ie_lt8 && cm.state.focused) cm.focus();

      var clear = function clear() {
        cm.operation(function () {
          for (var i = 0; i < marks.length; i++) marks[i].clear();
        });
      };
      if (autoclear) setTimeout(clear, 800);else return clear;
    }
  }

  var currentlyHighlighted = null;
  function doMatchBrackets(cm) {
    cm.operation(function () {
      if (currentlyHighlighted) {
        currentlyHighlighted();currentlyHighlighted = null;
      }
      currentlyHighlighted = matchBrackets(cm, false, cm.state.matchBrackets);
    });
  }

  CodeMirror.defineOption("matchBrackets", false, function (cm, val, old) {
    if (old && old != CodeMirror.Init) cm.off("cursorActivity", doMatchBrackets);
    if (val) {
      cm.state.matchBrackets = typeof val == "object" ? val : {};
      cm.on("cursorActivity", doMatchBrackets);
    }
  });

  CodeMirror.defineExtension("matchBrackets", function () {
    matchBrackets(this, true);
  });
  CodeMirror.defineExtension("findMatchingBracket", function (pos, strict, config) {
    return findMatchingBracket(this, pos, strict, config);
  });
  CodeMirror.defineExtension("scanForBracket", function (pos, dir, style, config) {
    return scanForBracket(this, pos, dir, style, config);
  });
});
// Distributed under an MIT license: http://codemirror.net/LICENSE

},{"../../lib/codemirror":36}],34:[function(require,module,exports){
// CodeMirror, copyright (c) by Marijn Haverbeke and others
"use strict";

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";
  var Pos = CodeMirror.Pos;

  function SearchCursor(doc, query, pos, caseFold) {
    this.atOccurrence = false;this.doc = doc;
    if (caseFold == null && typeof query == "string") caseFold = false;

    pos = pos ? doc.clipPos(pos) : Pos(0, 0);
    this.pos = { from: pos, to: pos };

    // The matches method is filled in based on the type of query.
    // It takes a position and a direction, and returns an object
    // describing the next occurrence of the query, or null if no
    // more matches were found.
    if (typeof query != "string") {
      // Regexp match
      if (!query.global) query = new RegExp(query.source, query.ignoreCase ? "ig" : "g");
      this.matches = function (reverse, pos) {
        if (reverse) {
          query.lastIndex = 0;
          var line = doc.getLine(pos.line).slice(0, pos.ch),
              cutOff = 0,
              match,
              start;
          for (;;) {
            query.lastIndex = cutOff;
            var newMatch = query.exec(line);
            if (!newMatch) break;
            match = newMatch;
            start = match.index;
            cutOff = match.index + (match[0].length || 1);
            if (cutOff == line.length) break;
          }
          var matchLen = match && match[0].length || 0;
          if (!matchLen) {
            if (start == 0 && line.length == 0) {
              match = undefined;
            } else if (start != doc.getLine(pos.line).length) {
              matchLen++;
            }
          }
        } else {
          query.lastIndex = pos.ch;
          var line = doc.getLine(pos.line),
              match = query.exec(line);
          var matchLen = match && match[0].length || 0;
          var start = match && match.index;
          if (start + matchLen != line.length && !matchLen) matchLen = 1;
        }
        if (match && matchLen) return { from: Pos(pos.line, start),
          to: Pos(pos.line, start + matchLen),
          match: match };
      };
    } else {
      // String query
      var origQuery = query;
      if (caseFold) query = query.toLowerCase();
      var fold = caseFold ? function (str) {
        return str.toLowerCase();
      } : function (str) {
        return str;
      };
      var target = query.split("\n");
      // Different methods for single-line and multi-line queries
      if (target.length == 1) {
        if (!query.length) {
          // Empty string would match anything and never progress, so
          // we define it to match nothing instead.
          this.matches = function () {};
        } else {
          this.matches = function (reverse, pos) {
            if (reverse) {
              var orig = doc.getLine(pos.line).slice(0, pos.ch),
                  line = fold(orig);
              var match = line.lastIndexOf(query);
              if (match > -1) {
                match = adjustPos(orig, line, match);
                return { from: Pos(pos.line, match), to: Pos(pos.line, match + origQuery.length) };
              }
            } else {
              var orig = doc.getLine(pos.line).slice(pos.ch),
                  line = fold(orig);
              var match = line.indexOf(query);
              if (match > -1) {
                match = adjustPos(orig, line, match) + pos.ch;
                return { from: Pos(pos.line, match), to: Pos(pos.line, match + origQuery.length) };
              }
            }
          };
        }
      } else {
        var origTarget = origQuery.split("\n");
        this.matches = function (reverse, pos) {
          var last = target.length - 1;
          if (reverse) {
            if (pos.line - (target.length - 1) < doc.firstLine()) return;
            if (fold(doc.getLine(pos.line).slice(0, origTarget[last].length)) != target[target.length - 1]) return;
            var to = Pos(pos.line, origTarget[last].length);
            for (var ln = pos.line - 1, i = last - 1; i >= 1; --i, --ln) if (target[i] != fold(doc.getLine(ln))) return;
            var line = doc.getLine(ln),
                cut = line.length - origTarget[0].length;
            if (fold(line.slice(cut)) != target[0]) return;
            return { from: Pos(ln, cut), to: to };
          } else {
            if (pos.line + (target.length - 1) > doc.lastLine()) return;
            var line = doc.getLine(pos.line),
                cut = line.length - origTarget[0].length;
            if (fold(line.slice(cut)) != target[0]) return;
            var from = Pos(pos.line, cut);
            for (var ln = pos.line + 1, i = 1; i < last; ++i, ++ln) if (target[i] != fold(doc.getLine(ln))) return;
            if (fold(doc.getLine(ln).slice(0, origTarget[last].length)) != target[last]) return;
            return { from: from, to: Pos(ln, origTarget[last].length) };
          }
        };
      }
    }
  }

  SearchCursor.prototype = {
    findNext: function findNext() {
      return this.find(false);
    },
    findPrevious: function findPrevious() {
      return this.find(true);
    },

    find: function find(reverse) {
      var self = this,
          pos = this.doc.clipPos(reverse ? this.pos.from : this.pos.to);
      function savePosAndFail(line) {
        var pos = Pos(line, 0);
        self.pos = { from: pos, to: pos };
        self.atOccurrence = false;
        return false;
      }

      for (;;) {
        if (this.pos = this.matches(reverse, pos)) {
          this.atOccurrence = true;
          return this.pos.match || true;
        }
        if (reverse) {
          if (!pos.line) return savePosAndFail(0);
          pos = Pos(pos.line - 1, this.doc.getLine(pos.line - 1).length);
        } else {
          var maxLine = this.doc.lineCount();
          if (pos.line == maxLine - 1) return savePosAndFail(maxLine);
          pos = Pos(pos.line + 1, 0);
        }
      }
    },

    from: function from() {
      if (this.atOccurrence) return this.pos.from;
    },
    to: function to() {
      if (this.atOccurrence) return this.pos.to;
    },

    replace: function replace(newText) {
      if (!this.atOccurrence) return;
      var lines = CodeMirror.splitLines(newText);
      this.doc.replaceRange(lines, this.pos.from, this.pos.to);
      this.pos.to = Pos(this.pos.from.line + lines.length - 1, lines[lines.length - 1].length + (lines.length == 1 ? this.pos.from.ch : 0));
    }
  };

  // Maps a position in a case-folded line back to a position in the original line
  // (compensating for codepoints increasing in number during folding)
  function adjustPos(orig, folded, pos) {
    if (orig.length == folded.length) return pos;
    for (var pos1 = Math.min(pos, orig.length);;) {
      var len1 = orig.slice(0, pos1).toLowerCase().length;
      if (len1 < pos) ++pos1;else if (len1 > pos) --pos1;else return pos1;
    }
  }

  CodeMirror.defineExtension("getSearchCursor", function (query, pos, caseFold) {
    return new SearchCursor(this.doc, query, pos, caseFold);
  });
  CodeMirror.defineDocExtension("getSearchCursor", function (query, pos, caseFold) {
    return new SearchCursor(this, query, pos, caseFold);
  });

  CodeMirror.defineExtension("selectMatches", function (query, caseFold) {
    var ranges = [],
        next;
    var cur = this.getSearchCursor(query, this.getCursor("from"), caseFold);
    while (next = cur.findNext()) {
      if (CodeMirror.cmpPos(cur.to(), this.getCursor("to")) > 0) break;
      ranges.push({ anchor: cur.from(), head: cur.to() });
    }
    if (ranges.length) this.setSelections(ranges, 0);
  });
});
// Distributed under an MIT license: http://codemirror.net/LICENSE

},{"../../lib/codemirror":36}],35:[function(require,module,exports){
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE
"use strict";(function(mod){if(typeof exports == "object" && typeof module == "object") // CommonJS
mod(require("../lib/codemirror"),require("../addon/search/searchcursor"),require("../addon/dialog/dialog"),require("../addon/edit/matchbrackets.js"));else if(typeof define == "function" && define.amd) // AMD
define(["../lib/codemirror","../addon/search/searchcursor","../addon/dialog/dialog","../addon/edit/matchbrackets"],mod);else  // Plain browser env
mod(CodeMirror);})(function(CodeMirror){'use strict';var defaultKeymap=[ // Key to key mapping. This goes first to make it possible to override
// existing mappings.
{keys:'<Left>',type:'keyToKey',toKeys:'h'},{keys:'<Right>',type:'keyToKey',toKeys:'l'},{keys:'<Up>',type:'keyToKey',toKeys:'k'},{keys:'<Down>',type:'keyToKey',toKeys:'j'},{keys:'<Space>',type:'keyToKey',toKeys:'l'},{keys:'<BS>',type:'keyToKey',toKeys:'h',context:'normal'},{keys:'<C-Space>',type:'keyToKey',toKeys:'W'},{keys:'<C-BS>',type:'keyToKey',toKeys:'B',context:'normal'},{keys:'<S-Space>',type:'keyToKey',toKeys:'w'},{keys:'<S-BS>',type:'keyToKey',toKeys:'b',context:'normal'},{keys:'<C-n>',type:'keyToKey',toKeys:'j'},{keys:'<C-p>',type:'keyToKey',toKeys:'k'},{keys:'<C-[>',type:'keyToKey',toKeys:'<Esc>'},{keys:'<C-c>',type:'keyToKey',toKeys:'<Esc>'},{keys:'<C-[>',type:'keyToKey',toKeys:'<Esc>',context:'insert'},{keys:'<C-c>',type:'keyToKey',toKeys:'<Esc>',context:'insert'},{keys:'s',type:'keyToKey',toKeys:'cl',context:'normal'},{keys:'s',type:'keyToKey',toKeys:'xi',context:'visual'},{keys:'S',type:'keyToKey',toKeys:'cc',context:'normal'},{keys:'S',type:'keyToKey',toKeys:'dcc',context:'visual'},{keys:'<Home>',type:'keyToKey',toKeys:'0'},{keys:'<End>',type:'keyToKey',toKeys:'$'},{keys:'<PageUp>',type:'keyToKey',toKeys:'<C-b>'},{keys:'<PageDown>',type:'keyToKey',toKeys:'<C-f>'},{keys:'<CR>',type:'keyToKey',toKeys:'j^',context:'normal'}, // Motions
{keys:'H',type:'motion',motion:'moveToTopLine',motionArgs:{linewise:true,toJumplist:true}},{keys:'M',type:'motion',motion:'moveToMiddleLine',motionArgs:{linewise:true,toJumplist:true}},{keys:'L',type:'motion',motion:'moveToBottomLine',motionArgs:{linewise:true,toJumplist:true}},{keys:'h',type:'motion',motion:'moveByCharacters',motionArgs:{forward:false}},{keys:'l',type:'motion',motion:'moveByCharacters',motionArgs:{forward:true}},{keys:'j',type:'motion',motion:'moveByLines',motionArgs:{forward:true,linewise:true}},{keys:'k',type:'motion',motion:'moveByLines',motionArgs:{forward:false,linewise:true}},{keys:'gj',type:'motion',motion:'moveByDisplayLines',motionArgs:{forward:true}},{keys:'gk',type:'motion',motion:'moveByDisplayLines',motionArgs:{forward:false}},{keys:'w',type:'motion',motion:'moveByWords',motionArgs:{forward:true,wordEnd:false}},{keys:'W',type:'motion',motion:'moveByWords',motionArgs:{forward:true,wordEnd:false,bigWord:true}},{keys:'e',type:'motion',motion:'moveByWords',motionArgs:{forward:true,wordEnd:true,inclusive:true}},{keys:'E',type:'motion',motion:'moveByWords',motionArgs:{forward:true,wordEnd:true,bigWord:true,inclusive:true}},{keys:'b',type:'motion',motion:'moveByWords',motionArgs:{forward:false,wordEnd:false}},{keys:'B',type:'motion',motion:'moveByWords',motionArgs:{forward:false,wordEnd:false,bigWord:true}},{keys:'ge',type:'motion',motion:'moveByWords',motionArgs:{forward:false,wordEnd:true,inclusive:true}},{keys:'gE',type:'motion',motion:'moveByWords',motionArgs:{forward:false,wordEnd:true,bigWord:true,inclusive:true}},{keys:'{',type:'motion',motion:'moveByParagraph',motionArgs:{forward:false,toJumplist:true}},{keys:'}',type:'motion',motion:'moveByParagraph',motionArgs:{forward:true,toJumplist:true}},{keys:'<C-f>',type:'motion',motion:'moveByPage',motionArgs:{forward:true}},{keys:'<C-b>',type:'motion',motion:'moveByPage',motionArgs:{forward:false}},{keys:'<C-d>',type:'motion',motion:'moveByScroll',motionArgs:{forward:true,explicitRepeat:true}},{keys:'<C-u>',type:'motion',motion:'moveByScroll',motionArgs:{forward:false,explicitRepeat:true}},{keys:'gg',type:'motion',motion:'moveToLineOrEdgeOfDocument',motionArgs:{forward:false,explicitRepeat:true,linewise:true,toJumplist:true}},{keys:'G',type:'motion',motion:'moveToLineOrEdgeOfDocument',motionArgs:{forward:true,explicitRepeat:true,linewise:true,toJumplist:true}},{keys:'0',type:'motion',motion:'moveToStartOfLine'},{keys:'^',type:'motion',motion:'moveToFirstNonWhiteSpaceCharacter'},{keys:'+',type:'motion',motion:'moveByLines',motionArgs:{forward:true,toFirstChar:true}},{keys:'-',type:'motion',motion:'moveByLines',motionArgs:{forward:false,toFirstChar:true}},{keys:'_',type:'motion',motion:'moveByLines',motionArgs:{forward:true,toFirstChar:true,repeatOffset:-1}},{keys:'$',type:'motion',motion:'moveToEol',motionArgs:{inclusive:true}},{keys:'%',type:'motion',motion:'moveToMatchedSymbol',motionArgs:{inclusive:true,toJumplist:true}},{keys:'f<character>',type:'motion',motion:'moveToCharacter',motionArgs:{forward:true,inclusive:true}},{keys:'F<character>',type:'motion',motion:'moveToCharacter',motionArgs:{forward:false}},{keys:'t<character>',type:'motion',motion:'moveTillCharacter',motionArgs:{forward:true,inclusive:true}},{keys:'T<character>',type:'motion',motion:'moveTillCharacter',motionArgs:{forward:false}},{keys:';',type:'motion',motion:'repeatLastCharacterSearch',motionArgs:{forward:true}},{keys:',',type:'motion',motion:'repeatLastCharacterSearch',motionArgs:{forward:false}},{keys:'\'<character>',type:'motion',motion:'goToMark',motionArgs:{toJumplist:true,linewise:true}},{keys:'`<character>',type:'motion',motion:'goToMark',motionArgs:{toJumplist:true}},{keys:']`',type:'motion',motion:'jumpToMark',motionArgs:{forward:true}},{keys:'[`',type:'motion',motion:'jumpToMark',motionArgs:{forward:false}},{keys:']\'',type:'motion',motion:'jumpToMark',motionArgs:{forward:true,linewise:true}},{keys:'[\'',type:'motion',motion:'jumpToMark',motionArgs:{forward:false,linewise:true}}, // the next two aren't motions but must come before more general motion declarations
{keys:']p',type:'action',action:'paste',isEdit:true,actionArgs:{after:true,isEdit:true,matchIndent:true}},{keys:'[p',type:'action',action:'paste',isEdit:true,actionArgs:{after:false,isEdit:true,matchIndent:true}},{keys:']<character>',type:'motion',motion:'moveToSymbol',motionArgs:{forward:true,toJumplist:true}},{keys:'[<character>',type:'motion',motion:'moveToSymbol',motionArgs:{forward:false,toJumplist:true}},{keys:'|',type:'motion',motion:'moveToColumn'},{keys:'o',type:'motion',motion:'moveToOtherHighlightedEnd',context:'visual'},{keys:'O',type:'motion',motion:'moveToOtherHighlightedEnd',motionArgs:{sameLine:true},context:'visual'}, // Operators
{keys:'d',type:'operator',operator:'delete'},{keys:'y',type:'operator',operator:'yank'},{keys:'c',type:'operator',operator:'change'},{keys:'>',type:'operator',operator:'indent',operatorArgs:{indentRight:true}},{keys:'<',type:'operator',operator:'indent',operatorArgs:{indentRight:false}},{keys:'g~',type:'operator',operator:'changeCase'},{keys:'gu',type:'operator',operator:'changeCase',operatorArgs:{toLower:true},isEdit:true},{keys:'gU',type:'operator',operator:'changeCase',operatorArgs:{toLower:false},isEdit:true},{keys:'n',type:'motion',motion:'findNext',motionArgs:{forward:true,toJumplist:true}},{keys:'N',type:'motion',motion:'findNext',motionArgs:{forward:false,toJumplist:true}}, // Operator-Motion dual commands
{keys:'x',type:'operatorMotion',operator:'delete',motion:'moveByCharacters',motionArgs:{forward:true},operatorMotionArgs:{visualLine:false}},{keys:'X',type:'operatorMotion',operator:'delete',motion:'moveByCharacters',motionArgs:{forward:false},operatorMotionArgs:{visualLine:true}},{keys:'D',type:'operatorMotion',operator:'delete',motion:'moveToEol',motionArgs:{inclusive:true},context:'normal'},{keys:'D',type:'operator',operator:'delete',operatorArgs:{linewise:true},context:'visual'},{keys:'Y',type:'operatorMotion',operator:'yank',motion:'moveToEol',motionArgs:{inclusive:true},context:'normal'},{keys:'Y',type:'operator',operator:'yank',operatorArgs:{linewise:true},context:'visual'},{keys:'C',type:'operatorMotion',operator:'change',motion:'moveToEol',motionArgs:{inclusive:true},context:'normal'},{keys:'C',type:'operator',operator:'change',operatorArgs:{linewise:true},context:'visual'},{keys:'~',type:'operatorMotion',operator:'changeCase',motion:'moveByCharacters',motionArgs:{forward:true},operatorArgs:{shouldMoveCursor:true},context:'normal'},{keys:'~',type:'operator',operator:'changeCase',context:'visual'},{keys:'<C-w>',type:'operatorMotion',operator:'delete',motion:'moveByWords',motionArgs:{forward:false,wordEnd:false},context:'insert'}, // Actions
{keys:'<C-i>',type:'action',action:'jumpListWalk',actionArgs:{forward:true}},{keys:'<C-o>',type:'action',action:'jumpListWalk',actionArgs:{forward:false}},{keys:'<C-e>',type:'action',action:'scroll',actionArgs:{forward:true,linewise:true}},{keys:'<C-y>',type:'action',action:'scroll',actionArgs:{forward:false,linewise:true}},{keys:'a',type:'action',action:'enterInsertMode',isEdit:true,actionArgs:{insertAt:'charAfter'},context:'normal'},{keys:'A',type:'action',action:'enterInsertMode',isEdit:true,actionArgs:{insertAt:'eol'},context:'normal'},{keys:'A',type:'action',action:'enterInsertMode',isEdit:true,actionArgs:{insertAt:'endOfSelectedArea'},context:'visual'},{keys:'i',type:'action',action:'enterInsertMode',isEdit:true,actionArgs:{insertAt:'inplace'},context:'normal'},{keys:'I',type:'action',action:'enterInsertMode',isEdit:true,actionArgs:{insertAt:'firstNonBlank'},context:'normal'},{keys:'I',type:'action',action:'enterInsertMode',isEdit:true,actionArgs:{insertAt:'startOfSelectedArea'},context:'visual'},{keys:'o',type:'action',action:'newLineAndEnterInsertMode',isEdit:true,interlaceInsertRepeat:true,actionArgs:{after:true},context:'normal'},{keys:'O',type:'action',action:'newLineAndEnterInsertMode',isEdit:true,interlaceInsertRepeat:true,actionArgs:{after:false},context:'normal'},{keys:'v',type:'action',action:'toggleVisualMode'},{keys:'V',type:'action',action:'toggleVisualMode',actionArgs:{linewise:true}},{keys:'<C-v>',type:'action',action:'toggleVisualMode',actionArgs:{blockwise:true}},{keys:'gv',type:'action',action:'reselectLastSelection'},{keys:'J',type:'action',action:'joinLines',isEdit:true},{keys:'p',type:'action',action:'paste',isEdit:true,actionArgs:{after:true,isEdit:true}},{keys:'P',type:'action',action:'paste',isEdit:true,actionArgs:{after:false,isEdit:true}},{keys:'r<character>',type:'action',action:'replace',isEdit:true},{keys:'@<character>',type:'action',action:'replayMacro'},{keys:'q<character>',type:'action',action:'enterMacroRecordMode'}, // Handle Replace-mode as a special case of insert mode.
{keys:'R',type:'action',action:'enterInsertMode',isEdit:true,actionArgs:{replace:true}},{keys:'u',type:'action',action:'undo',context:'normal'},{keys:'u',type:'operator',operator:'changeCase',operatorArgs:{toLower:true},context:'visual',isEdit:true},{keys:'U',type:'operator',operator:'changeCase',operatorArgs:{toLower:false},context:'visual',isEdit:true},{keys:'<C-r>',type:'action',action:'redo'},{keys:'m<character>',type:'action',action:'setMark'},{keys:'"<character>',type:'action',action:'setRegister'},{keys:'zz',type:'action',action:'scrollToCursor',actionArgs:{position:'center'}},{keys:'z.',type:'action',action:'scrollToCursor',actionArgs:{position:'center'},motion:'moveToFirstNonWhiteSpaceCharacter'},{keys:'zt',type:'action',action:'scrollToCursor',actionArgs:{position:'top'}},{keys:'z<CR>',type:'action',action:'scrollToCursor',actionArgs:{position:'top'},motion:'moveToFirstNonWhiteSpaceCharacter'},{keys:'z-',type:'action',action:'scrollToCursor',actionArgs:{position:'bottom'}},{keys:'zb',type:'action',action:'scrollToCursor',actionArgs:{position:'bottom'},motion:'moveToFirstNonWhiteSpaceCharacter'},{keys:'.',type:'action',action:'repeatLastEdit'},{keys:'<C-a>',type:'action',action:'incrementNumberToken',isEdit:true,actionArgs:{increase:true,backtrack:false}},{keys:'<C-x>',type:'action',action:'incrementNumberToken',isEdit:true,actionArgs:{increase:false,backtrack:false}}, // Text object motions
{keys:'a<character>',type:'motion',motion:'textObjectManipulation'},{keys:'i<character>',type:'motion',motion:'textObjectManipulation',motionArgs:{textObjectInner:true}}, // Search
{keys:'/',type:'search',searchArgs:{forward:true,querySrc:'prompt',toJumplist:true}},{keys:'?',type:'search',searchArgs:{forward:false,querySrc:'prompt',toJumplist:true}},{keys:'*',type:'search',searchArgs:{forward:true,querySrc:'wordUnderCursor',wholeWordOnly:true,toJumplist:true}},{keys:'#',type:'search',searchArgs:{forward:false,querySrc:'wordUnderCursor',wholeWordOnly:true,toJumplist:true}},{keys:'g*',type:'search',searchArgs:{forward:true,querySrc:'wordUnderCursor',toJumplist:true}},{keys:'g#',type:'search',searchArgs:{forward:false,querySrc:'wordUnderCursor',toJumplist:true}}, // Ex command
{keys:':',type:'ex'}];var Pos=CodeMirror.Pos;var Vim=function Vim(){function enterVimMode(cm){cm.setOption('disableInput',true);cm.setOption('showCursorWhenSelecting',false);CodeMirror.signal(cm,"vim-mode-change",{mode:"normal"});cm.on('cursorActivity',onCursorActivity);maybeInitVimState(cm);CodeMirror.on(cm.getInputField(),'paste',getOnPasteFn(cm));}function leaveVimMode(cm){cm.setOption('disableInput',false);cm.off('cursorActivity',onCursorActivity);CodeMirror.off(cm.getInputField(),'paste',getOnPasteFn(cm));cm.state.vim = null;}function detachVimMap(cm,next){if(this == CodeMirror.keyMap.vim)CodeMirror.rmClass(cm.getWrapperElement(),"cm-fat-cursor");if(!next || next.attach != attachVimMap)leaveVimMode(cm,false);}function attachVimMap(cm,prev){if(this == CodeMirror.keyMap.vim)CodeMirror.addClass(cm.getWrapperElement(),"cm-fat-cursor");if(!prev || prev.attach != attachVimMap)enterVimMode(cm);} // Deprecated, simply setting the keymap works again.
CodeMirror.defineOption('vimMode',false,function(cm,val,prev){if(val && cm.getOption("keyMap") != "vim")cm.setOption("keyMap","vim");else if(!val && prev != CodeMirror.Init && /^vim/.test(cm.getOption("keyMap")))cm.setOption("keyMap","default");});function cmKey(key,cm){if(!cm){return undefined;}var vimKey=cmKeyToVimKey(key);if(!vimKey){return false;}var cmd=CodeMirror.Vim.findKey(cm,vimKey);if(typeof cmd == 'function'){CodeMirror.signal(cm,'vim-keypress',vimKey);}return cmd;}var modifiers={'Shift':'S','Ctrl':'C','Alt':'A','Cmd':'D','Mod':'A'};var specialKeys={Enter:'CR',Backspace:'BS',Delete:'Del'};function cmKeyToVimKey(key){if(key.charAt(0) == '\''){ // Keypress character binding of format "'a'"
return key.charAt(1);}var pieces=key.split('-');if(/-$/.test(key)){ // If the - key was typed, split will result in 2 extra empty strings
// in the array. Replace them with 1 '-'.
pieces.splice(-2,2,'-');}var lastPiece=pieces[pieces.length - 1];if(pieces.length == 1 && pieces[0].length == 1){ // No-modifier bindings use literal character bindings above. Skip.
return false;}else if(pieces.length == 2 && pieces[0] == 'Shift' && lastPiece.length == 1){ // Ignore Shift+char bindings as they should be handled by literal character.
return false;}var hasCharacter=false;for(var i=0;i < pieces.length;i++) {var piece=pieces[i];if(piece in modifiers){pieces[i] = modifiers[piece];}else {hasCharacter = true;}if(piece in specialKeys){pieces[i] = specialKeys[piece];}}if(!hasCharacter){ // Vim does not support modifier only keys.
return false;} // TODO: Current bindings expect the character to be lower case, but
// it looks like vim key notation uses upper case.
if(isUpperCase(lastPiece)){pieces[pieces.length - 1] = lastPiece.toLowerCase();}return '<' + pieces.join('-') + '>';}function getOnPasteFn(cm){var vim=cm.state.vim;if(!vim.onPasteFn){vim.onPasteFn = function(){if(!vim.insertMode){cm.setCursor(offsetCursor(cm.getCursor(),0,1));actions.enterInsertMode(cm,{},vim);}};}return vim.onPasteFn;}var numberRegex=/[\d]/;var wordCharTest=[CodeMirror.isWordChar,function(ch){return ch && !CodeMirror.isWordChar(ch) && !/\s/.test(ch);}],bigWordCharTest=[function(ch){return (/\S/.test(ch));}];function makeKeyRange(start,size){var keys=[];for(var i=start;i < start + size;i++) {keys.push(String.fromCharCode(i));}return keys;}var upperCaseAlphabet=makeKeyRange(65,26);var lowerCaseAlphabet=makeKeyRange(97,26);var numbers=makeKeyRange(48,10);var validMarks=[].concat(upperCaseAlphabet,lowerCaseAlphabet,numbers,['<','>']);var validRegisters=[].concat(upperCaseAlphabet,lowerCaseAlphabet,numbers,['-','"','.',':','/']);function isLine(cm,line){return line >= cm.firstLine() && line <= cm.lastLine();}function isLowerCase(k){return (/^[a-z]$/.test(k));}function isMatchableSymbol(k){return '()[]{}'.indexOf(k) != -1;}function isNumber(k){return numberRegex.test(k);}function isUpperCase(k){return (/^[A-Z]$/.test(k));}function isWhiteSpaceString(k){return (/^\s*$/.test(k));}function inArray(val,arr){for(var i=0;i < arr.length;i++) {if(arr[i] == val){return true;}}return false;}var options={};function defineOption(name,defaultValue,type){if(defaultValue === undefined){throw Error('defaultValue is required');}if(!type){type = 'string';}options[name] = {type:type,defaultValue:defaultValue};setOption(name,defaultValue);}function setOption(name,value){var option=options[name];if(!option){throw Error('Unknown option: ' + name);}if(option.type == 'boolean'){if(value && value !== true){throw Error('Invalid argument: ' + name + '=' + value);}else if(value !== false){ // Boolean options are set to true if value is not defined.
value = true;}}option.value = option.type == 'boolean'?!!value:value;}function getOption(name){var option=options[name];if(!option){throw Error('Unknown option: ' + name);}return option.value;}var createCircularJumpList=function createCircularJumpList(){var size=100;var pointer=-1;var head=0;var tail=0;var buffer=new Array(size);function add(cm,oldCur,newCur){var current=pointer % size;var curMark=buffer[current];function useNextSlot(cursor){var next=++pointer % size;var trashMark=buffer[next];if(trashMark){trashMark.clear();}buffer[next] = cm.setBookmark(cursor);}if(curMark){var markPos=curMark.find(); // avoid recording redundant cursor position
if(markPos && !cursorEqual(markPos,oldCur)){useNextSlot(oldCur);}}else {useNextSlot(oldCur);}useNextSlot(newCur);head = pointer;tail = pointer - size + 1;if(tail < 0){tail = 0;}}function move(cm,offset){pointer += offset;if(pointer > head){pointer = head;}else if(pointer < tail){pointer = tail;}var mark=buffer[(size + pointer) % size]; // skip marks that are temporarily removed from text buffer
if(mark && !mark.find()){var inc=offset > 0?1:-1;var newCur;var oldCur=cm.getCursor();do {pointer += inc;mark = buffer[(size + pointer) % size]; // skip marks that are the same as current position
if(mark && (newCur = mark.find()) && !cursorEqual(oldCur,newCur)){break;}}while(pointer < head && pointer > tail);}return mark;}return {cachedCursor:undefined, //used for # and * jumps
add:add,move:move};}; // Returns an object to track the changes associated insert mode.  It
// clones the object that is passed in, or creates an empty object one if
// none is provided.
var createInsertModeChanges=function createInsertModeChanges(c){if(c){ // Copy construction
return {changes:c.changes,expectCursorActivityForChange:c.expectCursorActivityForChange};}return { // Change list
changes:[], // Set to true on change, false on cursorActivity.
expectCursorActivityForChange:false};};function MacroModeState(){this.latestRegister = undefined;this.isPlaying = false;this.isRecording = false;this.replaySearchQueries = [];this.onRecordingDone = undefined;this.lastInsertModeChanges = createInsertModeChanges();}MacroModeState.prototype = {exitMacroRecordMode:function exitMacroRecordMode(){var macroModeState=vimGlobalState.macroModeState;if(macroModeState.onRecordingDone){macroModeState.onRecordingDone(); // close dialog
}macroModeState.onRecordingDone = undefined;macroModeState.isRecording = false;},enterMacroRecordMode:function enterMacroRecordMode(cm,registerName){var register=vimGlobalState.registerController.getRegister(registerName);if(register){register.clear();this.latestRegister = registerName;if(cm.openDialog){this.onRecordingDone = cm.openDialog('(recording)[' + registerName + ']',null,{bottom:true});}this.isRecording = true;}}};function maybeInitVimState(cm){if(!cm.state.vim){ // Store instance state in the CodeMirror object.
cm.state.vim = {inputState:new InputState(), // Vim's input state that triggered the last edit, used to repeat
// motions and operators with '.'.
lastEditInputState:undefined, // Vim's action command before the last edit, used to repeat actions
// with '.' and insert mode repeat.
lastEditActionCommand:undefined, // When using jk for navigation, if you move from a longer line to a
// shorter line, the cursor may clip to the end of the shorter line.
// If j is pressed again and cursor goes to the next line, the
// cursor should go back to its horizontal position on the longer
// line if it can. This is to keep track of the horizontal position.
lastHPos:-1, // Doing the same with screen-position for gj/gk
lastHSPos:-1, // The last motion command run. Cleared if a non-motion command gets
// executed in between.
lastMotion:null,marks:{}, // Mark for rendering fake cursor for visual mode.
fakeCursor:null,insertMode:false, // Repeat count for changes made in insert mode, triggered by key
// sequences like 3,i. Only exists when insertMode is true.
insertModeRepeat:undefined,visualMode:false, // If we are in visual line mode. No effect if visualMode is false.
visualLine:false,visualBlock:false,lastSelection:null,lastPastedText:null,sel:{}};}return cm.state.vim;}var vimGlobalState;function resetVimGlobalState(){vimGlobalState = { // The current search query.
searchQuery:null, // Whether we are searching backwards.
searchIsReversed:false, // Replace part of the last substituted pattern
lastSubstituteReplacePart:undefined,jumpList:createCircularJumpList(),macroModeState:new MacroModeState(), // Recording latest f, t, F or T motion command.
lastChararacterSearch:{increment:0,forward:true,selectedCharacter:''},registerController:new RegisterController({}), // search history buffer
searchHistoryController:new HistoryController({}), // ex Command history buffer
exCommandHistoryController:new HistoryController({})};for(var optionName in options) {var option=options[optionName];option.value = option.defaultValue;}}var lastInsertModeKeyTimer;var vimApi={buildKeyMap:function buildKeyMap(){ // TODO: Convert keymap into dictionary format for fast lookup.
}, // Testing hook, though it might be useful to expose the register
// controller anyways.
getRegisterController:function getRegisterController(){return vimGlobalState.registerController;}, // Testing hook.
resetVimGlobalState_:resetVimGlobalState, // Testing hook.
getVimGlobalState_:function getVimGlobalState_(){return vimGlobalState;}, // Testing hook.
maybeInitVimState_:maybeInitVimState,suppressErrorLogging:false,InsertModeKey:InsertModeKey,map:function map(lhs,rhs,ctx){ // Add user defined key bindings.
exCommandDispatcher.map(lhs,rhs,ctx);},setOption:setOption,getOption:getOption,defineOption:defineOption,defineEx:function defineEx(name,prefix,func){if(name.indexOf(prefix) !== 0){throw new Error('(Vim.defineEx) "' + prefix + '" is not a prefix of "' + name + '", command not registered');}exCommands[name] = func;exCommandDispatcher.commandMap_[prefix] = {name:name,shortName:prefix,type:'api'};},handleKey:function handleKey(cm,key,origin){var command=this.findKey(cm,key,origin);if(typeof command === 'function'){return command();}}, /**
       * This is the outermost function called by CodeMirror, after keys have
       * been mapped to their Vim equivalents.
       *
       * Finds a command based on the key (and cached keys if there is a
       * multi-key sequence). Returns `undefined` if no key is matched, a noop
       * function if a partial match is found (multi-key), and a function to
       * execute the bound command if a a key is matched. The function always
       * returns true.
       */findKey:function findKey(cm,key,origin){var vim=maybeInitVimState(cm);function handleMacroRecording(){var macroModeState=vimGlobalState.macroModeState;if(macroModeState.isRecording){if(key == 'q'){macroModeState.exitMacroRecordMode();clearInputState(cm);return true;}if(origin != 'mapping'){logKey(macroModeState,key);}}}function handleEsc(){if(key == '<Esc>'){ // Clear input state and get back to normal mode.
clearInputState(cm);if(vim.visualMode){exitVisualMode(cm);}else if(vim.insertMode){exitInsertMode(cm);}return true;}}function doKeyToKey(keys){ // TODO: prevent infinite recursion.
var match;while(keys) { // Pull off one command key, which is either a single character
// or a special sequence wrapped in '<' and '>', e.g. '<Space>'.
match = /<\w+-.+?>|<\w+>|./.exec(keys);key = match[0];keys = keys.substring(match.index + key.length);CodeMirror.Vim.handleKey(cm,key,'mapping');}}function handleKeyInsertMode(){if(handleEsc()){return true;}var keys=vim.inputState.keyBuffer = vim.inputState.keyBuffer + key;var keysAreChars=key.length == 1;var match=commandDispatcher.matchCommand(keys,defaultKeymap,vim.inputState,'insert'); // Need to check all key substrings in insert mode.
while(keys.length > 1 && match.type != 'full') {var keys=vim.inputState.keyBuffer = keys.slice(1);var thisMatch=commandDispatcher.matchCommand(keys,defaultKeymap,vim.inputState,'insert');if(thisMatch.type != 'none'){match = thisMatch;}}if(match.type == 'none'){clearInputState(cm);return false;}else if(match.type == 'partial'){if(lastInsertModeKeyTimer){window.clearTimeout(lastInsertModeKeyTimer);}lastInsertModeKeyTimer = window.setTimeout(function(){if(vim.insertMode && vim.inputState.keyBuffer){clearInputState(cm);}},getOption('insertModeEscKeysTimeout'));return !keysAreChars;}if(lastInsertModeKeyTimer){window.clearTimeout(lastInsertModeKeyTimer);}if(keysAreChars){var here=cm.getCursor();cm.replaceRange('',offsetCursor(here,0,-(keys.length - 1)),here,'+input');}clearInputState(cm);return match.command;}function handleKeyNonInsertMode(){if(handleMacroRecording() || handleEsc()){return true;};var keys=vim.inputState.keyBuffer = vim.inputState.keyBuffer + key;if(/^[1-9]\d*$/.test(keys)){return true;}var keysMatcher=/^(\d*)(.*)$/.exec(keys);if(!keysMatcher){clearInputState(cm);return false;}var context=vim.visualMode?'visual':'normal';var match=commandDispatcher.matchCommand(keysMatcher[2] || keysMatcher[1],defaultKeymap,vim.inputState,context);if(match.type == 'none'){clearInputState(cm);return false;}else if(match.type == 'partial'){return true;}vim.inputState.keyBuffer = '';var keysMatcher=/^(\d*)(.*)$/.exec(keys);if(keysMatcher[1] && keysMatcher[1] != '0'){vim.inputState.pushRepeatDigit(keysMatcher[1]);}return match.command;}var command;if(vim.insertMode){command = handleKeyInsertMode();}else {command = handleKeyNonInsertMode();}if(command === false){return undefined;}else if(command === true){ // TODO: Look into using CodeMirror's multi-key handling.
// Return no-op since we are caching the key. Counts as handled, but
// don't want act on it just yet.
return function(){};}else {return function(){return cm.operation(function(){cm.curOp.isVimOp = true;try{if(command.type == 'keyToKey'){doKeyToKey(command.toKeys);}else {commandDispatcher.processCommand(cm,vim,command);}}catch(e) { // clear VIM state in case it's in a bad state.
cm.state.vim = undefined;maybeInitVimState(cm);if(!CodeMirror.Vim.suppressErrorLogging){console['log'](e);}throw e;}return true;});};}},handleEx:function handleEx(cm,input){exCommandDispatcher.processCommand(cm,input);},defineMotion:defineMotion,defineAction:defineAction,defineOperator:defineOperator,mapCommand:mapCommand,_mapCommand:_mapCommand,exitVisualMode:exitVisualMode,exitInsertMode:exitInsertMode}; // Represents the current input state.
function InputState(){this.prefixRepeat = [];this.motionRepeat = [];this.operator = null;this.operatorArgs = null;this.motion = null;this.motionArgs = null;this.keyBuffer = []; // For matching multi-key commands.
this.registerName = null; // Defaults to the unnamed register.
}InputState.prototype.pushRepeatDigit = function(n){if(!this.operator){this.prefixRepeat = this.prefixRepeat.concat(n);}else {this.motionRepeat = this.motionRepeat.concat(n);}};InputState.prototype.getRepeat = function(){var repeat=0;if(this.prefixRepeat.length > 0 || this.motionRepeat.length > 0){repeat = 1;if(this.prefixRepeat.length > 0){repeat *= parseInt(this.prefixRepeat.join(''),10);}if(this.motionRepeat.length > 0){repeat *= parseInt(this.motionRepeat.join(''),10);}}return repeat;};function clearInputState(cm,reason){cm.state.vim.inputState = new InputState();CodeMirror.signal(cm,'vim-command-done',reason);} /*
     * Register stores information about copy and paste registers.  Besides
     * text, a register must store whether it is linewise (i.e., when it is
     * pasted, should it insert itself into a new line, or should the text be
     * inserted at the cursor position.)
     */function Register(text,linewise,blockwise){this.clear();this.keyBuffer = [text || ''];this.insertModeChanges = [];this.searchQueries = [];this.linewise = !!linewise;this.blockwise = !!blockwise;}Register.prototype = {setText:function setText(text,linewise,blockwise){this.keyBuffer = [text || ''];this.linewise = !!linewise;this.blockwise = !!blockwise;},pushText:function pushText(text,linewise){ // if this register has ever been set to linewise, use linewise.
if(linewise){if(!this.linewise){this.keyBuffer.push('\n');}this.linewise = true;}this.keyBuffer.push(text);},pushInsertModeChanges:function pushInsertModeChanges(changes){this.insertModeChanges.push(createInsertModeChanges(changes));},pushSearchQuery:function pushSearchQuery(query){this.searchQueries.push(query);},clear:function clear(){this.keyBuffer = [];this.insertModeChanges = [];this.searchQueries = [];this.linewise = false;},toString:function toString(){return this.keyBuffer.join('');}}; /*
     * vim registers allow you to keep many independent copy and paste buffers.
     * See http://usevim.com/2012/04/13/registers/ for an introduction.
     *
     * RegisterController keeps the state of all the registers.  An initial
     * state may be passed in.  The unnamed register '"' will always be
     * overridden.
     */function RegisterController(registers){this.registers = registers;this.unnamedRegister = registers['"'] = new Register();registers['.'] = new Register();registers[':'] = new Register();registers['/'] = new Register();}RegisterController.prototype = {pushText:function pushText(registerName,operator,text,linewise,blockwise){if(linewise && text.charAt(0) == '\n'){text = text.slice(1) + '\n';}if(linewise && text.charAt(text.length - 1) !== '\n'){text += '\n';} // Lowercase and uppercase registers refer to the same register.
// Uppercase just means append.
var register=this.isValidRegister(registerName)?this.getRegister(registerName):null; // if no register/an invalid register was specified, things go to the
// default registers
if(!register){switch(operator){case 'yank': // The 0 register contains the text from the most recent yank.
this.registers['0'] = new Register(text,linewise,blockwise);break;case 'delete':case 'change':if(text.indexOf('\n') == -1){ // Delete less than 1 line. Update the small delete register.
this.registers['-'] = new Register(text,linewise);}else { // Shift down the contents of the numbered registers and put the
// deleted text into register 1.
this.shiftNumericRegisters_();this.registers['1'] = new Register(text,linewise);}break;} // Make sure the unnamed register is set to what just happened
this.unnamedRegister.setText(text,linewise,blockwise);return;} // If we've gotten to this point, we've actually specified a register
var append=isUpperCase(registerName);if(append){register.pushText(text,linewise);}else {register.setText(text,linewise,blockwise);} // The unnamed register always has the same value as the last used
// register.
this.unnamedRegister.setText(register.toString(),linewise);}, // Gets the register named @name.  If one of @name doesn't already exist,
// create it.  If @name is invalid, return the unnamedRegister.
getRegister:function getRegister(name){if(!this.isValidRegister(name)){return this.unnamedRegister;}name = name.toLowerCase();if(!this.registers[name]){this.registers[name] = new Register();}return this.registers[name];},isValidRegister:function isValidRegister(name){return name && inArray(name,validRegisters);},shiftNumericRegisters_:function shiftNumericRegisters_(){for(var i=9;i >= 2;i--) {this.registers[i] = this.getRegister('' + (i - 1));}}};function HistoryController(){this.historyBuffer = [];this.iterator;this.initialPrefix = null;}HistoryController.prototype = { // the input argument here acts a user entered prefix for a small time
// until we start autocompletion in which case it is the autocompleted.
nextMatch:function nextMatch(input,up){var historyBuffer=this.historyBuffer;var dir=up?-1:1;if(this.initialPrefix === null)this.initialPrefix = input;for(var i=this.iterator + dir;up?i >= 0:i < historyBuffer.length;i += dir) {var element=historyBuffer[i];for(var j=0;j <= element.length;j++) {if(this.initialPrefix == element.substring(0,j)){this.iterator = i;return element;}}} // should return the user input in case we reach the end of buffer.
if(i >= historyBuffer.length){this.iterator = historyBuffer.length;return this.initialPrefix;} // return the last autocompleted query or exCommand as it is.
if(i < 0)return input;},pushInput:function pushInput(input){var index=this.historyBuffer.indexOf(input);if(index > -1)this.historyBuffer.splice(index,1);if(input.length)this.historyBuffer.push(input);},reset:function reset(){this.initialPrefix = null;this.iterator = this.historyBuffer.length;}};var commandDispatcher={matchCommand:function matchCommand(keys,keyMap,inputState,context){var matches=commandMatches(keys,keyMap,context,inputState);if(!matches.full && !matches.partial){return {type:'none'};}else if(!matches.full && matches.partial){return {type:'partial'};}var bestMatch;for(var i=0;i < matches.full.length;i++) {var match=matches.full[i];if(!bestMatch){bestMatch = match;}}if(bestMatch.keys.slice(-11) == '<character>'){inputState.selectedCharacter = lastChar(keys);}return {type:'full',command:bestMatch};},processCommand:function processCommand(cm,vim,command){vim.inputState.repeatOverride = command.repeatOverride;switch(command.type){case 'motion':this.processMotion(cm,vim,command);break;case 'operator':this.processOperator(cm,vim,command);break;case 'operatorMotion':this.processOperatorMotion(cm,vim,command);break;case 'action':this.processAction(cm,vim,command);break;case 'search':this.processSearch(cm,vim,command);break;case 'ex':case 'keyToEx':this.processEx(cm,vim,command);break;default:break;}},processMotion:function processMotion(cm,vim,command){vim.inputState.motion = command.motion;vim.inputState.motionArgs = copyArgs(command.motionArgs);this.evalInput(cm,vim);},processOperator:function processOperator(cm,vim,command){var inputState=vim.inputState;if(inputState.operator){if(inputState.operator == command.operator){ // Typing an operator twice like 'dd' makes the operator operate
// linewise
inputState.motion = 'expandToLine';inputState.motionArgs = {linewise:true};this.evalInput(cm,vim);return;}else { // 2 different operators in a row doesn't make sense.
clearInputState(cm);}}inputState.operator = command.operator;inputState.operatorArgs = copyArgs(command.operatorArgs);if(vim.visualMode){ // Operating on a selection in visual mode. We don't need a motion.
this.evalInput(cm,vim);}},processOperatorMotion:function processOperatorMotion(cm,vim,command){var visualMode=vim.visualMode;var operatorMotionArgs=copyArgs(command.operatorMotionArgs);if(operatorMotionArgs){ // Operator motions may have special behavior in visual mode.
if(visualMode && operatorMotionArgs.visualLine){vim.visualLine = true;}}this.processOperator(cm,vim,command);if(!visualMode){this.processMotion(cm,vim,command);}},processAction:function processAction(cm,vim,command){var inputState=vim.inputState;var repeat=inputState.getRepeat();var repeatIsExplicit=!!repeat;var actionArgs=copyArgs(command.actionArgs) || {};if(inputState.selectedCharacter){actionArgs.selectedCharacter = inputState.selectedCharacter;} // Actions may or may not have motions and operators. Do these first.
if(command.operator){this.processOperator(cm,vim,command);}if(command.motion){this.processMotion(cm,vim,command);}if(command.motion || command.operator){this.evalInput(cm,vim);}actionArgs.repeat = repeat || 1;actionArgs.repeatIsExplicit = repeatIsExplicit;actionArgs.registerName = inputState.registerName;clearInputState(cm);vim.lastMotion = null;if(command.isEdit){this.recordLastEdit(vim,inputState,command);}actions[command.action](cm,actionArgs,vim);},processSearch:function processSearch(cm,vim,command){if(!cm.getSearchCursor){ // Search depends on SearchCursor.
return;}var forward=command.searchArgs.forward;var wholeWordOnly=command.searchArgs.wholeWordOnly;getSearchState(cm).setReversed(!forward);var promptPrefix=forward?'/':'?';var originalQuery=getSearchState(cm).getQuery();var originalScrollPos=cm.getScrollInfo();function handleQuery(query,ignoreCase,smartCase){vimGlobalState.searchHistoryController.pushInput(query);vimGlobalState.searchHistoryController.reset();try{updateSearchQuery(cm,query,ignoreCase,smartCase);}catch(e) {showConfirm(cm,'Invalid regex: ' + query);clearInputState(cm);return;}commandDispatcher.processMotion(cm,vim,{type:'motion',motion:'findNext',motionArgs:{forward:true,toJumplist:command.searchArgs.toJumplist}});}function onPromptClose(query){cm.scrollTo(originalScrollPos.left,originalScrollPos.top);handleQuery(query,true, /** ignoreCase */true /** smartCase */);var macroModeState=vimGlobalState.macroModeState;if(macroModeState.isRecording){logSearchQuery(macroModeState,query);}}function onPromptKeyUp(e,query,close){var keyName=CodeMirror.keyName(e),up;if(keyName == 'Up' || keyName == 'Down'){up = keyName == 'Up'?true:false;query = vimGlobalState.searchHistoryController.nextMatch(query,up) || '';close(query);}else {if(keyName != 'Left' && keyName != 'Right' && keyName != 'Ctrl' && keyName != 'Alt' && keyName != 'Shift')vimGlobalState.searchHistoryController.reset();}var parsedQuery;try{parsedQuery = updateSearchQuery(cm,query,true, /** ignoreCase */true /** smartCase */);}catch(e) { // Swallow bad regexes for incremental search.
}if(parsedQuery){cm.scrollIntoView(_findNext(cm,!forward,parsedQuery),30);}else {clearSearchHighlight(cm);cm.scrollTo(originalScrollPos.left,originalScrollPos.top);}}function onPromptKeyDown(e,query,close){var keyName=CodeMirror.keyName(e);if(keyName == 'Esc' || keyName == 'Ctrl-C' || keyName == 'Ctrl-['){vimGlobalState.searchHistoryController.pushInput(query);vimGlobalState.searchHistoryController.reset();updateSearchQuery(cm,originalQuery);clearSearchHighlight(cm);cm.scrollTo(originalScrollPos.left,originalScrollPos.top);CodeMirror.e_stop(e);clearInputState(cm);close();cm.focus();}}switch(command.searchArgs.querySrc){case 'prompt':var macroModeState=vimGlobalState.macroModeState;if(macroModeState.isPlaying){var query=macroModeState.replaySearchQueries.shift();handleQuery(query,true, /** ignoreCase */false /** smartCase */);}else {showPrompt(cm,{onClose:onPromptClose,prefix:promptPrefix,desc:searchPromptDesc,onKeyUp:onPromptKeyUp,onKeyDown:onPromptKeyDown});}break;case 'wordUnderCursor':var word=expandWordUnderCursor(cm,false, /** inclusive */true, /** forward */false, /** bigWord */true /** noSymbol */);var isKeyword=true;if(!word){word = expandWordUnderCursor(cm,false, /** inclusive */true, /** forward */false, /** bigWord */false /** noSymbol */);isKeyword = false;}if(!word){return;}var query=cm.getLine(word.start.line).substring(word.start.ch,word.end.ch);if(isKeyword && wholeWordOnly){query = '\\b' + query + '\\b';}else {query = escapeRegex(query);} // cachedCursor is used to save the old position of the cursor
// when * or # causes vim to seek for the nearest word and shift
// the cursor before entering the motion.
vimGlobalState.jumpList.cachedCursor = cm.getCursor();cm.setCursor(word.start);handleQuery(query,true, /** ignoreCase */false /** smartCase */);break;}},processEx:function processEx(cm,vim,command){function onPromptClose(input){ // Give the prompt some time to close so that if processCommand shows
// an error, the elements don't overlap.
vimGlobalState.exCommandHistoryController.pushInput(input);vimGlobalState.exCommandHistoryController.reset();exCommandDispatcher.processCommand(cm,input);}function onPromptKeyDown(e,input,close){var keyName=CodeMirror.keyName(e),up;if(keyName == 'Esc' || keyName == 'Ctrl-C' || keyName == 'Ctrl-['){vimGlobalState.exCommandHistoryController.pushInput(input);vimGlobalState.exCommandHistoryController.reset();CodeMirror.e_stop(e);clearInputState(cm);close();cm.focus();}if(keyName == 'Up' || keyName == 'Down'){up = keyName == 'Up'?true:false;input = vimGlobalState.exCommandHistoryController.nextMatch(input,up) || '';close(input);}else {if(keyName != 'Left' && keyName != 'Right' && keyName != 'Ctrl' && keyName != 'Alt' && keyName != 'Shift')vimGlobalState.exCommandHistoryController.reset();}}if(command.type == 'keyToEx'){ // Handle user defined Ex to Ex mappings
exCommandDispatcher.processCommand(cm,command.exArgs.input);}else {if(vim.visualMode){showPrompt(cm,{onClose:onPromptClose,prefix:':',value:'\'<,\'>',onKeyDown:onPromptKeyDown});}else {showPrompt(cm,{onClose:onPromptClose,prefix:':',onKeyDown:onPromptKeyDown});}}},evalInput:function evalInput(cm,vim){ // If the motion comand is set, execute both the operator and motion.
// Otherwise return.
var inputState=vim.inputState;var motion=inputState.motion;var motionArgs=inputState.motionArgs || {};var operator=inputState.operator;var operatorArgs=inputState.operatorArgs || {};var registerName=inputState.registerName;var sel=vim.sel; // TODO: Make sure cm and vim selections are identical outside visual mode.
var origHead=copyCursor(vim.visualMode?sel.head:cm.getCursor('head'));var origAnchor=copyCursor(vim.visualMode?sel.anchor:cm.getCursor('anchor'));var oldHead=copyCursor(origHead);var oldAnchor=copyCursor(origAnchor);var newHead,newAnchor;var repeat;if(operator){this.recordLastEdit(vim,inputState);}if(inputState.repeatOverride !== undefined){ // If repeatOverride is specified, that takes precedence over the
// input state's repeat. Used by Ex mode and can be user defined.
repeat = inputState.repeatOverride;}else {repeat = inputState.getRepeat();}if(repeat > 0 && motionArgs.explicitRepeat){motionArgs.repeatIsExplicit = true;}else if(motionArgs.noRepeat || !motionArgs.explicitRepeat && repeat === 0){repeat = 1;motionArgs.repeatIsExplicit = false;}if(inputState.selectedCharacter){ // If there is a character input, stick it in all of the arg arrays.
motionArgs.selectedCharacter = operatorArgs.selectedCharacter = inputState.selectedCharacter;}motionArgs.repeat = repeat;clearInputState(cm);if(motion){var motionResult=motions[motion](cm,origHead,motionArgs,vim);vim.lastMotion = motions[motion];if(!motionResult){return;}if(motionArgs.toJumplist){var jumpList=vimGlobalState.jumpList; // if the current motion is # or *, use cachedCursor
var cachedCursor=jumpList.cachedCursor;if(cachedCursor){recordJumpPosition(cm,cachedCursor,motionResult);delete jumpList.cachedCursor;}else {recordJumpPosition(cm,origHead,motionResult);}}if(motionResult instanceof Array){newAnchor = motionResult[0];newHead = motionResult[1];}else {newHead = motionResult;} // TODO: Handle null returns from motion commands better.
if(!newHead){newHead = copyCursor(origHead);}if(vim.visualMode){if(!(vim.visualBlock && newHead.ch === Infinity)){newHead = clipCursorToContent(cm,newHead,vim.visualBlock);}if(newAnchor){newAnchor = clipCursorToContent(cm,newAnchor,true);}newAnchor = newAnchor || oldAnchor;sel.anchor = newAnchor;sel.head = newHead;updateCmSelection(cm);updateMark(cm,vim,'<',cursorIsBefore(newAnchor,newHead)?newAnchor:newHead);updateMark(cm,vim,'>',cursorIsBefore(newAnchor,newHead)?newHead:newAnchor);}else if(!operator){newHead = clipCursorToContent(cm,newHead);cm.setCursor(newHead.line,newHead.ch);}}if(operator){if(operatorArgs.lastSel){ // Replaying a visual mode operation
newAnchor = oldAnchor;var lastSel=operatorArgs.lastSel;var lineOffset=Math.abs(lastSel.head.line - lastSel.anchor.line);var chOffset=Math.abs(lastSel.head.ch - lastSel.anchor.ch);if(lastSel.visualLine){ // Linewise Visual mode: The same number of lines.
newHead = Pos(oldAnchor.line + lineOffset,oldAnchor.ch);}else if(lastSel.visualBlock){ // Blockwise Visual mode: The same number of lines and columns.
newHead = Pos(oldAnchor.line + lineOffset,oldAnchor.ch + chOffset);}else if(lastSel.head.line == lastSel.anchor.line){ // Normal Visual mode within one line: The same number of characters.
newHead = Pos(oldAnchor.line,oldAnchor.ch + chOffset);}else { // Normal Visual mode with several lines: The same number of lines, in the
// last line the same number of characters as in the last line the last time.
newHead = Pos(oldAnchor.line + lineOffset,oldAnchor.ch);}vim.visualMode = true;vim.visualLine = lastSel.visualLine;vim.visualBlock = lastSel.visualBlock;sel = vim.sel = {anchor:newAnchor,head:newHead};updateCmSelection(cm);}else if(vim.visualMode){operatorArgs.lastSel = {anchor:copyCursor(sel.anchor),head:copyCursor(sel.head),visualBlock:vim.visualBlock,visualLine:vim.visualLine};}var curStart,curEnd,linewise,mode;var cmSel;if(vim.visualMode){ // Init visual op
curStart = cursorMin(sel.head,sel.anchor);curEnd = cursorMax(sel.head,sel.anchor);linewise = vim.visualLine || operatorArgs.linewise;mode = vim.visualBlock?'block':linewise?'line':'char';cmSel = makeCmSelection(cm,{anchor:curStart,head:curEnd},mode);if(linewise){var ranges=cmSel.ranges;if(mode == 'block'){ // Linewise operators in visual block mode extend to end of line
for(var i=0;i < ranges.length;i++) {ranges[i].head.ch = lineLength(cm,ranges[i].head.line);}}else if(mode == 'line'){ranges[0].head = Pos(ranges[0].head.line + 1,0);}}}else { // Init motion op
curStart = copyCursor(newAnchor || oldAnchor);curEnd = copyCursor(newHead || oldHead);if(cursorIsBefore(curEnd,curStart)){var tmp=curStart;curStart = curEnd;curEnd = tmp;}linewise = motionArgs.linewise || operatorArgs.linewise;if(linewise){ // Expand selection to entire line.
expandSelectionToLine(cm,curStart,curEnd);}else if(motionArgs.forward){ // Clip to trailing newlines only if the motion goes forward.
clipToLine(cm,curStart,curEnd);}mode = 'char';var exclusive=!motionArgs.inclusive || linewise;cmSel = makeCmSelection(cm,{anchor:curStart,head:curEnd},mode,exclusive);}cm.setSelections(cmSel.ranges,cmSel.primary);vim.lastMotion = null;operatorArgs.repeat = repeat; // For indent in visual mode.
operatorArgs.registerName = registerName; // Keep track of linewise as it affects how paste and change behave.
operatorArgs.linewise = linewise;var operatorMoveTo=operators[operator](cm,operatorArgs,cmSel.ranges,oldAnchor,newHead);if(vim.visualMode){exitVisualMode(cm,operatorMoveTo != null);}if(operatorMoveTo){cm.setCursor(operatorMoveTo);}}},recordLastEdit:function recordLastEdit(vim,inputState,actionCommand){var macroModeState=vimGlobalState.macroModeState;if(macroModeState.isPlaying){return;}vim.lastEditInputState = inputState;vim.lastEditActionCommand = actionCommand;macroModeState.lastInsertModeChanges.changes = [];macroModeState.lastInsertModeChanges.expectCursorActivityForChange = false;}}; /**
     * typedef {Object{line:number,ch:number}} Cursor An object containing the
     *     position of the cursor.
     */ // All of the functions below return Cursor objects.
var motions={moveToTopLine:function moveToTopLine(cm,_head,motionArgs){var line=getUserVisibleLines(cm).top + motionArgs.repeat - 1;return Pos(line,findFirstNonWhiteSpaceCharacter(cm.getLine(line)));},moveToMiddleLine:function moveToMiddleLine(cm){var range=getUserVisibleLines(cm);var line=Math.floor((range.top + range.bottom) * 0.5);return Pos(line,findFirstNonWhiteSpaceCharacter(cm.getLine(line)));},moveToBottomLine:function moveToBottomLine(cm,_head,motionArgs){var line=getUserVisibleLines(cm).bottom - motionArgs.repeat + 1;return Pos(line,findFirstNonWhiteSpaceCharacter(cm.getLine(line)));},expandToLine:function expandToLine(_cm,head,motionArgs){ // Expands forward to end of line, and then to next line if repeat is
// >1. Does not handle backward motion!
var cur=head;return Pos(cur.line + motionArgs.repeat - 1,Infinity);},findNext:function findNext(cm,_head,motionArgs){var state=getSearchState(cm);var query=state.getQuery();if(!query){return;}var prev=!motionArgs.forward; // If search is initiated with ? instead of /, negate direction.
prev = state.isReversed()?!prev:prev;highlightSearchMatches(cm,query);return _findNext(cm,prev, /** prev */query,motionArgs.repeat);},goToMark:function goToMark(cm,_head,motionArgs,vim){var mark=vim.marks[motionArgs.selectedCharacter];if(mark){var pos=mark.find();return motionArgs.linewise?{line:pos.line,ch:findFirstNonWhiteSpaceCharacter(cm.getLine(pos.line))}:pos;}return null;},moveToOtherHighlightedEnd:function moveToOtherHighlightedEnd(cm,_head,motionArgs,vim){if(vim.visualBlock && motionArgs.sameLine){var sel=vim.sel;return [clipCursorToContent(cm,Pos(sel.anchor.line,sel.head.ch)),clipCursorToContent(cm,Pos(sel.head.line,sel.anchor.ch))];}else {return [vim.sel.head,vim.sel.anchor];}},jumpToMark:function jumpToMark(cm,head,motionArgs,vim){var best=head;for(var i=0;i < motionArgs.repeat;i++) {var cursor=best;for(var key in vim.marks) {if(!isLowerCase(key)){continue;}var mark=vim.marks[key].find();var isWrongDirection=motionArgs.forward?cursorIsBefore(mark,cursor):cursorIsBefore(cursor,mark);if(isWrongDirection){continue;}if(motionArgs.linewise && mark.line == cursor.line){continue;}var equal=cursorEqual(cursor,best);var between=motionArgs.forward?cursorIsBetween(cursor,mark,best):cursorIsBetween(best,mark,cursor);if(equal || between){best = mark;}}}if(motionArgs.linewise){ // Vim places the cursor on the first non-whitespace character of
// the line if there is one, else it places the cursor at the end
// of the line, regardless of whether a mark was found.
best = Pos(best.line,findFirstNonWhiteSpaceCharacter(cm.getLine(best.line)));}return best;},moveByCharacters:function moveByCharacters(_cm,head,motionArgs){var cur=head;var repeat=motionArgs.repeat;var ch=motionArgs.forward?cur.ch + repeat:cur.ch - repeat;return Pos(cur.line,ch);},moveByLines:function moveByLines(cm,head,motionArgs,vim){var cur=head;var endCh=cur.ch; // Depending what our last motion was, we may want to do different
// things. If our last motion was moving vertically, we want to
// preserve the HPos from our last horizontal move.  If our last motion
// was going to the end of a line, moving vertically we should go to
// the end of the line, etc.
switch(vim.lastMotion){case this.moveByLines:case this.moveByDisplayLines:case this.moveByScroll:case this.moveToColumn:case this.moveToEol:endCh = vim.lastHPos;break;default:vim.lastHPos = endCh;}var repeat=motionArgs.repeat + (motionArgs.repeatOffset || 0);var line=motionArgs.forward?cur.line + repeat:cur.line - repeat;var first=cm.firstLine();var last=cm.lastLine(); // Vim cancels linewise motions that start on an edge and move beyond
// that edge. It does not cancel motions that do not start on an edge.
if(line < first && cur.line == first || line > last && cur.line == last){return;}if(motionArgs.toFirstChar){endCh = findFirstNonWhiteSpaceCharacter(cm.getLine(line));vim.lastHPos = endCh;}vim.lastHSPos = cm.charCoords(Pos(line,endCh),'div').left;return Pos(line,endCh);},moveByDisplayLines:function moveByDisplayLines(cm,head,motionArgs,vim){var cur=head;switch(vim.lastMotion){case this.moveByDisplayLines:case this.moveByScroll:case this.moveByLines:case this.moveToColumn:case this.moveToEol:break;default:vim.lastHSPos = cm.charCoords(cur,'div').left;}var repeat=motionArgs.repeat;var res=cm.findPosV(cur,motionArgs.forward?repeat:-repeat,'line',vim.lastHSPos);if(res.hitSide){if(motionArgs.forward){var lastCharCoords=cm.charCoords(res,'div');var goalCoords={top:lastCharCoords.top + 8,left:vim.lastHSPos};var res=cm.coordsChar(goalCoords,'div');}else {var resCoords=cm.charCoords(Pos(cm.firstLine(),0),'div');resCoords.left = vim.lastHSPos;res = cm.coordsChar(resCoords,'div');}}vim.lastHPos = res.ch;return res;},moveByPage:function moveByPage(cm,head,motionArgs){ // CodeMirror only exposes functions that move the cursor page down, so
// doing this bad hack to move the cursor and move it back. evalInput
// will move the cursor to where it should be in the end.
var curStart=head;var repeat=motionArgs.repeat;return cm.findPosV(curStart,motionArgs.forward?repeat:-repeat,'page');},moveByParagraph:function moveByParagraph(cm,head,motionArgs){var dir=motionArgs.forward?1:-1;return findParagraph(cm,head,motionArgs.repeat,dir);},moveByScroll:function moveByScroll(cm,head,motionArgs,vim){var scrollbox=cm.getScrollInfo();var curEnd=null;var repeat=motionArgs.repeat;if(!repeat){repeat = scrollbox.clientHeight / (2 * cm.defaultTextHeight());}var orig=cm.charCoords(head,'local');motionArgs.repeat = repeat;var curEnd=motions.moveByDisplayLines(cm,head,motionArgs,vim);if(!curEnd){return null;}var dest=cm.charCoords(curEnd,'local');cm.scrollTo(null,scrollbox.top + dest.top - orig.top);return curEnd;},moveByWords:function moveByWords(cm,head,motionArgs){return moveToWord(cm,head,motionArgs.repeat,!!motionArgs.forward,!!motionArgs.wordEnd,!!motionArgs.bigWord);},moveTillCharacter:function moveTillCharacter(cm,_head,motionArgs){var repeat=motionArgs.repeat;var curEnd=_moveToCharacter(cm,repeat,motionArgs.forward,motionArgs.selectedCharacter);var increment=motionArgs.forward?-1:1;recordLastCharacterSearch(increment,motionArgs);if(!curEnd)return null;curEnd.ch += increment;return curEnd;},moveToCharacter:function moveToCharacter(cm,head,motionArgs){var repeat=motionArgs.repeat;recordLastCharacterSearch(0,motionArgs);return _moveToCharacter(cm,repeat,motionArgs.forward,motionArgs.selectedCharacter) || head;},moveToSymbol:function moveToSymbol(cm,head,motionArgs){var repeat=motionArgs.repeat;return findSymbol(cm,repeat,motionArgs.forward,motionArgs.selectedCharacter) || head;},moveToColumn:function moveToColumn(cm,head,motionArgs,vim){var repeat=motionArgs.repeat; // repeat is equivalent to which column we want to move to!
vim.lastHPos = repeat - 1;vim.lastHSPos = cm.charCoords(head,'div').left;return _moveToColumn(cm,repeat);},moveToEol:function moveToEol(cm,head,motionArgs,vim){var cur=head;vim.lastHPos = Infinity;var retval=Pos(cur.line + motionArgs.repeat - 1,Infinity);var end=cm.clipPos(retval);end.ch--;vim.lastHSPos = cm.charCoords(end,'div').left;return retval;},moveToFirstNonWhiteSpaceCharacter:function moveToFirstNonWhiteSpaceCharacter(cm,head){ // Go to the start of the line where the text begins, or the end for
// whitespace-only lines
var cursor=head;return Pos(cursor.line,findFirstNonWhiteSpaceCharacter(cm.getLine(cursor.line)));},moveToMatchedSymbol:function moveToMatchedSymbol(cm,head){var cursor=head;var line=cursor.line;var ch=cursor.ch;var lineText=cm.getLine(line);var symbol;do {symbol = lineText.charAt(ch++);if(symbol && isMatchableSymbol(symbol)){var style=cm.getTokenTypeAt(Pos(line,ch));if(style !== "string" && style !== "comment"){break;}}}while(symbol);if(symbol){var matched=cm.findMatchingBracket(Pos(line,ch));return matched.to;}else {return cursor;}},moveToStartOfLine:function moveToStartOfLine(_cm,head){return Pos(head.line,0);},moveToLineOrEdgeOfDocument:function moveToLineOrEdgeOfDocument(cm,_head,motionArgs){var lineNum=motionArgs.forward?cm.lastLine():cm.firstLine();if(motionArgs.repeatIsExplicit){lineNum = motionArgs.repeat - cm.getOption('firstLineNumber');}return Pos(lineNum,findFirstNonWhiteSpaceCharacter(cm.getLine(lineNum)));},textObjectManipulation:function textObjectManipulation(cm,head,motionArgs,vim){ // TODO: lots of possible exceptions that can be thrown here. Try da(
//     outside of a () block.
// TODO: adding <> >< to this map doesn't work, presumably because
// they're operators
var mirroredPairs={'(':')',')':'(','{':'}','}':'{','[':']',']':'['};var selfPaired={'\'':true,'"':true};var character=motionArgs.selectedCharacter; // 'b' refers to  '()' block.
// 'B' refers to  '{}' block.
if(character == 'b'){character = '(';}else if(character == 'B'){character = '{';} // Inclusive is the difference between a and i
// TODO: Instead of using the additional text object map to perform text
//     object operations, merge the map into the defaultKeyMap and use
//     motionArgs to define behavior. Define separate entries for 'aw',
//     'iw', 'a[', 'i[', etc.
var inclusive=!motionArgs.textObjectInner;var tmp;if(mirroredPairs[character]){tmp = selectCompanionObject(cm,head,character,inclusive);}else if(selfPaired[character]){tmp = findBeginningAndEnd(cm,head,character,inclusive);}else if(character === 'W'){tmp = expandWordUnderCursor(cm,inclusive,true, /** forward */true /** bigWord */);}else if(character === 'w'){tmp = expandWordUnderCursor(cm,inclusive,true, /** forward */false /** bigWord */);}else if(character === 'p'){tmp = findParagraph(cm,head,motionArgs.repeat,0,inclusive);motionArgs.linewise = true;if(vim.visualMode){if(!vim.visualLine){vim.visualLine = true;}}else {var operatorArgs=vim.inputState.operatorArgs;if(operatorArgs){operatorArgs.linewise = true;}tmp.end.line--;}}else { // No text object defined for this, don't move.
return null;}if(!cm.state.vim.visualMode){return [tmp.start,tmp.end];}else {return expandSelection(cm,tmp.start,tmp.end);}},repeatLastCharacterSearch:function repeatLastCharacterSearch(cm,head,motionArgs){var lastSearch=vimGlobalState.lastChararacterSearch;var repeat=motionArgs.repeat;var forward=motionArgs.forward === lastSearch.forward;var increment=(lastSearch.increment?1:0) * (forward?-1:1);cm.moveH(-increment,'char');motionArgs.inclusive = forward?true:false;var curEnd=_moveToCharacter(cm,repeat,forward,lastSearch.selectedCharacter);if(!curEnd){cm.moveH(increment,'char');return head;}curEnd.ch += increment;return curEnd;}};function defineMotion(name,fn){motions[name] = fn;}function fillArray(val,times){var arr=[];for(var i=0;i < times;i++) {arr.push(val);}return arr;} /**
     * An operator acts on a text selection. It receives the list of selections
     * as input. The corresponding CodeMirror selection is guaranteed to
    * match the input selection.
     */var operators={change:function change(cm,args,ranges){var finalHead,text;var vim=cm.state.vim;vimGlobalState.macroModeState.lastInsertModeChanges.inVisualBlock = vim.visualBlock;if(!vim.visualMode){var anchor=ranges[0].anchor,head=ranges[0].head;text = cm.getRange(anchor,head);if(!isWhiteSpaceString(text)){ // Exclude trailing whitespace if the range is not all whitespace.
var match=/\s+$/.exec(text);if(match){head = offsetCursor(head,0,-match[0].length);text = text.slice(0,-match[0].length);}}var wasLastLine=head.line - 1 == cm.lastLine();cm.replaceRange('',anchor,head);if(args.linewise && !wasLastLine){ // Push the next line back down, if there is a next line.
CodeMirror.commands.newlineAndIndent(cm); // null ch so setCursor moves to end of line.
anchor.ch = null;}finalHead = anchor;}else {text = cm.getSelection();var replacement=fillArray('',ranges.length);cm.replaceSelections(replacement);finalHead = cursorMin(ranges[0].head,ranges[0].anchor);}vimGlobalState.registerController.pushText(args.registerName,'change',text,args.linewise,ranges.length > 1);actions.enterInsertMode(cm,{head:finalHead},cm.state.vim);}, // delete is a javascript keyword.
'delete':function _delete(cm,args,ranges){var finalHead,text;var vim=cm.state.vim;if(!vim.visualBlock){var anchor=ranges[0].anchor,head=ranges[0].head;if(args.linewise && head.line != cm.firstLine() && anchor.line == cm.lastLine() && anchor.line == head.line - 1){ // Special case for dd on last line (and first line).
if(anchor.line == cm.firstLine()){anchor.ch = 0;}else {anchor = Pos(anchor.line - 1,lineLength(cm,anchor.line - 1));}}text = cm.getRange(anchor,head);cm.replaceRange('',anchor,head);finalHead = anchor;if(args.linewise){finalHead = motions.moveToFirstNonWhiteSpaceCharacter(cm,anchor);}}else {text = cm.getSelection();var replacement=fillArray('',ranges.length);cm.replaceSelections(replacement);finalHead = ranges[0].anchor;}vimGlobalState.registerController.pushText(args.registerName,'delete',text,args.linewise,vim.visualBlock);return clipCursorToContent(cm,finalHead);},indent:function indent(cm,args,ranges){var vim=cm.state.vim;var startLine=ranges[0].anchor.line;var endLine=vim.visualBlock?ranges[ranges.length - 1].anchor.line:ranges[0].head.line; // In visual mode, n> shifts the selection right n times, instead of
// shifting n lines right once.
var repeat=vim.visualMode?args.repeat:1;if(args.linewise){ // The only way to delete a newline is to delete until the start of
// the next line, so in linewise mode evalInput will include the next
// line. We don't want this in indent, so we go back a line.
endLine--;}for(var i=startLine;i <= endLine;i++) {for(var j=0;j < repeat;j++) {cm.indentLine(i,args.indentRight);}}return motions.moveToFirstNonWhiteSpaceCharacter(cm,ranges[0].anchor);},changeCase:function changeCase(cm,args,ranges,oldAnchor,newHead){var selections=cm.getSelections();var swapped=[];var toLower=args.toLower;for(var j=0;j < selections.length;j++) {var toSwap=selections[j];var text='';if(toLower === true){text = toSwap.toLowerCase();}else if(toLower === false){text = toSwap.toUpperCase();}else {for(var i=0;i < toSwap.length;i++) {var character=toSwap.charAt(i);text += isUpperCase(character)?character.toLowerCase():character.toUpperCase();}}swapped.push(text);}cm.replaceSelections(swapped);if(args.shouldMoveCursor){return newHead;}else if(!cm.state.vim.visualMode && args.linewise && ranges[0].anchor.line + 1 == ranges[0].head.line){return motions.moveToFirstNonWhiteSpaceCharacter(cm,oldAnchor);}else if(args.linewise){return oldAnchor;}else {return cursorMin(ranges[0].anchor,ranges[0].head);}},yank:function yank(cm,args,ranges,oldAnchor){var vim=cm.state.vim;var text=cm.getSelection();var endPos=vim.visualMode?cursorMin(vim.sel.anchor,vim.sel.head,ranges[0].head,ranges[0].anchor):oldAnchor;vimGlobalState.registerController.pushText(args.registerName,'yank',text,args.linewise,vim.visualBlock);return endPos;}};function defineOperator(name,fn){operators[name] = fn;}var actions={jumpListWalk:function jumpListWalk(cm,actionArgs,vim){if(vim.visualMode){return;}var repeat=actionArgs.repeat;var forward=actionArgs.forward;var jumpList=vimGlobalState.jumpList;var mark=jumpList.move(cm,forward?repeat:-repeat);var markPos=mark?mark.find():undefined;markPos = markPos?markPos:cm.getCursor();cm.setCursor(markPos);},scroll:function scroll(cm,actionArgs,vim){if(vim.visualMode){return;}var repeat=actionArgs.repeat || 1;var lineHeight=cm.defaultTextHeight();var top=cm.getScrollInfo().top;var delta=lineHeight * repeat;var newPos=actionArgs.forward?top + delta:top - delta;var cursor=copyCursor(cm.getCursor());var cursorCoords=cm.charCoords(cursor,'local');if(actionArgs.forward){if(newPos > cursorCoords.top){cursor.line += (newPos - cursorCoords.top) / lineHeight;cursor.line = Math.ceil(cursor.line);cm.setCursor(cursor);cursorCoords = cm.charCoords(cursor,'local');cm.scrollTo(null,cursorCoords.top);}else { // Cursor stays within bounds.  Just reposition the scroll window.
cm.scrollTo(null,newPos);}}else {var newBottom=newPos + cm.getScrollInfo().clientHeight;if(newBottom < cursorCoords.bottom){cursor.line -= (cursorCoords.bottom - newBottom) / lineHeight;cursor.line = Math.floor(cursor.line);cm.setCursor(cursor);cursorCoords = cm.charCoords(cursor,'local');cm.scrollTo(null,cursorCoords.bottom - cm.getScrollInfo().clientHeight);}else { // Cursor stays within bounds.  Just reposition the scroll window.
cm.scrollTo(null,newPos);}}},scrollToCursor:function scrollToCursor(cm,actionArgs){var lineNum=cm.getCursor().line;var charCoords=cm.charCoords(Pos(lineNum,0),'local');var height=cm.getScrollInfo().clientHeight;var y=charCoords.top;var lineHeight=charCoords.bottom - y;switch(actionArgs.position){case 'center':y = y - height / 2 + lineHeight;break;case 'bottom':y = y - height + lineHeight * 1.4;break;case 'top':y = y + lineHeight * 0.4;break;}cm.scrollTo(null,y);},replayMacro:function replayMacro(cm,actionArgs,vim){var registerName=actionArgs.selectedCharacter;var repeat=actionArgs.repeat;var macroModeState=vimGlobalState.macroModeState;if(registerName == '@'){registerName = macroModeState.latestRegister;}while(repeat--) {executeMacroRegister(cm,vim,macroModeState,registerName);}},enterMacroRecordMode:function enterMacroRecordMode(cm,actionArgs){var macroModeState=vimGlobalState.macroModeState;var registerName=actionArgs.selectedCharacter;macroModeState.enterMacroRecordMode(cm,registerName);},enterInsertMode:function enterInsertMode(cm,actionArgs,vim){if(cm.getOption('readOnly')){return;}vim.insertMode = true;vim.insertModeRepeat = actionArgs && actionArgs.repeat || 1;var insertAt=actionArgs?actionArgs.insertAt:null;var sel=vim.sel;var head=actionArgs.head || cm.getCursor('head');var height=cm.listSelections().length;if(insertAt == 'eol'){head = Pos(head.line,lineLength(cm,head.line));}else if(insertAt == 'charAfter'){head = offsetCursor(head,0,1);}else if(insertAt == 'firstNonBlank'){head = motions.moveToFirstNonWhiteSpaceCharacter(cm,head);}else if(insertAt == 'startOfSelectedArea'){if(!vim.visualBlock){if(sel.head.line < sel.anchor.line){head = sel.head;}else {head = Pos(sel.anchor.line,0);}}else {head = Pos(Math.min(sel.head.line,sel.anchor.line),Math.min(sel.head.ch,sel.anchor.ch));height = Math.abs(sel.head.line - sel.anchor.line) + 1;}}else if(insertAt == 'endOfSelectedArea'){if(!vim.visualBlock){if(sel.head.line >= sel.anchor.line){head = offsetCursor(sel.head,0,1);}else {head = Pos(sel.anchor.line,0);}}else {head = Pos(Math.min(sel.head.line,sel.anchor.line),Math.max(sel.head.ch + 1,sel.anchor.ch));height = Math.abs(sel.head.line - sel.anchor.line) + 1;}}else if(insertAt == 'inplace'){if(vim.visualMode){return;}}cm.setOption('keyMap','vim-insert');cm.setOption('disableInput',false);if(actionArgs && actionArgs.replace){ // Handle Replace-mode as a special case of insert mode.
cm.toggleOverwrite(true);cm.setOption('keyMap','vim-replace');CodeMirror.signal(cm,"vim-mode-change",{mode:"replace"});}else {cm.setOption('keyMap','vim-insert');CodeMirror.signal(cm,"vim-mode-change",{mode:"insert"});}if(!vimGlobalState.macroModeState.isPlaying){ // Only record if not replaying.
cm.on('change',onChange);CodeMirror.on(cm.getInputField(),'keydown',onKeyEventTargetKeyDown);}if(vim.visualMode){exitVisualMode(cm);}selectForInsert(cm,head,height);},toggleVisualMode:function toggleVisualMode(cm,actionArgs,vim){var repeat=actionArgs.repeat;var anchor=cm.getCursor();var head; // TODO: The repeat should actually select number of characters/lines
//     equal to the repeat times the size of the previous visual
//     operation.
if(!vim.visualMode){ // Entering visual mode
vim.visualMode = true;vim.visualLine = !!actionArgs.linewise;vim.visualBlock = !!actionArgs.blockwise;head = clipCursorToContent(cm,Pos(anchor.line,anchor.ch + repeat - 1),true /** includeLineBreak */);vim.sel = {anchor:anchor,head:head};CodeMirror.signal(cm,"vim-mode-change",{mode:"visual",subMode:vim.visualLine?"linewise":vim.visualBlock?"blockwise":""});updateCmSelection(cm);updateMark(cm,vim,'<',cursorMin(anchor,head));updateMark(cm,vim,'>',cursorMax(anchor,head));}else if(vim.visualLine ^ actionArgs.linewise || vim.visualBlock ^ actionArgs.blockwise){ // Toggling between modes
vim.visualLine = !!actionArgs.linewise;vim.visualBlock = !!actionArgs.blockwise;CodeMirror.signal(cm,"vim-mode-change",{mode:"visual",subMode:vim.visualLine?"linewise":vim.visualBlock?"blockwise":""});updateCmSelection(cm);}else {exitVisualMode(cm);}},reselectLastSelection:function reselectLastSelection(cm,_actionArgs,vim){var lastSelection=vim.lastSelection;if(vim.visualMode){updateLastSelection(cm,vim);}if(lastSelection){var anchor=lastSelection.anchorMark.find();var head=lastSelection.headMark.find();if(!anchor || !head){ // If the marks have been destroyed due to edits, do nothing.
return;}vim.sel = {anchor:anchor,head:head};vim.visualMode = true;vim.visualLine = lastSelection.visualLine;vim.visualBlock = lastSelection.visualBlock;updateCmSelection(cm);updateMark(cm,vim,'<',cursorMin(anchor,head));updateMark(cm,vim,'>',cursorMax(anchor,head));CodeMirror.signal(cm,'vim-mode-change',{mode:'visual',subMode:vim.visualLine?'linewise':vim.visualBlock?'blockwise':''});}},joinLines:function joinLines(cm,actionArgs,vim){var curStart,curEnd;if(vim.visualMode){curStart = cm.getCursor('anchor');curEnd = cm.getCursor('head');if(cursorIsBefore(curEnd,curStart)){var tmp=curEnd;curEnd = curStart;curStart = tmp;}curEnd.ch = lineLength(cm,curEnd.line) - 1;}else { // Repeat is the number of lines to join. Minimum 2 lines.
var repeat=Math.max(actionArgs.repeat,2);curStart = cm.getCursor();curEnd = clipCursorToContent(cm,Pos(curStart.line + repeat - 1,Infinity));}var finalCh=0;for(var i=curStart.line;i < curEnd.line;i++) {finalCh = lineLength(cm,curStart.line);var tmp=Pos(curStart.line + 1,lineLength(cm,curStart.line + 1));var text=cm.getRange(curStart,tmp);text = text.replace(/\n\s*/g,' ');cm.replaceRange(text,curStart,tmp);}var curFinalPos=Pos(curStart.line,finalCh);if(vim.visualMode){exitVisualMode(cm,false);}cm.setCursor(curFinalPos);},newLineAndEnterInsertMode:function newLineAndEnterInsertMode(cm,actionArgs,vim){vim.insertMode = true;var insertAt=copyCursor(cm.getCursor());if(insertAt.line === cm.firstLine() && !actionArgs.after){ // Special case for inserting newline before start of document.
cm.replaceRange('\n',Pos(cm.firstLine(),0));cm.setCursor(cm.firstLine(),0);}else {insertAt.line = actionArgs.after?insertAt.line:insertAt.line - 1;insertAt.ch = lineLength(cm,insertAt.line);cm.setCursor(insertAt);var newlineFn=CodeMirror.commands.newlineAndIndentContinueComment || CodeMirror.commands.newlineAndIndent;newlineFn(cm);}this.enterInsertMode(cm,{repeat:actionArgs.repeat},vim);},paste:function paste(cm,actionArgs,vim){var cur=copyCursor(cm.getCursor());var register=vimGlobalState.registerController.getRegister(actionArgs.registerName);var text=register.toString();if(!text){return;}if(actionArgs.matchIndent){var tabSize=cm.getOption("tabSize"); // length that considers tabs and tabSize
var whitespaceLength=function whitespaceLength(str){var tabs=str.split("\t").length - 1;var spaces=str.split(" ").length - 1;return tabs * tabSize + spaces * 1;};var currentLine=cm.getLine(cm.getCursor().line);var indent=whitespaceLength(currentLine.match(/^\s*/)[0]); // chomp last newline b/c don't want it to match /^\s*/gm
var chompedText=text.replace(/\n$/,'');var wasChomped=text !== chompedText;var firstIndent=whitespaceLength(text.match(/^\s*/)[0]);var text=chompedText.replace(/^\s*/gm,function(wspace){var newIndent=indent + (whitespaceLength(wspace) - firstIndent);if(newIndent < 0){return "";}else if(cm.getOption("indentWithTabs")){var quotient=Math.floor(newIndent / tabSize);return Array(quotient + 1).join('\t');}else {return Array(newIndent + 1).join(' ');}});text += wasChomped?"\n":"";}if(actionArgs.repeat > 1){var text=Array(actionArgs.repeat + 1).join(text);}var linewise=register.linewise;var blockwise=register.blockwise;if(linewise){if(vim.visualMode){text = vim.visualLine?text.slice(0,-1):'\n' + text.slice(0,text.length - 1) + '\n';}else if(actionArgs.after){ // Move the newline at the end to the start instead, and paste just
// before the newline character of the line we are on right now.
text = '\n' + text.slice(0,text.length - 1);cur.ch = lineLength(cm,cur.line);}else {cur.ch = 0;}}else {if(blockwise){text = text.split('\n');for(var i=0;i < text.length;i++) {text[i] = text[i] == ''?' ':text[i];}}cur.ch += actionArgs.after?1:0;}var curPosFinal;var idx;if(vim.visualMode){ //  save the pasted text for reselection if the need arises
vim.lastPastedText = text;var lastSelectionCurEnd;var selectedArea=getSelectedAreaRange(cm,vim);var selectionStart=selectedArea[0];var selectionEnd=selectedArea[1];var selectedText=cm.getSelection();var selections=cm.listSelections();var emptyStrings=new Array(selections.length).join('1').split('1'); // save the curEnd marker before it get cleared due to cm.replaceRange.
if(vim.lastSelection){lastSelectionCurEnd = vim.lastSelection.headMark.find();} // push the previously selected text to unnamed register
vimGlobalState.registerController.unnamedRegister.setText(selectedText);if(blockwise){ // first delete the selected text
cm.replaceSelections(emptyStrings); // Set new selections as per the block length of the yanked text
selectionEnd = Pos(selectionStart.line + text.length - 1,selectionStart.ch);cm.setCursor(selectionStart);selectBlock(cm,selectionEnd);cm.replaceSelections(text);curPosFinal = selectionStart;}else if(vim.visualBlock){cm.replaceSelections(emptyStrings);cm.setCursor(selectionStart);cm.replaceRange(text,selectionStart,selectionStart);curPosFinal = selectionStart;}else {cm.replaceRange(text,selectionStart,selectionEnd);curPosFinal = cm.posFromIndex(cm.indexFromPos(selectionStart) + text.length - 1);} // restore the the curEnd marker
if(lastSelectionCurEnd){vim.lastSelection.headMark = cm.setBookmark(lastSelectionCurEnd);}if(linewise){curPosFinal.ch = 0;}}else {if(blockwise){cm.setCursor(cur);for(var i=0;i < text.length;i++) {var line=cur.line + i;if(line > cm.lastLine()){cm.replaceRange('\n',Pos(line,0));}var lastCh=lineLength(cm,line);if(lastCh < cur.ch){extendLineToColumn(cm,line,cur.ch);}}cm.setCursor(cur);selectBlock(cm,Pos(cur.line + text.length - 1,cur.ch));cm.replaceSelections(text);curPosFinal = cur;}else {cm.replaceRange(text,cur); // Now fine tune the cursor to where we want it.
if(linewise && actionArgs.after){curPosFinal = Pos(cur.line + 1,findFirstNonWhiteSpaceCharacter(cm.getLine(cur.line + 1)));}else if(linewise && !actionArgs.after){curPosFinal = Pos(cur.line,findFirstNonWhiteSpaceCharacter(cm.getLine(cur.line)));}else if(!linewise && actionArgs.after){idx = cm.indexFromPos(cur);curPosFinal = cm.posFromIndex(idx + text.length - 1);}else {idx = cm.indexFromPos(cur);curPosFinal = cm.posFromIndex(idx + text.length);}}}if(vim.visualMode){exitVisualMode(cm,false);}cm.setCursor(curPosFinal);},undo:function undo(cm,actionArgs){cm.operation(function(){repeatFn(cm,CodeMirror.commands.undo,actionArgs.repeat)();cm.setCursor(cm.getCursor('anchor'));});},redo:function redo(cm,actionArgs){repeatFn(cm,CodeMirror.commands.redo,actionArgs.repeat)();},setRegister:function setRegister(_cm,actionArgs,vim){vim.inputState.registerName = actionArgs.selectedCharacter;},setMark:function setMark(cm,actionArgs,vim){var markName=actionArgs.selectedCharacter;updateMark(cm,vim,markName,cm.getCursor());},replace:function replace(cm,actionArgs,vim){var replaceWith=actionArgs.selectedCharacter;var curStart=cm.getCursor();var replaceTo;var curEnd;var selections=cm.listSelections();if(vim.visualMode){curStart = cm.getCursor('start');curEnd = cm.getCursor('end');}else {var line=cm.getLine(curStart.line);replaceTo = curStart.ch + actionArgs.repeat;if(replaceTo > line.length){replaceTo = line.length;}curEnd = Pos(curStart.line,replaceTo);}if(replaceWith == '\n'){if(!vim.visualMode)cm.replaceRange('',curStart,curEnd); // special case, where vim help says to replace by just one line-break
(CodeMirror.commands.newlineAndIndentContinueComment || CodeMirror.commands.newlineAndIndent)(cm);}else {var replaceWithStr=cm.getRange(curStart,curEnd); //replace all characters in range by selected, but keep linebreaks
replaceWithStr = replaceWithStr.replace(/[^\n]/g,replaceWith);if(vim.visualBlock){ // Tabs are split in visua block before replacing
var spaces=new Array(cm.getOption("tabSize") + 1).join(' ');replaceWithStr = cm.getSelection();replaceWithStr = replaceWithStr.replace(/\t/g,spaces).replace(/[^\n]/g,replaceWith).split('\n');cm.replaceSelections(replaceWithStr);}else {cm.replaceRange(replaceWithStr,curStart,curEnd);}if(vim.visualMode){curStart = cursorIsBefore(selections[0].anchor,selections[0].head)?selections[0].anchor:selections[0].head;cm.setCursor(curStart);exitVisualMode(cm,false);}else {cm.setCursor(offsetCursor(curEnd,0,-1));}}},incrementNumberToken:function incrementNumberToken(cm,actionArgs){var cur=cm.getCursor();var lineStr=cm.getLine(cur.line);var re=/-?\d+/g;var match;var start;var end;var numberStr;var token;while((match = re.exec(lineStr)) !== null) {token = match[0];start = match.index;end = start + token.length;if(cur.ch < end)break;}if(!actionArgs.backtrack && end <= cur.ch)return;if(token){var increment=actionArgs.increase?1:-1;var number=parseInt(token) + increment * actionArgs.repeat;var from=Pos(cur.line,start);var to=Pos(cur.line,end);numberStr = number.toString();cm.replaceRange(numberStr,from,to);}else {return;}cm.setCursor(Pos(cur.line,start + numberStr.length - 1));},repeatLastEdit:function repeatLastEdit(cm,actionArgs,vim){var lastEditInputState=vim.lastEditInputState;if(!lastEditInputState){return;}var repeat=actionArgs.repeat;if(repeat && actionArgs.repeatIsExplicit){vim.lastEditInputState.repeatOverride = repeat;}else {repeat = vim.lastEditInputState.repeatOverride || repeat;}_repeatLastEdit(cm,vim,repeat,false /** repeatForInsert */);},exitInsertMode:exitInsertMode};function defineAction(name,fn){actions[name] = fn;} /*
     * Below are miscellaneous utility functions used by vim.js
     */ /**
     * Clips cursor to ensure that line is within the buffer's range
     * If includeLineBreak is true, then allow cur.ch == lineLength.
     */function clipCursorToContent(cm,cur,includeLineBreak){var line=Math.min(Math.max(cm.firstLine(),cur.line),cm.lastLine());var maxCh=lineLength(cm,line) - 1;maxCh = includeLineBreak?maxCh + 1:maxCh;var ch=Math.min(Math.max(0,cur.ch),maxCh);return Pos(line,ch);}function copyArgs(args){var ret={};for(var prop in args) {if(args.hasOwnProperty(prop)){ret[prop] = args[prop];}}return ret;}function offsetCursor(cur,offsetLine,offsetCh){if(typeof offsetLine === 'object'){offsetCh = offsetLine.ch;offsetLine = offsetLine.line;}return Pos(cur.line + offsetLine,cur.ch + offsetCh);}function getOffset(anchor,head){return {line:head.line - anchor.line,ch:head.line - anchor.line};}function commandMatches(keys,keyMap,context,inputState){ // Partial matches are not applied. They inform the key handler
// that the current key sequence is a subsequence of a valid key
// sequence, so that the key buffer is not cleared.
var match,partial=[],full=[];for(var i=0;i < keyMap.length;i++) {var command=keyMap[i];if(context == 'insert' && command.context != 'insert' || command.context && command.context != context || inputState.operator && command.type == 'action' || !(match = commandMatch(keys,command.keys))){continue;}if(match == 'partial'){partial.push(command);}if(match == 'full'){full.push(command);}}return {partial:partial.length && partial,full:full.length && full};}function commandMatch(pressed,mapped){if(mapped.slice(-11) == '<character>'){ // Last character matches anything.
var prefixLen=mapped.length - 11;var pressedPrefix=pressed.slice(0,prefixLen);var mappedPrefix=mapped.slice(0,prefixLen);return pressedPrefix == mappedPrefix && pressed.length > prefixLen?'full':mappedPrefix.indexOf(pressedPrefix) == 0?'partial':false;}else {return pressed == mapped?'full':mapped.indexOf(pressed) == 0?'partial':false;}}function lastChar(keys){var match=/^.*(<[\w\-]+>)$/.exec(keys);var selectedCharacter=match?match[1]:keys.slice(-1);if(selectedCharacter.length > 1){switch(selectedCharacter){case '<CR>':selectedCharacter = '\n';break;case '<Space>':selectedCharacter = ' ';break;default:break;}}return selectedCharacter;}function repeatFn(cm,fn,repeat){return function(){for(var i=0;i < repeat;i++) {fn(cm);}};}function copyCursor(cur){return Pos(cur.line,cur.ch);}function cursorEqual(cur1,cur2){return cur1.ch == cur2.ch && cur1.line == cur2.line;}function cursorIsBefore(cur1,cur2){if(cur1.line < cur2.line){return true;}if(cur1.line == cur2.line && cur1.ch < cur2.ch){return true;}return false;}function cursorMin(cur1,cur2){if(arguments.length > 2){cur2 = cursorMin.apply(undefined,Array.prototype.slice.call(arguments,1));}return cursorIsBefore(cur1,cur2)?cur1:cur2;}function cursorMax(cur1,cur2){if(arguments.length > 2){cur2 = cursorMax.apply(undefined,Array.prototype.slice.call(arguments,1));}return cursorIsBefore(cur1,cur2)?cur2:cur1;}function cursorIsBetween(cur1,cur2,cur3){ // returns true if cur2 is between cur1 and cur3.
var cur1before2=cursorIsBefore(cur1,cur2);var cur2before3=cursorIsBefore(cur2,cur3);return cur1before2 && cur2before3;}function lineLength(cm,lineNum){return cm.getLine(lineNum).length;}function trim(s){if(s.trim){return s.trim();}return s.replace(/^\s+|\s+$/g,'');}function escapeRegex(s){return s.replace(/([.?*+$\[\]\/\\(){}|\-])/g,'\\$1');}function extendLineToColumn(cm,lineNum,column){var endCh=lineLength(cm,lineNum);var spaces=new Array(column - endCh + 1).join(' ');cm.setCursor(Pos(lineNum,endCh));cm.replaceRange(spaces,cm.getCursor());} // This functions selects a rectangular block
// of text with selectionEnd as any of its corner
// Height of block:
// Difference in selectionEnd.line and first/last selection.line
// Width of the block:
// Distance between selectionEnd.ch and any(first considered here) selection.ch
function selectBlock(cm,selectionEnd){var selections=[],ranges=cm.listSelections();var head=copyCursor(cm.clipPos(selectionEnd));var isClipped=!cursorEqual(selectionEnd,head);var curHead=cm.getCursor('head');var primIndex=getIndex(ranges,curHead);var wasClipped=cursorEqual(ranges[primIndex].head,ranges[primIndex].anchor);var max=ranges.length - 1;var index=max - primIndex > primIndex?max:0;var base=ranges[index].anchor;var firstLine=Math.min(base.line,head.line);var lastLine=Math.max(base.line,head.line);var baseCh=base.ch,headCh=head.ch;var dir=ranges[index].head.ch - baseCh;var newDir=headCh - baseCh;if(dir > 0 && newDir <= 0){baseCh++;if(!isClipped){headCh--;}}else if(dir < 0 && newDir >= 0){baseCh--;if(!wasClipped){headCh++;}}else if(dir < 0 && newDir == -1){baseCh--;headCh++;}for(var line=firstLine;line <= lastLine;line++) {var range={anchor:new Pos(line,baseCh),head:new Pos(line,headCh)};selections.push(range);}primIndex = head.line == lastLine?selections.length - 1:0;cm.setSelections(selections);selectionEnd.ch = headCh;base.ch = baseCh;return base;}function selectForInsert(cm,head,height){var sel=[];for(var i=0;i < height;i++) {var lineHead=offsetCursor(head,i,0);sel.push({anchor:lineHead,head:lineHead});}cm.setSelections(sel,0);} // getIndex returns the index of the cursor in the selections.
function getIndex(ranges,cursor,end){for(var i=0;i < ranges.length;i++) {var atAnchor=end != 'head' && cursorEqual(ranges[i].anchor,cursor);var atHead=end != 'anchor' && cursorEqual(ranges[i].head,cursor);if(atAnchor || atHead){return i;}}return -1;}function getSelectedAreaRange(cm,vim){var lastSelection=vim.lastSelection;var getCurrentSelectedAreaRange=function getCurrentSelectedAreaRange(){var selections=cm.listSelections();var start=selections[0];var end=selections[selections.length - 1];var selectionStart=cursorIsBefore(start.anchor,start.head)?start.anchor:start.head;var selectionEnd=cursorIsBefore(end.anchor,end.head)?end.head:end.anchor;return [selectionStart,selectionEnd];};var getLastSelectedAreaRange=function getLastSelectedAreaRange(){var selectionStart=cm.getCursor();var selectionEnd=cm.getCursor();var block=lastSelection.visualBlock;if(block){var width=block.width;var height=block.height;selectionEnd = Pos(selectionStart.line + height,selectionStart.ch + width);var selections=[]; // selectBlock creates a 'proper' rectangular block.
// We do not want that in all cases, so we manually set selections.
for(var i=selectionStart.line;i < selectionEnd.line;i++) {var anchor=Pos(i,selectionStart.ch);var head=Pos(i,selectionEnd.ch);var range={anchor:anchor,head:head};selections.push(range);}cm.setSelections(selections);}else {var start=lastSelection.anchorMark.find();var end=lastSelection.headMark.find();var line=end.line - start.line;var ch=end.ch - start.ch;selectionEnd = {line:selectionEnd.line + line,ch:line?selectionEnd.ch:ch + selectionEnd.ch};if(lastSelection.visualLine){selectionStart = Pos(selectionStart.line,0);selectionEnd = Pos(selectionEnd.line,lineLength(cm,selectionEnd.line));}cm.setSelection(selectionStart,selectionEnd);}return [selectionStart,selectionEnd];};if(!vim.visualMode){ // In case of replaying the action.
return getLastSelectedAreaRange();}else {return getCurrentSelectedAreaRange();}} // Updates the previous selection with the current selection's values. This
// should only be called in visual mode.
function updateLastSelection(cm,vim){var anchor=vim.sel.anchor;var head=vim.sel.head; // To accommodate the effect of lastPastedText in the last selection
if(vim.lastPastedText){head = cm.posFromIndex(cm.indexFromPos(anchor) + vim.lastPastedText.length);vim.lastPastedText = null;}vim.lastSelection = {'anchorMark':cm.setBookmark(anchor),'headMark':cm.setBookmark(head),'anchor':copyCursor(anchor),'head':copyCursor(head),'visualMode':vim.visualMode,'visualLine':vim.visualLine,'visualBlock':vim.visualBlock};}function expandSelection(cm,start,end){var sel=cm.state.vim.sel;var head=sel.head;var anchor=sel.anchor;var tmp;if(cursorIsBefore(end,start)){tmp = end;end = start;start = tmp;}if(cursorIsBefore(head,anchor)){head = cursorMin(start,head);anchor = cursorMax(anchor,end);}else {anchor = cursorMin(start,anchor);head = cursorMax(head,end);head = offsetCursor(head,0,-1);if(head.ch == -1 && head.line != cm.firstLine()){head = Pos(head.line - 1,lineLength(cm,head.line - 1));}}return [anchor,head];} /**
     * Updates the CodeMirror selection to match the provided vim selection.
     * If no arguments are given, it uses the current vim selection state.
     */function updateCmSelection(cm,sel,mode){var vim=cm.state.vim;sel = sel || vim.sel;var mode=mode || vim.visualLine?'line':vim.visualBlock?'block':'char';var cmSel=makeCmSelection(cm,sel,mode);cm.setSelections(cmSel.ranges,cmSel.primary);updateFakeCursor(cm);}function makeCmSelection(cm,sel,mode,exclusive){var head=copyCursor(sel.head);var anchor=copyCursor(sel.anchor);if(mode == 'char'){var headOffset=!exclusive && !cursorIsBefore(sel.head,sel.anchor)?1:0;var anchorOffset=cursorIsBefore(sel.head,sel.anchor)?1:0;head = offsetCursor(sel.head,0,headOffset);anchor = offsetCursor(sel.anchor,0,anchorOffset);return {ranges:[{anchor:anchor,head:head}],primary:0};}else if(mode == 'line'){if(!cursorIsBefore(sel.head,sel.anchor)){anchor.ch = 0;var lastLine=cm.lastLine();if(head.line > lastLine){head.line = lastLine;}head.ch = lineLength(cm,head.line);}else {head.ch = 0;anchor.ch = lineLength(cm,anchor.line);}return {ranges:[{anchor:anchor,head:head}],primary:0};}else if(mode == 'block'){var top=Math.min(anchor.line,head.line),left=Math.min(anchor.ch,head.ch),bottom=Math.max(anchor.line,head.line),right=Math.max(anchor.ch,head.ch) + 1;var height=bottom - top + 1;var primary=head.line == top?0:height - 1;var ranges=[];for(var i=0;i < height;i++) {ranges.push({anchor:Pos(top + i,left),head:Pos(top + i,right)});}return {ranges:ranges,primary:primary};}}function getHead(cm){var cur=cm.getCursor('head');if(cm.getSelection().length == 1){ // Small corner case when only 1 character is selected. The "real"
// head is the left of head and anchor.
cur = cursorMin(cur,cm.getCursor('anchor'));}return cur;} /**
     * If moveHead is set to false, the CodeMirror selection will not be
     * touched. The caller assumes the responsibility of putting the cursor
    * in the right place.
     */function exitVisualMode(cm,moveHead){var vim=cm.state.vim;if(moveHead !== false){cm.setCursor(clipCursorToContent(cm,vim.sel.head));}updateLastSelection(cm,vim);vim.visualMode = false;vim.visualLine = false;vim.visualBlock = false;CodeMirror.signal(cm,"vim-mode-change",{mode:"normal"});if(vim.fakeCursor){vim.fakeCursor.clear();}} // Remove any trailing newlines from the selection. For
// example, with the caret at the start of the last word on the line,
// 'dw' should word, but not the newline, while 'w' should advance the
// caret to the first character of the next line.
function clipToLine(cm,curStart,curEnd){var selection=cm.getRange(curStart,curEnd); // Only clip if the selection ends with trailing newline + whitespace
if(/\n\s*$/.test(selection)){var lines=selection.split('\n'); // We know this is all whitepsace.
lines.pop(); // Cases:
// 1. Last word is an empty line - do not clip the trailing '\n'
// 2. Last word is not an empty line - clip the trailing '\n'
var line; // Find the line containing the last word, and clip all whitespace up
// to it.
for(var line=lines.pop();lines.length > 0 && line && isWhiteSpaceString(line);line = lines.pop()) {curEnd.line--;curEnd.ch = 0;} // If the last word is not an empty line, clip an additional newline
if(line){curEnd.line--;curEnd.ch = lineLength(cm,curEnd.line);}else {curEnd.ch = 0;}}} // Expand the selection to line ends.
function expandSelectionToLine(_cm,curStart,curEnd){curStart.ch = 0;curEnd.ch = 0;curEnd.line++;}function findFirstNonWhiteSpaceCharacter(text){if(!text){return 0;}var firstNonWS=text.search(/\S/);return firstNonWS == -1?text.length:firstNonWS;}function expandWordUnderCursor(cm,inclusive,_forward,bigWord,noSymbol){var cur=getHead(cm);var line=cm.getLine(cur.line);var idx=cur.ch; // Seek to first word or non-whitespace character, depending on if
// noSymbol is true.
var test=noSymbol?wordCharTest[0]:bigWordCharTest[0];while(!test(line.charAt(idx))) {idx++;if(idx >= line.length){return null;}}if(bigWord){test = bigWordCharTest[0];}else {test = wordCharTest[0];if(!test(line.charAt(idx))){test = wordCharTest[1];}}var end=idx,start=idx;while(test(line.charAt(end)) && end < line.length) {end++;}while(test(line.charAt(start)) && start >= 0) {start--;}start++;if(inclusive){ // If present, include all whitespace after word.
// Otherwise, include all whitespace before word, except indentation.
var wordEnd=end;while(/\s/.test(line.charAt(end)) && end < line.length) {end++;}if(wordEnd == end){var wordStart=start;while(/\s/.test(line.charAt(start - 1)) && start > 0) {start--;}if(!start){start = wordStart;}}}return {start:Pos(cur.line,start),end:Pos(cur.line,end)};}function recordJumpPosition(cm,oldCur,newCur){if(!cursorEqual(oldCur,newCur)){vimGlobalState.jumpList.add(cm,oldCur,newCur);}}function recordLastCharacterSearch(increment,args){vimGlobalState.lastChararacterSearch.increment = increment;vimGlobalState.lastChararacterSearch.forward = args.forward;vimGlobalState.lastChararacterSearch.selectedCharacter = args.selectedCharacter;}var symbolToMode={'(':'bracket',')':'bracket','{':'bracket','}':'bracket','[':'section',']':'section','*':'comment','/':'comment','m':'method','M':'method','#':'preprocess'};var findSymbolModes={bracket:{isComplete:function isComplete(state){if(state.nextCh === state.symb){state.depth++;if(state.depth >= 1)return true;}else if(state.nextCh === state.reverseSymb){state.depth--;}return false;}},section:{init:function init(state){state.curMoveThrough = true;state.symb = (state.forward?']':'[') === state.symb?'{':'}';},isComplete:function isComplete(state){return state.index === 0 && state.nextCh === state.symb;}},comment:{isComplete:function isComplete(state){var found=state.lastCh === '*' && state.nextCh === '/';state.lastCh = state.nextCh;return found;}}, // TODO: The original Vim implementation only operates on level 1 and 2.
// The current implementation doesn't check for code block level and
// therefore it operates on any levels.
method:{init:function init(state){state.symb = state.symb === 'm'?'{':'}';state.reverseSymb = state.symb === '{'?'}':'{';},isComplete:function isComplete(state){if(state.nextCh === state.symb)return true;return false;}},preprocess:{init:function init(state){state.index = 0;},isComplete:function isComplete(state){if(state.nextCh === '#'){var token=state.lineText.match(/#(\w+)/)[1];if(token === 'endif'){if(state.forward && state.depth === 0){return true;}state.depth++;}else if(token === 'if'){if(!state.forward && state.depth === 0){return true;}state.depth--;}if(token === 'else' && state.depth === 0)return true;}return false;}}};function findSymbol(cm,repeat,forward,symb){var cur=copyCursor(cm.getCursor());var increment=forward?1:-1;var endLine=forward?cm.lineCount():-1;var curCh=cur.ch;var line=cur.line;var lineText=cm.getLine(line);var state={lineText:lineText,nextCh:lineText.charAt(curCh),lastCh:null,index:curCh,symb:symb,reverseSymb:(forward?{')':'(','}':'{'}:{'(':')','{':'}'})[symb],forward:forward,depth:0,curMoveThrough:false};var mode=symbolToMode[symb];if(!mode)return cur;var init=findSymbolModes[mode].init;var isComplete=findSymbolModes[mode].isComplete;if(init){init(state);}while(line !== endLine && repeat) {state.index += increment;state.nextCh = state.lineText.charAt(state.index);if(!state.nextCh){line += increment;state.lineText = cm.getLine(line) || '';if(increment > 0){state.index = 0;}else {var lineLen=state.lineText.length;state.index = lineLen > 0?lineLen - 1:0;}state.nextCh = state.lineText.charAt(state.index);}if(isComplete(state)){cur.line = line;cur.ch = state.index;repeat--;}}if(state.nextCh || state.curMoveThrough){return Pos(line,state.index);}return cur;} /*
     * Returns the boundaries of the next word. If the cursor in the middle of
     * the word, then returns the boundaries of the current word, starting at
     * the cursor. If the cursor is at the start/end of a word, and we are going
     * forward/backward, respectively, find the boundaries of the next word.
     *
     * @param {CodeMirror} cm CodeMirror object.
     * @param {Cursor} cur The cursor position.
     * @param {boolean} forward True to search forward. False to search
     *     backward.
     * @param {boolean} bigWord True if punctuation count as part of the word.
     *     False if only [a-zA-Z0-9] characters count as part of the word.
     * @param {boolean} emptyLineIsWord True if empty lines should be treated
     *     as words.
     * @return {Object{from:number, to:number, line: number}} The boundaries of
     *     the word, or null if there are no more words.
     */function findWord(cm,cur,forward,bigWord,emptyLineIsWord){var lineNum=cur.line;var pos=cur.ch;var line=cm.getLine(lineNum);var dir=forward?1:-1;var charTests=bigWord?bigWordCharTest:wordCharTest;if(emptyLineIsWord && line == ''){lineNum += dir;line = cm.getLine(lineNum);if(!isLine(cm,lineNum)){return null;}pos = forward?0:line.length;}while(true) {if(emptyLineIsWord && line == ''){return {from:0,to:0,line:lineNum};}var stop=dir > 0?line.length:-1;var wordStart=stop,wordEnd=stop; // Find bounds of next word.
while(pos != stop) {var foundWord=false;for(var i=0;i < charTests.length && !foundWord;++i) {if(charTests[i](line.charAt(pos))){wordStart = pos; // Advance to end of word.
while(pos != stop && charTests[i](line.charAt(pos))) {pos += dir;}wordEnd = pos;foundWord = wordStart != wordEnd;if(wordStart == cur.ch && lineNum == cur.line && wordEnd == wordStart + dir){ // We started at the end of a word. Find the next one.
continue;}else {return {from:Math.min(wordStart,wordEnd + 1),to:Math.max(wordStart,wordEnd),line:lineNum};}}}if(!foundWord){pos += dir;}} // Advance to next/prev line.
lineNum += dir;if(!isLine(cm,lineNum)){return null;}line = cm.getLine(lineNum);pos = dir > 0?0:line.length;} // Should never get here.
throw new Error('The impossible happened.');} /**
     * @param {CodeMirror} cm CodeMirror object.
     * @param {Pos} cur The position to start from.
     * @param {int} repeat Number of words to move past.
     * @param {boolean} forward True to search forward. False to search
     *     backward.
     * @param {boolean} wordEnd True to move to end of word. False to move to
     *     beginning of word.
     * @param {boolean} bigWord True if punctuation count as part of the word.
     *     False if only alphabet characters count as part of the word.
     * @return {Cursor} The position the cursor should move to.
     */function moveToWord(cm,cur,repeat,forward,wordEnd,bigWord){var curStart=copyCursor(cur);var words=[];if(forward && !wordEnd || !forward && wordEnd){repeat++;} // For 'e', empty lines are not considered words, go figure.
var emptyLineIsWord=!(forward && wordEnd);for(var i=0;i < repeat;i++) {var word=findWord(cm,cur,forward,bigWord,emptyLineIsWord);if(!word){var eodCh=lineLength(cm,cm.lastLine());words.push(forward?{line:cm.lastLine(),from:eodCh,to:eodCh}:{line:0,from:0,to:0});break;}words.push(word);cur = Pos(word.line,forward?word.to - 1:word.from);}var shortCircuit=words.length != repeat;var firstWord=words[0];var lastWord=words.pop();if(forward && !wordEnd){ // w
if(!shortCircuit && (firstWord.from != curStart.ch || firstWord.line != curStart.line)){ // We did not start in the middle of a word. Discard the extra word at the end.
lastWord = words.pop();}return Pos(lastWord.line,lastWord.from);}else if(forward && wordEnd){return Pos(lastWord.line,lastWord.to - 1);}else if(!forward && wordEnd){ // ge
if(!shortCircuit && (firstWord.to != curStart.ch || firstWord.line != curStart.line)){ // We did not start in the middle of a word. Discard the extra word at the end.
lastWord = words.pop();}return Pos(lastWord.line,lastWord.to);}else { // b
return Pos(lastWord.line,lastWord.from);}}function _moveToCharacter(cm,repeat,forward,character){var cur=cm.getCursor();var start=cur.ch;var idx;for(var i=0;i < repeat;i++) {var line=cm.getLine(cur.line);idx = charIdxInLine(start,line,character,forward,true);if(idx == -1){return null;}start = idx;}return Pos(cm.getCursor().line,idx);}function _moveToColumn(cm,repeat){ // repeat is always >= 1, so repeat - 1 always corresponds
// to the column we want to go to.
var line=cm.getCursor().line;return clipCursorToContent(cm,Pos(line,repeat - 1));}function updateMark(cm,vim,markName,pos){if(!inArray(markName,validMarks)){return;}if(vim.marks[markName]){vim.marks[markName].clear();}vim.marks[markName] = cm.setBookmark(pos);}function charIdxInLine(start,line,character,forward,includeChar){ // Search for char in line.
// motion_options: {forward, includeChar}
// If includeChar = true, include it too.
// If forward = true, search forward, else search backwards.
// If char is not found on this line, do nothing
var idx;if(forward){idx = line.indexOf(character,start + 1);if(idx != -1 && !includeChar){idx -= 1;}}else {idx = line.lastIndexOf(character,start - 1);if(idx != -1 && !includeChar){idx += 1;}}return idx;}function findParagraph(cm,head,repeat,dir,inclusive){var line=head.line;var min=cm.firstLine();var max=cm.lastLine();var start,end,i=line;function isEmpty(i){return !cm.getLine(i);}function isBoundary(i,dir,any){if(any){return isEmpty(i) != isEmpty(i + dir);}return !isEmpty(i) && isEmpty(i + dir);}if(dir){while(min <= i && i <= max && repeat > 0) {if(isBoundary(i,dir)){repeat--;}i += dir;}return new Pos(i,0);}var vim=cm.state.vim;if(vim.visualLine && isBoundary(line,1,true)){var anchor=vim.sel.anchor;if(isBoundary(anchor.line,-1,true)){if(!inclusive || anchor.line != line){line += 1;}}}var startState=isEmpty(line);for(i = line;i <= max && repeat;i++) {if(isBoundary(i,1,true)){if(!inclusive || isEmpty(i) != startState){repeat--;}}}end = new Pos(i,0); // select boundary before paragraph for the last one
if(i > max && !startState){startState = true;}else {inclusive = false;}for(i = line;i > min;i--) {if(!inclusive || isEmpty(i) == startState || i == line){if(isBoundary(i,-1,true)){break;}}}start = new Pos(i,0);return {start:start,end:end};} // TODO: perhaps this finagling of start and end positions belonds
// in codmirror/replaceRange?
function selectCompanionObject(cm,head,symb,inclusive){var cur=head,start,end;var bracketRegexp=({'(':/[()]/,')':/[()]/,'[':/[[\]]/,']':/[[\]]/,'{':/[{}]/,'}':/[{}]/})[symb];var openSym=({'(':'(',')':'(','[':'[',']':'[','{':'{','}':'{'})[symb];var curChar=cm.getLine(cur.line).charAt(cur.ch); // Due to the behavior of scanForBracket, we need to add an offset if the
// cursor is on a matching open bracket.
var offset=curChar === openSym?1:0;start = cm.scanForBracket(Pos(cur.line,cur.ch + offset),-1,null,{'bracketRegex':bracketRegexp});end = cm.scanForBracket(Pos(cur.line,cur.ch + offset),1,null,{'bracketRegex':bracketRegexp});if(!start || !end){return {start:cur,end:cur};}start = start.pos;end = end.pos;if(start.line == end.line && start.ch > end.ch || start.line > end.line){var tmp=start;start = end;end = tmp;}if(inclusive){end.ch += 1;}else {start.ch += 1;}return {start:start,end:end};} // Takes in a symbol and a cursor and tries to simulate text objects that
// have identical opening and closing symbols
// TODO support across multiple lines
function findBeginningAndEnd(cm,head,symb,inclusive){var cur=copyCursor(head);var line=cm.getLine(cur.line);var chars=line.split('');var start,end,i,len;var firstIndex=chars.indexOf(symb); // the decision tree is to always look backwards for the beginning first,
// but if the cursor is in front of the first instance of the symb,
// then move the cursor forward
if(cur.ch < firstIndex){cur.ch = firstIndex; // Why is this line even here???
// cm.setCursor(cur.line, firstIndex+1);
} // otherwise if the cursor is currently on the closing symbol
else if(firstIndex < cur.ch && chars[cur.ch] == symb){end = cur.ch; // assign end to the current cursor
--cur.ch; // make sure to look backwards
} // if we're currently on the symbol, we've got a start
if(chars[cur.ch] == symb && !end){start = cur.ch + 1; // assign start to ahead of the cursor
}else { // go backwards to find the start
for(i = cur.ch;i > -1 && !start;i--) {if(chars[i] == symb){start = i + 1;}}} // look forwards for the end symbol
if(start && !end){for(i = start,len = chars.length;i < len && !end;i++) {if(chars[i] == symb){end = i;}}} // nothing found
if(!start || !end){return {start:cur,end:cur};} // include the symbols
if(inclusive){--start;++end;}return {start:Pos(cur.line,start),end:Pos(cur.line,end)};} // Search functions
defineOption('pcre',true,'boolean');function SearchState(){}SearchState.prototype = {getQuery:function getQuery(){return vimGlobalState.query;},setQuery:function setQuery(query){vimGlobalState.query = query;},getOverlay:function getOverlay(){return this.searchOverlay;},setOverlay:function setOverlay(overlay){this.searchOverlay = overlay;},isReversed:function isReversed(){return vimGlobalState.isReversed;},setReversed:function setReversed(reversed){vimGlobalState.isReversed = reversed;},getScrollbarAnnotate:function getScrollbarAnnotate(){return this.annotate;},setScrollbarAnnotate:function setScrollbarAnnotate(annotate){this.annotate = annotate;}};function getSearchState(cm){var vim=cm.state.vim;return vim.searchState_ || (vim.searchState_ = new SearchState());}function dialog(cm,template,shortText,onClose,options){if(cm.openDialog){cm.openDialog(template,onClose,{bottom:true,value:options.value,onKeyDown:options.onKeyDown,onKeyUp:options.onKeyUp,selectValueOnOpen:false});}else {onClose(prompt(shortText,''));}}function splitBySlash(argString){var slashes=findUnescapedSlashes(argString) || [];if(!slashes.length)return [];var tokens=[]; // in case of strings like foo/bar
if(slashes[0] !== 0)return;for(var i=0;i < slashes.length;i++) {if(typeof slashes[i] == 'number')tokens.push(argString.substring(slashes[i] + 1,slashes[i + 1]));}return tokens;}function findUnescapedSlashes(str){var escapeNextChar=false;var slashes=[];for(var i=0;i < str.length;i++) {var c=str.charAt(i);if(!escapeNextChar && c == '/'){slashes.push(i);}escapeNextChar = !escapeNextChar && c == '\\';}return slashes;} // Translates a search string from ex (vim) syntax into javascript form.
function translateRegex(str){ // When these match, add a '\' if unescaped or remove one if escaped.
var specials='|(){'; // Remove, but never add, a '\' for these.
var unescape='}';var escapeNextChar=false;var out=[];for(var i=-1;i < str.length;i++) {var c=str.charAt(i) || '';var n=str.charAt(i + 1) || '';var specialComesNext=n && specials.indexOf(n) != -1;if(escapeNextChar){if(c !== '\\' || !specialComesNext){out.push(c);}escapeNextChar = false;}else {if(c === '\\'){escapeNextChar = true; // Treat the unescape list as special for removing, but not adding '\'.
if(n && unescape.indexOf(n) != -1){specialComesNext = true;} // Not passing this test means removing a '\'.
if(!specialComesNext || n === '\\'){out.push(c);}}else {out.push(c);if(specialComesNext && n !== '\\'){out.push('\\');}}}}return out.join('');} // Translates the replace part of a search and replace from ex (vim) syntax into
// javascript form.  Similar to translateRegex, but additionally fixes back references
// (translates '\[0..9]' to '$[0..9]') and follows different rules for escaping '$'.
function translateRegexReplace(str){var escapeNextChar=false;var out=[];for(var i=-1;i < str.length;i++) {var c=str.charAt(i) || '';var n=str.charAt(i + 1) || '';if(escapeNextChar){ // At any point in the loop, escapeNextChar is true if the previous
// character was a '\' and was not escaped.
out.push(c);escapeNextChar = false;}else {if(c === '\\'){escapeNextChar = true;if(isNumber(n) || n === '$'){out.push('$');}else if(n !== '/' && n !== '\\'){out.push('\\');}}else {if(c === '$'){out.push('$');}out.push(c);if(n === '/'){out.push('\\');}}}}return out.join('');} // Unescape \ and / in the replace part, for PCRE mode.
function unescapeRegexReplace(str){var stream=new CodeMirror.StringStream(str);var output=[];while(!stream.eol()) { // Search for \.
while(stream.peek() && stream.peek() != '\\') {output.push(stream.next());}if(stream.match('\\/',true)){ // \/ => /
output.push('/');}else if(stream.match('\\\\',true)){ // \\ => \
output.push('\\');}else { // Don't change anything
output.push(stream.next());}}return output.join('');} /**
     * Extract the regular expression from the query and return a Regexp object.
     * Returns null if the query is blank.
     * If ignoreCase is passed in, the Regexp object will have the 'i' flag set.
     * If smartCase is passed in, and the query contains upper case letters,
     *   then ignoreCase is overridden, and the 'i' flag will not be set.
     * If the query contains the /i in the flag part of the regular expression,
     *   then both ignoreCase and smartCase are ignored, and 'i' will be passed
     *   through to the Regex object.
     */function parseQuery(query,ignoreCase,smartCase){ // First update the last search register
var lastSearchRegister=vimGlobalState.registerController.getRegister('/');lastSearchRegister.setText(query); // Check if the query is already a regex.
if(query instanceof RegExp){return query;} // First try to extract regex + flags from the input. If no flags found,
// extract just the regex. IE does not accept flags directly defined in
// the regex string in the form /regex/flags
var slashes=findUnescapedSlashes(query);var regexPart;var forceIgnoreCase;if(!slashes.length){ // Query looks like 'regexp'
regexPart = query;}else { // Query looks like 'regexp/...'
regexPart = query.substring(0,slashes[0]);var flagsPart=query.substring(slashes[0]);forceIgnoreCase = flagsPart.indexOf('i') != -1;}if(!regexPart){return null;}if(!getOption('pcre')){regexPart = translateRegex(regexPart);}if(smartCase){ignoreCase = /^[^A-Z]*$/.test(regexPart);}var regexp=new RegExp(regexPart,ignoreCase || forceIgnoreCase?'i':undefined);return regexp;}function showConfirm(cm,text){if(cm.openNotification){cm.openNotification('<span style="color: red">' + text + '</span>',{bottom:true,duration:5000});}else {alert(text);}}function makePrompt(prefix,desc){var raw='';if(prefix){raw += '<span style="font-family: monospace">' + prefix + '</span>';}raw += '<input type="text"/> ' + '<span style="color: #888">';if(desc){raw += '<span style="color: #888">';raw += desc;raw += '</span>';}return raw;}var searchPromptDesc='(Javascript regexp)';function showPrompt(cm,options){var shortText=(options.prefix || '') + ' ' + (options.desc || '');var prompt=makePrompt(options.prefix,options.desc);dialog(cm,prompt,shortText,options.onClose,options);}function regexEqual(r1,r2){if(r1 instanceof RegExp && r2 instanceof RegExp){var props=['global','multiline','ignoreCase','source'];for(var i=0;i < props.length;i++) {var prop=props[i];if(r1[prop] !== r2[prop]){return false;}}return true;}return false;} // Returns true if the query is valid.
function updateSearchQuery(cm,rawQuery,ignoreCase,smartCase){if(!rawQuery){return;}var state=getSearchState(cm);var query=parseQuery(rawQuery,!!ignoreCase,!!smartCase);if(!query){return;}highlightSearchMatches(cm,query);if(regexEqual(query,state.getQuery())){return query;}state.setQuery(query);return query;}function searchOverlay(query){if(query.source.charAt(0) == '^'){var matchSol=true;}return {token:function token(stream){if(matchSol && !stream.sol()){stream.skipToEnd();return;}var match=stream.match(query,false);if(match){if(match[0].length == 0){ // Matched empty string, skip to next.
stream.next();return 'searching';}if(!stream.sol()){ // Backtrack 1 to match \b
stream.backUp(1);if(!query.exec(stream.next() + match[0])){stream.next();return null;}}stream.match(query);return 'searching';}while(!stream.eol()) {stream.next();if(stream.match(query,false))break;}},query:query};}function highlightSearchMatches(cm,query){var searchState=getSearchState(cm);var overlay=searchState.getOverlay();if(!overlay || query != overlay.query){if(overlay){cm.removeOverlay(overlay);}overlay = searchOverlay(query);cm.addOverlay(overlay);if(cm.showMatchesOnScrollbar){if(searchState.getScrollbarAnnotate()){searchState.getScrollbarAnnotate().clear();}searchState.setScrollbarAnnotate(cm.showMatchesOnScrollbar(query));}searchState.setOverlay(overlay);}}function _findNext(cm,prev,query,repeat){if(repeat === undefined){repeat = 1;}return cm.operation(function(){var pos=cm.getCursor();var cursor=cm.getSearchCursor(query,pos);for(var i=0;i < repeat;i++) {var found=cursor.find(prev);if(i == 0 && found && cursorEqual(cursor.from(),pos)){found = cursor.find(prev);}if(!found){ // SearchCursor may have returned null because it hit EOF, wrap
// around and try again.
cursor = cm.getSearchCursor(query,prev?Pos(cm.lastLine()):Pos(cm.firstLine(),0));if(!cursor.find(prev)){return;}}}return cursor.from();});}function clearSearchHighlight(cm){var state=getSearchState(cm);cm.removeOverlay(getSearchState(cm).getOverlay());state.setOverlay(null);if(state.getScrollbarAnnotate()){state.getScrollbarAnnotate().clear();state.setScrollbarAnnotate(null);}} /**
     * Check if pos is in the specified range, INCLUSIVE.
     * Range can be specified with 1 or 2 arguments.
     * If the first range argument is an array, treat it as an array of line
     * numbers. Match pos against any of the lines.
     * If the first range argument is a number,
     *   if there is only 1 range argument, check if pos has the same line
     *       number
     *   if there are 2 range arguments, then check if pos is in between the two
     *       range arguments.
     */function isInRange(pos,start,end){if(typeof pos != 'number'){ // Assume it is a cursor position. Get the line number.
pos = pos.line;}if(start instanceof Array){return inArray(pos,start);}else {if(end){return pos >= start && pos <= end;}else {return pos == start;}}}function getUserVisibleLines(cm){var scrollInfo=cm.getScrollInfo();var occludeToleranceTop=6;var occludeToleranceBottom=10;var from=cm.coordsChar({left:0,top:occludeToleranceTop + scrollInfo.top},'local');var bottomY=scrollInfo.clientHeight - occludeToleranceBottom + scrollInfo.top;var to=cm.coordsChar({left:0,top:bottomY},'local');return {top:from.line,bottom:to.line};} // Ex command handling
// Care must be taken when adding to the default Ex command map. For any
// pair of commands that have a shared prefix, at least one of their
// shortNames must not match the prefix of the other command.
var defaultExCommandMap=[{name:'map'},{name:'imap',shortName:'im'},{name:'nmap',shortName:'nm'},{name:'vmap',shortName:'vm'},{name:'unmap'},{name:'write',shortName:'w'},{name:'undo',shortName:'u'},{name:'redo',shortName:'red'},{name:'set',shortName:'set'},{name:'sort',shortName:'sor'},{name:'substitute',shortName:'s',possiblyAsync:true},{name:'nohlsearch',shortName:'noh'},{name:'delmarks',shortName:'delm'},{name:'registers',shortName:'reg',excludeFromCommandHistory:true},{name:'global',shortName:'g'}];var ExCommandDispatcher=function ExCommandDispatcher(){this.buildCommandMap_();};ExCommandDispatcher.prototype = {processCommand:function processCommand(cm,input,opt_params){var that=this;cm.operation(function(){cm.curOp.isVimOp = true;that._processCommand(cm,input,opt_params);});},_processCommand:function _processCommand(cm,input,opt_params){var vim=cm.state.vim;var commandHistoryRegister=vimGlobalState.registerController.getRegister(':');var previousCommand=commandHistoryRegister.toString();if(vim.visualMode){exitVisualMode(cm);}var inputStream=new CodeMirror.StringStream(input); // update ": with the latest command whether valid or invalid
commandHistoryRegister.setText(input);var params=opt_params || {};params.input = input;try{this.parseInput_(cm,inputStream,params);}catch(e) {showConfirm(cm,e);throw e;}var command;var commandName;if(!params.commandName){ // If only a line range is defined, move to the line.
if(params.line !== undefined){commandName = 'move';}}else {command = this.matchCommand_(params.commandName);if(command){commandName = command.name;if(command.excludeFromCommandHistory){commandHistoryRegister.setText(previousCommand);}this.parseCommandArgs_(inputStream,params,command);if(command.type == 'exToKey'){ // Handle Ex to Key mapping.
for(var i=0;i < command.toKeys.length;i++) {CodeMirror.Vim.handleKey(cm,command.toKeys[i],'mapping');}return;}else if(command.type == 'exToEx'){ // Handle Ex to Ex mapping.
this.processCommand(cm,command.toInput);return;}}}if(!commandName){showConfirm(cm,'Not an editor command ":' + input + '"');return;}try{exCommands[commandName](cm,params); // Possibly asynchronous commands (e.g. substitute, which might have a
// user confirmation), are responsible for calling the callback when
// done. All others have it taken care of for them here.
if((!command || !command.possiblyAsync) && params.callback){params.callback();}}catch(e) {showConfirm(cm,e);throw e;}},parseInput_:function parseInput_(cm,inputStream,result){inputStream.eatWhile(':'); // Parse range.
if(inputStream.eat('%')){result.line = cm.firstLine();result.lineEnd = cm.lastLine();}else {result.line = this.parseLineSpec_(cm,inputStream);if(result.line !== undefined && inputStream.eat(',')){result.lineEnd = this.parseLineSpec_(cm,inputStream);}} // Parse command name.
var commandMatch=inputStream.match(/^(\w+)/);if(commandMatch){result.commandName = commandMatch[1];}else {result.commandName = inputStream.match(/.*/)[0];}return result;},parseLineSpec_:function parseLineSpec_(cm,inputStream){var numberMatch=inputStream.match(/^(\d+)/);if(numberMatch){return parseInt(numberMatch[1],10) - 1;}switch(inputStream.next()){case '.':return cm.getCursor().line;case '$':return cm.lastLine();case '\'':var mark=cm.state.vim.marks[inputStream.next()];if(mark && mark.find()){return mark.find().line;}throw new Error('Mark not set');default:inputStream.backUp(1);return undefined;}},parseCommandArgs_:function parseCommandArgs_(inputStream,params,command){if(inputStream.eol()){return;}params.argString = inputStream.match(/.*/)[0]; // Parse command-line arguments
var delim=command.argDelimiter || /\s+/;var args=trim(params.argString).split(delim);if(args.length && args[0]){params.args = args;}},matchCommand_:function matchCommand_(commandName){ // Return the command in the command map that matches the shortest
// prefix of the passed in command name. The match is guaranteed to be
// unambiguous if the defaultExCommandMap's shortNames are set up
// correctly. (see @code{defaultExCommandMap}).
for(var i=commandName.length;i > 0;i--) {var prefix=commandName.substring(0,i);if(this.commandMap_[prefix]){var command=this.commandMap_[prefix];if(command.name.indexOf(commandName) === 0){return command;}}}return null;},buildCommandMap_:function buildCommandMap_(){this.commandMap_ = {};for(var i=0;i < defaultExCommandMap.length;i++) {var command=defaultExCommandMap[i];var key=command.shortName || command.name;this.commandMap_[key] = command;}},map:function map(lhs,rhs,ctx){if(lhs != ':' && lhs.charAt(0) == ':'){if(ctx){throw Error('Mode not supported for ex mappings');}var commandName=lhs.substring(1);if(rhs != ':' && rhs.charAt(0) == ':'){ // Ex to Ex mapping
this.commandMap_[commandName] = {name:commandName,type:'exToEx',toInput:rhs.substring(1),user:true};}else { // Ex to key mapping
this.commandMap_[commandName] = {name:commandName,type:'exToKey',toKeys:rhs,user:true};}}else {if(rhs != ':' && rhs.charAt(0) == ':'){ // Key to Ex mapping.
var mapping={keys:lhs,type:'keyToEx',exArgs:{input:rhs.substring(1)},user:true};if(ctx){mapping.context = ctx;}defaultKeymap.unshift(mapping);}else { // Key to key mapping
var mapping={keys:lhs,type:'keyToKey',toKeys:rhs,user:true};if(ctx){mapping.context = ctx;}defaultKeymap.unshift(mapping);}}},unmap:function unmap(lhs,ctx){if(lhs != ':' && lhs.charAt(0) == ':'){ // Ex to Ex or Ex to key mapping
if(ctx){throw Error('Mode not supported for ex mappings');}var commandName=lhs.substring(1);if(this.commandMap_[commandName] && this.commandMap_[commandName].user){delete this.commandMap_[commandName];return;}}else { // Key to Ex or key to key mapping
var keys=lhs;for(var i=0;i < defaultKeymap.length;i++) {if(keys == defaultKeymap[i].keys && defaultKeymap[i].context === ctx && defaultKeymap[i].user){defaultKeymap.splice(i,1);return;}}}throw Error('No such mapping.');}};var exCommands={map:function map(cm,params,ctx){var mapArgs=params.args;if(!mapArgs || mapArgs.length < 2){if(cm){showConfirm(cm,'Invalid mapping: ' + params.input);}return;}exCommandDispatcher.map(mapArgs[0],mapArgs[1],ctx);},imap:function imap(cm,params){this.map(cm,params,'insert');},nmap:function nmap(cm,params){this.map(cm,params,'normal');},vmap:function vmap(cm,params){this.map(cm,params,'visual');},unmap:function unmap(cm,params,ctx){var mapArgs=params.args;if(!mapArgs || mapArgs.length < 1){if(cm){showConfirm(cm,'No such mapping: ' + params.input);}return;}exCommandDispatcher.unmap(mapArgs[0],ctx);},move:function move(cm,params){commandDispatcher.processCommand(cm,cm.state.vim,{type:'motion',motion:'moveToLineOrEdgeOfDocument',motionArgs:{forward:false,explicitRepeat:true,linewise:true},repeatOverride:params.line + 1});},set:function set(cm,params){var setArgs=params.args;if(!setArgs || setArgs.length < 1){if(cm){showConfirm(cm,'Invalid mapping: ' + params.input);}return;}var expr=setArgs[0].split('=');var optionName=expr[0];var value=expr[1];var forceGet=false;if(optionName.charAt(optionName.length - 1) == '?'){ // If post-fixed with ?, then the set is actually a get.
if(value){throw Error('Trailing characters: ' + params.argString);}optionName = optionName.substring(0,optionName.length - 1);forceGet = true;}if(value === undefined && optionName.substring(0,2) == 'no'){ // To set boolean options to false, the option name is prefixed with
// 'no'.
optionName = optionName.substring(2);value = false;}var optionIsBoolean=options[optionName] && options[optionName].type == 'boolean';if(optionIsBoolean && value == undefined){ // Calling set with a boolean option sets it to true.
value = true;}if(!optionIsBoolean && !value || forceGet){var oldValue=getOption(optionName); // If no value is provided, then we assume this is a get.
if(oldValue === true || oldValue === false){showConfirm(cm,' ' + (oldValue?'':'no') + optionName);}else {showConfirm(cm,'  ' + optionName + '=' + oldValue);}}else {setOption(optionName,value);}},registers:function registers(cm,params){var regArgs=params.args;var registers=vimGlobalState.registerController.registers;var regInfo='----------Registers----------<br><br>';if(!regArgs){for(var registerName in registers) {var text=registers[registerName].toString();if(text.length){regInfo += '"' + registerName + '    ' + text + '<br>';}}}else {var registerName;regArgs = regArgs.join('');for(var i=0;i < regArgs.length;i++) {registerName = regArgs.charAt(i);if(!vimGlobalState.registerController.isValidRegister(registerName)){continue;}var register=registers[registerName] || new Register();regInfo += '"' + registerName + '    ' + register.toString() + '<br>';}}showConfirm(cm,regInfo);},sort:function sort(cm,params){var reverse,ignoreCase,unique,number;function parseArgs(){if(params.argString){var args=new CodeMirror.StringStream(params.argString);if(args.eat('!')){reverse = true;}if(args.eol()){return;}if(!args.eatSpace()){return 'Invalid arguments';}var opts=args.match(/[a-z]+/);if(opts){opts = opts[0];ignoreCase = opts.indexOf('i') != -1;unique = opts.indexOf('u') != -1;var decimal=opts.indexOf('d') != -1 && 1;var hex=opts.indexOf('x') != -1 && 1;var octal=opts.indexOf('o') != -1 && 1;if(decimal + hex + octal > 1){return 'Invalid arguments';}number = decimal && 'decimal' || hex && 'hex' || octal && 'octal';}if(args.eatSpace() && args.match(/\/.*\//)){'patterns not supported';}}}var err=parseArgs();if(err){showConfirm(cm,err + ': ' + params.argString);return;}var lineStart=params.line || cm.firstLine();var lineEnd=params.lineEnd || params.line || cm.lastLine();if(lineStart == lineEnd){return;}var curStart=Pos(lineStart,0);var curEnd=Pos(lineEnd,lineLength(cm,lineEnd));var text=cm.getRange(curStart,curEnd).split('\n');var numberRegex=number == 'decimal'?/(-?)([\d]+)/:number == 'hex'?/(-?)(?:0x)?([0-9a-f]+)/i:number == 'octal'?/([0-7]+)/:null;var radix=number == 'decimal'?10:number == 'hex'?16:number == 'octal'?8:null;var numPart=[],textPart=[];if(number){for(var i=0;i < text.length;i++) {if(numberRegex.exec(text[i])){numPart.push(text[i]);}else {textPart.push(text[i]);}}}else {textPart = text;}function compareFn(a,b){if(reverse){var tmp;tmp = a;a = b;b = tmp;}if(ignoreCase){a = a.toLowerCase();b = b.toLowerCase();}var anum=number && numberRegex.exec(a);var bnum=number && numberRegex.exec(b);if(!anum){return a < b?-1:1;}anum = parseInt((anum[1] + anum[2]).toLowerCase(),radix);bnum = parseInt((bnum[1] + bnum[2]).toLowerCase(),radix);return anum - bnum;}numPart.sort(compareFn);textPart.sort(compareFn);text = !reverse?textPart.concat(numPart):numPart.concat(textPart);if(unique){ // Remove duplicate lines
var textOld=text;var lastLine;text = [];for(var i=0;i < textOld.length;i++) {if(textOld[i] != lastLine){text.push(textOld[i]);}lastLine = textOld[i];}}cm.replaceRange(text.join('\n'),curStart,curEnd);},global:function global(cm,params){ // a global command is of the form
// :[range]g/pattern/[cmd]
// argString holds the string /pattern/[cmd]
var argString=params.argString;if(!argString){showConfirm(cm,'Regular Expression missing from global');return;} // range is specified here
var lineStart=params.line !== undefined?params.line:cm.firstLine();var lineEnd=params.lineEnd || params.line || cm.lastLine(); // get the tokens from argString
var tokens=splitBySlash(argString);var regexPart=argString,cmd;if(tokens.length){regexPart = tokens[0];cmd = tokens.slice(1,tokens.length).join('/');}if(regexPart){ // If regex part is empty, then use the previous query. Otherwise
// use the regex part as the new query.
try{updateSearchQuery(cm,regexPart,true, /** ignoreCase */true /** smartCase */);}catch(e) {showConfirm(cm,'Invalid regex: ' + regexPart);return;}} // now that we have the regexPart, search for regex matches in the
// specified range of lines
var query=getSearchState(cm).getQuery();var matchedLines=[],content='';for(var i=lineStart;i <= lineEnd;i++) {var matched=query.test(cm.getLine(i));if(matched){matchedLines.push(i + 1);content += cm.getLine(i) + '<br>';}} // if there is no [cmd], just display the list of matched lines
if(!cmd){showConfirm(cm,content);return;}var index=0;var nextCommand=function nextCommand(){if(index < matchedLines.length){var command=matchedLines[index] + cmd;exCommandDispatcher.processCommand(cm,command,{callback:nextCommand});}index++;};nextCommand();},substitute:function substitute(cm,params){if(!cm.getSearchCursor){throw new Error('Search feature not available. Requires searchcursor.js or ' + 'any other getSearchCursor implementation.');}var argString=params.argString;var tokens=argString?splitBySlash(argString):[];var regexPart,replacePart='',trailing,flagsPart,count;var confirm=false; // Whether to confirm each replace.
var global=false; // True to replace all instances on a line, false to replace only 1.
if(tokens.length){regexPart = tokens[0];replacePart = tokens[1];if(replacePart !== undefined){if(getOption('pcre')){replacePart = unescapeRegexReplace(replacePart);}else {replacePart = translateRegexReplace(replacePart);}vimGlobalState.lastSubstituteReplacePart = replacePart;}trailing = tokens[2]?tokens[2].split(' '):[];}else { // either the argString is empty or its of the form ' hello/world'
// actually splitBySlash returns a list of tokens
// only if the string starts with a '/'
if(argString && argString.length){showConfirm(cm,'Substitutions should be of the form ' + ':s/pattern/replace/');return;}} // After the 3rd slash, we can have flags followed by a space followed
// by count.
if(trailing){flagsPart = trailing[0];count = parseInt(trailing[1]);if(flagsPart){if(flagsPart.indexOf('c') != -1){confirm = true;flagsPart.replace('c','');}if(flagsPart.indexOf('g') != -1){global = true;flagsPart.replace('g','');}regexPart = regexPart + '/' + flagsPart;}}if(regexPart){ // If regex part is empty, then use the previous query. Otherwise use
// the regex part as the new query.
try{updateSearchQuery(cm,regexPart,true, /** ignoreCase */true /** smartCase */);}catch(e) {showConfirm(cm,'Invalid regex: ' + regexPart);return;}}replacePart = replacePart || vimGlobalState.lastSubstituteReplacePart;if(replacePart === undefined){showConfirm(cm,'No previous substitute regular expression');return;}var state=getSearchState(cm);var query=state.getQuery();var lineStart=params.line !== undefined?params.line:cm.getCursor().line;var lineEnd=params.lineEnd || lineStart;if(count){lineStart = lineEnd;lineEnd = lineStart + count - 1;}var startPos=clipCursorToContent(cm,Pos(lineStart,0));var cursor=cm.getSearchCursor(query,startPos);doReplace(cm,confirm,global,lineStart,lineEnd,cursor,query,replacePart,params.callback);},redo:CodeMirror.commands.redo,undo:CodeMirror.commands.undo,write:function write(cm){if(CodeMirror.commands.save){ // If a save command is defined, call it.
CodeMirror.commands.save(cm);}else { // Saves to text area if no save command is defined.
cm.save();}},nohlsearch:function nohlsearch(cm){clearSearchHighlight(cm);},delmarks:function delmarks(cm,params){if(!params.argString || !trim(params.argString)){showConfirm(cm,'Argument required');return;}var state=cm.state.vim;var stream=new CodeMirror.StringStream(trim(params.argString));while(!stream.eol()) {stream.eatSpace(); // Record the streams position at the beginning of the loop for use
// in error messages.
var count=stream.pos;if(!stream.match(/[a-zA-Z]/,false)){showConfirm(cm,'Invalid argument: ' + params.argString.substring(count));return;}var sym=stream.next(); // Check if this symbol is part of a range
if(stream.match('-',true)){ // This symbol is part of a range.
// The range must terminate at an alphabetic character.
if(!stream.match(/[a-zA-Z]/,false)){showConfirm(cm,'Invalid argument: ' + params.argString.substring(count));return;}var startMark=sym;var finishMark=stream.next(); // The range must terminate at an alphabetic character which
// shares the same case as the start of the range.
if(isLowerCase(startMark) && isLowerCase(finishMark) || isUpperCase(startMark) && isUpperCase(finishMark)){var start=startMark.charCodeAt(0);var finish=finishMark.charCodeAt(0);if(start >= finish){showConfirm(cm,'Invalid argument: ' + params.argString.substring(count));return;} // Because marks are always ASCII values, and we have
// determined that they are the same case, we can use
// their char codes to iterate through the defined range.
for(var j=0;j <= finish - start;j++) {var mark=String.fromCharCode(start + j);delete state.marks[mark];}}else {showConfirm(cm,'Invalid argument: ' + startMark + '-');return;}}else { // This symbol is a valid mark, and is not part of a range.
delete state.marks[sym];}}}};var exCommandDispatcher=new ExCommandDispatcher(); /**
    * @param {CodeMirror} cm CodeMirror instance we are in.
    * @param {boolean} confirm Whether to confirm each replace.
    * @param {Cursor} lineStart Line to start replacing from.
    * @param {Cursor} lineEnd Line to stop replacing at.
    * @param {RegExp} query Query for performing matches with.
    * @param {string} replaceWith Text to replace matches with. May contain $1,
    *     $2, etc for replacing captured groups using Javascript replace.
    * @param {function()} callback A callback for when the replace is done.
    */function doReplace(cm,confirm,global,lineStart,lineEnd,searchCursor,query,replaceWith,callback){ // Set up all the functions.
cm.state.vim.exMode = true;var done=false;var lastPos=searchCursor.from();function replaceAll(){cm.operation(function(){while(!done) {replace();next();}stop();});}function replace(){var text=cm.getRange(searchCursor.from(),searchCursor.to());var newText=text.replace(query,replaceWith);searchCursor.replace(newText);}function next(){var found; // The below only loops to skip over multiple occurrences on the same
// line when 'global' is not true.
while(found = searchCursor.findNext() && isInRange(searchCursor.from(),lineStart,lineEnd)) {if(!global && lastPos && searchCursor.from().line == lastPos.line){continue;}cm.scrollIntoView(searchCursor.from(),30);cm.setSelection(searchCursor.from(),searchCursor.to());lastPos = searchCursor.from();done = false;return;}done = true;}function stop(close){if(close){close();}cm.focus();if(lastPos){cm.setCursor(lastPos);var vim=cm.state.vim;vim.exMode = false;vim.lastHPos = vim.lastHSPos = lastPos.ch;}if(callback){callback();}}function onPromptKeyDown(e,_value,close){ // Swallow all keys.
CodeMirror.e_stop(e);var keyName=CodeMirror.keyName(e);switch(keyName){case 'Y':replace();next();break;case 'N':next();break;case 'A': // replaceAll contains a call to close of its own. We don't want it
// to fire too early or multiple times.
var savedCallback=callback;callback = undefined;cm.operation(replaceAll);callback = savedCallback;break;case 'L':replace(); // fall through and exit.
case 'Q':case 'Esc':case 'Ctrl-C':case 'Ctrl-[':stop(close);break;}if(done){stop(close);}return true;} // Actually do replace.
next();if(done){showConfirm(cm,'No matches for ' + query.source);return;}if(!confirm){replaceAll();if(callback){callback();};return;}showPrompt(cm,{prefix:'replace with <strong>' + replaceWith + '</strong> (y/n/a/q/l)',onKeyDown:onPromptKeyDown});}CodeMirror.keyMap.vim = {attach:attachVimMap,detach:detachVimMap,call:cmKey};function exitInsertMode(cm){var vim=cm.state.vim;var macroModeState=vimGlobalState.macroModeState;var insertModeChangeRegister=vimGlobalState.registerController.getRegister('.');var isPlaying=macroModeState.isPlaying;var lastChange=macroModeState.lastInsertModeChanges; // In case of visual block, the insertModeChanges are not saved as a
// single word, so we convert them to a single word
// so as to update the ". register as expected in real vim.
var text=[];if(!isPlaying){var selLength=lastChange.inVisualBlock?vim.lastSelection.visualBlock.height:1;var changes=lastChange.changes;var text=[];var i=0; // In case of multiple selections in blockwise visual,
// the inserted text, for example: 'f<Backspace>oo', is stored as
// 'f', 'f', InsertModeKey 'o', 'o', 'o', 'o'. (if you have a block with 2 lines).
// We push the contents of the changes array as per the following:
// 1. In case of InsertModeKey, just increment by 1.
// 2. In case of a character, jump by selLength (2 in the example).
while(i < changes.length) { // This loop will convert 'ff<bs>oooo' to 'f<bs>oo'.
text.push(changes[i]);if(changes[i] instanceof InsertModeKey){i++;}else {i += selLength;}}lastChange.changes = text;cm.off('change',onChange);CodeMirror.off(cm.getInputField(),'keydown',onKeyEventTargetKeyDown);}if(!isPlaying && vim.insertModeRepeat > 1){ // Perform insert mode repeat for commands like 3,a and 3,o.
_repeatLastEdit(cm,vim,vim.insertModeRepeat - 1,true /** repeatForInsert */);vim.lastEditInputState.repeatOverride = vim.insertModeRepeat;}delete vim.insertModeRepeat;vim.insertMode = false;cm.setCursor(cm.getCursor().line,cm.getCursor().ch - 1);cm.setOption('keyMap','vim');cm.setOption('disableInput',true);cm.toggleOverwrite(false); // exit replace mode if we were in it.
// update the ". register before exiting insert mode
insertModeChangeRegister.setText(lastChange.changes.join(''));CodeMirror.signal(cm,"vim-mode-change",{mode:"normal"});if(macroModeState.isRecording){logInsertModeChange(macroModeState);}}function _mapCommand(command){defaultKeymap.push(command);}function mapCommand(keys,type,name,args,extra){var command={keys:keys,type:type};command[type] = name;command[type + "Args"] = args;for(var key in extra) command[key] = extra[key];_mapCommand(command);} // The timeout in milliseconds for the two-character ESC keymap should be
// adjusted according to your typing speed to prevent false positives.
defineOption('insertModeEscKeysTimeout',200,'number');CodeMirror.keyMap['vim-insert'] = { // TODO: override navigation keys so that Esc will cancel automatic
// indentation from o, O, i_<CR>
'Ctrl-N':'autocomplete','Ctrl-P':'autocomplete','Enter':function Enter(cm){var fn=CodeMirror.commands.newlineAndIndentContinueComment || CodeMirror.commands.newlineAndIndent;fn(cm);},fallthrough:['default'],attach:attachVimMap,detach:detachVimMap,call:cmKey};CodeMirror.keyMap['vim-replace'] = {'Backspace':'goCharLeft',fallthrough:['vim-insert'],attach:attachVimMap,detach:detachVimMap,call:cmKey};function executeMacroRegister(cm,vim,macroModeState,registerName){var register=vimGlobalState.registerController.getRegister(registerName);var keyBuffer=register.keyBuffer;var imc=0;macroModeState.isPlaying = true;macroModeState.replaySearchQueries = register.searchQueries.slice(0);for(var i=0;i < keyBuffer.length;i++) {var text=keyBuffer[i];var match,key;while(text) { // Pull off one command key, which is either a single character
// or a special sequence wrapped in '<' and '>', e.g. '<Space>'.
match = /<\w+-.+?>|<\w+>|./.exec(text);key = match[0];text = text.substring(match.index + key.length);CodeMirror.Vim.handleKey(cm,key,'macro');if(vim.insertMode){var changes=register.insertModeChanges[imc++].changes;vimGlobalState.macroModeState.lastInsertModeChanges.changes = changes;repeatInsertModeChanges(cm,changes,1);exitInsertMode(cm);}}};macroModeState.isPlaying = false;}function logKey(macroModeState,key){if(macroModeState.isPlaying){return;}var registerName=macroModeState.latestRegister;var register=vimGlobalState.registerController.getRegister(registerName);if(register){register.pushText(key);}}function logInsertModeChange(macroModeState){if(macroModeState.isPlaying){return;}var registerName=macroModeState.latestRegister;var register=vimGlobalState.registerController.getRegister(registerName);if(register){register.pushInsertModeChanges(macroModeState.lastInsertModeChanges);}}function logSearchQuery(macroModeState,query){if(macroModeState.isPlaying){return;}var registerName=macroModeState.latestRegister;var register=vimGlobalState.registerController.getRegister(registerName);if(register){register.pushSearchQuery(query);}} /**
     * Listens for changes made in insert mode.
     * Should only be active in insert mode.
     */function onChange(_cm,changeObj){var macroModeState=vimGlobalState.macroModeState;var lastChange=macroModeState.lastInsertModeChanges;if(!macroModeState.isPlaying){while(changeObj) {lastChange.expectCursorActivityForChange = true;if(changeObj.origin == '+input' || changeObj.origin == 'paste' || changeObj.origin === undefined /* only in testing */){var text=changeObj.text.join('\n');lastChange.changes.push(text);} // Change objects may be chained with next.
changeObj = changeObj.next;}}} /**
    * Listens for any kind of cursor activity on CodeMirror.
    */function onCursorActivity(cm){var vim=cm.state.vim;if(vim.insertMode){ // Tracking cursor activity in insert mode (for macro support).
var macroModeState=vimGlobalState.macroModeState;if(macroModeState.isPlaying){return;}var lastChange=macroModeState.lastInsertModeChanges;if(lastChange.expectCursorActivityForChange){lastChange.expectCursorActivityForChange = false;}else { // Cursor moved outside the context of an edit. Reset the change.
lastChange.changes = [];}}else if(!cm.curOp.isVimOp){handleExternalSelection(cm,vim);}if(vim.visualMode){updateFakeCursor(cm);}}function updateFakeCursor(cm){var vim=cm.state.vim;var from=copyCursor(vim.sel.head);var to=offsetCursor(from,0,1);if(vim.fakeCursor){vim.fakeCursor.clear();}vim.fakeCursor = cm.markText(from,to,{className:'cm-animate-fat-cursor'});}function handleExternalSelection(cm,vim){var anchor=cm.getCursor('anchor');var head=cm.getCursor('head'); // Enter or exit visual mode to match mouse selection.
if(vim.visualMode && !cm.somethingSelected()){exitVisualMode(cm,false);}else if(!vim.visualMode && !vim.insertMode && cm.somethingSelected()){vim.visualMode = true;vim.visualLine = false;CodeMirror.signal(cm,"vim-mode-change",{mode:"visual"});}if(vim.visualMode){ // Bind CodeMirror selection model to vim selection model.
// Mouse selections are considered visual characterwise.
var headOffset=!cursorIsBefore(head,anchor)?-1:0;var anchorOffset=cursorIsBefore(head,anchor)?-1:0;head = offsetCursor(head,0,headOffset);anchor = offsetCursor(anchor,0,anchorOffset);vim.sel = {anchor:anchor,head:head};updateMark(cm,vim,'<',cursorMin(head,anchor));updateMark(cm,vim,'>',cursorMax(head,anchor));}else if(!vim.insertMode){ // Reset lastHPos if selection was modified by something outside of vim mode e.g. by mouse.
vim.lastHPos = cm.getCursor().ch;}} /** Wrapper for special keys pressed in insert mode */function InsertModeKey(keyName){this.keyName = keyName;} /**
    * Handles raw key down events from the text area.
    * - Should only be active in insert mode.
    * - For recording deletes in insert mode.
    */function onKeyEventTargetKeyDown(e){var macroModeState=vimGlobalState.macroModeState;var lastChange=macroModeState.lastInsertModeChanges;var keyName=CodeMirror.keyName(e);if(!keyName){return;}function onKeyFound(){lastChange.changes.push(new InsertModeKey(keyName));return true;}if(keyName.indexOf('Delete') != -1 || keyName.indexOf('Backspace') != -1){CodeMirror.lookupKey(keyName,'vim-insert',onKeyFound);}} /**
     * Repeats the last edit, which includes exactly 1 command and at most 1
     * insert. Operator and motion commands are read from lastEditInputState,
     * while action commands are read from lastEditActionCommand.
     *
     * If repeatForInsert is true, then the function was called by
     * exitInsertMode to repeat the insert mode changes the user just made. The
     * corresponding enterInsertMode call was made with a count.
     */function _repeatLastEdit(cm,vim,repeat,repeatForInsert){var macroModeState=vimGlobalState.macroModeState;macroModeState.isPlaying = true;var isAction=!!vim.lastEditActionCommand;var cachedInputState=vim.inputState;function repeatCommand(){if(isAction){commandDispatcher.processAction(cm,vim,vim.lastEditActionCommand);}else {commandDispatcher.evalInput(cm,vim);}}function repeatInsert(repeat){if(macroModeState.lastInsertModeChanges.changes.length > 0){ // For some reason, repeat cw in desktop VIM does not repeat
// insert mode changes. Will conform to that behavior.
repeat = !vim.lastEditActionCommand?1:repeat;var changeObject=macroModeState.lastInsertModeChanges;repeatInsertModeChanges(cm,changeObject.changes,repeat);}}vim.inputState = vim.lastEditInputState;if(isAction && vim.lastEditActionCommand.interlaceInsertRepeat){ // o and O repeat have to be interlaced with insert repeats so that the
// insertions appear on separate lines instead of the last line.
for(var i=0;i < repeat;i++) {repeatCommand();repeatInsert(1);}}else {if(!repeatForInsert){ // Hack to get the cursor to end up at the right place. If I is
// repeated in insert mode repeat, cursor will be 1 insert
// change set left of where it should be.
repeatCommand();}repeatInsert(repeat);}vim.inputState = cachedInputState;if(vim.insertMode && !repeatForInsert){ // Don't exit insert mode twice. If repeatForInsert is set, then we
// were called by an exitInsertMode call lower on the stack.
exitInsertMode(cm);}macroModeState.isPlaying = false;};function repeatInsertModeChanges(cm,changes,repeat){function keyHandler(binding){if(typeof binding == 'string'){CodeMirror.commands[binding](cm);}else {binding(cm);}return true;}var head=cm.getCursor('head');var inVisualBlock=vimGlobalState.macroModeState.lastInsertModeChanges.inVisualBlock;if(inVisualBlock){ // Set up block selection again for repeating the changes.
var vim=cm.state.vim;var lastSel=vim.lastSelection;var offset=getOffset(lastSel.anchor,lastSel.head);selectForInsert(cm,head,offset.line + 1);repeat = cm.listSelections().length;cm.setCursor(head);}for(var i=0;i < repeat;i++) {if(inVisualBlock){cm.setCursor(offsetCursor(head,i,0));}for(var j=0;j < changes.length;j++) {var change=changes[j];if(change instanceof InsertModeKey){CodeMirror.lookupKey(change.keyName,'vim-insert',keyHandler);}else {var cur=cm.getCursor();cm.replaceRange(change,cur,cur);}}}if(inVisualBlock){cm.setCursor(offsetCursor(head,0,1));}}resetVimGlobalState();return vimApi;}; // Initialize Vim and make it available as an API.
CodeMirror.Vim = Vim();}); /**
 * Supported keybindings:
 *
 *   Motion:
 *   h, j, k, l
 *   gj, gk
 *   e, E, w, W, b, B, ge, gE
 *   f<character>, F<character>, t<character>, T<character>
 *   $, ^, 0, -, +, _
 *   gg, G
 *   %
 *   '<character>, `<character>
 *
 *   Operator:
 *   d, y, c
 *   dd, yy, cc
 *   g~, g~g~
 *   >, <, >>, <<
 *
 *   Operator-Motion:
 *   x, X, D, Y, C, ~
 *
 *   Action:
 *   a, i, s, A, I, S, o, O
 *   zz, z., z<CR>, zt, zb, z-
 *   J
 *   u, Ctrl-r
 *   m<character>
 *   r<character>
 *
 *   Modes:
 *   ESC - leave insert mode, visual mode, and clear input state.
 *   Ctrl-[, Ctrl-c - same as ESC.
 *
 * Registers: unnamed, -, a-z, A-Z, 0-9
 *   (Does not respect the special case for number registers when delete
 *    operator is made with these commands: %, (, ),  , /, ?, n, N, {, } )
 *   TODO: Implement the remaining registers.
 * Marks: a-z, A-Z, and 0-9
 *   TODO: Implement the remaining special marks. They have more complex
 *       behavior.
 *
 * Events:
 *  'vim-mode-change' - raised on the editor anytime the current mode changes,
 *                      Event object: {mode: "visual", subMode: "linewise"}
 *
 * Code structure:
 *  1. Default keymap
 *  2. Variable declarations and short basic helpers
 *  3. Instance (External API) implementation
 *  4. Internal state tracking objects (input state, counter) implementation
 *     and instanstiation
 *  5. Key handler (the main command dispatcher) implementation
 *  6. Motion, operator, and action implementations
 *  7. Helper functions for the key handler, motions, operators, and actions
 *  8. Set up Vim to work as a keymap for CodeMirror.
 */

},{"../addon/dialog/dialog":32,"../addon/edit/matchbrackets.js":33,"../addon/search/searchcursor":34,"../lib/codemirror":36}],36:[function(require,module,exports){
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE
// This is CodeMirror (http://codemirror.net), a code editor
// implemented in JavaScript on top of the browser's DOM.
//
// You can find some technical background for some of the code below
"use strict";(function(mod){if(typeof exports == "object" && typeof module == "object") // CommonJS
module.exports = mod();else if(typeof define == "function" && define.amd) // AMD
return define([],mod);else  // Plain browser env
this.CodeMirror = mod();})(function(){"use strict"; // BROWSER SNIFFING
// Kludges for bugs and behavior differences that can't be feature
// detected are enabled based on userAgent etc sniffing.
var gecko=/gecko\/\d/i.test(navigator.userAgent);var ie_upto10=/MSIE \d/.test(navigator.userAgent);var ie_11up=/Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);var ie=ie_upto10 || ie_11up;var ie_version=ie && (ie_upto10?document.documentMode || 6:ie_11up[1]);var webkit=/WebKit\//.test(navigator.userAgent);var qtwebkit=webkit && /Qt\/\d+\.\d+/.test(navigator.userAgent);var chrome=/Chrome\//.test(navigator.userAgent);var presto=/Opera\//.test(navigator.userAgent);var safari=/Apple Computer/.test(navigator.vendor);var mac_geMountainLion=/Mac OS X 1\d\D([8-9]|\d\d)\D/.test(navigator.userAgent);var phantom=/PhantomJS/.test(navigator.userAgent);var ios=/AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent); // This is woefully incomplete. Suggestions for alternative methods welcome.
var mobile=ios || /Android|webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(navigator.userAgent);var mac=ios || /Mac/.test(navigator.platform);var windows=/win/i.test(navigator.platform);var presto_version=presto && navigator.userAgent.match(/Version\/(\d*\.\d*)/);if(presto_version)presto_version = Number(presto_version[1]);if(presto_version && presto_version >= 15){presto = false;webkit = true;} // Some browsers use the wrong event properties to signal cmd/ctrl on OS X
var flipCtrlCmd=mac && (qtwebkit || presto && (presto_version == null || presto_version < 12.11));var captureRightClick=gecko || ie && ie_version >= 9; // Optimize some code when these features are not used.
var sawReadOnlySpans=false,sawCollapsedSpans=false; // EDITOR CONSTRUCTOR
// A CodeMirror instance represents an editor. This is the object
// that user code is usually dealing with.
function CodeMirror(place,options){if(!(this instanceof CodeMirror))return new CodeMirror(place,options);this.options = options = options?copyObj(options):{}; // Determine effective options based on given values and defaults.
copyObj(defaults,options,false);setGuttersForLineNumbers(options);var doc=options.value;if(typeof doc == "string")doc = new Doc(doc,options.mode);this.doc = doc;var input=new CodeMirror.inputStyles[options.inputStyle](this);var display=this.display = new Display(place,doc,input);display.wrapper.CodeMirror = this;updateGutters(this);themeChanged(this);if(options.lineWrapping)this.display.wrapper.className += " CodeMirror-wrap";if(options.autofocus && !mobile)display.input.focus();initScrollbars(this);this.state = {keyMaps:[], // stores maps added by addKeyMap
overlays:[], // highlighting overlays, as added by addOverlay
modeGen:0, // bumped when mode/overlay changes, used to invalidate highlighting info
overwrite:false,delayingBlurEvent:false,focused:false,suppressEdits:false, // used to disable editing during key handlers when in readOnly mode
pasteIncoming:false,cutIncoming:false, // help recognize paste/cut edits in input.poll
draggingText:false,highlight:new Delayed(), // stores highlight worker timeout
keySeq:null, // Unfinished key sequence
specialChars:null};var cm=this; // Override magic textarea content restore that IE sometimes does
// on our hidden textarea on reload
if(ie && ie_version < 11)setTimeout(function(){cm.display.input.reset(true);},20);registerEventHandlers(this);ensureGlobalHandlers();startOperation(this);this.curOp.forceUpdate = true;attachDoc(this,doc);if(options.autofocus && !mobile || cm.hasFocus())setTimeout(bind(onFocus,this),20);else onBlur(this);for(var opt in optionHandlers) if(optionHandlers.hasOwnProperty(opt))optionHandlers[opt](this,options[opt],Init);maybeUpdateLineNumberWidth(this);if(options.finishInit)options.finishInit(this);for(var i=0;i < initHooks.length;++i) initHooks[i](this);endOperation(this); // Suppress optimizelegibility in Webkit, since it breaks text
// measuring on line wrapping boundaries.
if(webkit && options.lineWrapping && getComputedStyle(display.lineDiv).textRendering == "optimizelegibility")display.lineDiv.style.textRendering = "auto";} // DISPLAY CONSTRUCTOR
// The display handles the DOM integration, both for input reading
// and content drawing. It holds references to DOM nodes and
// display-related state.
function Display(place,doc,input){var d=this;this.input = input; // Covers bottom-right square when both scrollbars are present.
d.scrollbarFiller = elt("div",null,"CodeMirror-scrollbar-filler");d.scrollbarFiller.setAttribute("cm-not-content","true"); // Covers bottom of gutter when coverGutterNextToScrollbar is on
// and h scrollbar is present.
d.gutterFiller = elt("div",null,"CodeMirror-gutter-filler");d.gutterFiller.setAttribute("cm-not-content","true"); // Will contain the actual code, positioned to cover the viewport.
d.lineDiv = elt("div",null,"CodeMirror-code"); // Elements are added to these to represent selection and cursors.
d.selectionDiv = elt("div",null,null,"position: relative; z-index: 1");d.cursorDiv = elt("div",null,"CodeMirror-cursors"); // A visibility: hidden element used to find the size of things.
d.measure = elt("div",null,"CodeMirror-measure"); // When lines outside of the viewport are measured, they are drawn in this.
d.lineMeasure = elt("div",null,"CodeMirror-measure"); // Wraps everything that needs to exist inside the vertically-padded coordinate system
d.lineSpace = elt("div",[d.measure,d.lineMeasure,d.selectionDiv,d.cursorDiv,d.lineDiv],null,"position: relative; outline: none"); // Moved around its parent to cover visible view.
d.mover = elt("div",[elt("div",[d.lineSpace],"CodeMirror-lines")],null,"position: relative"); // Set to the height of the document, allowing scrolling.
d.sizer = elt("div",[d.mover],"CodeMirror-sizer");d.sizerWidth = null; // Behavior of elts with overflow: auto and padding is
// inconsistent across browsers. This is used to ensure the
// scrollable area is big enough.
d.heightForcer = elt("div",null,null,"position: absolute; height: " + scrollerGap + "px; width: 1px;"); // Will contain the gutters, if any.
d.gutters = elt("div",null,"CodeMirror-gutters");d.lineGutter = null; // Actual scrollable element.
d.scroller = elt("div",[d.sizer,d.heightForcer,d.gutters],"CodeMirror-scroll");d.scroller.setAttribute("tabIndex","-1"); // The element in which the editor lives.
d.wrapper = elt("div",[d.scrollbarFiller,d.gutterFiller,d.scroller],"CodeMirror"); // Work around IE7 z-index bug (not perfect, hence IE7 not really being supported)
if(ie && ie_version < 8){d.gutters.style.zIndex = -1;d.scroller.style.paddingRight = 0;}if(!webkit && !(gecko && mobile))d.scroller.draggable = true;if(place){if(place.appendChild)place.appendChild(d.wrapper);else place(d.wrapper);} // Current rendered range (may be bigger than the view window).
d.viewFrom = d.viewTo = doc.first;d.reportedViewFrom = d.reportedViewTo = doc.first; // Information about the rendered lines.
d.view = [];d.renderedView = null; // Holds info about a single rendered line when it was rendered
// for measurement, while not in view.
d.externalMeasured = null; // Empty space (in pixels) above the view
d.viewOffset = 0;d.lastWrapHeight = d.lastWrapWidth = 0;d.updateLineNumbers = null;d.nativeBarWidth = d.barHeight = d.barWidth = 0;d.scrollbarsClipped = false; // Used to only resize the line number gutter when necessary (when
// the amount of lines crosses a boundary that makes its width change)
d.lineNumWidth = d.lineNumInnerWidth = d.lineNumChars = null; // Set to true when a non-horizontal-scrolling line widget is
// added. As an optimization, line widget aligning is skipped when
// this is false.
d.alignWidgets = false;d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null; // Tracks the maximum line length so that the horizontal scrollbar
// can be kept static when scrolling.
d.maxLine = null;d.maxLineLength = 0;d.maxLineChanged = false; // Used for measuring wheel scrolling granularity
d.wheelDX = d.wheelDY = d.wheelStartX = d.wheelStartY = null; // True when shift is held down.
d.shift = false; // Used to track whether anything happened since the context menu
// was opened.
d.selForContextMenu = null;d.activeTouch = null;input.init(d);} // STATE UPDATES
// Used to get the editor into a consistent state again when options change.
function loadMode(cm){cm.doc.mode = CodeMirror.getMode(cm.options,cm.doc.modeOption);resetModeState(cm);}function resetModeState(cm){cm.doc.iter(function(line){if(line.stateAfter)line.stateAfter = null;if(line.styles)line.styles = null;});cm.doc.frontier = cm.doc.first;startWorker(cm,100);cm.state.modeGen++;if(cm.curOp)regChange(cm);}function wrappingChanged(cm){if(cm.options.lineWrapping){addClass(cm.display.wrapper,"CodeMirror-wrap");cm.display.sizer.style.minWidth = "";cm.display.sizerWidth = null;}else {rmClass(cm.display.wrapper,"CodeMirror-wrap");findMaxLine(cm);}estimateLineHeights(cm);regChange(cm);clearCaches(cm);setTimeout(function(){updateScrollbars(cm);},100);} // Returns a function that estimates the height of a line, to use as
// first approximation until the line becomes visible (and is thus
// properly measurable).
function estimateHeight(cm){var th=textHeight(cm.display),wrapping=cm.options.lineWrapping;var perLine=wrapping && Math.max(5,cm.display.scroller.clientWidth / charWidth(cm.display) - 3);return function(line){if(lineIsHidden(cm.doc,line))return 0;var widgetsHeight=0;if(line.widgets)for(var i=0;i < line.widgets.length;i++) {if(line.widgets[i].height)widgetsHeight += line.widgets[i].height;}if(wrapping)return widgetsHeight + (Math.ceil(line.text.length / perLine) || 1) * th;else return widgetsHeight + th;};}function estimateLineHeights(cm){var doc=cm.doc,est=estimateHeight(cm);doc.iter(function(line){var estHeight=est(line);if(estHeight != line.height)updateLineHeight(line,estHeight);});}function themeChanged(cm){cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-s-\S+/g,"") + cm.options.theme.replace(/(^|\s)\s*/g," cm-s-");clearCaches(cm);}function guttersChanged(cm){updateGutters(cm);regChange(cm);setTimeout(function(){alignHorizontally(cm);},20);} // Rebuild the gutter elements, ensure the margin to the left of the
// code matches their width.
function updateGutters(cm){var gutters=cm.display.gutters,specs=cm.options.gutters;removeChildren(gutters);for(var i=0;i < specs.length;++i) {var gutterClass=specs[i];var gElt=gutters.appendChild(elt("div",null,"CodeMirror-gutter " + gutterClass));if(gutterClass == "CodeMirror-linenumbers"){cm.display.lineGutter = gElt;gElt.style.width = (cm.display.lineNumWidth || 1) + "px";}}gutters.style.display = i?"":"none";updateGutterSpace(cm);}function updateGutterSpace(cm){var width=cm.display.gutters.offsetWidth;cm.display.sizer.style.marginLeft = width + "px";} // Compute the character length of a line, taking into account
// collapsed ranges (see markText) that might hide parts, and join
// other lines onto it.
function lineLength(line){if(line.height == 0)return 0;var len=line.text.length,merged,cur=line;while(merged = collapsedSpanAtStart(cur)) {var found=merged.find(0,true);cur = found.from.line;len += found.from.ch - found.to.ch;}cur = line;while(merged = collapsedSpanAtEnd(cur)) {var found=merged.find(0,true);len -= cur.text.length - found.from.ch;cur = found.to.line;len += cur.text.length - found.to.ch;}return len;} // Find the longest line in the document.
function findMaxLine(cm){var d=cm.display,doc=cm.doc;d.maxLine = getLine(doc,doc.first);d.maxLineLength = lineLength(d.maxLine);d.maxLineChanged = true;doc.iter(function(line){var len=lineLength(line);if(len > d.maxLineLength){d.maxLineLength = len;d.maxLine = line;}});} // Make sure the gutters options contains the element
// "CodeMirror-linenumbers" when the lineNumbers option is true.
function setGuttersForLineNumbers(options){var found=indexOf(options.gutters,"CodeMirror-linenumbers");if(found == -1 && options.lineNumbers){options.gutters = options.gutters.concat(["CodeMirror-linenumbers"]);}else if(found > -1 && !options.lineNumbers){options.gutters = options.gutters.slice(0);options.gutters.splice(found,1);}} // SCROLLBARS
// Prepare DOM reads needed to update the scrollbars. Done in one
// shot to minimize update/measure roundtrips.
function measureForScrollbars(cm){var d=cm.display,gutterW=d.gutters.offsetWidth;var docH=Math.round(cm.doc.height + paddingVert(cm.display));return {clientHeight:d.scroller.clientHeight,viewHeight:d.wrapper.clientHeight,scrollWidth:d.scroller.scrollWidth,clientWidth:d.scroller.clientWidth,viewWidth:d.wrapper.clientWidth,barLeft:cm.options.fixedGutter?gutterW:0,docHeight:docH,scrollHeight:docH + scrollGap(cm) + d.barHeight,nativeBarWidth:d.nativeBarWidth,gutterWidth:gutterW};}function NativeScrollbars(place,scroll,cm){this.cm = cm;var vert=this.vert = elt("div",[elt("div",null,null,"min-width: 1px")],"CodeMirror-vscrollbar");var horiz=this.horiz = elt("div",[elt("div",null,null,"height: 100%; min-height: 1px")],"CodeMirror-hscrollbar");place(vert);place(horiz);on(vert,"scroll",function(){if(vert.clientHeight)scroll(vert.scrollTop,"vertical");});on(horiz,"scroll",function(){if(horiz.clientWidth)scroll(horiz.scrollLeft,"horizontal");});this.checkedOverlay = false; // Need to set a minimum width to see the scrollbar on IE7 (but must not set it on IE8).
if(ie && ie_version < 8)this.horiz.style.minHeight = this.vert.style.minWidth = "18px";}NativeScrollbars.prototype = copyObj({update:function update(measure){var needsH=measure.scrollWidth > measure.clientWidth + 1;var needsV=measure.scrollHeight > measure.clientHeight + 1;var sWidth=measure.nativeBarWidth;if(needsV){this.vert.style.display = "block";this.vert.style.bottom = needsH?sWidth + "px":"0";var totalHeight=measure.viewHeight - (needsH?sWidth:0); // A bug in IE8 can cause this value to be negative, so guard it.
this.vert.firstChild.style.height = Math.max(0,measure.scrollHeight - measure.clientHeight + totalHeight) + "px";}else {this.vert.style.display = "";this.vert.firstChild.style.height = "0";}if(needsH){this.horiz.style.display = "block";this.horiz.style.right = needsV?sWidth + "px":"0";this.horiz.style.left = measure.barLeft + "px";var totalWidth=measure.viewWidth - measure.barLeft - (needsV?sWidth:0);this.horiz.firstChild.style.width = measure.scrollWidth - measure.clientWidth + totalWidth + "px";}else {this.horiz.style.display = "";this.horiz.firstChild.style.width = "0";}if(!this.checkedOverlay && measure.clientHeight > 0){if(sWidth == 0)this.overlayHack();this.checkedOverlay = true;}return {right:needsV?sWidth:0,bottom:needsH?sWidth:0};},setScrollLeft:function setScrollLeft(pos){if(this.horiz.scrollLeft != pos)this.horiz.scrollLeft = pos;},setScrollTop:function setScrollTop(pos){if(this.vert.scrollTop != pos)this.vert.scrollTop = pos;},overlayHack:function overlayHack(){var w=mac && !mac_geMountainLion?"12px":"18px";this.horiz.style.minHeight = this.vert.style.minWidth = w;var self=this;var barMouseDown=function barMouseDown(e){if(e_target(e) != self.vert && e_target(e) != self.horiz)operation(self.cm,onMouseDown)(e);};on(this.vert,"mousedown",barMouseDown);on(this.horiz,"mousedown",barMouseDown);},clear:function clear(){var parent=this.horiz.parentNode;parent.removeChild(this.horiz);parent.removeChild(this.vert);}},NativeScrollbars.prototype);function NullScrollbars(){}NullScrollbars.prototype = copyObj({update:function update(){return {bottom:0,right:0};},setScrollLeft:function setScrollLeft(){},setScrollTop:function setScrollTop(){},clear:function clear(){}},NullScrollbars.prototype);CodeMirror.scrollbarModel = {"native":NativeScrollbars,"null":NullScrollbars};function initScrollbars(cm){if(cm.display.scrollbars){cm.display.scrollbars.clear();if(cm.display.scrollbars.addClass)rmClass(cm.display.wrapper,cm.display.scrollbars.addClass);}cm.display.scrollbars = new CodeMirror.scrollbarModel[cm.options.scrollbarStyle](function(node){cm.display.wrapper.insertBefore(node,cm.display.scrollbarFiller); // Prevent clicks in the scrollbars from killing focus
on(node,"mousedown",function(){if(cm.state.focused)setTimeout(function(){cm.display.input.focus();},0);});node.setAttribute("cm-not-content","true");},function(pos,axis){if(axis == "horizontal")setScrollLeft(cm,pos);else setScrollTop(cm,pos);},cm);if(cm.display.scrollbars.addClass)addClass(cm.display.wrapper,cm.display.scrollbars.addClass);}function updateScrollbars(cm,measure){if(!measure)measure = measureForScrollbars(cm);var startWidth=cm.display.barWidth,startHeight=cm.display.barHeight;updateScrollbarsInner(cm,measure);for(var i=0;i < 4 && startWidth != cm.display.barWidth || startHeight != cm.display.barHeight;i++) {if(startWidth != cm.display.barWidth && cm.options.lineWrapping)updateHeightsInViewport(cm);updateScrollbarsInner(cm,measureForScrollbars(cm));startWidth = cm.display.barWidth;startHeight = cm.display.barHeight;}} // Re-synchronize the fake scrollbars with the actual size of the
// content.
function updateScrollbarsInner(cm,measure){var d=cm.display;var sizes=d.scrollbars.update(measure);d.sizer.style.paddingRight = (d.barWidth = sizes.right) + "px";d.sizer.style.paddingBottom = (d.barHeight = sizes.bottom) + "px";if(sizes.right && sizes.bottom){d.scrollbarFiller.style.display = "block";d.scrollbarFiller.style.height = sizes.bottom + "px";d.scrollbarFiller.style.width = sizes.right + "px";}else d.scrollbarFiller.style.display = "";if(sizes.bottom && cm.options.coverGutterNextToScrollbar && cm.options.fixedGutter){d.gutterFiller.style.display = "block";d.gutterFiller.style.height = sizes.bottom + "px";d.gutterFiller.style.width = measure.gutterWidth + "px";}else d.gutterFiller.style.display = "";} // Compute the lines that are visible in a given viewport (defaults
// the the current scroll position). viewport may contain top,
// height, and ensure (see op.scrollToPos) properties.
function visibleLines(display,doc,viewport){var top=viewport && viewport.top != null?Math.max(0,viewport.top):display.scroller.scrollTop;top = Math.floor(top - paddingTop(display));var bottom=viewport && viewport.bottom != null?viewport.bottom:top + display.wrapper.clientHeight;var from=_lineAtHeight(doc,top),to=_lineAtHeight(doc,bottom); // Ensure is a {from: {line, ch}, to: {line, ch}} object, and
// forces those lines into the viewport (if possible).
if(viewport && viewport.ensure){var ensureFrom=viewport.ensure.from.line,ensureTo=viewport.ensure.to.line;if(ensureFrom < from){from = ensureFrom;to = _lineAtHeight(doc,_heightAtLine(getLine(doc,ensureFrom)) + display.wrapper.clientHeight);}else if(Math.min(ensureTo,doc.lastLine()) >= to){from = _lineAtHeight(doc,_heightAtLine(getLine(doc,ensureTo)) - display.wrapper.clientHeight);to = ensureTo;}}return {from:from,to:Math.max(to,from + 1)};} // LINE NUMBERS
// Re-align line numbers and gutter marks to compensate for
// horizontal scrolling.
function alignHorizontally(cm){var display=cm.display,view=display.view;if(!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter))return;var comp=compensateForHScroll(display) - display.scroller.scrollLeft + cm.doc.scrollLeft;var gutterW=display.gutters.offsetWidth,left=comp + "px";for(var i=0;i < view.length;i++) if(!view[i].hidden){if(cm.options.fixedGutter && view[i].gutter)view[i].gutter.style.left = left;var align=view[i].alignable;if(align)for(var j=0;j < align.length;j++) align[j].style.left = left;}if(cm.options.fixedGutter)display.gutters.style.left = comp + gutterW + "px";} // Used to ensure that the line number gutter is still the right
// size for the current document size. Returns true when an update
// is needed.
function maybeUpdateLineNumberWidth(cm){if(!cm.options.lineNumbers)return false;var doc=cm.doc,last=lineNumberFor(cm.options,doc.first + doc.size - 1),display=cm.display;if(last.length != display.lineNumChars){var test=display.measure.appendChild(elt("div",[elt("div",last)],"CodeMirror-linenumber CodeMirror-gutter-elt"));var innerW=test.firstChild.offsetWidth,padding=test.offsetWidth - innerW;display.lineGutter.style.width = "";display.lineNumInnerWidth = Math.max(innerW,display.lineGutter.offsetWidth - padding) + 1;display.lineNumWidth = display.lineNumInnerWidth + padding;display.lineNumChars = display.lineNumInnerWidth?last.length:-1;display.lineGutter.style.width = display.lineNumWidth + "px";updateGutterSpace(cm);return true;}return false;}function lineNumberFor(options,i){return String(options.lineNumberFormatter(i + options.firstLineNumber));} // Computes display.scroller.scrollLeft + display.gutters.offsetWidth,
// but using getBoundingClientRect to get a sub-pixel-accurate
// result.
function compensateForHScroll(display){return display.scroller.getBoundingClientRect().left - display.sizer.getBoundingClientRect().left;} // DISPLAY DRAWING
function DisplayUpdate(cm,viewport,force){var display=cm.display;this.viewport = viewport; // Store some values that we'll need later (but don't want to force a relayout for)
this.visible = visibleLines(display,cm.doc,viewport);this.editorIsHidden = !display.wrapper.offsetWidth;this.wrapperHeight = display.wrapper.clientHeight;this.wrapperWidth = display.wrapper.clientWidth;this.oldDisplayWidth = displayWidth(cm);this.force = force;this.dims = getDimensions(cm);this.events = [];}DisplayUpdate.prototype.signal = function(emitter,type){if(hasHandler(emitter,type))this.events.push(arguments);};DisplayUpdate.prototype.finish = function(){for(var i=0;i < this.events.length;i++) signal.apply(null,this.events[i]);};function maybeClipScrollbars(cm){var display=cm.display;if(!display.scrollbarsClipped && display.scroller.offsetWidth){display.nativeBarWidth = display.scroller.offsetWidth - display.scroller.clientWidth;display.heightForcer.style.height = scrollGap(cm) + "px";display.sizer.style.marginBottom = -display.nativeBarWidth + "px";display.sizer.style.borderRightWidth = scrollGap(cm) + "px";display.scrollbarsClipped = true;}} // Does the actual updating of the line display. Bails out
// (returning false) when there is nothing to be done and forced is
// false.
function updateDisplayIfNeeded(cm,update){var display=cm.display,doc=cm.doc;if(update.editorIsHidden){resetView(cm);return false;} // Bail out if the visible area is already rendered and nothing changed.
if(!update.force && update.visible.from >= display.viewFrom && update.visible.to <= display.viewTo && (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo) && display.renderedView == display.view && countDirtyView(cm) == 0)return false;if(maybeUpdateLineNumberWidth(cm)){resetView(cm);update.dims = getDimensions(cm);} // Compute a suitable new viewport (from & to)
var end=doc.first + doc.size;var from=Math.max(update.visible.from - cm.options.viewportMargin,doc.first);var to=Math.min(end,update.visible.to + cm.options.viewportMargin);if(display.viewFrom < from && from - display.viewFrom < 20)from = Math.max(doc.first,display.viewFrom);if(display.viewTo > to && display.viewTo - to < 20)to = Math.min(end,display.viewTo);if(sawCollapsedSpans){from = visualLineNo(cm.doc,from);to = visualLineEndNo(cm.doc,to);}var different=from != display.viewFrom || to != display.viewTo || display.lastWrapHeight != update.wrapperHeight || display.lastWrapWidth != update.wrapperWidth;adjustView(cm,from,to);display.viewOffset = _heightAtLine(getLine(cm.doc,display.viewFrom)); // Position the mover div to align with the current scroll position
cm.display.mover.style.top = display.viewOffset + "px";var toUpdate=countDirtyView(cm);if(!different && toUpdate == 0 && !update.force && display.renderedView == display.view && (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo))return false; // For big changes, we hide the enclosing element during the
// update, since that speeds up the operations on most browsers.
var focused=activeElt();if(toUpdate > 4)display.lineDiv.style.display = "none";patchDisplay(cm,display.updateLineNumbers,update.dims);if(toUpdate > 4)display.lineDiv.style.display = "";display.renderedView = display.view; // There might have been a widget with a focused element that got
// hidden or updated, if so re-focus it.
if(focused && activeElt() != focused && focused.offsetHeight)focused.focus(); // Prevent selection and cursors from interfering with the scroll
// width and height.
removeChildren(display.cursorDiv);removeChildren(display.selectionDiv);display.gutters.style.height = 0;if(different){display.lastWrapHeight = update.wrapperHeight;display.lastWrapWidth = update.wrapperWidth;startWorker(cm,400);}display.updateLineNumbers = null;return true;}function postUpdateDisplay(cm,update){var force=update.force,viewport=update.viewport;for(var first=true;;first = false) {if(first && cm.options.lineWrapping && update.oldDisplayWidth != displayWidth(cm)){force = true;}else {force = false; // Clip forced viewport to actual scrollable area.
if(viewport && viewport.top != null)viewport = {top:Math.min(cm.doc.height + paddingVert(cm.display) - displayHeight(cm),viewport.top)}; // Updated line heights might result in the drawn area not
// actually covering the viewport. Keep looping until it does.
update.visible = visibleLines(cm.display,cm.doc,viewport);if(update.visible.from >= cm.display.viewFrom && update.visible.to <= cm.display.viewTo)break;}if(!updateDisplayIfNeeded(cm,update))break;updateHeightsInViewport(cm);var barMeasure=measureForScrollbars(cm);updateSelection(cm);setDocumentHeight(cm,barMeasure);updateScrollbars(cm,barMeasure);}update.signal(cm,"update",cm);if(cm.display.viewFrom != cm.display.reportedViewFrom || cm.display.viewTo != cm.display.reportedViewTo){update.signal(cm,"viewportChange",cm,cm.display.viewFrom,cm.display.viewTo);cm.display.reportedViewFrom = cm.display.viewFrom;cm.display.reportedViewTo = cm.display.viewTo;}}function updateDisplaySimple(cm,viewport){var update=new DisplayUpdate(cm,viewport);if(updateDisplayIfNeeded(cm,update)){updateHeightsInViewport(cm);postUpdateDisplay(cm,update);var barMeasure=measureForScrollbars(cm);updateSelection(cm);setDocumentHeight(cm,barMeasure);updateScrollbars(cm,barMeasure);update.finish();}}function setDocumentHeight(cm,measure){cm.display.sizer.style.minHeight = measure.docHeight + "px";var total=measure.docHeight + cm.display.barHeight;cm.display.heightForcer.style.top = total + "px";cm.display.gutters.style.height = Math.max(total + scrollGap(cm),measure.clientHeight) + "px";} // Read the actual heights of the rendered lines, and update their
// stored heights to match.
function updateHeightsInViewport(cm){var display=cm.display;var prevBottom=display.lineDiv.offsetTop;for(var i=0;i < display.view.length;i++) {var cur=display.view[i],height;if(cur.hidden)continue;if(ie && ie_version < 8){var bot=cur.node.offsetTop + cur.node.offsetHeight;height = bot - prevBottom;prevBottom = bot;}else {var box=cur.node.getBoundingClientRect();height = box.bottom - box.top;}var diff=cur.line.height - height;if(height < 2)height = textHeight(display);if(diff > .001 || diff < -.001){updateLineHeight(cur.line,height);updateWidgetHeight(cur.line);if(cur.rest)for(var j=0;j < cur.rest.length;j++) updateWidgetHeight(cur.rest[j]);}}} // Read and store the height of line widgets associated with the
// given line.
function updateWidgetHeight(line){if(line.widgets)for(var i=0;i < line.widgets.length;++i) line.widgets[i].height = line.widgets[i].node.offsetHeight;} // Do a bulk-read of the DOM positions and sizes needed to draw the
// view, so that we don't interleave reading and writing to the DOM.
function getDimensions(cm){var d=cm.display,left={},width={};var gutterLeft=d.gutters.clientLeft;for(var n=d.gutters.firstChild,i=0;n;n = n.nextSibling,++i) {left[cm.options.gutters[i]] = n.offsetLeft + n.clientLeft + gutterLeft;width[cm.options.gutters[i]] = n.clientWidth;}return {fixedPos:compensateForHScroll(d),gutterTotalWidth:d.gutters.offsetWidth,gutterLeft:left,gutterWidth:width,wrapperWidth:d.wrapper.clientWidth};} // Sync the actual display DOM structure with display.view, removing
// nodes for lines that are no longer in view, and creating the ones
// that are not there yet, and updating the ones that are out of
// date.
function patchDisplay(cm,updateNumbersFrom,dims){var display=cm.display,lineNumbers=cm.options.lineNumbers;var container=display.lineDiv,cur=container.firstChild;function rm(node){var next=node.nextSibling; // Works around a throw-scroll bug in OS X Webkit
if(webkit && mac && cm.display.currentWheelTarget == node)node.style.display = "none";else node.parentNode.removeChild(node);return next;}var view=display.view,lineN=display.viewFrom; // Loop over the elements in the view, syncing cur (the DOM nodes
// in display.lineDiv) with the view as we go.
for(var i=0;i < view.length;i++) {var lineView=view[i];if(lineView.hidden){}else if(!lineView.node || lineView.node.parentNode != container){ // Not drawn yet
var node=buildLineElement(cm,lineView,lineN,dims);container.insertBefore(node,cur);}else { // Already drawn
while(cur != lineView.node) cur = rm(cur);var updateNumber=lineNumbers && updateNumbersFrom != null && updateNumbersFrom <= lineN && lineView.lineNumber;if(lineView.changes){if(indexOf(lineView.changes,"gutter") > -1)updateNumber = false;updateLineForChanges(cm,lineView,lineN,dims);}if(updateNumber){removeChildren(lineView.lineNumber);lineView.lineNumber.appendChild(document.createTextNode(lineNumberFor(cm.options,lineN)));}cur = lineView.node.nextSibling;}lineN += lineView.size;}while(cur) cur = rm(cur);} // When an aspect of a line changes, a string is added to
// lineView.changes. This updates the relevant part of the line's
// DOM structure.
function updateLineForChanges(cm,lineView,lineN,dims){for(var j=0;j < lineView.changes.length;j++) {var type=lineView.changes[j];if(type == "text")updateLineText(cm,lineView);else if(type == "gutter")updateLineGutter(cm,lineView,lineN,dims);else if(type == "class")updateLineClasses(lineView);else if(type == "widget")updateLineWidgets(cm,lineView,dims);}lineView.changes = null;} // Lines with gutter elements, widgets or a background class need to
// be wrapped, and have the extra elements added to the wrapper div
function ensureLineWrapped(lineView){if(lineView.node == lineView.text){lineView.node = elt("div",null,null,"position: relative");if(lineView.text.parentNode)lineView.text.parentNode.replaceChild(lineView.node,lineView.text);lineView.node.appendChild(lineView.text);if(ie && ie_version < 8)lineView.node.style.zIndex = 2;}return lineView.node;}function updateLineBackground(lineView){var cls=lineView.bgClass?lineView.bgClass + " " + (lineView.line.bgClass || ""):lineView.line.bgClass;if(cls)cls += " CodeMirror-linebackground";if(lineView.background){if(cls)lineView.background.className = cls;else {lineView.background.parentNode.removeChild(lineView.background);lineView.background = null;}}else if(cls){var wrap=ensureLineWrapped(lineView);lineView.background = wrap.insertBefore(elt("div",null,cls),wrap.firstChild);}} // Wrapper around buildLineContent which will reuse the structure
// in display.externalMeasured when possible.
function getLineContent(cm,lineView){var ext=cm.display.externalMeasured;if(ext && ext.line == lineView.line){cm.display.externalMeasured = null;lineView.measure = ext.measure;return ext.built;}return buildLineContent(cm,lineView);} // Redraw the line's text. Interacts with the background and text
// classes because the mode may output tokens that influence these
// classes.
function updateLineText(cm,lineView){var cls=lineView.text.className;var built=getLineContent(cm,lineView);if(lineView.text == lineView.node)lineView.node = built.pre;lineView.text.parentNode.replaceChild(built.pre,lineView.text);lineView.text = built.pre;if(built.bgClass != lineView.bgClass || built.textClass != lineView.textClass){lineView.bgClass = built.bgClass;lineView.textClass = built.textClass;updateLineClasses(lineView);}else if(cls){lineView.text.className = cls;}}function updateLineClasses(lineView){updateLineBackground(lineView);if(lineView.line.wrapClass)ensureLineWrapped(lineView).className = lineView.line.wrapClass;else if(lineView.node != lineView.text)lineView.node.className = "";var textClass=lineView.textClass?lineView.textClass + " " + (lineView.line.textClass || ""):lineView.line.textClass;lineView.text.className = textClass || "";}function updateLineGutter(cm,lineView,lineN,dims){if(lineView.gutter){lineView.node.removeChild(lineView.gutter);lineView.gutter = null;}var markers=lineView.line.gutterMarkers;if(cm.options.lineNumbers || markers){var wrap=ensureLineWrapped(lineView);var gutterWrap=lineView.gutter = elt("div",null,"CodeMirror-gutter-wrapper","left: " + (cm.options.fixedGutter?dims.fixedPos:-dims.gutterTotalWidth) + "px; width: " + dims.gutterTotalWidth + "px");cm.display.input.setUneditable(gutterWrap);wrap.insertBefore(gutterWrap,lineView.text);if(lineView.line.gutterClass)gutterWrap.className += " " + lineView.line.gutterClass;if(cm.options.lineNumbers && (!markers || !markers["CodeMirror-linenumbers"]))lineView.lineNumber = gutterWrap.appendChild(elt("div",lineNumberFor(cm.options,lineN),"CodeMirror-linenumber CodeMirror-gutter-elt","left: " + dims.gutterLeft["CodeMirror-linenumbers"] + "px; width: " + cm.display.lineNumInnerWidth + "px"));if(markers)for(var k=0;k < cm.options.gutters.length;++k) {var id=cm.options.gutters[k],found=markers.hasOwnProperty(id) && markers[id];if(found)gutterWrap.appendChild(elt("div",[found],"CodeMirror-gutter-elt","left: " + dims.gutterLeft[id] + "px; width: " + dims.gutterWidth[id] + "px"));}}}function updateLineWidgets(cm,lineView,dims){if(lineView.alignable)lineView.alignable = null;for(var node=lineView.node.firstChild,next;node;node = next) {var next=node.nextSibling;if(node.className == "CodeMirror-linewidget")lineView.node.removeChild(node);}insertLineWidgets(cm,lineView,dims);} // Build a line's DOM representation from scratch
function buildLineElement(cm,lineView,lineN,dims){var built=getLineContent(cm,lineView);lineView.text = lineView.node = built.pre;if(built.bgClass)lineView.bgClass = built.bgClass;if(built.textClass)lineView.textClass = built.textClass;updateLineClasses(lineView);updateLineGutter(cm,lineView,lineN,dims);insertLineWidgets(cm,lineView,dims);return lineView.node;} // A lineView may contain multiple logical lines (when merged by
// collapsed spans). The widgets for all of them need to be drawn.
function insertLineWidgets(cm,lineView,dims){insertLineWidgetsFor(cm,lineView.line,lineView,dims,true);if(lineView.rest)for(var i=0;i < lineView.rest.length;i++) insertLineWidgetsFor(cm,lineView.rest[i],lineView,dims,false);}function insertLineWidgetsFor(cm,line,lineView,dims,allowAbove){if(!line.widgets)return;var wrap=ensureLineWrapped(lineView);for(var i=0,ws=line.widgets;i < ws.length;++i) {var widget=ws[i],node=elt("div",[widget.node],"CodeMirror-linewidget");if(!widget.handleMouseEvents)node.setAttribute("cm-ignore-events","true");positionLineWidget(widget,node,lineView,dims);cm.display.input.setUneditable(node);if(allowAbove && widget.above)wrap.insertBefore(node,lineView.gutter || lineView.text);else wrap.appendChild(node);signalLater(widget,"redraw");}}function positionLineWidget(widget,node,lineView,dims){if(widget.noHScroll){(lineView.alignable || (lineView.alignable = [])).push(node);var width=dims.wrapperWidth;node.style.left = dims.fixedPos + "px";if(!widget.coverGutter){width -= dims.gutterTotalWidth;node.style.paddingLeft = dims.gutterTotalWidth + "px";}node.style.width = width + "px";}if(widget.coverGutter){node.style.zIndex = 5;node.style.position = "relative";if(!widget.noHScroll)node.style.marginLeft = -dims.gutterTotalWidth + "px";}} // POSITION OBJECT
// A Pos instance represents a position within the text.
var Pos=CodeMirror.Pos = function(line,ch){if(!(this instanceof Pos))return new Pos(line,ch);this.line = line;this.ch = ch;}; // Compare two positions, return 0 if they are the same, a negative
// number when a is less, and a positive number otherwise.
var cmp=CodeMirror.cmpPos = function(a,b){return a.line - b.line || a.ch - b.ch;};function copyPos(x){return Pos(x.line,x.ch);}function maxPos(a,b){return cmp(a,b) < 0?b:a;}function minPos(a,b){return cmp(a,b) < 0?a:b;} // INPUT HANDLING
function ensureFocus(cm){if(!cm.state.focused){cm.display.input.focus();onFocus(cm);}}function isReadOnly(cm){return cm.options.readOnly || cm.doc.cantEdit;} // This will be set to an array of strings when copying, so that,
// when pasting, we know what kind of selections the copied text
// was made out of.
var lastCopied=null;function applyTextInput(cm,inserted,deleted,sel){var doc=cm.doc;cm.display.shift = false;if(!sel)sel = doc.sel;var textLines=splitLines(inserted),multiPaste=null; // When pasing N lines into N selections, insert one line per selection
if(cm.state.pasteIncoming && sel.ranges.length > 1){if(lastCopied && lastCopied.join("\n") == inserted)multiPaste = sel.ranges.length % lastCopied.length == 0 && map(lastCopied,splitLines);else if(textLines.length == sel.ranges.length)multiPaste = map(textLines,function(l){return [l];});} // Normal behavior is to insert the new text into every selection
for(var i=sel.ranges.length - 1;i >= 0;i--) {var range=sel.ranges[i];var from=range.from(),to=range.to();if(range.empty()){if(deleted && deleted > 0) // Handle deletion
from = Pos(from.line,from.ch - deleted);else if(cm.state.overwrite && !cm.state.pasteIncoming) // Handle overwrite
to = Pos(to.line,Math.min(getLine(doc,to.line).text.length,to.ch + lst(textLines).length));}var updateInput=cm.curOp.updateInput;var changeEvent={from:from,to:to,text:multiPaste?multiPaste[i % multiPaste.length]:textLines,origin:cm.state.pasteIncoming?"paste":cm.state.cutIncoming?"cut":"+input"};makeChange(cm.doc,changeEvent);signalLater(cm,"inputRead",cm,changeEvent); // When an 'electric' character is inserted, immediately trigger a reindent
if(inserted && !cm.state.pasteIncoming && cm.options.electricChars && cm.options.smartIndent && range.head.ch < 100 && (!i || sel.ranges[i - 1].head.line != range.head.line)){var mode=cm.getModeAt(range.head);var end=changeEnd(changeEvent);if(mode.electricChars){for(var j=0;j < mode.electricChars.length;j++) if(inserted.indexOf(mode.electricChars.charAt(j)) > -1){indentLine(cm,end.line,"smart");break;}}else if(mode.electricInput){if(mode.electricInput.test(getLine(doc,end.line).text.slice(0,end.ch)))indentLine(cm,end.line,"smart");}}}ensureCursorVisible(cm);cm.curOp.updateInput = updateInput;cm.curOp.typing = true;cm.state.pasteIncoming = cm.state.cutIncoming = false;}function copyableRanges(cm){var text=[],ranges=[];for(var i=0;i < cm.doc.sel.ranges.length;i++) {var line=cm.doc.sel.ranges[i].head.line;var lineRange={anchor:Pos(line,0),head:Pos(line + 1,0)};ranges.push(lineRange);text.push(cm.getRange(lineRange.anchor,lineRange.head));}return {text:text,ranges:ranges};}function disableBrowserMagic(field){field.setAttribute("autocorrect","off");field.setAttribute("autocapitalize","off");field.setAttribute("spellcheck","false");} // TEXTAREA INPUT STYLE
function TextareaInput(cm){this.cm = cm; // See input.poll and input.reset
this.prevInput = ""; // Flag that indicates whether we expect input to appear real soon
// now (after some event like 'keypress' or 'input') and are
// polling intensively.
this.pollingFast = false; // Self-resetting timeout for the poller
this.polling = new Delayed(); // Tracks when input.reset has punted to just putting a short
// string into the textarea instead of the full selection.
this.inaccurateSelection = false; // Used to work around IE issue with selection being forgotten when focus moves away from textarea
this.hasSelection = false;};function hiddenTextarea(){var te=elt("textarea",null,null,"position: absolute; padding: 0; width: 1px; height: 1em; outline: none");var div=elt("div",[te],null,"overflow: hidden; position: relative; width: 3px; height: 0px;"); // The textarea is kept positioned near the cursor to prevent the
// fact that it'll be scrolled into view on input from scrolling
// our fake cursor out of view. On webkit, when wrap=off, paste is
// very slow. So make the area wide instead.
if(webkit)te.style.width = "1000px";else te.setAttribute("wrap","off"); // If border: 0; -- iOS fails to open keyboard (issue #1287)
if(ios)te.style.border = "1px solid black";disableBrowserMagic(te);return div;}TextareaInput.prototype = copyObj({init:function init(display){var input=this,cm=this.cm; // Wraps and hides input textarea
var div=this.wrapper = hiddenTextarea(); // The semihidden textarea that is focused when the editor is
// focused, and receives input.
var te=this.textarea = div.firstChild;display.wrapper.insertBefore(div,display.wrapper.firstChild); // Needed to hide big blue blinking cursor on Mobile Safari (doesn't seem to work in iOS 8 anymore)
if(ios)te.style.width = "0px";on(te,"input",function(){if(ie && ie_version >= 9 && input.hasSelection)input.hasSelection = null;input.poll();});on(te,"paste",function(){ // Workaround for webkit bug https://bugs.webkit.org/show_bug.cgi?id=90206
// Add a char to the end of textarea before paste occur so that
// selection doesn't span to the end of textarea.
if(webkit && !cm.state.fakedLastChar && !(new Date() - cm.state.lastMiddleDown < 200)){var start=te.selectionStart,end=te.selectionEnd;te.value += "$"; // The selection end needs to be set before the start, otherwise there
// can be an intermediate non-empty selection between the two, which
// can override the middle-click paste buffer on linux and cause the
// wrong thing to get pasted.
te.selectionEnd = end;te.selectionStart = start;cm.state.fakedLastChar = true;}cm.state.pasteIncoming = true;input.fastPoll();});function prepareCopyCut(e){if(cm.somethingSelected()){lastCopied = cm.getSelections();if(input.inaccurateSelection){input.prevInput = "";input.inaccurateSelection = false;te.value = lastCopied.join("\n");selectInput(te);}}else {var ranges=copyableRanges(cm);lastCopied = ranges.text;if(e.type == "cut"){cm.setSelections(ranges.ranges,null,sel_dontScroll);}else {input.prevInput = "";te.value = ranges.text.join("\n");selectInput(te);}}if(e.type == "cut")cm.state.cutIncoming = true;}on(te,"cut",prepareCopyCut);on(te,"copy",prepareCopyCut);on(display.scroller,"paste",function(e){if(eventInWidget(display,e))return;cm.state.pasteIncoming = true;input.focus();}); // Prevent normal selection in the editor (we handle our own)
on(display.lineSpace,"selectstart",function(e){if(!eventInWidget(display,e))e_preventDefault(e);});},prepareSelection:function prepareSelection(){ // Redraw the selection and/or cursor
var cm=this.cm,display=cm.display,doc=cm.doc;var result=_prepareSelection(cm); // Move the hidden textarea near the cursor to prevent scrolling artifacts
if(cm.options.moveInputWithCursor){var headPos=_cursorCoords(cm,doc.sel.primary().head,"div");var wrapOff=display.wrapper.getBoundingClientRect(),lineOff=display.lineDiv.getBoundingClientRect();result.teTop = Math.max(0,Math.min(display.wrapper.clientHeight - 10,headPos.top + lineOff.top - wrapOff.top));result.teLeft = Math.max(0,Math.min(display.wrapper.clientWidth - 10,headPos.left + lineOff.left - wrapOff.left));}return result;},showSelection:function showSelection(drawn){var cm=this.cm,display=cm.display;removeChildrenAndAdd(display.cursorDiv,drawn.cursors);removeChildrenAndAdd(display.selectionDiv,drawn.selection);if(drawn.teTop != null){this.wrapper.style.top = drawn.teTop + "px";this.wrapper.style.left = drawn.teLeft + "px";}}, // Reset the input to correspond to the selection (or to be empty,
// when not typing and nothing is selected)
reset:function reset(typing){if(this.contextMenuPending)return;var minimal,selected,cm=this.cm,doc=cm.doc;if(cm.somethingSelected()){this.prevInput = "";var range=doc.sel.primary();minimal = hasCopyEvent && (range.to().line - range.from().line > 100 || (selected = cm.getSelection()).length > 1000);var content=minimal?"-":selected || cm.getSelection();this.textarea.value = content;if(cm.state.focused)selectInput(this.textarea);if(ie && ie_version >= 9)this.hasSelection = content;}else if(!typing){this.prevInput = this.textarea.value = "";if(ie && ie_version >= 9)this.hasSelection = null;}this.inaccurateSelection = minimal;},getField:function getField(){return this.textarea;},supportsTouch:function supportsTouch(){return false;},focus:function focus(){if(this.cm.options.readOnly != "nocursor" && (!mobile || activeElt() != this.textarea)){try{this.textarea.focus();}catch(e) {} // IE8 will throw if the textarea is display: none or not in DOM
}},blur:function blur(){this.textarea.blur();},resetPosition:function resetPosition(){this.wrapper.style.top = this.wrapper.style.left = 0;},receivedFocus:function receivedFocus(){this.slowPoll();}, // Poll for input changes, using the normal rate of polling. This
// runs as long as the editor is focused.
slowPoll:function slowPoll(){var input=this;if(input.pollingFast)return;input.polling.set(this.cm.options.pollInterval,function(){input.poll();if(input.cm.state.focused)input.slowPoll();});}, // When an event has just come in that is likely to add or change
// something in the input textarea, we poll faster, to ensure that
// the change appears on the screen quickly.
fastPoll:function fastPoll(){var missed=false,input=this;input.pollingFast = true;function p(){var changed=input.poll();if(!changed && !missed){missed = true;input.polling.set(60,p);}else {input.pollingFast = false;input.slowPoll();}}input.polling.set(20,p);}, // Read input from the textarea, and update the document to match.
// When something is selected, it is present in the textarea, and
// selected (unless it is huge, in which case a placeholder is
// used). When nothing is selected, the cursor sits after previously
// seen text (can be empty), which is stored in prevInput (we must
// not reset the textarea when typing, because that breaks IME).
poll:function poll(){var cm=this.cm,input=this.textarea,prevInput=this.prevInput; // Since this is called a *lot*, try to bail out as cheaply as
// possible when it is clear that nothing happened. hasSelection
// will be the case when there is a lot of text in the textarea,
// in which case reading its value would be expensive.
if(!cm.state.focused || hasSelection(input) && !prevInput || isReadOnly(cm) || cm.options.disableInput || cm.state.keySeq)return false; // See paste handler for more on the fakedLastChar kludge
if(cm.state.pasteIncoming && cm.state.fakedLastChar){input.value = input.value.substring(0,input.value.length - 1);cm.state.fakedLastChar = false;}var text=input.value; // If nothing changed, bail.
if(text == prevInput && !cm.somethingSelected())return false; // Work around nonsensical selection resetting in IE9/10, and
// inexplicable appearance of private area unicode characters on
// some key combos in Mac (#2689).
if(ie && ie_version >= 9 && this.hasSelection === text || mac && /[\uf700-\uf7ff]/.test(text)){cm.display.input.reset();return false;}if(cm.doc.sel == cm.display.selForContextMenu){if(text.charCodeAt(0) == 0x200b){if(!prevInput)prevInput = "​";}else if(prevInput == "​"){text = text.slice(1);prevInput = "";}} // Find the part of the input that is actually new
var same=0,l=Math.min(prevInput.length,text.length);while(same < l && prevInput.charCodeAt(same) == text.charCodeAt(same)) ++same;var self=this;runInOp(cm,function(){applyTextInput(cm,text.slice(same),prevInput.length - same); // Don't leave long text in the textarea, since it makes further polling slow
if(text.length > 1000 || text.indexOf("\n") > -1)input.value = self.prevInput = "";else self.prevInput = text;});return true;},ensurePolled:function ensurePolled(){if(this.pollingFast && this.poll())this.pollingFast = false;},onKeyPress:function onKeyPress(){if(ie && ie_version >= 9)this.hasSelection = null;this.fastPoll();},onContextMenu:function onContextMenu(e){var input=this,cm=input.cm,display=cm.display,te=input.textarea;var pos=posFromMouse(cm,e),scrollPos=display.scroller.scrollTop;if(!pos || presto)return; // Opera is difficult.
// Reset the current text selection only if the click is done outside of the selection
// and 'resetSelectionOnContextMenu' option is true.
var reset=cm.options.resetSelectionOnContextMenu;if(reset && cm.doc.sel.contains(pos) == -1)operation(cm,setSelection)(cm.doc,simpleSelection(pos),sel_dontScroll);var oldCSS=te.style.cssText;input.wrapper.style.position = "absolute";te.style.cssText = "position: fixed; width: 30px; height: 30px; top: " + (e.clientY - 5) + "px; left: " + (e.clientX - 5) + "px; z-index: 1000; background: " + (ie?"rgba(255, 255, 255, .05)":"transparent") + "; outline: none; border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);";if(webkit)var oldScrollY=window.scrollY; // Work around Chrome issue (#2712)
display.input.focus();if(webkit)window.scrollTo(null,oldScrollY);display.input.reset(); // Adds "Select all" to context menu in FF
if(!cm.somethingSelected())te.value = input.prevInput = " ";input.contextMenuPending = true;display.selForContextMenu = cm.doc.sel;clearTimeout(display.detectingSelectAll); // Select-all will be greyed out if there's nothing to select, so
// this adds a zero-width space so that we can later check whether
// it got selected.
function prepareSelectAllHack(){if(te.selectionStart != null){var selected=cm.somethingSelected();var extval=te.value = "​" + (selected?te.value:"");input.prevInput = selected?"":"​";te.selectionStart = 1;te.selectionEnd = extval.length; // Re-set this, in case some other handler touched the
// selection in the meantime.
display.selForContextMenu = cm.doc.sel;}}function rehide(){input.contextMenuPending = false;input.wrapper.style.position = "relative";te.style.cssText = oldCSS;if(ie && ie_version < 9)display.scrollbars.setScrollTop(display.scroller.scrollTop = scrollPos); // Try to detect the user choosing select-all
if(te.selectionStart != null){if(!ie || ie && ie_version < 9)prepareSelectAllHack();var i=0,poll=function poll(){if(display.selForContextMenu == cm.doc.sel && te.selectionStart == 0 && input.prevInput == "​")operation(cm,commands.selectAll)(cm);else if(i++ < 10)display.detectingSelectAll = setTimeout(poll,500);else display.input.reset();};display.detectingSelectAll = setTimeout(poll,200);}}if(ie && ie_version >= 9)prepareSelectAllHack();if(captureRightClick){e_stop(e);var mouseup=function mouseup(){off(window,"mouseup",mouseup);setTimeout(rehide,20);};on(window,"mouseup",mouseup);}else {setTimeout(rehide,50);}},setUneditable:nothing,needsContentAttribute:false},TextareaInput.prototype); // CONTENTEDITABLE INPUT STYLE
function ContentEditableInput(cm){this.cm = cm;this.lastAnchorNode = this.lastAnchorOffset = this.lastFocusNode = this.lastFocusOffset = null;this.polling = new Delayed();this.gracePeriod = false;}ContentEditableInput.prototype = copyObj({init:function init(display){var input=this,cm=input.cm;var div=input.div = display.lineDiv;div.contentEditable = "true";disableBrowserMagic(div);on(div,"paste",function(e){var pasted=e.clipboardData && e.clipboardData.getData("text/plain");if(pasted){e.preventDefault();cm.replaceSelection(pasted,null,"paste");}});on(div,"compositionstart",function(e){var data=e.data;input.composing = {sel:cm.doc.sel,data:data,startData:data};if(!data)return;var prim=cm.doc.sel.primary();var line=cm.getLine(prim.head.line);var found=line.indexOf(data,Math.max(0,prim.head.ch - data.length));if(found > -1 && found <= prim.head.ch)input.composing.sel = simpleSelection(Pos(prim.head.line,found),Pos(prim.head.line,found + data.length));});on(div,"compositionupdate",function(e){input.composing.data = e.data;});on(div,"compositionend",function(e){var ours=input.composing;if(!ours)return;if(e.data != ours.startData && !/\u200b/.test(e.data))ours.data = e.data; // Need a small delay to prevent other code (input event,
// selection polling) from doing damage when fired right after
// compositionend.
setTimeout(function(){if(!ours.handled)input.applyComposition(ours);if(input.composing == ours)input.composing = null;},50);});on(div,"touchstart",function(){input.forceCompositionEnd();});on(div,"input",function(){if(input.composing)return;if(!input.pollContent())runInOp(input.cm,function(){regChange(cm);});});function onCopyCut(e){if(cm.somethingSelected()){lastCopied = cm.getSelections();if(e.type == "cut")cm.replaceSelection("",null,"cut");}else {var ranges=copyableRanges(cm);lastCopied = ranges.text;if(e.type == "cut"){cm.operation(function(){cm.setSelections(ranges.ranges,0,sel_dontScroll);cm.replaceSelection("",null,"cut");});}} // iOS exposes the clipboard API, but seems to discard content inserted into it
if(e.clipboardData && !ios){e.preventDefault();e.clipboardData.clearData();e.clipboardData.setData("text/plain",lastCopied.join("\n"));}else { // Old-fashioned briefly-focus-a-textarea hack
var kludge=hiddenTextarea(),te=kludge.firstChild;cm.display.lineSpace.insertBefore(kludge,cm.display.lineSpace.firstChild);te.value = lastCopied.join("\n");var hadFocus=document.activeElement;selectInput(te);setTimeout(function(){cm.display.lineSpace.removeChild(kludge);hadFocus.focus();},50);}}on(div,"copy",onCopyCut);on(div,"cut",onCopyCut);},prepareSelection:function prepareSelection(){var result=_prepareSelection(this.cm,false);result.focus = this.cm.state.focused;return result;},showSelection:function showSelection(info){if(!info || !this.cm.display.view.length)return;if(info.focus)this.showPrimarySelection();this.showMultipleSelections(info);},showPrimarySelection:function showPrimarySelection(){var sel=window.getSelection(),prim=this.cm.doc.sel.primary();var curAnchor=domToPos(this.cm,sel.anchorNode,sel.anchorOffset);var curFocus=domToPos(this.cm,sel.focusNode,sel.focusOffset);if(curAnchor && !curAnchor.bad && curFocus && !curFocus.bad && cmp(minPos(curAnchor,curFocus),prim.from()) == 0 && cmp(maxPos(curAnchor,curFocus),prim.to()) == 0)return;var start=posToDOM(this.cm,prim.from());var end=posToDOM(this.cm,prim.to());if(!start && !end)return;var view=this.cm.display.view;var old=sel.rangeCount && sel.getRangeAt(0);if(!start){start = {node:view[0].measure.map[2],offset:0};}else if(!end){ // FIXME dangerously hacky
var measure=view[view.length - 1].measure;var map=measure.maps?measure.maps[measure.maps.length - 1]:measure.map;end = {node:map[map.length - 1],offset:map[map.length - 2] - map[map.length - 3]};}try{var rng=range(start.node,start.offset,end.offset,end.node);}catch(e) {} // Our model of the DOM might be outdated, in which case the range we try to set can be impossible
if(rng){sel.removeAllRanges();sel.addRange(rng);if(old && sel.anchorNode == null)sel.addRange(old);else if(gecko)this.startGracePeriod();}this.rememberSelection();},startGracePeriod:function startGracePeriod(){var input=this;clearTimeout(this.gracePeriod);this.gracePeriod = setTimeout(function(){input.gracePeriod = false;if(input.selectionChanged())input.cm.operation(function(){input.cm.curOp.selectionChanged = true;});},20);},showMultipleSelections:function showMultipleSelections(info){removeChildrenAndAdd(this.cm.display.cursorDiv,info.cursors);removeChildrenAndAdd(this.cm.display.selectionDiv,info.selection);},rememberSelection:function rememberSelection(){var sel=window.getSelection();this.lastAnchorNode = sel.anchorNode;this.lastAnchorOffset = sel.anchorOffset;this.lastFocusNode = sel.focusNode;this.lastFocusOffset = sel.focusOffset;},selectionInEditor:function selectionInEditor(){var sel=window.getSelection();if(!sel.rangeCount)return false;var node=sel.getRangeAt(0).commonAncestorContainer;return contains(this.div,node);},focus:function focus(){if(this.cm.options.readOnly != "nocursor")this.div.focus();},blur:function blur(){this.div.blur();},getField:function getField(){return this.div;},supportsTouch:function supportsTouch(){return true;},receivedFocus:function receivedFocus(){var input=this;if(this.selectionInEditor())this.pollSelection();else runInOp(this.cm,function(){input.cm.curOp.selectionChanged = true;});function poll(){if(input.cm.state.focused){input.pollSelection();input.polling.set(input.cm.options.pollInterval,poll);}}this.polling.set(this.cm.options.pollInterval,poll);},selectionChanged:function selectionChanged(){var sel=window.getSelection();return sel.anchorNode != this.lastAnchorNode || sel.anchorOffset != this.lastAnchorOffset || sel.focusNode != this.lastFocusNode || sel.focusOffset != this.lastFocusOffset;},pollSelection:function pollSelection(){if(!this.composing && !this.gracePeriod && this.selectionChanged()){var sel=window.getSelection(),cm=this.cm;this.rememberSelection();var anchor=domToPos(cm,sel.anchorNode,sel.anchorOffset);var head=domToPos(cm,sel.focusNode,sel.focusOffset);if(anchor && head)runInOp(cm,function(){setSelection(cm.doc,simpleSelection(anchor,head),sel_dontScroll);if(anchor.bad || head.bad)cm.curOp.selectionChanged = true;});}},pollContent:function pollContent(){var cm=this.cm,display=cm.display,sel=cm.doc.sel.primary();var from=sel.from(),to=sel.to();if(from.line < display.viewFrom || to.line > display.viewTo - 1)return false;var fromIndex;if(from.line == display.viewFrom || (fromIndex = findViewIndex(cm,from.line)) == 0){var fromLine=lineNo(display.view[0].line);var fromNode=display.view[0].node;}else {var fromLine=lineNo(display.view[fromIndex].line);var fromNode=display.view[fromIndex - 1].node.nextSibling;}var toIndex=findViewIndex(cm,to.line);if(toIndex == display.view.length - 1){var toLine=display.viewTo - 1;var toNode=display.view[toIndex].node;}else {var toLine=lineNo(display.view[toIndex + 1].line) - 1;var toNode=display.view[toIndex + 1].node.previousSibling;}var newText=splitLines(domTextBetween(cm,fromNode,toNode,fromLine,toLine));var oldText=getBetween(cm.doc,Pos(fromLine,0),Pos(toLine,getLine(cm.doc,toLine).text.length));while(newText.length > 1 && oldText.length > 1) {if(lst(newText) == lst(oldText)){newText.pop();oldText.pop();toLine--;}else if(newText[0] == oldText[0]){newText.shift();oldText.shift();fromLine++;}else break;}var cutFront=0,cutEnd=0;var newTop=newText[0],oldTop=oldText[0],maxCutFront=Math.min(newTop.length,oldTop.length);while(cutFront < maxCutFront && newTop.charCodeAt(cutFront) == oldTop.charCodeAt(cutFront)) ++cutFront;var newBot=lst(newText),oldBot=lst(oldText);var maxCutEnd=Math.min(newBot.length - (newText.length == 1?cutFront:0),oldBot.length - (oldText.length == 1?cutFront:0));while(cutEnd < maxCutEnd && newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1)) ++cutEnd;newText[newText.length - 1] = newBot.slice(0,newBot.length - cutEnd);newText[0] = newText[0].slice(cutFront);var chFrom=Pos(fromLine,cutFront);var chTo=Pos(toLine,oldText.length?lst(oldText).length - cutEnd:0);if(newText.length > 1 || newText[0] || cmp(chFrom,chTo)){_replaceRange(cm.doc,newText,chFrom,chTo,"+input");return true;}},ensurePolled:function ensurePolled(){this.forceCompositionEnd();},reset:function reset(){this.forceCompositionEnd();},forceCompositionEnd:function forceCompositionEnd(){if(!this.composing || this.composing.handled)return;this.applyComposition(this.composing);this.composing.handled = true;this.div.blur();this.div.focus();},applyComposition:function applyComposition(composing){if(composing.data && composing.data != composing.startData)operation(this.cm,applyTextInput)(this.cm,composing.data,0,composing.sel);},setUneditable:function setUneditable(node){node.setAttribute("contenteditable","false");},onKeyPress:function onKeyPress(e){e.preventDefault();operation(this.cm,applyTextInput)(this.cm,String.fromCharCode(e.charCode == null?e.keyCode:e.charCode),0);},onContextMenu:nothing,resetPosition:nothing,needsContentAttribute:true},ContentEditableInput.prototype);function posToDOM(cm,pos){var view=findViewForLine(cm,pos.line);if(!view || view.hidden)return null;var line=getLine(cm.doc,pos.line);var info=mapFromLineView(view,line,pos.line);var order=getOrder(line),side="left";if(order){var partPos=getBidiPartAt(order,pos.ch);side = partPos % 2?"right":"left";}var result=nodeAndOffsetInLineMap(info.map,pos.ch,"left");result.offset = result.collapse == "right"?result.end:result.start;return result;}function badPos(pos,bad){if(bad)pos.bad = true;return pos;}function domToPos(cm,node,offset){var lineNode;if(node == cm.display.lineDiv){lineNode = cm.display.lineDiv.childNodes[offset];if(!lineNode)return badPos(cm.clipPos(Pos(cm.display.viewTo - 1)),true);node = null;offset = 0;}else {for(lineNode = node;;lineNode = lineNode.parentNode) {if(!lineNode || lineNode == cm.display.lineDiv)return null;if(lineNode.parentNode && lineNode.parentNode == cm.display.lineDiv)break;}}for(var i=0;i < cm.display.view.length;i++) {var lineView=cm.display.view[i];if(lineView.node == lineNode)return locateNodeInLineView(lineView,node,offset);}}function locateNodeInLineView(lineView,node,offset){var wrapper=lineView.text.firstChild,bad=false;if(!node || !contains(wrapper,node))return badPos(Pos(lineNo(lineView.line),0),true);if(node == wrapper){bad = true;node = wrapper.childNodes[offset];offset = 0;if(!node){var line=lineView.rest?lst(lineView.rest):lineView.line;return badPos(Pos(lineNo(line),line.text.length),bad);}}var textNode=node.nodeType == 3?node:null,topNode=node;if(!textNode && node.childNodes.length == 1 && node.firstChild.nodeType == 3){textNode = node.firstChild;if(offset)offset = textNode.nodeValue.length;}while(topNode.parentNode != wrapper) topNode = topNode.parentNode;var measure=lineView.measure,maps=measure.maps;function find(textNode,topNode,offset){for(var i=-1;i < (maps?maps.length:0);i++) {var map=i < 0?measure.map:maps[i];for(var j=0;j < map.length;j += 3) {var curNode=map[j + 2];if(curNode == textNode || curNode == topNode){var line=lineNo(i < 0?lineView.line:lineView.rest[i]);var ch=map[j] + offset;if(offset < 0 || curNode != textNode)ch = map[j + (offset?1:0)];return Pos(line,ch);}}}}var found=find(textNode,topNode,offset);if(found)return badPos(found,bad); // FIXME this is all really shaky. might handle the few cases it needs to handle, but likely to cause problems
for(var after=topNode.nextSibling,dist=textNode?textNode.nodeValue.length - offset:0;after;after = after.nextSibling) {found = find(after,after.firstChild,0);if(found)return badPos(Pos(found.line,found.ch - dist),bad);else dist += after.textContent.length;}for(var before=topNode.previousSibling,dist=offset;before;before = before.previousSibling) {found = find(before,before.firstChild,-1);if(found)return badPos(Pos(found.line,found.ch + dist),bad);else dist += after.textContent.length;}}function domTextBetween(cm,from,to,fromLine,toLine){var text="",closing=false;function recognizeMarker(id){return function(marker){return marker.id == id;};}function walk(node){if(node.nodeType == 1){var cmText=node.getAttribute("cm-text");if(cmText != null){if(cmText == "")cmText = node.textContent.replace(/\u200b/g,"");text += cmText;return;}var markerID=node.getAttribute("cm-marker"),range;if(markerID){var found=cm.findMarks(Pos(fromLine,0),Pos(toLine + 1,0),recognizeMarker(+markerID));if(found.length && (range = found[0].find()))text += getBetween(cm.doc,range.from,range.to).join("\n");return;}if(node.getAttribute("contenteditable") == "false")return;for(var i=0;i < node.childNodes.length;i++) walk(node.childNodes[i]);if(/^(pre|div|p)$/i.test(node.nodeName))closing = true;}else if(node.nodeType == 3){var val=node.nodeValue;if(!val)return;if(closing){text += "\n";closing = false;}text += val;}}for(;;) {walk(from);if(from == to)break;from = from.nextSibling;}return text;}CodeMirror.inputStyles = {"textarea":TextareaInput,"contenteditable":ContentEditableInput}; // SELECTION / CURSOR
// Selection objects are immutable. A new one is created every time
// the selection changes. A selection is one or more non-overlapping
// (and non-touching) ranges, sorted, and an integer that indicates
// which one is the primary selection (the one that's scrolled into
// view, that getCursor returns, etc).
function Selection(ranges,primIndex){this.ranges = ranges;this.primIndex = primIndex;}Selection.prototype = {primary:function primary(){return this.ranges[this.primIndex];},equals:function equals(other){if(other == this)return true;if(other.primIndex != this.primIndex || other.ranges.length != this.ranges.length)return false;for(var i=0;i < this.ranges.length;i++) {var here=this.ranges[i],there=other.ranges[i];if(cmp(here.anchor,there.anchor) != 0 || cmp(here.head,there.head) != 0)return false;}return true;},deepCopy:function deepCopy(){for(var out=[],i=0;i < this.ranges.length;i++) out[i] = new Range(copyPos(this.ranges[i].anchor),copyPos(this.ranges[i].head));return new Selection(out,this.primIndex);},somethingSelected:function somethingSelected(){for(var i=0;i < this.ranges.length;i++) if(!this.ranges[i].empty())return true;return false;},contains:function contains(pos,end){if(!end)end = pos;for(var i=0;i < this.ranges.length;i++) {var range=this.ranges[i];if(cmp(end,range.from()) >= 0 && cmp(pos,range.to()) <= 0)return i;}return -1;}};function Range(anchor,head){this.anchor = anchor;this.head = head;}Range.prototype = {from:function from(){return minPos(this.anchor,this.head);},to:function to(){return maxPos(this.anchor,this.head);},empty:function empty(){return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch;}}; // Take an unsorted, potentially overlapping set of ranges, and
// build a selection out of it. 'Consumes' ranges array (modifying
// it).
function normalizeSelection(ranges,primIndex){var prim=ranges[primIndex];ranges.sort(function(a,b){return cmp(a.from(),b.from());});primIndex = indexOf(ranges,prim);for(var i=1;i < ranges.length;i++) {var cur=ranges[i],prev=ranges[i - 1];if(cmp(prev.to(),cur.from()) >= 0){var from=minPos(prev.from(),cur.from()),to=maxPos(prev.to(),cur.to());var inv=prev.empty()?cur.from() == cur.head:prev.from() == prev.head;if(i <= primIndex)--primIndex;ranges.splice(--i,2,new Range(inv?to:from,inv?from:to));}}return new Selection(ranges,primIndex);}function simpleSelection(anchor,head){return new Selection([new Range(anchor,head || anchor)],0);} // Most of the external API clips given positions to make sure they
// actually exist within the document.
function clipLine(doc,n){return Math.max(doc.first,Math.min(n,doc.first + doc.size - 1));}function _clipPos(doc,pos){if(pos.line < doc.first)return Pos(doc.first,0);var last=doc.first + doc.size - 1;if(pos.line > last)return Pos(last,getLine(doc,last).text.length);return clipToLen(pos,getLine(doc,pos.line).text.length);}function clipToLen(pos,linelen){var ch=pos.ch;if(ch == null || ch > linelen)return Pos(pos.line,linelen);else if(ch < 0)return Pos(pos.line,0);else return pos;}function isLine(doc,l){return l >= doc.first && l < doc.first + doc.size;}function clipPosArray(doc,array){for(var out=[],i=0;i < array.length;i++) out[i] = _clipPos(doc,array[i]);return out;} // SELECTION UPDATES
// The 'scroll' parameter given to many of these indicated whether
// the new cursor position should be scrolled into view after
// modifying the selection.
// If shift is held or the extend flag is set, extends a range to
// include a given position (and optionally a second position).
// Otherwise, simply returns the range between the given positions.
// Used for cursor motion and such.
function extendRange(doc,range,head,other){if(doc.cm && doc.cm.display.shift || doc.extend){var anchor=range.anchor;if(other){var posBefore=cmp(head,anchor) < 0;if(posBefore != cmp(other,anchor) < 0){anchor = head;head = other;}else if(posBefore != cmp(head,other) < 0){head = other;}}return new Range(anchor,head);}else {return new Range(other || head,head);}} // Extend the primary selection range, discard the rest.
function extendSelection(doc,head,other,options){setSelection(doc,new Selection([extendRange(doc,doc.sel.primary(),head,other)],0),options);} // Extend all selections (pos is an array of selections with length
// equal the number of selections)
function extendSelections(doc,heads,options){for(var out=[],i=0;i < doc.sel.ranges.length;i++) out[i] = extendRange(doc,doc.sel.ranges[i],heads[i],null);var newSel=normalizeSelection(out,doc.sel.primIndex);setSelection(doc,newSel,options);} // Updates a single range in the selection.
function replaceOneSelection(doc,i,range,options){var ranges=doc.sel.ranges.slice(0);ranges[i] = range;setSelection(doc,normalizeSelection(ranges,doc.sel.primIndex),options);} // Reset the selection to a single range.
function setSimpleSelection(doc,anchor,head,options){setSelection(doc,simpleSelection(anchor,head),options);} // Give beforeSelectionChange handlers a change to influence a
// selection update.
function filterSelectionChange(doc,sel){var obj={ranges:sel.ranges,update:function update(ranges){this.ranges = [];for(var i=0;i < ranges.length;i++) this.ranges[i] = new Range(_clipPos(doc,ranges[i].anchor),_clipPos(doc,ranges[i].head));}};signal(doc,"beforeSelectionChange",doc,obj);if(doc.cm)signal(doc.cm,"beforeSelectionChange",doc.cm,obj);if(obj.ranges != sel.ranges)return normalizeSelection(obj.ranges,obj.ranges.length - 1);else return sel;}function setSelectionReplaceHistory(doc,sel,options){var done=doc.history.done,last=lst(done);if(last && last.ranges){done[done.length - 1] = sel;setSelectionNoUndo(doc,sel,options);}else {setSelection(doc,sel,options);}} // Set a new selection.
function setSelection(doc,sel,options){setSelectionNoUndo(doc,sel,options);addSelectionToHistory(doc,doc.sel,doc.cm?doc.cm.curOp.id:NaN,options);}function setSelectionNoUndo(doc,sel,options){if(hasHandler(doc,"beforeSelectionChange") || doc.cm && hasHandler(doc.cm,"beforeSelectionChange"))sel = filterSelectionChange(doc,sel);var bias=options && options.bias || (cmp(sel.primary().head,doc.sel.primary().head) < 0?-1:1);setSelectionInner(doc,skipAtomicInSelection(doc,sel,bias,true));if(!(options && options.scroll === false) && doc.cm)ensureCursorVisible(doc.cm);}function setSelectionInner(doc,sel){if(sel.equals(doc.sel))return;doc.sel = sel;if(doc.cm){doc.cm.curOp.updateInput = doc.cm.curOp.selectionChanged = true;signalCursorActivity(doc.cm);}signalLater(doc,"cursorActivity",doc);} // Verify that the selection does not partially select any atomic
// marked ranges.
function reCheckSelection(doc){setSelectionInner(doc,skipAtomicInSelection(doc,doc.sel,null,false),sel_dontScroll);} // Return a selection that does not partially select any atomic
// ranges.
function skipAtomicInSelection(doc,sel,bias,mayClear){var out;for(var i=0;i < sel.ranges.length;i++) {var range=sel.ranges[i];var newAnchor=skipAtomic(doc,range.anchor,bias,mayClear);var newHead=skipAtomic(doc,range.head,bias,mayClear);if(out || newAnchor != range.anchor || newHead != range.head){if(!out)out = sel.ranges.slice(0,i);out[i] = new Range(newAnchor,newHead);}}return out?normalizeSelection(out,sel.primIndex):sel;} // Ensure a given position is not inside an atomic range.
function skipAtomic(_x,_x2,_x3,_x4){var _again=true;_function: while(_again) {var doc=_x,pos=_x2,bias=_x3,mayClear=_x4;flipped = curPos = dir = line = i = sp = m = newPos = undefined;_again = false;var flipped=false,curPos=pos;var dir=bias || 1;doc.cantEdit = false;search: for(;;) {var line=getLine(doc,curPos.line);if(line.markedSpans){for(var i=0;i < line.markedSpans.length;++i) {var sp=line.markedSpans[i],m=sp.marker;if((sp.from == null || (m.inclusiveLeft?sp.from <= curPos.ch:sp.from < curPos.ch)) && (sp.to == null || (m.inclusiveRight?sp.to >= curPos.ch:sp.to > curPos.ch))){if(mayClear){signal(m,"beforeCursorEnter");if(m.explicitlyCleared){if(!line.markedSpans)break;else {--i;continue;}}}if(!m.atomic)continue;var newPos=m.find(dir < 0?-1:1);if(cmp(newPos,curPos) == 0){newPos.ch += dir;if(newPos.ch < 0){if(newPos.line > doc.first)newPos = _clipPos(doc,Pos(newPos.line - 1));else newPos = null;}else if(newPos.ch > line.text.length){if(newPos.line < doc.first + doc.size - 1)newPos = Pos(newPos.line + 1,0);else newPos = null;}if(!newPos){if(flipped){ // Driven in a corner -- no valid cursor position found at all
// -- try again *with* clearing, if we didn't already
if(!mayClear){_x = doc;_x2 = pos;_x3 = bias;_x4 = true;_again = true;continue _function;} // Otherwise, turn off editing until further notice, and return the start of the doc
doc.cantEdit = true;return Pos(doc.first,0);}flipped = true;newPos = pos;dir = -dir;}}curPos = newPos;continue search;}}}return curPos;}}} // SELECTION DRAWING
function updateSelection(cm){cm.display.input.showSelection(cm.display.input.prepareSelection());}function _prepareSelection(cm,primary){var doc=cm.doc,result={};var curFragment=result.cursors = document.createDocumentFragment();var selFragment=result.selection = document.createDocumentFragment();for(var i=0;i < doc.sel.ranges.length;i++) {if(primary === false && i == doc.sel.primIndex)continue;var range=doc.sel.ranges[i];var collapsed=range.empty();if(collapsed || cm.options.showCursorWhenSelecting)drawSelectionCursor(cm,range,curFragment);if(!collapsed)drawSelectionRange(cm,range,selFragment);}return result;} // Draws a cursor for the given range
function drawSelectionCursor(cm,range,output){var pos=_cursorCoords(cm,range.head,"div",null,null,!cm.options.singleCursorHeightPerLine);var cursor=output.appendChild(elt("div"," ","CodeMirror-cursor"));cursor.style.left = pos.left + "px";cursor.style.top = pos.top + "px";cursor.style.height = Math.max(0,pos.bottom - pos.top) * cm.options.cursorHeight + "px";if(pos.other){ // Secondary cursor, shown when on a 'jump' in bi-directional text
var otherCursor=output.appendChild(elt("div"," ","CodeMirror-cursor CodeMirror-secondarycursor"));otherCursor.style.display = "";otherCursor.style.left = pos.other.left + "px";otherCursor.style.top = pos.other.top + "px";otherCursor.style.height = (pos.other.bottom - pos.other.top) * .85 + "px";}} // Draws the given range as a highlighted selection
function drawSelectionRange(cm,range,output){var display=cm.display,doc=cm.doc;var fragment=document.createDocumentFragment();var padding=paddingH(cm.display),leftSide=padding.left;var rightSide=Math.max(display.sizerWidth,displayWidth(cm) - display.sizer.offsetLeft) - padding.right;function add(left,top,width,bottom){if(top < 0)top = 0;top = Math.round(top);bottom = Math.round(bottom);fragment.appendChild(elt("div",null,"CodeMirror-selected","position: absolute; left: " + left + "px; top: " + top + "px; width: " + (width == null?rightSide - left:width) + "px; height: " + (bottom - top) + "px"));}function drawForLine(line,fromArg,toArg){var lineObj=getLine(doc,line);var lineLen=lineObj.text.length;var start,end;function coords(ch,bias){return _charCoords(cm,Pos(line,ch),"div",lineObj,bias);}iterateBidiSections(getOrder(lineObj),fromArg || 0,toArg == null?lineLen:toArg,function(from,to,dir){var leftPos=coords(from,"left"),rightPos,left,right;if(from == to){rightPos = leftPos;left = right = leftPos.left;}else {rightPos = coords(to - 1,"right");if(dir == "rtl"){var tmp=leftPos;leftPos = rightPos;rightPos = tmp;}left = leftPos.left;right = rightPos.right;}if(fromArg == null && from == 0)left = leftSide;if(rightPos.top - leftPos.top > 3){ // Different lines, draw top part
add(left,leftPos.top,null,leftPos.bottom);left = leftSide;if(leftPos.bottom < rightPos.top)add(left,leftPos.bottom,null,rightPos.top);}if(toArg == null && to == lineLen)right = rightSide;if(!start || leftPos.top < start.top || leftPos.top == start.top && leftPos.left < start.left)start = leftPos;if(!end || rightPos.bottom > end.bottom || rightPos.bottom == end.bottom && rightPos.right > end.right)end = rightPos;if(left < leftSide + 1)left = leftSide;add(left,rightPos.top,right - left,rightPos.bottom);});return {start:start,end:end};}var sFrom=range.from(),sTo=range.to();if(sFrom.line == sTo.line){drawForLine(sFrom.line,sFrom.ch,sTo.ch);}else {var fromLine=getLine(doc,sFrom.line),toLine=getLine(doc,sTo.line);var singleVLine=visualLine(fromLine) == visualLine(toLine);var leftEnd=drawForLine(sFrom.line,sFrom.ch,singleVLine?fromLine.text.length + 1:null).end;var rightStart=drawForLine(sTo.line,singleVLine?0:null,sTo.ch).start;if(singleVLine){if(leftEnd.top < rightStart.top - 2){add(leftEnd.right,leftEnd.top,null,leftEnd.bottom);add(leftSide,rightStart.top,rightStart.left,rightStart.bottom);}else {add(leftEnd.right,leftEnd.top,rightStart.left - leftEnd.right,leftEnd.bottom);}}if(leftEnd.bottom < rightStart.top)add(leftSide,leftEnd.bottom,null,rightStart.top);}output.appendChild(fragment);} // Cursor-blinking
function restartBlink(cm){if(!cm.state.focused)return;var display=cm.display;clearInterval(display.blinker);var on=true;display.cursorDiv.style.visibility = "";if(cm.options.cursorBlinkRate > 0)display.blinker = setInterval(function(){display.cursorDiv.style.visibility = (on = !on)?"":"hidden";},cm.options.cursorBlinkRate);else if(cm.options.cursorBlinkRate < 0)display.cursorDiv.style.visibility = "hidden";} // HIGHLIGHT WORKER
function startWorker(cm,time){if(cm.doc.mode.startState && cm.doc.frontier < cm.display.viewTo)cm.state.highlight.set(time,bind(highlightWorker,cm));}function highlightWorker(cm){var doc=cm.doc;if(doc.frontier < doc.first)doc.frontier = doc.first;if(doc.frontier >= cm.display.viewTo)return;var end=+new Date() + cm.options.workTime;var state=copyState(doc.mode,getStateBefore(cm,doc.frontier));var changedLines=[];doc.iter(doc.frontier,Math.min(doc.first + doc.size,cm.display.viewTo + 500),function(line){if(doc.frontier >= cm.display.viewFrom){ // Visible
var oldStyles=line.styles;var highlighted=highlightLine(cm,line,state,true);line.styles = highlighted.styles;var oldCls=line.styleClasses,newCls=highlighted.classes;if(newCls)line.styleClasses = newCls;else if(oldCls)line.styleClasses = null;var ischange=!oldStyles || oldStyles.length != line.styles.length || oldCls != newCls && (!oldCls || !newCls || oldCls.bgClass != newCls.bgClass || oldCls.textClass != newCls.textClass);for(var i=0;!ischange && i < oldStyles.length;++i) ischange = oldStyles[i] != line.styles[i];if(ischange)changedLines.push(doc.frontier);line.stateAfter = copyState(doc.mode,state);}else {processLine(cm,line.text,state);line.stateAfter = doc.frontier % 5 == 0?copyState(doc.mode,state):null;}++doc.frontier;if(+new Date() > end){startWorker(cm,cm.options.workDelay);return true;}});if(changedLines.length)runInOp(cm,function(){for(var i=0;i < changedLines.length;i++) regLineChange(cm,changedLines[i],"text");});} // Finds the line to start with when starting a parse. Tries to
// find a line with a stateAfter, so that it can start with a
// valid state. If that fails, it returns the line with the
// smallest indentation, which tends to need the least context to
// parse correctly.
function findStartLine(cm,n,precise){var minindent,minline,doc=cm.doc;var lim=precise?-1:n - (cm.doc.mode.innerMode?1000:100);for(var search=n;search > lim;--search) {if(search <= doc.first)return doc.first;var line=getLine(doc,search - 1);if(line.stateAfter && (!precise || search <= doc.frontier))return search;var indented=countColumn(line.text,null,cm.options.tabSize);if(minline == null || minindent > indented){minline = search - 1;minindent = indented;}}return minline;}function getStateBefore(cm,n,precise){var doc=cm.doc,display=cm.display;if(!doc.mode.startState)return true;var pos=findStartLine(cm,n,precise),state=pos > doc.first && getLine(doc,pos - 1).stateAfter;if(!state)state = startState(doc.mode);else state = copyState(doc.mode,state);doc.iter(pos,n,function(line){processLine(cm,line.text,state);var save=pos == n - 1 || pos % 5 == 0 || pos >= display.viewFrom && pos < display.viewTo;line.stateAfter = save?copyState(doc.mode,state):null;++pos;});if(precise)doc.frontier = pos;return state;} // POSITION MEASUREMENT
function paddingTop(display){return display.lineSpace.offsetTop;}function paddingVert(display){return display.mover.offsetHeight - display.lineSpace.offsetHeight;}function paddingH(display){if(display.cachedPaddingH)return display.cachedPaddingH;var e=removeChildrenAndAdd(display.measure,elt("pre","x"));var style=window.getComputedStyle?window.getComputedStyle(e):e.currentStyle;var data={left:parseInt(style.paddingLeft),right:parseInt(style.paddingRight)};if(!isNaN(data.left) && !isNaN(data.right))display.cachedPaddingH = data;return data;}function scrollGap(cm){return scrollerGap - cm.display.nativeBarWidth;}function displayWidth(cm){return cm.display.scroller.clientWidth - scrollGap(cm) - cm.display.barWidth;}function displayHeight(cm){return cm.display.scroller.clientHeight - scrollGap(cm) - cm.display.barHeight;} // Ensure the lineView.wrapping.heights array is populated. This is
// an array of bottom offsets for the lines that make up a drawn
// line. When lineWrapping is on, there might be more than one
// height.
function ensureLineHeights(cm,lineView,rect){var wrapping=cm.options.lineWrapping;var curWidth=wrapping && displayWidth(cm);if(!lineView.measure.heights || wrapping && lineView.measure.width != curWidth){var heights=lineView.measure.heights = [];if(wrapping){lineView.measure.width = curWidth;var rects=lineView.text.firstChild.getClientRects();for(var i=0;i < rects.length - 1;i++) {var cur=rects[i],next=rects[i + 1];if(Math.abs(cur.bottom - next.bottom) > 2)heights.push((cur.bottom + next.top) / 2 - rect.top);}}heights.push(rect.bottom - rect.top);}} // Find a line map (mapping character offsets to text nodes) and a
// measurement cache for the given line number. (A line view might
// contain multiple lines when collapsed ranges are present.)
function mapFromLineView(lineView,line,lineN){if(lineView.line == line)return {map:lineView.measure.map,cache:lineView.measure.cache};for(var i=0;i < lineView.rest.length;i++) if(lineView.rest[i] == line)return {map:lineView.measure.maps[i],cache:lineView.measure.caches[i]};for(var i=0;i < lineView.rest.length;i++) if(lineNo(lineView.rest[i]) > lineN)return {map:lineView.measure.maps[i],cache:lineView.measure.caches[i],before:true};} // Render a line into the hidden node display.externalMeasured. Used
// when measurement is needed for a line that's not in the viewport.
function updateExternalMeasurement(cm,line){line = visualLine(line);var lineN=lineNo(line);var view=cm.display.externalMeasured = new LineView(cm.doc,line,lineN);view.lineN = lineN;var built=view.built = buildLineContent(cm,view);view.text = built.pre;removeChildrenAndAdd(cm.display.lineMeasure,built.pre);return view;} // Get a {top, bottom, left, right} box (in line-local coordinates)
// for a given character.
function measureChar(cm,line,ch,bias){return measureCharPrepared(cm,prepareMeasureForLine(cm,line),ch,bias);} // Find a line view that corresponds to the given line number.
function findViewForLine(cm,lineN){if(lineN >= cm.display.viewFrom && lineN < cm.display.viewTo)return cm.display.view[findViewIndex(cm,lineN)];var ext=cm.display.externalMeasured;if(ext && lineN >= ext.lineN && lineN < ext.lineN + ext.size)return ext;} // Measurement can be split in two steps, the set-up work that
// applies to the whole line, and the measurement of the actual
// character. Functions like coordsChar, that need to do a lot of
// measurements in a row, can thus ensure that the set-up work is
// only done once.
function prepareMeasureForLine(cm,line){var lineN=lineNo(line);var view=findViewForLine(cm,lineN);if(view && !view.text)view = null;else if(view && view.changes)updateLineForChanges(cm,view,lineN,getDimensions(cm));if(!view)view = updateExternalMeasurement(cm,line);var info=mapFromLineView(view,line,lineN);return {line:line,view:view,rect:null,map:info.map,cache:info.cache,before:info.before,hasHeights:false};} // Given a prepared measurement object, measures the position of an
// actual character (or fetches it from the cache).
function measureCharPrepared(cm,prepared,ch,bias,varHeight){if(prepared.before)ch = -1;var key=ch + (bias || ""),found;if(prepared.cache.hasOwnProperty(key)){found = prepared.cache[key];}else {if(!prepared.rect)prepared.rect = prepared.view.text.getBoundingClientRect();if(!prepared.hasHeights){ensureLineHeights(cm,prepared.view,prepared.rect);prepared.hasHeights = true;}found = measureCharInner(cm,prepared,ch,bias);if(!found.bogus)prepared.cache[key] = found;}return {left:found.left,right:found.right,top:varHeight?found.rtop:found.top,bottom:varHeight?found.rbottom:found.bottom};}var nullRect={left:0,right:0,top:0,bottom:0};function nodeAndOffsetInLineMap(map,ch,bias){var node,start,end,collapse; // First, search the line map for the text node corresponding to,
// or closest to, the target character.
for(var i=0;i < map.length;i += 3) {var mStart=map[i],mEnd=map[i + 1];if(ch < mStart){start = 0;end = 1;collapse = "left";}else if(ch < mEnd){start = ch - mStart;end = start + 1;}else if(i == map.length - 3 || ch == mEnd && map[i + 3] > ch){end = mEnd - mStart;start = end - 1;if(ch >= mEnd)collapse = "right";}if(start != null){node = map[i + 2];if(mStart == mEnd && bias == (node.insertLeft?"left":"right"))collapse = bias;if(bias == "left" && start == 0)while(i && map[i - 2] == map[i - 3] && map[i - 1].insertLeft) {node = map[(i -= 3) + 2];collapse = "left";}if(bias == "right" && start == mEnd - mStart)while(i < map.length - 3 && map[i + 3] == map[i + 4] && !map[i + 5].insertLeft) {node = map[(i += 3) + 2];collapse = "right";}break;}}return {node:node,start:start,end:end,collapse:collapse,coverStart:mStart,coverEnd:mEnd};}function measureCharInner(cm,prepared,ch,bias){var place=nodeAndOffsetInLineMap(prepared.map,ch,bias);var node=place.node,start=place.start,end=place.end,collapse=place.collapse;var rect;if(node.nodeType == 3){ // If it is a text node, use a range to retrieve the coordinates.
for(var i=0;i < 4;i++) { // Retry a maximum of 4 times when nonsense rectangles are returned
while(start && isExtendingChar(prepared.line.text.charAt(place.coverStart + start))) --start;while(place.coverStart + end < place.coverEnd && isExtendingChar(prepared.line.text.charAt(place.coverStart + end))) ++end;if(ie && ie_version < 9 && start == 0 && end == place.coverEnd - place.coverStart){rect = node.parentNode.getBoundingClientRect();}else if(ie && cm.options.lineWrapping){var rects=range(node,start,end).getClientRects();if(rects.length)rect = rects[bias == "right"?rects.length - 1:0];else rect = nullRect;}else {rect = range(node,start,end).getBoundingClientRect() || nullRect;}if(rect.left || rect.right || start == 0)break;end = start;start = start - 1;collapse = "right";}if(ie && ie_version < 11)rect = maybeUpdateRectForZooming(cm.display.measure,rect);}else { // If it is a widget, simply get the box for the whole widget.
if(start > 0)collapse = bias = "right";var rects;if(cm.options.lineWrapping && (rects = node.getClientRects()).length > 1)rect = rects[bias == "right"?rects.length - 1:0];else rect = node.getBoundingClientRect();}if(ie && ie_version < 9 && !start && (!rect || !rect.left && !rect.right)){var rSpan=node.parentNode.getClientRects()[0];if(rSpan)rect = {left:rSpan.left,right:rSpan.left + charWidth(cm.display),top:rSpan.top,bottom:rSpan.bottom};else rect = nullRect;}var rtop=rect.top - prepared.rect.top,rbot=rect.bottom - prepared.rect.top;var mid=(rtop + rbot) / 2;var heights=prepared.view.measure.heights;for(var i=0;i < heights.length - 1;i++) if(mid < heights[i])break;var top=i?heights[i - 1]:0,bot=heights[i];var result={left:(collapse == "right"?rect.right:rect.left) - prepared.rect.left,right:(collapse == "left"?rect.left:rect.right) - prepared.rect.left,top:top,bottom:bot};if(!rect.left && !rect.right)result.bogus = true;if(!cm.options.singleCursorHeightPerLine){result.rtop = rtop;result.rbottom = rbot;}return result;} // Work around problem with bounding client rects on ranges being
// returned incorrectly when zoomed on IE10 and below.
function maybeUpdateRectForZooming(measure,rect){if(!window.screen || screen.logicalXDPI == null || screen.logicalXDPI == screen.deviceXDPI || !hasBadZoomedRects(measure))return rect;var scaleX=screen.logicalXDPI / screen.deviceXDPI;var scaleY=screen.logicalYDPI / screen.deviceYDPI;return {left:rect.left * scaleX,right:rect.right * scaleX,top:rect.top * scaleY,bottom:rect.bottom * scaleY};}function clearLineMeasurementCacheFor(lineView){if(lineView.measure){lineView.measure.cache = {};lineView.measure.heights = null;if(lineView.rest)for(var i=0;i < lineView.rest.length;i++) lineView.measure.caches[i] = {};}}function clearLineMeasurementCache(cm){cm.display.externalMeasure = null;removeChildren(cm.display.lineMeasure);for(var i=0;i < cm.display.view.length;i++) clearLineMeasurementCacheFor(cm.display.view[i]);}function clearCaches(cm){clearLineMeasurementCache(cm);cm.display.cachedCharWidth = cm.display.cachedTextHeight = cm.display.cachedPaddingH = null;if(!cm.options.lineWrapping)cm.display.maxLineChanged = true;cm.display.lineNumChars = null;}function pageScrollX(){return window.pageXOffset || (document.documentElement || document.body).scrollLeft;}function pageScrollY(){return window.pageYOffset || (document.documentElement || document.body).scrollTop;} // Converts a {top, bottom, left, right} box from line-local
// coordinates into another coordinate system. Context may be one of
// "line", "div" (display.lineDiv), "local"/null (editor), "window",
// or "page".
function intoCoordSystem(cm,lineObj,rect,context){if(lineObj.widgets)for(var i=0;i < lineObj.widgets.length;++i) if(lineObj.widgets[i].above){var size=widgetHeight(lineObj.widgets[i]);rect.top += size;rect.bottom += size;}if(context == "line")return rect;if(!context)context = "local";var yOff=_heightAtLine(lineObj);if(context == "local")yOff += paddingTop(cm.display);else yOff -= cm.display.viewOffset;if(context == "page" || context == "window"){var lOff=cm.display.lineSpace.getBoundingClientRect();yOff += lOff.top + (context == "window"?0:pageScrollY());var xOff=lOff.left + (context == "window"?0:pageScrollX());rect.left += xOff;rect.right += xOff;}rect.top += yOff;rect.bottom += yOff;return rect;} // Coverts a box from "div" coords to another coordinate system.
// Context may be "window", "page", "div", or "local"/null.
function fromCoordSystem(cm,coords,context){if(context == "div")return coords;var left=coords.left,top=coords.top; // First move into "page" coordinate system
if(context == "page"){left -= pageScrollX();top -= pageScrollY();}else if(context == "local" || !context){var localBox=cm.display.sizer.getBoundingClientRect();left += localBox.left;top += localBox.top;}var lineSpaceBox=cm.display.lineSpace.getBoundingClientRect();return {left:left - lineSpaceBox.left,top:top - lineSpaceBox.top};}function _charCoords(cm,pos,context,lineObj,bias){if(!lineObj)lineObj = getLine(cm.doc,pos.line);return intoCoordSystem(cm,lineObj,measureChar(cm,lineObj,pos.ch,bias),context);} // Returns a box for a given cursor position, which may have an
// 'other' property containing the position of the secondary cursor
// on a bidi boundary.
function _cursorCoords(cm,pos,context,lineObj,preparedMeasure,varHeight){lineObj = lineObj || getLine(cm.doc,pos.line);if(!preparedMeasure)preparedMeasure = prepareMeasureForLine(cm,lineObj);function get(ch,right){var m=measureCharPrepared(cm,preparedMeasure,ch,right?"right":"left",varHeight);if(right)m.left = m.right;else m.right = m.left;return intoCoordSystem(cm,lineObj,m,context);}function getBidi(ch,partPos){var part=order[partPos],right=part.level % 2;if(ch == bidiLeft(part) && partPos && part.level < order[partPos - 1].level){part = order[--partPos];ch = bidiRight(part) - (part.level % 2?0:1);right = true;}else if(ch == bidiRight(part) && partPos < order.length - 1 && part.level < order[partPos + 1].level){part = order[++partPos];ch = bidiLeft(part) - part.level % 2;right = false;}if(right && ch == part.to && ch > part.from)return get(ch - 1);return get(ch,right);}var order=getOrder(lineObj),ch=pos.ch;if(!order)return get(ch);var partPos=getBidiPartAt(order,ch);var val=getBidi(ch,partPos);if(bidiOther != null)val.other = getBidi(ch,bidiOther);return val;} // Used to cheaply estimate the coordinates for a position. Used for
// intermediate scroll updates.
function estimateCoords(cm,pos){var left=0,pos=_clipPos(cm.doc,pos);if(!cm.options.lineWrapping)left = charWidth(cm.display) * pos.ch;var lineObj=getLine(cm.doc,pos.line);var top=_heightAtLine(lineObj) + paddingTop(cm.display);return {left:left,right:left,top:top,bottom:top + lineObj.height};} // Positions returned by coordsChar contain some extra information.
// xRel is the relative x position of the input coordinates compared
// to the found position (so xRel > 0 means the coordinates are to
// the right of the character position, for example). When outside
// is true, that means the coordinates lie outside the line's
// vertical range.
function PosWithInfo(line,ch,outside,xRel){var pos=Pos(line,ch);pos.xRel = xRel;if(outside)pos.outside = true;return pos;} // Compute the character position closest to the given coordinates.
// Input must be lineSpace-local ("div" coordinate system).
function _coordsChar(cm,x,y){var doc=cm.doc;y += cm.display.viewOffset;if(y < 0)return PosWithInfo(doc.first,0,true,-1);var lineN=_lineAtHeight(doc,y),last=doc.first + doc.size - 1;if(lineN > last)return PosWithInfo(doc.first + doc.size - 1,getLine(doc,last).text.length,true,1);if(x < 0)x = 0;var lineObj=getLine(doc,lineN);for(;;) {var found=coordsCharInner(cm,lineObj,lineN,x,y);var merged=collapsedSpanAtEnd(lineObj);var mergedPos=merged && merged.find(0,true);if(merged && (found.ch > mergedPos.from.ch || found.ch == mergedPos.from.ch && found.xRel > 0))lineN = lineNo(lineObj = mergedPos.to.line);else return found;}}function coordsCharInner(cm,lineObj,lineNo,x,y){var innerOff=y - _heightAtLine(lineObj);var wrongLine=false,adjust=2 * cm.display.wrapper.clientWidth;var preparedMeasure=prepareMeasureForLine(cm,lineObj);function getX(ch){var sp=_cursorCoords(cm,Pos(lineNo,ch),"line",lineObj,preparedMeasure);wrongLine = true;if(innerOff > sp.bottom)return sp.left - adjust;else if(innerOff < sp.top)return sp.left + adjust;else wrongLine = false;return sp.left;}var bidi=getOrder(lineObj),dist=lineObj.text.length;var from=lineLeft(lineObj),to=lineRight(lineObj);var fromX=getX(from),fromOutside=wrongLine,toX=getX(to),toOutside=wrongLine;if(x > toX)return PosWithInfo(lineNo,to,toOutside,1); // Do a binary search between these bounds.
for(;;) {if(bidi?to == from || to == moveVisually(lineObj,from,1):to - from <= 1){var ch=x < fromX || x - fromX <= toX - x?from:to;var xDiff=x - (ch == from?fromX:toX);while(isExtendingChar(lineObj.text.charAt(ch))) ++ch;var pos=PosWithInfo(lineNo,ch,ch == from?fromOutside:toOutside,xDiff < -1?-1:xDiff > 1?1:0);return pos;}var step=Math.ceil(dist / 2),middle=from + step;if(bidi){middle = from;for(var i=0;i < step;++i) middle = moveVisually(lineObj,middle,1);}var middleX=getX(middle);if(middleX > x){to = middle;toX = middleX;if(toOutside = wrongLine)toX += 1000;dist = step;}else {from = middle;fromX = middleX;fromOutside = wrongLine;dist -= step;}}}var measureText; // Compute the default text height.
function textHeight(display){if(display.cachedTextHeight != null)return display.cachedTextHeight;if(measureText == null){measureText = elt("pre"); // Measure a bunch of lines, for browsers that compute
// fractional heights.
for(var i=0;i < 49;++i) {measureText.appendChild(document.createTextNode("x"));measureText.appendChild(elt("br"));}measureText.appendChild(document.createTextNode("x"));}removeChildrenAndAdd(display.measure,measureText);var height=measureText.offsetHeight / 50;if(height > 3)display.cachedTextHeight = height;removeChildren(display.measure);return height || 1;} // Compute the default character width.
function charWidth(display){if(display.cachedCharWidth != null)return display.cachedCharWidth;var anchor=elt("span","xxxxxxxxxx");var pre=elt("pre",[anchor]);removeChildrenAndAdd(display.measure,pre);var rect=anchor.getBoundingClientRect(),width=(rect.right - rect.left) / 10;if(width > 2)display.cachedCharWidth = width;return width || 10;} // OPERATIONS
// Operations are used to wrap a series of changes to the editor
// state in such a way that each change won't have to update the
// cursor and display (which would be awkward, slow, and
// error-prone). Instead, display updates are batched and then all
// combined and executed at once.
var operationGroup=null;var nextOpId=0; // Start a new operation.
function startOperation(cm){cm.curOp = {cm:cm,viewChanged:false, // Flag that indicates that lines might need to be redrawn
startHeight:cm.doc.height, // Used to detect need to update scrollbar
forceUpdate:false, // Used to force a redraw
updateInput:null, // Whether to reset the input textarea
typing:false, // Whether this reset should be careful to leave existing text (for compositing)
changeObjs:null, // Accumulated changes, for firing change events
cursorActivityHandlers:null, // Set of handlers to fire cursorActivity on
cursorActivityCalled:0, // Tracks which cursorActivity handlers have been called already
selectionChanged:false, // Whether the selection needs to be redrawn
updateMaxLine:false, // Set when the widest line needs to be determined anew
scrollLeft:null,scrollTop:null, // Intermediate scroll position, not pushed to DOM yet
scrollToPos:null, // Used to scroll to a specific position
id:++nextOpId // Unique ID
};if(operationGroup){operationGroup.ops.push(cm.curOp);}else {cm.curOp.ownsGroup = operationGroup = {ops:[cm.curOp],delayedCallbacks:[]};}}function fireCallbacksForOps(group){ // Calls delayed callbacks and cursorActivity handlers until no
// new ones appear
var callbacks=group.delayedCallbacks,i=0;do {for(;i < callbacks.length;i++) callbacks[i]();for(var j=0;j < group.ops.length;j++) {var op=group.ops[j];if(op.cursorActivityHandlers)while(op.cursorActivityCalled < op.cursorActivityHandlers.length) op.cursorActivityHandlers[op.cursorActivityCalled++](op.cm);}}while(i < callbacks.length);} // Finish an operation, updating the display and signalling delayed events
function endOperation(cm){var op=cm.curOp,group=op.ownsGroup;if(!group)return;try{fireCallbacksForOps(group);}finally {operationGroup = null;for(var i=0;i < group.ops.length;i++) group.ops[i].cm.curOp = null;endOperations(group);}} // The DOM updates done when an operation finishes are batched so
// that the minimum number of relayouts are required.
function endOperations(group){var ops=group.ops;for(var i=0;i < ops.length;i++)  // Read DOM
endOperation_R1(ops[i]);for(var i=0;i < ops.length;i++)  // Write DOM (maybe)
endOperation_W1(ops[i]);for(var i=0;i < ops.length;i++)  // Read DOM
endOperation_R2(ops[i]);for(var i=0;i < ops.length;i++)  // Write DOM (maybe)
endOperation_W2(ops[i]);for(var i=0;i < ops.length;i++)  // Read DOM
endOperation_finish(ops[i]);}function endOperation_R1(op){var cm=op.cm,display=cm.display;maybeClipScrollbars(cm);if(op.updateMaxLine)findMaxLine(cm);op.mustUpdate = op.viewChanged || op.forceUpdate || op.scrollTop != null || op.scrollToPos && (op.scrollToPos.from.line < display.viewFrom || op.scrollToPos.to.line >= display.viewTo) || display.maxLineChanged && cm.options.lineWrapping;op.update = op.mustUpdate && new DisplayUpdate(cm,op.mustUpdate && {top:op.scrollTop,ensure:op.scrollToPos},op.forceUpdate);}function endOperation_W1(op){op.updatedDisplay = op.mustUpdate && updateDisplayIfNeeded(op.cm,op.update);}function endOperation_R2(op){var cm=op.cm,display=cm.display;if(op.updatedDisplay)updateHeightsInViewport(cm);op.barMeasure = measureForScrollbars(cm); // If the max line changed since it was last measured, measure it,
// and ensure the document's width matches it.
// updateDisplay_W2 will use these properties to do the actual resizing
if(display.maxLineChanged && !cm.options.lineWrapping){op.adjustWidthTo = measureChar(cm,display.maxLine,display.maxLine.text.length).left + 3;cm.display.sizerWidth = op.adjustWidthTo;op.barMeasure.scrollWidth = Math.max(display.scroller.clientWidth,display.sizer.offsetLeft + op.adjustWidthTo + scrollGap(cm) + cm.display.barWidth);op.maxScrollLeft = Math.max(0,display.sizer.offsetLeft + op.adjustWidthTo - displayWidth(cm));}if(op.updatedDisplay || op.selectionChanged)op.preparedSelection = display.input.prepareSelection();}function endOperation_W2(op){var cm=op.cm;if(op.adjustWidthTo != null){cm.display.sizer.style.minWidth = op.adjustWidthTo + "px";if(op.maxScrollLeft < cm.doc.scrollLeft)setScrollLeft(cm,Math.min(cm.display.scroller.scrollLeft,op.maxScrollLeft),true);cm.display.maxLineChanged = false;}if(op.preparedSelection)cm.display.input.showSelection(op.preparedSelection);if(op.updatedDisplay)setDocumentHeight(cm,op.barMeasure);if(op.updatedDisplay || op.startHeight != cm.doc.height)updateScrollbars(cm,op.barMeasure);if(op.selectionChanged)restartBlink(cm);if(cm.state.focused && op.updateInput)cm.display.input.reset(op.typing);}function endOperation_finish(op){var cm=op.cm,display=cm.display,doc=cm.doc;if(op.updatedDisplay)postUpdateDisplay(cm,op.update); // Abort mouse wheel delta measurement, when scrolling explicitly
if(display.wheelStartX != null && (op.scrollTop != null || op.scrollLeft != null || op.scrollToPos))display.wheelStartX = display.wheelStartY = null; // Propagate the scroll position to the actual DOM scroller
if(op.scrollTop != null && (display.scroller.scrollTop != op.scrollTop || op.forceScroll)){doc.scrollTop = Math.max(0,Math.min(display.scroller.scrollHeight - display.scroller.clientHeight,op.scrollTop));display.scrollbars.setScrollTop(doc.scrollTop);display.scroller.scrollTop = doc.scrollTop;}if(op.scrollLeft != null && (display.scroller.scrollLeft != op.scrollLeft || op.forceScroll)){doc.scrollLeft = Math.max(0,Math.min(display.scroller.scrollWidth - displayWidth(cm),op.scrollLeft));display.scrollbars.setScrollLeft(doc.scrollLeft);display.scroller.scrollLeft = doc.scrollLeft;alignHorizontally(cm);} // If we need to scroll a specific position into view, do so.
if(op.scrollToPos){var coords=scrollPosIntoView(cm,_clipPos(doc,op.scrollToPos.from),_clipPos(doc,op.scrollToPos.to),op.scrollToPos.margin);if(op.scrollToPos.isCursor && cm.state.focused)maybeScrollWindow(cm,coords);} // Fire events for markers that are hidden/unidden by editing or
// undoing
var hidden=op.maybeHiddenMarkers,unhidden=op.maybeUnhiddenMarkers;if(hidden)for(var i=0;i < hidden.length;++i) if(!hidden[i].lines.length)signal(hidden[i],"hide");if(unhidden)for(var i=0;i < unhidden.length;++i) if(unhidden[i].lines.length)signal(unhidden[i],"unhide");if(display.wrapper.offsetHeight)doc.scrollTop = cm.display.scroller.scrollTop; // Fire change events, and delayed event handlers
if(op.changeObjs)signal(cm,"changes",cm,op.changeObjs);if(op.update)op.update.finish();} // Run the given function in an operation
function runInOp(cm,f){if(cm.curOp)return f();startOperation(cm);try{return f();}finally {endOperation(cm);}} // Wraps a function in an operation. Returns the wrapped function.
function operation(cm,f){return function(){if(cm.curOp)return f.apply(cm,arguments);startOperation(cm);try{return f.apply(cm,arguments);}finally {endOperation(cm);}};} // Used to add methods to editor and doc instances, wrapping them in
// operations.
function methodOp(f){return function(){if(this.curOp)return f.apply(this,arguments);startOperation(this);try{return f.apply(this,arguments);}finally {endOperation(this);}};}function docMethodOp(f){return function(){var cm=this.cm;if(!cm || cm.curOp)return f.apply(this,arguments);startOperation(cm);try{return f.apply(this,arguments);}finally {endOperation(cm);}};} // VIEW TRACKING
// These objects are used to represent the visible (currently drawn)
// part of the document. A LineView may correspond to multiple
// logical lines, if those are connected by collapsed ranges.
function LineView(doc,line,lineN){ // The starting line
this.line = line; // Continuing lines, if any
this.rest = visualLineContinued(line); // Number of logical lines in this visual line
this.size = this.rest?lineNo(lst(this.rest)) - lineN + 1:1;this.node = this.text = null;this.hidden = lineIsHidden(doc,line);} // Create a range of LineView objects for the given lines.
function buildViewArray(cm,from,to){var array=[],nextPos;for(var pos=from;pos < to;pos = nextPos) {var view=new LineView(cm.doc,getLine(cm.doc,pos),pos);nextPos = pos + view.size;array.push(view);}return array;} // Updates the display.view data structure for a given change to the
// document. From and to are in pre-change coordinates. Lendiff is
// the amount of lines added or subtracted by the change. This is
// used for changes that span multiple lines, or change the way
// lines are divided into visual lines. regLineChange (below)
// registers single-line changes.
function regChange(cm,from,to,lendiff){if(from == null)from = cm.doc.first;if(to == null)to = cm.doc.first + cm.doc.size;if(!lendiff)lendiff = 0;var display=cm.display;if(lendiff && to < display.viewTo && (display.updateLineNumbers == null || display.updateLineNumbers > from))display.updateLineNumbers = from;cm.curOp.viewChanged = true;if(from >= display.viewTo){ // Change after
if(sawCollapsedSpans && visualLineNo(cm.doc,from) < display.viewTo)resetView(cm);}else if(to <= display.viewFrom){ // Change before
if(sawCollapsedSpans && visualLineEndNo(cm.doc,to + lendiff) > display.viewFrom){resetView(cm);}else {display.viewFrom += lendiff;display.viewTo += lendiff;}}else if(from <= display.viewFrom && to >= display.viewTo){ // Full overlap
resetView(cm);}else if(from <= display.viewFrom){ // Top overlap
var cut=viewCuttingPoint(cm,to,to + lendiff,1);if(cut){display.view = display.view.slice(cut.index);display.viewFrom = cut.lineN;display.viewTo += lendiff;}else {resetView(cm);}}else if(to >= display.viewTo){ // Bottom overlap
var cut=viewCuttingPoint(cm,from,from,-1);if(cut){display.view = display.view.slice(0,cut.index);display.viewTo = cut.lineN;}else {resetView(cm);}}else { // Gap in the middle
var cutTop=viewCuttingPoint(cm,from,from,-1);var cutBot=viewCuttingPoint(cm,to,to + lendiff,1);if(cutTop && cutBot){display.view = display.view.slice(0,cutTop.index).concat(buildViewArray(cm,cutTop.lineN,cutBot.lineN)).concat(display.view.slice(cutBot.index));display.viewTo += lendiff;}else {resetView(cm);}}var ext=display.externalMeasured;if(ext){if(to < ext.lineN)ext.lineN += lendiff;else if(from < ext.lineN + ext.size)display.externalMeasured = null;}} // Register a change to a single line. Type must be one of "text",
// "gutter", "class", "widget"
function regLineChange(cm,line,type){cm.curOp.viewChanged = true;var display=cm.display,ext=cm.display.externalMeasured;if(ext && line >= ext.lineN && line < ext.lineN + ext.size)display.externalMeasured = null;if(line < display.viewFrom || line >= display.viewTo)return;var lineView=display.view[findViewIndex(cm,line)];if(lineView.node == null)return;var arr=lineView.changes || (lineView.changes = []);if(indexOf(arr,type) == -1)arr.push(type);} // Clear the view.
function resetView(cm){cm.display.viewFrom = cm.display.viewTo = cm.doc.first;cm.display.view = [];cm.display.viewOffset = 0;} // Find the view element corresponding to a given line. Return null
// when the line isn't visible.
function findViewIndex(cm,n){if(n >= cm.display.viewTo)return null;n -= cm.display.viewFrom;if(n < 0)return null;var view=cm.display.view;for(var i=0;i < view.length;i++) {n -= view[i].size;if(n < 0)return i;}}function viewCuttingPoint(cm,oldN,newN,dir){var index=findViewIndex(cm,oldN),diff,view=cm.display.view;if(!sawCollapsedSpans || newN == cm.doc.first + cm.doc.size)return {index:index,lineN:newN};for(var i=0,n=cm.display.viewFrom;i < index;i++) n += view[i].size;if(n != oldN){if(dir > 0){if(index == view.length - 1)return null;diff = n + view[index].size - oldN;index++;}else {diff = n - oldN;}oldN += diff;newN += diff;}while(visualLineNo(cm.doc,newN) != newN) {if(index == (dir < 0?0:view.length - 1))return null;newN += dir * view[index - (dir < 0?1:0)].size;index += dir;}return {index:index,lineN:newN};} // Force the view to cover a given range, adding empty view element
// or clipping off existing ones as needed.
function adjustView(cm,from,to){var display=cm.display,view=display.view;if(view.length == 0 || from >= display.viewTo || to <= display.viewFrom){display.view = buildViewArray(cm,from,to);display.viewFrom = from;}else {if(display.viewFrom > from)display.view = buildViewArray(cm,from,display.viewFrom).concat(display.view);else if(display.viewFrom < from)display.view = display.view.slice(findViewIndex(cm,from));display.viewFrom = from;if(display.viewTo < to)display.view = display.view.concat(buildViewArray(cm,display.viewTo,to));else if(display.viewTo > to)display.view = display.view.slice(0,findViewIndex(cm,to));}display.viewTo = to;} // Count the number of lines in the view whose DOM representation is
// out of date (or nonexistent).
function countDirtyView(cm){var view=cm.display.view,dirty=0;for(var i=0;i < view.length;i++) {var lineView=view[i];if(!lineView.hidden && (!lineView.node || lineView.changes))++dirty;}return dirty;} // EVENT HANDLERS
// Attach the necessary event handlers when initializing the editor
function registerEventHandlers(cm){var d=cm.display;on(d.scroller,"mousedown",operation(cm,onMouseDown)); // Older IE's will not fire a second mousedown for a double click
if(ie && ie_version < 11)on(d.scroller,"dblclick",operation(cm,function(e){if(signalDOMEvent(cm,e))return;var pos=posFromMouse(cm,e);if(!pos || clickInGutter(cm,e) || eventInWidget(cm.display,e))return;e_preventDefault(e);var word=cm.findWordAt(pos);extendSelection(cm.doc,word.anchor,word.head);}));else on(d.scroller,"dblclick",function(e){signalDOMEvent(cm,e) || e_preventDefault(e);}); // Some browsers fire contextmenu *after* opening the menu, at
// which point we can't mess with it anymore. Context menu is
// handled in onMouseDown for these browsers.
if(!captureRightClick)on(d.scroller,"contextmenu",function(e){onContextMenu(cm,e);}); // Used to suppress mouse event handling when a touch happens
var touchFinished,prevTouch={end:0};function finishTouch(){if(d.activeTouch){touchFinished = setTimeout(function(){d.activeTouch = null;},1000);prevTouch = d.activeTouch;prevTouch.end = +new Date();}};function isMouseLikeTouchEvent(e){if(e.touches.length != 1)return false;var touch=e.touches[0];return touch.radiusX <= 1 && touch.radiusY <= 1;}function farAway(touch,other){if(other.left == null)return true;var dx=other.left - touch.left,dy=other.top - touch.top;return dx * dx + dy * dy > 20 * 20;}on(d.scroller,"touchstart",function(e){if(!isMouseLikeTouchEvent(e)){clearTimeout(touchFinished);var now=+new Date();d.activeTouch = {start:now,moved:false,prev:now - prevTouch.end <= 300?prevTouch:null};if(e.touches.length == 1){d.activeTouch.left = e.touches[0].pageX;d.activeTouch.top = e.touches[0].pageY;}}});on(d.scroller,"touchmove",function(){if(d.activeTouch)d.activeTouch.moved = true;});on(d.scroller,"touchend",function(e){var touch=d.activeTouch;if(touch && !eventInWidget(d,e) && touch.left != null && !touch.moved && new Date() - touch.start < 300){var pos=cm.coordsChar(d.activeTouch,"page"),range;if(!touch.prev || farAway(touch,touch.prev)) // Single tap
range = new Range(pos,pos);else if(!touch.prev.prev || farAway(touch,touch.prev.prev)) // Double tap
range = cm.findWordAt(pos);else  // Triple tap
range = new Range(Pos(pos.line,0),_clipPos(cm.doc,Pos(pos.line + 1,0)));cm.setSelection(range.anchor,range.head);cm.focus();e_preventDefault(e);}finishTouch();});on(d.scroller,"touchcancel",finishTouch); // Sync scrolling between fake scrollbars and real scrollable
// area, ensure viewport is updated when scrolling.
on(d.scroller,"scroll",function(){if(d.scroller.clientHeight){setScrollTop(cm,d.scroller.scrollTop);setScrollLeft(cm,d.scroller.scrollLeft,true);signal(cm,"scroll",cm);}}); // Listen to wheel events in order to try and update the viewport on time.
on(d.scroller,"mousewheel",function(e){onScrollWheel(cm,e);});on(d.scroller,"DOMMouseScroll",function(e){onScrollWheel(cm,e);}); // Prevent wrapper from ever scrolling
on(d.wrapper,"scroll",function(){d.wrapper.scrollTop = d.wrapper.scrollLeft = 0;});function drag_(e){if(!signalDOMEvent(cm,e))e_stop(e);}if(cm.options.dragDrop){on(d.scroller,"dragstart",function(e){onDragStart(cm,e);});on(d.scroller,"dragenter",drag_);on(d.scroller,"dragover",drag_);on(d.scroller,"drop",operation(cm,onDrop));}var inp=d.input.getField();on(inp,"keyup",function(e){onKeyUp.call(cm,e);});on(inp,"keydown",operation(cm,onKeyDown));on(inp,"keypress",operation(cm,onKeyPress));on(inp,"focus",bind(onFocus,cm));on(inp,"blur",bind(onBlur,cm));} // Called when the window resizes
function onResize(cm){var d=cm.display;if(d.lastWrapHeight == d.wrapper.clientHeight && d.lastWrapWidth == d.wrapper.clientWidth)return; // Might be a text scaling operation, clear size caches.
d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;d.scrollbarsClipped = false;cm.setSize();} // MOUSE EVENTS
// Return true when the given mouse event happened in a widget
function eventInWidget(display,e){for(var n=e_target(e);n != display.wrapper;n = n.parentNode) {if(!n || n.nodeType == 1 && n.getAttribute("cm-ignore-events") == "true" || n.parentNode == display.sizer && n != display.mover)return true;}} // Given a mouse event, find the corresponding position. If liberal
// is false, it checks whether a gutter or scrollbar was clicked,
// and returns null if it was. forRect is used by rectangular
// selections, and tries to estimate a character position even for
// coordinates beyond the right of the text.
function posFromMouse(cm,e,liberal,forRect){var display=cm.display;if(!liberal && e_target(e).getAttribute("cm-not-content") == "true")return null;var x,y,space=display.lineSpace.getBoundingClientRect(); // Fails unpredictably on IE[67] when mouse is dragged around quickly.
try{x = e.clientX - space.left;y = e.clientY - space.top;}catch(e) {return null;}var coords=_coordsChar(cm,x,y),line;if(forRect && coords.xRel == 1 && (line = getLine(cm.doc,coords.line).text).length == coords.ch){var colDiff=countColumn(line,line.length,cm.options.tabSize) - line.length;coords = Pos(coords.line,Math.max(0,Math.round((x - paddingH(cm.display).left) / charWidth(cm.display)) - colDiff));}return coords;} // A mouse down can be a single click, double click, triple click,
// start of selection drag, start of text drag, new cursor
// (ctrl-click), rectangle drag (alt-drag), or xwin
// middle-click-paste. Or it might be a click on something we should
// not interfere with, such as a scrollbar or widget.
function onMouseDown(e){var cm=this,display=cm.display;if(display.activeTouch && display.input.supportsTouch() || signalDOMEvent(cm,e))return;display.shift = e.shiftKey;if(eventInWidget(display,e)){if(!webkit){ // Briefly turn off draggability, to allow widgets to do
// normal dragging things.
display.scroller.draggable = false;setTimeout(function(){display.scroller.draggable = true;},100);}return;}if(clickInGutter(cm,e))return;var start=posFromMouse(cm,e);window.focus();switch(e_button(e)){case 1:if(start)leftButtonDown(cm,e,start);else if(e_target(e) == display.scroller)e_preventDefault(e);break;case 2:if(webkit)cm.state.lastMiddleDown = +new Date();if(start)extendSelection(cm.doc,start);setTimeout(function(){display.input.focus();},20);e_preventDefault(e);break;case 3:if(captureRightClick)onContextMenu(cm,e);else delayBlurEvent(cm);break;}}var lastClick,lastDoubleClick;function leftButtonDown(cm,e,start){if(ie)setTimeout(bind(ensureFocus,cm),0);else ensureFocus(cm);var now=+new Date(),type;if(lastDoubleClick && lastDoubleClick.time > now - 400 && cmp(lastDoubleClick.pos,start) == 0){type = "triple";}else if(lastClick && lastClick.time > now - 400 && cmp(lastClick.pos,start) == 0){type = "double";lastDoubleClick = {time:now,pos:start};}else {type = "single";lastClick = {time:now,pos:start};}var sel=cm.doc.sel,modifier=mac?e.metaKey:e.ctrlKey,contained;if(cm.options.dragDrop && dragAndDrop && !isReadOnly(cm) && type == "single" && (contained = sel.contains(start)) > -1 && !sel.ranges[contained].empty())leftButtonStartDrag(cm,e,start,modifier);else leftButtonSelect(cm,e,start,type,modifier);} // Start a text drag. When it ends, see if any dragging actually
// happen, and treat as a click if it didn't.
function leftButtonStartDrag(cm,e,start,modifier){var display=cm.display;var dragEnd=operation(cm,function(e2){if(webkit)display.scroller.draggable = false;cm.state.draggingText = false;off(document,"mouseup",dragEnd);off(display.scroller,"drop",dragEnd);if(Math.abs(e.clientX - e2.clientX) + Math.abs(e.clientY - e2.clientY) < 10){e_preventDefault(e2);if(!modifier)extendSelection(cm.doc,start); // Work around unexplainable focus problem in IE9 (#2127) and Chrome (#3081)
if(webkit || ie && ie_version == 9)setTimeout(function(){document.body.focus();display.input.focus();},20);else display.input.focus();}}); // Let the drag handler handle this.
if(webkit)display.scroller.draggable = true;cm.state.draggingText = dragEnd; // IE's approach to draggable
if(display.scroller.dragDrop)display.scroller.dragDrop();on(document,"mouseup",dragEnd);on(display.scroller,"drop",dragEnd);} // Normal selection, as opposed to text dragging.
function leftButtonSelect(cm,e,start,type,addNew){var display=cm.display,doc=cm.doc;e_preventDefault(e);var ourRange,ourIndex,startSel=doc.sel,ranges=startSel.ranges;if(addNew && !e.shiftKey){ourIndex = doc.sel.contains(start);if(ourIndex > -1)ourRange = ranges[ourIndex];else ourRange = new Range(start,start);}else {ourRange = doc.sel.primary();ourIndex = doc.sel.primIndex;}if(e.altKey){type = "rect";if(!addNew)ourRange = new Range(start,start);start = posFromMouse(cm,e,true,true);ourIndex = -1;}else if(type == "double"){var word=cm.findWordAt(start);if(cm.display.shift || doc.extend)ourRange = extendRange(doc,ourRange,word.anchor,word.head);else ourRange = word;}else if(type == "triple"){var line=new Range(Pos(start.line,0),_clipPos(doc,Pos(start.line + 1,0)));if(cm.display.shift || doc.extend)ourRange = extendRange(doc,ourRange,line.anchor,line.head);else ourRange = line;}else {ourRange = extendRange(doc,ourRange,start);}if(!addNew){ourIndex = 0;setSelection(doc,new Selection([ourRange],0),sel_mouse);startSel = doc.sel;}else if(ourIndex == -1){ourIndex = ranges.length;setSelection(doc,normalizeSelection(ranges.concat([ourRange]),ourIndex),{scroll:false,origin:"*mouse"});}else if(ranges.length > 1 && ranges[ourIndex].empty() && type == "single" && !e.shiftKey){setSelection(doc,normalizeSelection(ranges.slice(0,ourIndex).concat(ranges.slice(ourIndex + 1)),0));startSel = doc.sel;}else {replaceOneSelection(doc,ourIndex,ourRange,sel_mouse);}var lastPos=start;function extendTo(pos){if(cmp(lastPos,pos) == 0)return;lastPos = pos;if(type == "rect"){var ranges=[],tabSize=cm.options.tabSize;var startCol=countColumn(getLine(doc,start.line).text,start.ch,tabSize);var posCol=countColumn(getLine(doc,pos.line).text,pos.ch,tabSize);var left=Math.min(startCol,posCol),right=Math.max(startCol,posCol);for(var line=Math.min(start.line,pos.line),end=Math.min(cm.lastLine(),Math.max(start.line,pos.line));line <= end;line++) {var text=getLine(doc,line).text,leftPos=findColumn(text,left,tabSize);if(left == right)ranges.push(new Range(Pos(line,leftPos),Pos(line,leftPos)));else if(text.length > leftPos)ranges.push(new Range(Pos(line,leftPos),Pos(line,findColumn(text,right,tabSize))));}if(!ranges.length)ranges.push(new Range(start,start));setSelection(doc,normalizeSelection(startSel.ranges.slice(0,ourIndex).concat(ranges),ourIndex),{origin:"*mouse",scroll:false});cm.scrollIntoView(pos);}else {var oldRange=ourRange;var anchor=oldRange.anchor,head=pos;if(type != "single"){if(type == "double")var range=cm.findWordAt(pos);else var range=new Range(Pos(pos.line,0),_clipPos(doc,Pos(pos.line + 1,0)));if(cmp(range.anchor,anchor) > 0){head = range.head;anchor = minPos(oldRange.from(),range.anchor);}else {head = range.anchor;anchor = maxPos(oldRange.to(),range.head);}}var ranges=startSel.ranges.slice(0);ranges[ourIndex] = new Range(_clipPos(doc,anchor),head);setSelection(doc,normalizeSelection(ranges,ourIndex),sel_mouse);}}var editorSize=display.wrapper.getBoundingClientRect(); // Used to ensure timeout re-tries don't fire when another extend
// happened in the meantime (clearTimeout isn't reliable -- at
// least on Chrome, the timeouts still happen even when cleared,
// if the clear happens after their scheduled firing time).
var counter=0;function extend(e){var curCount=++counter;var cur=posFromMouse(cm,e,true,type == "rect");if(!cur)return;if(cmp(cur,lastPos) != 0){ensureFocus(cm);extendTo(cur);var visible=visibleLines(display,doc);if(cur.line >= visible.to || cur.line < visible.from)setTimeout(operation(cm,function(){if(counter == curCount)extend(e);}),150);}else {var outside=e.clientY < editorSize.top?-20:e.clientY > editorSize.bottom?20:0;if(outside)setTimeout(operation(cm,function(){if(counter != curCount)return;display.scroller.scrollTop += outside;extend(e);}),50);}}function done(e){counter = Infinity;e_preventDefault(e);display.input.focus();off(document,"mousemove",move);off(document,"mouseup",up);doc.history.lastSelOrigin = null;}var move=operation(cm,function(e){if(!e_button(e))done(e);else extend(e);});var up=operation(cm,done);on(document,"mousemove",move);on(document,"mouseup",up);} // Determines whether an event happened in the gutter, and fires the
// handlers for the corresponding event.
function gutterEvent(cm,e,type,prevent,signalfn){try{var mX=e.clientX,mY=e.clientY;}catch(e) {return false;}if(mX >= Math.floor(cm.display.gutters.getBoundingClientRect().right))return false;if(prevent)e_preventDefault(e);var display=cm.display;var lineBox=display.lineDiv.getBoundingClientRect();if(mY > lineBox.bottom || !hasHandler(cm,type))return e_defaultPrevented(e);mY -= lineBox.top - display.viewOffset;for(var i=0;i < cm.options.gutters.length;++i) {var g=display.gutters.childNodes[i];if(g && g.getBoundingClientRect().right >= mX){var line=_lineAtHeight(cm.doc,mY);var gutter=cm.options.gutters[i];signalfn(cm,type,cm,line,gutter,e);return e_defaultPrevented(e);}}}function clickInGutter(cm,e){return gutterEvent(cm,e,"gutterClick",true,signalLater);} // Kludge to work around strange IE behavior where it'll sometimes
// re-fire a series of drag-related events right after the drop (#1551)
var lastDrop=0;function onDrop(e){var cm=this;if(signalDOMEvent(cm,e) || eventInWidget(cm.display,e))return;e_preventDefault(e);if(ie)lastDrop = +new Date();var pos=posFromMouse(cm,e,true),files=e.dataTransfer.files;if(!pos || isReadOnly(cm))return; // Might be a file drop, in which case we simply extract the text
// and insert it.
if(files && files.length && window.FileReader && window.File){var n=files.length,text=Array(n),read=0;var loadFile=function loadFile(file,i){var reader=new FileReader();reader.onload = operation(cm,function(){text[i] = reader.result;if(++read == n){pos = _clipPos(cm.doc,pos);var change={from:pos,to:pos,text:splitLines(text.join("\n")),origin:"paste"};makeChange(cm.doc,change);setSelectionReplaceHistory(cm.doc,simpleSelection(pos,changeEnd(change)));}});reader.readAsText(file);};for(var i=0;i < n;++i) loadFile(files[i],i);}else { // Normal drop
// Don't do a replace if the drop happened inside of the selected text.
if(cm.state.draggingText && cm.doc.sel.contains(pos) > -1){cm.state.draggingText(e); // Ensure the editor is re-focused
setTimeout(function(){cm.display.input.focus();},20);return;}try{var text=e.dataTransfer.getData("Text");if(text){if(cm.state.draggingText && !(mac?e.metaKey:e.ctrlKey))var selected=cm.listSelections();setSelectionNoUndo(cm.doc,simpleSelection(pos,pos));if(selected)for(var i=0;i < selected.length;++i) _replaceRange(cm.doc,"",selected[i].anchor,selected[i].head,"drag");cm.replaceSelection(text,"around","paste");cm.display.input.focus();}}catch(e) {}}}function onDragStart(cm,e){if(ie && (!cm.state.draggingText || +new Date() - lastDrop < 100)){e_stop(e);return;}if(signalDOMEvent(cm,e) || eventInWidget(cm.display,e))return;e.dataTransfer.setData("Text",cm.getSelection()); // Use dummy image instead of default browsers image.
// Recent Safari (~6.0.2) have a tendency to segfault when this happens, so we don't do it there.
if(e.dataTransfer.setDragImage && !safari){var img=elt("img",null,null,"position: fixed; left: 0; top: 0;");img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";if(presto){img.width = img.height = 1;cm.display.wrapper.appendChild(img); // Force a relayout, or Opera won't use our image for some obscure reason
img._top = img.offsetTop;}e.dataTransfer.setDragImage(img,0,0);if(presto)img.parentNode.removeChild(img);}} // SCROLL EVENTS
// Sync the scrollable area and scrollbars, ensure the viewport
// covers the visible area.
function setScrollTop(cm,val){if(Math.abs(cm.doc.scrollTop - val) < 2)return;cm.doc.scrollTop = val;if(!gecko)updateDisplaySimple(cm,{top:val});if(cm.display.scroller.scrollTop != val)cm.display.scroller.scrollTop = val;cm.display.scrollbars.setScrollTop(val);if(gecko)updateDisplaySimple(cm);startWorker(cm,100);} // Sync scroller and scrollbar, ensure the gutter elements are
// aligned.
function setScrollLeft(cm,val,isScroller){if(isScroller?val == cm.doc.scrollLeft:Math.abs(cm.doc.scrollLeft - val) < 2)return;val = Math.min(val,cm.display.scroller.scrollWidth - cm.display.scroller.clientWidth);cm.doc.scrollLeft = val;alignHorizontally(cm);if(cm.display.scroller.scrollLeft != val)cm.display.scroller.scrollLeft = val;cm.display.scrollbars.setScrollLeft(val);} // Since the delta values reported on mouse wheel events are
// unstandardized between browsers and even browser versions, and
// generally horribly unpredictable, this code starts by measuring
// the scroll effect that the first few mouse wheel events have,
// and, from that, detects the way it can convert deltas to pixel
// offsets afterwards.
//
// The reason we want to know the amount a wheel event will scroll
// is that it gives us a chance to update the display before the
// actual scrolling happens, reducing flickering.
var wheelSamples=0,wheelPixelsPerUnit=null; // Fill in a browser-detected starting value on browsers where we
// know one. These don't have to be accurate -- the result of them
// being wrong would just be a slight flicker on the first wheel
// scroll (if it is large enough).
if(ie)wheelPixelsPerUnit = -.53;else if(gecko)wheelPixelsPerUnit = 15;else if(chrome)wheelPixelsPerUnit = -.7;else if(safari)wheelPixelsPerUnit = -1 / 3;var wheelEventDelta=function wheelEventDelta(e){var dx=e.wheelDeltaX,dy=e.wheelDeltaY;if(dx == null && e.detail && e.axis == e.HORIZONTAL_AXIS)dx = e.detail;if(dy == null && e.detail && e.axis == e.VERTICAL_AXIS)dy = e.detail;else if(dy == null)dy = e.wheelDelta;return {x:dx,y:dy};};CodeMirror.wheelEventPixels = function(e){var delta=wheelEventDelta(e);delta.x *= wheelPixelsPerUnit;delta.y *= wheelPixelsPerUnit;return delta;};function onScrollWheel(cm,e){var delta=wheelEventDelta(e),dx=delta.x,dy=delta.y;var display=cm.display,scroll=display.scroller; // Quit if there's nothing to scroll here
if(!(dx && scroll.scrollWidth > scroll.clientWidth || dy && scroll.scrollHeight > scroll.clientHeight))return; // Webkit browsers on OS X abort momentum scrolls when the target
// of the scroll event is removed from the scrollable element.
// This hack (see related code in patchDisplay) makes sure the
// element is kept around.
if(dy && mac && webkit){outer: for(var cur=e.target,view=display.view;cur != scroll;cur = cur.parentNode) {for(var i=0;i < view.length;i++) {if(view[i].node == cur){cm.display.currentWheelTarget = cur;break outer;}}}} // On some browsers, horizontal scrolling will cause redraws to
// happen before the gutter has been realigned, causing it to
// wriggle around in a most unseemly way. When we have an
// estimated pixels/delta value, we just handle horizontal
// scrolling entirely here. It'll be slightly off from native, but
// better than glitching out.
if(dx && !gecko && !presto && wheelPixelsPerUnit != null){if(dy)setScrollTop(cm,Math.max(0,Math.min(scroll.scrollTop + dy * wheelPixelsPerUnit,scroll.scrollHeight - scroll.clientHeight)));setScrollLeft(cm,Math.max(0,Math.min(scroll.scrollLeft + dx * wheelPixelsPerUnit,scroll.scrollWidth - scroll.clientWidth)));e_preventDefault(e);display.wheelStartX = null; // Abort measurement, if in progress
return;} // 'Project' the visible viewport to cover the area that is being
// scrolled into view (if we know enough to estimate it).
if(dy && wheelPixelsPerUnit != null){var pixels=dy * wheelPixelsPerUnit;var top=cm.doc.scrollTop,bot=top + display.wrapper.clientHeight;if(pixels < 0)top = Math.max(0,top + pixels - 50);else bot = Math.min(cm.doc.height,bot + pixels + 50);updateDisplaySimple(cm,{top:top,bottom:bot});}if(wheelSamples < 20){if(display.wheelStartX == null){display.wheelStartX = scroll.scrollLeft;display.wheelStartY = scroll.scrollTop;display.wheelDX = dx;display.wheelDY = dy;setTimeout(function(){if(display.wheelStartX == null)return;var movedX=scroll.scrollLeft - display.wheelStartX;var movedY=scroll.scrollTop - display.wheelStartY;var sample=movedY && display.wheelDY && movedY / display.wheelDY || movedX && display.wheelDX && movedX / display.wheelDX;display.wheelStartX = display.wheelStartY = null;if(!sample)return;wheelPixelsPerUnit = (wheelPixelsPerUnit * wheelSamples + sample) / (wheelSamples + 1);++wheelSamples;},200);}else {display.wheelDX += dx;display.wheelDY += dy;}}} // KEY EVENTS
// Run a handler that was bound to a key.
function doHandleBinding(cm,bound,dropShift){if(typeof bound == "string"){bound = commands[bound];if(!bound)return false;} // Ensure previous input has been read, so that the handler sees a
// consistent view of the document
cm.display.input.ensurePolled();var prevShift=cm.display.shift,done=false;try{if(isReadOnly(cm))cm.state.suppressEdits = true;if(dropShift)cm.display.shift = false;done = bound(cm) != Pass;}finally {cm.display.shift = prevShift;cm.state.suppressEdits = false;}return done;}function lookupKeyForEditor(cm,name,handle){for(var i=0;i < cm.state.keyMaps.length;i++) {var result=lookupKey(name,cm.state.keyMaps[i],handle,cm);if(result)return result;}return cm.options.extraKeys && lookupKey(name,cm.options.extraKeys,handle,cm) || lookupKey(name,cm.options.keyMap,handle,cm);}var stopSeq=new Delayed();function dispatchKey(cm,name,e,handle){var seq=cm.state.keySeq;if(seq){if(isModifierKey(name))return "handled";stopSeq.set(50,function(){if(cm.state.keySeq == seq){cm.state.keySeq = null;cm.display.input.reset();}});name = seq + " " + name;}var result=lookupKeyForEditor(cm,name,handle);if(result == "multi")cm.state.keySeq = name;if(result == "handled")signalLater(cm,"keyHandled",cm,name,e);if(result == "handled" || result == "multi"){e_preventDefault(e);restartBlink(cm);}if(seq && !result && /\'$/.test(name)){e_preventDefault(e);return true;}return !!result;} // Handle a key from the keydown event.
function handleKeyBinding(cm,e){var name=keyName(e,true);if(!name)return false;if(e.shiftKey && !cm.state.keySeq){ // First try to resolve full name (including 'Shift-'). Failing
// that, see if there is a cursor-motion command (starting with
// 'go') bound to the keyname without 'Shift-'.
return dispatchKey(cm,"Shift-" + name,e,function(b){return doHandleBinding(cm,b,true);}) || dispatchKey(cm,name,e,function(b){if(typeof b == "string"?/^go[A-Z]/.test(b):b.motion)return doHandleBinding(cm,b);});}else {return dispatchKey(cm,name,e,function(b){return doHandleBinding(cm,b);});}} // Handle a key from the keypress event
function handleCharBinding(cm,e,ch){return dispatchKey(cm,"'" + ch + "'",e,function(b){return doHandleBinding(cm,b,true);});}var lastStoppedKey=null;function onKeyDown(e){var cm=this;ensureFocus(cm);if(signalDOMEvent(cm,e))return; // IE does strange things with escape.
if(ie && ie_version < 11 && e.keyCode == 27)e.returnValue = false;var code=e.keyCode;cm.display.shift = code == 16 || e.shiftKey;var handled=handleKeyBinding(cm,e);if(presto){lastStoppedKey = handled?code:null; // Opera has no cut event... we try to at least catch the key combo
if(!handled && code == 88 && !hasCopyEvent && (mac?e.metaKey:e.ctrlKey))cm.replaceSelection("",null,"cut");} // Turn mouse into crosshair when Alt is held on Mac.
if(code == 18 && !/\bCodeMirror-crosshair\b/.test(cm.display.lineDiv.className))showCrossHair(cm);}function showCrossHair(cm){var lineDiv=cm.display.lineDiv;addClass(lineDiv,"CodeMirror-crosshair");function up(e){if(e.keyCode == 18 || !e.altKey){rmClass(lineDiv,"CodeMirror-crosshair");off(document,"keyup",up);off(document,"mouseover",up);}}on(document,"keyup",up);on(document,"mouseover",up);}function onKeyUp(e){if(e.keyCode == 16)this.doc.sel.shift = false;signalDOMEvent(this,e);}function onKeyPress(e){var cm=this;if(eventInWidget(cm.display,e) || signalDOMEvent(cm,e) || e.ctrlKey && !e.altKey || mac && e.metaKey)return;var keyCode=e.keyCode,charCode=e.charCode;if(presto && keyCode == lastStoppedKey){lastStoppedKey = null;e_preventDefault(e);return;}if(presto && (!e.which || e.which < 10) && handleKeyBinding(cm,e))return;var ch=String.fromCharCode(charCode == null?keyCode:charCode);if(handleCharBinding(cm,e,ch))return;cm.display.input.onKeyPress(e);} // FOCUS/BLUR EVENTS
function delayBlurEvent(cm){cm.state.delayingBlurEvent = true;setTimeout(function(){if(cm.state.delayingBlurEvent){cm.state.delayingBlurEvent = false;onBlur(cm);}},100);}function onFocus(cm){if(cm.state.delayingBlurEvent)cm.state.delayingBlurEvent = false;if(cm.options.readOnly == "nocursor")return;if(!cm.state.focused){signal(cm,"focus",cm);cm.state.focused = true;addClass(cm.display.wrapper,"CodeMirror-focused"); // This test prevents this from firing when a context
// menu is closed (since the input reset would kill the
// select-all detection hack)
if(!cm.curOp && cm.display.selForContextMenu != cm.doc.sel){cm.display.input.reset();if(webkit)setTimeout(function(){cm.display.input.reset(true);},20); // Issue #1730
}cm.display.input.receivedFocus();}restartBlink(cm);}function onBlur(cm){if(cm.state.delayingBlurEvent)return;if(cm.state.focused){signal(cm,"blur",cm);cm.state.focused = false;rmClass(cm.display.wrapper,"CodeMirror-focused");}clearInterval(cm.display.blinker);setTimeout(function(){if(!cm.state.focused)cm.display.shift = false;},150);} // CONTEXT MENU HANDLING
// To make the context menu work, we need to briefly unhide the
// textarea (making it as unobtrusive as possible) to let the
// right-click take effect on it.
function onContextMenu(cm,e){if(eventInWidget(cm.display,e) || contextMenuInGutter(cm,e))return;cm.display.input.onContextMenu(e);}function contextMenuInGutter(cm,e){if(!hasHandler(cm,"gutterContextMenu"))return false;return gutterEvent(cm,e,"gutterContextMenu",false,signal);} // UPDATING
// Compute the position of the end of a change (its 'to' property
// refers to the pre-change end).
var changeEnd=CodeMirror.changeEnd = function(change){if(!change.text)return change.to;return Pos(change.from.line + change.text.length - 1,lst(change.text).length + (change.text.length == 1?change.from.ch:0));}; // Adjust a position to refer to the post-change position of the
// same text, or the end of the change if the change covers it.
function adjustForChange(pos,change){if(cmp(pos,change.from) < 0)return pos;if(cmp(pos,change.to) <= 0)return changeEnd(change);var line=pos.line + change.text.length - (change.to.line - change.from.line) - 1,ch=pos.ch;if(pos.line == change.to.line)ch += changeEnd(change).ch - change.to.ch;return Pos(line,ch);}function computeSelAfterChange(doc,change){var out=[];for(var i=0;i < doc.sel.ranges.length;i++) {var range=doc.sel.ranges[i];out.push(new Range(adjustForChange(range.anchor,change),adjustForChange(range.head,change)));}return normalizeSelection(out,doc.sel.primIndex);}function offsetPos(pos,old,nw){if(pos.line == old.line)return Pos(nw.line,pos.ch - old.ch + nw.ch);else return Pos(nw.line + (pos.line - old.line),pos.ch);} // Used by replaceSelections to allow moving the selection to the
// start or around the replaced test. Hint may be "start" or "around".
function computeReplacedSel(doc,changes,hint){var out=[];var oldPrev=Pos(doc.first,0),newPrev=oldPrev;for(var i=0;i < changes.length;i++) {var change=changes[i];var from=offsetPos(change.from,oldPrev,newPrev);var to=offsetPos(changeEnd(change),oldPrev,newPrev);oldPrev = change.to;newPrev = to;if(hint == "around"){var range=doc.sel.ranges[i],inv=cmp(range.head,range.anchor) < 0;out[i] = new Range(inv?to:from,inv?from:to);}else {out[i] = new Range(from,from);}}return new Selection(out,doc.sel.primIndex);} // Allow "beforeChange" event handlers to influence a change
function filterChange(doc,change,update){var obj={canceled:false,from:change.from,to:change.to,text:change.text,origin:change.origin,cancel:function cancel(){this.canceled = true;}};if(update)obj.update = function(from,to,text,origin){if(from)this.from = _clipPos(doc,from);if(to)this.to = _clipPos(doc,to);if(text)this.text = text;if(origin !== undefined)this.origin = origin;};signal(doc,"beforeChange",doc,obj);if(doc.cm)signal(doc.cm,"beforeChange",doc.cm,obj);if(obj.canceled)return null;return {from:obj.from,to:obj.to,text:obj.text,origin:obj.origin};} // Apply a change to a document, and add it to the document's
// history, and propagating it to all linked documents.
function makeChange(doc,change,ignoreReadOnly){if(doc.cm){if(!doc.cm.curOp)return operation(doc.cm,makeChange)(doc,change,ignoreReadOnly);if(doc.cm.state.suppressEdits)return;}if(hasHandler(doc,"beforeChange") || doc.cm && hasHandler(doc.cm,"beforeChange")){change = filterChange(doc,change,true);if(!change)return;} // Possibly split or suppress the update based on the presence
// of read-only spans in its range.
var split=sawReadOnlySpans && !ignoreReadOnly && removeReadOnlyRanges(doc,change.from,change.to);if(split){for(var i=split.length - 1;i >= 0;--i) makeChangeInner(doc,{from:split[i].from,to:split[i].to,text:i?[""]:change.text});}else {makeChangeInner(doc,change);}}function makeChangeInner(doc,change){if(change.text.length == 1 && change.text[0] == "" && cmp(change.from,change.to) == 0)return;var selAfter=computeSelAfterChange(doc,change);addChangeToHistory(doc,change,selAfter,doc.cm?doc.cm.curOp.id:NaN);makeChangeSingleDoc(doc,change,selAfter,stretchSpansOverChange(doc,change));var rebased=[];linkedDocs(doc,function(doc,sharedHist){if(!sharedHist && indexOf(rebased,doc.history) == -1){rebaseHist(doc.history,change);rebased.push(doc.history);}makeChangeSingleDoc(doc,change,null,stretchSpansOverChange(doc,change));});} // Revert a change stored in a document's history.
function makeChangeFromHistory(doc,type,allowSelectionOnly){if(doc.cm && doc.cm.state.suppressEdits)return;var hist=doc.history,event,selAfter=doc.sel;var source=type == "undo"?hist.done:hist.undone,dest=type == "undo"?hist.undone:hist.done; // Verify that there is a useable event (so that ctrl-z won't
// needlessly clear selection events)
for(var i=0;i < source.length;i++) {event = source[i];if(allowSelectionOnly?event.ranges && !event.equals(doc.sel):!event.ranges)break;}if(i == source.length)return;hist.lastOrigin = hist.lastSelOrigin = null;for(;;) {event = source.pop();if(event.ranges){pushSelectionToHistory(event,dest);if(allowSelectionOnly && !event.equals(doc.sel)){setSelection(doc,event,{clearRedo:false});return;}selAfter = event;}else break;} // Build up a reverse change object to add to the opposite history
// stack (redo when undoing, and vice versa).
var antiChanges=[];pushSelectionToHistory(selAfter,dest);dest.push({changes:antiChanges,generation:hist.generation});hist.generation = event.generation || ++hist.maxGeneration;var filter=hasHandler(doc,"beforeChange") || doc.cm && hasHandler(doc.cm,"beforeChange");for(var i=event.changes.length - 1;i >= 0;--i) {var change=event.changes[i];change.origin = type;if(filter && !filterChange(doc,change,false)){source.length = 0;return;}antiChanges.push(historyChangeFromChange(doc,change));var after=i?computeSelAfterChange(doc,change):lst(source);makeChangeSingleDoc(doc,change,after,mergeOldSpans(doc,change));if(!i && doc.cm)doc.cm.scrollIntoView({from:change.from,to:changeEnd(change)});var rebased=[]; // Propagate to the linked documents
linkedDocs(doc,function(doc,sharedHist){if(!sharedHist && indexOf(rebased,doc.history) == -1){rebaseHist(doc.history,change);rebased.push(doc.history);}makeChangeSingleDoc(doc,change,null,mergeOldSpans(doc,change));});}} // Sub-views need their line numbers shifted when text is added
// above or below them in the parent document.
function shiftDoc(doc,distance){if(distance == 0)return;doc.first += distance;doc.sel = new Selection(map(doc.sel.ranges,function(range){return new Range(Pos(range.anchor.line + distance,range.anchor.ch),Pos(range.head.line + distance,range.head.ch));}),doc.sel.primIndex);if(doc.cm){regChange(doc.cm,doc.first,doc.first - distance,distance);for(var d=doc.cm.display,l=d.viewFrom;l < d.viewTo;l++) regLineChange(doc.cm,l,"gutter");}} // More lower-level change function, handling only a single document
// (not linked ones).
function makeChangeSingleDoc(doc,change,selAfter,spans){if(doc.cm && !doc.cm.curOp)return operation(doc.cm,makeChangeSingleDoc)(doc,change,selAfter,spans);if(change.to.line < doc.first){shiftDoc(doc,change.text.length - 1 - (change.to.line - change.from.line));return;}if(change.from.line > doc.lastLine())return; // Clip the change to the size of this doc
if(change.from.line < doc.first){var shift=change.text.length - 1 - (doc.first - change.from.line);shiftDoc(doc,shift);change = {from:Pos(doc.first,0),to:Pos(change.to.line + shift,change.to.ch),text:[lst(change.text)],origin:change.origin};}var last=doc.lastLine();if(change.to.line > last){change = {from:change.from,to:Pos(last,getLine(doc,last).text.length),text:[change.text[0]],origin:change.origin};}change.removed = getBetween(doc,change.from,change.to);if(!selAfter)selAfter = computeSelAfterChange(doc,change);if(doc.cm)makeChangeSingleDocInEditor(doc.cm,change,spans);else updateDoc(doc,change,spans);setSelectionNoUndo(doc,selAfter,sel_dontScroll);} // Handle the interaction of a change to a document with the editor
// that this document is part of.
function makeChangeSingleDocInEditor(cm,change,spans){var doc=cm.doc,display=cm.display,from=change.from,to=change.to;var recomputeMaxLength=false,checkWidthStart=from.line;if(!cm.options.lineWrapping){checkWidthStart = lineNo(visualLine(getLine(doc,from.line)));doc.iter(checkWidthStart,to.line + 1,function(line){if(line == display.maxLine){recomputeMaxLength = true;return true;}});}if(doc.sel.contains(change.from,change.to) > -1)signalCursorActivity(cm);updateDoc(doc,change,spans,estimateHeight(cm));if(!cm.options.lineWrapping){doc.iter(checkWidthStart,from.line + change.text.length,function(line){var len=lineLength(line);if(len > display.maxLineLength){display.maxLine = line;display.maxLineLength = len;display.maxLineChanged = true;recomputeMaxLength = false;}});if(recomputeMaxLength)cm.curOp.updateMaxLine = true;} // Adjust frontier, schedule worker
doc.frontier = Math.min(doc.frontier,from.line);startWorker(cm,400);var lendiff=change.text.length - (to.line - from.line) - 1; // Remember that these lines changed, for updating the display
if(change.full)regChange(cm);else if(from.line == to.line && change.text.length == 1 && !isWholeLineUpdate(cm.doc,change))regLineChange(cm,from.line,"text");else regChange(cm,from.line,to.line + 1,lendiff);var changesHandler=hasHandler(cm,"changes"),changeHandler=hasHandler(cm,"change");if(changeHandler || changesHandler){var obj={from:from,to:to,text:change.text,removed:change.removed,origin:change.origin};if(changeHandler)signalLater(cm,"change",cm,obj);if(changesHandler)(cm.curOp.changeObjs || (cm.curOp.changeObjs = [])).push(obj);}cm.display.selForContextMenu = null;}function _replaceRange(doc,code,from,to,origin){if(!to)to = from;if(cmp(to,from) < 0){var tmp=to;to = from;from = tmp;}if(typeof code == "string")code = splitLines(code);makeChange(doc,{from:from,to:to,text:code,origin:origin});} // SCROLLING THINGS INTO VIEW
// If an editor sits on the top or bottom of the window, partially
// scrolled out of view, this ensures that the cursor is visible.
function maybeScrollWindow(cm,coords){if(signalDOMEvent(cm,"scrollCursorIntoView"))return;var display=cm.display,box=display.sizer.getBoundingClientRect(),doScroll=null;if(coords.top + box.top < 0)doScroll = true;else if(coords.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight))doScroll = false;if(doScroll != null && !phantom){var scrollNode=elt("div","​",null,"position: absolute; top: " + (coords.top - display.viewOffset - paddingTop(cm.display)) + "px; height: " + (coords.bottom - coords.top + scrollGap(cm) + display.barHeight) + "px; left: " + coords.left + "px; width: 2px;");cm.display.lineSpace.appendChild(scrollNode);scrollNode.scrollIntoView(doScroll);cm.display.lineSpace.removeChild(scrollNode);}} // Scroll a given position into view (immediately), verifying that
// it actually became visible (as line heights are accurately
// measured, the position of something may 'drift' during drawing).
function scrollPosIntoView(cm,pos,end,margin){if(margin == null)margin = 0;for(var limit=0;limit < 5;limit++) {var changed=false,coords=_cursorCoords(cm,pos);var endCoords=!end || end == pos?coords:_cursorCoords(cm,end);var scrollPos=calculateScrollPos(cm,Math.min(coords.left,endCoords.left),Math.min(coords.top,endCoords.top) - margin,Math.max(coords.left,endCoords.left),Math.max(coords.bottom,endCoords.bottom) + margin);var startTop=cm.doc.scrollTop,startLeft=cm.doc.scrollLeft;if(scrollPos.scrollTop != null){setScrollTop(cm,scrollPos.scrollTop);if(Math.abs(cm.doc.scrollTop - startTop) > 1)changed = true;}if(scrollPos.scrollLeft != null){setScrollLeft(cm,scrollPos.scrollLeft);if(Math.abs(cm.doc.scrollLeft - startLeft) > 1)changed = true;}if(!changed)break;}return coords;} // Scroll a given set of coordinates into view (immediately).
function scrollIntoView(cm,x1,y1,x2,y2){var scrollPos=calculateScrollPos(cm,x1,y1,x2,y2);if(scrollPos.scrollTop != null)setScrollTop(cm,scrollPos.scrollTop);if(scrollPos.scrollLeft != null)setScrollLeft(cm,scrollPos.scrollLeft);} // Calculate a new scroll position needed to scroll the given
// rectangle into view. Returns an object with scrollTop and
// scrollLeft properties. When these are undefined, the
// vertical/horizontal position does not need to be adjusted.
function calculateScrollPos(cm,x1,y1,x2,y2){var display=cm.display,snapMargin=textHeight(cm.display);if(y1 < 0)y1 = 0;var screentop=cm.curOp && cm.curOp.scrollTop != null?cm.curOp.scrollTop:display.scroller.scrollTop;var screen=displayHeight(cm),result={};if(y2 - y1 > screen)y2 = y1 + screen;var docBottom=cm.doc.height + paddingVert(display);var atTop=y1 < snapMargin,atBottom=y2 > docBottom - snapMargin;if(y1 < screentop){result.scrollTop = atTop?0:y1;}else if(y2 > screentop + screen){var newTop=Math.min(y1,(atBottom?docBottom:y2) - screen);if(newTop != screentop)result.scrollTop = newTop;}var screenleft=cm.curOp && cm.curOp.scrollLeft != null?cm.curOp.scrollLeft:display.scroller.scrollLeft;var screenw=displayWidth(cm) - (cm.options.fixedGutter?display.gutters.offsetWidth:0);var tooWide=x2 - x1 > screenw;if(tooWide)x2 = x1 + screenw;if(x1 < 10)result.scrollLeft = 0;else if(x1 < screenleft)result.scrollLeft = Math.max(0,x1 - (tooWide?0:10));else if(x2 > screenw + screenleft - 3)result.scrollLeft = x2 + (tooWide?0:10) - screenw;return result;} // Store a relative adjustment to the scroll position in the current
// operation (to be applied when the operation finishes).
function addToScrollPos(cm,left,top){if(left != null || top != null)resolveScrollToPos(cm);if(left != null)cm.curOp.scrollLeft = (cm.curOp.scrollLeft == null?cm.doc.scrollLeft:cm.curOp.scrollLeft) + left;if(top != null)cm.curOp.scrollTop = (cm.curOp.scrollTop == null?cm.doc.scrollTop:cm.curOp.scrollTop) + top;} // Make sure that at the end of the operation the current cursor is
// shown.
function ensureCursorVisible(cm){resolveScrollToPos(cm);var cur=cm.getCursor(),from=cur,to=cur;if(!cm.options.lineWrapping){from = cur.ch?Pos(cur.line,cur.ch - 1):cur;to = Pos(cur.line,cur.ch + 1);}cm.curOp.scrollToPos = {from:from,to:to,margin:cm.options.cursorScrollMargin,isCursor:true};} // When an operation has its scrollToPos property set, and another
// scroll action is applied before the end of the operation, this
// 'simulates' scrolling that position into view in a cheap way, so
// that the effect of intermediate scroll commands is not ignored.
function resolveScrollToPos(cm){var range=cm.curOp.scrollToPos;if(range){cm.curOp.scrollToPos = null;var from=estimateCoords(cm,range.from),to=estimateCoords(cm,range.to);var sPos=calculateScrollPos(cm,Math.min(from.left,to.left),Math.min(from.top,to.top) - range.margin,Math.max(from.right,to.right),Math.max(from.bottom,to.bottom) + range.margin);cm.scrollTo(sPos.scrollLeft,sPos.scrollTop);}} // API UTILITIES
// Indent the given line. The how parameter can be "smart",
// "add"/null, "subtract", or "prev". When aggressive is false
// (typically set to true for forced single-line indents), empty
// lines are not indented, and places where the mode returns Pass
// are left alone.
function indentLine(cm,n,how,aggressive){var doc=cm.doc,state;if(how == null)how = "add";if(how == "smart"){ // Fall back to "prev" when the mode doesn't have an indentation
// method.
if(!doc.mode.indent)how = "prev";else state = getStateBefore(cm,n);}var tabSize=cm.options.tabSize;var line=getLine(doc,n),curSpace=countColumn(line.text,null,tabSize);if(line.stateAfter)line.stateAfter = null;var curSpaceString=line.text.match(/^\s*/)[0],indentation;if(!aggressive && !/\S/.test(line.text)){indentation = 0;how = "not";}else if(how == "smart"){indentation = doc.mode.indent(state,line.text.slice(curSpaceString.length),line.text);if(indentation == Pass || indentation > 150){if(!aggressive)return;how = "prev";}}if(how == "prev"){if(n > doc.first)indentation = countColumn(getLine(doc,n - 1).text,null,tabSize);else indentation = 0;}else if(how == "add"){indentation = curSpace + cm.options.indentUnit;}else if(how == "subtract"){indentation = curSpace - cm.options.indentUnit;}else if(typeof how == "number"){indentation = curSpace + how;}indentation = Math.max(0,indentation);var indentString="",pos=0;if(cm.options.indentWithTabs)for(var i=Math.floor(indentation / tabSize);i;--i) {pos += tabSize;indentString += "\t";}if(pos < indentation)indentString += spaceStr(indentation - pos);if(indentString != curSpaceString){_replaceRange(doc,indentString,Pos(n,0),Pos(n,curSpaceString.length),"+input");}else { // Ensure that, if the cursor was in the whitespace at the start
// of the line, it is moved to the end of that space.
for(var i=0;i < doc.sel.ranges.length;i++) {var range=doc.sel.ranges[i];if(range.head.line == n && range.head.ch < curSpaceString.length){var pos=Pos(n,curSpaceString.length);replaceOneSelection(doc,i,new Range(pos,pos));break;}}}line.stateAfter = null;} // Utility for applying a change to a line by handle or number,
// returning the number and optionally registering the line as
// changed.
function changeLine(doc,handle,changeType,op){var no=handle,line=handle;if(typeof handle == "number")line = getLine(doc,clipLine(doc,handle));else no = lineNo(handle);if(no == null)return null;if(op(line,no) && doc.cm)regLineChange(doc.cm,no,changeType);return line;} // Helper for deleting text near the selection(s), used to implement
// backspace, delete, and similar functionality.
function deleteNearSelection(cm,compute){var ranges=cm.doc.sel.ranges,kill=[]; // Build up a set of ranges to kill first, merging overlapping
// ranges.
for(var i=0;i < ranges.length;i++) {var toKill=compute(ranges[i]);while(kill.length && cmp(toKill.from,lst(kill).to) <= 0) {var replaced=kill.pop();if(cmp(replaced.from,toKill.from) < 0){toKill.from = replaced.from;break;}}kill.push(toKill);} // Next, remove those actual ranges.
runInOp(cm,function(){for(var i=kill.length - 1;i >= 0;i--) _replaceRange(cm.doc,"",kill[i].from,kill[i].to,"+delete");ensureCursorVisible(cm);});} // Used for horizontal relative motion. Dir is -1 or 1 (left or
// right), unit can be "char", "column" (like char, but doesn't
// cross line boundaries), "word" (across next word), or "group" (to
// the start of next group of word or non-word-non-whitespace
// chars). The visually param controls whether, in right-to-left
// text, direction 1 means to move towards the next index in the
// string, or towards the character to the right of the current
// position. The resulting position will have a hitSide=true
// property if it reached the end of the document.
function _findPosH(doc,pos,dir,unit,visually){var line=pos.line,ch=pos.ch,origDir=dir;var lineObj=getLine(doc,line);var possible=true;function findNextLine(){var l=line + dir;if(l < doc.first || l >= doc.first + doc.size)return possible = false;line = l;return lineObj = getLine(doc,l);}function moveOnce(boundToLine){var next=(visually?moveVisually:moveLogically)(lineObj,ch,dir,true);if(next == null){if(!boundToLine && findNextLine()){if(visually)ch = (dir < 0?lineRight:lineLeft)(lineObj);else ch = dir < 0?lineObj.text.length:0;}else return possible = false;}else ch = next;return true;}if(unit == "char")moveOnce();else if(unit == "column")moveOnce(true);else if(unit == "word" || unit == "group"){var sawType=null,group=unit == "group";var helper=doc.cm && doc.cm.getHelper(pos,"wordChars");for(var first=true;;first = false) {if(dir < 0 && !moveOnce(!first))break;var cur=lineObj.text.charAt(ch) || "\n";var type=isWordChar(cur,helper)?"w":group && cur == "\n"?"n":!group || /\s/.test(cur)?null:"p";if(group && !first && !type)type = "s";if(sawType && sawType != type){if(dir < 0){dir = 1;moveOnce();}break;}if(type)sawType = type;if(dir > 0 && !moveOnce(!first))break;}}var result=skipAtomic(doc,Pos(line,ch),origDir,true);if(!possible)result.hitSide = true;return result;} // For relative vertical movement. Dir may be -1 or 1. Unit can be
// "page" or "line". The resulting position will have a hitSide=true
// property if it reached the end of the document.
function _findPosV(cm,pos,dir,unit){var doc=cm.doc,x=pos.left,y;if(unit == "page"){var pageSize=Math.min(cm.display.wrapper.clientHeight,window.innerHeight || document.documentElement.clientHeight);y = pos.top + dir * (pageSize - (dir < 0?1.5:.5) * textHeight(cm.display));}else if(unit == "line"){y = dir > 0?pos.bottom + 3:pos.top - 3;}for(;;) {var target=_coordsChar(cm,x,y);if(!target.outside)break;if(dir < 0?y <= 0:y >= doc.height){target.hitSide = true;break;}y += dir * 5;}return target;} // EDITOR METHODS
// The publicly visible API. Note that methodOp(f) means
// 'wrap f in an operation, performed on its `this` parameter'.
// This is not the complete set of editor methods. Most of the
// methods defined on the Doc type are also injected into
// CodeMirror.prototype, for backwards compatibility and
// convenience.
CodeMirror.prototype = {constructor:CodeMirror,focus:function focus(){window.focus();this.display.input.focus();},setOption:function setOption(option,value){var options=this.options,old=options[option];if(options[option] == value && option != "mode")return;options[option] = value;if(optionHandlers.hasOwnProperty(option))operation(this,optionHandlers[option])(this,value,old);},getOption:function getOption(option){return this.options[option];},getDoc:function getDoc(){return this.doc;},addKeyMap:function addKeyMap(map,bottom){this.state.keyMaps[bottom?"push":"unshift"](getKeyMap(map));},removeKeyMap:function removeKeyMap(map){var maps=this.state.keyMaps;for(var i=0;i < maps.length;++i) if(maps[i] == map || maps[i].name == map){maps.splice(i,1);return true;}},addOverlay:methodOp(function(spec,options){var mode=spec.token?spec:CodeMirror.getMode(this.options,spec);if(mode.startState)throw new Error("Overlays may not be stateful.");this.state.overlays.push({mode:mode,modeSpec:spec,opaque:options && options.opaque});this.state.modeGen++;regChange(this);}),removeOverlay:methodOp(function(spec){var overlays=this.state.overlays;for(var i=0;i < overlays.length;++i) {var cur=overlays[i].modeSpec;if(cur == spec || typeof spec == "string" && cur.name == spec){overlays.splice(i,1);this.state.modeGen++;regChange(this);return;}}}),indentLine:methodOp(function(n,dir,aggressive){if(typeof dir != "string" && typeof dir != "number"){if(dir == null)dir = this.options.smartIndent?"smart":"prev";else dir = dir?"add":"subtract";}if(isLine(this.doc,n))indentLine(this,n,dir,aggressive);}),indentSelection:methodOp(function(how){var ranges=this.doc.sel.ranges,end=-1;for(var i=0;i < ranges.length;i++) {var range=ranges[i];if(!range.empty()){var from=range.from(),to=range.to();var start=Math.max(end,from.line);end = Math.min(this.lastLine(),to.line - (to.ch?0:1)) + 1;for(var j=start;j < end;++j) indentLine(this,j,how);var newRanges=this.doc.sel.ranges;if(from.ch == 0 && ranges.length == newRanges.length && newRanges[i].from().ch > 0)replaceOneSelection(this.doc,i,new Range(from,newRanges[i].to()),sel_dontScroll);}else if(range.head.line > end){indentLine(this,range.head.line,how,true);end = range.head.line;if(i == this.doc.sel.primIndex)ensureCursorVisible(this);}}}), // Fetch the parser token for a given character. Useful for hacks
// that want to inspect the mode state (say, for completion).
getTokenAt:function getTokenAt(pos,precise){return takeToken(this,pos,precise);},getLineTokens:function getLineTokens(line,precise){return takeToken(this,Pos(line),precise,true);},getTokenTypeAt:function getTokenTypeAt(pos){pos = _clipPos(this.doc,pos);var styles=getLineStyles(this,getLine(this.doc,pos.line));var before=0,after=(styles.length - 1) / 2,ch=pos.ch;var type;if(ch == 0)type = styles[2];else for(;;) {var mid=before + after >> 1;if((mid?styles[mid * 2 - 1]:0) >= ch)after = mid;else if(styles[mid * 2 + 1] < ch)before = mid + 1;else {type = styles[mid * 2 + 2];break;}}var cut=type?type.indexOf("cm-overlay "):-1;return cut < 0?type:cut == 0?null:type.slice(0,cut - 1);},getModeAt:function getModeAt(pos){var mode=this.doc.mode;if(!mode.innerMode)return mode;return CodeMirror.innerMode(mode,this.getTokenAt(pos).state).mode;},getHelper:function getHelper(pos,type){return this.getHelpers(pos,type)[0];},getHelpers:function getHelpers(pos,type){var found=[];if(!helpers.hasOwnProperty(type))return found;var help=helpers[type],mode=this.getModeAt(pos);if(typeof mode[type] == "string"){if(help[mode[type]])found.push(help[mode[type]]);}else if(mode[type]){for(var i=0;i < mode[type].length;i++) {var val=help[mode[type][i]];if(val)found.push(val);}}else if(mode.helperType && help[mode.helperType]){found.push(help[mode.helperType]);}else if(help[mode.name]){found.push(help[mode.name]);}for(var i=0;i < help._global.length;i++) {var cur=help._global[i];if(cur.pred(mode,this) && indexOf(found,cur.val) == -1)found.push(cur.val);}return found;},getStateAfter:function getStateAfter(line,precise){var doc=this.doc;line = clipLine(doc,line == null?doc.first + doc.size - 1:line);return getStateBefore(this,line + 1,precise);},cursorCoords:function cursorCoords(start,mode){var pos,range=this.doc.sel.primary();if(start == null)pos = range.head;else if(typeof start == "object")pos = _clipPos(this.doc,start);else pos = start?range.from():range.to();return _cursorCoords(this,pos,mode || "page");},charCoords:function charCoords(pos,mode){return _charCoords(this,_clipPos(this.doc,pos),mode || "page");},coordsChar:function coordsChar(coords,mode){coords = fromCoordSystem(this,coords,mode || "page");return _coordsChar(this,coords.left,coords.top);},lineAtHeight:function lineAtHeight(height,mode){height = fromCoordSystem(this,{top:height,left:0},mode || "page").top;return _lineAtHeight(this.doc,height + this.display.viewOffset);},heightAtLine:function heightAtLine(line,mode){var end=false,last=this.doc.first + this.doc.size - 1;if(line < this.doc.first)line = this.doc.first;else if(line > last){line = last;end = true;}var lineObj=getLine(this.doc,line);return intoCoordSystem(this,lineObj,{top:0,left:0},mode || "page").top + (end?this.doc.height - _heightAtLine(lineObj):0);},defaultTextHeight:function defaultTextHeight(){return textHeight(this.display);},defaultCharWidth:function defaultCharWidth(){return charWidth(this.display);},setGutterMarker:methodOp(function(line,gutterID,value){return changeLine(this.doc,line,"gutter",function(line){var markers=line.gutterMarkers || (line.gutterMarkers = {});markers[gutterID] = value;if(!value && isEmpty(markers))line.gutterMarkers = null;return true;});}),clearGutter:methodOp(function(gutterID){var cm=this,doc=cm.doc,i=doc.first;doc.iter(function(line){if(line.gutterMarkers && line.gutterMarkers[gutterID]){line.gutterMarkers[gutterID] = null;regLineChange(cm,i,"gutter");if(isEmpty(line.gutterMarkers))line.gutterMarkers = null;}++i;});}),lineInfo:function lineInfo(line){if(typeof line == "number"){if(!isLine(this.doc,line))return null;var n=line;line = getLine(this.doc,line);if(!line)return null;}else {var n=lineNo(line);if(n == null)return null;}return {line:n,handle:line,text:line.text,gutterMarkers:line.gutterMarkers,textClass:line.textClass,bgClass:line.bgClass,wrapClass:line.wrapClass,widgets:line.widgets};},getViewport:function getViewport(){return {from:this.display.viewFrom,to:this.display.viewTo};},addWidget:function addWidget(pos,node,scroll,vert,horiz){var display=this.display;pos = _cursorCoords(this,_clipPos(this.doc,pos));var top=pos.bottom,left=pos.left;node.style.position = "absolute";node.setAttribute("cm-ignore-events","true");this.display.input.setUneditable(node);display.sizer.appendChild(node);if(vert == "over"){top = pos.top;}else if(vert == "above" || vert == "near"){var vspace=Math.max(display.wrapper.clientHeight,this.doc.height),hspace=Math.max(display.sizer.clientWidth,display.lineSpace.clientWidth); // Default to positioning above (if specified and possible); otherwise default to positioning below
if((vert == 'above' || pos.bottom + node.offsetHeight > vspace) && pos.top > node.offsetHeight)top = pos.top - node.offsetHeight;else if(pos.bottom + node.offsetHeight <= vspace)top = pos.bottom;if(left + node.offsetWidth > hspace)left = hspace - node.offsetWidth;}node.style.top = top + "px";node.style.left = node.style.right = "";if(horiz == "right"){left = display.sizer.clientWidth - node.offsetWidth;node.style.right = "0px";}else {if(horiz == "left")left = 0;else if(horiz == "middle")left = (display.sizer.clientWidth - node.offsetWidth) / 2;node.style.left = left + "px";}if(scroll)scrollIntoView(this,left,top,left + node.offsetWidth,top + node.offsetHeight);},triggerOnKeyDown:methodOp(onKeyDown),triggerOnKeyPress:methodOp(onKeyPress),triggerOnKeyUp:onKeyUp,execCommand:function execCommand(cmd){if(commands.hasOwnProperty(cmd))return commands[cmd](this);},findPosH:function findPosH(from,amount,unit,visually){var dir=1;if(amount < 0){dir = -1;amount = -amount;}for(var i=0,cur=_clipPos(this.doc,from);i < amount;++i) {cur = _findPosH(this.doc,cur,dir,unit,visually);if(cur.hitSide)break;}return cur;},moveH:methodOp(function(dir,unit){var cm=this;cm.extendSelectionsBy(function(range){if(cm.display.shift || cm.doc.extend || range.empty())return _findPosH(cm.doc,range.head,dir,unit,cm.options.rtlMoveVisually);else return dir < 0?range.from():range.to();},sel_move);}),deleteH:methodOp(function(dir,unit){var sel=this.doc.sel,doc=this.doc;if(sel.somethingSelected())doc.replaceSelection("",null,"+delete");else deleteNearSelection(this,function(range){var other=_findPosH(doc,range.head,dir,unit,false);return dir < 0?{from:other,to:range.head}:{from:range.head,to:other};});}),findPosV:function findPosV(from,amount,unit,goalColumn){var dir=1,x=goalColumn;if(amount < 0){dir = -1;amount = -amount;}for(var i=0,cur=_clipPos(this.doc,from);i < amount;++i) {var coords=_cursorCoords(this,cur,"div");if(x == null)x = coords.left;else coords.left = x;cur = _findPosV(this,coords,dir,unit);if(cur.hitSide)break;}return cur;},moveV:methodOp(function(dir,unit){var cm=this,doc=this.doc,goals=[];var collapse=!cm.display.shift && !doc.extend && doc.sel.somethingSelected();doc.extendSelectionsBy(function(range){if(collapse)return dir < 0?range.from():range.to();var headPos=_cursorCoords(cm,range.head,"div");if(range.goalColumn != null)headPos.left = range.goalColumn;goals.push(headPos.left);var pos=_findPosV(cm,headPos,dir,unit);if(unit == "page" && range == doc.sel.primary())addToScrollPos(cm,null,_charCoords(cm,pos,"div").top - headPos.top);return pos;},sel_move);if(goals.length)for(var i=0;i < doc.sel.ranges.length;i++) doc.sel.ranges[i].goalColumn = goals[i];}), // Find the word at the given position (as returned by coordsChar).
findWordAt:function findWordAt(pos){var doc=this.doc,line=getLine(doc,pos.line).text;var start=pos.ch,end=pos.ch;if(line){var helper=this.getHelper(pos,"wordChars");if((pos.xRel < 0 || end == line.length) && start)--start;else ++end;var startChar=line.charAt(start);var check=isWordChar(startChar,helper)?function(ch){return isWordChar(ch,helper);}:/\s/.test(startChar)?function(ch){return (/\s/.test(ch));}:function(ch){return !/\s/.test(ch) && !isWordChar(ch);};while(start > 0 && check(line.charAt(start - 1))) --start;while(end < line.length && check(line.charAt(end))) ++end;}return new Range(Pos(pos.line,start),Pos(pos.line,end));},toggleOverwrite:function toggleOverwrite(value){if(value != null && value == this.state.overwrite)return;if(this.state.overwrite = !this.state.overwrite)addClass(this.display.cursorDiv,"CodeMirror-overwrite");else rmClass(this.display.cursorDiv,"CodeMirror-overwrite");signal(this,"overwriteToggle",this,this.state.overwrite);},hasFocus:function hasFocus(){return this.display.input.getField() == activeElt();},scrollTo:methodOp(function(x,y){if(x != null || y != null)resolveScrollToPos(this);if(x != null)this.curOp.scrollLeft = x;if(y != null)this.curOp.scrollTop = y;}),getScrollInfo:function getScrollInfo(){var scroller=this.display.scroller;return {left:scroller.scrollLeft,top:scroller.scrollTop,height:scroller.scrollHeight - scrollGap(this) - this.display.barHeight,width:scroller.scrollWidth - scrollGap(this) - this.display.barWidth,clientHeight:displayHeight(this),clientWidth:displayWidth(this)};},scrollIntoView:methodOp(function(range,margin){if(range == null){range = {from:this.doc.sel.primary().head,to:null};if(margin == null)margin = this.options.cursorScrollMargin;}else if(typeof range == "number"){range = {from:Pos(range,0),to:null};}else if(range.from == null){range = {from:range,to:null};}if(!range.to)range.to = range.from;range.margin = margin || 0;if(range.from.line != null){resolveScrollToPos(this);this.curOp.scrollToPos = range;}else {var sPos=calculateScrollPos(this,Math.min(range.from.left,range.to.left),Math.min(range.from.top,range.to.top) - range.margin,Math.max(range.from.right,range.to.right),Math.max(range.from.bottom,range.to.bottom) + range.margin);this.scrollTo(sPos.scrollLeft,sPos.scrollTop);}}),setSize:methodOp(function(width,height){var cm=this;function interpret(val){return typeof val == "number" || /^\d+$/.test(String(val))?val + "px":val;}if(width != null)cm.display.wrapper.style.width = interpret(width);if(height != null)cm.display.wrapper.style.height = interpret(height);if(cm.options.lineWrapping)clearLineMeasurementCache(this);var lineNo=cm.display.viewFrom;cm.doc.iter(lineNo,cm.display.viewTo,function(line){if(line.widgets)for(var i=0;i < line.widgets.length;i++) if(line.widgets[i].noHScroll){regLineChange(cm,lineNo,"widget");break;}++lineNo;});cm.curOp.forceUpdate = true;signal(cm,"refresh",this);}),operation:function operation(f){return runInOp(this,f);},refresh:methodOp(function(){var oldHeight=this.display.cachedTextHeight;regChange(this);this.curOp.forceUpdate = true;clearCaches(this);this.scrollTo(this.doc.scrollLeft,this.doc.scrollTop);updateGutterSpace(this);if(oldHeight == null || Math.abs(oldHeight - textHeight(this.display)) > .5)estimateLineHeights(this);signal(this,"refresh",this);}),swapDoc:methodOp(function(doc){var old=this.doc;old.cm = null;attachDoc(this,doc);clearCaches(this);this.display.input.reset();this.scrollTo(doc.scrollLeft,doc.scrollTop);this.curOp.forceScroll = true;signalLater(this,"swapDoc",this,old);return old;}),getInputField:function getInputField(){return this.display.input.getField();},getWrapperElement:function getWrapperElement(){return this.display.wrapper;},getScrollerElement:function getScrollerElement(){return this.display.scroller;},getGutterElement:function getGutterElement(){return this.display.gutters;}};eventMixin(CodeMirror); // OPTION DEFAULTS
// The default configuration options.
var defaults=CodeMirror.defaults = {}; // Functions to run when options are changed.
var optionHandlers=CodeMirror.optionHandlers = {};function option(name,deflt,handle,notOnInit){CodeMirror.defaults[name] = deflt;if(handle)optionHandlers[name] = notOnInit?function(cm,val,old){if(old != Init)handle(cm,val,old);}:handle;} // Passed to option handlers when there is no old value.
var Init=CodeMirror.Init = {toString:function toString(){return "CodeMirror.Init";}}; // These two are, on init, called from the constructor because they
// have to be initialized before the editor can start at all.
option("value","",function(cm,val){cm.setValue(val);},true);option("mode",null,function(cm,val){cm.doc.modeOption = val;loadMode(cm);},true);option("indentUnit",2,loadMode,true);option("indentWithTabs",false);option("smartIndent",true);option("tabSize",4,function(cm){resetModeState(cm);clearCaches(cm);regChange(cm);},true);option("specialChars",/[\t\u0000-\u0019\u00ad\u200b-\u200f\u2028\u2029\ufeff]/g,function(cm,val,old){cm.state.specialChars = new RegExp(val.source + (val.test("\t")?"":"|\t"),"g");if(old != CodeMirror.Init)cm.refresh();});option("specialCharPlaceholder",defaultSpecialCharPlaceholder,function(cm){cm.refresh();},true);option("electricChars",true);option("inputStyle",mobile?"contenteditable":"textarea",function(){throw new Error("inputStyle can not (yet) be changed in a running editor"); // FIXME
},true);option("rtlMoveVisually",!windows);option("wholeLineUpdateBefore",true);option("theme","default",function(cm){themeChanged(cm);guttersChanged(cm);},true);option("keyMap","default",function(cm,val,old){var next=getKeyMap(val);var prev=old != CodeMirror.Init && getKeyMap(old);if(prev && prev.detach)prev.detach(cm,next);if(next.attach)next.attach(cm,prev || null);});option("extraKeys",null);option("lineWrapping",false,wrappingChanged,true);option("gutters",[],function(cm){setGuttersForLineNumbers(cm.options);guttersChanged(cm);},true);option("fixedGutter",true,function(cm,val){cm.display.gutters.style.left = val?compensateForHScroll(cm.display) + "px":"0";cm.refresh();},true);option("coverGutterNextToScrollbar",false,function(cm){updateScrollbars(cm);},true);option("scrollbarStyle","native",function(cm){initScrollbars(cm);updateScrollbars(cm);cm.display.scrollbars.setScrollTop(cm.doc.scrollTop);cm.display.scrollbars.setScrollLeft(cm.doc.scrollLeft);},true);option("lineNumbers",false,function(cm){setGuttersForLineNumbers(cm.options);guttersChanged(cm);},true);option("firstLineNumber",1,guttersChanged,true);option("lineNumberFormatter",function(integer){return integer;},guttersChanged,true);option("showCursorWhenSelecting",false,updateSelection,true);option("resetSelectionOnContextMenu",true);option("readOnly",false,function(cm,val){if(val == "nocursor"){onBlur(cm);cm.display.input.blur();cm.display.disabled = true;}else {cm.display.disabled = false;if(!val)cm.display.input.reset();}});option("disableInput",false,function(cm,val){if(!val)cm.display.input.reset();},true);option("dragDrop",true);option("cursorBlinkRate",530);option("cursorScrollMargin",0);option("cursorHeight",1,updateSelection,true);option("singleCursorHeightPerLine",true,updateSelection,true);option("workTime",100);option("workDelay",100);option("flattenSpans",true,resetModeState,true);option("addModeClass",false,resetModeState,true);option("pollInterval",100);option("undoDepth",200,function(cm,val){cm.doc.history.undoDepth = val;});option("historyEventDelay",1250);option("viewportMargin",10,function(cm){cm.refresh();},true);option("maxHighlightLength",10000,resetModeState,true);option("moveInputWithCursor",true,function(cm,val){if(!val)cm.display.input.resetPosition();});option("tabindex",null,function(cm,val){cm.display.input.getField().tabIndex = val || "";});option("autofocus",null); // MODE DEFINITION AND QUERYING
// Known modes, by name and by MIME
var modes=CodeMirror.modes = {},mimeModes=CodeMirror.mimeModes = {}; // Extra arguments are stored as the mode's dependencies, which is
// used by (legacy) mechanisms like loadmode.js to automatically
// load a mode. (Preferred mechanism is the require/define calls.)
CodeMirror.defineMode = function(name,mode){if(!CodeMirror.defaults.mode && name != "null")CodeMirror.defaults.mode = name;if(arguments.length > 2)mode.dependencies = Array.prototype.slice.call(arguments,2);modes[name] = mode;};CodeMirror.defineMIME = function(mime,spec){mimeModes[mime] = spec;}; // Given a MIME type, a {name, ...options} config object, or a name
// string, return a mode config object.
CodeMirror.resolveMode = function(spec){if(typeof spec == "string" && mimeModes.hasOwnProperty(spec)){spec = mimeModes[spec];}else if(spec && typeof spec.name == "string" && mimeModes.hasOwnProperty(spec.name)){var found=mimeModes[spec.name];if(typeof found == "string")found = {name:found};spec = createObj(found,spec);spec.name = found.name;}else if(typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)){return CodeMirror.resolveMode("application/xml");}if(typeof spec == "string")return {name:spec};else return spec || {name:"null"};}; // Given a mode spec (anything that resolveMode accepts), find and
// initialize an actual mode object.
CodeMirror.getMode = function(options,spec){var spec=CodeMirror.resolveMode(spec);var mfactory=modes[spec.name];if(!mfactory)return CodeMirror.getMode(options,"text/plain");var modeObj=mfactory(options,spec);if(modeExtensions.hasOwnProperty(spec.name)){var exts=modeExtensions[spec.name];for(var prop in exts) {if(!exts.hasOwnProperty(prop))continue;if(modeObj.hasOwnProperty(prop))modeObj["_" + prop] = modeObj[prop];modeObj[prop] = exts[prop];}}modeObj.name = spec.name;if(spec.helperType)modeObj.helperType = spec.helperType;if(spec.modeProps)for(var prop in spec.modeProps) modeObj[prop] = spec.modeProps[prop];return modeObj;}; // Minimal default mode.
CodeMirror.defineMode("null",function(){return {token:function token(stream){stream.skipToEnd();}};});CodeMirror.defineMIME("text/plain","null"); // This can be used to attach properties to mode objects from
// outside the actual mode definition.
var modeExtensions=CodeMirror.modeExtensions = {};CodeMirror.extendMode = function(mode,properties){var exts=modeExtensions.hasOwnProperty(mode)?modeExtensions[mode]:modeExtensions[mode] = {};copyObj(properties,exts);}; // EXTENSIONS
CodeMirror.defineExtension = function(name,func){CodeMirror.prototype[name] = func;};CodeMirror.defineDocExtension = function(name,func){Doc.prototype[name] = func;};CodeMirror.defineOption = option;var initHooks=[];CodeMirror.defineInitHook = function(f){initHooks.push(f);};var helpers=CodeMirror.helpers = {};CodeMirror.registerHelper = function(type,name,value){if(!helpers.hasOwnProperty(type))helpers[type] = CodeMirror[type] = {_global:[]};helpers[type][name] = value;};CodeMirror.registerGlobalHelper = function(type,name,predicate,value){CodeMirror.registerHelper(type,name,value);helpers[type]._global.push({pred:predicate,val:value});}; // MODE STATE HANDLING
// Utility functions for working with state. Exported because nested
// modes need to do this for their inner modes.
var copyState=CodeMirror.copyState = function(mode,state){if(state === true)return state;if(mode.copyState)return mode.copyState(state);var nstate={};for(var n in state) {var val=state[n];if(val instanceof Array)val = val.concat([]);nstate[n] = val;}return nstate;};var startState=CodeMirror.startState = function(mode,a1,a2){return mode.startState?mode.startState(a1,a2):true;}; // Given a mode and a state (for that mode), find the inner mode and
// state at the position that the state refers to.
CodeMirror.innerMode = function(mode,state){while(mode.innerMode) {var info=mode.innerMode(state);if(!info || info.mode == mode)break;state = info.state;mode = info.mode;}return info || {mode:mode,state:state};}; // STANDARD COMMANDS
// Commands are parameter-less actions that can be performed on an
// editor, mostly used for keybindings.
var commands=CodeMirror.commands = {selectAll:function selectAll(cm){cm.setSelection(Pos(cm.firstLine(),0),Pos(cm.lastLine()),sel_dontScroll);},singleSelection:function singleSelection(cm){cm.setSelection(cm.getCursor("anchor"),cm.getCursor("head"),sel_dontScroll);},killLine:function killLine(cm){deleteNearSelection(cm,function(range){if(range.empty()){var len=getLine(cm.doc,range.head.line).text.length;if(range.head.ch == len && range.head.line < cm.lastLine())return {from:range.head,to:Pos(range.head.line + 1,0)};else return {from:range.head,to:Pos(range.head.line,len)};}else {return {from:range.from(),to:range.to()};}});},deleteLine:function deleteLine(cm){deleteNearSelection(cm,function(range){return {from:Pos(range.from().line,0),to:_clipPos(cm.doc,Pos(range.to().line + 1,0))};});},delLineLeft:function delLineLeft(cm){deleteNearSelection(cm,function(range){return {from:Pos(range.from().line,0),to:range.from()};});},delWrappedLineLeft:function delWrappedLineLeft(cm){deleteNearSelection(cm,function(range){var top=cm.charCoords(range.head,"div").top + 5;var leftPos=cm.coordsChar({left:0,top:top},"div");return {from:leftPos,to:range.from()};});},delWrappedLineRight:function delWrappedLineRight(cm){deleteNearSelection(cm,function(range){var top=cm.charCoords(range.head,"div").top + 5;var rightPos=cm.coordsChar({left:cm.display.lineDiv.offsetWidth + 100,top:top},"div");return {from:range.from(),to:rightPos};});},undo:function undo(cm){cm.undo();},redo:function redo(cm){cm.redo();},undoSelection:function undoSelection(cm){cm.undoSelection();},redoSelection:function redoSelection(cm){cm.redoSelection();},goDocStart:function goDocStart(cm){cm.extendSelection(Pos(cm.firstLine(),0));},goDocEnd:function goDocEnd(cm){cm.extendSelection(Pos(cm.lastLine()));},goLineStart:function goLineStart(cm){cm.extendSelectionsBy(function(range){return lineStart(cm,range.head.line);},{origin:"+move",bias:1});},goLineStartSmart:function goLineStartSmart(cm){cm.extendSelectionsBy(function(range){return lineStartSmart(cm,range.head);},{origin:"+move",bias:1});},goLineEnd:function goLineEnd(cm){cm.extendSelectionsBy(function(range){return lineEnd(cm,range.head.line);},{origin:"+move",bias:-1});},goLineRight:function goLineRight(cm){cm.extendSelectionsBy(function(range){var top=cm.charCoords(range.head,"div").top + 5;return cm.coordsChar({left:cm.display.lineDiv.offsetWidth + 100,top:top},"div");},sel_move);},goLineLeft:function goLineLeft(cm){cm.extendSelectionsBy(function(range){var top=cm.charCoords(range.head,"div").top + 5;return cm.coordsChar({left:0,top:top},"div");},sel_move);},goLineLeftSmart:function goLineLeftSmart(cm){cm.extendSelectionsBy(function(range){var top=cm.charCoords(range.head,"div").top + 5;var pos=cm.coordsChar({left:0,top:top},"div");if(pos.ch < cm.getLine(pos.line).search(/\S/))return lineStartSmart(cm,range.head);return pos;},sel_move);},goLineUp:function goLineUp(cm){cm.moveV(-1,"line");},goLineDown:function goLineDown(cm){cm.moveV(1,"line");},goPageUp:function goPageUp(cm){cm.moveV(-1,"page");},goPageDown:function goPageDown(cm){cm.moveV(1,"page");},goCharLeft:function goCharLeft(cm){cm.moveH(-1,"char");},goCharRight:function goCharRight(cm){cm.moveH(1,"char");},goColumnLeft:function goColumnLeft(cm){cm.moveH(-1,"column");},goColumnRight:function goColumnRight(cm){cm.moveH(1,"column");},goWordLeft:function goWordLeft(cm){cm.moveH(-1,"word");},goGroupRight:function goGroupRight(cm){cm.moveH(1,"group");},goGroupLeft:function goGroupLeft(cm){cm.moveH(-1,"group");},goWordRight:function goWordRight(cm){cm.moveH(1,"word");},delCharBefore:function delCharBefore(cm){cm.deleteH(-1,"char");},delCharAfter:function delCharAfter(cm){cm.deleteH(1,"char");},delWordBefore:function delWordBefore(cm){cm.deleteH(-1,"word");},delWordAfter:function delWordAfter(cm){cm.deleteH(1,"word");},delGroupBefore:function delGroupBefore(cm){cm.deleteH(-1,"group");},delGroupAfter:function delGroupAfter(cm){cm.deleteH(1,"group");},indentAuto:function indentAuto(cm){cm.indentSelection("smart");},indentMore:function indentMore(cm){cm.indentSelection("add");},indentLess:function indentLess(cm){cm.indentSelection("subtract");},insertTab:function insertTab(cm){cm.replaceSelection("\t");},insertSoftTab:function insertSoftTab(cm){var spaces=[],ranges=cm.listSelections(),tabSize=cm.options.tabSize;for(var i=0;i < ranges.length;i++) {var pos=ranges[i].from();var col=countColumn(cm.getLine(pos.line),pos.ch,tabSize);spaces.push(new Array(tabSize - col % tabSize + 1).join(" "));}cm.replaceSelections(spaces);},defaultTab:function defaultTab(cm){if(cm.somethingSelected())cm.indentSelection("add");else cm.execCommand("insertTab");},transposeChars:function transposeChars(cm){runInOp(cm,function(){var ranges=cm.listSelections(),newSel=[];for(var i=0;i < ranges.length;i++) {var cur=ranges[i].head,line=getLine(cm.doc,cur.line).text;if(line){if(cur.ch == line.length)cur = new Pos(cur.line,cur.ch - 1);if(cur.ch > 0){cur = new Pos(cur.line,cur.ch + 1);cm.replaceRange(line.charAt(cur.ch - 1) + line.charAt(cur.ch - 2),Pos(cur.line,cur.ch - 2),cur,"+transpose");}else if(cur.line > cm.doc.first){var prev=getLine(cm.doc,cur.line - 1).text;if(prev)cm.replaceRange(line.charAt(0) + "\n" + prev.charAt(prev.length - 1),Pos(cur.line - 1,prev.length - 1),Pos(cur.line,1),"+transpose");}}newSel.push(new Range(cur,cur));}cm.setSelections(newSel);});},newlineAndIndent:function newlineAndIndent(cm){runInOp(cm,function(){var len=cm.listSelections().length;for(var i=0;i < len;i++) {var range=cm.listSelections()[i];cm.replaceRange("\n",range.anchor,range.head,"+input");cm.indentLine(range.from().line + 1,null,true);ensureCursorVisible(cm);}});},toggleOverwrite:function toggleOverwrite(cm){cm.toggleOverwrite();}}; // STANDARD KEYMAPS
var keyMap=CodeMirror.keyMap = {};keyMap.basic = {"Left":"goCharLeft","Right":"goCharRight","Up":"goLineUp","Down":"goLineDown","End":"goLineEnd","Home":"goLineStartSmart","PageUp":"goPageUp","PageDown":"goPageDown","Delete":"delCharAfter","Backspace":"delCharBefore","Shift-Backspace":"delCharBefore","Tab":"defaultTab","Shift-Tab":"indentAuto","Enter":"newlineAndIndent","Insert":"toggleOverwrite","Esc":"singleSelection"}; // Note that the save and find-related commands aren't defined by
// default. User code or addons can define them. Unknown commands
// are simply ignored.
keyMap.pcDefault = {"Ctrl-A":"selectAll","Ctrl-D":"deleteLine","Ctrl-Z":"undo","Shift-Ctrl-Z":"redo","Ctrl-Y":"redo","Ctrl-Home":"goDocStart","Ctrl-End":"goDocEnd","Ctrl-Up":"goLineUp","Ctrl-Down":"goLineDown","Ctrl-Left":"goGroupLeft","Ctrl-Right":"goGroupRight","Alt-Left":"goLineStart","Alt-Right":"goLineEnd","Ctrl-Backspace":"delGroupBefore","Ctrl-Delete":"delGroupAfter","Ctrl-S":"save","Ctrl-F":"find","Ctrl-G":"findNext","Shift-Ctrl-G":"findPrev","Shift-Ctrl-F":"replace","Shift-Ctrl-R":"replaceAll","Ctrl-[":"indentLess","Ctrl-]":"indentMore","Ctrl-U":"undoSelection","Shift-Ctrl-U":"redoSelection","Alt-U":"redoSelection",fallthrough:"basic"}; // Very basic readline/emacs-style bindings, which are standard on Mac.
keyMap.emacsy = {"Ctrl-F":"goCharRight","Ctrl-B":"goCharLeft","Ctrl-P":"goLineUp","Ctrl-N":"goLineDown","Alt-F":"goWordRight","Alt-B":"goWordLeft","Ctrl-A":"goLineStart","Ctrl-E":"goLineEnd","Ctrl-V":"goPageDown","Shift-Ctrl-V":"goPageUp","Ctrl-D":"delCharAfter","Ctrl-H":"delCharBefore","Alt-D":"delWordAfter","Alt-Backspace":"delWordBefore","Ctrl-K":"killLine","Ctrl-T":"transposeChars"};keyMap.macDefault = {"Cmd-A":"selectAll","Cmd-D":"deleteLine","Cmd-Z":"undo","Shift-Cmd-Z":"redo","Cmd-Y":"redo","Cmd-Home":"goDocStart","Cmd-Up":"goDocStart","Cmd-End":"goDocEnd","Cmd-Down":"goDocEnd","Alt-Left":"goGroupLeft","Alt-Right":"goGroupRight","Cmd-Left":"goLineLeft","Cmd-Right":"goLineRight","Alt-Backspace":"delGroupBefore","Ctrl-Alt-Backspace":"delGroupAfter","Alt-Delete":"delGroupAfter","Cmd-S":"save","Cmd-F":"find","Cmd-G":"findNext","Shift-Cmd-G":"findPrev","Cmd-Alt-F":"replace","Shift-Cmd-Alt-F":"replaceAll","Cmd-[":"indentLess","Cmd-]":"indentMore","Cmd-Backspace":"delWrappedLineLeft","Cmd-Delete":"delWrappedLineRight","Cmd-U":"undoSelection","Shift-Cmd-U":"redoSelection","Ctrl-Up":"goDocStart","Ctrl-Down":"goDocEnd",fallthrough:["basic","emacsy"]};keyMap["default"] = mac?keyMap.macDefault:keyMap.pcDefault; // KEYMAP DISPATCH
function normalizeKeyName(name){var parts=name.split(/-(?!$)/),name=parts[parts.length - 1];var alt,ctrl,shift,cmd;for(var i=0;i < parts.length - 1;i++) {var mod=parts[i];if(/^(cmd|meta|m)$/i.test(mod))cmd = true;else if(/^a(lt)?$/i.test(mod))alt = true;else if(/^(c|ctrl|control)$/i.test(mod))ctrl = true;else if(/^s(hift)$/i.test(mod))shift = true;else throw new Error("Unrecognized modifier name: " + mod);}if(alt)name = "Alt-" + name;if(ctrl)name = "Ctrl-" + name;if(cmd)name = "Cmd-" + name;if(shift)name = "Shift-" + name;return name;} // This is a kludge to keep keymaps mostly working as raw objects
// (backwards compatibility) while at the same time support features
// like normalization and multi-stroke key bindings. It compiles a
// new normalized keymap, and then updates the old object to reflect
// this.
CodeMirror.normalizeKeyMap = function(keymap){var copy={};for(var keyname in keymap) if(keymap.hasOwnProperty(keyname)){var value=keymap[keyname];if(/^(name|fallthrough|(de|at)tach)$/.test(keyname))continue;if(value == "..."){delete keymap[keyname];continue;}var keys=map(keyname.split(" "),normalizeKeyName);for(var i=0;i < keys.length;i++) {var val,name;if(i == keys.length - 1){name = keyname;val = value;}else {name = keys.slice(0,i + 1).join(" ");val = "...";}var prev=copy[name];if(!prev)copy[name] = val;else if(prev != val)throw new Error("Inconsistent bindings for " + name);}delete keymap[keyname];}for(var prop in copy) keymap[prop] = copy[prop];return keymap;};var lookupKey=CodeMirror.lookupKey = function(key,map,handle,context){map = getKeyMap(map);var found=map.call?map.call(key,context):map[key];if(found === false)return "nothing";if(found === "...")return "multi";if(found != null && handle(found))return "handled";if(map.fallthrough){if(Object.prototype.toString.call(map.fallthrough) != "[object Array]")return lookupKey(key,map.fallthrough,handle,context);for(var i=0;i < map.fallthrough.length;i++) {var result=lookupKey(key,map.fallthrough[i],handle,context);if(result)return result;}}}; // Modifier key presses don't count as 'real' key presses for the
// purpose of keymap fallthrough.
var isModifierKey=CodeMirror.isModifierKey = function(value){var name=typeof value == "string"?value:keyNames[value.keyCode];return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod";}; // Look up the name of a key as indicated by an event object.
var keyName=CodeMirror.keyName = function(event,noShift){if(presto && event.keyCode == 34 && event["char"])return false;var base=keyNames[event.keyCode],name=base;if(name == null || event.altGraphKey)return false;if(event.altKey && base != "Alt")name = "Alt-" + name;if((flipCtrlCmd?event.metaKey:event.ctrlKey) && base != "Ctrl")name = "Ctrl-" + name;if((flipCtrlCmd?event.ctrlKey:event.metaKey) && base != "Cmd")name = "Cmd-" + name;if(!noShift && event.shiftKey && base != "Shift")name = "Shift-" + name;return name;};function getKeyMap(val){return typeof val == "string"?keyMap[val]:val;} // FROMTEXTAREA
CodeMirror.fromTextArea = function(textarea,options){options = options?copyObj(options):{};options.value = textarea.value;if(!options.tabindex && textarea.tabIndex)options.tabindex = textarea.tabIndex;if(!options.placeholder && textarea.placeholder)options.placeholder = textarea.placeholder; // Set autofocus to true if this textarea is focused, or if it has
// autofocus and no other element is focused.
if(options.autofocus == null){var hasFocus=activeElt();options.autofocus = hasFocus == textarea || textarea.getAttribute("autofocus") != null && hasFocus == document.body;}function save(){textarea.value = cm.getValue();}if(textarea.form){on(textarea.form,"submit",save); // Deplorable hack to make the submit method do the right thing.
if(!options.leaveSubmitMethodAlone){var form=textarea.form,realSubmit=form.submit;try{var wrappedSubmit=form.submit = function(){save();form.submit = realSubmit;form.submit();form.submit = wrappedSubmit;};}catch(e) {}}}options.finishInit = function(cm){cm.save = save;cm.getTextArea = function(){return textarea;};cm.toTextArea = function(){cm.toTextArea = isNaN; // Prevent this from being ran twice
save();textarea.parentNode.removeChild(cm.getWrapperElement());textarea.style.display = "";if(textarea.form){off(textarea.form,"submit",save);if(typeof textarea.form.submit == "function")textarea.form.submit = realSubmit;}};};textarea.style.display = "none";var cm=CodeMirror(function(node){textarea.parentNode.insertBefore(node,textarea.nextSibling);},options);return cm;}; // STRING STREAM
// Fed to the mode parsers, provides helper functions to make
// parsers more succinct.
var StringStream=CodeMirror.StringStream = function(string,tabSize){this.pos = this.start = 0;this.string = string;this.tabSize = tabSize || 8;this.lastColumnPos = this.lastColumnValue = 0;this.lineStart = 0;};StringStream.prototype = {eol:function eol(){return this.pos >= this.string.length;},sol:function sol(){return this.pos == this.lineStart;},peek:function peek(){return this.string.charAt(this.pos) || undefined;},next:function next(){if(this.pos < this.string.length)return this.string.charAt(this.pos++);},eat:function eat(match){var ch=this.string.charAt(this.pos);if(typeof match == "string")var ok=ch == match;else var ok=ch && (match.test?match.test(ch):match(ch));if(ok){++this.pos;return ch;}},eatWhile:function eatWhile(match){var start=this.pos;while(this.eat(match)) {}return this.pos > start;},eatSpace:function eatSpace(){var start=this.pos;while(/[\s\u00a0]/.test(this.string.charAt(this.pos))) ++this.pos;return this.pos > start;},skipToEnd:function skipToEnd(){this.pos = this.string.length;},skipTo:function skipTo(ch){var found=this.string.indexOf(ch,this.pos);if(found > -1){this.pos = found;return true;}},backUp:function backUp(n){this.pos -= n;},column:function column(){if(this.lastColumnPos < this.start){this.lastColumnValue = countColumn(this.string,this.start,this.tabSize,this.lastColumnPos,this.lastColumnValue);this.lastColumnPos = this.start;}return this.lastColumnValue - (this.lineStart?countColumn(this.string,this.lineStart,this.tabSize):0);},indentation:function indentation(){return countColumn(this.string,null,this.tabSize) - (this.lineStart?countColumn(this.string,this.lineStart,this.tabSize):0);},match:function match(pattern,consume,caseInsensitive){if(typeof pattern == "string"){var cased=function cased(str){return caseInsensitive?str.toLowerCase():str;};var substr=this.string.substr(this.pos,pattern.length);if(cased(substr) == cased(pattern)){if(consume !== false)this.pos += pattern.length;return true;}}else {var match=this.string.slice(this.pos).match(pattern);if(match && match.index > 0)return null;if(match && consume !== false)this.pos += match[0].length;return match;}},current:function current(){return this.string.slice(this.start,this.pos);},hideFirstChars:function hideFirstChars(n,inner){this.lineStart += n;try{return inner();}finally {this.lineStart -= n;}}}; // TEXTMARKERS
// Created with markText and setBookmark methods. A TextMarker is a
// handle that can be used to clear or find a marked position in the
// document. Line objects hold arrays (markedSpans) containing
// {from, to, marker} object pointing to such marker objects, and
// indicating that such a marker is present on that line. Multiple
// lines may point to the same marker when it spans across lines.
// The spans will have null for their from/to properties when the
// marker continues beyond the start/end of the line. Markers have
// links back to the lines they currently touch.
var nextMarkerId=0;var TextMarker=CodeMirror.TextMarker = function(doc,type){this.lines = [];this.type = type;this.doc = doc;this.id = ++nextMarkerId;};eventMixin(TextMarker); // Clear the marker.
TextMarker.prototype.clear = function(){if(this.explicitlyCleared)return;var cm=this.doc.cm,withOp=cm && !cm.curOp;if(withOp)startOperation(cm);if(hasHandler(this,"clear")){var found=this.find();if(found)signalLater(this,"clear",found.from,found.to);}var min=null,max=null;for(var i=0;i < this.lines.length;++i) {var line=this.lines[i];var span=getMarkedSpanFor(line.markedSpans,this);if(cm && !this.collapsed)regLineChange(cm,lineNo(line),"text");else if(cm){if(span.to != null)max = lineNo(line);if(span.from != null)min = lineNo(line);}line.markedSpans = removeMarkedSpan(line.markedSpans,span);if(span.from == null && this.collapsed && !lineIsHidden(this.doc,line) && cm)updateLineHeight(line,textHeight(cm.display));}if(cm && this.collapsed && !cm.options.lineWrapping)for(var i=0;i < this.lines.length;++i) {var visual=visualLine(this.lines[i]),len=lineLength(visual);if(len > cm.display.maxLineLength){cm.display.maxLine = visual;cm.display.maxLineLength = len;cm.display.maxLineChanged = true;}}if(min != null && cm && this.collapsed)regChange(cm,min,max + 1);this.lines.length = 0;this.explicitlyCleared = true;if(this.atomic && this.doc.cantEdit){this.doc.cantEdit = false;if(cm)reCheckSelection(cm.doc);}if(cm)signalLater(cm,"markerCleared",cm,this);if(withOp)endOperation(cm);if(this.parent)this.parent.clear();}; // Find the position of the marker in the document. Returns a {from,
// to} object by default. Side can be passed to get a specific side
// -- 0 (both), -1 (left), or 1 (right). When lineObj is true, the
// Pos objects returned contain a line object, rather than a line
// number (used to prevent looking up the same line twice).
TextMarker.prototype.find = function(side,lineObj){if(side == null && this.type == "bookmark")side = 1;var from,to;for(var i=0;i < this.lines.length;++i) {var line=this.lines[i];var span=getMarkedSpanFor(line.markedSpans,this);if(span.from != null){from = Pos(lineObj?line:lineNo(line),span.from);if(side == -1)return from;}if(span.to != null){to = Pos(lineObj?line:lineNo(line),span.to);if(side == 1)return to;}}return from && {from:from,to:to};}; // Signals that the marker's widget changed, and surrounding layout
// should be recomputed.
TextMarker.prototype.changed = function(){var pos=this.find(-1,true),widget=this,cm=this.doc.cm;if(!pos || !cm)return;runInOp(cm,function(){var line=pos.line,lineN=lineNo(pos.line);var view=findViewForLine(cm,lineN);if(view){clearLineMeasurementCacheFor(view);cm.curOp.selectionChanged = cm.curOp.forceUpdate = true;}cm.curOp.updateMaxLine = true;if(!lineIsHidden(widget.doc,line) && widget.height != null){var oldHeight=widget.height;widget.height = null;var dHeight=widgetHeight(widget) - oldHeight;if(dHeight)updateLineHeight(line,line.height + dHeight);}});};TextMarker.prototype.attachLine = function(line){if(!this.lines.length && this.doc.cm){var op=this.doc.cm.curOp;if(!op.maybeHiddenMarkers || indexOf(op.maybeHiddenMarkers,this) == -1)(op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this);}this.lines.push(line);};TextMarker.prototype.detachLine = function(line){this.lines.splice(indexOf(this.lines,line),1);if(!this.lines.length && this.doc.cm){var op=this.doc.cm.curOp;(op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this);}}; // Collapsed markers have unique ids, in order to be able to order
// them, which is needed for uniquely determining an outer marker
// when they overlap (they may nest, but not partially overlap).
var nextMarkerId=0; // Create a marker, wire it up to the right lines, and
function _markText(doc,from,to,options,type){ // Shared markers (across linked documents) are handled separately
// (markTextShared will call out to this again, once per
// document).
if(options && options.shared)return markTextShared(doc,from,to,options,type); // Ensure we are in an operation.
if(doc.cm && !doc.cm.curOp)return operation(doc.cm,_markText)(doc,from,to,options,type);var marker=new TextMarker(doc,type),diff=cmp(from,to);if(options)copyObj(options,marker,false); // Don't connect empty markers unless clearWhenEmpty is false
if(diff > 0 || diff == 0 && marker.clearWhenEmpty !== false)return marker;if(marker.replacedWith){ // Showing up as a widget implies collapsed (widget replaces text)
marker.collapsed = true;marker.widgetNode = elt("span",[marker.replacedWith],"CodeMirror-widget");if(!options.handleMouseEvents)marker.widgetNode.setAttribute("cm-ignore-events","true");if(options.insertLeft)marker.widgetNode.insertLeft = true;}if(marker.collapsed){if(conflictingCollapsedRange(doc,from.line,from,to,marker) || from.line != to.line && conflictingCollapsedRange(doc,to.line,from,to,marker))throw new Error("Inserting collapsed marker partially overlapping an existing one");sawCollapsedSpans = true;}if(marker.addToHistory)addChangeToHistory(doc,{from:from,to:to,origin:"markText"},doc.sel,NaN);var curLine=from.line,cm=doc.cm,updateMaxLine;doc.iter(curLine,to.line + 1,function(line){if(cm && marker.collapsed && !cm.options.lineWrapping && visualLine(line) == cm.display.maxLine)updateMaxLine = true;if(marker.collapsed && curLine != from.line)updateLineHeight(line,0);addMarkedSpan(line,new MarkedSpan(marker,curLine == from.line?from.ch:null,curLine == to.line?to.ch:null));++curLine;}); // lineIsHidden depends on the presence of the spans, so needs a second pass
if(marker.collapsed)doc.iter(from.line,to.line + 1,function(line){if(lineIsHidden(doc,line))updateLineHeight(line,0);});if(marker.clearOnEnter)on(marker,"beforeCursorEnter",function(){marker.clear();});if(marker.readOnly){sawReadOnlySpans = true;if(doc.history.done.length || doc.history.undone.length)doc.clearHistory();}if(marker.collapsed){marker.id = ++nextMarkerId;marker.atomic = true;}if(cm){ // Sync editor state
if(updateMaxLine)cm.curOp.updateMaxLine = true;if(marker.collapsed)regChange(cm,from.line,to.line + 1);else if(marker.className || marker.title || marker.startStyle || marker.endStyle || marker.css)for(var i=from.line;i <= to.line;i++) regLineChange(cm,i,"text");if(marker.atomic)reCheckSelection(cm.doc);signalLater(cm,"markerAdded",cm,marker);}return marker;} // SHARED TEXTMARKERS
// A shared marker spans multiple linked documents. It is
// implemented as a meta-marker-object controlling multiple normal
// markers.
var SharedTextMarker=CodeMirror.SharedTextMarker = function(markers,primary){this.markers = markers;this.primary = primary;for(var i=0;i < markers.length;++i) markers[i].parent = this;};eventMixin(SharedTextMarker);SharedTextMarker.prototype.clear = function(){if(this.explicitlyCleared)return;this.explicitlyCleared = true;for(var i=0;i < this.markers.length;++i) this.markers[i].clear();signalLater(this,"clear");};SharedTextMarker.prototype.find = function(side,lineObj){return this.primary.find(side,lineObj);};function markTextShared(doc,from,to,options,type){options = copyObj(options);options.shared = false;var markers=[_markText(doc,from,to,options,type)],primary=markers[0];var widget=options.widgetNode;linkedDocs(doc,function(doc){if(widget)options.widgetNode = widget.cloneNode(true);markers.push(_markText(doc,_clipPos(doc,from),_clipPos(doc,to),options,type));for(var i=0;i < doc.linked.length;++i) if(doc.linked[i].isParent)return;primary = lst(markers);});return new SharedTextMarker(markers,primary);}function findSharedMarkers(doc){return doc.findMarks(Pos(doc.first,0),doc.clipPos(Pos(doc.lastLine())),function(m){return m.parent;});}function copySharedMarkers(doc,markers){for(var i=0;i < markers.length;i++) {var marker=markers[i],pos=marker.find();var mFrom=doc.clipPos(pos.from),mTo=doc.clipPos(pos.to);if(cmp(mFrom,mTo)){var subMark=_markText(doc,mFrom,mTo,marker.primary,marker.primary.type);marker.markers.push(subMark);subMark.parent = marker;}}}function detachSharedMarkers(markers){for(var i=0;i < markers.length;i++) {var marker=markers[i],linked=[marker.primary.doc];;linkedDocs(marker.primary.doc,function(d){linked.push(d);});for(var j=0;j < marker.markers.length;j++) {var subMarker=marker.markers[j];if(indexOf(linked,subMarker.doc) == -1){subMarker.parent = null;marker.markers.splice(j--,1);}}}} // TEXTMARKER SPANS
function MarkedSpan(marker,from,to){this.marker = marker;this.from = from;this.to = to;} // Search an array of spans for a span matching the given marker.
function getMarkedSpanFor(spans,marker){if(spans)for(var i=0;i < spans.length;++i) {var span=spans[i];if(span.marker == marker)return span;}} // Remove a span from an array, returning undefined if no spans are
// left (we don't store arrays for lines without spans).
function removeMarkedSpan(spans,span){for(var r,i=0;i < spans.length;++i) if(spans[i] != span)(r || (r = [])).push(spans[i]);return r;} // Add a span to a line.
function addMarkedSpan(line,span){line.markedSpans = line.markedSpans?line.markedSpans.concat([span]):[span];span.marker.attachLine(line);} // Used for the algorithm that adjusts markers for a change in the
// document. These functions cut an array of spans at a given
// character position, returning an array of remaining chunks (or
// undefined if nothing remains).
function markedSpansBefore(old,startCh,isInsert){if(old)for(var i=0,nw;i < old.length;++i) {var span=old[i],marker=span.marker;var startsBefore=span.from == null || (marker.inclusiveLeft?span.from <= startCh:span.from < startCh);if(startsBefore || span.from == startCh && marker.type == "bookmark" && (!isInsert || !span.marker.insertLeft)){var endsAfter=span.to == null || (marker.inclusiveRight?span.to >= startCh:span.to > startCh);(nw || (nw = [])).push(new MarkedSpan(marker,span.from,endsAfter?null:span.to));}}return nw;}function markedSpansAfter(old,endCh,isInsert){if(old)for(var i=0,nw;i < old.length;++i) {var span=old[i],marker=span.marker;var endsAfter=span.to == null || (marker.inclusiveRight?span.to >= endCh:span.to > endCh);if(endsAfter || span.from == endCh && marker.type == "bookmark" && (!isInsert || span.marker.insertLeft)){var startsBefore=span.from == null || (marker.inclusiveLeft?span.from <= endCh:span.from < endCh);(nw || (nw = [])).push(new MarkedSpan(marker,startsBefore?null:span.from - endCh,span.to == null?null:span.to - endCh));}}return nw;} // Given a change object, compute the new set of marker spans that
// cover the line in which the change took place. Removes spans
// entirely within the change, reconnects spans belonging to the
// same marker that appear on both sides of the change, and cuts off
// spans partially within the change. Returns an array of span
// arrays with one element for each line in (after) the change.
function stretchSpansOverChange(doc,change){if(change.full)return null;var oldFirst=isLine(doc,change.from.line) && getLine(doc,change.from.line).markedSpans;var oldLast=isLine(doc,change.to.line) && getLine(doc,change.to.line).markedSpans;if(!oldFirst && !oldLast)return null;var startCh=change.from.ch,endCh=change.to.ch,isInsert=cmp(change.from,change.to) == 0; // Get the spans that 'stick out' on both sides
var first=markedSpansBefore(oldFirst,startCh,isInsert);var last=markedSpansAfter(oldLast,endCh,isInsert); // Next, merge those two ends
var sameLine=change.text.length == 1,offset=lst(change.text).length + (sameLine?startCh:0);if(first){ // Fix up .to properties of first
for(var i=0;i < first.length;++i) {var span=first[i];if(span.to == null){var found=getMarkedSpanFor(last,span.marker);if(!found)span.to = startCh;else if(sameLine)span.to = found.to == null?null:found.to + offset;}}}if(last){ // Fix up .from in last (or move them into first in case of sameLine)
for(var i=0;i < last.length;++i) {var span=last[i];if(span.to != null)span.to += offset;if(span.from == null){var found=getMarkedSpanFor(first,span.marker);if(!found){span.from = offset;if(sameLine)(first || (first = [])).push(span);}}else {span.from += offset;if(sameLine)(first || (first = [])).push(span);}}} // Make sure we didn't create any zero-length spans
if(first)first = clearEmptySpans(first);if(last && last != first)last = clearEmptySpans(last);var newMarkers=[first];if(!sameLine){ // Fill gap with whole-line-spans
var gap=change.text.length - 2,gapMarkers;if(gap > 0 && first)for(var i=0;i < first.length;++i) if(first[i].to == null)(gapMarkers || (gapMarkers = [])).push(new MarkedSpan(first[i].marker,null,null));for(var i=0;i < gap;++i) newMarkers.push(gapMarkers);newMarkers.push(last);}return newMarkers;} // Remove spans that are empty and don't have a clearWhenEmpty
// option of false.
function clearEmptySpans(spans){for(var i=0;i < spans.length;++i) {var span=spans[i];if(span.from != null && span.from == span.to && span.marker.clearWhenEmpty !== false)spans.splice(i--,1);}if(!spans.length)return null;return spans;} // Used for un/re-doing changes from the history. Combines the
// result of computing the existing spans with the set of spans that
// existed in the history (so that deleting around a span and then
// undoing brings back the span).
function mergeOldSpans(doc,change){var old=getOldSpans(doc,change);var stretched=stretchSpansOverChange(doc,change);if(!old)return stretched;if(!stretched)return old;for(var i=0;i < old.length;++i) {var oldCur=old[i],stretchCur=stretched[i];if(oldCur && stretchCur){spans: for(var j=0;j < stretchCur.length;++j) {var span=stretchCur[j];for(var k=0;k < oldCur.length;++k) if(oldCur[k].marker == span.marker)continue spans;oldCur.push(span);}}else if(stretchCur){old[i] = stretchCur;}}return old;} // Used to 'clip' out readOnly ranges when making a change.
function removeReadOnlyRanges(doc,from,to){var markers=null;doc.iter(from.line,to.line + 1,function(line){if(line.markedSpans)for(var i=0;i < line.markedSpans.length;++i) {var mark=line.markedSpans[i].marker;if(mark.readOnly && (!markers || indexOf(markers,mark) == -1))(markers || (markers = [])).push(mark);}});if(!markers)return null;var parts=[{from:from,to:to}];for(var i=0;i < markers.length;++i) {var mk=markers[i],m=mk.find(0);for(var j=0;j < parts.length;++j) {var p=parts[j];if(cmp(p.to,m.from) < 0 || cmp(p.from,m.to) > 0)continue;var newParts=[j,1],dfrom=cmp(p.from,m.from),dto=cmp(p.to,m.to);if(dfrom < 0 || !mk.inclusiveLeft && !dfrom)newParts.push({from:p.from,to:m.from});if(dto > 0 || !mk.inclusiveRight && !dto)newParts.push({from:m.to,to:p.to});parts.splice.apply(parts,newParts);j += newParts.length - 1;}}return parts;} // Connect or disconnect spans from a line.
function detachMarkedSpans(line){var spans=line.markedSpans;if(!spans)return;for(var i=0;i < spans.length;++i) spans[i].marker.detachLine(line);line.markedSpans = null;}function attachMarkedSpans(line,spans){if(!spans)return;for(var i=0;i < spans.length;++i) spans[i].marker.attachLine(line);line.markedSpans = spans;} // Helpers used when computing which overlapping collapsed span
// counts as the larger one.
function extraLeft(marker){return marker.inclusiveLeft?-1:0;}function extraRight(marker){return marker.inclusiveRight?1:0;} // Returns a number indicating which of two overlapping collapsed
// spans is larger (and thus includes the other). Falls back to
// comparing ids when the spans cover exactly the same range.
function compareCollapsedMarkers(a,b){var lenDiff=a.lines.length - b.lines.length;if(lenDiff != 0)return lenDiff;var aPos=a.find(),bPos=b.find();var fromCmp=cmp(aPos.from,bPos.from) || extraLeft(a) - extraLeft(b);if(fromCmp)return -fromCmp;var toCmp=cmp(aPos.to,bPos.to) || extraRight(a) - extraRight(b);if(toCmp)return toCmp;return b.id - a.id;} // Find out whether a line ends or starts in a collapsed span. If
// so, return the marker for that span.
function collapsedSpanAtSide(line,start){var sps=sawCollapsedSpans && line.markedSpans,found;if(sps)for(var sp,i=0;i < sps.length;++i) {sp = sps[i];if(sp.marker.collapsed && (start?sp.from:sp.to) == null && (!found || compareCollapsedMarkers(found,sp.marker) < 0))found = sp.marker;}return found;}function collapsedSpanAtStart(line){return collapsedSpanAtSide(line,true);}function collapsedSpanAtEnd(line){return collapsedSpanAtSide(line,false);} // Test whether there exists a collapsed span that partially
// overlaps (covers the start or end, but not both) of a new span.
// Such overlap is not allowed.
function conflictingCollapsedRange(doc,lineNo,from,to,marker){var line=getLine(doc,lineNo);var sps=sawCollapsedSpans && line.markedSpans;if(sps)for(var i=0;i < sps.length;++i) {var sp=sps[i];if(!sp.marker.collapsed)continue;var found=sp.marker.find(0);var fromCmp=cmp(found.from,from) || extraLeft(sp.marker) - extraLeft(marker);var toCmp=cmp(found.to,to) || extraRight(sp.marker) - extraRight(marker);if(fromCmp >= 0 && toCmp <= 0 || fromCmp <= 0 && toCmp >= 0)continue;if(fromCmp <= 0 && (cmp(found.to,from) > 0 || sp.marker.inclusiveRight && marker.inclusiveLeft) || fromCmp >= 0 && (cmp(found.from,to) < 0 || sp.marker.inclusiveLeft && marker.inclusiveRight))return true;}} // A visual line is a line as drawn on the screen. Folding, for
// example, can cause multiple logical lines to appear on the same
// visual line. This finds the start of the visual line that the
// given line is part of (usually that is the line itself).
function visualLine(line){var merged;while(merged = collapsedSpanAtStart(line)) line = merged.find(-1,true).line;return line;} // Returns an array of logical lines that continue the visual line
// started by the argument, or undefined if there are no such lines.
function visualLineContinued(line){var merged,lines;while(merged = collapsedSpanAtEnd(line)) {line = merged.find(1,true).line;(lines || (lines = [])).push(line);}return lines;} // Get the line number of the start of the visual line that the
// given line number is part of.
function visualLineNo(doc,lineN){var line=getLine(doc,lineN),vis=visualLine(line);if(line == vis)return lineN;return lineNo(vis);} // Get the line number of the start of the next visual line after
// the given line.
function visualLineEndNo(doc,lineN){if(lineN > doc.lastLine())return lineN;var line=getLine(doc,lineN),merged;if(!lineIsHidden(doc,line))return lineN;while(merged = collapsedSpanAtEnd(line)) line = merged.find(1,true).line;return lineNo(line) + 1;} // Compute whether a line is hidden. Lines count as hidden when they
// are part of a visual line that starts with another line, or when
// they are entirely covered by collapsed, non-widget span.
function lineIsHidden(doc,line){var sps=sawCollapsedSpans && line.markedSpans;if(sps)for(var sp,i=0;i < sps.length;++i) {sp = sps[i];if(!sp.marker.collapsed)continue;if(sp.from == null)return true;if(sp.marker.widgetNode)continue;if(sp.from == 0 && sp.marker.inclusiveLeft && lineIsHiddenInner(doc,line,sp))return true;}}function lineIsHiddenInner(_x5,_x6,_x7){var _again2=true;_function2: while(_again2) {var doc=_x5,line=_x6,span=_x7;end = sp = i = undefined;_again2 = false;if(span.to == null){var end=span.marker.find(1,true);_x5 = doc;_x6 = end.line;_x7 = getMarkedSpanFor(end.line.markedSpans,span.marker);_again2 = true;continue _function2;}if(span.marker.inclusiveRight && span.to == line.text.length)return true;for(var sp,i=0;i < line.markedSpans.length;++i) {sp = line.markedSpans[i];if(sp.marker.collapsed && !sp.marker.widgetNode && sp.from == span.to && (sp.to == null || sp.to != span.from) && (sp.marker.inclusiveLeft || span.marker.inclusiveRight) && lineIsHiddenInner(doc,line,sp))return true;}}} // LINE WIDGETS
// Line widgets are block elements displayed above or below a line.
var LineWidget=CodeMirror.LineWidget = function(doc,node,options){if(options)for(var opt in options) if(options.hasOwnProperty(opt))this[opt] = options[opt];this.doc = doc;this.node = node;};eventMixin(LineWidget);function adjustScrollWhenAboveVisible(cm,line,diff){if(_heightAtLine(line) < (cm.curOp && cm.curOp.scrollTop || cm.doc.scrollTop))addToScrollPos(cm,null,diff);}LineWidget.prototype.clear = function(){var cm=this.doc.cm,ws=this.line.widgets,line=this.line,no=lineNo(line);if(no == null || !ws)return;for(var i=0;i < ws.length;++i) if(ws[i] == this)ws.splice(i--,1);if(!ws.length)line.widgets = null;var height=widgetHeight(this);updateLineHeight(line,Math.max(0,line.height - height));if(cm)runInOp(cm,function(){adjustScrollWhenAboveVisible(cm,line,-height);regLineChange(cm,no,"widget");});};LineWidget.prototype.changed = function(){var oldH=this.height,cm=this.doc.cm,line=this.line;this.height = null;var diff=widgetHeight(this) - oldH;if(!diff)return;updateLineHeight(line,line.height + diff);if(cm)runInOp(cm,function(){cm.curOp.forceUpdate = true;adjustScrollWhenAboveVisible(cm,line,diff);});};function widgetHeight(widget){if(widget.height != null)return widget.height;var cm=widget.doc.cm;if(!cm)return 0;if(!contains(document.body,widget.node)){var parentStyle="position: relative;";if(widget.coverGutter)parentStyle += "margin-left: -" + cm.display.gutters.offsetWidth + "px;";if(widget.noHScroll)parentStyle += "width: " + cm.display.wrapper.clientWidth + "px;";removeChildrenAndAdd(cm.display.measure,elt("div",[widget.node],null,parentStyle));}return widget.height = widget.node.offsetHeight;}function addLineWidget(doc,handle,node,options){var widget=new LineWidget(doc,node,options);var cm=doc.cm;if(cm && widget.noHScroll)cm.display.alignWidgets = true;changeLine(doc,handle,"widget",function(line){var widgets=line.widgets || (line.widgets = []);if(widget.insertAt == null)widgets.push(widget);else widgets.splice(Math.min(widgets.length - 1,Math.max(0,widget.insertAt)),0,widget);widget.line = line;if(cm && !lineIsHidden(doc,line)){var aboveVisible=_heightAtLine(line) < doc.scrollTop;updateLineHeight(line,line.height + widgetHeight(widget));if(aboveVisible)addToScrollPos(cm,null,widget.height);cm.curOp.forceUpdate = true;}return true;});return widget;} // LINE DATA STRUCTURE
// Line objects. These hold state related to a line, including
// highlighting info (the styles array).
var Line=CodeMirror.Line = function(text,markedSpans,estimateHeight){this.text = text;attachMarkedSpans(this,markedSpans);this.height = estimateHeight?estimateHeight(this):1;};eventMixin(Line);Line.prototype.lineNo = function(){return lineNo(this);}; // Change the content (text, markers) of a line. Automatically
// invalidates cached information and tries to re-estimate the
// line's height.
function updateLine(line,text,markedSpans,estimateHeight){line.text = text;if(line.stateAfter)line.stateAfter = null;if(line.styles)line.styles = null;if(line.order != null)line.order = null;detachMarkedSpans(line);attachMarkedSpans(line,markedSpans);var estHeight=estimateHeight?estimateHeight(line):1;if(estHeight != line.height)updateLineHeight(line,estHeight);} // Detach a line from the document tree and its markers.
function cleanUpLine(line){line.parent = null;detachMarkedSpans(line);}function extractLineClasses(type,output){if(type)for(;;) {var lineClass=type.match(/(?:^|\s+)line-(background-)?(\S+)/);if(!lineClass)break;type = type.slice(0,lineClass.index) + type.slice(lineClass.index + lineClass[0].length);var prop=lineClass[1]?"bgClass":"textClass";if(output[prop] == null)output[prop] = lineClass[2];else if(!new RegExp("(?:^|\s)" + lineClass[2] + "(?:$|\s)").test(output[prop]))output[prop] += " " + lineClass[2];}return type;}function callBlankLine(mode,state){if(mode.blankLine)return mode.blankLine(state);if(!mode.innerMode)return;var inner=CodeMirror.innerMode(mode,state);if(inner.mode.blankLine)return inner.mode.blankLine(inner.state);}function readToken(mode,stream,state,inner){for(var i=0;i < 10;i++) {if(inner)inner[0] = CodeMirror.innerMode(mode,state).mode;var style=mode.token(stream,state);if(stream.pos > stream.start)return style;}throw new Error("Mode " + mode.name + " failed to advance stream.");} // Utility for getTokenAt and getLineTokens
function takeToken(cm,pos,precise,asArray){function getObj(copy){return {start:stream.start,end:stream.pos,string:stream.current(),type:style || null,state:copy?copyState(doc.mode,state):state};}var doc=cm.doc,mode=doc.mode,style;pos = _clipPos(doc,pos);var line=getLine(doc,pos.line),state=getStateBefore(cm,pos.line,precise);var stream=new StringStream(line.text,cm.options.tabSize),tokens;if(asArray)tokens = [];while((asArray || stream.pos < pos.ch) && !stream.eol()) {stream.start = stream.pos;style = readToken(mode,stream,state);if(asArray)tokens.push(getObj(true));}return asArray?tokens:getObj();} // Run the given mode's parser over a line, calling f for each token.
function runMode(cm,text,mode,state,f,lineClasses,forceToEnd){var flattenSpans=mode.flattenSpans;if(flattenSpans == null)flattenSpans = cm.options.flattenSpans;var curStart=0,curStyle=null;var stream=new StringStream(text,cm.options.tabSize),style;var inner=cm.options.addModeClass && [null];if(text == "")extractLineClasses(callBlankLine(mode,state),lineClasses);while(!stream.eol()) {if(stream.pos > cm.options.maxHighlightLength){flattenSpans = false;if(forceToEnd)processLine(cm,text,state,stream.pos);stream.pos = text.length;style = null;}else {style = extractLineClasses(readToken(mode,stream,state,inner),lineClasses);}if(inner){var mName=inner[0].name;if(mName)style = "m-" + (style?mName + " " + style:mName);}if(!flattenSpans || curStyle != style){while(curStart < stream.start) {curStart = Math.min(stream.start,curStart + 50000);f(curStart,curStyle);}curStyle = style;}stream.start = stream.pos;}while(curStart < stream.pos) { // Webkit seems to refuse to render text nodes longer than 57444 characters
var pos=Math.min(stream.pos,curStart + 50000);f(pos,curStyle);curStart = pos;}} // Compute a style array (an array starting with a mode generation
// -- for invalidation -- followed by pairs of end positions and
// style strings), which is used to highlight the tokens on the
// line.
function highlightLine(cm,line,state,forceToEnd){ // A styles array always starts with a number identifying the
// mode/overlays that it is based on (for easy invalidation).
var st=[cm.state.modeGen],lineClasses={}; // Compute the base array of styles
runMode(cm,line.text,cm.doc.mode,state,function(end,style){st.push(end,style);},lineClasses,forceToEnd); // Run overlays, adjust style array.
for(var o=0;o < cm.state.overlays.length;++o) {var overlay=cm.state.overlays[o],i=1,at=0;runMode(cm,line.text,overlay.mode,true,function(end,style){var start=i; // Ensure there's a token end at the current position, and that i points at it
while(at < end) {var i_end=st[i];if(i_end > end)st.splice(i,1,end,st[i + 1],i_end);i += 2;at = Math.min(end,i_end);}if(!style)return;if(overlay.opaque){st.splice(start,i - start,end,"cm-overlay " + style);i = start + 2;}else {for(;start < i;start += 2) {var cur=st[start + 1];st[start + 1] = (cur?cur + " ":"") + "cm-overlay " + style;}}},lineClasses);}return {styles:st,classes:lineClasses.bgClass || lineClasses.textClass?lineClasses:null};}function getLineStyles(cm,line,updateFrontier){if(!line.styles || line.styles[0] != cm.state.modeGen){var result=highlightLine(cm,line,line.stateAfter = getStateBefore(cm,lineNo(line)));line.styles = result.styles;if(result.classes)line.styleClasses = result.classes;else if(line.styleClasses)line.styleClasses = null;if(updateFrontier === cm.doc.frontier)cm.doc.frontier++;}return line.styles;} // Lightweight form of highlight -- proceed over this line and
// update state, but don't save a style array. Used for lines that
// aren't currently visible.
function processLine(cm,text,state,startAt){var mode=cm.doc.mode;var stream=new StringStream(text,cm.options.tabSize);stream.start = stream.pos = startAt || 0;if(text == "")callBlankLine(mode,state);while(!stream.eol() && stream.pos <= cm.options.maxHighlightLength) {readToken(mode,stream,state);stream.start = stream.pos;}} // Convert a style as returned by a mode (either null, or a string
// containing one or more styles) to a CSS style. This is cached,
// and also looks for line-wide styles.
var styleToClassCache={},styleToClassCacheWithMode={};function interpretTokenStyle(style,options){if(!style || /^\s*$/.test(style))return null;var cache=options.addModeClass?styleToClassCacheWithMode:styleToClassCache;return cache[style] || (cache[style] = style.replace(/\S+/g,"cm-$&"));} // Render the DOM representation of the text of a line. Also builds
// up a 'line map', which points at the DOM nodes that represent
// specific stretches of text, and is used by the measuring code.
// The returned object contains the DOM node, this map, and
// information about line-wide styles that were set by the mode.
function buildLineContent(cm,lineView){ // The padding-right forces the element to have a 'border', which
// is needed on Webkit to be able to get line-level bounding
// rectangles for it (in measureChar).
var content=elt("span",null,null,webkit?"padding-right: .1px":null);var builder={pre:elt("pre",[content]),content:content,col:0,pos:0,cm:cm,splitSpaces:(ie || webkit) && cm.getOption("lineWrapping")};lineView.measure = {}; // Iterate over the logical lines that make up this visual line.
for(var i=0;i <= (lineView.rest?lineView.rest.length:0);i++) {var line=i?lineView.rest[i - 1]:lineView.line,order;builder.pos = 0;builder.addToken = buildToken; // Optionally wire in some hacks into the token-rendering
// algorithm, to deal with browser quirks.
if(hasBadBidiRects(cm.display.measure) && (order = getOrder(line)))builder.addToken = buildTokenBadBidi(builder.addToken,order);builder.map = [];var allowFrontierUpdate=lineView != cm.display.externalMeasured && lineNo(line);insertLineContent(line,builder,getLineStyles(cm,line,allowFrontierUpdate));if(line.styleClasses){if(line.styleClasses.bgClass)builder.bgClass = joinClasses(line.styleClasses.bgClass,builder.bgClass || "");if(line.styleClasses.textClass)builder.textClass = joinClasses(line.styleClasses.textClass,builder.textClass || "");} // Ensure at least a single node is present, for measuring.
if(builder.map.length == 0)builder.map.push(0,0,builder.content.appendChild(zeroWidthElement(cm.display.measure))); // Store the map and a cache object for the current logical line
if(i == 0){lineView.measure.map = builder.map;lineView.measure.cache = {};}else {(lineView.measure.maps || (lineView.measure.maps = [])).push(builder.map);(lineView.measure.caches || (lineView.measure.caches = [])).push({});}} // See issue #2901
if(webkit && /\bcm-tab\b/.test(builder.content.lastChild.className))builder.content.className = "cm-tab-wrap-hack";signal(cm,"renderLine",cm,lineView.line,builder.pre);if(builder.pre.className)builder.textClass = joinClasses(builder.pre.className,builder.textClass || "");return builder;}function defaultSpecialCharPlaceholder(ch){var token=elt("span","•","cm-invalidchar");token.title = "\\u" + ch.charCodeAt(0).toString(16);token.setAttribute("aria-label",token.title);return token;} // Build up the DOM representation for a single token, and add it to
// the line map. Takes care to render special characters separately.
function buildToken(builder,text,style,startStyle,endStyle,title,css){if(!text)return;var displayText=builder.splitSpaces?text.replace(/ {3,}/g,splitSpaces):text;var special=builder.cm.state.specialChars,mustWrap=false;if(!special.test(text)){builder.col += text.length;var content=document.createTextNode(displayText);builder.map.push(builder.pos,builder.pos + text.length,content);if(ie && ie_version < 9)mustWrap = true;builder.pos += text.length;}else {var content=document.createDocumentFragment(),pos=0;while(true) {special.lastIndex = pos;var m=special.exec(text);var skipped=m?m.index - pos:text.length - pos;if(skipped){var txt=document.createTextNode(displayText.slice(pos,pos + skipped));if(ie && ie_version < 9)content.appendChild(elt("span",[txt]));else content.appendChild(txt);builder.map.push(builder.pos,builder.pos + skipped,txt);builder.col += skipped;builder.pos += skipped;}if(!m)break;pos += skipped + 1;if(m[0] == "\t"){var tabSize=builder.cm.options.tabSize,tabWidth=tabSize - builder.col % tabSize;var txt=content.appendChild(elt("span",spaceStr(tabWidth),"cm-tab"));txt.setAttribute("role","presentation");txt.setAttribute("cm-text","\t");builder.col += tabWidth;}else {var txt=builder.cm.options.specialCharPlaceholder(m[0]);txt.setAttribute("cm-text",m[0]);if(ie && ie_version < 9)content.appendChild(elt("span",[txt]));else content.appendChild(txt);builder.col += 1;}builder.map.push(builder.pos,builder.pos + 1,txt);builder.pos++;}}if(style || startStyle || endStyle || mustWrap || css){var fullStyle=style || "";if(startStyle)fullStyle += startStyle;if(endStyle)fullStyle += endStyle;var token=elt("span",[content],fullStyle,css);if(title)token.title = title;return builder.content.appendChild(token);}builder.content.appendChild(content);}function splitSpaces(old){var out=" ";for(var i=0;i < old.length - 2;++i) out += i % 2?" ":" ";out += " ";return out;} // Work around nonsense dimensions being reported for stretches of
// right-to-left text.
function buildTokenBadBidi(inner,order){return function(builder,text,style,startStyle,endStyle,title,css){style = style?style + " cm-force-border":"cm-force-border";var start=builder.pos,end=start + text.length;for(;;) { // Find the part that overlaps with the start of this text
for(var i=0;i < order.length;i++) {var part=order[i];if(part.to > start && part.from <= start)break;}if(part.to >= end)return inner(builder,text,style,startStyle,endStyle,title,css);inner(builder,text.slice(0,part.to - start),style,startStyle,null,title,css);startStyle = null;text = text.slice(part.to - start);start = part.to;}};}function buildCollapsedSpan(builder,size,marker,ignoreWidget){var widget=!ignoreWidget && marker.widgetNode;if(widget)builder.map.push(builder.pos,builder.pos + size,widget);if(!ignoreWidget && builder.cm.display.input.needsContentAttribute){if(!widget)widget = builder.content.appendChild(document.createElement("span"));widget.setAttribute("cm-marker",marker.id);}if(widget){builder.cm.display.input.setUneditable(widget);builder.content.appendChild(widget);}builder.pos += size;} // Outputs a number of spans to make up a line, taking highlighting
// and marked text into account.
function insertLineContent(line,builder,styles){var spans=line.markedSpans,allText=line.text,at=0;if(!spans){for(var i=1;i < styles.length;i += 2) builder.addToken(builder,allText.slice(at,at = styles[i]),interpretTokenStyle(styles[i + 1],builder.cm.options));return;}var len=allText.length,pos=0,i=1,text="",style,css;var nextChange=0,spanStyle,spanEndStyle,spanStartStyle,title,collapsed;for(;;) {if(nextChange == pos){ // Update current marker set
spanStyle = spanEndStyle = spanStartStyle = title = css = "";collapsed = null;nextChange = Infinity;var foundBookmarks=[];for(var j=0;j < spans.length;++j) {var sp=spans[j],m=sp.marker;if(sp.from <= pos && (sp.to == null || sp.to > pos)){if(sp.to != null && nextChange > sp.to){nextChange = sp.to;spanEndStyle = "";}if(m.className)spanStyle += " " + m.className;if(m.css)css = m.css;if(m.startStyle && sp.from == pos)spanStartStyle += " " + m.startStyle;if(m.endStyle && sp.to == nextChange)spanEndStyle += " " + m.endStyle;if(m.title && !title)title = m.title;if(m.collapsed && (!collapsed || compareCollapsedMarkers(collapsed.marker,m) < 0))collapsed = sp;}else if(sp.from > pos && nextChange > sp.from){nextChange = sp.from;}if(m.type == "bookmark" && sp.from == pos && m.widgetNode)foundBookmarks.push(m);}if(collapsed && (collapsed.from || 0) == pos){buildCollapsedSpan(builder,(collapsed.to == null?len + 1:collapsed.to) - pos,collapsed.marker,collapsed.from == null);if(collapsed.to == null)return;}if(!collapsed && foundBookmarks.length)for(var j=0;j < foundBookmarks.length;++j) buildCollapsedSpan(builder,0,foundBookmarks[j]);}if(pos >= len)break;var upto=Math.min(len,nextChange);while(true) {if(text){var end=pos + text.length;if(!collapsed){var tokenText=end > upto?text.slice(0,upto - pos):text;builder.addToken(builder,tokenText,style?style + spanStyle:spanStyle,spanStartStyle,pos + tokenText.length == nextChange?spanEndStyle:"",title,css);}if(end >= upto){text = text.slice(upto - pos);pos = upto;break;}pos = end;spanStartStyle = "";}text = allText.slice(at,at = styles[i++]);style = interpretTokenStyle(styles[i++],builder.cm.options);}}} // DOCUMENT DATA STRUCTURE
// By default, updates that start and end at the beginning of a line
// are treated specially, in order to make the association of line
// widgets and marker elements with the text behave more intuitive.
function isWholeLineUpdate(doc,change){return change.from.ch == 0 && change.to.ch == 0 && lst(change.text) == "" && (!doc.cm || doc.cm.options.wholeLineUpdateBefore);} // Perform a change on the document data structure.
function updateDoc(doc,change,markedSpans,estimateHeight){function spansFor(n){return markedSpans?markedSpans[n]:null;}function update(line,text,spans){updateLine(line,text,spans,estimateHeight);signalLater(line,"change",line,change);}function linesFor(start,end){for(var i=start,result=[];i < end;++i) result.push(new Line(text[i],spansFor(i),estimateHeight));return result;}var from=change.from,to=change.to,text=change.text;var firstLine=getLine(doc,from.line),lastLine=getLine(doc,to.line);var lastText=lst(text),lastSpans=spansFor(text.length - 1),nlines=to.line - from.line; // Adjust the line structure
if(change.full){doc.insert(0,linesFor(0,text.length));doc.remove(text.length,doc.size - text.length);}else if(isWholeLineUpdate(doc,change)){ // This is a whole-line replace. Treated specially to make
// sure line objects move the way they are supposed to.
var added=linesFor(0,text.length - 1);update(lastLine,lastLine.text,lastSpans);if(nlines)doc.remove(from.line,nlines);if(added.length)doc.insert(from.line,added);}else if(firstLine == lastLine){if(text.length == 1){update(firstLine,firstLine.text.slice(0,from.ch) + lastText + firstLine.text.slice(to.ch),lastSpans);}else {var added=linesFor(1,text.length - 1);added.push(new Line(lastText + firstLine.text.slice(to.ch),lastSpans,estimateHeight));update(firstLine,firstLine.text.slice(0,from.ch) + text[0],spansFor(0));doc.insert(from.line + 1,added);}}else if(text.length == 1){update(firstLine,firstLine.text.slice(0,from.ch) + text[0] + lastLine.text.slice(to.ch),spansFor(0));doc.remove(from.line + 1,nlines);}else {update(firstLine,firstLine.text.slice(0,from.ch) + text[0],spansFor(0));update(lastLine,lastText + lastLine.text.slice(to.ch),lastSpans);var added=linesFor(1,text.length - 1);if(nlines > 1)doc.remove(from.line + 1,nlines - 1);doc.insert(from.line + 1,added);}signalLater(doc,"change",doc,change);} // The document is represented as a BTree consisting of leaves, with
// chunk of lines in them, and branches, with up to ten leaves or
// other branch nodes below them. The top node is always a branch
// node, and is the document object itself (meaning it has
// additional methods and properties).
//
// All nodes have parent links. The tree is used both to go from
// line numbers to line objects, and to go from objects to numbers.
// It also indexes by height, and is used to convert between height
// and line object, and to find the total height of the document.
//
// See also http://marijnhaverbeke.nl/blog/codemirror-line-tree.html
function LeafChunk(lines){this.lines = lines;this.parent = null;for(var i=0,height=0;i < lines.length;++i) {lines[i].parent = this;height += lines[i].height;}this.height = height;}LeafChunk.prototype = {chunkSize:function chunkSize(){return this.lines.length;}, // Remove the n lines at offset 'at'.
removeInner:function removeInner(at,n){for(var i=at,e=at + n;i < e;++i) {var line=this.lines[i];this.height -= line.height;cleanUpLine(line);signalLater(line,"delete");}this.lines.splice(at,n);}, // Helper used to collapse a small branch into a single leaf.
collapse:function collapse(lines){lines.push.apply(lines,this.lines);}, // Insert the given array of lines at offset 'at', count them as
// having the given height.
insertInner:function insertInner(at,lines,height){this.height += height;this.lines = this.lines.slice(0,at).concat(lines).concat(this.lines.slice(at));for(var i=0;i < lines.length;++i) lines[i].parent = this;}, // Used to iterate over a part of the tree.
iterN:function iterN(at,n,op){for(var e=at + n;at < e;++at) if(op(this.lines[at]))return true;}};function BranchChunk(children){this.children = children;var size=0,height=0;for(var i=0;i < children.length;++i) {var ch=children[i];size += ch.chunkSize();height += ch.height;ch.parent = this;}this.size = size;this.height = height;this.parent = null;}BranchChunk.prototype = {chunkSize:function chunkSize(){return this.size;},removeInner:function removeInner(at,n){this.size -= n;for(var i=0;i < this.children.length;++i) {var child=this.children[i],sz=child.chunkSize();if(at < sz){var rm=Math.min(n,sz - at),oldHeight=child.height;child.removeInner(at,rm);this.height -= oldHeight - child.height;if(sz == rm){this.children.splice(i--,1);child.parent = null;}if((n -= rm) == 0)break;at = 0;}else at -= sz;} // If the result is smaller than 25 lines, ensure that it is a
// single leaf node.
if(this.size - n < 25 && (this.children.length > 1 || !(this.children[0] instanceof LeafChunk))){var lines=[];this.collapse(lines);this.children = [new LeafChunk(lines)];this.children[0].parent = this;}},collapse:function collapse(lines){for(var i=0;i < this.children.length;++i) this.children[i].collapse(lines);},insertInner:function insertInner(at,lines,height){this.size += lines.length;this.height += height;for(var i=0;i < this.children.length;++i) {var child=this.children[i],sz=child.chunkSize();if(at <= sz){child.insertInner(at,lines,height);if(child.lines && child.lines.length > 50){while(child.lines.length > 50) {var spilled=child.lines.splice(child.lines.length - 25,25);var newleaf=new LeafChunk(spilled);child.height -= newleaf.height;this.children.splice(i + 1,0,newleaf);newleaf.parent = this;}this.maybeSpill();}break;}at -= sz;}}, // When a node has grown, check whether it should be split.
maybeSpill:function maybeSpill(){if(this.children.length <= 10)return;var me=this;do {var spilled=me.children.splice(me.children.length - 5,5);var sibling=new BranchChunk(spilled);if(!me.parent){ // Become the parent node
var copy=new BranchChunk(me.children);copy.parent = me;me.children = [copy,sibling];me = copy;}else {me.size -= sibling.size;me.height -= sibling.height;var myIndex=indexOf(me.parent.children,me);me.parent.children.splice(myIndex + 1,0,sibling);}sibling.parent = me.parent;}while(me.children.length > 10);me.parent.maybeSpill();},iterN:function iterN(at,n,op){for(var i=0;i < this.children.length;++i) {var child=this.children[i],sz=child.chunkSize();if(at < sz){var used=Math.min(n,sz - at);if(child.iterN(at,used,op))return true;if((n -= used) == 0)break;at = 0;}else at -= sz;}}};var nextDocId=0;var Doc=CodeMirror.Doc = function(text,mode,firstLine){if(!(this instanceof Doc))return new Doc(text,mode,firstLine);if(firstLine == null)firstLine = 0;BranchChunk.call(this,[new LeafChunk([new Line("",null)])]);this.first = firstLine;this.scrollTop = this.scrollLeft = 0;this.cantEdit = false;this.cleanGeneration = 1;this.frontier = firstLine;var start=Pos(firstLine,0);this.sel = simpleSelection(start);this.history = new History(null);this.id = ++nextDocId;this.modeOption = mode;if(typeof text == "string")text = splitLines(text);updateDoc(this,{from:start,to:start,text:text});setSelection(this,simpleSelection(start),sel_dontScroll);};Doc.prototype = createObj(BranchChunk.prototype,{constructor:Doc, // Iterate over the document. Supports two forms -- with only one
// argument, it calls that for each line in the document. With
// three, it iterates over the range given by the first two (with
// the second being non-inclusive).
iter:function iter(from,to,op){if(op)this.iterN(from - this.first,to - from,op);else this.iterN(this.first,this.first + this.size,from);}, // Non-public interface for adding and removing lines.
insert:function insert(at,lines){var height=0;for(var i=0;i < lines.length;++i) height += lines[i].height;this.insertInner(at - this.first,lines,height);},remove:function remove(at,n){this.removeInner(at - this.first,n);}, // From here, the methods are part of the public interface. Most
// are also available from CodeMirror (editor) instances.
getValue:function getValue(lineSep){var lines=getLines(this,this.first,this.first + this.size);if(lineSep === false)return lines;return lines.join(lineSep || "\n");},setValue:docMethodOp(function(code){var top=Pos(this.first,0),last=this.first + this.size - 1;makeChange(this,{from:top,to:Pos(last,getLine(this,last).text.length),text:splitLines(code),origin:"setValue",full:true},true);setSelection(this,simpleSelection(top));}),replaceRange:function replaceRange(code,from,to,origin){from = _clipPos(this,from);to = to?_clipPos(this,to):from;_replaceRange(this,code,from,to,origin);},getRange:function getRange(from,to,lineSep){var lines=getBetween(this,_clipPos(this,from),_clipPos(this,to));if(lineSep === false)return lines;return lines.join(lineSep || "\n");},getLine:function getLine(line){var l=this.getLineHandle(line);return l && l.text;},getLineHandle:function getLineHandle(line){if(isLine(this,line))return getLine(this,line);},getLineNumber:function getLineNumber(line){return lineNo(line);},getLineHandleVisualStart:function getLineHandleVisualStart(line){if(typeof line == "number")line = getLine(this,line);return visualLine(line);},lineCount:function lineCount(){return this.size;},firstLine:function firstLine(){return this.first;},lastLine:function lastLine(){return this.first + this.size - 1;},clipPos:function clipPos(pos){return _clipPos(this,pos);},getCursor:function getCursor(start){var range=this.sel.primary(),pos;if(start == null || start == "head")pos = range.head;else if(start == "anchor")pos = range.anchor;else if(start == "end" || start == "to" || start === false)pos = range.to();else pos = range.from();return pos;},listSelections:function listSelections(){return this.sel.ranges;},somethingSelected:function somethingSelected(){return this.sel.somethingSelected();},setCursor:docMethodOp(function(line,ch,options){setSimpleSelection(this,_clipPos(this,typeof line == "number"?Pos(line,ch || 0):line),null,options);}),setSelection:docMethodOp(function(anchor,head,options){setSimpleSelection(this,_clipPos(this,anchor),_clipPos(this,head || anchor),options);}),extendSelection:docMethodOp(function(head,other,options){extendSelection(this,_clipPos(this,head),other && _clipPos(this,other),options);}),extendSelections:docMethodOp(function(heads,options){extendSelections(this,clipPosArray(this,heads,options));}),extendSelectionsBy:docMethodOp(function(f,options){extendSelections(this,map(this.sel.ranges,f),options);}),setSelections:docMethodOp(function(ranges,primary,options){if(!ranges.length)return;for(var i=0,out=[];i < ranges.length;i++) out[i] = new Range(_clipPos(this,ranges[i].anchor),_clipPos(this,ranges[i].head));if(primary == null)primary = Math.min(ranges.length - 1,this.sel.primIndex);setSelection(this,normalizeSelection(out,primary),options);}),addSelection:docMethodOp(function(anchor,head,options){var ranges=this.sel.ranges.slice(0);ranges.push(new Range(_clipPos(this,anchor),_clipPos(this,head || anchor)));setSelection(this,normalizeSelection(ranges,ranges.length - 1),options);}),getSelection:function getSelection(lineSep){var ranges=this.sel.ranges,lines;for(var i=0;i < ranges.length;i++) {var sel=getBetween(this,ranges[i].from(),ranges[i].to());lines = lines?lines.concat(sel):sel;}if(lineSep === false)return lines;else return lines.join(lineSep || "\n");},getSelections:function getSelections(lineSep){var parts=[],ranges=this.sel.ranges;for(var i=0;i < ranges.length;i++) {var sel=getBetween(this,ranges[i].from(),ranges[i].to());if(lineSep !== false)sel = sel.join(lineSep || "\n");parts[i] = sel;}return parts;},replaceSelection:function replaceSelection(code,collapse,origin){var dup=[];for(var i=0;i < this.sel.ranges.length;i++) dup[i] = code;this.replaceSelections(dup,collapse,origin || "+input");},replaceSelections:docMethodOp(function(code,collapse,origin){var changes=[],sel=this.sel;for(var i=0;i < sel.ranges.length;i++) {var range=sel.ranges[i];changes[i] = {from:range.from(),to:range.to(),text:splitLines(code[i]),origin:origin};}var newSel=collapse && collapse != "end" && computeReplacedSel(this,changes,collapse);for(var i=changes.length - 1;i >= 0;i--) makeChange(this,changes[i]);if(newSel)setSelectionReplaceHistory(this,newSel);else if(this.cm)ensureCursorVisible(this.cm);}),undo:docMethodOp(function(){makeChangeFromHistory(this,"undo");}),redo:docMethodOp(function(){makeChangeFromHistory(this,"redo");}),undoSelection:docMethodOp(function(){makeChangeFromHistory(this,"undo",true);}),redoSelection:docMethodOp(function(){makeChangeFromHistory(this,"redo",true);}),setExtending:function setExtending(val){this.extend = val;},getExtending:function getExtending(){return this.extend;},historySize:function historySize(){var hist=this.history,done=0,undone=0;for(var i=0;i < hist.done.length;i++) if(!hist.done[i].ranges)++done;for(var i=0;i < hist.undone.length;i++) if(!hist.undone[i].ranges)++undone;return {undo:done,redo:undone};},clearHistory:function clearHistory(){this.history = new History(this.history.maxGeneration);},markClean:function markClean(){this.cleanGeneration = this.changeGeneration(true);},changeGeneration:function changeGeneration(forceSplit){if(forceSplit)this.history.lastOp = this.history.lastSelOp = this.history.lastOrigin = null;return this.history.generation;},isClean:function isClean(gen){return this.history.generation == (gen || this.cleanGeneration);},getHistory:function getHistory(){return {done:copyHistoryArray(this.history.done),undone:copyHistoryArray(this.history.undone)};},setHistory:function setHistory(histData){var hist=this.history = new History(this.history.maxGeneration);hist.done = copyHistoryArray(histData.done.slice(0),null,true);hist.undone = copyHistoryArray(histData.undone.slice(0),null,true);},addLineClass:docMethodOp(function(handle,where,cls){return changeLine(this,handle,where == "gutter"?"gutter":"class",function(line){var prop=where == "text"?"textClass":where == "background"?"bgClass":where == "gutter"?"gutterClass":"wrapClass";if(!line[prop])line[prop] = cls;else if(classTest(cls).test(line[prop]))return false;else line[prop] += " " + cls;return true;});}),removeLineClass:docMethodOp(function(handle,where,cls){return changeLine(this,handle,where == "gutter"?"gutter":"class",function(line){var prop=where == "text"?"textClass":where == "background"?"bgClass":where == "gutter"?"gutterClass":"wrapClass";var cur=line[prop];if(!cur)return false;else if(cls == null)line[prop] = null;else {var found=cur.match(classTest(cls));if(!found)return false;var end=found.index + found[0].length;line[prop] = cur.slice(0,found.index) + (!found.index || end == cur.length?"":" ") + cur.slice(end) || null;}return true;});}),addLineWidget:docMethodOp(function(handle,node,options){return addLineWidget(this,handle,node,options);}),removeLineWidget:function removeLineWidget(widget){widget.clear();},markText:function markText(from,to,options){return _markText(this,_clipPos(this,from),_clipPos(this,to),options,"range");},setBookmark:function setBookmark(pos,options){var realOpts={replacedWith:options && (options.nodeType == null?options.widget:options),insertLeft:options && options.insertLeft,clearWhenEmpty:false,shared:options && options.shared,handleMouseEvents:options && options.handleMouseEvents};pos = _clipPos(this,pos);return _markText(this,pos,pos,realOpts,"bookmark");},findMarksAt:function findMarksAt(pos){pos = _clipPos(this,pos);var markers=[],spans=getLine(this,pos.line).markedSpans;if(spans)for(var i=0;i < spans.length;++i) {var span=spans[i];if((span.from == null || span.from <= pos.ch) && (span.to == null || span.to >= pos.ch))markers.push(span.marker.parent || span.marker);}return markers;},findMarks:function findMarks(from,to,filter){from = _clipPos(this,from);to = _clipPos(this,to);var found=[],lineNo=from.line;this.iter(from.line,to.line + 1,function(line){var spans=line.markedSpans;if(spans)for(var i=0;i < spans.length;i++) {var span=spans[i];if(!(lineNo == from.line && from.ch > span.to || span.from == null && lineNo != from.line || lineNo == to.line && span.from > to.ch) && (!filter || filter(span.marker)))found.push(span.marker.parent || span.marker);}++lineNo;});return found;},getAllMarks:function getAllMarks(){var markers=[];this.iter(function(line){var sps=line.markedSpans;if(sps)for(var i=0;i < sps.length;++i) if(sps[i].from != null)markers.push(sps[i].marker);});return markers;},posFromIndex:function posFromIndex(off){var ch,lineNo=this.first;this.iter(function(line){var sz=line.text.length + 1;if(sz > off){ch = off;return true;}off -= sz;++lineNo;});return _clipPos(this,Pos(lineNo,ch));},indexFromPos:function indexFromPos(coords){coords = _clipPos(this,coords);var index=coords.ch;if(coords.line < this.first || coords.ch < 0)return 0;this.iter(this.first,coords.line,function(line){index += line.text.length + 1;});return index;},copy:function copy(copyHistory){var doc=new Doc(getLines(this,this.first,this.first + this.size),this.modeOption,this.first);doc.scrollTop = this.scrollTop;doc.scrollLeft = this.scrollLeft;doc.sel = this.sel;doc.extend = false;if(copyHistory){doc.history.undoDepth = this.history.undoDepth;doc.setHistory(this.getHistory());}return doc;},linkedDoc:function linkedDoc(options){if(!options)options = {};var from=this.first,to=this.first + this.size;if(options.from != null && options.from > from)from = options.from;if(options.to != null && options.to < to)to = options.to;var copy=new Doc(getLines(this,from,to),options.mode || this.modeOption,from);if(options.sharedHist)copy.history = this.history;(this.linked || (this.linked = [])).push({doc:copy,sharedHist:options.sharedHist});copy.linked = [{doc:this,isParent:true,sharedHist:options.sharedHist}];copySharedMarkers(copy,findSharedMarkers(this));return copy;},unlinkDoc:function unlinkDoc(other){if(other instanceof CodeMirror)other = other.doc;if(this.linked)for(var i=0;i < this.linked.length;++i) {var link=this.linked[i];if(link.doc != other)continue;this.linked.splice(i,1);other.unlinkDoc(this);detachSharedMarkers(findSharedMarkers(this));break;} // If the histories were shared, split them again
if(other.history == this.history){var splitIds=[other.id];linkedDocs(other,function(doc){splitIds.push(doc.id);},true);other.history = new History(null);other.history.done = copyHistoryArray(this.history.done,splitIds);other.history.undone = copyHistoryArray(this.history.undone,splitIds);}},iterLinkedDocs:function iterLinkedDocs(f){linkedDocs(this,f);},getMode:function getMode(){return this.mode;},getEditor:function getEditor(){return this.cm;}}); // Public alias.
Doc.prototype.eachLine = Doc.prototype.iter; // Set up methods on CodeMirror's prototype to redirect to the editor's document.
var dontDelegate="iter insert remove copy getEditor".split(" ");for(var prop in Doc.prototype) if(Doc.prototype.hasOwnProperty(prop) && indexOf(dontDelegate,prop) < 0)CodeMirror.prototype[prop] = (function(method){return function(){return method.apply(this.doc,arguments);};})(Doc.prototype[prop]);eventMixin(Doc); // Call f for all linked documents.
function linkedDocs(doc,f,sharedHistOnly){function propagate(doc,skip,sharedHist){if(doc.linked)for(var i=0;i < doc.linked.length;++i) {var rel=doc.linked[i];if(rel.doc == skip)continue;var shared=sharedHist && rel.sharedHist;if(sharedHistOnly && !shared)continue;f(rel.doc,shared);propagate(rel.doc,doc,shared);}}propagate(doc,null,true);} // Attach a document to an editor.
function attachDoc(cm,doc){if(doc.cm)throw new Error("This document is already in use.");cm.doc = doc;doc.cm = cm;estimateLineHeights(cm);loadMode(cm);if(!cm.options.lineWrapping)findMaxLine(cm);cm.options.mode = doc.modeOption;regChange(cm);} // LINE UTILITIES
// Find the line object corresponding to the given line number.
function getLine(doc,n){n -= doc.first;if(n < 0 || n >= doc.size)throw new Error("There is no line " + (n + doc.first) + " in the document.");for(var chunk=doc;!chunk.lines;) {for(var i=0;;++i) {var child=chunk.children[i],sz=child.chunkSize();if(n < sz){chunk = child;break;}n -= sz;}}return chunk.lines[n];} // Get the part of a document between two positions, as an array of
// strings.
function getBetween(doc,start,end){var out=[],n=start.line;doc.iter(start.line,end.line + 1,function(line){var text=line.text;if(n == end.line)text = text.slice(0,end.ch);if(n == start.line)text = text.slice(start.ch);out.push(text);++n;});return out;} // Get the lines between from and to, as array of strings.
function getLines(doc,from,to){var out=[];doc.iter(from,to,function(line){out.push(line.text);});return out;} // Update the height of a line, propagating the height change
// upwards to parent nodes.
function updateLineHeight(line,height){var diff=height - line.height;if(diff)for(var n=line;n;n = n.parent) n.height += diff;} // Given a line object, find its line number by walking up through
// its parent links.
function lineNo(line){if(line.parent == null)return null;var cur=line.parent,no=indexOf(cur.lines,line);for(var chunk=cur.parent;chunk;cur = chunk,chunk = chunk.parent) {for(var i=0;;++i) {if(chunk.children[i] == cur)break;no += chunk.children[i].chunkSize();}}return no + cur.first;} // Find the line at the given vertical position, using the height
// information in the document tree.
function _lineAtHeight(chunk,h){var n=chunk.first;outer: do {for(var i=0;i < chunk.children.length;++i) {var child=chunk.children[i],ch=child.height;if(h < ch){chunk = child;continue outer;}h -= ch;n += child.chunkSize();}return n;}while(!chunk.lines);for(var i=0;i < chunk.lines.length;++i) {var line=chunk.lines[i],lh=line.height;if(h < lh)break;h -= lh;}return n + i;} // Find the height above the given line.
function _heightAtLine(lineObj){lineObj = visualLine(lineObj);var h=0,chunk=lineObj.parent;for(var i=0;i < chunk.lines.length;++i) {var line=chunk.lines[i];if(line == lineObj)break;else h += line.height;}for(var p=chunk.parent;p;chunk = p,p = chunk.parent) {for(var i=0;i < p.children.length;++i) {var cur=p.children[i];if(cur == chunk)break;else h += cur.height;}}return h;} // Get the bidi ordering for the given line (and cache it). Returns
// false for lines that are fully left-to-right, and an array of
// BidiSpan objects otherwise.
function getOrder(line){var order=line.order;if(order == null)order = line.order = bidiOrdering(line.text);return order;} // HISTORY
function History(startGen){ // Arrays of change events and selections. Doing something adds an
// event to done and clears undo. Undoing moves events from done
// to undone, redoing moves them in the other direction.
this.done = [];this.undone = [];this.undoDepth = Infinity; // Used to track when changes can be merged into a single undo
// event
this.lastModTime = this.lastSelTime = 0;this.lastOp = this.lastSelOp = null;this.lastOrigin = this.lastSelOrigin = null; // Used by the isClean() method
this.generation = this.maxGeneration = startGen || 1;} // Create a history change event from an updateDoc-style change
// object.
function historyChangeFromChange(doc,change){var histChange={from:copyPos(change.from),to:changeEnd(change),text:getBetween(doc,change.from,change.to)};attachLocalSpans(doc,histChange,change.from.line,change.to.line + 1);linkedDocs(doc,function(doc){attachLocalSpans(doc,histChange,change.from.line,change.to.line + 1);},true);return histChange;} // Pop all selection events off the end of a history array. Stop at
// a change event.
function clearSelectionEvents(array){while(array.length) {var last=lst(array);if(last.ranges)array.pop();else break;}} // Find the top change event in the history. Pop off selection
// events that are in the way.
function lastChangeEvent(hist,force){if(force){clearSelectionEvents(hist.done);return lst(hist.done);}else if(hist.done.length && !lst(hist.done).ranges){return lst(hist.done);}else if(hist.done.length > 1 && !hist.done[hist.done.length - 2].ranges){hist.done.pop();return lst(hist.done);}} // Register a change in the history. Merges changes that are within
// a single operation, ore are close together with an origin that
// allows merging (starting with "+") into a single event.
function addChangeToHistory(doc,change,selAfter,opId){var hist=doc.history;hist.undone.length = 0;var time=+new Date(),cur;if((hist.lastOp == opId || hist.lastOrigin == change.origin && change.origin && (change.origin.charAt(0) == "+" && doc.cm && hist.lastModTime > time - doc.cm.options.historyEventDelay || change.origin.charAt(0) == "*")) && (cur = lastChangeEvent(hist,hist.lastOp == opId))){ // Merge this change into the last event
var last=lst(cur.changes);if(cmp(change.from,change.to) == 0 && cmp(change.from,last.to) == 0){ // Optimized case for simple insertion -- don't want to add
// new changesets for every character typed
last.to = changeEnd(change);}else { // Add new sub-event
cur.changes.push(historyChangeFromChange(doc,change));}}else { // Can not be merged, start a new event.
var before=lst(hist.done);if(!before || !before.ranges)pushSelectionToHistory(doc.sel,hist.done);cur = {changes:[historyChangeFromChange(doc,change)],generation:hist.generation};hist.done.push(cur);while(hist.done.length > hist.undoDepth) {hist.done.shift();if(!hist.done[0].ranges)hist.done.shift();}}hist.done.push(selAfter);hist.generation = ++hist.maxGeneration;hist.lastModTime = hist.lastSelTime = time;hist.lastOp = hist.lastSelOp = opId;hist.lastOrigin = hist.lastSelOrigin = change.origin;if(!last)signal(doc,"historyAdded");}function selectionEventCanBeMerged(doc,origin,prev,sel){var ch=origin.charAt(0);return ch == "*" || ch == "+" && prev.ranges.length == sel.ranges.length && prev.somethingSelected() == sel.somethingSelected() && new Date() - doc.history.lastSelTime <= (doc.cm?doc.cm.options.historyEventDelay:500);} // Called whenever the selection changes, sets the new selection as
// the pending selection in the history, and pushes the old pending
// selection into the 'done' array when it was significantly
// different (in number of selected ranges, emptiness, or time).
function addSelectionToHistory(doc,sel,opId,options){var hist=doc.history,origin=options && options.origin; // A new event is started when the previous origin does not match
// the current, or the origins don't allow matching. Origins
// starting with * are always merged, those starting with + are
// merged when similar and close together in time.
if(opId == hist.lastSelOp || origin && hist.lastSelOrigin == origin && (hist.lastModTime == hist.lastSelTime && hist.lastOrigin == origin || selectionEventCanBeMerged(doc,origin,lst(hist.done),sel)))hist.done[hist.done.length - 1] = sel;else pushSelectionToHistory(sel,hist.done);hist.lastSelTime = +new Date();hist.lastSelOrigin = origin;hist.lastSelOp = opId;if(options && options.clearRedo !== false)clearSelectionEvents(hist.undone);}function pushSelectionToHistory(sel,dest){var top=lst(dest);if(!(top && top.ranges && top.equals(sel)))dest.push(sel);} // Used to store marked span information in the history.
function attachLocalSpans(doc,change,from,to){var existing=change["spans_" + doc.id],n=0;doc.iter(Math.max(doc.first,from),Math.min(doc.first + doc.size,to),function(line){if(line.markedSpans)(existing || (existing = change["spans_" + doc.id] = {}))[n] = line.markedSpans;++n;});} // When un/re-doing restores text containing marked spans, those
// that have been explicitly cleared should not be restored.
function removeClearedSpans(spans){if(!spans)return null;for(var i=0,out;i < spans.length;++i) {if(spans[i].marker.explicitlyCleared){if(!out)out = spans.slice(0,i);}else if(out)out.push(spans[i]);}return !out?spans:out.length?out:null;} // Retrieve and filter the old marked spans stored in a change event.
function getOldSpans(doc,change){var found=change["spans_" + doc.id];if(!found)return null;for(var i=0,nw=[];i < change.text.length;++i) nw.push(removeClearedSpans(found[i]));return nw;} // Used both to provide a JSON-safe object in .getHistory, and, when
// detaching a document, to split the history in two
function copyHistoryArray(events,newGroup,instantiateSel){for(var i=0,copy=[];i < events.length;++i) {var event=events[i];if(event.ranges){copy.push(instantiateSel?Selection.prototype.deepCopy.call(event):event);continue;}var changes=event.changes,newChanges=[];copy.push({changes:newChanges});for(var j=0;j < changes.length;++j) {var change=changes[j],m;newChanges.push({from:change.from,to:change.to,text:change.text});if(newGroup)for(var prop in change) if(m = prop.match(/^spans_(\d+)$/)){if(indexOf(newGroup,Number(m[1])) > -1){lst(newChanges)[prop] = change[prop];delete change[prop];}}}}return copy;} // Rebasing/resetting history to deal with externally-sourced changes
function rebaseHistSelSingle(pos,from,to,diff){if(to < pos.line){pos.line += diff;}else if(from < pos.line){pos.line = from;pos.ch = 0;}} // Tries to rebase an array of history events given a change in the
// document. If the change touches the same lines as the event, the
// event, and everything 'behind' it, is discarded. If the change is
// before the event, the event's positions are updated. Uses a
// copy-on-write scheme for the positions, to avoid having to
// reallocate them all on every rebase, but also avoid problems with
// shared position objects being unsafely updated.
function rebaseHistArray(array,from,to,diff){for(var i=0;i < array.length;++i) {var sub=array[i],ok=true;if(sub.ranges){if(!sub.copied){sub = array[i] = sub.deepCopy();sub.copied = true;}for(var j=0;j < sub.ranges.length;j++) {rebaseHistSelSingle(sub.ranges[j].anchor,from,to,diff);rebaseHistSelSingle(sub.ranges[j].head,from,to,diff);}continue;}for(var j=0;j < sub.changes.length;++j) {var cur=sub.changes[j];if(to < cur.from.line){cur.from = Pos(cur.from.line + diff,cur.from.ch);cur.to = Pos(cur.to.line + diff,cur.to.ch);}else if(from <= cur.to.line){ok = false;break;}}if(!ok){array.splice(0,i + 1);i = 0;}}}function rebaseHist(hist,change){var from=change.from.line,to=change.to.line,diff=change.text.length - (to - from) - 1;rebaseHistArray(hist.done,from,to,diff);rebaseHistArray(hist.undone,from,to,diff);} // EVENT UTILITIES
// Due to the fact that we still support jurassic IE versions, some
// compatibility wrappers are needed.
var e_preventDefault=CodeMirror.e_preventDefault = function(e){if(e.preventDefault)e.preventDefault();else e.returnValue = false;};var e_stopPropagation=CodeMirror.e_stopPropagation = function(e){if(e.stopPropagation)e.stopPropagation();else e.cancelBubble = true;};function e_defaultPrevented(e){return e.defaultPrevented != null?e.defaultPrevented:e.returnValue == false;}var e_stop=CodeMirror.e_stop = function(e){e_preventDefault(e);e_stopPropagation(e);};function e_target(e){return e.target || e.srcElement;}function e_button(e){var b=e.which;if(b == null){if(e.button & 1)b = 1;else if(e.button & 2)b = 3;else if(e.button & 4)b = 2;}if(mac && e.ctrlKey && b == 1)b = 3;return b;} // EVENT HANDLING
// Lightweight event framework. on/off also work on DOM nodes,
// registering native DOM handlers.
var on=CodeMirror.on = function(emitter,type,f){if(emitter.addEventListener)emitter.addEventListener(type,f,false);else if(emitter.attachEvent)emitter.attachEvent("on" + type,f);else {var map=emitter._handlers || (emitter._handlers = {});var arr=map[type] || (map[type] = []);arr.push(f);}};var off=CodeMirror.off = function(emitter,type,f){if(emitter.removeEventListener)emitter.removeEventListener(type,f,false);else if(emitter.detachEvent)emitter.detachEvent("on" + type,f);else {var arr=emitter._handlers && emitter._handlers[type];if(!arr)return;for(var i=0;i < arr.length;++i) if(arr[i] == f){arr.splice(i,1);break;}}};var signal=CodeMirror.signal = function(emitter,type /*, values...*/){var arr=emitter._handlers && emitter._handlers[type];if(!arr)return;var args=Array.prototype.slice.call(arguments,2);for(var i=0;i < arr.length;++i) arr[i].apply(null,args);};var orphanDelayedCallbacks=null; // Often, we want to signal events at a point where we are in the
// middle of some work, but don't want the handler to start calling
// other methods on the editor, which might be in an inconsistent
// state or simply not expect any other events to happen.
// signalLater looks whether there are any handlers, and schedules
// them to be executed when the last operation ends, or, if no
// operation is active, when a timeout fires.
function signalLater(emitter,type /*, values...*/){var arr=emitter._handlers && emitter._handlers[type];if(!arr)return;var args=Array.prototype.slice.call(arguments,2),list;if(operationGroup){list = operationGroup.delayedCallbacks;}else if(orphanDelayedCallbacks){list = orphanDelayedCallbacks;}else {list = orphanDelayedCallbacks = [];setTimeout(fireOrphanDelayed,0);}function bnd(f){return function(){f.apply(null,args);};};for(var i=0;i < arr.length;++i) list.push(bnd(arr[i]));}function fireOrphanDelayed(){var delayed=orphanDelayedCallbacks;orphanDelayedCallbacks = null;for(var i=0;i < delayed.length;++i) delayed[i]();} // The DOM events that CodeMirror handles can be overridden by
// registering a (non-DOM) handler on the editor for the event name,
// and preventDefault-ing the event in that handler.
function signalDOMEvent(cm,e,override){if(typeof e == "string")e = {type:e,preventDefault:function preventDefault(){this.defaultPrevented = true;}};signal(cm,override || e.type,cm,e);return e_defaultPrevented(e) || e.codemirrorIgnore;}function signalCursorActivity(cm){var arr=cm._handlers && cm._handlers.cursorActivity;if(!arr)return;var set=cm.curOp.cursorActivityHandlers || (cm.curOp.cursorActivityHandlers = []);for(var i=0;i < arr.length;++i) if(indexOf(set,arr[i]) == -1)set.push(arr[i]);}function hasHandler(emitter,type){var arr=emitter._handlers && emitter._handlers[type];return arr && arr.length > 0;} // Add on and off methods to a constructor's prototype, to make
// registering events on such objects more convenient.
function eventMixin(ctor){ctor.prototype.on = function(type,f){on(this,type,f);};ctor.prototype.off = function(type,f){off(this,type,f);};} // MISC UTILITIES
// Number of pixels added to scroller and sizer to hide scrollbar
var scrollerGap=30; // Returned or thrown by various protocols to signal 'I'm not
// handling this'.
var Pass=CodeMirror.Pass = {toString:function toString(){return "CodeMirror.Pass";}}; // Reused option objects for setSelection & friends
var sel_dontScroll={scroll:false},sel_mouse={origin:"*mouse"},sel_move={origin:"+move"};function Delayed(){this.id = null;}Delayed.prototype.set = function(ms,f){clearTimeout(this.id);this.id = setTimeout(f,ms);}; // Counts the column offset in a string, taking tabs into account.
// Used mostly to find indentation.
var countColumn=CodeMirror.countColumn = function(string,end,tabSize,startIndex,startValue){if(end == null){end = string.search(/[^\s\u00a0]/);if(end == -1)end = string.length;}for(var i=startIndex || 0,n=startValue || 0;;) {var nextTab=string.indexOf("\t",i);if(nextTab < 0 || nextTab >= end)return n + (end - i);n += nextTab - i;n += tabSize - n % tabSize;i = nextTab + 1;}}; // The inverse of countColumn -- find the offset that corresponds to
// a particular column.
function findColumn(string,goal,tabSize){for(var pos=0,col=0;;) {var nextTab=string.indexOf("\t",pos);if(nextTab == -1)nextTab = string.length;var skipped=nextTab - pos;if(nextTab == string.length || col + skipped >= goal)return pos + Math.min(skipped,goal - col);col += nextTab - pos;col += tabSize - col % tabSize;pos = nextTab + 1;if(col >= goal)return pos;}}var spaceStrs=[""];function spaceStr(n){while(spaceStrs.length <= n) spaceStrs.push(lst(spaceStrs) + " ");return spaceStrs[n];}function lst(arr){return arr[arr.length - 1];}var selectInput=function selectInput(node){node.select();};if(ios) // Mobile Safari apparently has a bug where select() is broken.
selectInput = function(node){node.selectionStart = 0;node.selectionEnd = node.value.length;};else if(ie) // Suppress mysterious IE10 errors
selectInput = function(node){try{node.select();}catch(_e) {}};function indexOf(array,elt){for(var i=0;i < array.length;++i) if(array[i] == elt)return i;return -1;}function map(array,f){var out=[];for(var i=0;i < array.length;i++) out[i] = f(array[i],i);return out;}function nothing(){}function createObj(base,props){var inst;if(Object.create){inst = Object.create(base);}else {nothing.prototype = base;inst = new nothing();}if(props)copyObj(props,inst);return inst;};function copyObj(obj,target,overwrite){if(!target)target = {};for(var prop in obj) if(obj.hasOwnProperty(prop) && (overwrite !== false || !target.hasOwnProperty(prop)))target[prop] = obj[prop];return target;}function bind(f){var args=Array.prototype.slice.call(arguments,1);return function(){return f.apply(null,args);};}var nonASCIISingleCaseWordChar=/[\u00df\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;var isWordCharBasic=CodeMirror.isWordChar = function(ch){return (/\w/.test(ch) || ch > "\x80" && (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch)));};function isWordChar(ch,helper){if(!helper)return isWordCharBasic(ch);if(helper.source.indexOf("\\w") > -1 && isWordCharBasic(ch))return true;return helper.test(ch);}function isEmpty(obj){for(var n in obj) if(obj.hasOwnProperty(n) && obj[n])return false;return true;} // Extending unicode characters. A series of a non-extending char +
// any number of extending chars is treated as a single unit as far
// as editing and measuring is concerned. This is not fully correct,
// since some scripts/fonts/browsers also treat other configurations
// of code points as a group.
var extendingChars=/[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/;function isExtendingChar(ch){return ch.charCodeAt(0) >= 768 && extendingChars.test(ch);} // DOM UTILITIES
function elt(tag,content,className,style){var e=document.createElement(tag);if(className)e.className = className;if(style)e.style.cssText = style;if(typeof content == "string")e.appendChild(document.createTextNode(content));else if(content)for(var i=0;i < content.length;++i) e.appendChild(content[i]);return e;}var range;if(document.createRange)range = function(node,start,end,endNode){var r=document.createRange();r.setEnd(endNode || node,end);r.setStart(node,start);return r;};else range = function(node,start,end){var r=document.body.createTextRange();try{r.moveToElementText(node.parentNode);}catch(e) {return r;}r.collapse(true);r.moveEnd("character",end);r.moveStart("character",start);return r;};function removeChildren(e){for(var count=e.childNodes.length;count > 0;--count) e.removeChild(e.firstChild);return e;}function removeChildrenAndAdd(parent,e){return removeChildren(parent).appendChild(e);}var contains=CodeMirror.contains = function(parent,child){if(child.nodeType == 3) // Android browser always returns false when child is a textnode
child = child.parentNode;if(parent.contains)return parent.contains(child);do {if(child.nodeType == 11)child = child.host;if(child == parent)return true;}while(child = child.parentNode);};function activeElt(){return document.activeElement;} // Older versions of IE throws unspecified error when touching
// document.activeElement in some cases (during loading, in iframe)
if(ie && ie_version < 11)activeElt = function(){try{return document.activeElement;}catch(e) {return document.body;}};function classTest(cls){return new RegExp("(^|\\s)" + cls + "(?:$|\\s)\\s*");}var rmClass=CodeMirror.rmClass = function(node,cls){var current=node.className;var match=classTest(cls).exec(current);if(match){var after=current.slice(match.index + match[0].length);node.className = current.slice(0,match.index) + (after?match[1] + after:"");}};var addClass=CodeMirror.addClass = function(node,cls){var current=node.className;if(!classTest(cls).test(current))node.className += (current?" ":"") + cls;};function joinClasses(a,b){var as=a.split(" ");for(var i=0;i < as.length;i++) if(as[i] && !classTest(as[i]).test(b))b += " " + as[i];return b;} // WINDOW-WIDE EVENTS
// These must be handled carefully, because naively registering a
// handler for each editor will cause the editors to never be
// garbage collected.
function forEachCodeMirror(f){if(!document.body.getElementsByClassName)return;var byClass=document.body.getElementsByClassName("CodeMirror");for(var i=0;i < byClass.length;i++) {var cm=byClass[i].CodeMirror;if(cm)f(cm);}}var globalsRegistered=false;function ensureGlobalHandlers(){if(globalsRegistered)return;registerGlobalHandlers();globalsRegistered = true;}function registerGlobalHandlers(){ // When the window resizes, we need to refresh active editors.
var resizeTimer;on(window,"resize",function(){if(resizeTimer == null)resizeTimer = setTimeout(function(){resizeTimer = null;forEachCodeMirror(onResize);},100);}); // When the window loses focus, we want to show the editor as blurred
on(window,"blur",function(){forEachCodeMirror(onBlur);});} // FEATURE DETECTION
// Detect drag-and-drop
var dragAndDrop=(function(){ // There is *some* kind of drag-and-drop support in IE6-8, but I
// couldn't get it to work yet.
if(ie && ie_version < 9)return false;var div=elt('div');return "draggable" in div || "dragDrop" in div;})();var zwspSupported;function zeroWidthElement(measure){if(zwspSupported == null){var test=elt("span","​");removeChildrenAndAdd(measure,elt("span",[test,document.createTextNode("x")]));if(measure.firstChild.offsetHeight != 0)zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !(ie && ie_version < 8);}var node=zwspSupported?elt("span","​"):elt("span"," ",null,"display: inline-block; width: 1px; margin-right: -1px");node.setAttribute("cm-text","");return node;} // Feature-detect IE's crummy client rect reporting for bidi text
var badBidiRects;function hasBadBidiRects(measure){if(badBidiRects != null)return badBidiRects;var txt=removeChildrenAndAdd(measure,document.createTextNode("AخA"));var r0=range(txt,0,1).getBoundingClientRect();if(!r0 || r0.left == r0.right)return false; // Safari returns null in some cases (#2780)
var r1=range(txt,1,2).getBoundingClientRect();return badBidiRects = r1.right - r0.right < 3;} // See if "".split is the broken IE version, if so, provide an
// alternative way to split lines.
var splitLines=CodeMirror.splitLines = "\n\nb".split(/\n/).length != 3?function(string){var pos=0,result=[],l=string.length;while(pos <= l) {var nl=string.indexOf("\n",pos);if(nl == -1)nl = string.length;var line=string.slice(pos,string.charAt(nl - 1) == "\r"?nl - 1:nl);var rt=line.indexOf("\r");if(rt != -1){result.push(line.slice(0,rt));pos += rt + 1;}else {result.push(line);pos = nl + 1;}}return result;}:function(string){return string.split(/\r\n?|\n/);};var hasSelection=window.getSelection?function(te){try{return te.selectionStart != te.selectionEnd;}catch(e) {return false;}}:function(te){try{var range=te.ownerDocument.selection.createRange();}catch(e) {}if(!range || range.parentElement() != te)return false;return range.compareEndPoints("StartToEnd",range) != 0;};var hasCopyEvent=(function(){var e=elt("div");if("oncopy" in e)return true;e.setAttribute("oncopy","return;");return typeof e.oncopy == "function";})();var badZoomedRects=null;function hasBadZoomedRects(measure){if(badZoomedRects != null)return badZoomedRects;var node=removeChildrenAndAdd(measure,elt("span","x"));var normal=node.getBoundingClientRect();var fromRange=range(node,0,1).getBoundingClientRect();return badZoomedRects = Math.abs(normal.left - fromRange.left) > 1;} // KEY NAMES
var keyNames={3:"Enter",8:"Backspace",9:"Tab",13:"Enter",16:"Shift",17:"Ctrl",18:"Alt",19:"Pause",20:"CapsLock",27:"Esc",32:"Space",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"Left",38:"Up",39:"Right",40:"Down",44:"PrintScrn",45:"Insert",46:"Delete",59:";",61:"=",91:"Mod",92:"Mod",93:"Mod",107:"=",109:"-",127:"Delete",173:"-",186:";",187:"=",188:",",189:"-",190:".",191:"/",192:"`",219:"[",220:"\\",221:"]",222:"'",63232:"Up",63233:"Down",63234:"Left",63235:"Right",63272:"Delete",63273:"Home",63275:"End",63276:"PageUp",63277:"PageDown",63302:"Insert"};CodeMirror.keyNames = keyNames;(function(){ // Number keys
for(var i=0;i < 10;i++) keyNames[i + 48] = keyNames[i + 96] = String(i); // Alphabetic keys
for(var i=65;i <= 90;i++) keyNames[i] = String.fromCharCode(i); // Function keys
for(var i=1;i <= 12;i++) keyNames[i + 111] = keyNames[i + 63235] = "F" + i;})(); // BIDI HELPERS
function iterateBidiSections(order,from,to,f){if(!order)return f(from,to,"ltr");var found=false;for(var i=0;i < order.length;++i) {var part=order[i];if(part.from < to && part.to > from || from == to && part.to == from){f(Math.max(part.from,from),Math.min(part.to,to),part.level == 1?"rtl":"ltr");found = true;}}if(!found)f(from,to,"ltr");}function bidiLeft(part){return part.level % 2?part.to:part.from;}function bidiRight(part){return part.level % 2?part.from:part.to;}function lineLeft(line){var order=getOrder(line);return order?bidiLeft(order[0]):0;}function lineRight(line){var order=getOrder(line);if(!order)return line.text.length;return bidiRight(lst(order));}function lineStart(cm,lineN){var line=getLine(cm.doc,lineN);var visual=visualLine(line);if(visual != line)lineN = lineNo(visual);var order=getOrder(visual);var ch=!order?0:order[0].level % 2?lineRight(visual):lineLeft(visual);return Pos(lineN,ch);}function lineEnd(cm,lineN){var merged,line=getLine(cm.doc,lineN);while(merged = collapsedSpanAtEnd(line)) {line = merged.find(1,true).line;lineN = null;}var order=getOrder(line);var ch=!order?line.text.length:order[0].level % 2?lineLeft(line):lineRight(line);return Pos(lineN == null?lineNo(line):lineN,ch);}function lineStartSmart(cm,pos){var start=lineStart(cm,pos.line);var line=getLine(cm.doc,start.line);var order=getOrder(line);if(!order || order[0].level == 0){var firstNonWS=Math.max(0,line.text.search(/\S/));var inWS=pos.line == start.line && pos.ch <= firstNonWS && pos.ch;return Pos(start.line,inWS?0:firstNonWS);}return start;}function compareBidiLevel(order,a,b){var linedir=order[0].level;if(a == linedir)return true;if(b == linedir)return false;return a < b;}var bidiOther;function getBidiPartAt(order,pos){bidiOther = null;for(var i=0,found;i < order.length;++i) {var cur=order[i];if(cur.from < pos && cur.to > pos)return i;if(cur.from == pos || cur.to == pos){if(found == null){found = i;}else if(compareBidiLevel(order,cur.level,order[found].level)){if(cur.from != cur.to)bidiOther = found;return i;}else {if(cur.from != cur.to)bidiOther = i;return found;}}}return found;}function moveInLine(line,pos,dir,byUnit){if(!byUnit)return pos + dir;do pos += dir;while(pos > 0 && isExtendingChar(line.text.charAt(pos)));return pos;} // This is needed in order to move 'visually' through bi-directional
// text -- i.e., pressing left should make the cursor go left, even
// when in RTL text. The tricky part is the 'jumps', where RTL and
// LTR text touch each other. This often requires the cursor offset
// to move more than one unit, in order to visually move one unit.
function moveVisually(line,start,dir,byUnit){var bidi=getOrder(line);if(!bidi)return moveLogically(line,start,dir,byUnit);var pos=getBidiPartAt(bidi,start),part=bidi[pos];var target=moveInLine(line,start,part.level % 2?-dir:dir,byUnit);for(;;) {if(target > part.from && target < part.to)return target;if(target == part.from || target == part.to){if(getBidiPartAt(bidi,target) == pos)return target;part = bidi[pos += dir];return dir > 0 == part.level % 2?part.to:part.from;}else {part = bidi[pos += dir];if(!part)return null;if(dir > 0 == part.level % 2)target = moveInLine(line,part.to,-1,byUnit);else target = moveInLine(line,part.from,1,byUnit);}}}function moveLogically(line,start,dir,byUnit){var target=start + dir;if(byUnit)while(target > 0 && isExtendingChar(line.text.charAt(target))) target += dir;return target < 0 || target > line.text.length?null:target;} // Bidirectional ordering algorithm
// See http://unicode.org/reports/tr9/tr9-13.html for the algorithm
// that this (partially) implements.
// One-char codes used for character types:
// L (L):   Left-to-Right
// R (R):   Right-to-Left
// r (AL):  Right-to-Left Arabic
// 1 (EN):  European Number
// + (ES):  European Number Separator
// % (ET):  European Number Terminator
// n (AN):  Arabic Number
// , (CS):  Common Number Separator
// m (NSM): Non-Spacing Mark
// b (BN):  Boundary Neutral
// s (B):   Paragraph Separator
// t (S):   Segment Separator
// w (WS):  Whitespace
// N (ON):  Other Neutrals
// Returns null if characters are ordered as they appear
// (left-to-right), or an array of sections ({from, to, level}
// objects) in the order in which they occur visually.
var bidiOrdering=(function(){ // Character types for codepoints 0 to 0xff
var lowTypes="bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN"; // Character types for codepoints 0x600 to 0x6ff
var arabicTypes="rrrrrrrrrrrr,rNNmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmrrrrrrrnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmNmmmm";function charType(code){if(code <= 0xf7)return lowTypes.charAt(code);else if(0x590 <= code && code <= 0x5f4)return "R";else if(0x600 <= code && code <= 0x6ed)return arabicTypes.charAt(code - 0x600);else if(0x6ee <= code && code <= 0x8ac)return "r";else if(0x2000 <= code && code <= 0x200b)return "w";else if(code == 0x200c)return "b";else return "L";}var bidiRE=/[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;var isNeutral=/[stwN]/,isStrong=/[LRr]/,countsAsLeft=/[Lb1n]/,countsAsNum=/[1n]/; // Browsers seem to always treat the boundaries of block elements as being L.
var outerType="L";function BidiSpan(level,from,to){this.level = level;this.from = from;this.to = to;}return function(str){if(!bidiRE.test(str))return false;var len=str.length,types=[];for(var i=0,type;i < len;++i) types.push(type = charType(str.charCodeAt(i))); // W1. Examine each non-spacing mark (NSM) in the level run, and
// change the type of the NSM to the type of the previous
// character. If the NSM is at the start of the level run, it will
// get the type of sor.
for(var i=0,prev=outerType;i < len;++i) {var type=types[i];if(type == "m")types[i] = prev;else prev = type;} // W2. Search backwards from each instance of a European number
// until the first strong type (R, L, AL, or sor) is found. If an
// AL is found, change the type of the European number to Arabic
// number.
// W3. Change all ALs to R.
for(var i=0,cur=outerType;i < len;++i) {var type=types[i];if(type == "1" && cur == "r")types[i] = "n";else if(isStrong.test(type)){cur = type;if(type == "r")types[i] = "R";}} // W4. A single European separator between two European numbers
// changes to a European number. A single common separator between
// two numbers of the same type changes to that type.
for(var i=1,prev=types[0];i < len - 1;++i) {var type=types[i];if(type == "+" && prev == "1" && types[i + 1] == "1")types[i] = "1";else if(type == "," && prev == types[i + 1] && (prev == "1" || prev == "n"))types[i] = prev;prev = type;} // W5. A sequence of European terminators adjacent to European
// numbers changes to all European numbers.
// W6. Otherwise, separators and terminators change to Other
// Neutral.
for(var i=0;i < len;++i) {var type=types[i];if(type == ",")types[i] = "N";else if(type == "%"){for(var end=i + 1;end < len && types[end] == "%";++end) {}var replace=i && types[i - 1] == "!" || end < len && types[end] == "1"?"1":"N";for(var j=i;j < end;++j) types[j] = replace;i = end - 1;}} // W7. Search backwards from each instance of a European number
// until the first strong type (R, L, or sor) is found. If an L is
// found, then change the type of the European number to L.
for(var i=0,cur=outerType;i < len;++i) {var type=types[i];if(cur == "L" && type == "1")types[i] = "L";else if(isStrong.test(type))cur = type;} // N1. A sequence of neutrals takes the direction of the
// surrounding strong text if the text on both sides has the same
// direction. European and Arabic numbers act as if they were R in
// terms of their influence on neutrals. Start-of-level-run (sor)
// and end-of-level-run (eor) are used at level run boundaries.
// N2. Any remaining neutrals take the embedding direction.
for(var i=0;i < len;++i) {if(isNeutral.test(types[i])){for(var end=i + 1;end < len && isNeutral.test(types[end]);++end) {}var before=(i?types[i - 1]:outerType) == "L";var after=(end < len?types[end]:outerType) == "L";var replace=before || after?"L":"R";for(var j=i;j < end;++j) types[j] = replace;i = end - 1;}} // Here we depart from the documented algorithm, in order to avoid
// building up an actual levels array. Since there are only three
// levels (0, 1, 2) in an implementation that doesn't take
// explicit embedding into account, we can build up the order on
// the fly, without following the level-based algorithm.
var order=[],m;for(var i=0;i < len;) {if(countsAsLeft.test(types[i])){var start=i;for(++i;i < len && countsAsLeft.test(types[i]);++i) {}order.push(new BidiSpan(0,start,i));}else {var pos=i,at=order.length;for(++i;i < len && types[i] != "L";++i) {}for(var j=pos;j < i;) {if(countsAsNum.test(types[j])){if(pos < j)order.splice(at,0,new BidiSpan(1,pos,j));var nstart=j;for(++j;j < i && countsAsNum.test(types[j]);++j) {}order.splice(at,0,new BidiSpan(2,nstart,j));pos = j;}else ++j;}if(pos < i)order.splice(at,0,new BidiSpan(1,pos,i));}}if(order[0].level == 1 && (m = str.match(/^\s+/))){order[0].from = m[0].length;order.unshift(new BidiSpan(0,0,m[0].length));}if(lst(order).level == 1 && (m = str.match(/\s+$/))){lst(order).to -= m[0].length;order.push(new BidiSpan(0,len - m[0].length,len));}if(order[0].level != lst(order).level)order.push(new BidiSpan(order[0].level,len,len));return order;};})(); // THE END
CodeMirror.version = "5.1.0";return CodeMirror;}); // at http://marijnhaverbeke.nl/blog/#cm-internals .

},{}],37:[function(require,module,exports){
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

"use strict";

(function (mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"));else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);else // Plain browser env
        mod(CodeMirror);
})(function (CodeMirror) {
    "use strict";

    CodeMirror.defineMode("scheme", function () {
        var BUILTIN = "builtin",
            COMMENT = "comment",
            STRING = "string",
            ATOM = "atom",
            NUMBER = "number",
            BRACKET = "bracket";
        var INDENT_WORD_SKIP = 2;

        function makeKeywords(str) {
            var obj = {},
                words = str.split(" ");
            for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
            return obj;
        }

        var keywords = makeKeywords("λ case-lambda call/cc class define-class exit-handler field import inherit init-field interface let*-values let-values let/ec mixin opt-lambda override protect provide public rename require require-for-syntax syntax syntax-case syntax-error unit/sig unless when with-syntax and begin call-with-current-continuation call-with-input-file call-with-output-file case cond define define-syntax delay do dynamic-wind else for-each if lambda let let* let-syntax letrec letrec-syntax map or syntax-rules abs acos angle append apply asin assoc assq assv atan boolean? caar cadr call-with-input-file call-with-output-file call-with-values car cdddar cddddr cdr ceiling char->integer char-alphabetic? char-ci<=? char-ci<? char-ci=? char-ci>=? char-ci>? char-downcase char-lower-case? char-numeric? char-ready? char-upcase char-upper-case? char-whitespace? char<=? char<? char=? char>=? char>? char? close-input-port close-output-port complex? cons cos current-input-port current-output-port denominator display eof-object? eq? equal? eqv? eval even? exact->inexact exact? exp expt #f floor force gcd imag-part inexact->exact inexact? input-port? integer->char integer? interaction-environment lcm length list list->string list->vector list-ref list-tail list? load log magnitude make-polar make-rectangular make-string make-vector max member memq memv min modulo negative? newline not null-environment null? number->string number? numerator odd? open-input-file open-output-file output-port? pair? peek-char port? positive? procedure? quasiquote quote quotient rational? rationalize read read-char real-part real? remainder reverse round scheme-report-environment set! set-car! set-cdr! sin sqrt string string->list string->number string->symbol string-append string-ci<=? string-ci<? string-ci=? string-ci>=? string-ci>? string-copy string-fill! string-length string-ref string-set! string<=? string<? string=? string>=? string>? string? substring symbol->string symbol? #t tan transcript-off transcript-on truncate values vector vector->list vector-fill! vector-length vector-ref vector-set! with-input-from-file with-output-to-file write write-char zero?");
        var indentKeys = makeKeywords("define let letrec let* lambda");

        function stateStack(indent, type, prev) {
            // represents a state stack object
            this.indent = indent;
            this.type = type;
            this.prev = prev;
        }

        function pushStack(state, indent, type) {
            state.indentStack = new stateStack(indent, type, state.indentStack);
        }

        function popStack(state) {
            state.indentStack = state.indentStack.prev;
        }

        var binaryMatcher = new RegExp(/^(?:[-+]i|[-+][01]+#*(?:\/[01]+#*)?i|[-+]?[01]+#*(?:\/[01]+#*)?@[-+]?[01]+#*(?:\/[01]+#*)?|[-+]?[01]+#*(?:\/[01]+#*)?[-+](?:[01]+#*(?:\/[01]+#*)?)?i|[-+]?[01]+#*(?:\/[01]+#*)?)(?=[()\s;"]|$)/i);
        var octalMatcher = new RegExp(/^(?:[-+]i|[-+][0-7]+#*(?:\/[0-7]+#*)?i|[-+]?[0-7]+#*(?:\/[0-7]+#*)?@[-+]?[0-7]+#*(?:\/[0-7]+#*)?|[-+]?[0-7]+#*(?:\/[0-7]+#*)?[-+](?:[0-7]+#*(?:\/[0-7]+#*)?)?i|[-+]?[0-7]+#*(?:\/[0-7]+#*)?)(?=[()\s;"]|$)/i);
        var hexMatcher = new RegExp(/^(?:[-+]i|[-+][\da-f]+#*(?:\/[\da-f]+#*)?i|[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?@[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?|[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?[-+](?:[\da-f]+#*(?:\/[\da-f]+#*)?)?i|[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?)(?=[()\s;"]|$)/i);
        var decimalMatcher = new RegExp(/^(?:[-+]i|[-+](?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)i|[-+]?(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)@[-+]?(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)|[-+]?(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)[-+](?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)?i|(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*))(?=[()\s;"]|$)/i);

        function isBinaryNumber(stream) {
            return stream.match(binaryMatcher);
        }

        function isOctalNumber(stream) {
            return stream.match(octalMatcher);
        }

        function isDecimalNumber(stream, backup) {
            if (backup === true) {
                stream.backUp(1);
            }
            return stream.match(decimalMatcher);
        }

        function isHexNumber(stream) {
            return stream.match(hexMatcher);
        }

        return {
            startState: function startState() {
                return {
                    indentStack: null,
                    indentation: 0,
                    mode: false,
                    sExprComment: false
                };
            },

            token: function token(stream, state) {
                if (state.indentStack == null && stream.sol()) {
                    // update indentation, but only if indentStack is empty
                    state.indentation = stream.indentation();
                }

                // skip spaces
                if (stream.eatSpace()) {
                    return null;
                }
                var returnType = null;

                switch (state.mode) {
                    case "string":
                        // multi-line string parsing mode
                        var next,
                            escaped = false;
                        while ((next = stream.next()) != null) {
                            if (next == "\"" && !escaped) {

                                state.mode = false;
                                break;
                            }
                            escaped = !escaped && next == "\\";
                        }
                        returnType = STRING; // continue on in scheme-string mode
                        break;
                    case "comment":
                        // comment parsing mode
                        var next,
                            maybeEnd = false;
                        while ((next = stream.next()) != null) {
                            if (next == "#" && maybeEnd) {

                                state.mode = false;
                                break;
                            }
                            maybeEnd = next == "|";
                        }
                        returnType = COMMENT;
                        break;
                    case "s-expr-comment":
                        // s-expr commenting mode
                        state.mode = false;
                        if (stream.peek() == "(" || stream.peek() == "[") {
                            // actually start scheme s-expr commenting mode
                            state.sExprComment = 0;
                        } else {
                            // if not we just comment the entire of the next token
                            stream.eatWhile(/[^/s]/); // eat non spaces
                            returnType = COMMENT;
                            break;
                        }
                    default:
                        // default parsing mode
                        var ch = stream.next();

                        if (ch == "\"") {
                            state.mode = "string";
                            returnType = STRING;
                        } else if (ch == "'") {
                            returnType = ATOM;
                        } else if (ch == '#') {
                            if (stream.eat("|")) {
                                // Multi-line comment
                                state.mode = "comment"; // toggle to comment mode
                                returnType = COMMENT;
                            } else if (stream.eat(/[tf]/i)) {
                                // #t/#f (atom)
                                returnType = ATOM;
                            } else if (stream.eat(';')) {
                                // S-Expr comment
                                state.mode = "s-expr-comment";
                                returnType = COMMENT;
                            } else {
                                var numTest = null,
                                    hasExactness = false,
                                    hasRadix = true;
                                if (stream.eat(/[ei]/i)) {
                                    hasExactness = true;
                                } else {
                                    stream.backUp(1); // must be radix specifier
                                }
                                if (stream.match(/^#b/i)) {
                                    numTest = isBinaryNumber;
                                } else if (stream.match(/^#o/i)) {
                                    numTest = isOctalNumber;
                                } else if (stream.match(/^#x/i)) {
                                    numTest = isHexNumber;
                                } else if (stream.match(/^#d/i)) {
                                    numTest = isDecimalNumber;
                                } else if (stream.match(/^[-+0-9.]/, false)) {
                                    hasRadix = false;
                                    numTest = isDecimalNumber;
                                    // re-consume the intial # if all matches failed
                                } else if (!hasExactness) {
                                        stream.eat('#');
                                    }
                                if (numTest != null) {
                                    if (hasRadix && !hasExactness) {
                                        // consume optional exactness after radix
                                        stream.match(/^#[ei]/i);
                                    }
                                    if (numTest(stream)) returnType = NUMBER;
                                }
                            }
                        } else if (/^[-+0-9.]/.test(ch) && isDecimalNumber(stream, true)) {
                            // match non-prefixed number, must be decimal
                            returnType = NUMBER;
                        } else if (ch == ";") {
                            // comment
                            stream.skipToEnd(); // rest of the line is a comment
                            returnType = COMMENT;
                        } else if (ch == "(" || ch == "[") {
                            var keyWord = '';var indentTemp = stream.column(),
                                letter;
                            /**
                            Either
                            (indent-word ..
                            (non-indent-word ..
                            (;something else, bracket, etc.
                            */

                            while ((letter = stream.eat(/[^\s\(\[\;\)\]]/)) != null) {
                                keyWord += letter;
                            }

                            if (keyWord.length > 0 && indentKeys.propertyIsEnumerable(keyWord)) {
                                // indent-word

                                pushStack(state, indentTemp + INDENT_WORD_SKIP, ch);
                            } else {
                                // non-indent word
                                // we continue eating the spaces
                                stream.eatSpace();
                                if (stream.eol() || stream.peek() == ";") {
                                    // nothing significant after
                                    // we restart indentation 1 space after
                                    pushStack(state, indentTemp + 1, ch);
                                } else {
                                    pushStack(state, indentTemp + stream.current().length, ch); // else we match
                                }
                            }
                            stream.backUp(stream.current().length - 1); // undo all the eating

                            if (typeof state.sExprComment == "number") state.sExprComment++;

                            returnType = BRACKET;
                        } else if (ch == ")" || ch == "]") {
                            returnType = BRACKET;
                            if (state.indentStack != null && state.indentStack.type == (ch == ")" ? "(" : "[")) {
                                popStack(state);

                                if (typeof state.sExprComment == "number") {
                                    if (--state.sExprComment == 0) {
                                        returnType = COMMENT; // final closing bracket
                                        state.sExprComment = false; // turn off s-expr commenting mode
                                    }
                                }
                            }
                        } else {
                                stream.eatWhile(/[\w\$_\-!$%&*+\.\/:<=>?@\^~]/);

                                if (keywords && keywords.propertyIsEnumerable(stream.current())) {
                                    returnType = BUILTIN;
                                } else returnType = "variable";
                            }
                }
                return typeof state.sExprComment == "number" ? COMMENT : returnType;
            },

            indent: function indent(state) {
                if (state.indentStack == null) return state.indentation;
                return state.indentStack.indent;
            },

            closeBrackets: { pairs: "()[]{}\"\"" },
            lineComment: ";;"
        };
    });

    CodeMirror.defineMIME("text/x-scheme", "scheme");
});
/**
 * Author: Koh Zi Han, based on implementation by Koh Zi Chun
 */

},{"../../lib/codemirror":36}],38:[function(require,module,exports){
"use strict";

var demos = {};

demos.data = {};

demos.names = ["basicsynth", "functiondef", "math"];

demos.data.basicsynth = "\n\
; defining a basic synth\n\
\n\
(let basic\n\
  (amp\n\
    (osc (param \"freq\" 440) \"square\")\n\
    (arEnv 0.1 0.2)\n\
  )\n\
)\n\
\n\
(let synth (createSynth basic))\n\
\n\
(routeToMaster synth)\n\
\n\
(play synth 1)\n\
";

demos.data.functiondef = "\n\
; function definition\n\
\n\
(define (func a b)\n\
  (define c (+ a b))\n\
  (* c b)\n\
)\n\
\n\
(display (func 3 4))\n\
";

demos.data.math = "\n\
; simple maths\n\
\n\
(define a 3)\n\
(define b 5)\n\
\n\
(display (+ a (* b 4)))\n\
";

module.exports = demos;

},{}],39:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.15 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
"use strict";

var jisonParser = (function () {
    var o = function o(k, v, _o, l) {
        for (_o = _o || {}, l = k.length; l--; _o[k[l]] = v);return _o;
    },
        $V0 = [5, 11, 27, 35, 36, 37, 38, 39, 40, 41, 44],
        $V1 = [1, 11],
        $V2 = [1, 20],
        $V3 = [1, 21],
        $V4 = [1, 22],
        $V5 = [1, 23],
        $V6 = [1, 24],
        $V7 = [1, 25],
        $V8 = [1, 27],
        $V9 = [1, 28],
        $Va = [1, 26],
        $Vb = [5, 11, 14, 27, 35, 36, 37, 38, 39, 40, 41, 44],
        $Vc = [1, 35],
        $Vd = [1, 29],
        $Ve = [1, 30],
        $Vf = [1, 34],
        $Vg = [46, 51],
        $Vh = [11, 14, 27, 35, 36, 37, 38, 39, 40, 41, 44],
        $Vi = [14, 51],
        $Vj = [11, 27, 35, 36, 37, 38, 39, 40, 41, 44],
        $Vk = [2, 41],
        $Vl = [14, 27];
    var parser = { trace: function trace() {},
        yy: {},
        symbols_: { "error": 2, "Program": 3, "Program_repetition0": 4, "t_eof": 5, "Form": 6, "Definition": 7, "Expression": 8, "LetDefinition": 9, "FunctionDefinition": 10, "t_oparen": 11, "t_let": 12, "Variable": 13, "t_cparen": 14, "t_def": 15, "FunctionDefinition_repetition0": 16, "Body": 17, "Body_repetition0": 18, "Body_repetition_plus1": 19, "Literal": 20, "t_lambda": 21, "LambdaArgNames": 22, "t_if": 23, "Application": 24, "LambdaArgNames_repetition0": 25, "Application_repetition0": 26, "t_id": 27, "Boolean": 28, "Number": 29, "String": 30, "Symbol": 31, "List": 32, "Note": 33, "Beat": 34, "t_true": 35, "t_false": 36, "t_number": 37, "t_string": 38, "t_symbol": 39, "t_note": 40, "t_beat": 41, "t_list": 42, "List_repetition0": 43, "t_obracket": 44, "List_repetition1": 45, "t_cbracket": 46, "Map": 47, "t_map": 48, "Map_repetition0": 49, "MapPair": 50, "Datum": 51, "$accept": 0, "$end": 1 },
        terminals_: { 2: "error", 5: "t_eof", 11: "t_oparen", 12: "t_let", 14: "t_cparen", 15: "t_def", 21: "t_lambda", 23: "t_if", 27: "t_id", 35: "t_true", 36: "t_false", 37: "t_number", 38: "t_string", 39: "t_symbol", 40: "t_note", 41: "t_beat", 42: "t_list", 44: "t_obracket", 46: "t_cbracket", 48: "t_map", 51: "Datum" },
        productions_: [0, [3, 2], [6, 1], [6, 1], [7, 1], [7, 1], [9, 5], [10, 8], [17, 2], [8, 1], [8, 1], [8, 5], [8, 5], [8, 6], [8, 1], [22, 1], [22, 3], [24, 4], [13, 1], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [28, 1], [28, 1], [29, 1], [30, 1], [31, 1], [33, 1], [34, 1], [32, 4], [32, 3], [47, 4], [50, 4], [4, 0], [4, 2], [16, 0], [16, 2], [18, 0], [18, 2], [19, 1], [19, 2], [25, 0], [25, 2], [26, 0], [26, 2], [43, 0], [43, 2], [45, 0], [45, 2], [49, 0], [49, 2]],
        performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, /* action[1] */$$, /* vstack */_$ /* lstack */) {
            /* this == yyval */

            var $0 = $$.length - 1;
            switch (yystate) {
                case 1:
                    return $$[$0 - 1];
                    break;
                case 6:
                    this.$ = Ast.LetDefinition($$[$0 - 2], $$[$0 - 1]);
                    break;
                case 7:
                    this.$ = Ast.FunctionDefinition($$[$0 - 4], $$[$0 - 3], $$[$0 - 1]);
                    break;
                case 8:
                    this.$ = Ast.Body($$[$0 - 1], $$[$0]);
                    break;
                case 10:
                    this.$ = Ast.Variable($$[$0]);
                    break;
                case 11:
                    this.$ = Ast.Lambda($$[$0 - 2], $$[$0 - 1]);
                    break;
                case 12:
                    this.$ = Ast.If($$[$0 - 2], $$[$0 - 1]);
                    break;
                case 13:
                    this.$ = Ast.IfElse($$[$0 - 3], $$[$0 - 2], $$[$0 - 1]);
                    break;
                case 15:
                    this.$ = [$$[$01]];
                    break;
                case 16:
                    this.$ = $$[$0 - 1];
                    break;
                case 17:
                    this.$ = Ast.Application($$[$0 - 2], $$[$0 - 1]);
                    break;
                case 18:
                    this.$ = yytext;
                    break;
                case 26:
                    this.$ = Ast.Bool(true);
                    break;
                case 27:
                    this.$ = Ast.Bool(false);
                    break;
                case 28:
                    this.$ = Ast.Num(Number(yytext));
                    break;
                case 29:
                    this.$ = Ast.Str(yytext);
                    break;
                case 30:
                    this.$ = Ast.Symbol(yytext.slice(1));
                    break;
                case 31:

                    var data = /([a-gA-G][#b]?)([0-9]+)/.exec(yytext);
                    this.$ = Ast.Note(data[1], data[2]);

                    break;
                case 32:

                    var data = /[0-9]+("."[0-9]+)/.exec(yytext);
                    this.$ = Ast.Beat(data[1]);

                    break;
                case 33:
                    this.$ = Ast.List($$[$0 - 1]);
                    break;
                case 34:
                    this.$ = Ast.List($$[$0]);
                    break;
                case 35:
                    this.$ = Ast.Map($$[$0 - 1]);
                    break;
                case 36:
                    this.$ = Ast.MapPair($$[$0 - 2], $$[$0 - 1]);
                    break;
                case 37:case 39:case 41:case 45:case 47:case 49:case 51:case 53:
                    this.$ = [];
                    break;
                case 38:case 40:case 42:case 44:case 46:case 48:case 50:case 52:case 54:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 43:
                    this.$ = [$$[$0]];
                    break;
            }
        },
        table: [o($V0, [2, 37], { 3: 1, 4: 2 }), { 1: [3] }, { 5: [1, 3], 6: 4, 7: 5, 8: 6, 9: 7, 10: 8, 11: $V1, 13: 10, 20: 9, 24: 12, 27: $V2, 28: 13, 29: 14, 30: 15, 31: 16, 32: 17, 33: 18, 34: 19, 35: $V3, 36: $V4, 37: $V5, 38: $V6, 39: $V7, 40: $V8, 41: $V9, 44: $Va }, { 1: [2, 1] }, o($V0, [2, 38]), o($V0, [2, 2]), o($V0, [2, 3]), o($V0, [2, 4]), o($V0, [2, 5]), o($Vb, [2, 9]), o($Vb, [2, 10]), { 8: 33, 11: $Vc, 12: [1, 31], 13: 10, 15: [1, 32], 20: 9, 21: $Vd, 23: $Ve, 24: 12, 27: $V2, 28: 13, 29: 14, 30: 15, 31: 16, 32: 17, 33: 18, 34: 19, 35: $V3, 36: $V4, 37: $V5, 38: $V6, 39: $V7, 40: $V8, 41: $V9, 42: $Vf, 44: $Va }, o($Vb, [2, 14]), o($Vb, [2, 19]), o($Vb, [2, 20]), o($Vb, [2, 21]), o($Vb, [2, 22]), o($Vb, [2, 23]), o($Vb, [2, 24]), o($Vb, [2, 25]), o($Vb, [2, 18]), o($Vb, [2, 26]), o($Vb, [2, 27]), o($Vb, [2, 28]), o($Vb, [2, 29]), o($Vb, [2, 30]), o($Vg, [2, 51], { 45: 36 }), o($Vb, [2, 31]), o($Vb, [2, 32]), { 11: [1, 39], 13: 38, 22: 37, 27: $V2 }, { 8: 40, 11: $Vc, 13: 10, 20: 9, 24: 12, 27: $V2, 28: 13, 29: 14, 30: 15, 31: 16, 32: 17, 33: 18, 34: 19, 35: $V3, 36: $V4, 37: $V5, 38: $V6, 39: $V7, 40: $V8, 41: $V9, 44: $Va }, { 13: 41, 27: $V2 }, { 11: [1, 42] }, o($Vh, [2, 47], { 26: 43 }), o($Vi, [2, 49], { 43: 44 }), { 8: 33, 11: $Vc, 13: 10, 20: 9, 21: $Vd, 23: $Ve, 24: 12, 27: $V2, 28: 13, 29: 14, 30: 15, 31: 16, 32: 17, 33: 18, 34: 19, 35: $V3, 36: $V4, 37: $V5, 38: $V6, 39: $V7, 40: $V8, 41: $V9, 42: $Vf, 44: $Va }, { 46: [1, 45], 51: [1, 46] }, o($Vj, $Vk, { 17: 47, 18: 48 }), o($Vj, [2, 15]), o($Vl, [2, 45], { 25: 49 }), { 8: 50, 11: $Vc, 13: 10, 20: 9, 24: 12, 27: $V2, 28: 13, 29: 14, 30: 15, 31: 16, 32: 17, 33: 18, 34: 19, 35: $V3, 36: $V4, 37: $V5, 38: $V6, 39: $V7, 40: $V8, 41: $V9, 44: $Va }, { 8: 51, 11: $Vc, 13: 10, 20: 9, 24: 12, 27: $V2, 28: 13, 29: 14, 30: 15, 31: 16, 32: 17, 33: 18, 34: 19, 35: $V3, 36: $V4, 37: $V5, 38: $V6, 39: $V7, 40: $V8, 41: $V9, 44: $Va }, { 13: 52, 27: $V2 }, { 8: 54, 11: $Vc, 13: 10, 14: [1, 53], 20: 9, 24: 12, 27: $V2, 28: 13, 29: 14, 30: 15, 31: 16, 32: 17, 33: 18, 34: 19, 35: $V3, 36: $V4, 37: $V5, 38: $V6, 39: $V7, 40: $V8, 41: $V9, 44: $Va }, { 14: [1, 55], 51: [1, 56] }, o($Vb, [2, 34]), o($Vg, [2, 52]), { 14: [1, 57] }, { 7: 59, 8: 60, 9: 7, 10: 8, 11: $V1, 13: 10, 19: 58, 20: 9, 24: 12, 27: $V2, 28: 13, 29: 14, 30: 15, 31: 16, 32: 17, 33: 18, 34: 19, 35: $V3, 36: $V4, 37: $V5, 38: $V6, 39: $V7, 40: $V8, 41: $V9, 44: $Va }, { 13: 62, 14: [1, 61], 27: $V2 }, { 8: 64, 11: $Vc, 13: 10, 14: [1, 63], 20: 9, 24: 12, 27: $V2, 28: 13, 29: 14, 30: 15, 31: 16, 32: 17, 33: 18, 34: 19, 35: $V3, 36: $V4, 37: $V5, 38: $V6, 39: $V7, 40: $V8, 41: $V9, 44: $Va }, { 14: [1, 65] }, o($Vl, [2, 39], { 16: 66 }), o($Vb, [2, 17]), o($Vh, [2, 48]), o($Vb, [2, 33]), o($Vi, [2, 50]), o($Vb, [2, 11]), { 8: 67, 11: $Vc, 13: 10, 14: [2, 8], 20: 9, 24: 12, 27: $V2, 28: 13, 29: 14, 30: 15, 31: 16, 32: 17, 33: 18, 34: 19, 35: $V3, 36: $V4, 37: $V5, 38: $V6, 39: $V7, 40: $V8, 41: $V9, 44: $Va }, o($Vj, [2, 42]), o($Vh, [2, 43]), o($Vj, [2, 16]), o($Vl, [2, 46]), o($Vb, [2, 12]), { 14: [1, 68] }, o($V0, [2, 6]), { 13: 70, 14: [1, 69], 27: $V2 }, o($Vh, [2, 44]), o($Vb, [2, 13]), o($Vj, $Vk, { 18: 48, 17: 71 }), o($Vl, [2, 40]), { 14: [1, 72] }, o($V0, [2, 7])],
        defaultActions: { 3: [2, 1] },
        parseError: function parseError(str, hash) {
            if (hash.recoverable) {
                this.trace(str);
            } else {
                var _parseError = function _parseError(msg, hash) {
                    this.message = msg;
                    this.hash = hash;
                };

                _parseError.prototype = new Error();

                throw new _parseError(str, hash);
            }
        },
        parse: function parse(input) {
            var self = this,
                stack = [0],
                tstack = [],
                vstack = [null],
                lstack = [],
                table = this.table,
                yytext = '',
                yylineno = 0,
                yyleng = 0,
                recovering = 0,
                TERROR = 2,
                EOF = 1;
            var args = lstack.slice.call(arguments, 1);
            var lexer = Object.create(this.lexer);
            var sharedState = { yy: {} };
            for (var k in this.yy) {
                if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
                    sharedState.yy[k] = this.yy[k];
                }
            }
            lexer.setInput(input, sharedState.yy);
            sharedState.yy.lexer = lexer;
            sharedState.yy.parser = this;
            if (typeof lexer.yylloc == 'undefined') {
                lexer.yylloc = {};
            }
            var yyloc = lexer.yylloc;
            lstack.push(yyloc);
            var ranges = lexer.options && lexer.options.ranges;
            if (typeof sharedState.yy.parseError === 'function') {
                this.parseError = sharedState.yy.parseError;
            } else {
                this.parseError = Object.getPrototypeOf(this).parseError;
            }
            function popStack(n) {
                stack.length = stack.length - 2 * n;
                vstack.length = vstack.length - n;
                lstack.length = lstack.length - n;
            }
            _token_stack: var lex = function lex() {
                var token;
                token = lexer.lex() || EOF;
                if (typeof token !== 'number') {
                    token = self.symbols_[token] || token;
                }
                return token;
            };
            var symbol,
                preErrorSymbol,
                state,
                action,
                a,
                r,
                yyval = {},
                p,
                len,
                newState,
                expected;
            while (true) {
                state = stack[stack.length - 1];
                if (this.defaultActions[state]) {
                    action = this.defaultActions[state];
                } else {
                    if (symbol === null || typeof symbol == 'undefined') {
                        symbol = lex();
                    }
                    action = table[state] && table[state][symbol];
                }
                if (typeof action === 'undefined' || !action.length || !action[0]) {
                    var errStr = '';
                    expected = [];
                    for (p in table[state]) {
                        if (this.terminals_[p] && p > TERROR) {
                            expected.push('\'' + this.terminals_[p] + '\'');
                        }
                    }
                    if (lexer.showPosition) {
                        errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                    } else {
                        errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                    }
                    this.parseError(errStr, {
                        text: lexer.match,
                        token: this.terminals_[symbol] || symbol,
                        line: lexer.yylineno,
                        loc: yyloc,
                        expected: expected
                    });
                }
                if (action[0] instanceof Array && action.length > 1) {
                    throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
                }
                switch (action[0]) {
                    case 1:
                        stack.push(symbol);
                        vstack.push(lexer.yytext);
                        lstack.push(lexer.yylloc);
                        stack.push(action[1]);
                        symbol = null;
                        if (!preErrorSymbol) {
                            yyleng = lexer.yyleng;
                            yytext = lexer.yytext;
                            yylineno = lexer.yylineno;
                            yyloc = lexer.yylloc;
                            if (recovering > 0) {
                                recovering--;
                            }
                        } else {
                            symbol = preErrorSymbol;
                            preErrorSymbol = null;
                        }
                        break;
                    case 2:
                        len = this.productions_[action[1]][1];
                        yyval.$ = vstack[vstack.length - len];
                        yyval._$ = {
                            first_line: lstack[lstack.length - (len || 1)].first_line,
                            last_line: lstack[lstack.length - 1].last_line,
                            first_column: lstack[lstack.length - (len || 1)].first_column,
                            last_column: lstack[lstack.length - 1].last_column
                        };
                        if (ranges) {
                            yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
                        }
                        r = this.performAction.apply(yyval, [yytext, yyleng, yylineno, sharedState.yy, action[1], vstack, lstack].concat(args));
                        if (typeof r !== 'undefined') {
                            return r;
                        }
                        if (len) {
                            stack = stack.slice(0, -1 * len * 2);
                            vstack = vstack.slice(0, -1 * len);
                            lstack = lstack.slice(0, -1 * len);
                        }
                        stack.push(this.productions_[action[1]][0]);
                        vstack.push(yyval.$);
                        lstack.push(yyval._$);
                        newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
                        stack.push(newState);
                        break;
                    case 3:
                        return true;
                }
            }
            return true;
        } };

    var Ast = require('../app/ast');

    /* generated by jison-lex 0.3.4 */
    var lexer = (function () {
        var lexer = {

            EOF: 1,

            parseError: function parseError(str, hash) {
                if (this.yy.parser) {
                    this.yy.parser.parseError(str, hash);
                } else {
                    throw new Error(str);
                }
            },

            // resets the lexer, sets new input
            setInput: function setInput(input, yy) {
                this.yy = yy || this.yy || {};
                this._input = input;
                this._more = this._backtrack = this.done = false;
                this.yylineno = this.yyleng = 0;
                this.yytext = this.matched = this.match = '';
                this.conditionStack = ['INITIAL'];
                this.yylloc = {
                    first_line: 1,
                    first_column: 0,
                    last_line: 1,
                    last_column: 0
                };
                if (this.options.ranges) {
                    this.yylloc.range = [0, 0];
                }
                this.offset = 0;
                return this;
            },

            // consumes and returns one char from the input
            input: function input() {
                var ch = this._input[0];
                this.yytext += ch;
                this.yyleng++;
                this.offset++;
                this.match += ch;
                this.matched += ch;
                var lines = ch.match(/(?:\r\n?|\n).*/g);
                if (lines) {
                    this.yylineno++;
                    this.yylloc.last_line++;
                } else {
                    this.yylloc.last_column++;
                }
                if (this.options.ranges) {
                    this.yylloc.range[1]++;
                }

                this._input = this._input.slice(1);
                return ch;
            },

            // unshifts one char (or a string) into the input
            unput: function unput(ch) {
                var len = ch.length;
                var lines = ch.split(/(?:\r\n?|\n)/g);

                this._input = ch + this._input;
                this.yytext = this.yytext.substr(0, this.yytext.length - len);
                //this.yyleng -= len;
                this.offset -= len;
                var oldLines = this.match.split(/(?:\r\n?|\n)/g);
                this.match = this.match.substr(0, this.match.length - 1);
                this.matched = this.matched.substr(0, this.matched.length - 1);

                if (lines.length - 1) {
                    this.yylineno -= lines.length - 1;
                }
                var r = this.yylloc.range;

                this.yylloc = {
                    first_line: this.yylloc.first_line,
                    last_line: this.yylineno + 1,
                    first_column: this.yylloc.first_column,
                    last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
                };

                if (this.options.ranges) {
                    this.yylloc.range = [r[0], r[0] + this.yyleng - len];
                }
                this.yyleng = this.yytext.length;
                return this;
            },

            // When called from action, caches matched text and appends it on next action
            more: function more() {
                this._more = true;
                return this;
            },

            // When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
            reject: function reject() {
                if (this.options.backtrack_lexer) {
                    this._backtrack = true;
                } else {
                    return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                        text: "",
                        token: null,
                        line: this.yylineno
                    });
                }
                return this;
            },

            // retain first n characters of the match
            less: function less(n) {
                this.unput(this.match.slice(n));
            },

            // displays already matched input, i.e. for error messages
            pastInput: function pastInput() {
                var past = this.matched.substr(0, this.matched.length - this.match.length);
                return (past.length > 20 ? '...' : '') + past.substr(-20).replace(/\n/g, "");
            },

            // displays upcoming input, i.e. for error messages
            upcomingInput: function upcomingInput() {
                var next = this.match;
                if (next.length < 20) {
                    next += this._input.substr(0, 20 - next.length);
                }
                return (next.substr(0, 20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
            },

            // displays the character position where the lexing error occurred, i.e. for error messages
            showPosition: function showPosition() {
                var pre = this.pastInput();
                var c = new Array(pre.length + 1).join("-");
                return pre + this.upcomingInput() + "\n" + c + "^";
            },

            // test the lexed token: return FALSE when not a match, otherwise return token
            test_match: function test_match(match, indexed_rule) {
                var token, lines, backup;

                if (this.options.backtrack_lexer) {
                    // save context
                    backup = {
                        yylineno: this.yylineno,
                        yylloc: {
                            first_line: this.yylloc.first_line,
                            last_line: this.last_line,
                            first_column: this.yylloc.first_column,
                            last_column: this.yylloc.last_column
                        },
                        yytext: this.yytext,
                        match: this.match,
                        matches: this.matches,
                        matched: this.matched,
                        yyleng: this.yyleng,
                        offset: this.offset,
                        _more: this._more,
                        _input: this._input,
                        yy: this.yy,
                        conditionStack: this.conditionStack.slice(0),
                        done: this.done
                    };
                    if (this.options.ranges) {
                        backup.yylloc.range = this.yylloc.range.slice(0);
                    }
                }

                lines = match[0].match(/(?:\r\n?|\n).*/g);
                if (lines) {
                    this.yylineno += lines.length;
                }
                this.yylloc = {
                    first_line: this.yylloc.last_line,
                    last_line: this.yylineno + 1,
                    first_column: this.yylloc.last_column,
                    last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length
                };
                this.yytext += match[0];
                this.match += match[0];
                this.matches = match;
                this.yyleng = this.yytext.length;
                if (this.options.ranges) {
                    this.yylloc.range = [this.offset, this.offset += this.yyleng];
                }
                this._more = false;
                this._backtrack = false;
                this._input = this._input.slice(match[0].length);
                this.matched += match[0];
                token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
                if (this.done && this._input) {
                    this.done = false;
                }
                if (token) {
                    return token;
                } else if (this._backtrack) {
                    // recover context
                    for (var k in backup) {
                        this[k] = backup[k];
                    }
                    return false; // rule action called reject() implying the next rule should be tested instead.
                }
                return false;
            },

            // return next match in input
            next: function next() {
                if (this.done) {
                    return this.EOF;
                }
                if (!this._input) {
                    this.done = true;
                }

                var token, match, tempMatch, index;
                if (!this._more) {
                    this.yytext = '';
                    this.match = '';
                }
                var rules = this._currentRules();
                for (var i = 0; i < rules.length; i++) {
                    tempMatch = this._input.match(this.rules[rules[i]]);
                    if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                        match = tempMatch;
                        index = i;
                        if (this.options.backtrack_lexer) {
                            token = this.test_match(tempMatch, rules[i]);
                            if (token !== false) {
                                return token;
                            } else if (this._backtrack) {
                                match = false;
                                continue; // rule action called reject() implying a rule MISmatch.
                            } else {
                                    // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                                    return false;
                                }
                        } else if (!this.options.flex) {
                            break;
                        }
                    }
                }
                if (match) {
                    token = this.test_match(match, rules[index]);
                    if (token !== false) {
                        return token;
                    }
                    // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                    return false;
                }
                if (this._input === "") {
                    return this.EOF;
                } else {
                    return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                        text: "",
                        token: null,
                        line: this.yylineno
                    });
                }
            },

            // return next match that has a token
            lex: function lex() {
                var r = this.next();
                if (r) {
                    return r;
                } else {
                    return this.lex();
                }
            },

            // activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
            begin: function begin(condition) {
                this.conditionStack.push(condition);
            },

            // pop the previously active lexer condition state off the condition stack
            popState: function popState() {
                var n = this.conditionStack.length - 1;
                if (n > 0) {
                    return this.conditionStack.pop();
                } else {
                    return this.conditionStack[0];
                }
            },

            // produce the lexer rule set which is active for the currently active lexer condition state
            _currentRules: function _currentRules() {
                if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
                    return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
                } else {
                    return this.conditions["INITIAL"].rules;
                }
            },

            // return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
            topState: function topState(n) {
                n = this.conditionStack.length - 1 - Math.abs(n || 0);
                if (n >= 0) {
                    return this.conditionStack[n];
                } else {
                    return "INITIAL";
                }
            },

            // alias for begin(condition)
            pushState: function pushState(condition) {
                this.begin(condition);
            },

            // return the number of states currently on the stack
            stateStackSize: function stateStackSize() {
                return this.conditionStack.length;
            },
            options: {},
            performAction: function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {
                var YYSTATE = YY_START;
                switch ($avoiding_name_collisions) {
                    case 0:
                        /* skip comments */
                        break;
                    case 1:
                        /* skip comments */
                        break;
                    case 2:
                        return "t_oparen";
                        break;
                    case 3:
                        return "t_cparen";
                        break;
                    case 4:
                        return "t_obracket";
                        break;
                    case 5:
                        return "t_cbracket";
                        break;
                    case 6:
                        return "t_true";
                        break;
                    case 7:
                        return "t_false";
                        break;
                    case 8:
                        return "t_note";
                        break;
                    case 9:
                        return "t_beat";
                        break;
                    case 10:
                        return "t_let";
                        break;
                    case 11:
                        return "t_def";
                        break;
                    case 12:
                        return "t_lambda";
                        break;
                    case 13:
                        return "t_if";
                        break;
                    case 14:
                        return "t_list";
                        break;
                    case 15:
                        return "t_map";
                        break;
                    case 16:
                        return "t_symbol";
                        break;
                    case 17:
                        return "t_number";
                        break;
                    case 18:
                        return "t_id";
                        break;
                    case 19:
                        yy_.yytext = yy_.yytext.substr(1, yy_.yyleng - 2);return "t_string";
                        break;
                    case 20:
                        return "t_eof";
                        break;
                    case 21:
                        /* skip whitespace */
                        break;
                    case 22:
                        return "INVALID";
                        break;
                }
            },
            rules: [/^(?:;.*\n)/, /^(?:;.*$)/, /^(?:\()/, /^(?:\))/, /^(?:\[)/, /^(?:\])/, /^(?:#t\b)/, /^(?:#f\b)/, /^(?:((')[A-G]([#b])?[0-9]+))/, /^(?:((')([0-9])+(\.([0-9])+)?))/, /^(?:let\b)/, /^(?:def\b)/, /^(?:lambda\b)/, /^(?:if\b)/, /^(?:list\b)/, /^(?:map\b)/, /^(?:(:)(((([a-zA-Z])|([!$%&*\/<=>?~_^]))((([a-zA-Z])|([!$%&*\/<=>?~_^]))|([0-9])|([\.\+\-:']))*)|[\+\-]))/, /^(?:((-)?([0-9])+(\.([0-9])+)?))/, /^(?:(((([a-zA-Z])|([!$%&*\/<=>?~_^]))((([a-zA-Z])|([!$%&*\/<=>?~_^]))|([0-9])|([\.\+\-:']))*)|[\+\-]))/, /^(?:(")((([a-zA-Z])|([0-9])|([!$%&*\/<=>?~_^])|([\.\+\-:']))*)("))/, /^(?:$)/, /^(?:\s+)/, /^(?:.)/],
            conditions: { "INITIAL": { "rules": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22], "inclusive": true } }
        };
        return lexer;
    })();
    parser.lexer = lexer;
    function Parser() {
        this.yy = {};
    }
    Parser.prototype = parser;parser.Parser = Parser;
    return new Parser();
})();

if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
    exports.parser = jisonParser;
    exports.Parser = jisonParser.Parser;
    exports.parse = function () {
        return jisonParser.parse.apply(jisonParser, arguments);
    };
    exports.main = function commonjsMain(args) {
        if (!args[1]) {
            console.log('Usage: ' + args[0] + ' FILE');
            process.exit(1);
        }
        var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
        return exports.parser.parse(source);
    };
    if (typeof module !== 'undefined' && require.main === module) {
        exports.main(process.argv.slice(1));
    }
}

}).call(this,require('_process'))
},{"../app/ast":14,"_process":3,"fs":1,"path":2}],40:[function(require,module,exports){
"use strict";

var tutorials = {};

tutorials.data = {};

tutorials.names = ["math"];

tutorials.data.math = "\n\
; simple maths\n\
\n\
(define a 3)\n\
(define b 5)\n\
\n\
(display (+ a (* b 4)))\n\
";

module.exports = tutorials;

},{}],41:[function(require,module,exports){
/*!
 * jQuery JavaScript Library v2.1.3
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-12-18T15:11Z
 */"use strict";(function(global,factory){if(typeof module === "object" && typeof module.exports === "object"){ // For CommonJS and CommonJS-like environments where a proper `window`
// is present, execute the factory and get jQuery.
// For environments that do not have a `window` with a `document`
// (such as Node.js), expose a factory as module.exports.
// This accentuates the need for the creation of a real `window`.
// e.g. var jQuery = require("jquery")(window);
// See ticket #14549 for more info.
module.exports = global.document?factory(global,true):function(w){if(!w.document){throw new Error("jQuery requires a window with a document");}return factory(w);};}else {factory(global);} // Pass this if window is not defined yet
})(typeof window !== "undefined"?window:undefined,function(window,noGlobal){ // Support: Firefox 18+
// Can't be in strict mode, several libs including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
//
var arr=[];var _slice=arr.slice;var concat=arr.concat;var push=arr.push;var indexOf=arr.indexOf;var class2type={};var toString=class2type.toString;var hasOwn=class2type.hasOwnProperty;var support={};var  // Use the correct document accordingly with window argument (sandbox)
document=window.document,version="2.1.3", // Define a local copy of jQuery
jQuery=function jQuery(selector,context){ // The jQuery object is actually just the init constructor 'enhanced'
// Need init if jQuery is called (just allow error to be thrown if not included)
return new jQuery.fn.init(selector,context);}, // Support: Android<4.1
// Make sure we trim BOM and NBSP
rtrim=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, // Matches dashed string for camelizing
rmsPrefix=/^-ms-/,rdashAlpha=/-([\da-z])/gi, // Used by jQuery.camelCase as callback to replace()
fcamelCase=function fcamelCase(all,letter){return letter.toUpperCase();};jQuery.fn = jQuery.prototype = { // The current version of jQuery being used
jquery:version,constructor:jQuery, // Start with an empty selector
selector:"", // The default length of a jQuery object is 0
length:0,toArray:function toArray(){return _slice.call(this);}, // Get the Nth element in the matched element set OR
// Get the whole matched element set as a clean array
get:function get(num){return num != null? // Return just the one element from the set
num < 0?this[num + this.length]:this[num]: // Return all the elements in a clean array
_slice.call(this);}, // Take an array of elements and push it onto the stack
// (returning the new matched element set)
pushStack:function pushStack(elems){ // Build a new jQuery matched element set
var ret=jQuery.merge(this.constructor(),elems); // Add the old object onto the stack (as a reference)
ret.prevObject = this;ret.context = this.context; // Return the newly-formed element set
return ret;}, // Execute a callback for every element in the matched set.
// (You can seed the arguments with an array of args, but this is
// only used internally.)
each:function each(callback,args){return jQuery.each(this,callback,args);},map:function map(callback){return this.pushStack(jQuery.map(this,function(elem,i){return callback.call(elem,i,elem);}));},slice:function slice(){return this.pushStack(_slice.apply(this,arguments));},first:function first(){return this.eq(0);},last:function last(){return this.eq(-1);},eq:function eq(i){var len=this.length,j=+i + (i < 0?len:0);return this.pushStack(j >= 0 && j < len?[this[j]]:[]);},end:function end(){return this.prevObject || this.constructor(null);}, // For internal use only.
// Behaves like an Array's method, not like a jQuery method.
push:push,sort:arr.sort,splice:arr.splice};jQuery.extend = jQuery.fn.extend = function(){var options,name,src,copy,copyIsArray,clone,target=arguments[0] || {},i=1,length=arguments.length,deep=false; // Handle a deep copy situation
if(typeof target === "boolean"){deep = target; // Skip the boolean and the target
target = arguments[i] || {};i++;} // Handle case when target is a string or something (possible in deep copy)
if(typeof target !== "object" && !jQuery.isFunction(target)){target = {};} // Extend jQuery itself if only one argument is passed
if(i === length){target = this;i--;}for(;i < length;i++) { // Only deal with non-null/undefined values
if((options = arguments[i]) != null){ // Extend the base object
for(name in options) {src = target[name];copy = options[name]; // Prevent never-ending loop
if(target === copy){continue;} // Recurse if we're merging plain objects or arrays
if(deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))){if(copyIsArray){copyIsArray = false;clone = src && jQuery.isArray(src)?src:[];}else {clone = src && jQuery.isPlainObject(src)?src:{};} // Never move original objects, clone them
target[name] = jQuery.extend(deep,clone,copy); // Don't bring in undefined values
}else if(copy !== undefined){target[name] = copy;}}}} // Return the modified object
return target;};jQuery.extend({ // Unique for each copy of jQuery on the page
expando:"jQuery" + (version + Math.random()).replace(/\D/g,""), // Assume jQuery is ready without the ready module
isReady:true,error:function error(msg){throw new Error(msg);},noop:function noop(){},isFunction:function isFunction(obj){return jQuery.type(obj) === "function";},isArray:Array.isArray,isWindow:function isWindow(obj){return obj != null && obj === obj.window;},isNumeric:function isNumeric(obj){ // parseFloat NaNs numeric-cast false positives (null|true|false|"")
// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
// subtraction forces infinities to NaN
// adding 1 corrects loss of precision from parseFloat (#15100)
return !jQuery.isArray(obj) && obj - parseFloat(obj) + 1 >= 0;},isPlainObject:function isPlainObject(obj){ // Not plain objects:
// - Any object or value whose internal [[Class]] property is not "[object Object]"
// - DOM nodes
// - window
if(jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow(obj)){return false;}if(obj.constructor && !hasOwn.call(obj.constructor.prototype,"isPrototypeOf")){return false;} // If the function hasn't returned already, we're confident that
// |obj| is a plain object, created by {} or constructed with new Object
return true;},isEmptyObject:function isEmptyObject(obj){var name;for(name in obj) {return false;}return true;},type:function type(obj){if(obj == null){return obj + "";} // Support: Android<4.0, iOS<6 (functionish RegExp)
return typeof obj === "object" || typeof obj === "function"?class2type[toString.call(obj)] || "object":typeof obj;}, // Evaluates a script in a global context
globalEval:function globalEval(code){var script,indirect=eval;code = jQuery.trim(code);if(code){ // If the code includes a valid, prologue position
// strict mode pragma, execute code by injecting a
// script tag into the document.
if(code.indexOf("use strict") === 1){script = document.createElement("script");script.text = code;document.head.appendChild(script).parentNode.removeChild(script);}else { // Otherwise, avoid the DOM node creation, insertion
// and removal by using an indirect global eval
indirect(code);}}}, // Convert dashed to camelCase; used by the css and data modules
// Support: IE9-11+
// Microsoft forgot to hump their vendor prefix (#9572)
camelCase:function camelCase(string){return string.replace(rmsPrefix,"ms-").replace(rdashAlpha,fcamelCase);},nodeName:function nodeName(elem,name){return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();}, // args is for internal usage only
each:function each(obj,callback,args){var value,i=0,length=obj.length,isArray=isArraylike(obj);if(args){if(isArray){for(;i < length;i++) {value = callback.apply(obj[i],args);if(value === false){break;}}}else {for(i in obj) {value = callback.apply(obj[i],args);if(value === false){break;}}} // A special, fast, case for the most common use of each
}else {if(isArray){for(;i < length;i++) {value = callback.call(obj[i],i,obj[i]);if(value === false){break;}}}else {for(i in obj) {value = callback.call(obj[i],i,obj[i]);if(value === false){break;}}}}return obj;}, // Support: Android<4.1
trim:function trim(text){return text == null?"":(text + "").replace(rtrim,"");}, // results is for internal usage only
makeArray:function makeArray(arr,results){var ret=results || [];if(arr != null){if(isArraylike(Object(arr))){jQuery.merge(ret,typeof arr === "string"?[arr]:arr);}else {push.call(ret,arr);}}return ret;},inArray:function inArray(elem,arr,i){return arr == null?-1:indexOf.call(arr,elem,i);},merge:function merge(first,second){var len=+second.length,j=0,i=first.length;for(;j < len;j++) {first[i++] = second[j];}first.length = i;return first;},grep:function grep(elems,callback,invert){var callbackInverse,matches=[],i=0,length=elems.length,callbackExpect=!invert; // Go through the array, only saving the items
// that pass the validator function
for(;i < length;i++) {callbackInverse = !callback(elems[i],i);if(callbackInverse !== callbackExpect){matches.push(elems[i]);}}return matches;}, // arg is for internal usage only
map:function map(elems,callback,arg){var value,i=0,length=elems.length,isArray=isArraylike(elems),ret=[]; // Go through the array, translating each of the items to their new values
if(isArray){for(;i < length;i++) {value = callback(elems[i],i,arg);if(value != null){ret.push(value);}} // Go through every key on the object,
}else {for(i in elems) {value = callback(elems[i],i,arg);if(value != null){ret.push(value);}}} // Flatten any nested arrays
return concat.apply([],ret);}, // A global GUID counter for objects
guid:1, // Bind a function to a context, optionally partially applying any
// arguments.
proxy:function proxy(fn,context){var tmp,args,proxy;if(typeof context === "string"){tmp = fn[context];context = fn;fn = tmp;} // Quick check to determine if target is callable, in the spec
// this throws a TypeError, but we will just return undefined.
if(!jQuery.isFunction(fn)){return undefined;} // Simulated bind
args = _slice.call(arguments,2);proxy = function(){return fn.apply(context || this,args.concat(_slice.call(arguments)));}; // Set the guid of unique handler to the same of original handler, so it can be removed
proxy.guid = fn.guid = fn.guid || jQuery.guid++;return proxy;},now:Date.now, // jQuery.support is not used in Core but other projects attach their
// properties to it so it needs to exist.
support:support}); // Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(i,name){class2type["[object " + name + "]"] = name.toLowerCase();});function isArraylike(obj){var length=obj.length,type=jQuery.type(obj);if(type === "function" || jQuery.isWindow(obj)){return false;}if(obj.nodeType === 1 && length){return true;}return type === "array" || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;}var Sizzle= /*!
 * Sizzle CSS Selector Engine v2.2.0-pre
 * http://sizzlejs.com/
 *
 * Copyright 2008, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-12-16
 */(function(window){var i,support,Expr,getText,isXML,tokenize,compile,select,outermostContext,sortInput,hasDuplicate, // Local document vars
setDocument,document,docElem,documentIsHTML,rbuggyQSA,rbuggyMatches,matches,contains, // Instance-specific data
expando="sizzle" + 1 * new Date(),preferredDoc=window.document,dirruns=0,done=0,classCache=createCache(),tokenCache=createCache(),compilerCache=createCache(),sortOrder=function sortOrder(a,b){if(a === b){hasDuplicate = true;}return 0;}, // General-purpose constants
MAX_NEGATIVE=1 << 31, // Instance methods
hasOwn=({}).hasOwnProperty,arr=[],pop=arr.pop,push_native=arr.push,push=arr.push,slice=arr.slice, // Use a stripped-down indexOf as it's faster than native
// http://jsperf.com/thor-indexof-vs-for/5
indexOf=function indexOf(list,elem){var i=0,len=list.length;for(;i < len;i++) {if(list[i] === elem){return i;}}return -1;},booleans="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", // Regular expressions
// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
whitespace="[\\x20\\t\\r\\n\\f]", // http://www.w3.org/TR/css3-syntax/#characters
characterEncoding="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+", // Loosely modeled on CSS identifier characters
// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
identifier=characterEncoding.replace("w","w#"), // Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
attributes="\\[" + whitespace + "*(" + characterEncoding + ")(?:" + whitespace +  // Operator (capture 2)
"*([*^$|!~]?=)" + whitespace +  // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace + "*\\]",pseudos=":(" + characterEncoding + ")(?:\\((" +  // To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
// 1. quoted (capture 3; capture 4 or capture 5)
"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +  // 2. simple (capture 6)
"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +  // 3. anything else (capture 2)
".*" + ")\\)|)", // Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
rwhitespace=new RegExp(whitespace + "+","g"),rtrim=new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$","g"),rcomma=new RegExp("^" + whitespace + "*," + whitespace + "*"),rcombinators=new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"),rattributeQuotes=new RegExp("=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]","g"),rpseudo=new RegExp(pseudos),ridentifier=new RegExp("^" + identifier + "$"),matchExpr={"ID":new RegExp("^#(" + characterEncoding + ")"),"CLASS":new RegExp("^\\.(" + characterEncoding + ")"),"TAG":new RegExp("^(" + characterEncoding.replace("w","w*") + ")"),"ATTR":new RegExp("^" + attributes),"PSEUDO":new RegExp("^" + pseudos),"CHILD":new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)","i"),"bool":new RegExp("^(?:" + booleans + ")$","i"), // For use in libraries implementing .is()
// We use this for POS matching in `select`
"needsContext":new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)","i")},rinputs=/^(?:input|select|textarea|button)$/i,rheader=/^h\d$/i,rnative=/^[^{]+\{\s*\[native \w/, // Easily-parseable/retrievable ID or TAG or CLASS selectors
rquickExpr=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,rsibling=/[+~]/,rescape=/'|\\/g, // CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
runescape=new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)","ig"),funescape=function funescape(_,escaped,escapedWhitespace){var high="0x" + escaped - 0x10000; // NaN means non-codepoint
// Support: Firefox<24
// Workaround erroneous numeric interpretation of +"0x"
return high !== high || escapedWhitespace?escaped:high < 0? // BMP codepoint
String.fromCharCode(high + 0x10000): // Supplemental Plane codepoint (surrogate pair)
String.fromCharCode(high >> 10 | 0xD800,high & 0x3FF | 0xDC00);}, // Used for iframes
// See setDocument()
// Removing the function wrapper causes a "Permission Denied"
// error in IE
unloadHandler=function unloadHandler(){setDocument();}; // Optimize for push.apply( _, NodeList )
try{push.apply(arr = slice.call(preferredDoc.childNodes),preferredDoc.childNodes); // Support: Android<4.0
// Detect silently failing push.apply
arr[preferredDoc.childNodes.length].nodeType;}catch(e) {push = {apply:arr.length? // Leverage slice if possible
function(target,els){push_native.apply(target,slice.call(els));}: // Support: IE<9
function(target,els){var j=target.length,i=0; // Can't trust NodeList.length
while(target[j++] = els[i++]) {}target.length = j - 1;}};}function Sizzle(selector,context,results,seed){var match,elem,m,nodeType, // QSA vars
i,groups,old,nid,newContext,newSelector;if((context?context.ownerDocument || context:preferredDoc) !== document){setDocument(context);}context = context || document;results = results || [];nodeType = context.nodeType;if(typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11){return results;}if(!seed && documentIsHTML){ // Try to shortcut find operations when possible (e.g., not under DocumentFragment)
if(nodeType !== 11 && (match = rquickExpr.exec(selector))){ // Speed-up: Sizzle("#ID")
if(m = match[1]){if(nodeType === 9){elem = context.getElementById(m); // Check parentNode to catch when Blackberry 4.6 returns
// nodes that are no longer in the document (jQuery #6963)
if(elem && elem.parentNode){ // Handle the case where IE, Opera, and Webkit return items
// by name instead of ID
if(elem.id === m){results.push(elem);return results;}}else {return results;}}else { // Context is not a document
if(context.ownerDocument && (elem = context.ownerDocument.getElementById(m)) && contains(context,elem) && elem.id === m){results.push(elem);return results;}} // Speed-up: Sizzle("TAG")
}else if(match[2]){push.apply(results,context.getElementsByTagName(selector));return results; // Speed-up: Sizzle(".CLASS")
}else if((m = match[3]) && support.getElementsByClassName){push.apply(results,context.getElementsByClassName(m));return results;}} // QSA path
if(support.qsa && (!rbuggyQSA || !rbuggyQSA.test(selector))){nid = old = expando;newContext = context;newSelector = nodeType !== 1 && selector; // qSA works strangely on Element-rooted queries
// We can work around this by specifying an extra ID on the root
// and working up from there (Thanks to Andrew Dupont for the technique)
// IE 8 doesn't work on object elements
if(nodeType === 1 && context.nodeName.toLowerCase() !== "object"){groups = tokenize(selector);if(old = context.getAttribute("id")){nid = old.replace(rescape,"\\$&");}else {context.setAttribute("id",nid);}nid = "[id='" + nid + "'] ";i = groups.length;while(i--) {groups[i] = nid + toSelector(groups[i]);}newContext = rsibling.test(selector) && testContext(context.parentNode) || context;newSelector = groups.join(",");}if(newSelector){try{push.apply(results,newContext.querySelectorAll(newSelector));return results;}catch(qsaError) {}finally {if(!old){context.removeAttribute("id");}}}}} // All others
return select(selector.replace(rtrim,"$1"),context,results,seed);} /**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */function createCache(){var keys=[];function cache(key,value){ // Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
if(keys.push(key + " ") > Expr.cacheLength){ // Only keep the most recent entries
delete cache[keys.shift()];}return cache[key + " "] = value;}return cache;} /**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */function markFunction(fn){fn[expando] = true;return fn;} /**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */function assert(fn){var div=document.createElement("div");try{return !!fn(div);}catch(e) {return false;}finally { // Remove from its parent by default
if(div.parentNode){div.parentNode.removeChild(div);} // release memory in IE
div = null;}} /**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */function addHandle(attrs,handler){var arr=attrs.split("|"),i=attrs.length;while(i--) {Expr.attrHandle[arr[i]] = handler;}} /**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */function siblingCheck(a,b){var cur=b && a,diff=cur && a.nodeType === 1 && b.nodeType === 1 && (~b.sourceIndex || MAX_NEGATIVE) - (~a.sourceIndex || MAX_NEGATIVE); // Use IE sourceIndex if available on both nodes
if(diff){return diff;} // Check if b follows a
if(cur){while(cur = cur.nextSibling) {if(cur === b){return -1;}}}return a?1:-1;} /**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */function createInputPseudo(type){return function(elem){var name=elem.nodeName.toLowerCase();return name === "input" && elem.type === type;};} /**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */function createButtonPseudo(type){return function(elem){var name=elem.nodeName.toLowerCase();return (name === "input" || name === "button") && elem.type === type;};} /**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */function createPositionalPseudo(fn){return markFunction(function(argument){argument = +argument;return markFunction(function(seed,matches){var j,matchIndexes=fn([],seed.length,argument),i=matchIndexes.length; // Match elements found at the specified indexes
while(i--) {if(seed[j = matchIndexes[i]]){seed[j] = !(matches[j] = seed[j]);}}});});} /**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */function testContext(context){return context && typeof context.getElementsByTagName !== "undefined" && context;} // Expose support vars for convenience
support = Sizzle.support = {}; /**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */isXML = Sizzle.isXML = function(elem){ // documentElement is verified for cases where it doesn't yet exist
// (such as loading iframes in IE - #4833)
var documentElement=elem && (elem.ownerDocument || elem).documentElement;return documentElement?documentElement.nodeName !== "HTML":false;}; /**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */setDocument = Sizzle.setDocument = function(node){var hasCompare,parent,doc=node?node.ownerDocument || node:preferredDoc; // If no document and documentElement is available, return
if(doc === document || doc.nodeType !== 9 || !doc.documentElement){return document;} // Set our document
document = doc;docElem = doc.documentElement;parent = doc.defaultView; // Support: IE>8
// If iframe document is assigned to "document" variable and if iframe has been reloaded,
// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
// IE6-8 do not support the defaultView property so parent will be undefined
if(parent && parent !== parent.top){ // IE11 does not have attachEvent, so all must suffer
if(parent.addEventListener){parent.addEventListener("unload",unloadHandler,false);}else if(parent.attachEvent){parent.attachEvent("onunload",unloadHandler);}} /* Support tests
	---------------------------------------------------------------------- */documentIsHTML = !isXML(doc); /* Attributes
	---------------------------------------------------------------------- */ // Support: IE<8
// Verify that getAttribute really returns attributes and not properties
// (excepting IE8 booleans)
support.attributes = assert(function(div){div.className = "i";return !div.getAttribute("className");}); /* getElement(s)By*
	---------------------------------------------------------------------- */ // Check if getElementsByTagName("*") returns only elements
support.getElementsByTagName = assert(function(div){div.appendChild(doc.createComment(""));return !div.getElementsByTagName("*").length;}); // Support: IE<9
support.getElementsByClassName = rnative.test(doc.getElementsByClassName); // Support: IE<10
// Check if getElementById returns elements by name
// The broken getElementById methods don't pick up programatically-set names,
// so use a roundabout getElementsByName test
support.getById = assert(function(div){docElem.appendChild(div).id = expando;return !doc.getElementsByName || !doc.getElementsByName(expando).length;}); // ID find and filter
if(support.getById){Expr.find["ID"] = function(id,context){if(typeof context.getElementById !== "undefined" && documentIsHTML){var m=context.getElementById(id); // Check parentNode to catch when Blackberry 4.6 returns
// nodes that are no longer in the document #6963
return m && m.parentNode?[m]:[];}};Expr.filter["ID"] = function(id){var attrId=id.replace(runescape,funescape);return function(elem){return elem.getAttribute("id") === attrId;};};}else { // Support: IE6/7
// getElementById is not reliable as a find shortcut
delete Expr.find["ID"];Expr.filter["ID"] = function(id){var attrId=id.replace(runescape,funescape);return function(elem){var node=typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");return node && node.value === attrId;};};} // Tag
Expr.find["TAG"] = support.getElementsByTagName?function(tag,context){if(typeof context.getElementsByTagName !== "undefined"){return context.getElementsByTagName(tag); // DocumentFragment nodes don't have gEBTN
}else if(support.qsa){return context.querySelectorAll(tag);}}:function(tag,context){var elem,tmp=[],i=0, // By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
results=context.getElementsByTagName(tag); // Filter out possible comments
if(tag === "*"){while(elem = results[i++]) {if(elem.nodeType === 1){tmp.push(elem);}}return tmp;}return results;}; // Class
Expr.find["CLASS"] = support.getElementsByClassName && function(className,context){if(documentIsHTML){return context.getElementsByClassName(className);}}; /* QSA/matchesSelector
	---------------------------------------------------------------------- */ // QSA and matchesSelector support
// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
rbuggyMatches = []; // qSa(:focus) reports false when true (Chrome 21)
// We allow this because of a bug in IE8/9 that throws an error
// whenever `document.activeElement` is accessed on an iframe
// So, we allow :focus to pass through QSA all the time to avoid the IE error
// See http://bugs.jquery.com/ticket/13378
rbuggyQSA = [];if(support.qsa = rnative.test(doc.querySelectorAll)){ // Build QSA regex
// Regex strategy adopted from Diego Perini
assert(function(div){ // Select is set to empty string on purpose
// This is to test IE's treatment of not explicitly
// setting a boolean content attribute,
// since its presence should be enough
// http://bugs.jquery.com/ticket/12359
docElem.appendChild(div).innerHTML = "<a id='" + expando + "'></a>" + "<select id='" + expando + "-\f]' msallowcapture=''>" + "<option selected=''></option></select>"; // Support: IE8, Opera 11-12.16
// Nothing should be selected when empty strings follow ^= or $= or *=
// The test attribute must be unknown in Opera but "safe" for WinRT
// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
if(div.querySelectorAll("[msallowcapture^='']").length){rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")");} // Support: IE8
// Boolean attributes and "value" are not treated correctly
if(!div.querySelectorAll("[selected]").length){rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");} // Support: Chrome<29, Android<4.2+, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.7+
if(!div.querySelectorAll("[id~=" + expando + "-]").length){rbuggyQSA.push("~=");} // Webkit/Opera - :checked should return selected option elements
// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
// IE8 throws error here and will not see later tests
if(!div.querySelectorAll(":checked").length){rbuggyQSA.push(":checked");} // Support: Safari 8+, iOS 8+
// https://bugs.webkit.org/show_bug.cgi?id=136851
// In-page `selector#id sibing-combinator selector` fails
if(!div.querySelectorAll("a#" + expando + "+*").length){rbuggyQSA.push(".#.+[+~]");}});assert(function(div){ // Support: Windows 8 Native Apps
// The type and name attributes are restricted during .innerHTML assignment
var input=doc.createElement("input");input.setAttribute("type","hidden");div.appendChild(input).setAttribute("name","D"); // Support: IE8
// Enforce case-sensitivity of name attribute
if(div.querySelectorAll("[name=d]").length){rbuggyQSA.push("name" + whitespace + "*[*^$|!~]?=");} // FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
// IE8 throws error here and will not see later tests
if(!div.querySelectorAll(":enabled").length){rbuggyQSA.push(":enabled",":disabled");} // Opera 10-11 does not throw on post-comma invalid pseudos
div.querySelectorAll("*,:x");rbuggyQSA.push(",.*:");});}if(support.matchesSelector = rnative.test(matches = docElem.matches || docElem.webkitMatchesSelector || docElem.mozMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector)){assert(function(div){ // Check to see if it's possible to do matchesSelector
// on a disconnected node (IE 9)
support.disconnectedMatch = matches.call(div,"div"); // This should fail with an exception
// Gecko does not error, returns false instead
matches.call(div,"[s!='']:x");rbuggyMatches.push("!=",pseudos);});}rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|")); /* Contains
	---------------------------------------------------------------------- */hasCompare = rnative.test(docElem.compareDocumentPosition); // Element contains another
// Purposefully does not implement inclusive descendent
// As in, an element does not contain itself
contains = hasCompare || rnative.test(docElem.contains)?function(a,b){var adown=a.nodeType === 9?a.documentElement:a,bup=b && b.parentNode;return a === bup || !!(bup && bup.nodeType === 1 && (adown.contains?adown.contains(bup):a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));}:function(a,b){if(b){while(b = b.parentNode) {if(b === a){return true;}}}return false;}; /* Sorting
	---------------------------------------------------------------------- */ // Document order sorting
sortOrder = hasCompare?function(a,b){ // Flag for duplicate removal
if(a === b){hasDuplicate = true;return 0;} // Sort on method existence if only one input has compareDocumentPosition
var compare=!a.compareDocumentPosition - !b.compareDocumentPosition;if(compare){return compare;} // Calculate position if both inputs belong to the same document
compare = (a.ownerDocument || a) === (b.ownerDocument || b)?a.compareDocumentPosition(b): // Otherwise we know they are disconnected
1; // Disconnected nodes
if(compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare){ // Choose the first element that is related to our preferred document
if(a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc,a)){return -1;}if(b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc,b)){return 1;} // Maintain original order
return sortInput?indexOf(sortInput,a) - indexOf(sortInput,b):0;}return compare & 4?-1:1;}:function(a,b){ // Exit early if the nodes are identical
if(a === b){hasDuplicate = true;return 0;}var cur,i=0,aup=a.parentNode,bup=b.parentNode,ap=[a],bp=[b]; // Parentless nodes are either documents or disconnected
if(!aup || !bup){return a === doc?-1:b === doc?1:aup?-1:bup?1:sortInput?indexOf(sortInput,a) - indexOf(sortInput,b):0; // If the nodes are siblings, we can do a quick check
}else if(aup === bup){return siblingCheck(a,b);} // Otherwise we need full lists of their ancestors for comparison
cur = a;while(cur = cur.parentNode) {ap.unshift(cur);}cur = b;while(cur = cur.parentNode) {bp.unshift(cur);} // Walk down the tree looking for a discrepancy
while(ap[i] === bp[i]) {i++;}return i? // Do a sibling check if the nodes have a common ancestor
siblingCheck(ap[i],bp[i]): // Otherwise nodes in our document sort first
ap[i] === preferredDoc?-1:bp[i] === preferredDoc?1:0;};return doc;};Sizzle.matches = function(expr,elements){return Sizzle(expr,null,null,elements);};Sizzle.matchesSelector = function(elem,expr){ // Set document vars if needed
if((elem.ownerDocument || elem) !== document){setDocument(elem);} // Make sure that attribute selectors are quoted
expr = expr.replace(rattributeQuotes,"='$1']");if(support.matchesSelector && documentIsHTML && (!rbuggyMatches || !rbuggyMatches.test(expr)) && (!rbuggyQSA || !rbuggyQSA.test(expr))){try{var ret=matches.call(elem,expr); // IE 9's matchesSelector returns false on disconnected nodes
if(ret || support.disconnectedMatch ||  // As well, disconnected nodes are said to be in a document
// fragment in IE 9
elem.document && elem.document.nodeType !== 11){return ret;}}catch(e) {}}return Sizzle(expr,document,null,[elem]).length > 0;};Sizzle.contains = function(context,elem){ // Set document vars if needed
if((context.ownerDocument || context) !== document){setDocument(context);}return contains(context,elem);};Sizzle.attr = function(elem,name){ // Set document vars if needed
if((elem.ownerDocument || elem) !== document){setDocument(elem);}var fn=Expr.attrHandle[name.toLowerCase()], // Don't get fooled by Object.prototype properties (jQuery #13807)
val=fn && hasOwn.call(Expr.attrHandle,name.toLowerCase())?fn(elem,name,!documentIsHTML):undefined;return val !== undefined?val:support.attributes || !documentIsHTML?elem.getAttribute(name):(val = elem.getAttributeNode(name)) && val.specified?val.value:null;};Sizzle.error = function(msg){throw new Error("Syntax error, unrecognized expression: " + msg);}; /**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */Sizzle.uniqueSort = function(results){var elem,duplicates=[],j=0,i=0; // Unless we *know* we can detect duplicates, assume their presence
hasDuplicate = !support.detectDuplicates;sortInput = !support.sortStable && results.slice(0);results.sort(sortOrder);if(hasDuplicate){while(elem = results[i++]) {if(elem === results[i]){j = duplicates.push(i);}}while(j--) {results.splice(duplicates[j],1);}} // Clear input after sorting to release objects
// See https://github.com/jquery/sizzle/pull/225
sortInput = null;return results;}; /**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */getText = Sizzle.getText = function(elem){var node,ret="",i=0,nodeType=elem.nodeType;if(!nodeType){ // If no nodeType, this is expected to be an array
while(node = elem[i++]) { // Do not traverse comment nodes
ret += getText(node);}}else if(nodeType === 1 || nodeType === 9 || nodeType === 11){ // Use textContent for elements
// innerText usage removed for consistency of new lines (jQuery #11153)
if(typeof elem.textContent === "string"){return elem.textContent;}else { // Traverse its children
for(elem = elem.firstChild;elem;elem = elem.nextSibling) {ret += getText(elem);}}}else if(nodeType === 3 || nodeType === 4){return elem.nodeValue;} // Do not include comment or processing instruction nodes
return ret;};Expr = Sizzle.selectors = { // Can be adjusted by the user
cacheLength:50,createPseudo:markFunction,match:matchExpr,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:true}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:true},"~":{dir:"previousSibling"}},preFilter:{"ATTR":function ATTR(match){match[1] = match[1].replace(runescape,funescape); // Move the given value to match[3] whether quoted or unquoted
match[3] = (match[3] || match[4] || match[5] || "").replace(runescape,funescape);if(match[2] === "~="){match[3] = " " + match[3] + " ";}return match.slice(0,4);},"CHILD":function CHILD(match){ /* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/match[1] = match[1].toLowerCase();if(match[1].slice(0,3) === "nth"){ // nth-* requires argument
if(!match[3]){Sizzle.error(match[0]);} // numeric x and y parameters for Expr.filter.CHILD
// remember that false/true cast respectively to 0/1
match[4] = +(match[4]?match[5] + (match[6] || 1):2 * (match[3] === "even" || match[3] === "odd"));match[5] = +(match[7] + match[8] || match[3] === "odd"); // other types prohibit arguments
}else if(match[3]){Sizzle.error(match[0]);}return match;},"PSEUDO":function PSEUDO(match){var excess,unquoted=!match[6] && match[2];if(matchExpr["CHILD"].test(match[0])){return null;} // Accept quoted arguments as-is
if(match[3]){match[2] = match[4] || match[5] || ""; // Strip excess characters from unquoted arguments
}else if(unquoted && rpseudo.test(unquoted) && ( // Get excess from tokenize (recursively)
excess = tokenize(unquoted,true)) && ( // advance to the next closing parenthesis
excess = unquoted.indexOf(")",unquoted.length - excess) - unquoted.length)){ // excess is a negative index
match[0] = match[0].slice(0,excess);match[2] = unquoted.slice(0,excess);} // Return only captures needed by the pseudo filter method (type and argument)
return match.slice(0,3);}},filter:{"TAG":function TAG(nodeNameSelector){var nodeName=nodeNameSelector.replace(runescape,funescape).toLowerCase();return nodeNameSelector === "*"?function(){return true;}:function(elem){return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;};},"CLASS":function CLASS(className){var pattern=classCache[className + " "];return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className,function(elem){return pattern.test(typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "");});},"ATTR":function ATTR(name,operator,check){return function(elem){var result=Sizzle.attr(elem,name);if(result == null){return operator === "!=";}if(!operator){return true;}result += "";return operator === "="?result === check:operator === "!="?result !== check:operator === "^="?check && result.indexOf(check) === 0:operator === "*="?check && result.indexOf(check) > -1:operator === "$="?check && result.slice(-check.length) === check:operator === "~="?(" " + result.replace(rwhitespace," ") + " ").indexOf(check) > -1:operator === "|="?result === check || result.slice(0,check.length + 1) === check + "-":false;};},"CHILD":function CHILD(type,what,argument,first,last){var simple=type.slice(0,3) !== "nth",forward=type.slice(-4) !== "last",ofType=what === "of-type";return first === 1 && last === 0? // Shortcut for :nth-*(n)
function(elem){return !!elem.parentNode;}:function(elem,context,xml){var cache,outerCache,node,diff,nodeIndex,start,dir=simple !== forward?"nextSibling":"previousSibling",parent=elem.parentNode,name=ofType && elem.nodeName.toLowerCase(),useCache=!xml && !ofType;if(parent){ // :(first|last|only)-(child|of-type)
if(simple){while(dir) {node = elem;while(node = node[dir]) {if(ofType?node.nodeName.toLowerCase() === name:node.nodeType === 1){return false;}} // Reverse direction for :only-* (if we haven't yet done so)
start = dir = type === "only" && !start && "nextSibling";}return true;}start = [forward?parent.firstChild:parent.lastChild]; // non-xml :nth-child(...) stores cache data on `parent`
if(forward && useCache){ // Seek `elem` from a previously-cached index
outerCache = parent[expando] || (parent[expando] = {});cache = outerCache[type] || [];nodeIndex = cache[0] === dirruns && cache[1];diff = cache[0] === dirruns && cache[2];node = nodeIndex && parent.childNodes[nodeIndex];while(node = ++nodeIndex && node && node[dir] || ( // Fallback to seeking `elem` from the start
diff = nodeIndex = 0) || start.pop()) { // When found, cache indexes on `parent` and break
if(node.nodeType === 1 && ++diff && node === elem){outerCache[type] = [dirruns,nodeIndex,diff];break;}} // Use previously-cached element index if available
}else if(useCache && (cache = (elem[expando] || (elem[expando] = {}))[type]) && cache[0] === dirruns){diff = cache[1]; // xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
}else { // Use the same loop as above to seek `elem` from the start
while(node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {if((ofType?node.nodeName.toLowerCase() === name:node.nodeType === 1) && ++diff){ // Cache the index of each encountered element
if(useCache){(node[expando] || (node[expando] = {}))[type] = [dirruns,diff];}if(node === elem){break;}}}} // Incorporate the offset, then check against cycle size
diff -= last;return diff === first || diff % first === 0 && diff / first >= 0;}};},"PSEUDO":function PSEUDO(pseudo,argument){ // pseudo-class names are case-insensitive
// http://www.w3.org/TR/selectors/#pseudo-classes
// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
// Remember that setFilters inherits from pseudos
var args,fn=Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo); // The user may use createPseudo to indicate that
// arguments are needed to create the filter function
// just as Sizzle does
if(fn[expando]){return fn(argument);} // But maintain support for old signatures
if(fn.length > 1){args = [pseudo,pseudo,"",argument];return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase())?markFunction(function(seed,matches){var idx,matched=fn(seed,argument),i=matched.length;while(i--) {idx = indexOf(seed,matched[i]);seed[idx] = !(matches[idx] = matched[i]);}}):function(elem){return fn(elem,0,args);};}return fn;}},pseudos:{ // Potentially complex pseudos
"not":markFunction(function(selector){ // Trim the selector passed to compile
// to avoid treating leading and trailing
// spaces as combinators
var input=[],results=[],matcher=compile(selector.replace(rtrim,"$1"));return matcher[expando]?markFunction(function(seed,matches,context,xml){var elem,unmatched=matcher(seed,null,xml,[]),i=seed.length; // Match elements unmatched by `matcher`
while(i--) {if(elem = unmatched[i]){seed[i] = !(matches[i] = elem);}}}):function(elem,context,xml){input[0] = elem;matcher(input,null,xml,results); // Don't keep the element (issue #299)
input[0] = null;return !results.pop();};}),"has":markFunction(function(selector){return function(elem){return Sizzle(selector,elem).length > 0;};}),"contains":markFunction(function(text){text = text.replace(runescape,funescape);return function(elem){return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;};}), // "Whether an element is represented by a :lang() selector
// is based solely on the element's language value
// being equal to the identifier C,
// or beginning with the identifier C immediately followed by "-".
// The matching of C against the element's language value is performed case-insensitively.
// The identifier C does not have to be a valid language name."
// http://www.w3.org/TR/selectors/#lang-pseudo
"lang":markFunction(function(lang){ // lang value must be a valid identifier
if(!ridentifier.test(lang || "")){Sizzle.error("unsupported lang: " + lang);}lang = lang.replace(runescape,funescape).toLowerCase();return function(elem){var elemLang;do {if(elemLang = documentIsHTML?elem.lang:elem.getAttribute("xml:lang") || elem.getAttribute("lang")){elemLang = elemLang.toLowerCase();return elemLang === lang || elemLang.indexOf(lang + "-") === 0;}}while((elem = elem.parentNode) && elem.nodeType === 1);return false;};}), // Miscellaneous
"target":function target(elem){var hash=window.location && window.location.hash;return hash && hash.slice(1) === elem.id;},"root":function root(elem){return elem === docElem;},"focus":function focus(elem){return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);}, // Boolean properties
"enabled":function enabled(elem){return elem.disabled === false;},"disabled":function disabled(elem){return elem.disabled === true;},"checked":function checked(elem){ // In CSS3, :checked should return both checked and selected elements
// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
var nodeName=elem.nodeName.toLowerCase();return nodeName === "input" && !!elem.checked || nodeName === "option" && !!elem.selected;},"selected":function selected(elem){ // Accessing this property makes selected-by-default
// options in Safari work properly
if(elem.parentNode){elem.parentNode.selectedIndex;}return elem.selected === true;}, // Contents
"empty":function empty(elem){ // http://www.w3.org/TR/selectors/#empty-pseudo
// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
//   but not by others (comment: 8; processing instruction: 7; etc.)
// nodeType < 6 works because attributes (2) do not appear as children
for(elem = elem.firstChild;elem;elem = elem.nextSibling) {if(elem.nodeType < 6){return false;}}return true;},"parent":function parent(elem){return !Expr.pseudos["empty"](elem);}, // Element/input types
"header":function header(elem){return rheader.test(elem.nodeName);},"input":function input(elem){return rinputs.test(elem.nodeName);},"button":function button(elem){var name=elem.nodeName.toLowerCase();return name === "input" && elem.type === "button" || name === "button";},"text":function text(elem){var attr;return elem.nodeName.toLowerCase() === "input" && elem.type === "text" && ( // Support: IE<8
// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
(attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text");}, // Position-in-collection
"first":createPositionalPseudo(function(){return [0];}),"last":createPositionalPseudo(function(matchIndexes,length){return [length - 1];}),"eq":createPositionalPseudo(function(matchIndexes,length,argument){return [argument < 0?argument + length:argument];}),"even":createPositionalPseudo(function(matchIndexes,length){var i=0;for(;i < length;i += 2) {matchIndexes.push(i);}return matchIndexes;}),"odd":createPositionalPseudo(function(matchIndexes,length){var i=1;for(;i < length;i += 2) {matchIndexes.push(i);}return matchIndexes;}),"lt":createPositionalPseudo(function(matchIndexes,length,argument){var i=argument < 0?argument + length:argument;for(;--i >= 0;) {matchIndexes.push(i);}return matchIndexes;}),"gt":createPositionalPseudo(function(matchIndexes,length,argument){var i=argument < 0?argument + length:argument;for(;++i < length;) {matchIndexes.push(i);}return matchIndexes;})}};Expr.pseudos["nth"] = Expr.pseudos["eq"]; // Add button/input type pseudos
for(i in {radio:true,checkbox:true,file:true,password:true,image:true}) {Expr.pseudos[i] = createInputPseudo(i);}for(i in {submit:true,reset:true}) {Expr.pseudos[i] = createButtonPseudo(i);} // Easy API for creating new setFilters
function setFilters(){}setFilters.prototype = Expr.filters = Expr.pseudos;Expr.setFilters = new setFilters();tokenize = Sizzle.tokenize = function(selector,parseOnly){var matched,match,tokens,type,soFar,groups,preFilters,cached=tokenCache[selector + " "];if(cached){return parseOnly?0:cached.slice(0);}soFar = selector;groups = [];preFilters = Expr.preFilter;while(soFar) { // Comma and first run
if(!matched || (match = rcomma.exec(soFar))){if(match){ // Don't consume trailing commas as valid
soFar = soFar.slice(match[0].length) || soFar;}groups.push(tokens = []);}matched = false; // Combinators
if(match = rcombinators.exec(soFar)){matched = match.shift();tokens.push({value:matched, // Cast descendant combinators to space
type:match[0].replace(rtrim," ")});soFar = soFar.slice(matched.length);} // Filters
for(type in Expr.filter) {if((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))){matched = match.shift();tokens.push({value:matched,type:type,matches:match});soFar = soFar.slice(matched.length);}}if(!matched){break;}} // Return the length of the invalid excess
// if we're just parsing
// Otherwise, throw an error or return tokens
return parseOnly?soFar.length:soFar?Sizzle.error(selector): // Cache the tokens
tokenCache(selector,groups).slice(0);};function toSelector(tokens){var i=0,len=tokens.length,selector="";for(;i < len;i++) {selector += tokens[i].value;}return selector;}function addCombinator(matcher,combinator,base){var dir=combinator.dir,checkNonElements=base && dir === "parentNode",doneName=done++;return combinator.first? // Check against closest ancestor/preceding element
function(elem,context,xml){while(elem = elem[dir]) {if(elem.nodeType === 1 || checkNonElements){return matcher(elem,context,xml);}}}: // Check against all ancestor/preceding elements
function(elem,context,xml){var oldCache,outerCache,newCache=[dirruns,doneName]; // We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
if(xml){while(elem = elem[dir]) {if(elem.nodeType === 1 || checkNonElements){if(matcher(elem,context,xml)){return true;}}}}else {while(elem = elem[dir]) {if(elem.nodeType === 1 || checkNonElements){outerCache = elem[expando] || (elem[expando] = {});if((oldCache = outerCache[dir]) && oldCache[0] === dirruns && oldCache[1] === doneName){ // Assign to newCache so results back-propagate to previous elements
return newCache[2] = oldCache[2];}else { // Reuse newcache so results back-propagate to previous elements
outerCache[dir] = newCache; // A match means we're done; a fail means we have to keep checking
if(newCache[2] = matcher(elem,context,xml)){return true;}}}}}};}function elementMatcher(matchers){return matchers.length > 1?function(elem,context,xml){var i=matchers.length;while(i--) {if(!matchers[i](elem,context,xml)){return false;}}return true;}:matchers[0];}function multipleContexts(selector,contexts,results){var i=0,len=contexts.length;for(;i < len;i++) {Sizzle(selector,contexts[i],results);}return results;}function condense(unmatched,map,filter,context,xml){var elem,newUnmatched=[],i=0,len=unmatched.length,mapped=map != null;for(;i < len;i++) {if(elem = unmatched[i]){if(!filter || filter(elem,context,xml)){newUnmatched.push(elem);if(mapped){map.push(i);}}}}return newUnmatched;}function setMatcher(preFilter,selector,matcher,postFilter,postFinder,postSelector){if(postFilter && !postFilter[expando]){postFilter = setMatcher(postFilter);}if(postFinder && !postFinder[expando]){postFinder = setMatcher(postFinder,postSelector);}return markFunction(function(seed,results,context,xml){var temp,i,elem,preMap=[],postMap=[],preexisting=results.length, // Get initial elements from seed or context
elems=seed || multipleContexts(selector || "*",context.nodeType?[context]:context,[]), // Prefilter to get matcher input, preserving a map for seed-results synchronization
matcherIn=preFilter && (seed || !selector)?condense(elems,preMap,preFilter,context,xml):elems,matcherOut=matcher? // If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
postFinder || (seed?preFilter:preexisting || postFilter)? // ...intermediate processing is necessary
[]: // ...otherwise use results directly
results:matcherIn; // Find primary matches
if(matcher){matcher(matcherIn,matcherOut,context,xml);} // Apply postFilter
if(postFilter){temp = condense(matcherOut,postMap);postFilter(temp,[],context,xml); // Un-match failing elements by moving them back to matcherIn
i = temp.length;while(i--) {if(elem = temp[i]){matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);}}}if(seed){if(postFinder || preFilter){if(postFinder){ // Get the final matcherOut by condensing this intermediate into postFinder contexts
temp = [];i = matcherOut.length;while(i--) {if(elem = matcherOut[i]){ // Restore matcherIn since elem is not yet a final match
temp.push(matcherIn[i] = elem);}}postFinder(null,matcherOut = [],temp,xml);} // Move matched elements from seed to results to keep them synchronized
i = matcherOut.length;while(i--) {if((elem = matcherOut[i]) && (temp = postFinder?indexOf(seed,elem):preMap[i]) > -1){seed[temp] = !(results[temp] = elem);}}} // Add elements to results, through postFinder if defined
}else {matcherOut = condense(matcherOut === results?matcherOut.splice(preexisting,matcherOut.length):matcherOut);if(postFinder){postFinder(null,results,matcherOut,xml);}else {push.apply(results,matcherOut);}}});}function matcherFromTokens(tokens){var checkContext,matcher,j,len=tokens.length,leadingRelative=Expr.relative[tokens[0].type],implicitRelative=leadingRelative || Expr.relative[" "],i=leadingRelative?1:0, // The foundational matcher ensures that elements are reachable from top-level context(s)
matchContext=addCombinator(function(elem){return elem === checkContext;},implicitRelative,true),matchAnyContext=addCombinator(function(elem){return indexOf(checkContext,elem) > -1;},implicitRelative,true),matchers=[function(elem,context,xml){var ret=!leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType?matchContext(elem,context,xml):matchAnyContext(elem,context,xml)); // Avoid hanging onto element (issue #299)
checkContext = null;return ret;}];for(;i < len;i++) {if(matcher = Expr.relative[tokens[i].type]){matchers = [addCombinator(elementMatcher(matchers),matcher)];}else {matcher = Expr.filter[tokens[i].type].apply(null,tokens[i].matches); // Return special upon seeing a positional matcher
if(matcher[expando]){ // Find the next relative operator (if any) for proper handling
j = ++i;for(;j < len;j++) {if(Expr.relative[tokens[j].type]){break;}}return setMatcher(i > 1 && elementMatcher(matchers),i > 1 && toSelector( // If the preceding token was a descendant combinator, insert an implicit any-element `*`
tokens.slice(0,i - 1).concat({value:tokens[i - 2].type === " "?"*":""})).replace(rtrim,"$1"),matcher,i < j && matcherFromTokens(tokens.slice(i,j)),j < len && matcherFromTokens(tokens = tokens.slice(j)),j < len && toSelector(tokens));}matchers.push(matcher);}}return elementMatcher(matchers);}function matcherFromGroupMatchers(elementMatchers,setMatchers){var bySet=setMatchers.length > 0,byElement=elementMatchers.length > 0,superMatcher=function superMatcher(seed,context,xml,results,outermost){var elem,j,matcher,matchedCount=0,i="0",unmatched=seed && [],setMatched=[],contextBackup=outermostContext, // We must always have either seed elements or outermost context
elems=seed || byElement && Expr.find["TAG"]("*",outermost), // Use integer dirruns iff this is the outermost matcher
dirrunsUnique=dirruns += contextBackup == null?1:Math.random() || 0.1,len=elems.length;if(outermost){outermostContext = context !== document && context;} // Add elements passing elementMatchers directly to results
// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
// Support: IE<9, Safari
// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
for(;i !== len && (elem = elems[i]) != null;i++) {if(byElement && elem){j = 0;while(matcher = elementMatchers[j++]) {if(matcher(elem,context,xml)){results.push(elem);break;}}if(outermost){dirruns = dirrunsUnique;}} // Track unmatched elements for set filters
if(bySet){ // They will have gone through all possible matchers
if(elem = !matcher && elem){matchedCount--;} // Lengthen the array for every element, matched or not
if(seed){unmatched.push(elem);}}} // Apply set filters to unmatched elements
matchedCount += i;if(bySet && i !== matchedCount){j = 0;while(matcher = setMatchers[j++]) {matcher(unmatched,setMatched,context,xml);}if(seed){ // Reintegrate element matches to eliminate the need for sorting
if(matchedCount > 0){while(i--) {if(!(unmatched[i] || setMatched[i])){setMatched[i] = pop.call(results);}}} // Discard index placeholder values to get only actual matches
setMatched = condense(setMatched);} // Add matches to results
push.apply(results,setMatched); // Seedless set matches succeeding multiple successful matchers stipulate sorting
if(outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1){Sizzle.uniqueSort(results);}} // Override manipulation of globals by nested matchers
if(outermost){dirruns = dirrunsUnique;outermostContext = contextBackup;}return unmatched;};return bySet?markFunction(superMatcher):superMatcher;}compile = Sizzle.compile = function(selector,match /* Internal Use Only */){var i,setMatchers=[],elementMatchers=[],cached=compilerCache[selector + " "];if(!cached){ // Generate a function of recursive functions that can be used to check each element
if(!match){match = tokenize(selector);}i = match.length;while(i--) {cached = matcherFromTokens(match[i]);if(cached[expando]){setMatchers.push(cached);}else {elementMatchers.push(cached);}} // Cache the compiled function
cached = compilerCache(selector,matcherFromGroupMatchers(elementMatchers,setMatchers)); // Save selector and tokenization
cached.selector = selector;}return cached;}; /**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */select = Sizzle.select = function(selector,context,results,seed){var i,tokens,token,type,find,compiled=typeof selector === "function" && selector,match=!seed && tokenize(selector = compiled.selector || selector);results = results || []; // Try to minimize operations if there is no seed and only one group
if(match.length === 1){ // Take a shortcut and set the context if the root selector is an ID
tokens = match[0] = match[0].slice(0);if(tokens.length > 2 && (token = tokens[0]).type === "ID" && support.getById && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]){context = (Expr.find["ID"](token.matches[0].replace(runescape,funescape),context) || [])[0];if(!context){return results; // Precompiled matchers will still verify ancestry, so step up a level
}else if(compiled){context = context.parentNode;}selector = selector.slice(tokens.shift().value.length);} // Fetch a seed set for right-to-left matching
i = matchExpr["needsContext"].test(selector)?0:tokens.length;while(i--) {token = tokens[i]; // Abort if we hit a combinator
if(Expr.relative[type = token.type]){break;}if(find = Expr.find[type]){ // Search, expanding context for leading sibling combinators
if(seed = find(token.matches[0].replace(runescape,funescape),rsibling.test(tokens[0].type) && testContext(context.parentNode) || context)){ // If seed is empty or no tokens remain, we can return early
tokens.splice(i,1);selector = seed.length && toSelector(tokens);if(!selector){push.apply(results,seed);return results;}break;}}}} // Compile and execute a filtering function if one is not provided
// Provide `match` to avoid retokenization if we modified the selector above
(compiled || compile(selector,match))(seed,context,!documentIsHTML,results,rsibling.test(selector) && testContext(context.parentNode) || context);return results;}; // One-time assignments
// Sort stability
support.sortStable = expando.split("").sort(sortOrder).join("") === expando; // Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate; // Initialize against the default document
setDocument(); // Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function(div1){ // Should return 1, but returns 4 (following)
return div1.compareDocumentPosition(document.createElement("div")) & 1;}); // Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if(!assert(function(div){div.innerHTML = "<a href='#'></a>";return div.firstChild.getAttribute("href") === "#";})){addHandle("type|href|height|width",function(elem,name,isXML){if(!isXML){return elem.getAttribute(name,name.toLowerCase() === "type"?1:2);}});} // Support: IE<9
// Use defaultValue in place of getAttribute("value")
if(!support.attributes || !assert(function(div){div.innerHTML = "<input/>";div.firstChild.setAttribute("value","");return div.firstChild.getAttribute("value") === "";})){addHandle("value",function(elem,name,isXML){if(!isXML && elem.nodeName.toLowerCase() === "input"){return elem.defaultValue;}});} // Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if(!assert(function(div){return div.getAttribute("disabled") == null;})){addHandle(booleans,function(elem,name,isXML){var val;if(!isXML){return elem[name] === true?name.toLowerCase():(val = elem.getAttributeNode(name)) && val.specified?val.value:null;}});}return Sizzle;})(window);jQuery.find = Sizzle;jQuery.expr = Sizzle.selectors;jQuery.expr[":"] = jQuery.expr.pseudos;jQuery.unique = Sizzle.uniqueSort;jQuery.text = Sizzle.getText;jQuery.isXMLDoc = Sizzle.isXML;jQuery.contains = Sizzle.contains;var rneedsContext=jQuery.expr.match.needsContext;var rsingleTag=/^<(\w+)\s*\/?>(?:<\/\1>|)$/;var risSimple=/^.[^:#\[\.,]*$/; // Implement the identical functionality for filter and not
function winnow(elements,qualifier,not){if(jQuery.isFunction(qualifier)){return jQuery.grep(elements,function(elem,i){ /* jshint -W018 */return !!qualifier.call(elem,i,elem) !== not;});}if(qualifier.nodeType){return jQuery.grep(elements,function(elem){return elem === qualifier !== not;});}if(typeof qualifier === "string"){if(risSimple.test(qualifier)){return jQuery.filter(qualifier,elements,not);}qualifier = jQuery.filter(qualifier,elements);}return jQuery.grep(elements,function(elem){return indexOf.call(qualifier,elem) >= 0 !== not;});}jQuery.filter = function(expr,elems,not){var elem=elems[0];if(not){expr = ":not(" + expr + ")";}return elems.length === 1 && elem.nodeType === 1?jQuery.find.matchesSelector(elem,expr)?[elem]:[]:jQuery.find.matches(expr,jQuery.grep(elems,function(elem){return elem.nodeType === 1;}));};jQuery.fn.extend({find:function find(selector){var i,len=this.length,ret=[],self=this;if(typeof selector !== "string"){return this.pushStack(jQuery(selector).filter(function(){for(i = 0;i < len;i++) {if(jQuery.contains(self[i],this)){return true;}}}));}for(i = 0;i < len;i++) {jQuery.find(selector,self[i],ret);} // Needed because $( selector, context ) becomes $( context ).find( selector )
ret = this.pushStack(len > 1?jQuery.unique(ret):ret);ret.selector = this.selector?this.selector + " " + selector:selector;return ret;},filter:function filter(selector){return this.pushStack(winnow(this,selector || [],false));},not:function not(selector){return this.pushStack(winnow(this,selector || [],true));},is:function is(selector){return !!winnow(this, // If this is a positional/relative selector, check membership in the returned set
// so $("p:first").is("p:last") won't return true for a doc with two "p".
typeof selector === "string" && rneedsContext.test(selector)?jQuery(selector):selector || [],false).length;}}); // Initialize a jQuery object
// A central reference to the root jQuery(document)
var rootjQuery, // A simple way to check for HTML strings
// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
// Strict HTML recognition (#11290: must start with <)
rquickExpr=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,init=jQuery.fn.init = function(selector,context){var match,elem; // HANDLE: $(""), $(null), $(undefined), $(false)
if(!selector){return this;} // Handle HTML strings
if(typeof selector === "string"){if(selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3){ // Assume that strings that start and end with <> are HTML and skip the regex check
match = [null,selector,null];}else {match = rquickExpr.exec(selector);} // Match html or make sure no context is specified for #id
if(match && (match[1] || !context)){ // HANDLE: $(html) -> $(array)
if(match[1]){context = context instanceof jQuery?context[0]:context; // Option to run scripts is true for back-compat
// Intentionally let the error be thrown if parseHTML is not present
jQuery.merge(this,jQuery.parseHTML(match[1],context && context.nodeType?context.ownerDocument || context:document,true)); // HANDLE: $(html, props)
if(rsingleTag.test(match[1]) && jQuery.isPlainObject(context)){for(match in context) { // Properties of context are called as methods if possible
if(jQuery.isFunction(this[match])){this[match](context[match]); // ...and otherwise set as attributes
}else {this.attr(match,context[match]);}}}return this; // HANDLE: $(#id)
}else {elem = document.getElementById(match[2]); // Support: Blackberry 4.6
// gEBID returns nodes no longer in the document (#6963)
if(elem && elem.parentNode){ // Inject the element directly into the jQuery object
this.length = 1;this[0] = elem;}this.context = document;this.selector = selector;return this;} // HANDLE: $(expr, $(...))
}else if(!context || context.jquery){return (context || rootjQuery).find(selector); // HANDLE: $(expr, context)
// (which is just equivalent to: $(context).find(expr)
}else {return this.constructor(context).find(selector);} // HANDLE: $(DOMElement)
}else if(selector.nodeType){this.context = this[0] = selector;this.length = 1;return this; // HANDLE: $(function)
// Shortcut for document ready
}else if(jQuery.isFunction(selector)){return typeof rootjQuery.ready !== "undefined"?rootjQuery.ready(selector): // Execute immediately if ready is not present
selector(jQuery);}if(selector.selector !== undefined){this.selector = selector.selector;this.context = selector.context;}return jQuery.makeArray(selector,this);}; // Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn; // Initialize central reference
rootjQuery = jQuery(document);var rparentsprev=/^(?:parents|prev(?:Until|All))/, // Methods guaranteed to produce a unique set when starting from a unique set
guaranteedUnique={children:true,contents:true,next:true,prev:true};jQuery.extend({dir:function dir(elem,_dir,until){var matched=[],truncate=until !== undefined;while((elem = elem[_dir]) && elem.nodeType !== 9) {if(elem.nodeType === 1){if(truncate && jQuery(elem).is(until)){break;}matched.push(elem);}}return matched;},sibling:function sibling(n,elem){var matched=[];for(;n;n = n.nextSibling) {if(n.nodeType === 1 && n !== elem){matched.push(n);}}return matched;}});jQuery.fn.extend({has:function has(target){var targets=jQuery(target,this),l=targets.length;return this.filter(function(){var i=0;for(;i < l;i++) {if(jQuery.contains(this,targets[i])){return true;}}});},closest:function closest(selectors,context){var cur,i=0,l=this.length,matched=[],pos=rneedsContext.test(selectors) || typeof selectors !== "string"?jQuery(selectors,context || this.context):0;for(;i < l;i++) {for(cur = this[i];cur && cur !== context;cur = cur.parentNode) { // Always skip document fragments
if(cur.nodeType < 11 && (pos?pos.index(cur) > -1: // Don't pass non-elements to Sizzle
cur.nodeType === 1 && jQuery.find.matchesSelector(cur,selectors))){matched.push(cur);break;}}}return this.pushStack(matched.length > 1?jQuery.unique(matched):matched);}, // Determine the position of an element within the set
index:function index(elem){ // No argument, return index in parent
if(!elem){return this[0] && this[0].parentNode?this.first().prevAll().length:-1;} // Index in selector
if(typeof elem === "string"){return indexOf.call(jQuery(elem),this[0]);} // Locate the position of the desired element
return indexOf.call(this, // If it receives a jQuery object, the first element is used
elem.jquery?elem[0]:elem);},add:function add(selector,context){return this.pushStack(jQuery.unique(jQuery.merge(this.get(),jQuery(selector,context))));},addBack:function addBack(selector){return this.add(selector == null?this.prevObject:this.prevObject.filter(selector));}});function sibling(cur,dir){while((cur = cur[dir]) && cur.nodeType !== 1) {}return cur;}jQuery.each({parent:function parent(elem){var parent=elem.parentNode;return parent && parent.nodeType !== 11?parent:null;},parents:function parents(elem){return jQuery.dir(elem,"parentNode");},parentsUntil:function parentsUntil(elem,i,until){return jQuery.dir(elem,"parentNode",until);},next:function next(elem){return sibling(elem,"nextSibling");},prev:function prev(elem){return sibling(elem,"previousSibling");},nextAll:function nextAll(elem){return jQuery.dir(elem,"nextSibling");},prevAll:function prevAll(elem){return jQuery.dir(elem,"previousSibling");},nextUntil:function nextUntil(elem,i,until){return jQuery.dir(elem,"nextSibling",until);},prevUntil:function prevUntil(elem,i,until){return jQuery.dir(elem,"previousSibling",until);},siblings:function siblings(elem){return jQuery.sibling((elem.parentNode || {}).firstChild,elem);},children:function children(elem){return jQuery.sibling(elem.firstChild);},contents:function contents(elem){return elem.contentDocument || jQuery.merge([],elem.childNodes);}},function(name,fn){jQuery.fn[name] = function(until,selector){var matched=jQuery.map(this,fn,until);if(name.slice(-5) !== "Until"){selector = until;}if(selector && typeof selector === "string"){matched = jQuery.filter(selector,matched);}if(this.length > 1){ // Remove duplicates
if(!guaranteedUnique[name]){jQuery.unique(matched);} // Reverse order for parents* and prev-derivatives
if(rparentsprev.test(name)){matched.reverse();}}return this.pushStack(matched);};});var rnotwhite=/\S+/g; // String to Object options format cache
var optionsCache={}; // Convert String-formatted options into Object-formatted ones and store in cache
function createOptions(options){var object=optionsCache[options] = {};jQuery.each(options.match(rnotwhite) || [],function(_,flag){object[flag] = true;});return object;} /*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */jQuery.Callbacks = function(options){ // Convert options from String-formatted to Object-formatted if needed
// (we check in cache first)
options = typeof options === "string"?optionsCache[options] || createOptions(options):jQuery.extend({},options);var  // Last fire value (for non-forgettable lists)
memory, // Flag to know if list was already fired
_fired, // Flag to know if list is currently firing
firing, // First callback to fire (used internally by add and fireWith)
firingStart, // End of the loop when firing
firingLength, // Index of currently firing callback (modified by remove if needed)
firingIndex, // Actual callback list
list=[], // Stack of fire calls for repeatable lists
stack=!options.once && [], // Fire callbacks
fire=function fire(data){memory = options.memory && data;_fired = true;firingIndex = firingStart || 0;firingStart = 0;firingLength = list.length;firing = true;for(;list && firingIndex < firingLength;firingIndex++) {if(list[firingIndex].apply(data[0],data[1]) === false && options.stopOnFalse){memory = false; // To prevent further calls using add
break;}}firing = false;if(list){if(stack){if(stack.length){fire(stack.shift());}}else if(memory){list = [];}else {self.disable();}}}, // Actual Callbacks object
self={ // Add a callback or a collection of callbacks to the list
add:function add(){if(list){ // First, we save the current length
var start=list.length;(function add(args){jQuery.each(args,function(_,arg){var type=jQuery.type(arg);if(type === "function"){if(!options.unique || !self.has(arg)){list.push(arg);}}else if(arg && arg.length && type !== "string"){ // Inspect recursively
add(arg);}});})(arguments); // Do we need to add the callbacks to the
// current firing batch?
if(firing){firingLength = list.length; // With memory, if we're not firing then
// we should call right away
}else if(memory){firingStart = start;fire(memory);}}return this;}, // Remove a callback from the list
remove:function remove(){if(list){jQuery.each(arguments,function(_,arg){var index;while((index = jQuery.inArray(arg,list,index)) > -1) {list.splice(index,1); // Handle firing indexes
if(firing){if(index <= firingLength){firingLength--;}if(index <= firingIndex){firingIndex--;}}}});}return this;}, // Check if a given callback is in the list.
// If no argument is given, return whether or not list has callbacks attached.
has:function has(fn){return fn?jQuery.inArray(fn,list) > -1:!!(list && list.length);}, // Remove all callbacks from the list
empty:function empty(){list = [];firingLength = 0;return this;}, // Have the list do nothing anymore
disable:function disable(){list = stack = memory = undefined;return this;}, // Is it disabled?
disabled:function disabled(){return !list;}, // Lock the list in its current state
lock:function lock(){stack = undefined;if(!memory){self.disable();}return this;}, // Is it locked?
locked:function locked(){return !stack;}, // Call all callbacks with the given context and arguments
fireWith:function fireWith(context,args){if(list && (!_fired || stack)){args = args || [];args = [context,args.slice?args.slice():args];if(firing){stack.push(args);}else {fire(args);}}return this;}, // Call all the callbacks with the given arguments
fire:function fire(){self.fireWith(this,arguments);return this;}, // To know if the callbacks have already been called at least once
fired:function fired(){return !!_fired;}};return self;};jQuery.extend({Deferred:function Deferred(func){var tuples=[ // action, add listener, listener list, final state
["resolve","done",jQuery.Callbacks("once memory"),"resolved"],["reject","fail",jQuery.Callbacks("once memory"),"rejected"],["notify","progress",jQuery.Callbacks("memory")]],_state="pending",_promise={state:function state(){return _state;},always:function always(){deferred.done(arguments).fail(arguments);return this;},then:function then() /* fnDone, fnFail, fnProgress */{var fns=arguments;return jQuery.Deferred(function(newDefer){jQuery.each(tuples,function(i,tuple){var fn=jQuery.isFunction(fns[i]) && fns[i]; // deferred[ done | fail | progress ] for forwarding actions to newDefer
deferred[tuple[1]](function(){var returned=fn && fn.apply(this,arguments);if(returned && jQuery.isFunction(returned.promise)){returned.promise().done(newDefer.resolve).fail(newDefer.reject).progress(newDefer.notify);}else {newDefer[tuple[0] + "With"](this === _promise?newDefer.promise():this,fn?[returned]:arguments);}});});fns = null;}).promise();}, // Get a promise for this deferred
// If obj is provided, the promise aspect is added to the object
promise:function promise(obj){return obj != null?jQuery.extend(obj,_promise):_promise;}},deferred={}; // Keep pipe for back-compat
_promise.pipe = _promise.then; // Add list-specific methods
jQuery.each(tuples,function(i,tuple){var list=tuple[2],stateString=tuple[3]; // promise[ done | fail | progress ] = list.add
_promise[tuple[1]] = list.add; // Handle state
if(stateString){list.add(function(){ // state = [ resolved | rejected ]
_state = stateString; // [ reject_list | resolve_list ].disable; progress_list.lock
},tuples[i ^ 1][2].disable,tuples[2][2].lock);} // deferred[ resolve | reject | notify ]
deferred[tuple[0]] = function(){deferred[tuple[0] + "With"](this === deferred?_promise:this,arguments);return this;};deferred[tuple[0] + "With"] = list.fireWith;}); // Make the deferred a promise
_promise.promise(deferred); // Call given func if any
if(func){func.call(deferred,deferred);} // All done!
return deferred;}, // Deferred helper
when:function when(subordinate /* , ..., subordinateN */){var i=0,resolveValues=_slice.call(arguments),length=resolveValues.length, // the count of uncompleted subordinates
remaining=length !== 1 || subordinate && jQuery.isFunction(subordinate.promise)?length:0, // the master Deferred. If resolveValues consist of only a single Deferred, just use that.
deferred=remaining === 1?subordinate:jQuery.Deferred(), // Update function for both resolve and progress values
updateFunc=function updateFunc(i,contexts,values){return function(value){contexts[i] = this;values[i] = arguments.length > 1?_slice.call(arguments):value;if(values === progressValues){deferred.notifyWith(contexts,values);}else if(! --remaining){deferred.resolveWith(contexts,values);}};},progressValues,progressContexts,resolveContexts; // Add listeners to Deferred subordinates; treat others as resolved
if(length > 1){progressValues = new Array(length);progressContexts = new Array(length);resolveContexts = new Array(length);for(;i < length;i++) {if(resolveValues[i] && jQuery.isFunction(resolveValues[i].promise)){resolveValues[i].promise().done(updateFunc(i,resolveContexts,resolveValues)).fail(deferred.reject).progress(updateFunc(i,progressContexts,progressValues));}else {--remaining;}}} // If we're not waiting on anything, resolve the master
if(!remaining){deferred.resolveWith(resolveContexts,resolveValues);}return deferred.promise();}}); // The deferred used on DOM ready
var readyList;jQuery.fn.ready = function(fn){ // Add the callback
jQuery.ready.promise().done(fn);return this;};jQuery.extend({ // Is the DOM ready to be used? Set to true once it occurs.
isReady:false, // A counter to track how many items to wait for before
// the ready event fires. See #6781
readyWait:1, // Hold (or release) the ready event
holdReady:function holdReady(hold){if(hold){jQuery.readyWait++;}else {jQuery.ready(true);}}, // Handle when the DOM is ready
ready:function ready(wait){ // Abort if there are pending holds or we're already ready
if(wait === true?--jQuery.readyWait:jQuery.isReady){return;} // Remember that the DOM is ready
jQuery.isReady = true; // If a normal DOM Ready event fired, decrement, and wait if need be
if(wait !== true && --jQuery.readyWait > 0){return;} // If there are functions bound, to execute
readyList.resolveWith(document,[jQuery]); // Trigger any bound ready events
if(jQuery.fn.triggerHandler){jQuery(document).triggerHandler("ready");jQuery(document).off("ready");}}}); /**
 * The ready event handler and self cleanup method
 */function completed(){document.removeEventListener("DOMContentLoaded",completed,false);window.removeEventListener("load",completed,false);jQuery.ready();}jQuery.ready.promise = function(obj){if(!readyList){readyList = jQuery.Deferred(); // Catch cases where $(document).ready() is called after the browser event has already occurred.
// We once tried to use readyState "interactive" here, but it caused issues like the one
// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
if(document.readyState === "complete"){ // Handle it asynchronously to allow scripts the opportunity to delay ready
setTimeout(jQuery.ready);}else { // Use the handy event callback
document.addEventListener("DOMContentLoaded",completed,false); // A fallback to window.onload, that will always work
window.addEventListener("load",completed,false);}}return readyList.promise(obj);}; // Kick off the DOM ready check even if the user does not
jQuery.ready.promise(); // Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access=jQuery.access = function(elems,fn,key,value,chainable,emptyGet,raw){var i=0,len=elems.length,bulk=key == null; // Sets many values
if(jQuery.type(key) === "object"){chainable = true;for(i in key) {jQuery.access(elems,fn,i,key[i],true,emptyGet,raw);} // Sets one value
}else if(value !== undefined){chainable = true;if(!jQuery.isFunction(value)){raw = true;}if(bulk){ // Bulk operations run against the entire set
if(raw){fn.call(elems,value);fn = null; // ...except when executing function values
}else {bulk = fn;fn = function(elem,key,value){return bulk.call(jQuery(elem),value);};}}if(fn){for(;i < len;i++) {fn(elems[i],key,raw?value:value.call(elems[i],i,fn(elems[i],key)));}}}return chainable?elems: // Gets
bulk?fn.call(elems):len?fn(elems[0],key):emptyGet;}; /**
 * Determines whether an object can have data
 */jQuery.acceptData = function(owner){ // Accepts only:
//  - Node
//    - Node.ELEMENT_NODE
//    - Node.DOCUMENT_NODE
//  - Object
//    - Any
/* jshint -W018 */return owner.nodeType === 1 || owner.nodeType === 9 || ! +owner.nodeType;};function Data(){ // Support: Android<4,
// Old WebKit does not have Object.preventExtensions/freeze method,
// return new empty object instead with no [[set]] accessor
Object.defineProperty(this.cache = {},0,{get:function get(){return {};}});this.expando = jQuery.expando + Data.uid++;}Data.uid = 1;Data.accepts = jQuery.acceptData;Data.prototype = {key:function key(owner){ // We can accept data for non-element nodes in modern browsers,
// but we should not, see #8335.
// Always return the key for a frozen object.
if(!Data.accepts(owner)){return 0;}var descriptor={}, // Check if the owner object already has a cache key
unlock=owner[this.expando]; // If not, create one
if(!unlock){unlock = Data.uid++; // Secure it in a non-enumerable, non-writable property
try{descriptor[this.expando] = {value:unlock};Object.defineProperties(owner,descriptor); // Support: Android<4
// Fallback to a less secure definition
}catch(e) {descriptor[this.expando] = unlock;jQuery.extend(owner,descriptor);}} // Ensure the cache object
if(!this.cache[unlock]){this.cache[unlock] = {};}return unlock;},set:function set(owner,data,value){var prop, // There may be an unlock assigned to this node,
// if there is no entry for this "owner", create one inline
// and set the unlock as though an owner entry had always existed
unlock=this.key(owner),cache=this.cache[unlock]; // Handle: [ owner, key, value ] args
if(typeof data === "string"){cache[data] = value; // Handle: [ owner, { properties } ] args
}else { // Fresh assignments by object are shallow copied
if(jQuery.isEmptyObject(cache)){jQuery.extend(this.cache[unlock],data); // Otherwise, copy the properties one-by-one to the cache object
}else {for(prop in data) {cache[prop] = data[prop];}}}return cache;},get:function get(owner,key){ // Either a valid cache is found, or will be created.
// New caches will be created and the unlock returned,
// allowing direct access to the newly created
// empty data object. A valid owner object must be provided.
var cache=this.cache[this.key(owner)];return key === undefined?cache:cache[key];},access:function access(owner,key,value){var stored; // In cases where either:
//
//   1. No key was specified
//   2. A string key was specified, but no value provided
//
// Take the "read" path and allow the get method to determine
// which value to return, respectively either:
//
//   1. The entire cache object
//   2. The data stored at the key
//
if(key === undefined || key && typeof key === "string" && value === undefined){stored = this.get(owner,key);return stored !== undefined?stored:this.get(owner,jQuery.camelCase(key));} // [*]When the key is not a string, or both a key and value
// are specified, set or extend (existing objects) with either:
//
//   1. An object of properties
//   2. A key and value
//
this.set(owner,key,value); // Since the "set" path can have two possible entry points
// return the expected data based on which path was taken[*]
return value !== undefined?value:key;},remove:function remove(owner,key){var i,name,camel,unlock=this.key(owner),cache=this.cache[unlock];if(key === undefined){this.cache[unlock] = {};}else { // Support array or space separated string of keys
if(jQuery.isArray(key)){ // If "name" is an array of keys...
// When data is initially created, via ("key", "val") signature,
// keys will be converted to camelCase.
// Since there is no way to tell _how_ a key was added, remove
// both plain key and camelCase key. #12786
// This will only penalize the array argument path.
name = key.concat(key.map(jQuery.camelCase));}else {camel = jQuery.camelCase(key); // Try the string as a key before any manipulation
if(key in cache){name = [key,camel];}else { // If a key with the spaces exists, use it.
// Otherwise, create an array by matching non-whitespace
name = camel;name = name in cache?[name]:name.match(rnotwhite) || [];}}i = name.length;while(i--) {delete cache[name[i]];}}},hasData:function hasData(owner){return !jQuery.isEmptyObject(this.cache[owner[this.expando]] || {});},discard:function discard(owner){if(owner[this.expando]){delete this.cache[owner[this.expando]];}}};var data_priv=new Data();var data_user=new Data(); //	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014
var rbrace=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,rmultiDash=/([A-Z])/g;function dataAttr(elem,key,data){var name; // If nothing was found internally, try to fetch any
// data from the HTML5 data-* attribute
if(data === undefined && elem.nodeType === 1){name = "data-" + key.replace(rmultiDash,"-$1").toLowerCase();data = elem.getAttribute(name);if(typeof data === "string"){try{data = data === "true"?true:data === "false"?false:data === "null"?null: // Only convert to a number if it doesn't change the string
+data + "" === data?+data:rbrace.test(data)?jQuery.parseJSON(data):data;}catch(e) {} // Make sure we set the data so it isn't changed later
data_user.set(elem,key,data);}else {data = undefined;}}return data;}jQuery.extend({hasData:function hasData(elem){return data_user.hasData(elem) || data_priv.hasData(elem);},data:function data(elem,name,_data){return data_user.access(elem,name,_data);},removeData:function removeData(elem,name){data_user.remove(elem,name);}, // TODO: Now that all calls to _data and _removeData have been replaced
// with direct calls to data_priv methods, these can be deprecated.
_data:function _data(elem,name,data){return data_priv.access(elem,name,data);},_removeData:function _removeData(elem,name){data_priv.remove(elem,name);}});jQuery.fn.extend({data:function data(key,value){var i,name,data,elem=this[0],attrs=elem && elem.attributes; // Gets all values
if(key === undefined){if(this.length){data = data_user.get(elem);if(elem.nodeType === 1 && !data_priv.get(elem,"hasDataAttrs")){i = attrs.length;while(i--) { // Support: IE11+
// The attrs elements can be null (#14894)
if(attrs[i]){name = attrs[i].name;if(name.indexOf("data-") === 0){name = jQuery.camelCase(name.slice(5));dataAttr(elem,name,data[name]);}}}data_priv.set(elem,"hasDataAttrs",true);}}return data;} // Sets multiple values
if(typeof key === "object"){return this.each(function(){data_user.set(this,key);});}return access(this,function(value){var data,camelKey=jQuery.camelCase(key); // The calling jQuery object (element matches) is not empty
// (and therefore has an element appears at this[ 0 ]) and the
// `value` parameter was not undefined. An empty jQuery object
// will result in `undefined` for elem = this[ 0 ] which will
// throw an exception if an attempt to read a data cache is made.
if(elem && value === undefined){ // Attempt to get data from the cache
// with the key as-is
data = data_user.get(elem,key);if(data !== undefined){return data;} // Attempt to get data from the cache
// with the key camelized
data = data_user.get(elem,camelKey);if(data !== undefined){return data;} // Attempt to "discover" the data in
// HTML5 custom data-* attrs
data = dataAttr(elem,camelKey,undefined);if(data !== undefined){return data;} // We tried really hard, but the data doesn't exist.
return;} // Set the data...
this.each(function(){ // First, attempt to store a copy or reference of any
// data that might've been store with a camelCased key.
var data=data_user.get(this,camelKey); // For HTML5 data-* attribute interop, we have to
// store property names with dashes in a camelCase form.
// This might not apply to all properties...*
data_user.set(this,camelKey,value); // *... In the case of properties that might _actually_
// have dashes, we need to also store a copy of that
// unchanged property.
if(key.indexOf("-") !== -1 && data !== undefined){data_user.set(this,key,value);}});},null,value,arguments.length > 1,null,true);},removeData:function removeData(key){return this.each(function(){data_user.remove(this,key);});}});jQuery.extend({queue:function queue(elem,type,data){var queue;if(elem){type = (type || "fx") + "queue";queue = data_priv.get(elem,type); // Speed up dequeue by getting out quickly if this is just a lookup
if(data){if(!queue || jQuery.isArray(data)){queue = data_priv.access(elem,type,jQuery.makeArray(data));}else {queue.push(data);}}return queue || [];}},dequeue:function dequeue(elem,type){type = type || "fx";var queue=jQuery.queue(elem,type),startLength=queue.length,fn=queue.shift(),hooks=jQuery._queueHooks(elem,type),next=function next(){jQuery.dequeue(elem,type);}; // If the fx queue is dequeued, always remove the progress sentinel
if(fn === "inprogress"){fn = queue.shift();startLength--;}if(fn){ // Add a progress sentinel to prevent the fx queue from being
// automatically dequeued
if(type === "fx"){queue.unshift("inprogress");} // Clear up the last queue stop function
delete hooks.stop;fn.call(elem,next,hooks);}if(!startLength && hooks){hooks.empty.fire();}}, // Not public - generate a queueHooks object, or return the current one
_queueHooks:function _queueHooks(elem,type){var key=type + "queueHooks";return data_priv.get(elem,key) || data_priv.access(elem,key,{empty:jQuery.Callbacks("once memory").add(function(){data_priv.remove(elem,[type + "queue",key]);})});}});jQuery.fn.extend({queue:function queue(type,data){var setter=2;if(typeof type !== "string"){data = type;type = "fx";setter--;}if(arguments.length < setter){return jQuery.queue(this[0],type);}return data === undefined?this:this.each(function(){var queue=jQuery.queue(this,type,data); // Ensure a hooks for this queue
jQuery._queueHooks(this,type);if(type === "fx" && queue[0] !== "inprogress"){jQuery.dequeue(this,type);}});},dequeue:function dequeue(type){return this.each(function(){jQuery.dequeue(this,type);});},clearQueue:function clearQueue(type){return this.queue(type || "fx",[]);}, // Get a promise resolved when queues of a certain type
// are emptied (fx is the type by default)
promise:function promise(type,obj){var tmp,count=1,defer=jQuery.Deferred(),elements=this,i=this.length,resolve=function resolve(){if(! --count){defer.resolveWith(elements,[elements]);}};if(typeof type !== "string"){obj = type;type = undefined;}type = type || "fx";while(i--) {tmp = data_priv.get(elements[i],type + "queueHooks");if(tmp && tmp.empty){count++;tmp.empty.add(resolve);}}resolve();return defer.promise(obj);}});var pnum=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;var cssExpand=["Top","Right","Bottom","Left"];var isHidden=function isHidden(elem,el){ // isHidden might be called from jQuery#filter function;
// in that case, element will be second argument
elem = el || elem;return jQuery.css(elem,"display") === "none" || !jQuery.contains(elem.ownerDocument,elem);};var rcheckableType=/^(?:checkbox|radio)$/i;(function(){var fragment=document.createDocumentFragment(),div=fragment.appendChild(document.createElement("div")),input=document.createElement("input"); // Support: Safari<=5.1
// Check state lost if the name is set (#11217)
// Support: Windows Web Apps (WWA)
// `name` and `type` must use .setAttribute for WWA (#14901)
input.setAttribute("type","radio");input.setAttribute("checked","checked");input.setAttribute("name","t");div.appendChild(input); // Support: Safari<=5.1, Android<4.2
// Older WebKit doesn't clone checked state correctly in fragments
support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked; // Support: IE<=11+
// Make sure textarea (and checkbox) defaultValue is properly cloned
div.innerHTML = "<textarea>x</textarea>";support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;})();var strundefined=typeof undefined;support.focusinBubbles = "onfocusin" in window;var rkeyEvent=/^key/,rmouseEvent=/^(?:mouse|pointer|contextmenu)|click/,rfocusMorph=/^(?:focusinfocus|focusoutblur)$/,rtypenamespace=/^([^.]*)(?:\.(.+)|)$/;function returnTrue(){return true;}function returnFalse(){return false;}function safeActiveElement(){try{return document.activeElement;}catch(err) {}} /*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */jQuery.event = {global:{},add:function add(elem,types,handler,data,selector){var handleObjIn,eventHandle,tmp,events,t,handleObj,special,handlers,type,namespaces,origType,elemData=data_priv.get(elem); // Don't attach events to noData or text/comment nodes (but allow plain objects)
if(!elemData){return;} // Caller can pass in an object of custom data in lieu of the handler
if(handler.handler){handleObjIn = handler;handler = handleObjIn.handler;selector = handleObjIn.selector;} // Make sure that the handler has a unique ID, used to find/remove it later
if(!handler.guid){handler.guid = jQuery.guid++;} // Init the element's event structure and main handler, if this is the first
if(!(events = elemData.events)){events = elemData.events = {};}if(!(eventHandle = elemData.handle)){eventHandle = elemData.handle = function(e){ // Discard the second event of a jQuery.event.trigger() and
// when an event is called after a page has unloaded
return typeof jQuery !== strundefined && jQuery.event.triggered !== e.type?jQuery.event.dispatch.apply(elem,arguments):undefined;};} // Handle multiple events separated by a space
types = (types || "").match(rnotwhite) || [""];t = types.length;while(t--) {tmp = rtypenamespace.exec(types[t]) || [];type = origType = tmp[1];namespaces = (tmp[2] || "").split(".").sort(); // There *must* be a type, no attaching namespace-only handlers
if(!type){continue;} // If event changes its type, use the special event handlers for the changed type
special = jQuery.event.special[type] || {}; // If selector defined, determine special event api type, otherwise given type
type = (selector?special.delegateType:special.bindType) || type; // Update special based on newly reset type
special = jQuery.event.special[type] || {}; // handleObj is passed to all event handlers
handleObj = jQuery.extend({type:type,origType:origType,data:data,handler:handler,guid:handler.guid,selector:selector,needsContext:selector && jQuery.expr.match.needsContext.test(selector),namespace:namespaces.join(".")},handleObjIn); // Init the event handler queue if we're the first
if(!(handlers = events[type])){handlers = events[type] = [];handlers.delegateCount = 0; // Only use addEventListener if the special events handler returns false
if(!special.setup || special.setup.call(elem,data,namespaces,eventHandle) === false){if(elem.addEventListener){elem.addEventListener(type,eventHandle,false);}}}if(special.add){special.add.call(elem,handleObj);if(!handleObj.handler.guid){handleObj.handler.guid = handler.guid;}} // Add to the element's handler list, delegates in front
if(selector){handlers.splice(handlers.delegateCount++,0,handleObj);}else {handlers.push(handleObj);} // Keep track of which events have ever been used, for event optimization
jQuery.event.global[type] = true;}}, // Detach an event or set of events from an element
remove:function remove(elem,types,handler,selector,mappedTypes){var j,origCount,tmp,events,t,handleObj,special,handlers,type,namespaces,origType,elemData=data_priv.hasData(elem) && data_priv.get(elem);if(!elemData || !(events = elemData.events)){return;} // Once for each type.namespace in types; type may be omitted
types = (types || "").match(rnotwhite) || [""];t = types.length;while(t--) {tmp = rtypenamespace.exec(types[t]) || [];type = origType = tmp[1];namespaces = (tmp[2] || "").split(".").sort(); // Unbind all events (on this namespace, if provided) for the element
if(!type){for(type in events) {jQuery.event.remove(elem,type + types[t],handler,selector,true);}continue;}special = jQuery.event.special[type] || {};type = (selector?special.delegateType:special.bindType) || type;handlers = events[type] || [];tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)"); // Remove matching events
origCount = j = handlers.length;while(j--) {handleObj = handlers[j];if((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)){handlers.splice(j,1);if(handleObj.selector){handlers.delegateCount--;}if(special.remove){special.remove.call(elem,handleObj);}}} // Remove generic event handler if we removed something and no more handlers exist
// (avoids potential for endless recursion during removal of special event handlers)
if(origCount && !handlers.length){if(!special.teardown || special.teardown.call(elem,namespaces,elemData.handle) === false){jQuery.removeEvent(elem,type,elemData.handle);}delete events[type];}} // Remove the expando if it's no longer used
if(jQuery.isEmptyObject(events)){delete elemData.handle;data_priv.remove(elem,"events");}},trigger:function trigger(event,data,elem,onlyHandlers){var i,cur,tmp,bubbleType,ontype,handle,special,eventPath=[elem || document],type=hasOwn.call(event,"type")?event.type:event,namespaces=hasOwn.call(event,"namespace")?event.namespace.split("."):[];cur = tmp = elem = elem || document; // Don't do events on text and comment nodes
if(elem.nodeType === 3 || elem.nodeType === 8){return;} // focus/blur morphs to focusin/out; ensure we're not firing them right now
if(rfocusMorph.test(type + jQuery.event.triggered)){return;}if(type.indexOf(".") >= 0){ // Namespaced trigger; create a regexp to match event type in handle()
namespaces = type.split(".");type = namespaces.shift();namespaces.sort();}ontype = type.indexOf(":") < 0 && "on" + type; // Caller can pass in a jQuery.Event object, Object, or just an event type string
event = event[jQuery.expando]?event:new jQuery.Event(type,typeof event === "object" && event); // Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
event.isTrigger = onlyHandlers?2:3;event.namespace = namespaces.join(".");event.namespace_re = event.namespace?new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)"):null; // Clean up the event in case it is being reused
event.result = undefined;if(!event.target){event.target = elem;} // Clone any incoming data and prepend the event, creating the handler arg list
data = data == null?[event]:jQuery.makeArray(data,[event]); // Allow special events to draw outside the lines
special = jQuery.event.special[type] || {};if(!onlyHandlers && special.trigger && special.trigger.apply(elem,data) === false){return;} // Determine event propagation path in advance, per W3C events spec (#9951)
// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
if(!onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)){bubbleType = special.delegateType || type;if(!rfocusMorph.test(bubbleType + type)){cur = cur.parentNode;}for(;cur;cur = cur.parentNode) {eventPath.push(cur);tmp = cur;} // Only add window if we got to document (e.g., not plain obj or detached DOM)
if(tmp === (elem.ownerDocument || document)){eventPath.push(tmp.defaultView || tmp.parentWindow || window);}} // Fire handlers on the event path
i = 0;while((cur = eventPath[i++]) && !event.isPropagationStopped()) {event.type = i > 1?bubbleType:special.bindType || type; // jQuery handler
handle = (data_priv.get(cur,"events") || {})[event.type] && data_priv.get(cur,"handle");if(handle){handle.apply(cur,data);} // Native handler
handle = ontype && cur[ontype];if(handle && handle.apply && jQuery.acceptData(cur)){event.result = handle.apply(cur,data);if(event.result === false){event.preventDefault();}}}event.type = type; // If nobody prevented the default action, do it now
if(!onlyHandlers && !event.isDefaultPrevented()){if((!special._default || special._default.apply(eventPath.pop(),data) === false) && jQuery.acceptData(elem)){ // Call a native DOM method on the target with the same name name as the event.
// Don't do default actions on window, that's where global variables be (#6170)
if(ontype && jQuery.isFunction(elem[type]) && !jQuery.isWindow(elem)){ // Don't re-trigger an onFOO event when we call its FOO() method
tmp = elem[ontype];if(tmp){elem[ontype] = null;} // Prevent re-triggering of the same event, since we already bubbled it above
jQuery.event.triggered = type;elem[type]();jQuery.event.triggered = undefined;if(tmp){elem[ontype] = tmp;}}}}return event.result;},dispatch:function dispatch(event){ // Make a writable jQuery.Event from the native event object
event = jQuery.event.fix(event);var i,j,ret,matched,handleObj,handlerQueue=[],args=_slice.call(arguments),handlers=(data_priv.get(this,"events") || {})[event.type] || [],special=jQuery.event.special[event.type] || {}; // Use the fix-ed jQuery.Event rather than the (read-only) native event
args[0] = event;event.delegateTarget = this; // Call the preDispatch hook for the mapped type, and let it bail if desired
if(special.preDispatch && special.preDispatch.call(this,event) === false){return;} // Determine handlers
handlerQueue = jQuery.event.handlers.call(this,event,handlers); // Run delegates first; they may want to stop propagation beneath us
i = 0;while((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {event.currentTarget = matched.elem;j = 0;while((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) { // Triggered event must either 1) have no namespace, or 2) have namespace(s)
// a subset or equal to those in the bound event (both can have no namespace).
if(!event.namespace_re || event.namespace_re.test(handleObj.namespace)){event.handleObj = handleObj;event.data = handleObj.data;ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem,args);if(ret !== undefined){if((event.result = ret) === false){event.preventDefault();event.stopPropagation();}}}}} // Call the postDispatch hook for the mapped type
if(special.postDispatch){special.postDispatch.call(this,event);}return event.result;},handlers:function handlers(event,_handlers){var i,matches,sel,handleObj,handlerQueue=[],delegateCount=_handlers.delegateCount,cur=event.target; // Find delegate handlers
// Black-hole SVG <use> instance trees (#13180)
// Avoid non-left-click bubbling in Firefox (#3861)
if(delegateCount && cur.nodeType && (!event.button || event.type !== "click")){for(;cur !== this;cur = cur.parentNode || this) { // Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
if(cur.disabled !== true || event.type !== "click"){matches = [];for(i = 0;i < delegateCount;i++) {handleObj = _handlers[i]; // Don't conflict with Object.prototype properties (#13203)
sel = handleObj.selector + " ";if(matches[sel] === undefined){matches[sel] = handleObj.needsContext?jQuery(sel,this).index(cur) >= 0:jQuery.find(sel,this,null,[cur]).length;}if(matches[sel]){matches.push(handleObj);}}if(matches.length){handlerQueue.push({elem:cur,handlers:matches});}}}} // Add the remaining (directly-bound) handlers
if(delegateCount < _handlers.length){handlerQueue.push({elem:this,handlers:_handlers.slice(delegateCount)});}return handlerQueue;}, // Includes some event props shared by KeyEvent and MouseEvent
props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function filter(event,original){ // Add which for key events
if(event.which == null){event.which = original.charCode != null?original.charCode:original.keyCode;}return event;}},mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function filter(event,original){var eventDoc,doc,body,button=original.button; // Calculate pageX/Y if missing and clientX/Y available
if(event.pageX == null && original.clientX != null){eventDoc = event.target.ownerDocument || document;doc = eventDoc.documentElement;body = eventDoc.body;event.pageX = original.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);event.pageY = original.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);} // Add which for click: 1 === left; 2 === middle; 3 === right
// Note: button is not normalized, so don't use it
if(!event.which && button !== undefined){event.which = button & 1?1:button & 2?3:button & 4?2:0;}return event;}},fix:function fix(event){if(event[jQuery.expando]){return event;} // Create a writable copy of the event object and normalize some properties
var i,prop,copy,type=event.type,originalEvent=event,fixHook=this.fixHooks[type];if(!fixHook){this.fixHooks[type] = fixHook = rmouseEvent.test(type)?this.mouseHooks:rkeyEvent.test(type)?this.keyHooks:{};}copy = fixHook.props?this.props.concat(fixHook.props):this.props;event = new jQuery.Event(originalEvent);i = copy.length;while(i--) {prop = copy[i];event[prop] = originalEvent[prop];} // Support: Cordova 2.5 (WebKit) (#13255)
// All events should have a target; Cordova deviceready doesn't
if(!event.target){event.target = document;} // Support: Safari 6.0+, Chrome<28
// Target should not be a text node (#504, #13143)
if(event.target.nodeType === 3){event.target = event.target.parentNode;}return fixHook.filter?fixHook.filter(event,originalEvent):event;},special:{load:{ // Prevent triggered image.load events from bubbling to window.load
noBubble:true},focus:{ // Fire native event if possible so blur/focus sequence is correct
trigger:function trigger(){if(this !== safeActiveElement() && this.focus){this.focus();return false;}},delegateType:"focusin"},blur:{trigger:function trigger(){if(this === safeActiveElement() && this.blur){this.blur();return false;}},delegateType:"focusout"},click:{ // For checkbox, fire native event so checked state will be right
trigger:function trigger(){if(this.type === "checkbox" && this.click && jQuery.nodeName(this,"input")){this.click();return false;}}, // For cross-browser consistency, don't fire native .click() on links
_default:function _default(event){return jQuery.nodeName(event.target,"a");}},beforeunload:{postDispatch:function postDispatch(event){ // Support: Firefox 20+
// Firefox doesn't alert if the returnValue field is not set.
if(event.result !== undefined && event.originalEvent){event.originalEvent.returnValue = event.result;}}}},simulate:function simulate(type,elem,event,bubble){ // Piggyback on a donor event to simulate a different one.
// Fake originalEvent to avoid donor's stopPropagation, but if the
// simulated event prevents default then we do the same on the donor.
var e=jQuery.extend(new jQuery.Event(),event,{type:type,isSimulated:true,originalEvent:{}});if(bubble){jQuery.event.trigger(e,null,elem);}else {jQuery.event.dispatch.call(elem,e);}if(e.isDefaultPrevented()){event.preventDefault();}}};jQuery.removeEvent = function(elem,type,handle){if(elem.removeEventListener){elem.removeEventListener(type,handle,false);}};jQuery.Event = function(src,props){ // Allow instantiation without the 'new' keyword
if(!(this instanceof jQuery.Event)){return new jQuery.Event(src,props);} // Event object
if(src && src.type){this.originalEvent = src;this.type = src.type; // Events bubbling up the document may have been marked as prevented
// by a handler lower down the tree; reflect the correct value.
this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === undefined &&  // Support: Android<4.0
src.returnValue === false?returnTrue:returnFalse; // Event type
}else {this.type = src;} // Put explicitly provided properties onto the event object
if(props){jQuery.extend(this,props);} // Create a timestamp if incoming event doesn't have one
this.timeStamp = src && src.timeStamp || jQuery.now(); // Mark it as fixed
this[jQuery.expando] = true;}; // jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {isDefaultPrevented:returnFalse,isPropagationStopped:returnFalse,isImmediatePropagationStopped:returnFalse,preventDefault:function preventDefault(){var e=this.originalEvent;this.isDefaultPrevented = returnTrue;if(e && e.preventDefault){e.preventDefault();}},stopPropagation:function stopPropagation(){var e=this.originalEvent;this.isPropagationStopped = returnTrue;if(e && e.stopPropagation){e.stopPropagation();}},stopImmediatePropagation:function stopImmediatePropagation(){var e=this.originalEvent;this.isImmediatePropagationStopped = returnTrue;if(e && e.stopImmediatePropagation){e.stopImmediatePropagation();}this.stopPropagation();}}; // Create mouseenter/leave events using mouseover/out and event-time checks
// Support: Chrome 15+
jQuery.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(orig,fix){jQuery.event.special[orig] = {delegateType:fix,bindType:fix,handle:function handle(event){var ret,target=this,related=event.relatedTarget,handleObj=event.handleObj; // For mousenter/leave call the handler if related is outside the target.
// NB: No relatedTarget if the mouse left/entered the browser window
if(!related || related !== target && !jQuery.contains(target,related)){event.type = handleObj.origType;ret = handleObj.handler.apply(this,arguments);event.type = fix;}return ret;}};}); // Support: Firefox, Chrome, Safari
// Create "bubbling" focus and blur events
if(!support.focusinBubbles){jQuery.each({focus:"focusin",blur:"focusout"},function(orig,fix){ // Attach a single capturing handler on the document while someone wants focusin/focusout
var handler=function handler(event){jQuery.event.simulate(fix,event.target,jQuery.event.fix(event),true);};jQuery.event.special[fix] = {setup:function setup(){var doc=this.ownerDocument || this,attaches=data_priv.access(doc,fix);if(!attaches){doc.addEventListener(orig,handler,true);}data_priv.access(doc,fix,(attaches || 0) + 1);},teardown:function teardown(){var doc=this.ownerDocument || this,attaches=data_priv.access(doc,fix) - 1;if(!attaches){doc.removeEventListener(orig,handler,true);data_priv.remove(doc,fix);}else {data_priv.access(doc,fix,attaches);}}};});}jQuery.fn.extend({on:function on(types,selector,data,fn, /*INTERNAL*/one){var origFn,type; // Types can be a map of types/handlers
if(typeof types === "object"){ // ( types-Object, selector, data )
if(typeof selector !== "string"){ // ( types-Object, data )
data = data || selector;selector = undefined;}for(type in types) {this.on(type,selector,data,types[type],one);}return this;}if(data == null && fn == null){ // ( types, fn )
fn = selector;data = selector = undefined;}else if(fn == null){if(typeof selector === "string"){ // ( types, selector, fn )
fn = data;data = undefined;}else { // ( types, data, fn )
fn = data;data = selector;selector = undefined;}}if(fn === false){fn = returnFalse;}else if(!fn){return this;}if(one === 1){origFn = fn;fn = function(event){ // Can use an empty set, since event contains the info
jQuery().off(event);return origFn.apply(this,arguments);}; // Use same guid so caller can remove using origFn
fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);}return this.each(function(){jQuery.event.add(this,types,fn,data,selector);});},one:function one(types,selector,data,fn){return this.on(types,selector,data,fn,1);},off:function off(types,selector,fn){var handleObj,type;if(types && types.preventDefault && types.handleObj){ // ( event )  dispatched jQuery.Event
handleObj = types.handleObj;jQuery(types.delegateTarget).off(handleObj.namespace?handleObj.origType + "." + handleObj.namespace:handleObj.origType,handleObj.selector,handleObj.handler);return this;}if(typeof types === "object"){ // ( types-object [, selector] )
for(type in types) {this.off(type,selector,types[type]);}return this;}if(selector === false || typeof selector === "function"){ // ( types [, fn] )
fn = selector;selector = undefined;}if(fn === false){fn = returnFalse;}return this.each(function(){jQuery.event.remove(this,types,fn,selector);});},trigger:function trigger(type,data){return this.each(function(){jQuery.event.trigger(type,data,this);});},triggerHandler:function triggerHandler(type,data){var elem=this[0];if(elem){return jQuery.event.trigger(type,data,elem,true);}}});var rxhtmlTag=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,rtagName=/<([\w:]+)/,rhtml=/<|&#?\w+;/,rnoInnerhtml=/<(?:script|style|link)/i, // checked="checked" or checked
rchecked=/checked\s*(?:[^=]|=\s*.checked.)/i,rscriptType=/^$|\/(?:java|ecma)script/i,rscriptTypeMasked=/^true\/(.*)/,rcleanScript=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g, // We have to close these tags to support XHTML (#13200)
wrapMap={ // Support: IE9
option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]}; // Support: IE9
wrapMap.optgroup = wrapMap.option;wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;wrapMap.th = wrapMap.td; // Support: 1.x compatibility
// Manipulating tables requires a tbody
function manipulationTarget(elem,content){return jQuery.nodeName(elem,"table") && jQuery.nodeName(content.nodeType !== 11?content:content.firstChild,"tr")?elem.getElementsByTagName("tbody")[0] || elem.appendChild(elem.ownerDocument.createElement("tbody")):elem;} // Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript(elem){elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;return elem;}function restoreScript(elem){var match=rscriptTypeMasked.exec(elem.type);if(match){elem.type = match[1];}else {elem.removeAttribute("type");}return elem;} // Mark scripts as having already been evaluated
function setGlobalEval(elems,refElements){var i=0,l=elems.length;for(;i < l;i++) {data_priv.set(elems[i],"globalEval",!refElements || data_priv.get(refElements[i],"globalEval"));}}function cloneCopyEvent(src,dest){var i,l,type,pdataOld,pdataCur,udataOld,udataCur,events;if(dest.nodeType !== 1){return;} // 1. Copy private data: events, handlers, etc.
if(data_priv.hasData(src)){pdataOld = data_priv.access(src);pdataCur = data_priv.set(dest,pdataOld);events = pdataOld.events;if(events){delete pdataCur.handle;pdataCur.events = {};for(type in events) {for(i = 0,l = events[type].length;i < l;i++) {jQuery.event.add(dest,type,events[type][i]);}}}} // 2. Copy user data
if(data_user.hasData(src)){udataOld = data_user.access(src);udataCur = jQuery.extend({},udataOld);data_user.set(dest,udataCur);}}function getAll(context,tag){var ret=context.getElementsByTagName?context.getElementsByTagName(tag || "*"):context.querySelectorAll?context.querySelectorAll(tag || "*"):[];return tag === undefined || tag && jQuery.nodeName(context,tag)?jQuery.merge([context],ret):ret;} // Fix IE bugs, see support tests
function fixInput(src,dest){var nodeName=dest.nodeName.toLowerCase(); // Fails to persist the checked state of a cloned checkbox or radio button.
if(nodeName === "input" && rcheckableType.test(src.type)){dest.checked = src.checked; // Fails to return the selected option to the default selected state when cloning options
}else if(nodeName === "input" || nodeName === "textarea"){dest.defaultValue = src.defaultValue;}}jQuery.extend({clone:function clone(elem,dataAndEvents,deepDataAndEvents){var i,l,srcElements,destElements,clone=elem.cloneNode(true),inPage=jQuery.contains(elem.ownerDocument,elem); // Fix IE cloning issues
if(!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)){ // We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
destElements = getAll(clone);srcElements = getAll(elem);for(i = 0,l = srcElements.length;i < l;i++) {fixInput(srcElements[i],destElements[i]);}} // Copy the events from the original to the clone
if(dataAndEvents){if(deepDataAndEvents){srcElements = srcElements || getAll(elem);destElements = destElements || getAll(clone);for(i = 0,l = srcElements.length;i < l;i++) {cloneCopyEvent(srcElements[i],destElements[i]);}}else {cloneCopyEvent(elem,clone);}} // Preserve script evaluation history
destElements = getAll(clone,"script");if(destElements.length > 0){setGlobalEval(destElements,!inPage && getAll(elem,"script"));} // Return the cloned set
return clone;},buildFragment:function buildFragment(elems,context,scripts,selection){var elem,tmp,tag,wrap,contains,j,fragment=context.createDocumentFragment(),nodes=[],i=0,l=elems.length;for(;i < l;i++) {elem = elems[i];if(elem || elem === 0){ // Add nodes directly
if(jQuery.type(elem) === "object"){ // Support: QtWebKit, PhantomJS
// push.apply(_, arraylike) throws on ancient WebKit
jQuery.merge(nodes,elem.nodeType?[elem]:elem); // Convert non-html into a text node
}else if(!rhtml.test(elem)){nodes.push(context.createTextNode(elem)); // Convert html into DOM nodes
}else {tmp = tmp || fragment.appendChild(context.createElement("div")); // Deserialize a standard representation
tag = (rtagName.exec(elem) || ["",""])[1].toLowerCase();wrap = wrapMap[tag] || wrapMap._default;tmp.innerHTML = wrap[1] + elem.replace(rxhtmlTag,"<$1></$2>") + wrap[2]; // Descend through wrappers to the right content
j = wrap[0];while(j--) {tmp = tmp.lastChild;} // Support: QtWebKit, PhantomJS
// push.apply(_, arraylike) throws on ancient WebKit
jQuery.merge(nodes,tmp.childNodes); // Remember the top-level container
tmp = fragment.firstChild; // Ensure the created nodes are orphaned (#12392)
tmp.textContent = "";}}} // Remove wrapper from fragment
fragment.textContent = "";i = 0;while(elem = nodes[i++]) { // #4087 - If origin and destination elements are the same, and this is
// that element, do not do anything
if(selection && jQuery.inArray(elem,selection) !== -1){continue;}contains = jQuery.contains(elem.ownerDocument,elem); // Append to fragment
tmp = getAll(fragment.appendChild(elem),"script"); // Preserve script evaluation history
if(contains){setGlobalEval(tmp);} // Capture executables
if(scripts){j = 0;while(elem = tmp[j++]) {if(rscriptType.test(elem.type || "")){scripts.push(elem);}}}}return fragment;},cleanData:function cleanData(elems){var data,elem,type,key,special=jQuery.event.special,i=0;for(;(elem = elems[i]) !== undefined;i++) {if(jQuery.acceptData(elem)){key = elem[data_priv.expando];if(key && (data = data_priv.cache[key])){if(data.events){for(type in data.events) {if(special[type]){jQuery.event.remove(elem,type); // This is a shortcut to avoid jQuery.event.remove's overhead
}else {jQuery.removeEvent(elem,type,data.handle);}}}if(data_priv.cache[key]){ // Discard any remaining `private` data
delete data_priv.cache[key];}}} // Discard any remaining `user` data
delete data_user.cache[elem[data_user.expando]];}}});jQuery.fn.extend({text:function text(value){return access(this,function(value){return value === undefined?jQuery.text(this):this.empty().each(function(){if(this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9){this.textContent = value;}});},null,value,arguments.length);},append:function append(){return this.domManip(arguments,function(elem){if(this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9){var target=manipulationTarget(this,elem);target.appendChild(elem);}});},prepend:function prepend(){return this.domManip(arguments,function(elem){if(this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9){var target=manipulationTarget(this,elem);target.insertBefore(elem,target.firstChild);}});},before:function before(){return this.domManip(arguments,function(elem){if(this.parentNode){this.parentNode.insertBefore(elem,this);}});},after:function after(){return this.domManip(arguments,function(elem){if(this.parentNode){this.parentNode.insertBefore(elem,this.nextSibling);}});},remove:function remove(selector,keepData /* Internal Use Only */){var elem,elems=selector?jQuery.filter(selector,this):this,i=0;for(;(elem = elems[i]) != null;i++) {if(!keepData && elem.nodeType === 1){jQuery.cleanData(getAll(elem));}if(elem.parentNode){if(keepData && jQuery.contains(elem.ownerDocument,elem)){setGlobalEval(getAll(elem,"script"));}elem.parentNode.removeChild(elem);}}return this;},empty:function empty(){var elem,i=0;for(;(elem = this[i]) != null;i++) {if(elem.nodeType === 1){ // Prevent memory leaks
jQuery.cleanData(getAll(elem,false)); // Remove any remaining nodes
elem.textContent = "";}}return this;},clone:function clone(dataAndEvents,deepDataAndEvents){dataAndEvents = dataAndEvents == null?false:dataAndEvents;deepDataAndEvents = deepDataAndEvents == null?dataAndEvents:deepDataAndEvents;return this.map(function(){return jQuery.clone(this,dataAndEvents,deepDataAndEvents);});},html:function html(value){return access(this,function(value){var elem=this[0] || {},i=0,l=this.length;if(value === undefined && elem.nodeType === 1){return elem.innerHTML;} // See if we can take a shortcut and just use innerHTML
if(typeof value === "string" && !rnoInnerhtml.test(value) && !wrapMap[(rtagName.exec(value) || ["",""])[1].toLowerCase()]){value = value.replace(rxhtmlTag,"<$1></$2>");try{for(;i < l;i++) {elem = this[i] || {}; // Remove element nodes and prevent memory leaks
if(elem.nodeType === 1){jQuery.cleanData(getAll(elem,false));elem.innerHTML = value;}}elem = 0; // If using innerHTML throws an exception, use the fallback method
}catch(e) {}}if(elem){this.empty().append(value);}},null,value,arguments.length);},replaceWith:function replaceWith(){var arg=arguments[0]; // Make the changes, replacing each context element with the new content
this.domManip(arguments,function(elem){arg = this.parentNode;jQuery.cleanData(getAll(this));if(arg){arg.replaceChild(elem,this);}}); // Force removal if there was no new content (e.g., from empty arguments)
return arg && (arg.length || arg.nodeType)?this:this.remove();},detach:function detach(selector){return this.remove(selector,true);},domManip:function domManip(args,callback){ // Flatten any nested arrays
args = concat.apply([],args);var fragment,first,scripts,hasScripts,node,doc,i=0,l=this.length,set=this,iNoClone=l - 1,value=args[0],isFunction=jQuery.isFunction(value); // We can't cloneNode fragments that contain checked, in WebKit
if(isFunction || l > 1 && typeof value === "string" && !support.checkClone && rchecked.test(value)){return this.each(function(index){var self=set.eq(index);if(isFunction){args[0] = value.call(this,index,self.html());}self.domManip(args,callback);});}if(l){fragment = jQuery.buildFragment(args,this[0].ownerDocument,false,this);first = fragment.firstChild;if(fragment.childNodes.length === 1){fragment = first;}if(first){scripts = jQuery.map(getAll(fragment,"script"),disableScript);hasScripts = scripts.length; // Use the original fragment for the last item instead of the first because it can end up
// being emptied incorrectly in certain situations (#8070).
for(;i < l;i++) {node = fragment;if(i !== iNoClone){node = jQuery.clone(node,true,true); // Keep references to cloned scripts for later restoration
if(hasScripts){ // Support: QtWebKit
// jQuery.merge because push.apply(_, arraylike) throws
jQuery.merge(scripts,getAll(node,"script"));}}callback.call(this[i],node,i);}if(hasScripts){doc = scripts[scripts.length - 1].ownerDocument; // Reenable scripts
jQuery.map(scripts,restoreScript); // Evaluate executable scripts on first document insertion
for(i = 0;i < hasScripts;i++) {node = scripts[i];if(rscriptType.test(node.type || "") && !data_priv.access(node,"globalEval") && jQuery.contains(doc,node)){if(node.src){ // Optional AJAX dependency, but won't run scripts if not present
if(jQuery._evalUrl){jQuery._evalUrl(node.src);}}else {jQuery.globalEval(node.textContent.replace(rcleanScript,""));}}}}}}return this;}});jQuery.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(name,original){jQuery.fn[name] = function(selector){var elems,ret=[],insert=jQuery(selector),last=insert.length - 1,i=0;for(;i <= last;i++) {elems = i === last?this:this.clone(true);jQuery(insert[i])[original](elems); // Support: QtWebKit
// .get() because push.apply(_, arraylike) throws
push.apply(ret,elems.get());}return this.pushStack(ret);};});var iframe,elemdisplay={}; /**
 * Retrieve the actual display of a element
 * @param {String} name nodeName of the element
 * @param {Object} doc Document object
 */ // Called only from within defaultDisplay
function actualDisplay(name,doc){var style,elem=jQuery(doc.createElement(name)).appendTo(doc.body), // getDefaultComputedStyle might be reliably used only on attached element
display=window.getDefaultComputedStyle && (style = window.getDefaultComputedStyle(elem[0]))? // Use of this method is a temporary fix (more like optimization) until something better comes along,
// since it was removed from specification and supported only in FF
style.display:jQuery.css(elem[0],"display"); // We don't have any data stored on the element,
// so use "detach" method as fast way to get rid of the element
elem.detach();return display;} /**
 * Try to determine the default display value of an element
 * @param {String} nodeName
 */function defaultDisplay(nodeName){var doc=document,display=elemdisplay[nodeName];if(!display){display = actualDisplay(nodeName,doc); // If the simple way fails, read from inside an iframe
if(display === "none" || !display){ // Use the already-created iframe if possible
iframe = (iframe || jQuery("<iframe frameborder='0' width='0' height='0'/>")).appendTo(doc.documentElement); // Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
doc = iframe[0].contentDocument; // Support: IE
doc.write();doc.close();display = actualDisplay(nodeName,doc);iframe.detach();} // Store the correct default display
elemdisplay[nodeName] = display;}return display;}var rmargin=/^margin/;var rnumnonpx=new RegExp("^(" + pnum + ")(?!px)[a-z%]+$","i");var getStyles=function getStyles(elem){ // Support: IE<=11+, Firefox<=30+ (#15098, #14150)
// IE throws on elements created in popups
// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
if(elem.ownerDocument.defaultView.opener){return elem.ownerDocument.defaultView.getComputedStyle(elem,null);}return window.getComputedStyle(elem,null);};function curCSS(elem,name,computed){var width,minWidth,maxWidth,ret,style=elem.style;computed = computed || getStyles(elem); // Support: IE9
// getPropertyValue is only needed for .css('filter') (#12537)
if(computed){ret = computed.getPropertyValue(name) || computed[name];}if(computed){if(ret === "" && !jQuery.contains(elem.ownerDocument,elem)){ret = jQuery.style(elem,name);} // Support: iOS < 6
// A tribute to the "awesome hack by Dean Edwards"
// iOS < 6 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
if(rnumnonpx.test(ret) && rmargin.test(name)){ // Remember the original values
width = style.width;minWidth = style.minWidth;maxWidth = style.maxWidth; // Put in the new values to get a computed value out
style.minWidth = style.maxWidth = style.width = ret;ret = computed.width; // Revert the changed values
style.width = width;style.minWidth = minWidth;style.maxWidth = maxWidth;}}return ret !== undefined? // Support: IE
// IE returns zIndex value as an integer.
ret + "":ret;}function addGetHookIf(conditionFn,hookFn){ // Define the hook, we'll check on the first run if it's really needed.
return {get:function get(){if(conditionFn()){ // Hook not needed (or it's not possible to use it due
// to missing dependency), remove it.
delete this.get;return;} // Hook needed; redefine it so that the support test is not executed again.
return (this.get = hookFn).apply(this,arguments);}};}(function(){var pixelPositionVal,boxSizingReliableVal,docElem=document.documentElement,container=document.createElement("div"),div=document.createElement("div");if(!div.style){return;} // Support: IE9-11+
// Style of cloned element affects source element cloned (#8908)
div.style.backgroundClip = "content-box";div.cloneNode(true).style.backgroundClip = "";support.clearCloneStyle = div.style.backgroundClip === "content-box";container.style.cssText = "border:0;width:0;height:0;top:0;left:-9999px;margin-top:1px;" + "position:absolute";container.appendChild(div); // Executing both pixelPosition & boxSizingReliable tests require only one layout
// so they're executed at the same time to save the second computation.
function computePixelPositionAndBoxSizingReliable(){div.style.cssText =  // Support: Firefox<29, Android 2.3
// Vendor-prefix box-sizing
"-webkit-box-sizing:border-box;-moz-box-sizing:border-box;" + "box-sizing:border-box;display:block;margin-top:1%;top:1%;" + "border:1px;padding:1px;width:4px;position:absolute";div.innerHTML = "";docElem.appendChild(container);var divStyle=window.getComputedStyle(div,null);pixelPositionVal = divStyle.top !== "1%";boxSizingReliableVal = divStyle.width === "4px";docElem.removeChild(container);} // Support: node.js jsdom
// Don't assume that getComputedStyle is a property of the global object
if(window.getComputedStyle){jQuery.extend(support,{pixelPosition:function pixelPosition(){ // This test is executed only once but we still do memoizing
// since we can use the boxSizingReliable pre-computing.
// No need to check if the test was already performed, though.
computePixelPositionAndBoxSizingReliable();return pixelPositionVal;},boxSizingReliable:function boxSizingReliable(){if(boxSizingReliableVal == null){computePixelPositionAndBoxSizingReliable();}return boxSizingReliableVal;},reliableMarginRight:function reliableMarginRight(){ // Support: Android 2.3
// Check if div with explicit width and no margin-right incorrectly
// gets computed margin-right based on width of container. (#3333)
// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
// This support function is only executed once so no memoizing is needed.
var ret,marginDiv=div.appendChild(document.createElement("div")); // Reset CSS: box-sizing; display; margin; border; padding
marginDiv.style.cssText = div.style.cssText =  // Support: Firefox<29, Android 2.3
// Vendor-prefix box-sizing
"-webkit-box-sizing:content-box;-moz-box-sizing:content-box;" + "box-sizing:content-box;display:block;margin:0;border:0;padding:0";marginDiv.style.marginRight = marginDiv.style.width = "0";div.style.width = "1px";docElem.appendChild(container);ret = !parseFloat(window.getComputedStyle(marginDiv,null).marginRight);docElem.removeChild(container);div.removeChild(marginDiv);return ret;}});}})(); // A method for quickly swapping in/out CSS properties to get correct calculations.
jQuery.swap = function(elem,options,callback,args){var ret,name,old={}; // Remember the old values, and insert the new ones
for(name in options) {old[name] = elem.style[name];elem.style[name] = options[name];}ret = callback.apply(elem,args || []); // Revert the old values
for(name in options) {elem.style[name] = old[name];}return ret;};var  // Swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
rdisplayswap=/^(none|table(?!-c[ea]).+)/,rnumsplit=new RegExp("^(" + pnum + ")(.*)$","i"),rrelNum=new RegExp("^([+-])=(" + pnum + ")","i"),cssShow={position:"absolute",visibility:"hidden",display:"block"},cssNormalTransform={letterSpacing:"0",fontWeight:"400"},cssPrefixes=["Webkit","O","Moz","ms"]; // Return a css property mapped to a potentially vendor prefixed property
function vendorPropName(style,name){ // Shortcut for names that are not vendor prefixed
if(name in style){return name;} // Check for vendor prefixed names
var capName=name[0].toUpperCase() + name.slice(1),origName=name,i=cssPrefixes.length;while(i--) {name = cssPrefixes[i] + capName;if(name in style){return name;}}return origName;}function setPositiveNumber(elem,value,subtract){var matches=rnumsplit.exec(value);return matches? // Guard against undefined "subtract", e.g., when used as in cssHooks
Math.max(0,matches[1] - (subtract || 0)) + (matches[2] || "px"):value;}function augmentWidthOrHeight(elem,name,extra,isBorderBox,styles){var i=extra === (isBorderBox?"border":"content")? // If we already have the right measurement, avoid augmentation
4: // Otherwise initialize for horizontal or vertical properties
name === "width"?1:0,val=0;for(;i < 4;i += 2) { // Both box models exclude margin, so add it if we want it
if(extra === "margin"){val += jQuery.css(elem,extra + cssExpand[i],true,styles);}if(isBorderBox){ // border-box includes padding, so remove it if we want content
if(extra === "content"){val -= jQuery.css(elem,"padding" + cssExpand[i],true,styles);} // At this point, extra isn't border nor margin, so remove border
if(extra !== "margin"){val -= jQuery.css(elem,"border" + cssExpand[i] + "Width",true,styles);}}else { // At this point, extra isn't content, so add padding
val += jQuery.css(elem,"padding" + cssExpand[i],true,styles); // At this point, extra isn't content nor padding, so add border
if(extra !== "padding"){val += jQuery.css(elem,"border" + cssExpand[i] + "Width",true,styles);}}}return val;}function getWidthOrHeight(elem,name,extra){ // Start with offset property, which is equivalent to the border-box value
var valueIsBorderBox=true,val=name === "width"?elem.offsetWidth:elem.offsetHeight,styles=getStyles(elem),isBorderBox=jQuery.css(elem,"boxSizing",false,styles) === "border-box"; // Some non-html elements return undefined for offsetWidth, so check for null/undefined
// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
if(val <= 0 || val == null){ // Fall back to computed then uncomputed css if necessary
val = curCSS(elem,name,styles);if(val < 0 || val == null){val = elem.style[name];} // Computed unit is not pixels. Stop here and return.
if(rnumnonpx.test(val)){return val;} // Check for style in case a browser which returns unreliable values
// for getComputedStyle silently falls back to the reliable elem.style
valueIsBorderBox = isBorderBox && (support.boxSizingReliable() || val === elem.style[name]); // Normalize "", auto, and prepare for extra
val = parseFloat(val) || 0;} // Use the active box-sizing model to add/subtract irrelevant styles
return val + augmentWidthOrHeight(elem,name,extra || (isBorderBox?"border":"content"),valueIsBorderBox,styles) + "px";}function showHide(elements,show){var display,elem,hidden,values=[],index=0,length=elements.length;for(;index < length;index++) {elem = elements[index];if(!elem.style){continue;}values[index] = data_priv.get(elem,"olddisplay");display = elem.style.display;if(show){ // Reset the inline display of this element to learn if it is
// being hidden by cascaded rules or not
if(!values[index] && display === "none"){elem.style.display = "";} // Set elements which have been overridden with display: none
// in a stylesheet to whatever the default browser style is
// for such an element
if(elem.style.display === "" && isHidden(elem)){values[index] = data_priv.access(elem,"olddisplay",defaultDisplay(elem.nodeName));}}else {hidden = isHidden(elem);if(display !== "none" || !hidden){data_priv.set(elem,"olddisplay",hidden?display:jQuery.css(elem,"display"));}}} // Set the display of most of the elements in a second loop
// to avoid the constant reflow
for(index = 0;index < length;index++) {elem = elements[index];if(!elem.style){continue;}if(!show || elem.style.display === "none" || elem.style.display === ""){elem.style.display = show?values[index] || "":"none";}}return elements;}jQuery.extend({ // Add in style property hooks for overriding the default
// behavior of getting and setting a style property
cssHooks:{opacity:{get:function get(elem,computed){if(computed){ // We should always get a number back from opacity
var ret=curCSS(elem,"opacity");return ret === ""?"1":ret;}}}}, // Don't automatically add "px" to these possibly-unitless properties
cssNumber:{"columnCount":true,"fillOpacity":true,"flexGrow":true,"flexShrink":true,"fontWeight":true,"lineHeight":true,"opacity":true,"order":true,"orphans":true,"widows":true,"zIndex":true,"zoom":true}, // Add in properties whose names you wish to fix before
// setting or getting the value
cssProps:{"float":"cssFloat"}, // Get and set the style property on a DOM Node
style:function style(elem,name,value,extra){ // Don't set styles on text and comment nodes
if(!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style){return;} // Make sure that we're working with the right name
var ret,type,hooks,origName=jQuery.camelCase(name),style=elem.style;name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(style,origName)); // Gets hook for the prefixed version, then unprefixed version
hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName]; // Check if we're setting a value
if(value !== undefined){type = typeof value; // Convert "+=" or "-=" to relative numbers (#7345)
if(type === "string" && (ret = rrelNum.exec(value))){value = (ret[1] + 1) * ret[2] + parseFloat(jQuery.css(elem,name)); // Fixes bug #9237
type = "number";} // Make sure that null and NaN values aren't set (#7116)
if(value == null || value !== value){return;} // If a number, add 'px' to the (except for certain CSS properties)
if(type === "number" && !jQuery.cssNumber[origName]){value += "px";} // Support: IE9-11+
// background-* props affect original clone's values
if(!support.clearCloneStyle && value === "" && name.indexOf("background") === 0){style[name] = "inherit";} // If a hook was provided, use that value, otherwise just set the specified value
if(!hooks || !("set" in hooks) || (value = hooks.set(elem,value,extra)) !== undefined){style[name] = value;}}else { // If a hook was provided get the non-computed value from there
if(hooks && "get" in hooks && (ret = hooks.get(elem,false,extra)) !== undefined){return ret;} // Otherwise just get the value from the style object
return style[name];}},css:function css(elem,name,extra,styles){var val,num,hooks,origName=jQuery.camelCase(name); // Make sure that we're working with the right name
name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(elem.style,origName)); // Try prefixed name followed by the unprefixed name
hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName]; // If a hook was provided get the computed value from there
if(hooks && "get" in hooks){val = hooks.get(elem,true,extra);} // Otherwise, if a way to get the computed value exists, use that
if(val === undefined){val = curCSS(elem,name,styles);} // Convert "normal" to computed value
if(val === "normal" && name in cssNormalTransform){val = cssNormalTransform[name];} // Make numeric if forced or a qualifier was provided and val looks numeric
if(extra === "" || extra){num = parseFloat(val);return extra === true || jQuery.isNumeric(num)?num || 0:val;}return val;}});jQuery.each(["height","width"],function(i,name){jQuery.cssHooks[name] = {get:function get(elem,computed,extra){if(computed){ // Certain elements can have dimension info if we invisibly show them
// but it must have a current display style that would benefit
return rdisplayswap.test(jQuery.css(elem,"display")) && elem.offsetWidth === 0?jQuery.swap(elem,cssShow,function(){return getWidthOrHeight(elem,name,extra);}):getWidthOrHeight(elem,name,extra);}},set:function set(elem,value,extra){var styles=extra && getStyles(elem);return setPositiveNumber(elem,value,extra?augmentWidthOrHeight(elem,name,extra,jQuery.css(elem,"boxSizing",false,styles) === "border-box",styles):0);}};}); // Support: Android 2.3
jQuery.cssHooks.marginRight = addGetHookIf(support.reliableMarginRight,function(elem,computed){if(computed){return jQuery.swap(elem,{"display":"inline-block"},curCSS,[elem,"marginRight"]);}}); // These hooks are used by animate to expand properties
jQuery.each({margin:"",padding:"",border:"Width"},function(prefix,suffix){jQuery.cssHooks[prefix + suffix] = {expand:function expand(value){var i=0,expanded={}, // Assumes a single number if not a string
parts=typeof value === "string"?value.split(" "):[value];for(;i < 4;i++) {expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];}return expanded;}};if(!rmargin.test(prefix)){jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;}});jQuery.fn.extend({css:function css(name,value){return access(this,function(elem,name,value){var styles,len,map={},i=0;if(jQuery.isArray(name)){styles = getStyles(elem);len = name.length;for(;i < len;i++) {map[name[i]] = jQuery.css(elem,name[i],false,styles);}return map;}return value !== undefined?jQuery.style(elem,name,value):jQuery.css(elem,name);},name,value,arguments.length > 1);},show:function show(){return showHide(this,true);},hide:function hide(){return showHide(this);},toggle:function toggle(state){if(typeof state === "boolean"){return state?this.show():this.hide();}return this.each(function(){if(isHidden(this)){jQuery(this).show();}else {jQuery(this).hide();}});}});function Tween(elem,options,prop,end,easing){return new Tween.prototype.init(elem,options,prop,end,easing);}jQuery.Tween = Tween;Tween.prototype = {constructor:Tween,init:function init(elem,options,prop,end,easing,unit){this.elem = elem;this.prop = prop;this.easing = easing || "swing";this.options = options;this.start = this.now = this.cur();this.end = end;this.unit = unit || (jQuery.cssNumber[prop]?"":"px");},cur:function cur(){var hooks=Tween.propHooks[this.prop];return hooks && hooks.get?hooks.get(this):Tween.propHooks._default.get(this);},run:function run(percent){var eased,hooks=Tween.propHooks[this.prop];if(this.options.duration){this.pos = eased = jQuery.easing[this.easing](percent,this.options.duration * percent,0,1,this.options.duration);}else {this.pos = eased = percent;}this.now = (this.end - this.start) * eased + this.start;if(this.options.step){this.options.step.call(this.elem,this.now,this);}if(hooks && hooks.set){hooks.set(this);}else {Tween.propHooks._default.set(this);}return this;}};Tween.prototype.init.prototype = Tween.prototype;Tween.propHooks = {_default:{get:function get(tween){var result;if(tween.elem[tween.prop] != null && (!tween.elem.style || tween.elem.style[tween.prop] == null)){return tween.elem[tween.prop];} // Passing an empty string as a 3rd parameter to .css will automatically
// attempt a parseFloat and fallback to a string if the parse fails.
// Simple values such as "10px" are parsed to Float;
// complex values such as "rotate(1rad)" are returned as-is.
result = jQuery.css(tween.elem,tween.prop,""); // Empty strings, null, undefined and "auto" are converted to 0.
return !result || result === "auto"?0:result;},set:function set(tween){ // Use step hook for back compat.
// Use cssHook if its there.
// Use .style if available and use plain properties where available.
if(jQuery.fx.step[tween.prop]){jQuery.fx.step[tween.prop](tween);}else if(tween.elem.style && (tween.elem.style[jQuery.cssProps[tween.prop]] != null || jQuery.cssHooks[tween.prop])){jQuery.style(tween.elem,tween.prop,tween.now + tween.unit);}else {tween.elem[tween.prop] = tween.now;}}}}; // Support: IE9
// Panic based approach to setting things on disconnected nodes
Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {set:function set(tween){if(tween.elem.nodeType && tween.elem.parentNode){tween.elem[tween.prop] = tween.now;}}};jQuery.easing = {linear:function linear(p){return p;},swing:function swing(p){return 0.5 - Math.cos(p * Math.PI) / 2;}};jQuery.fx = Tween.prototype.init; // Back Compat <1.8 extension point
jQuery.fx.step = {};var fxNow,timerId,rfxtypes=/^(?:toggle|show|hide)$/,rfxnum=new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$","i"),rrun=/queueHooks$/,animationPrefilters=[defaultPrefilter],tweeners={"*":[function(prop,value){var tween=this.createTween(prop,value),target=tween.cur(),parts=rfxnum.exec(value),unit=parts && parts[3] || (jQuery.cssNumber[prop]?"":"px"), // Starting value computation is required for potential unit mismatches
start=(jQuery.cssNumber[prop] || unit !== "px" && +target) && rfxnum.exec(jQuery.css(tween.elem,prop)),scale=1,maxIterations=20;if(start && start[3] !== unit){ // Trust units reported by jQuery.css
unit = unit || start[3]; // Make sure we update the tween properties later on
parts = parts || []; // Iteratively approximate from a nonzero starting point
start = +target || 1;do { // If previous iteration zeroed out, double until we get *something*.
// Use string for doubling so we don't accidentally see scale as unchanged below
scale = scale || ".5"; // Adjust and apply
start = start / scale;jQuery.style(tween.elem,prop,start + unit); // Update scale, tolerating zero or NaN from tween.cur(),
// break the loop if scale is unchanged or perfect, or if we've just had enough
}while(scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations);} // Update tween properties
if(parts){start = tween.start = +start || +target || 0;tween.unit = unit; // If a +=/-= token was provided, we're doing a relative animation
tween.end = parts[1]?start + (parts[1] + 1) * parts[2]:+parts[2];}return tween;}]}; // Animations created synchronously will run synchronously
function createFxNow(){setTimeout(function(){fxNow = undefined;});return fxNow = jQuery.now();} // Generate parameters to create a standard animation
function genFx(type,includeWidth){var which,i=0,attrs={height:type}; // If we include width, step value is 1 to do all cssExpand values,
// otherwise step value is 2 to skip over Left and Right
includeWidth = includeWidth?1:0;for(;i < 4;i += 2 - includeWidth) {which = cssExpand[i];attrs["margin" + which] = attrs["padding" + which] = type;}if(includeWidth){attrs.opacity = attrs.width = type;}return attrs;}function createTween(value,prop,animation){var tween,collection=(tweeners[prop] || []).concat(tweeners["*"]),index=0,length=collection.length;for(;index < length;index++) {if(tween = collection[index].call(animation,prop,value)){ // We're done with this property
return tween;}}}function defaultPrefilter(elem,props,opts){ /* jshint validthis: true */var prop,value,toggle,tween,hooks,oldfire,display,checkDisplay,anim=this,orig={},style=elem.style,hidden=elem.nodeType && isHidden(elem),dataShow=data_priv.get(elem,"fxshow"); // Handle queue: false promises
if(!opts.queue){hooks = jQuery._queueHooks(elem,"fx");if(hooks.unqueued == null){hooks.unqueued = 0;oldfire = hooks.empty.fire;hooks.empty.fire = function(){if(!hooks.unqueued){oldfire();}};}hooks.unqueued++;anim.always(function(){ // Ensure the complete handler is called before this completes
anim.always(function(){hooks.unqueued--;if(!jQuery.queue(elem,"fx").length){hooks.empty.fire();}});});} // Height/width overflow pass
if(elem.nodeType === 1 && ("height" in props || "width" in props)){ // Make sure that nothing sneaks out
// Record all 3 overflow attributes because IE9-10 do not
// change the overflow attribute when overflowX and
// overflowY are set to the same value
opts.overflow = [style.overflow,style.overflowX,style.overflowY]; // Set display property to inline-block for height/width
// animations on inline elements that are having width/height animated
display = jQuery.css(elem,"display"); // Test default display if display is currently "none"
checkDisplay = display === "none"?data_priv.get(elem,"olddisplay") || defaultDisplay(elem.nodeName):display;if(checkDisplay === "inline" && jQuery.css(elem,"float") === "none"){style.display = "inline-block";}}if(opts.overflow){style.overflow = "hidden";anim.always(function(){style.overflow = opts.overflow[0];style.overflowX = opts.overflow[1];style.overflowY = opts.overflow[2];});} // show/hide pass
for(prop in props) {value = props[prop];if(rfxtypes.exec(value)){delete props[prop];toggle = toggle || value === "toggle";if(value === (hidden?"hide":"show")){ // If there is dataShow left over from a stopped hide or show and we are going to proceed with show, we should pretend to be hidden
if(value === "show" && dataShow && dataShow[prop] !== undefined){hidden = true;}else {continue;}}orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem,prop); // Any non-fx value stops us from restoring the original display value
}else {display = undefined;}}if(!jQuery.isEmptyObject(orig)){if(dataShow){if("hidden" in dataShow){hidden = dataShow.hidden;}}else {dataShow = data_priv.access(elem,"fxshow",{});} // Store state if its toggle - enables .stop().toggle() to "reverse"
if(toggle){dataShow.hidden = !hidden;}if(hidden){jQuery(elem).show();}else {anim.done(function(){jQuery(elem).hide();});}anim.done(function(){var prop;data_priv.remove(elem,"fxshow");for(prop in orig) {jQuery.style(elem,prop,orig[prop]);}});for(prop in orig) {tween = createTween(hidden?dataShow[prop]:0,prop,anim);if(!(prop in dataShow)){dataShow[prop] = tween.start;if(hidden){tween.end = tween.start;tween.start = prop === "width" || prop === "height"?1:0;}}} // If this is a noop like .hide().hide(), restore an overwritten display value
}else if((display === "none"?defaultDisplay(elem.nodeName):display) === "inline"){style.display = display;}}function propFilter(props,specialEasing){var index,name,easing,value,hooks; // camelCase, specialEasing and expand cssHook pass
for(index in props) {name = jQuery.camelCase(index);easing = specialEasing[name];value = props[index];if(jQuery.isArray(value)){easing = value[1];value = props[index] = value[0];}if(index !== name){props[name] = value;delete props[index];}hooks = jQuery.cssHooks[name];if(hooks && "expand" in hooks){value = hooks.expand(value);delete props[name]; // Not quite $.extend, this won't overwrite existing keys.
// Reusing 'index' because we have the correct "name"
for(index in value) {if(!(index in props)){props[index] = value[index];specialEasing[index] = easing;}}}else {specialEasing[name] = easing;}}}function Animation(elem,properties,options){var result,stopped,index=0,length=animationPrefilters.length,deferred=jQuery.Deferred().always(function(){ // Don't match elem in the :animated selector
delete tick.elem;}),tick=function tick(){if(stopped){return false;}var currentTime=fxNow || createFxNow(),remaining=Math.max(0,animation.startTime + animation.duration - currentTime), // Support: Android 2.3
// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
temp=remaining / animation.duration || 0,percent=1 - temp,index=0,length=animation.tweens.length;for(;index < length;index++) {animation.tweens[index].run(percent);}deferred.notifyWith(elem,[animation,percent,remaining]);if(percent < 1 && length){return remaining;}else {deferred.resolveWith(elem,[animation]);return false;}},animation=deferred.promise({elem:elem,props:jQuery.extend({},properties),opts:jQuery.extend(true,{specialEasing:{}},options),originalProperties:properties,originalOptions:options,startTime:fxNow || createFxNow(),duration:options.duration,tweens:[],createTween:function createTween(prop,end){var tween=jQuery.Tween(elem,animation.opts,prop,end,animation.opts.specialEasing[prop] || animation.opts.easing);animation.tweens.push(tween);return tween;},stop:function stop(gotoEnd){var index=0, // If we are going to the end, we want to run all the tweens
// otherwise we skip this part
length=gotoEnd?animation.tweens.length:0;if(stopped){return this;}stopped = true;for(;index < length;index++) {animation.tweens[index].run(1);} // Resolve when we played the last frame; otherwise, reject
if(gotoEnd){deferred.resolveWith(elem,[animation,gotoEnd]);}else {deferred.rejectWith(elem,[animation,gotoEnd]);}return this;}}),props=animation.props;propFilter(props,animation.opts.specialEasing);for(;index < length;index++) {result = animationPrefilters[index].call(animation,elem,props,animation.opts);if(result){return result;}}jQuery.map(props,createTween,animation);if(jQuery.isFunction(animation.opts.start)){animation.opts.start.call(elem,animation);}jQuery.fx.timer(jQuery.extend(tick,{elem:elem,anim:animation,queue:animation.opts.queue})); // attach callbacks from options
return animation.progress(animation.opts.progress).done(animation.opts.done,animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);}jQuery.Animation = jQuery.extend(Animation,{tweener:function tweener(props,callback){if(jQuery.isFunction(props)){callback = props;props = ["*"];}else {props = props.split(" ");}var prop,index=0,length=props.length;for(;index < length;index++) {prop = props[index];tweeners[prop] = tweeners[prop] || [];tweeners[prop].unshift(callback);}},prefilter:function prefilter(callback,prepend){if(prepend){animationPrefilters.unshift(callback);}else {animationPrefilters.push(callback);}}});jQuery.speed = function(speed,easing,fn){var opt=speed && typeof speed === "object"?jQuery.extend({},speed):{complete:fn || !fn && easing || jQuery.isFunction(speed) && speed,duration:speed,easing:fn && easing || easing && !jQuery.isFunction(easing) && easing};opt.duration = jQuery.fx.off?0:typeof opt.duration === "number"?opt.duration:opt.duration in jQuery.fx.speeds?jQuery.fx.speeds[opt.duration]:jQuery.fx.speeds._default; // Normalize opt.queue - true/undefined/null -> "fx"
if(opt.queue == null || opt.queue === true){opt.queue = "fx";} // Queueing
opt.old = opt.complete;opt.complete = function(){if(jQuery.isFunction(opt.old)){opt.old.call(this);}if(opt.queue){jQuery.dequeue(this,opt.queue);}};return opt;};jQuery.fn.extend({fadeTo:function fadeTo(speed,to,easing,callback){ // Show any hidden elements after setting opacity to 0
return this.filter(isHidden).css("opacity",0).show() // Animate to the value specified
.end().animate({opacity:to},speed,easing,callback);},animate:function animate(prop,speed,easing,callback){var empty=jQuery.isEmptyObject(prop),optall=jQuery.speed(speed,easing,callback),doAnimation=function doAnimation(){ // Operate on a copy of prop so per-property easing won't be lost
var anim=Animation(this,jQuery.extend({},prop),optall); // Empty animations, or finishing resolves immediately
if(empty || data_priv.get(this,"finish")){anim.stop(true);}};doAnimation.finish = doAnimation;return empty || optall.queue === false?this.each(doAnimation):this.queue(optall.queue,doAnimation);},stop:function stop(type,clearQueue,gotoEnd){var stopQueue=function stopQueue(hooks){var stop=hooks.stop;delete hooks.stop;stop(gotoEnd);};if(typeof type !== "string"){gotoEnd = clearQueue;clearQueue = type;type = undefined;}if(clearQueue && type !== false){this.queue(type || "fx",[]);}return this.each(function(){var dequeue=true,index=type != null && type + "queueHooks",timers=jQuery.timers,data=data_priv.get(this);if(index){if(data[index] && data[index].stop){stopQueue(data[index]);}}else {for(index in data) {if(data[index] && data[index].stop && rrun.test(index)){stopQueue(data[index]);}}}for(index = timers.length;index--;) {if(timers[index].elem === this && (type == null || timers[index].queue === type)){timers[index].anim.stop(gotoEnd);dequeue = false;timers.splice(index,1);}} // Start the next in the queue if the last step wasn't forced.
// Timers currently will call their complete callbacks, which
// will dequeue but only if they were gotoEnd.
if(dequeue || !gotoEnd){jQuery.dequeue(this,type);}});},finish:function finish(type){if(type !== false){type = type || "fx";}return this.each(function(){var index,data=data_priv.get(this),queue=data[type + "queue"],hooks=data[type + "queueHooks"],timers=jQuery.timers,length=queue?queue.length:0; // Enable finishing flag on private data
data.finish = true; // Empty the queue first
jQuery.queue(this,type,[]);if(hooks && hooks.stop){hooks.stop.call(this,true);} // Look for any active animations, and finish them
for(index = timers.length;index--;) {if(timers[index].elem === this && timers[index].queue === type){timers[index].anim.stop(true);timers.splice(index,1);}} // Look for any animations in the old queue and finish them
for(index = 0;index < length;index++) {if(queue[index] && queue[index].finish){queue[index].finish.call(this);}} // Turn off finishing flag
delete data.finish;});}});jQuery.each(["toggle","show","hide"],function(i,name){var cssFn=jQuery.fn[name];jQuery.fn[name] = function(speed,easing,callback){return speed == null || typeof speed === "boolean"?cssFn.apply(this,arguments):this.animate(genFx(name,true),speed,easing,callback);};}); // Generate shortcuts for custom animations
jQuery.each({slideDown:genFx("show"),slideUp:genFx("hide"),slideToggle:genFx("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(name,props){jQuery.fn[name] = function(speed,easing,callback){return this.animate(props,speed,easing,callback);};});jQuery.timers = [];jQuery.fx.tick = function(){var timer,i=0,timers=jQuery.timers;fxNow = jQuery.now();for(;i < timers.length;i++) {timer = timers[i]; // Checks the timer has not already been removed
if(!timer() && timers[i] === timer){timers.splice(i--,1);}}if(!timers.length){jQuery.fx.stop();}fxNow = undefined;};jQuery.fx.timer = function(timer){jQuery.timers.push(timer);if(timer()){jQuery.fx.start();}else {jQuery.timers.pop();}};jQuery.fx.interval = 13;jQuery.fx.start = function(){if(!timerId){timerId = setInterval(jQuery.fx.tick,jQuery.fx.interval);}};jQuery.fx.stop = function(){clearInterval(timerId);timerId = null;};jQuery.fx.speeds = {slow:600,fast:200, // Default speed
_default:400}; // Based off of the plugin by Clint Helfers, with permission.
// http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function(time,type){time = jQuery.fx?jQuery.fx.speeds[time] || time:time;type = type || "fx";return this.queue(type,function(next,hooks){var timeout=setTimeout(next,time);hooks.stop = function(){clearTimeout(timeout);};});};(function(){var input=document.createElement("input"),select=document.createElement("select"),opt=select.appendChild(document.createElement("option"));input.type = "checkbox"; // Support: iOS<=5.1, Android<=4.2+
// Default value for a checkbox should be "on"
support.checkOn = input.value !== ""; // Support: IE<=11+
// Must access selectedIndex to make default options select
support.optSelected = opt.selected; // Support: Android<=2.3
// Options inside disabled selects are incorrectly marked as disabled
select.disabled = true;support.optDisabled = !opt.disabled; // Support: IE<=11+
// An input loses its value after becoming a radio
input = document.createElement("input");input.value = "t";input.type = "radio";support.radioValue = input.value === "t";})();var nodeHook,boolHook,attrHandle=jQuery.expr.attrHandle;jQuery.fn.extend({attr:function attr(name,value){return access(this,jQuery.attr,name,value,arguments.length > 1);},removeAttr:function removeAttr(name){return this.each(function(){jQuery.removeAttr(this,name);});}});jQuery.extend({attr:function attr(elem,name,value){var hooks,ret,nType=elem.nodeType; // don't get/set attributes on text, comment and attribute nodes
if(!elem || nType === 3 || nType === 8 || nType === 2){return;} // Fallback to prop when attributes are not supported
if(typeof elem.getAttribute === strundefined){return jQuery.prop(elem,name,value);} // All attributes are lowercase
// Grab necessary hook if one is defined
if(nType !== 1 || !jQuery.isXMLDoc(elem)){name = name.toLowerCase();hooks = jQuery.attrHooks[name] || (jQuery.expr.match.bool.test(name)?boolHook:nodeHook);}if(value !== undefined){if(value === null){jQuery.removeAttr(elem,name);}else if(hooks && "set" in hooks && (ret = hooks.set(elem,value,name)) !== undefined){return ret;}else {elem.setAttribute(name,value + "");return value;}}else if(hooks && "get" in hooks && (ret = hooks.get(elem,name)) !== null){return ret;}else {ret = jQuery.find.attr(elem,name); // Non-existent attributes return null, we normalize to undefined
return ret == null?undefined:ret;}},removeAttr:function removeAttr(elem,value){var name,propName,i=0,attrNames=value && value.match(rnotwhite);if(attrNames && elem.nodeType === 1){while(name = attrNames[i++]) {propName = jQuery.propFix[name] || name; // Boolean attributes get special treatment (#10870)
if(jQuery.expr.match.bool.test(name)){ // Set corresponding property to false
elem[propName] = false;}elem.removeAttribute(name);}}},attrHooks:{type:{set:function set(elem,value){if(!support.radioValue && value === "radio" && jQuery.nodeName(elem,"input")){var val=elem.value;elem.setAttribute("type",value);if(val){elem.value = val;}return value;}}}}}); // Hooks for boolean attributes
boolHook = {set:function set(elem,value,name){if(value === false){ // Remove boolean attributes when set to false
jQuery.removeAttr(elem,name);}else {elem.setAttribute(name,name);}return name;}};jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g),function(i,name){var getter=attrHandle[name] || jQuery.find.attr;attrHandle[name] = function(elem,name,isXML){var ret,handle;if(!isXML){ // Avoid an infinite loop by temporarily removing this function from the getter
handle = attrHandle[name];attrHandle[name] = ret;ret = getter(elem,name,isXML) != null?name.toLowerCase():null;attrHandle[name] = handle;}return ret;};});var rfocusable=/^(?:input|select|textarea|button)$/i;jQuery.fn.extend({prop:function prop(name,value){return access(this,jQuery.prop,name,value,arguments.length > 1);},removeProp:function removeProp(name){return this.each(function(){delete this[jQuery.propFix[name] || name];});}});jQuery.extend({propFix:{"for":"htmlFor","class":"className"},prop:function prop(elem,name,value){var ret,hooks,notxml,nType=elem.nodeType; // Don't get/set properties on text, comment and attribute nodes
if(!elem || nType === 3 || nType === 8 || nType === 2){return;}notxml = nType !== 1 || !jQuery.isXMLDoc(elem);if(notxml){ // Fix name and attach hooks
name = jQuery.propFix[name] || name;hooks = jQuery.propHooks[name];}if(value !== undefined){return hooks && "set" in hooks && (ret = hooks.set(elem,value,name)) !== undefined?ret:elem[name] = value;}else {return hooks && "get" in hooks && (ret = hooks.get(elem,name)) !== null?ret:elem[name];}},propHooks:{tabIndex:{get:function get(elem){return elem.hasAttribute("tabindex") || rfocusable.test(elem.nodeName) || elem.href?elem.tabIndex:-1;}}}});if(!support.optSelected){jQuery.propHooks.selected = {get:function get(elem){var parent=elem.parentNode;if(parent && parent.parentNode){parent.parentNode.selectedIndex;}return null;}};}jQuery.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){jQuery.propFix[this.toLowerCase()] = this;});var rclass=/[\t\r\n\f]/g;jQuery.fn.extend({addClass:function addClass(value){var classes,elem,cur,clazz,j,finalValue,proceed=typeof value === "string" && value,i=0,len=this.length;if(jQuery.isFunction(value)){return this.each(function(j){jQuery(this).addClass(value.call(this,j,this.className));});}if(proceed){ // The disjunction here is for better compressibility (see removeClass)
classes = (value || "").match(rnotwhite) || [];for(;i < len;i++) {elem = this[i];cur = elem.nodeType === 1 && (elem.className?(" " + elem.className + " ").replace(rclass," "):" ");if(cur){j = 0;while(clazz = classes[j++]) {if(cur.indexOf(" " + clazz + " ") < 0){cur += clazz + " ";}} // only assign if different to avoid unneeded rendering.
finalValue = jQuery.trim(cur);if(elem.className !== finalValue){elem.className = finalValue;}}}}return this;},removeClass:function removeClass(value){var classes,elem,cur,clazz,j,finalValue,proceed=arguments.length === 0 || typeof value === "string" && value,i=0,len=this.length;if(jQuery.isFunction(value)){return this.each(function(j){jQuery(this).removeClass(value.call(this,j,this.className));});}if(proceed){classes = (value || "").match(rnotwhite) || [];for(;i < len;i++) {elem = this[i]; // This expression is here for better compressibility (see addClass)
cur = elem.nodeType === 1 && (elem.className?(" " + elem.className + " ").replace(rclass," "):"");if(cur){j = 0;while(clazz = classes[j++]) { // Remove *all* instances
while(cur.indexOf(" " + clazz + " ") >= 0) {cur = cur.replace(" " + clazz + " "," ");}} // Only assign if different to avoid unneeded rendering.
finalValue = value?jQuery.trim(cur):"";if(elem.className !== finalValue){elem.className = finalValue;}}}}return this;},toggleClass:function toggleClass(value,stateVal){var type=typeof value;if(typeof stateVal === "boolean" && type === "string"){return stateVal?this.addClass(value):this.removeClass(value);}if(jQuery.isFunction(value)){return this.each(function(i){jQuery(this).toggleClass(value.call(this,i,this.className,stateVal),stateVal);});}return this.each(function(){if(type === "string"){ // Toggle individual class names
var className,i=0,self=jQuery(this),classNames=value.match(rnotwhite) || [];while(className = classNames[i++]) { // Check each className given, space separated list
if(self.hasClass(className)){self.removeClass(className);}else {self.addClass(className);}} // Toggle whole class name
}else if(type === strundefined || type === "boolean"){if(this.className){ // store className if set
data_priv.set(this,"__className__",this.className);} // If the element has a class name or if we're passed `false`,
// then remove the whole classname (if there was one, the above saved it).
// Otherwise bring back whatever was previously saved (if anything),
// falling back to the empty string if nothing was stored.
this.className = this.className || value === false?"":data_priv.get(this,"__className__") || "";}});},hasClass:function hasClass(selector){var className=" " + selector + " ",i=0,l=this.length;for(;i < l;i++) {if(this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass," ").indexOf(className) >= 0){return true;}}return false;}});var rreturn=/\r/g;jQuery.fn.extend({val:function val(value){var hooks,ret,isFunction,elem=this[0];if(!arguments.length){if(elem){hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];if(hooks && "get" in hooks && (ret = hooks.get(elem,"value")) !== undefined){return ret;}ret = elem.value;return typeof ret === "string"? // Handle most common string cases
ret.replace(rreturn,""): // Handle cases where value is null/undef or number
ret == null?"":ret;}return;}isFunction = jQuery.isFunction(value);return this.each(function(i){var val;if(this.nodeType !== 1){return;}if(isFunction){val = value.call(this,i,jQuery(this).val());}else {val = value;} // Treat null/undefined as ""; convert numbers to string
if(val == null){val = "";}else if(typeof val === "number"){val += "";}else if(jQuery.isArray(val)){val = jQuery.map(val,function(value){return value == null?"":value + "";});}hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()]; // If set returns undefined, fall back to normal setting
if(!hooks || !("set" in hooks) || hooks.set(this,val,"value") === undefined){this.value = val;}});}});jQuery.extend({valHooks:{option:{get:function get(elem){var val=jQuery.find.attr(elem,"value");return val != null?val: // Support: IE10-11+
// option.text throws exceptions (#14686, #14858)
jQuery.trim(jQuery.text(elem));}},select:{get:function get(elem){var value,option,options=elem.options,index=elem.selectedIndex,one=elem.type === "select-one" || index < 0,values=one?null:[],max=one?index + 1:options.length,i=index < 0?max:one?index:0; // Loop through all the selected options
for(;i < max;i++) {option = options[i]; // IE6-9 doesn't update selected after form reset (#2551)
if((option.selected || i === index) && ( // Don't return options that are disabled or in a disabled optgroup
support.optDisabled?!option.disabled:option.getAttribute("disabled") === null) && (!option.parentNode.disabled || !jQuery.nodeName(option.parentNode,"optgroup"))){ // Get the specific value for the option
value = jQuery(option).val(); // We don't need an array for one selects
if(one){return value;} // Multi-Selects return an array
values.push(value);}}return values;},set:function set(elem,value){var optionSet,option,options=elem.options,values=jQuery.makeArray(value),i=options.length;while(i--) {option = options[i];if(option.selected = jQuery.inArray(option.value,values) >= 0){optionSet = true;}} // Force browsers to behave consistently when non-matching value is set
if(!optionSet){elem.selectedIndex = -1;}return values;}}}}); // Radios and checkboxes getter/setter
jQuery.each(["radio","checkbox"],function(){jQuery.valHooks[this] = {set:function set(elem,value){if(jQuery.isArray(value)){return elem.checked = jQuery.inArray(jQuery(elem).val(),value) >= 0;}}};if(!support.checkOn){jQuery.valHooks[this].get = function(elem){return elem.getAttribute("value") === null?"on":elem.value;};}}); // Return jQuery for attributes-only inclusion
jQuery.each(("blur focus focusin focusout load resize scroll unload click dblclick " + "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " + "change select submit keydown keypress keyup error contextmenu").split(" "),function(i,name){ // Handle event binding
jQuery.fn[name] = function(data,fn){return arguments.length > 0?this.on(name,null,data,fn):this.trigger(name);};});jQuery.fn.extend({hover:function hover(fnOver,fnOut){return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);},bind:function bind(types,data,fn){return this.on(types,null,data,fn);},unbind:function unbind(types,fn){return this.off(types,null,fn);},delegate:function delegate(selector,types,data,fn){return this.on(types,selector,data,fn);},undelegate:function undelegate(selector,types,fn){ // ( namespace ) or ( selector, types [, fn] )
return arguments.length === 1?this.off(selector,"**"):this.off(types,selector || "**",fn);}});var nonce=jQuery.now();var rquery=/\?/; // Support: Android 2.3
// Workaround failure to string-cast null input
jQuery.parseJSON = function(data){return JSON.parse(data + "");}; // Cross-browser xml parsing
jQuery.parseXML = function(data){var xml,tmp;if(!data || typeof data !== "string"){return null;} // Support: IE9
try{tmp = new DOMParser();xml = tmp.parseFromString(data,"text/xml");}catch(e) {xml = undefined;}if(!xml || xml.getElementsByTagName("parsererror").length){jQuery.error("Invalid XML: " + data);}return xml;};var rhash=/#.*$/,rts=/([?&])_=[^&]*/,rheaders=/^(.*?):[ \t]*([^\r\n]*)$/mg, // #7653, #8125, #8152: local protocol detection
rlocalProtocol=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,rnoContent=/^(?:GET|HEAD)$/,rprotocol=/^\/\//,rurl=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/, /* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */prefilters={}, /* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */transports={}, // Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
allTypes="*/".concat("*"), // Document location
ajaxLocation=window.location.href, // Segment location into parts
ajaxLocParts=rurl.exec(ajaxLocation.toLowerCase()) || []; // Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports(structure){ // dataTypeExpression is optional and defaults to "*"
return function(dataTypeExpression,func){if(typeof dataTypeExpression !== "string"){func = dataTypeExpression;dataTypeExpression = "*";}var dataType,i=0,dataTypes=dataTypeExpression.toLowerCase().match(rnotwhite) || [];if(jQuery.isFunction(func)){ // For each dataType in the dataTypeExpression
while(dataType = dataTypes[i++]) { // Prepend if requested
if(dataType[0] === "+"){dataType = dataType.slice(1) || "*";(structure[dataType] = structure[dataType] || []).unshift(func); // Otherwise append
}else {(structure[dataType] = structure[dataType] || []).push(func);}}}};} // Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports(structure,options,originalOptions,jqXHR){var inspected={},seekingTransport=structure === transports;function inspect(dataType){var selected;inspected[dataType] = true;jQuery.each(structure[dataType] || [],function(_,prefilterOrFactory){var dataTypeOrTransport=prefilterOrFactory(options,originalOptions,jqXHR);if(typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]){options.dataTypes.unshift(dataTypeOrTransport);inspect(dataTypeOrTransport);return false;}else if(seekingTransport){return !(selected = dataTypeOrTransport);}});return selected;}return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");} // A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend(target,src){var key,deep,flatOptions=jQuery.ajaxSettings.flatOptions || {};for(key in src) {if(src[key] !== undefined){(flatOptions[key]?target:deep || (deep = {}))[key] = src[key];}}if(deep){jQuery.extend(true,target,deep);}return target;} /* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */function ajaxHandleResponses(s,jqXHR,responses){var ct,type,finalDataType,firstDataType,contents=s.contents,dataTypes=s.dataTypes; // Remove auto dataType and get content-type in the process
while(dataTypes[0] === "*") {dataTypes.shift();if(ct === undefined){ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");}} // Check if we're dealing with a known content-type
if(ct){for(type in contents) {if(contents[type] && contents[type].test(ct)){dataTypes.unshift(type);break;}}} // Check to see if we have a response for the expected dataType
if(dataTypes[0] in responses){finalDataType = dataTypes[0];}else { // Try convertible dataTypes
for(type in responses) {if(!dataTypes[0] || s.converters[type + " " + dataTypes[0]]){finalDataType = type;break;}if(!firstDataType){firstDataType = type;}} // Or just use first one
finalDataType = finalDataType || firstDataType;} // If we found a dataType
// We add the dataType to the list if needed
// and return the corresponding response
if(finalDataType){if(finalDataType !== dataTypes[0]){dataTypes.unshift(finalDataType);}return responses[finalDataType];}} /* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */function ajaxConvert(s,response,jqXHR,isSuccess){var conv2,current,conv,tmp,prev,converters={}, // Work with a copy of dataTypes in case we need to modify it for conversion
dataTypes=s.dataTypes.slice(); // Create converters map with lowercased keys
if(dataTypes[1]){for(conv in s.converters) {converters[conv.toLowerCase()] = s.converters[conv];}}current = dataTypes.shift(); // Convert to each sequential dataType
while(current) {if(s.responseFields[current]){jqXHR[s.responseFields[current]] = response;} // Apply the dataFilter if provided
if(!prev && isSuccess && s.dataFilter){response = s.dataFilter(response,s.dataType);}prev = current;current = dataTypes.shift();if(current){ // There's only work to do if current dataType is non-auto
if(current === "*"){current = prev; // Convert response if prev dataType is non-auto and differs from current
}else if(prev !== "*" && prev !== current){ // Seek a direct converter
conv = converters[prev + " " + current] || converters["* " + current]; // If none found, seek a pair
if(!conv){for(conv2 in converters) { // If conv2 outputs current
tmp = conv2.split(" ");if(tmp[1] === current){ // If prev can be converted to accepted input
conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];if(conv){ // Condense equivalence converters
if(conv === true){conv = converters[conv2]; // Otherwise, insert the intermediate dataType
}else if(converters[conv2] !== true){current = tmp[0];dataTypes.unshift(tmp[1]);}break;}}}} // Apply converter (if not an equivalence)
if(conv !== true){ // Unless errors are allowed to bubble, catch and return them
if(conv && s["throws"]){response = conv(response);}else {try{response = conv(response);}catch(e) {return {state:"parsererror",error:conv?e:"No conversion from " + prev + " to " + current};}}}}}}return {state:"success",data:response};}jQuery.extend({ // Counter for holding the number of active queries
active:0, // Last-Modified header cache for next request
lastModified:{},etag:{},ajaxSettings:{url:ajaxLocation,type:"GET",isLocal:rlocalProtocol.test(ajaxLocParts[1]),global:true,processData:true,async:true,contentType:"application/x-www-form-urlencoded; charset=UTF-8", /*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/accepts:{"*":allTypes,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"}, // Data converters
// Keys separate source (or catchall "*") and destination types with a single space
converters:{ // Convert anything to text
"* text":String, // Text to html (true = no transformation)
"text html":true, // Evaluate text as a json expression
"text json":jQuery.parseJSON, // Parse text as xml
"text xml":jQuery.parseXML}, // For options that shouldn't be deep extended:
// you can add your own custom options here if
// and when you create one that shouldn't be
// deep extended (see ajaxExtend)
flatOptions:{url:true,context:true}}, // Creates a full fledged settings object into target
// with both ajaxSettings and settings fields.
// If target is omitted, writes into ajaxSettings.
ajaxSetup:function ajaxSetup(target,settings){return settings? // Building a settings object
ajaxExtend(ajaxExtend(target,jQuery.ajaxSettings),settings): // Extending ajaxSettings
ajaxExtend(jQuery.ajaxSettings,target);},ajaxPrefilter:addToPrefiltersOrTransports(prefilters),ajaxTransport:addToPrefiltersOrTransports(transports), // Main method
ajax:function ajax(url,options){ // If url is an object, simulate pre-1.5 signature
if(typeof url === "object"){options = url;url = undefined;} // Force options to be an object
options = options || {};var transport, // URL without anti-cache param
cacheURL, // Response headers
responseHeadersString,responseHeaders, // timeout handle
timeoutTimer, // Cross-domain detection vars
parts, // To know if global events are to be dispatched
fireGlobals, // Loop variable
i, // Create the final options object
s=jQuery.ajaxSetup({},options), // Callbacks context
callbackContext=s.context || s, // Context for global events is callbackContext if it is a DOM node or jQuery collection
globalEventContext=s.context && (callbackContext.nodeType || callbackContext.jquery)?jQuery(callbackContext):jQuery.event, // Deferreds
deferred=jQuery.Deferred(),completeDeferred=jQuery.Callbacks("once memory"), // Status-dependent callbacks
_statusCode=s.statusCode || {}, // Headers (they are sent all at once)
requestHeaders={},requestHeadersNames={}, // The jqXHR state
state=0, // Default abort message
strAbort="canceled", // Fake xhr
jqXHR={readyState:0, // Builds headers hashtable if needed
getResponseHeader:function getResponseHeader(key){var match;if(state === 2){if(!responseHeaders){responseHeaders = {};while(match = rheaders.exec(responseHeadersString)) {responseHeaders[match[1].toLowerCase()] = match[2];}}match = responseHeaders[key.toLowerCase()];}return match == null?null:match;}, // Raw string
getAllResponseHeaders:function getAllResponseHeaders(){return state === 2?responseHeadersString:null;}, // Caches the header
setRequestHeader:function setRequestHeader(name,value){var lname=name.toLowerCase();if(!state){name = requestHeadersNames[lname] = requestHeadersNames[lname] || name;requestHeaders[name] = value;}return this;}, // Overrides response content-type header
overrideMimeType:function overrideMimeType(type){if(!state){s.mimeType = type;}return this;}, // Status-dependent callbacks
statusCode:function statusCode(map){var code;if(map){if(state < 2){for(code in map) { // Lazy-add the new callback in a way that preserves old ones
_statusCode[code] = [_statusCode[code],map[code]];}}else { // Execute the appropriate callbacks
jqXHR.always(map[jqXHR.status]);}}return this;}, // Cancel the request
abort:function abort(statusText){var finalText=statusText || strAbort;if(transport){transport.abort(finalText);}done(0,finalText);return this;}}; // Attach deferreds
deferred.promise(jqXHR).complete = completeDeferred.add;jqXHR.success = jqXHR.done;jqXHR.error = jqXHR.fail; // Remove hash character (#7531: and string promotion)
// Add protocol if not provided (prefilters might expect it)
// Handle falsy url in the settings object (#10093: consistency with old signature)
// We also use the url parameter if available
s.url = ((url || s.url || ajaxLocation) + "").replace(rhash,"").replace(rprotocol,ajaxLocParts[1] + "//"); // Alias method option to type as per ticket #12004
s.type = options.method || options.type || s.method || s.type; // Extract dataTypes list
s.dataTypes = jQuery.trim(s.dataType || "*").toLowerCase().match(rnotwhite) || [""]; // A cross-domain request is in order when we have a protocol:host:port mismatch
if(s.crossDomain == null){parts = rurl.exec(s.url.toLowerCase());s.crossDomain = !!(parts && (parts[1] !== ajaxLocParts[1] || parts[2] !== ajaxLocParts[2] || (parts[3] || (parts[1] === "http:"?"80":"443")) !== (ajaxLocParts[3] || (ajaxLocParts[1] === "http:"?"80":"443"))));} // Convert data if not already a string
if(s.data && s.processData && typeof s.data !== "string"){s.data = jQuery.param(s.data,s.traditional);} // Apply prefilters
inspectPrefiltersOrTransports(prefilters,s,options,jqXHR); // If request was aborted inside a prefilter, stop there
if(state === 2){return jqXHR;} // We can fire global events as of now if asked to
// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
fireGlobals = jQuery.event && s.global; // Watch for a new set of requests
if(fireGlobals && jQuery.active++ === 0){jQuery.event.trigger("ajaxStart");} // Uppercase the type
s.type = s.type.toUpperCase(); // Determine if request has content
s.hasContent = !rnoContent.test(s.type); // Save the URL in case we're toying with the If-Modified-Since
// and/or If-None-Match header later on
cacheURL = s.url; // More options handling for requests with no content
if(!s.hasContent){ // If data is available, append data to url
if(s.data){cacheURL = s.url += (rquery.test(cacheURL)?"&":"?") + s.data; // #9682: remove data so that it's not used in an eventual retry
delete s.data;} // Add anti-cache in url if needed
if(s.cache === false){s.url = rts.test(cacheURL)? // If there is already a '_' parameter, set its value
cacheURL.replace(rts,"$1_=" + nonce++): // Otherwise add one to the end
cacheURL + (rquery.test(cacheURL)?"&":"?") + "_=" + nonce++;}} // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
if(s.ifModified){if(jQuery.lastModified[cacheURL]){jqXHR.setRequestHeader("If-Modified-Since",jQuery.lastModified[cacheURL]);}if(jQuery.etag[cacheURL]){jqXHR.setRequestHeader("If-None-Match",jQuery.etag[cacheURL]);}} // Set the correct header, if data is being sent
if(s.data && s.hasContent && s.contentType !== false || options.contentType){jqXHR.setRequestHeader("Content-Type",s.contentType);} // Set the Accepts header for the server, depending on the dataType
jqXHR.setRequestHeader("Accept",s.dataTypes[0] && s.accepts[s.dataTypes[0]]?s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*"?", " + allTypes + "; q=0.01":""):s.accepts["*"]); // Check for headers option
for(i in s.headers) {jqXHR.setRequestHeader(i,s.headers[i]);} // Allow custom headers/mimetypes and early abort
if(s.beforeSend && (s.beforeSend.call(callbackContext,jqXHR,s) === false || state === 2)){ // Abort if not done already and return
return jqXHR.abort();} // Aborting is no longer a cancellation
strAbort = "abort"; // Install callbacks on deferreds
for(i in {success:1,error:1,complete:1}) {jqXHR[i](s[i]);} // Get transport
transport = inspectPrefiltersOrTransports(transports,s,options,jqXHR); // If no transport, we auto-abort
if(!transport){done(-1,"No Transport");}else {jqXHR.readyState = 1; // Send global event
if(fireGlobals){globalEventContext.trigger("ajaxSend",[jqXHR,s]);} // Timeout
if(s.async && s.timeout > 0){timeoutTimer = setTimeout(function(){jqXHR.abort("timeout");},s.timeout);}try{state = 1;transport.send(requestHeaders,done);}catch(e) { // Propagate exception as error if not done
if(state < 2){done(-1,e); // Simply rethrow otherwise
}else {throw e;}}} // Callback for when everything is done
function done(status,nativeStatusText,responses,headers){var isSuccess,success,error,response,modified,statusText=nativeStatusText; // Called once
if(state === 2){return;} // State is "done" now
state = 2; // Clear timeout if it exists
if(timeoutTimer){clearTimeout(timeoutTimer);} // Dereference transport for early garbage collection
// (no matter how long the jqXHR object will be used)
transport = undefined; // Cache response headers
responseHeadersString = headers || ""; // Set readyState
jqXHR.readyState = status > 0?4:0; // Determine if successful
isSuccess = status >= 200 && status < 300 || status === 304; // Get response data
if(responses){response = ajaxHandleResponses(s,jqXHR,responses);} // Convert no matter what (that way responseXXX fields are always set)
response = ajaxConvert(s,response,jqXHR,isSuccess); // If successful, handle type chaining
if(isSuccess){ // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
if(s.ifModified){modified = jqXHR.getResponseHeader("Last-Modified");if(modified){jQuery.lastModified[cacheURL] = modified;}modified = jqXHR.getResponseHeader("etag");if(modified){jQuery.etag[cacheURL] = modified;}} // if no content
if(status === 204 || s.type === "HEAD"){statusText = "nocontent"; // if not modified
}else if(status === 304){statusText = "notmodified"; // If we have data, let's convert it
}else {statusText = response.state;success = response.data;error = response.error;isSuccess = !error;}}else { // Extract error from statusText and normalize for non-aborts
error = statusText;if(status || !statusText){statusText = "error";if(status < 0){status = 0;}}} // Set data for the fake xhr object
jqXHR.status = status;jqXHR.statusText = (nativeStatusText || statusText) + ""; // Success/Error
if(isSuccess){deferred.resolveWith(callbackContext,[success,statusText,jqXHR]);}else {deferred.rejectWith(callbackContext,[jqXHR,statusText,error]);} // Status-dependent callbacks
jqXHR.statusCode(_statusCode);_statusCode = undefined;if(fireGlobals){globalEventContext.trigger(isSuccess?"ajaxSuccess":"ajaxError",[jqXHR,s,isSuccess?success:error]);} // Complete
completeDeferred.fireWith(callbackContext,[jqXHR,statusText]);if(fireGlobals){globalEventContext.trigger("ajaxComplete",[jqXHR,s]); // Handle the global AJAX counter
if(! --jQuery.active){jQuery.event.trigger("ajaxStop");}}}return jqXHR;},getJSON:function getJSON(url,data,callback){return jQuery.get(url,data,callback,"json");},getScript:function getScript(url,callback){return jQuery.get(url,undefined,callback,"script");}});jQuery.each(["get","post"],function(i,method){jQuery[method] = function(url,data,callback,type){ // Shift arguments if data argument was omitted
if(jQuery.isFunction(data)){type = type || callback;callback = data;data = undefined;}return jQuery.ajax({url:url,type:method,dataType:type,data:data,success:callback});};});jQuery._evalUrl = function(url){return jQuery.ajax({url:url,type:"GET",dataType:"script",async:false,global:false,"throws":true});};jQuery.fn.extend({wrapAll:function wrapAll(html){var wrap;if(jQuery.isFunction(html)){return this.each(function(i){jQuery(this).wrapAll(html.call(this,i));});}if(this[0]){ // The elements to wrap the target around
wrap = jQuery(html,this[0].ownerDocument).eq(0).clone(true);if(this[0].parentNode){wrap.insertBefore(this[0]);}wrap.map(function(){var elem=this;while(elem.firstElementChild) {elem = elem.firstElementChild;}return elem;}).append(this);}return this;},wrapInner:function wrapInner(html){if(jQuery.isFunction(html)){return this.each(function(i){jQuery(this).wrapInner(html.call(this,i));});}return this.each(function(){var self=jQuery(this),contents=self.contents();if(contents.length){contents.wrapAll(html);}else {self.append(html);}});},wrap:function wrap(html){var isFunction=jQuery.isFunction(html);return this.each(function(i){jQuery(this).wrapAll(isFunction?html.call(this,i):html);});},unwrap:function unwrap(){return this.parent().each(function(){if(!jQuery.nodeName(this,"body")){jQuery(this).replaceWith(this.childNodes);}}).end();}});jQuery.expr.filters.hidden = function(elem){ // Support: Opera <= 12.12
// Opera reports offsetWidths and offsetHeights less than zero on some elements
return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;};jQuery.expr.filters.visible = function(elem){return !jQuery.expr.filters.hidden(elem);};var r20=/%20/g,rbracket=/\[\]$/,rCRLF=/\r?\n/g,rsubmitterTypes=/^(?:submit|button|image|reset|file)$/i,rsubmittable=/^(?:input|select|textarea|keygen)/i;function buildParams(prefix,obj,traditional,add){var name;if(jQuery.isArray(obj)){ // Serialize array item.
jQuery.each(obj,function(i,v){if(traditional || rbracket.test(prefix)){ // Treat each array item as a scalar.
add(prefix,v);}else { // Item is non-scalar (array or object), encode its numeric index.
buildParams(prefix + "[" + (typeof v === "object"?i:"") + "]",v,traditional,add);}});}else if(!traditional && jQuery.type(obj) === "object"){ // Serialize object item.
for(name in obj) {buildParams(prefix + "[" + name + "]",obj[name],traditional,add);}}else { // Serialize scalar item.
add(prefix,obj);}} // Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function(a,traditional){var prefix,s=[],add=function add(key,value){ // If value is a function, invoke it and return its value
value = jQuery.isFunction(value)?value():value == null?"":value;s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);}; // Set traditional to true for jQuery <= 1.3.2 behavior.
if(traditional === undefined){traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;} // If an array was passed in, assume that it is an array of form elements.
if(jQuery.isArray(a) || a.jquery && !jQuery.isPlainObject(a)){ // Serialize the form elements
jQuery.each(a,function(){add(this.name,this.value);});}else { // If traditional, encode the "old" way (the way 1.3.2 or older
// did it), otherwise encode params recursively.
for(prefix in a) {buildParams(prefix,a[prefix],traditional,add);}} // Return the resulting serialization
return s.join("&").replace(r20,"+");};jQuery.fn.extend({serialize:function serialize(){return jQuery.param(this.serializeArray());},serializeArray:function serializeArray(){return this.map(function(){ // Can add propHook for "elements" to filter or add form elements
var elements=jQuery.prop(this,"elements");return elements?jQuery.makeArray(elements):this;}).filter(function(){var type=this.type; // Use .is( ":disabled" ) so that fieldset[disabled] works
return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));}).map(function(i,elem){var val=jQuery(this).val();return val == null?null:jQuery.isArray(val)?jQuery.map(val,function(val){return {name:elem.name,value:val.replace(rCRLF,"\r\n")};}):{name:elem.name,value:val.replace(rCRLF,"\r\n")};}).get();}});jQuery.ajaxSettings.xhr = function(){try{return new XMLHttpRequest();}catch(e) {}};var xhrId=0,xhrCallbacks={},xhrSuccessStatus={ // file protocol always yields status code 0, assume 200
0:200, // Support: IE9
// #1450: sometimes IE returns 1223 when it should be 204
1223:204},xhrSupported=jQuery.ajaxSettings.xhr(); // Support: IE9
// Open requests must be manually aborted on unload (#5280)
// See https://support.microsoft.com/kb/2856746 for more info
if(window.attachEvent){window.attachEvent("onunload",function(){for(var key in xhrCallbacks) {xhrCallbacks[key]();}});}support.cors = !!xhrSupported && "withCredentials" in xhrSupported;support.ajax = xhrSupported = !!xhrSupported;jQuery.ajaxTransport(function(options){var callback; // Cross domain only allowed if supported through XMLHttpRequest
if(support.cors || xhrSupported && !options.crossDomain){return {send:function send(headers,complete){var i,xhr=options.xhr(),id=++xhrId;xhr.open(options.type,options.url,options.async,options.username,options.password); // Apply custom fields if provided
if(options.xhrFields){for(i in options.xhrFields) {xhr[i] = options.xhrFields[i];}} // Override mime type if needed
if(options.mimeType && xhr.overrideMimeType){xhr.overrideMimeType(options.mimeType);} // X-Requested-With header
// For cross-domain requests, seeing as conditions for a preflight are
// akin to a jigsaw puzzle, we simply never set it to be sure.
// (it can always be set on a per-request basis or even using ajaxSetup)
// For same-domain requests, won't change header if already provided.
if(!options.crossDomain && !headers["X-Requested-With"]){headers["X-Requested-With"] = "XMLHttpRequest";} // Set headers
for(i in headers) {xhr.setRequestHeader(i,headers[i]);} // Callback
callback = function(type){return function(){if(callback){delete xhrCallbacks[id];callback = xhr.onload = xhr.onerror = null;if(type === "abort"){xhr.abort();}else if(type === "error"){complete( // file: protocol always yields status 0; see #8605, #14207
xhr.status,xhr.statusText);}else {complete(xhrSuccessStatus[xhr.status] || xhr.status,xhr.statusText, // Support: IE9
// Accessing binary-data responseText throws an exception
// (#11426)
typeof xhr.responseText === "string"?{text:xhr.responseText}:undefined,xhr.getAllResponseHeaders());}}};}; // Listen to events
xhr.onload = callback();xhr.onerror = callback("error"); // Create the abort callback
callback = xhrCallbacks[id] = callback("abort");try{ // Do send the request (this may raise an exception)
xhr.send(options.hasContent && options.data || null);}catch(e) { // #14683: Only rethrow if this hasn't been notified as an error yet
if(callback){throw e;}}},abort:function abort(){if(callback){callback();}}};}}); // Install script dataType
jQuery.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function textScript(text){jQuery.globalEval(text);return text;}}}); // Handle cache's special case and crossDomain
jQuery.ajaxPrefilter("script",function(s){if(s.cache === undefined){s.cache = false;}if(s.crossDomain){s.type = "GET";}}); // Bind script tag hack transport
jQuery.ajaxTransport("script",function(s){ // This transport only deals with cross domain requests
if(s.crossDomain){var script,callback;return {send:function send(_,complete){script = jQuery("<script>").prop({async:true,charset:s.scriptCharset,src:s.url}).on("load error",callback = function(evt){script.remove();callback = null;if(evt){complete(evt.type === "error"?404:200,evt.type);}});document.head.appendChild(script[0]);},abort:function abort(){if(callback){callback();}}};}});var oldCallbacks=[],rjsonp=/(=)\?(?=&|$)|\?\?/; // Default jsonp settings
jQuery.ajaxSetup({jsonp:"callback",jsonpCallback:function jsonpCallback(){var callback=oldCallbacks.pop() || jQuery.expando + "_" + nonce++;this[callback] = true;return callback;}}); // Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter("json jsonp",function(s,originalSettings,jqXHR){var callbackName,overwritten,responseContainer,jsonProp=s.jsonp !== false && (rjsonp.test(s.url)?"url":typeof s.data === "string" && !(s.contentType || "").indexOf("application/x-www-form-urlencoded") && rjsonp.test(s.data) && "data"); // Handle iff the expected data type is "jsonp" or we have a parameter to set
if(jsonProp || s.dataTypes[0] === "jsonp"){ // Get callback name, remembering preexisting value associated with it
callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback)?s.jsonpCallback():s.jsonpCallback; // Insert callback into url or form data
if(jsonProp){s[jsonProp] = s[jsonProp].replace(rjsonp,"$1" + callbackName);}else if(s.jsonp !== false){s.url += (rquery.test(s.url)?"&":"?") + s.jsonp + "=" + callbackName;} // Use data converter to retrieve json after script execution
s.converters["script json"] = function(){if(!responseContainer){jQuery.error(callbackName + " was not called");}return responseContainer[0];}; // force json dataType
s.dataTypes[0] = "json"; // Install callback
overwritten = window[callbackName];window[callbackName] = function(){responseContainer = arguments;}; // Clean-up function (fires after converters)
jqXHR.always(function(){ // Restore preexisting value
window[callbackName] = overwritten; // Save back as free
if(s[callbackName]){ // make sure that re-using the options doesn't screw things around
s.jsonpCallback = originalSettings.jsonpCallback; // save the callback name for future use
oldCallbacks.push(callbackName);} // Call if it was a function and we have a response
if(responseContainer && jQuery.isFunction(overwritten)){overwritten(responseContainer[0]);}responseContainer = overwritten = undefined;}); // Delegate to script
return "script";}}); // data: string of html
// context (optional): If specified, the fragment will be created in this context, defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function(data,context,keepScripts){if(!data || typeof data !== "string"){return null;}if(typeof context === "boolean"){keepScripts = context;context = false;}context = context || document;var parsed=rsingleTag.exec(data),scripts=!keepScripts && []; // Single tag
if(parsed){return [context.createElement(parsed[1])];}parsed = jQuery.buildFragment([data],context,scripts);if(scripts && scripts.length){jQuery(scripts).remove();}return jQuery.merge([],parsed.childNodes);}; // Keep a copy of the old load method
var _load=jQuery.fn.load; /**
 * Load a url into a page
 */jQuery.fn.load = function(url,params,callback){if(typeof url !== "string" && _load){return _load.apply(this,arguments);}var selector,type,response,self=this,off=url.indexOf(" ");if(off >= 0){selector = jQuery.trim(url.slice(off));url = url.slice(0,off);} // If it's a function
if(jQuery.isFunction(params)){ // We assume that it's the callback
callback = params;params = undefined; // Otherwise, build a param string
}else if(params && typeof params === "object"){type = "POST";} // If we have elements to modify, make the request
if(self.length > 0){jQuery.ajax({url:url, // if "type" variable is undefined, then "GET" method will be used
type:type,dataType:"html",data:params}).done(function(responseText){ // Save response for use in complete callback
response = arguments;self.html(selector? // If a selector was specified, locate the right elements in a dummy div
// Exclude scripts to avoid IE 'Permission Denied' errors
jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector): // Otherwise use the full result
responseText);}).complete(callback && function(jqXHR,status){self.each(callback,response || [jqXHR.responseText,status,jqXHR]);});}return this;}; // Attach a bunch of functions for handling common AJAX events
jQuery.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(i,type){jQuery.fn[type] = function(fn){return this.on(type,fn);};});jQuery.expr.filters.animated = function(elem){return jQuery.grep(jQuery.timers,function(fn){return elem === fn.elem;}).length;};var docElem=window.document.documentElement; /**
 * Gets a window from an element
 */function getWindow(elem){return jQuery.isWindow(elem)?elem:elem.nodeType === 9 && elem.defaultView;}jQuery.offset = {setOffset:function setOffset(elem,options,i){var curPosition,curLeft,curCSSTop,curTop,curOffset,curCSSLeft,calculatePosition,position=jQuery.css(elem,"position"),curElem=jQuery(elem),props={}; // Set position first, in-case top/left are set even on static elem
if(position === "static"){elem.style.position = "relative";}curOffset = curElem.offset();curCSSTop = jQuery.css(elem,"top");curCSSLeft = jQuery.css(elem,"left");calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1; // Need to be able to calculate position if either
// top or left is auto and position is either absolute or fixed
if(calculatePosition){curPosition = curElem.position();curTop = curPosition.top;curLeft = curPosition.left;}else {curTop = parseFloat(curCSSTop) || 0;curLeft = parseFloat(curCSSLeft) || 0;}if(jQuery.isFunction(options)){options = options.call(elem,i,curOffset);}if(options.top != null){props.top = options.top - curOffset.top + curTop;}if(options.left != null){props.left = options.left - curOffset.left + curLeft;}if("using" in options){options.using.call(elem,props);}else {curElem.css(props);}}};jQuery.fn.extend({offset:function offset(options){if(arguments.length){return options === undefined?this:this.each(function(i){jQuery.offset.setOffset(this,options,i);});}var docElem,win,elem=this[0],box={top:0,left:0},doc=elem && elem.ownerDocument;if(!doc){return;}docElem = doc.documentElement; // Make sure it's not a disconnected DOM node
if(!jQuery.contains(docElem,elem)){return box;} // Support: BlackBerry 5, iOS 3 (original iPhone)
// If we don't have gBCR, just use 0,0 rather than error
if(typeof elem.getBoundingClientRect !== strundefined){box = elem.getBoundingClientRect();}win = getWindow(doc);return {top:box.top + win.pageYOffset - docElem.clientTop,left:box.left + win.pageXOffset - docElem.clientLeft};},position:function position(){if(!this[0]){return;}var offsetParent,offset,elem=this[0],parentOffset={top:0,left:0}; // Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is its only offset parent
if(jQuery.css(elem,"position") === "fixed"){ // Assume getBoundingClientRect is there when computed position is fixed
offset = elem.getBoundingClientRect();}else { // Get *real* offsetParent
offsetParent = this.offsetParent(); // Get correct offsets
offset = this.offset();if(!jQuery.nodeName(offsetParent[0],"html")){parentOffset = offsetParent.offset();} // Add offsetParent borders
parentOffset.top += jQuery.css(offsetParent[0],"borderTopWidth",true);parentOffset.left += jQuery.css(offsetParent[0],"borderLeftWidth",true);} // Subtract parent offsets and element margins
return {top:offset.top - parentOffset.top - jQuery.css(elem,"marginTop",true),left:offset.left - parentOffset.left - jQuery.css(elem,"marginLeft",true)};},offsetParent:function offsetParent(){return this.map(function(){var offsetParent=this.offsetParent || docElem;while(offsetParent && (!jQuery.nodeName(offsetParent,"html") && jQuery.css(offsetParent,"position") === "static")) {offsetParent = offsetParent.offsetParent;}return offsetParent || docElem;});}}); // Create scrollLeft and scrollTop methods
jQuery.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(method,prop){var top="pageYOffset" === prop;jQuery.fn[method] = function(val){return access(this,function(elem,method,val){var win=getWindow(elem);if(val === undefined){return win?win[prop]:elem[method];}if(win){win.scrollTo(!top?val:window.pageXOffset,top?val:window.pageYOffset);}else {elem[method] = val;}},method,val,arguments.length,null);};}); // Support: Safari<7+, Chrome<37+
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// Blink bug: https://code.google.com/p/chromium/issues/detail?id=229280
// getComputedStyle returns percent when specified for top/left/bottom/right;
// rather than make the css module depend on the offset module, just check for it here
jQuery.each(["top","left"],function(i,prop){jQuery.cssHooks[prop] = addGetHookIf(support.pixelPosition,function(elem,computed){if(computed){computed = curCSS(elem,prop); // If curCSS returns percentage, fallback to offset
return rnumnonpx.test(computed)?jQuery(elem).position()[prop] + "px":computed;}});}); // Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each({Height:"height",Width:"width"},function(name,type){jQuery.each({padding:"inner" + name,content:type,"":"outer" + name},function(defaultExtra,funcName){ // Margin is only for outerHeight, outerWidth
jQuery.fn[funcName] = function(margin,value){var chainable=arguments.length && (defaultExtra || typeof margin !== "boolean"),extra=defaultExtra || (margin === true || value === true?"margin":"border");return access(this,function(elem,type,value){var doc;if(jQuery.isWindow(elem)){ // As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
// isn't a whole lot we can do. See pull request at this URL for discussion:
// https://github.com/jquery/jquery/pull/764
return elem.document.documentElement["client" + name];} // Get document width or height
if(elem.nodeType === 9){doc = elem.documentElement; // Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
// whichever is greatest
return Math.max(elem.body["scroll" + name],doc["scroll" + name],elem.body["offset" + name],doc["offset" + name],doc["client" + name]);}return value === undefined? // Get width or height on the element, requesting but not forcing parseFloat
jQuery.css(elem,type,extra): // Set width or height on the element
jQuery.style(elem,type,value,extra);},type,chainable?margin:undefined,chainable,null);};});}); // The number of elements contained in the matched element set
jQuery.fn.size = function(){return this.length;};jQuery.fn.andSelf = jQuery.fn.addBack; // Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.
// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon
if(typeof define === "function" && define.amd){define("jquery",[],function(){return jQuery;});}var  // Map over jQuery in case of overwrite
_jQuery=window.jQuery, // Map over the $ in case of overwrite
_$=window.$;jQuery.noConflict = function(deep){if(window.$ === jQuery){window.$ = _$;}if(deep && window.jQuery === jQuery){window.jQuery = _jQuery;}return jQuery;}; // Expose jQuery and $ identifiers, even in AMD
// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if(typeof noGlobal === strundefined){window.jQuery = window.$ = jQuery;}return jQuery;}); // Otherwise append directly

},{}],42:[function(require,module,exports){
/*
 * jQuery Dropdown: A simple dropdown plugin
 *
 * Contribute: https://github.com/claviska/jquery-dropdown
 *
 * @license: MIT license: http://opensource.org/licenses/MIT
 *
 */
'use strict';

if (jQuery) (function ($) {

    $.extend($.fn, {
        jqDropdown: function jqDropdown(method, data) {

            switch (method) {
                case 'show':
                    show(null, $(this));
                    return $(this);
                case 'hide':
                    hide();
                    return $(this);
                case 'attach':
                    return $(this).attr('data-jq-dropdown', data);
                case 'detach':
                    hide();
                    return $(this).removeAttr('data-jq-dropdown');
                case 'disable':
                    return $(this).addClass('jq-dropdown-disabled');
                case 'enable':
                    hide();
                    return $(this).removeClass('jq-dropdown-disabled');
            }
        }
    });

    function show(event, object) {

        var trigger = event ? $(this) : object,
            jqDropdown = $(trigger.attr('data-jq-dropdown')),
            isOpen = trigger.hasClass('jq-dropdown-open');

        // In some cases we don't want to show it
        if (event) {
            if ($(event.target).hasClass('jq-dropdown-ignore')) return;

            event.preventDefault();
            event.stopPropagation();
        } else {
            if (trigger !== object.target && $(object.target).hasClass('jq-dropdown-ignore')) return;
        }
        hide();

        if (isOpen || trigger.hasClass('jq-dropdown-disabled')) return;

        // Show it
        trigger.addClass('jq-dropdown-open');
        jqDropdown.data('jq-dropdown-trigger', trigger).show();

        // Position it
        position();

        // Trigger the show callback
        jqDropdown.trigger('show', {
            jqDropdown: jqDropdown,
            trigger: trigger
        });
    }

    function hide(event) {

        // In some cases we don't hide them
        var targetGroup = event ? $(event.target).parents().addBack() : null;

        // Are we clicking anywhere in a jq-dropdown?
        if (targetGroup && targetGroup.is('.jq-dropdown')) {
            // Is it a jq-dropdown menu?
            if (targetGroup.is('.jq-dropdown-menu')) {
                // Did we click on an option? If so close it.
                if (!targetGroup.is('A')) return;
            } else {
                // Nope, it's a panel. Leave it open.
                return;
            }
        }

        // Hide any jq-dropdown that may be showing
        $(document).find('.jq-dropdown:visible').each(function () {
            var jqDropdown = $(this);
            jqDropdown.hide().removeData('jq-dropdown-trigger').trigger('hide', { jqDropdown: jqDropdown });
        });

        // Remove all jq-dropdown-open classes
        $(document).find('.jq-dropdown-open').removeClass('jq-dropdown-open');
    }

    function position() {

        var jqDropdown = $('.jq-dropdown:visible').eq(0),
            trigger = jqDropdown.data('jq-dropdown-trigger'),
            hOffset = trigger ? parseInt(trigger.attr('data-horizontal-offset') || 0, 10) : null,
            vOffset = trigger ? parseInt(trigger.attr('data-vertical-offset') || 0, 10) : null;

        if (jqDropdown.length === 0 || !trigger) return;

        // Position the jq-dropdown relative-to-parent...
        if (jqDropdown.hasClass('jq-dropdown-relative')) {
            jqDropdown.css({
                left: jqDropdown.hasClass('jq-dropdown-anchor-right') ? trigger.position().left - (jqDropdown.outerWidth(true) - trigger.outerWidth(true)) - parseInt(trigger.css('margin-right'), 10) + hOffset : trigger.position().left + parseInt(trigger.css('margin-left'), 10) + hOffset,
                top: trigger.position().top + trigger.outerHeight(true) - parseInt(trigger.css('margin-top'), 10) + vOffset
            });
        } else {
            // ...or relative to document
            jqDropdown.css({
                left: jqDropdown.hasClass('jq-dropdown-anchor-right') ? trigger.offset().left - (jqDropdown.outerWidth() - trigger.outerWidth()) + hOffset : trigger.offset().left + hOffset,
                top: trigger.offset().top + trigger.outerHeight() + vOffset
            });
        }
    }

    $(document).on('click.jq-dropdown', '[data-jq-dropdown]', show);
    $(document).on('click.jq-dropdown', hide);
    $(window).on('resize', position);
})(jQuery);

},{}],43:[function(require,module,exports){
/*jslint browser: true */

'use strict';

var $ = require('./lib/jquery-2.1.3');
// necessary so that jquery plugins work
window.jQuery = $;
require('./lib/jquery.dropdown');

var Whorl = require('./app/whorl');

$(Whorl.create);

},{"./app/whorl":31,"./lib/jquery-2.1.3":41,"./lib/jquery.dropdown":42}]},{},[43]);
