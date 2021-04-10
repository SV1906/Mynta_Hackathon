// @input Component.ScriptComponent footBindingLeft
// @input Component.ScriptComponent footBindingRight
// @input SceneObject hintObject


var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(onUpdate);


function onUpdate() {
    var leftVisible = false;
    var rightVisible = false;
    
    if (script.footBindingLeft && script.footBindingLeft.api.getBinding() && script.footBindingLeft.api.getBinding().isVisible) {
        leftVisible = true;
    }
    
    
    if (script.footBindingRight && script.footBindingRight.api.getBinding() && script.footBindingRight.api.getBinding().isVisible) {
        rightVisible = true;    
    }
    
    if (leftVisible) {
        global.behaviorSystem.sendCustomTrigger("LEFT_FOOT_FOUND");
        global.tweenManager.startTween(script.hintObject, "hide_hint");
    }
    
    if (rightVisible) {
        global.behaviorSystem.sendCustomTrigger("RIGHT_FOOT_FOUND");
        global.tweenManager.startTween(script.hintObject, "hide_hint");
    }
    
    if (leftVisible && rightVisible) {
        updateEvent.enabled = false;
    }
}