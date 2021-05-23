{
    //Passing Rate: 100% 
	init: function(elevators, floors) {
        var elevator = elevators[0]; // Let's use the first elevator


        // Whenever the elevator is idle, 
        //let it wait at the 1th floor (in the middle of the building) 
        //to reduce the waiting time
        elevator.on("idle", function() {
            elevator.goToFloor(1);
        });

        //The elevator goes to the floors where the up or down buttons have been pressed on
        //And takes the passengers to the floors where they want to go to
        floors[0].on("up_button_pressed", function(){
            elevator.goToFloor(0);
        });


        floors[1].on("up_button_pressed down_button_pressed", function(){
            elevator.goToFloor(1);
        });


        floors[2].on("down_button_pressed", function(){
            elevator.goToFloor(2);

        });
        
        elevator.on("floor_button_pressed", function(floorNum){
            elevator.goToFloor(floorNum);
        });

    },
        update: function(dt, elevators, floors) {
            // We normally don't need to do anything here
        }
}