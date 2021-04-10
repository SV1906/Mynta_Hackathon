const inObjectPointsPosMult = new global.MathLib.vec3(-1.0, 1.0, -1.0);
var verifySolvePnP = true;
var projLossThreshold = 0.05;

global.Solver = function() {
    this.binding = null;
    this.transform = null;
    this.size = 0; //don't sure if we want this, rename anyway

    this.opticalFlow = null;
    this.prevOutTensor = null;
    this.newOutTensor = null;
    this.smoothStep = null;

    this.pointsShape = null;
    this.modelToCamTexMult = null;

    this.isFootVisible = false;
    this.visibilityMask = null;
    this.visiblePointsNum = 0;
    this.prevVisibilityMask = null;
    this.visibleOutTensor = null;
    this.visibleInObjectPoints = null;

    this.camera = null;
};

global.Solver.prototype = {
    resize: function(size) {
        this.size = size;
        this.prevOutTensor = new Float32Array(size * 2);
        this.newOutTensor = new Float32Array(size * 2);
        this.pointsShape = new vec3(2, size, 1);
        this.visibilityMask = new Uint8Array(size);
        this.prevVisibilityMask = new Uint8Array(size);
        this.visibleOutTensor = new Float32Array(size * 2);
        this.visibleInObjectPoints = new Float32Array(size * 3);
    },

    apply: function(outTensor) {
        if (this.opticalFlow != null) {
            this.applyOpticalFlow(outTensor);
        } else {
            TensorMath.mulTensors(
                outTensor,
                this.pointsShape,
                this.modelToCamTexMult,
                global.MathLib.points2dShape,
                outTensor
            );
        }

        this.applySolvePnP(outTensor);

        if (!this.isFootVisible || 
            !global.MathLib.isValidRotation(
                this.transform[0], 
                this.transform[1], 
                this.transform[2])) {
            this.invalidateFoot();
        } else {
            this.binding.setTransform(this.transform);
        }

        this.prevVisibilityMask.set(this.visibilityMask, 0);
    },

    applySolvePnP: function(outTensor) {
        var it = 0;
        for (var i = 0; i < this.size; ++i) {
            if (this.visibilityMask[i] == 1) {
                this.visibleOutTensor[it * 2] = outTensor[i * 2];
                this.visibleOutTensor[it * 2 + 1] = outTensor[i * 2 + 1];

                this.visibleInObjectPoints[it * 3] = this.binding.inObjectPoints[i * 3];
                this.visibleInObjectPoints[it * 3 + 1] = this.binding.inObjectPoints[i * 3 + 1];
                this.visibleInObjectPoints[it * 3 + 2] = this.binding.inObjectPoints[i * 3 + 2];

                ++it;
            }
        }

        this.isFootVisible = TensorMath.solvePnP(
            this.visibleInObjectPoints, 
            this.visibleOutTensor, 
            new vec3(2, this.visiblePointsNum, 1),
            this.camera.intrinsics,
            0, 
            this.transform
        );

        if (verifySolvePnP) {
            var maxDist = 0.0;
            for (var j = 0; j < this.visiblePointsNum; ++j) {
                var p = new global.MathLib.vec3(this.visibleInObjectPoints[j * 3], this.visibleInObjectPoints[j * 3 + 1], this.visibleInObjectPoints[j * 3 + 2]);
                p = global.MathLib.rotatePoint(p, this.transform);
                p = p.add(new global.MathLib.vec3(this.transform[4], -this.transform[3], this.transform[5]));
                p = p.mult(inObjectPointsPosMult);

                var pos1 = this.camera.camera.worldSpaceToScreenSpace(global.MathLib.vec3.toEngine(p));
                var pos2 = new global.MathLib.vec2(1.0 - this.visibleOutTensor[j * 2 + 1] / this.camera.cameraSize.y, this.visibleOutTensor[j * 2] / this.camera.cameraSize.x);
                maxDist = Math.max(maxDist, pos2.distance(pos1));
            }
            if (maxDist > projLossThreshold) {
                this.isFootVisible = false;
            }
        }
    },

    applyOpticalFlow: function(outTensor) {
        this.smoothStep.apply(
            this.prevOutTensor, 
            outTensor, 
            this.newOutTensor
        );

        this.prevOutTensor.set(outTensor, 0);

        for (var i = 0; i < this.size; ++i) {
            var x = outTensor[i * 2];
            outTensor[i * 2] = this.opticalFlow.textureSize.x - outTensor[i * 2 + 1];
            outTensor[i * 2 + 1] = this.opticalFlow.textureSize.y - x;
        }

        TensorMath.mulTensors(
            outTensor,
            this.pointsShape,
            this.opticalFlow.optFlowToCamTexMult,
            global.MathLib.points2dShape,
            outTensor
        );
    },

    updateVisibility: function() {
        if (!this.isFootVisible) {
            this.invalidateFoot();
        } else {
            this.binding.setEnabled(true);
        }
    },

    invalidateFoot: function() {
        this.isFootVisible = false;
        this.binding.setEnabled(false);
        for (var i = 0; i < 6; ++i) {
            this.transform[i] = 0;
        }
    }
};