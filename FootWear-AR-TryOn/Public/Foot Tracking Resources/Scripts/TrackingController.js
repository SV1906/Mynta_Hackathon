// TrackingController.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: Tracking controller for foot bindings

// @input Component.Script footBindingL
// @input Component.Script footBindingR
// @input bool advanced = false

// @ui {"widget":"group_start", "label":"Settings", "showIf" : "advanced"}
// @input Component.MLComponent mlComponent
// @input Asset.Texture deviceTexture
// @input Asset.Texture inputTexture
// @input Component.Camera camera
// @ui {"widget":"group_end"}

var footBindingController = [script.footBindingL, script.footBindingR];

var modelConfig = {
    textureSize : new vec2(160, 128),
    kFootPresenceThresholdHide : 0.22,
    kNNLeftPointClassZeroOffset : 0,
    kNNLeftPointClassOneOffset : 7,
    kNNLeftPointClassTwoOffset : 14,
    kNNRightPointClassZeroOffset : 21,
    kNNRightPointClassOneOffset : 28,
    kNNRightPointClassTwoOffset : 35,
    kNNRightFootPresenceOffset : 42,
    kNNLeftFootPresenceOffset  : 43,
    kOverlayThreshold : 0.8,
    kOverlayGreaterThreshold : 1.1,
    kVisiblePointsThreshold : 6,

    kInputName : "input0",
    kOutputPointsName : "output0_h",
    kOutputVisibilityName : "output1",
    kOutputLeftRightSegmName : "output0_lrm",

    keypoints : [
        0.6187104, 0.3006418, 0.13941154, 
        0.20493811, 0.40707093, 0.10769378, 
        1.0, 0.12610662, 0.0737446, 
        0.88392174, 0.26190335, 0.26768607, 
        0.34073484, 0.5272435, 0.10769378, 
        0.37468404, 0.22795418, 0.24869087, 
        0.88392174, 0.19400501, 0.01278348
    ]
};

const SIZE = modelConfig.keypoints.length / 3;
const SIZE2 = SIZE * 2;
const KERNEL_SIZE = 5;
const WIN_SIZE_OPT_FLOW = new vec2(50.0, 50.0);
const MAX_LEVEL_OPT_FLOW = 4;
const MAX_COUNT_OPT_FLOW = 10;
const EPS_OPT_FLOW = 0.03;

const TYPE = {
    LEFT: 0,
    RIGHT: 1
};

var allPointsShape = new vec3(2, SIZE2, 1);

var modelCenter = global.MathLib.getCenter(modelConfig.keypoints);
var centerPoints = global.MathLib.centerModel(modelConfig.keypoints, modelCenter);

var isFirstFrame = true;

var camera = null;
var modelToCamTexMult = null;

var opticalFlow = null;
var prevTexOptFlowSize = null;

var smoothStep = new global.SmoothStep();
smoothStep.resize(SIZE);

var solver = [null, null];

var mlComponent = null;
var pointsTensor = null;
var pointsTensorShape = null;
var visibilityTensor = null;
var outTensor = null;
var outTensorLeft = null;
var outTensorRight = null;
var prevOutTensor = null;
var newOutTensor = null;
var maxProbabilities = null;

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(onUpdate);
updateEvent.enabled = false;

function initCamera() {
    global.Camera = function(camera) {
        this.camera = camera;
        this.cameraSize = null;
        this.intrinsics = null;
    };
    
    Camera.prototype = {
        update: function() {
            this.cameraSize = new global.MathLib.vec2(this.camera.renderTarget.getHeight(), this.camera.renderTarget.getWidth());
            this.intrinsics = global.MathLib.makeIntrinsicsMatrix(this.cameraSize, this.camera.fov);
        },
        calcCameraSize: function() {
            return new global.MathLib.vec2(this.camera.renderTarget.getHeight(), this.camera.renderTarget.getWidth());
        }
    };
    
    camera = new global.Camera(script.camera);
    camera.update();

    modelToCamTexMult = new Float32Array(2);
    modelToCamTexMult[TYPE.LEFT] = camera.cameraSize.x / modelConfig.textureSize.x;
    modelToCamTexMult[TYPE.RIGHT] = camera.cameraSize.y / modelConfig.textureSize.y;

    script.createEvent("CameraFrontEvent").bind(onCameraChanged);
    script.createEvent("CameraBackEvent").bind(onCameraChanged);
}

function initOpticalFlow() {
    opticalFlow = new global.OpticalFlow();
    opticalFlow.winSize = WIN_SIZE_OPT_FLOW; 
    opticalFlow.maxLevel = MAX_LEVEL_OPT_FLOW; 
    opticalFlow.maxCount = MAX_COUNT_OPT_FLOW; 
    opticalFlow.epsilon = EPS_OPT_FLOW;
    prevTexOptFlowSize = new global.MathLib.vec2(script.deviceTexture.getWidth(), script.deviceTexture.getHeight());
}

function createSolver(type, footBinding) {
    if (footBinding && footBinding.api.createBinding) {
        solver[type] = new global.Solver();
        solver[type].binding = footBinding.api.createBinding(centerPoints);
        solver[type].transform = new Float32Array(6);
        solver[type].resize(SIZE);
        solver[type].opticalFlow = opticalFlow;
        solver[type].smoothStep = smoothStep;
        solver[type].modelToCamTexMult = modelToCamTexMult;
        solver[type].camera = camera;
        solver[type].invalidateFoot();   
    } 
}

function initMLComponent() {
    mlComponent = script.mlComponent;
    mlComponent.onLoadingFinished = onLoaded;
    mlComponent.inferenceMode = MachineLearning.InferenceMode.GPU;
    mlComponent.build([]);
}

function onLoaded() {
    mlComponent.runScheduled(true, MachineLearning.FrameTiming.Update, MachineLearning.FrameTiming.Update);

    var data = mlComponent.getInput("input0");
    data.texture = script.inputTexture;
   
    pointsTensor = mlComponent.getOutput("output0_h").data;
    pointsTensorShape = new vec3(modelConfig.textureSize.x, modelConfig.textureSize.y, SIZE2);
   
    visibilityTensor = mlComponent.getOutput("output1").data;

    outTensor = new Float32Array(SIZE2 * 2);
    outTensorLeft = new Float32Array(SIZE2);
    outTensorRight = new Float32Array(SIZE2);
    
    prevOutTensor = new Float32Array(SIZE2 * 2);
    newOutTensor = new Float32Array(SIZE2 * 2);

    maxProbabilities = new Float32Array(SIZE2);

    updateEvent.enabled = true;
}

function calcVisiblePoints(mask, it0, it1, it2) {
    var res = 0;
    for (var i = 0; i < SIZE; ++i) {
        if (visibilityTensor[it0 + i] < visibilityTensor[it1 + i] || 
            visibilityTensor[it0 + i] < visibilityTensor[it2 + i]) {
            mask[i] = 1;
            ++res;
        } else {
            mask[i] = 0;
        }  
    }

    return res;
}

function processVisibility(type) {
    if (!solver[type]) {
        return;
    }

    var kNNFootPresenceOffset = [modelConfig.kNNLeftFootPresenceOffset, modelConfig.kNNRightFootPresenceOffset];
    var kNNPointClassZeroOffset = [modelConfig.kNNLeftPointClassZeroOffset, modelConfig.kNNRightPointClassZeroOffset];
    var kNNPointClassOneOffset = [modelConfig.kNNLeftPointClassOneOffset, modelConfig.kNNRightPointClassOneOffset];
    var kNNPointClassTwoOffset = [modelConfig.kNNLeftPointClassTwoOffset, modelConfig.kNNRightPointClassTwoOffset];

    solver[type].isFootVisible = global.MathLib.sigmoid(visibilityTensor[kNNFootPresenceOffset[type]]) > modelConfig.kFootPresenceThresholdHide;

    if (solver[type].isFootVisible) {
        solver[type].visiblePointsNum = 
            calcVisiblePoints(solver[type].visibilityMask,
                kNNPointClassZeroOffset[type], 
                kNNPointClassOneOffset[type],
                kNNPointClassTwoOffset[type]);
        solver[type].isFootVisible = solver[type].visiblePointsNum >= modelConfig.kVisiblePointsThreshold;
    } else {
        solver[type].visiblePointsNum = 0;
    }

    solver[type].updateVisibility();
}

function processOutputData() {
    processVisibility(0);
    processVisibility(1); 

    TensorMath.subpixelArgMax(pointsTensor, pointsTensorShape, outTensor, KERNEL_SIZE);
}

function onCameraChanged() {
    var curCameraSize = camera.calcCameraSize();
    if (camera.cameraSize.x == curCameraSize.x && camera.cameraSize.y == curCameraSize.y) {
        if (camera.cameraFov != camera.camera.fov) {
            camera.update();
        }
        return;
    }

    camera.update();

    modelToCamTexMult[TYPE.LEFT] = camera.cameraSize.x / modelConfig.textureSize.x;
    modelToCamTexMult[TYPE.RIGHT] = camera.cameraSize.y / modelConfig.textureSize.y;

    if (solver[TYPE.LEFT]) {
        solver[TYPE.LEFT].modelToCamTexMult = modelToCamTexMult;
    }
    
    if (solver[TYPE.RIGHT]) {
        solver[TYPE.RIGHT].modelToCamTexMult = modelToCamTexMult;
    }

    if (opticalFlow != null && opticalFlow.textureSize != null) {
        opticalFlow.setTexture(script.deviceTexture);
        opticalFlow.optFlowToCamTexMult[TYPE.LEFT] = camera.cameraSize.x / opticalFlow.textureSize.x;
        opticalFlow.optFlowToCamTexMult[TYPE.RIGHT] = camera.cameraSize.y / opticalFlow.textureSize.y;
    }
}

function onUpdate() {
    processOutputData();

    if ((solver[TYPE.LEFT] && !solver[TYPE.LEFT].isFootVisible) && 
        (solver[TYPE.RIGHT] && !solver[TYPE.RIGHT].isFootVisible)) {
        return;
    }
    
    onCameraChanged();

    if (isFirstFrame) {
        opticalFlow.setTexture(script.deviceTexture);
        opticalFlow.modelToOptFlowTexMult[TYPE.LEFT] = opticalFlow.textureSize.x / modelConfig.textureSize.x;
        opticalFlow.modelToOptFlowTexMult[TYPE.RIGHT] = opticalFlow.textureSize.y / modelConfig.textureSize.y;

        opticalFlow.optFlowToCamTexMult[TYPE.LEFT] = camera.cameraSize.x / opticalFlow.textureSize.x;
        opticalFlow.optFlowToCamTexMult[TYPE.RIGHT] = camera.cameraSize.y / opticalFlow.textureSize.y;
    
        isFirstFrame = false;
    }

    var curTexOptFlowSize = new global.MathLib.vec2(script.deviceTexture.getWidth(), script.deviceTexture.getHeight());
    if (curTexOptFlowSize.x != prevTexOptFlowSize.x || curTexOptFlowSize.y != prevTexOptFlowSize.y) {
        opticalFlow.setTexture(script.deviceTexture);
        opticalFlow.optFlowToCamTexMult[TYPE.LEFT] = camera.cameraSize.x / opticalFlow.textureSize.x;
        opticalFlow.optFlowToCamTexMult[TYPE.RIGHT] = camera.cameraSize.y / opticalFlow.textureSize.y;
    }
    opticalFlow.preprocess();
    prevTexOptFlowSize = curTexOptFlowSize;

    TensorMath.mulTensors(
        outTensor,
        allPointsShape,
        opticalFlow.modelToOptFlowTexMult,
        global.MathLib.points2dShape,
        outTensor
    );

    for (var i = 0; i < SIZE2; ++i) {
        var x = outTensor[i * 2];
        outTensor[i * 2] = opticalFlow.textureSize.y - outTensor[i * 2 + 1];
        outTensor[i * 2 + 1] = opticalFlow.textureSize.x - x;
    }

    newOutTensor.set(outTensor, 0);
    
    if (solver[TYPE.LEFT]) {
        prevOutTensor.set(solver[TYPE.LEFT].prevOutTensor, 0);
    }

    if (solver[TYPE.RIGHT]) {
        prevOutTensor.set(solver[TYPE.RIGHT].prevOutTensor, SIZE2);
    }

    opticalFlow.apply(
        prevOutTensor, 
        newOutTensor, 
        allPointsShape
    );

    for (var j = 0; j < SIZE; ++j) {
        if (solver[TYPE.LEFT]) {
            if (solver[TYPE.LEFT].prevVisibilityMask[j] == 0) {
                solver[TYPE.LEFT].newOutTensor[j * 2] = outTensor[j * 2];
                solver[TYPE.LEFT].newOutTensor[j * 2 + 1] = outTensor[j * 2 + 1];
            } else {
                solver[TYPE.LEFT].newOutTensor[j * 2] = newOutTensor[j * 2];
                solver[TYPE.LEFT].newOutTensor[j * 2 + 1] = newOutTensor[j * 2 + 1];
            }
        }

        if (solver[TYPE.RIGHT]) {
            if (solver[TYPE.RIGHT].prevVisibilityMask[j] == 0) {
                solver[TYPE.RIGHT].newOutTensor[j * 2] = outTensor[SIZE2 + j * 2];
                solver[TYPE.RIGHT].newOutTensor[j * 2 + 1] = outTensor[SIZE2 + j * 2 + 1];
            } else {
                solver[TYPE.RIGHT].newOutTensor[j * 2] = newOutTensor[SIZE2 + j * 2];
                solver[TYPE.RIGHT].newOutTensor[j * 2 + 1] = newOutTensor[SIZE2 + j * 2 + 1];
            }
        }
    }
    
    if (solver[TYPE.LEFT] && solver[TYPE.LEFT].isFootVisible) {
        for (var k = 0; k < SIZE2; ++k) {
            outTensorLeft[k] = outTensor[k];
        }
    }

    if (solver[TYPE.RIGHT] && solver[TYPE.RIGHT].isFootVisible) {
        for (var l = 0; l < SIZE2; ++l) {
            outTensorRight[l] = outTensor[l + SIZE2];
        }
    }

    if (solver[TYPE.LEFT] && solver[TYPE.LEFT].isFootVisible && solver[TYPE.RIGHT] && solver[TYPE.RIGHT].isFootVisible) {
        var b1 = global.MathLib.makeBoundingBox(outTensorLeft, solver[TYPE.LEFT].visibilityMask);
        var b2 = global.MathLib.makeBoundingBox(outTensorRight, solver[TYPE.RIGHT].visibilityMask);

        if (global.MathLib.isBoxIntersection(b1, b2)) {
            var intersection = global.MathLib.getBoxIntersection(b1, b2);
            var b1Area = global.MathLib.getBoxArea(b1);
            var b2Area = global.MathLib.getBoxArea(b2);
            var intersectionArea = global.MathLib.getBoxArea(intersection);
            if (intersectionArea / b1Area > modelConfig.kOverlayThreshold ||
                intersectionArea / b2Area > modelConfig.kOverlayThreshold) {
                if (b1Area > modelConfig.kOverlayGreaterThreshold * b2Area) {
                    solver[TYPE.RIGHT].invalidateFoot();
                } else if (b2Area > modelConfig.kOverlayGreaterThreshold * b1Area) {
                    solver[TYPE.LEFT].invalidateFoot();
                } else {
                    TensorMath.max(pointsTensor, pointsTensorShape, maxProbabilities);
                    var leftProb = 1.0;
                    for (var m = 0; m < SIZE; ++m) {
                        leftProb *= maxProbabilities[m];
                    }
                    var rightProb = 1.0;
                    for (var n = SIZE; n < 2 * SIZE; ++n) {
                        rightProb *= maxProbabilities[n];
                    }
                        
                    if (leftProb < rightProb) {
                        solver[TYPE.LEFT].invalidateFoot();
                    } else {
                        solver[TYPE.RIGHT].invalidateFoot();
                    }
                }
            }
        }
    }

    if (solver[TYPE.LEFT] && solver[TYPE.LEFT].isFootVisible) {
        solver[TYPE.LEFT].apply(outTensorLeft);
    }

    if (solver[TYPE.RIGHT] && solver[TYPE.RIGHT].isFootVisible) {
        solver[TYPE.RIGHT].apply(outTensorRight);
    }

    opticalFlow.postprocess();
}

function init() {
    initCamera();
    initOpticalFlow();

    if (footBindingController[TYPE.LEFT]) {
        createSolver(TYPE.LEFT, footBindingController[TYPE.LEFT]);
    }

    if (footBindingController[TYPE.RIGHT]) {
        createSolver(TYPE.RIGHT, footBindingController[TYPE.RIGHT]);   
    }

    initMLComponent();
}

init();