/**
* Additional Information:
*
* This template allows you to track objects to the user's foot.
* 
* To attach an object to the user's foot, set the object as a child of 
* `Left Foot Binding` and `Right Foot Binding`. This template comes with 
* an example shoe model that is tracked to the user's foot under these objects. 
* The Foot binding is set up to track center of user's foot
* 
* In addition to the shoe model, there is also an occluder model. 
* This occluder model is used to occlude parts of your shoe that would be covered 
* by the ankle. Apply the `Occluder Left` and `Occluder Right` material on the model 
* that you want to use as an occluder. 
* 
* This template also comes with several interactivity example. 
* 
* The `Change Shoe Material on Foot Tap` object shows a behavior script where 
* the distance between the two shoes are checked. If they are closeby (e.g. 
* the foot taps each other), it triggers a callback in the `ShoeMaterials` script, 
* which changes the material on the shoes.
* 
* The `Right-Foot-Animation` and `Left-Foot-Animation` object, holds the screen 
* image stickers that are activated when the user's foot hovers over it. Take a look at the 
* `Trigger Animation on Foot Hover` object, which demonstrates how you can call a Behavior 
* trigger where a `Foot Binding` is over the `Target` Screen Image. 
* 
* Happy creating!
**/