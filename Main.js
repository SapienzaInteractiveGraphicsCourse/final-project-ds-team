window.onload = main;

var renderer;
var camera;
var scene;
var models = {};

var scene_elements = [];
var scene_bricks = [];
var scene_inner_cube = [];
var scene_leaves = [];
var scene_trunk = [];

var scene_base;
var scene_side_walls;

var jump_type = 0;

//character related stuff
var scene_character;
var scene_character_lane = 0;
var scene_character_parts = {};
var scene_character_parts_keys = ["Bone_left_forearm",
								  "Bone_left_shoulder",
								  "Bone_right_forearm",
								  "Bone_right_shoulder",
								  "Bone_left_upper_leg",
								  "Bone_left_lower_leg",
								  "Bone_right_upper_leg",
								  "Bone_right_lower_leg",
								  "Bone_belly"];


var runAnimationBuffer = {};
var resetRunAnimationBuffer = {};

//collision related stuff
var raycasters = [];
var collision_detected;
var raycaster_arrows = [];
var raycaster_pos_update = new THREE.Vector3();

var side_walls;
var side_walls_positions = [-4.5, 0, 4.5];
var scene_character_jumping_sliding = false;

var models_url = ['http://localhost:8000/character.gltf',
				  'http://localhost:8000/wall.gltf',
				  'http://localhost:8000/high wall.gltf',
				  'http://localhost:8000/hurdle.gltf',
				  'http://localhost:8000/athletics.gltf',
				  'http://localhost:8000/tree.gltf',
				  'http://localhost:8000/arc.gltf'];

var idx_to_key = ["high wall", "hurdle", "arc"];

var clock = 0;

const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;
const screenRatio = window.devicePixelRatio;

function main()
{
	//setting up renderer
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.setSize(screenWidth, screenHeight);
	renderer.setPixelRatio(screenRatio);
	document.body.appendChild(renderer.domElement);
	
	scene = new THREE.Scene();
	
	//setting up camera
	camera = new THREE.PerspectiveCamera(75, screenWidth/screenHeight, 1, 70);
	camera.position.set(0,6,7);
	camera.rotation.x -= 0.3;
	
	//setting up light
	const point_light_1 = new THREE.PointLight(0xFFFFFF, 0.8, 100);
	point_light_1.position.set(0, 10, 5);
	scene.add(point_light_1);
	
	const point_light_2 = new THREE.AmbientLight(0xFFFFFF, 0.15);
	scene.add(point_light_2);
	
	//setting up scene
	scene.background = new THREE.Color(0xB2FFFF);
	
	loadModels();
}

function loadModels()
{
	const gltfLoader = new THREE.GLTFLoader();
	
	var p0 = loadModel(gltfLoader, models_url[0]).then(result => {models["character"] = result.scene;});
	var p1 = loadModel(gltfLoader, models_url[1]).then(result => {models["wall"] = result.scene;});
	var p2 = loadModel(gltfLoader, models_url[2]).then(result => {models["high wall"] = result.scene;});
	var p3 = loadModel(gltfLoader, models_url[3]).then(result => {models["hurdle"] = result.scene;});
	var p4 = loadModel(gltfLoader, models_url[4]).then(result => {models["athletics"] = result.scene;});
	var p5 = loadModel(gltfLoader, models_url[5]).then(result => {models["tree"] = result.scene;});
	var p6 = loadModel(gltfLoader, models_url[6]).then(result => {models["arc"] = result.scene;});
	
	Promise.all([p0, p1, p2, p3, p4, p5, p6]).then(() => {
		
		init_environment();
		addCharacter();
		
		initCollisionModule();
		renderer.render(scene, camera);
		
		document.body.onkeydown = start_game;
	});	
	
}

function start_game(e)
{
	if(e.key==" ")
	{
		collision_detected = false;
		document.getElementById("controls").innerHTML = "";
		document.body.onkeydown = move_character;
		execute_animation();
	}
}

function init_environment()
{
	scene_base = models["athletics"].clone();
	scene.add(scene_base);
	
	var geometry_bricks = models["wall"].children[0].children[0].geometry;
	var material_bricks = models["wall"].children[0].children[0].material;
	
	var geometry_inner_cube = models["wall"].children[0].children[1].geometry;
	var material_inner_cube = models["wall"].children[0].children[1].material;
	
	var geometry_leaves = models["tree"].children[0].geometry;
	var material_leaves = models["tree"].children[0].material;
	
	var geometry_trunk = models["tree"].children[1].geometry;
	var material_trunk = models["tree"].children[1].material;
	
	for(var i=-2; i<18; i++)
	{
		var instance_bricks_right = geometry_bricks.clone();
		instance_bricks_right.translate(8, 0, -5*i);
		scene_bricks.push(instance_bricks_right);
		
		var instance_bricks_left = geometry_bricks.clone();
		instance_bricks_left.translate(-8, 0, -5*i);
		scene_bricks.push(instance_bricks_left);
		
		var instance_inner_cube_right = geometry_inner_cube.clone();
		instance_inner_cube_right.translate(8, 0, -5*i);
		scene_inner_cube.push(instance_inner_cube_right);
		
		var instance_inner_cube_left = geometry_inner_cube.clone();
		instance_inner_cube_left.translate(-8, 0, -5*i);
		scene_inner_cube.push(instance_inner_cube_left);
		
		if(i%2==0)
		{
			var instance_leaves_right = geometry_leaves.clone();
			instance_leaves_right.translate(12.5, 0, -5*i);
			scene_leaves.push(instance_leaves_right);
			
			var instance_leaves_left = geometry_leaves.clone();
			instance_leaves_left.translate(-12.5, 0, -5*i);
			scene_leaves.push(instance_leaves_left);
			
			var instance_trunk_right = geometry_trunk.clone();
			instance_trunk_right.translate(12.5, 0, -5*i);
			scene_trunk.push(instance_trunk_right);
			
			var instance_trunk_left = geometry_trunk.clone();
			instance_trunk_left.translate(-12.5, 0, -5*i);
			scene_trunk.push(instance_trunk_left);
			
			var instance_leaves_right = geometry_leaves.clone();
			instance_leaves_right.translate(32.5, 0, -5*i);
			scene_leaves.push(instance_leaves_right);
			
			var instance_leaves_left = geometry_leaves.clone();
			instance_leaves_left.translate(-32.5, 0, -5*i);
			scene_leaves.push(instance_leaves_left);
			
			var instance_trunk_right = geometry_trunk.clone();
			instance_trunk_right.translate(32.5, 0, -5*i);
			scene_trunk.push(instance_trunk_right);
			
			var instance_trunk_left = geometry_trunk.clone();
			instance_trunk_left.translate(-32.5, 0, -5*i);
			scene_trunk.push(instance_trunk_left);
		}
		else
		{
			var instance_leaves_right = geometry_leaves.clone();
			instance_leaves_right.translate(22.5, 0, -5*i);
			scene_leaves.push(instance_leaves_right);
			
			var instance_leaves_left = geometry_leaves.clone();
			instance_leaves_left.translate(-22.5, 0, -5*i);
			scene_leaves.push(instance_leaves_left);
			
			var instance_trunk_right = geometry_trunk.clone();
			instance_trunk_right.translate(22.5, 0, -5*i);
			scene_trunk.push(instance_trunk_right);
			
			var instance_trunk_left = geometry_trunk.clone();
			instance_trunk_left.translate(-22.5, 0, -5*i);
			scene_trunk.push(instance_trunk_left);
			
			var instance_leaves_right = geometry_leaves.clone();
			instance_leaves_right.translate(42.5, 0, -5*i);
			scene_leaves.push(instance_leaves_right);
			
			var instance_leaves_left = geometry_leaves.clone();
			instance_leaves_left.translate(-42.5, 0, -5*i);
			scene_leaves.push(instance_leaves_left);
			
			var instance_trunk_right = geometry_trunk.clone();
			instance_trunk_right.translate(42.5, 0, -5*i);
			scene_trunk.push(instance_trunk_right);
			
			var instance_trunk_left = geometry_trunk.clone();
			instance_trunk_left.translate(-42.5, 0, -5*i);
			scene_trunk.push(instance_trunk_left);
		}
	}
	
	var final_geometry_bricks = THREE.BufferGeometryUtils.mergeBufferGeometries(scene_bricks);
	var final_geometry_inner_cube = THREE.BufferGeometryUtils.mergeBufferGeometries(scene_inner_cube);
	var final_geometry_leaves = THREE.BufferGeometryUtils.mergeBufferGeometries(scene_leaves);
	var final_geometry_trunk = THREE.BufferGeometryUtils.mergeBufferGeometries(scene_trunk);
	
	var final_mesh_bricks = new THREE.Mesh(final_geometry_bricks, material_bricks);
	var final_mesh_inner_cube = new THREE.Mesh(final_geometry_inner_cube, material_inner_cube);
	var final_mesh_leaves = new THREE.Mesh(final_geometry_leaves, material_leaves);
	var final_mesh_trunk = new THREE.Mesh(final_geometry_trunk, material_trunk);
	
	scene.add(final_mesh_bricks);
	scene.add(final_mesh_inner_cube);
	scene.add(final_mesh_leaves);
	scene.add(final_mesh_trunk);
	
	scene_side_walls = [final_mesh_bricks, final_mesh_inner_cube, final_mesh_leaves, final_mesh_trunk];
}

function addCharacter()
{
	scene_character = models["character"].clone();
	scene_character.rotation.y = Math.PI;
	scene.add(scene_character);
	console.log(scene_character)
	
	scene_character.traverse(getCharacterParts);
	var pi = Math.PI;
	
	scene_character_parts["Bone_left_forearm"].rotation.x = pi/2;
	scene_character_parts["Bone_right_forearm"].rotation.x = pi/2;
	scene_character_parts["Bone_right_lower_leg"].rotation.x = -pi/2;

	runAnimationBuffer["Bone_left_forearm"] = new TWEEN.Tween(scene_character_parts["Bone_left_forearm"].rotation).to({x:[pi/4,pi/2,3*pi/4,pi/2]}, 800).repeat(Infinity).start();
	runAnimationBuffer["Bone_left_shoulder"] = new TWEEN.Tween(scene_character_parts["Bone_left_shoulder"].rotation).to({x:[pi/3,0,-pi/3,0]}, 800).repeat(Infinity).start();
	runAnimationBuffer["Bone_right_forearm"] = new TWEEN.Tween(scene_character_parts["Bone_right_forearm"].rotation).to({x:[3*pi/4,pi/2,pi/4,pi/2]}, 800).repeat(Infinity).start();
	runAnimationBuffer["Bone_right_shoulder"] = new TWEEN.Tween(scene_character_parts["Bone_right_shoulder"].rotation).to({x:[-pi/3,0,pi/3,0]}, 800).repeat(Infinity).start();
	runAnimationBuffer["Bone_left_upper_leg"] = new TWEEN.Tween(scene_character_parts["Bone_left_upper_leg"].rotation).to({x:[-pi/2,0,pi/2,0]}, 800).repeat(Infinity).start();
	runAnimationBuffer["Bone_left_lower_leg"] = new TWEEN.Tween(scene_character_parts["Bone_left_lower_leg"].rotation).to({x:[0,-pi/2,-pi/2,0]}, 800).repeat(Infinity).start();
	runAnimationBuffer["Bone_right_upper_leg"] = new TWEEN.Tween(scene_character_parts["Bone_right_upper_leg"].rotation).to({x:[pi/2,0,-pi/2,0]}, 800).repeat(Infinity).start();
	runAnimationBuffer["Bone_right_lower_leg"] = new TWEEN.Tween(scene_character_parts["Bone_right_lower_leg"].rotation).to({x:[-pi/2,0,0,-pi/2]}, 800).repeat(Infinity).start();
	runAnimationBuffer["Bone_belly"] = new TWEEN.Tween(scene_character_parts["Bone_belly"].position).to({y:[0.2,0,0.2,0]}, 800).repeat(Infinity).start();
	
	resetRunAnimationBuffer["Bone_left_forearm"] = new TWEEN.Tween(scene_character_parts["Bone_left_forearm"].rotation).to({x:0}, 1);
	resetRunAnimationBuffer["Bone_left_shoulder"] = new TWEEN.Tween(scene_character_parts["Bone_left_shoulder"].rotation).to({x:0}, 1);
	resetRunAnimationBuffer["Bone_right_forearm"] = new TWEEN.Tween(scene_character_parts["Bone_right_forearm"].rotation).to({x:0}, 1);
	resetRunAnimationBuffer["Bone_right_shoulder"] = new TWEEN.Tween(scene_character_parts["Bone_right_shoulder"].rotation).to({x:0}, 1);
	resetRunAnimationBuffer["Bone_left_upper_leg"] = new TWEEN.Tween(scene_character_parts["Bone_left_upper_leg"].rotation).to({x:0}, 1);
	resetRunAnimationBuffer["Bone_left_lower_leg"] = new TWEEN.Tween(scene_character_parts["Bone_left_lower_leg"].rotation).to({x:0}, 1);
	resetRunAnimationBuffer["Bone_right_upper_leg"] = new TWEEN.Tween(scene_character_parts["Bone_right_upper_leg"].rotation).to({x:0}, 1);
	resetRunAnimationBuffer["Bone_right_lower_leg"] = new TWEEN.Tween(scene_character_parts["Bone_right_lower_leg"].rotation).to({x:0}, 1);
	resetRunAnimationBuffer["Bone_belly"] = new TWEEN.Tween(scene_character_parts["Bone_belly"].position).to({y:0}, 1);
}

function getCharacterParts(obj)
{
	if(obj.name.startsWith("Bone_"))
		scene_character_parts[obj.name] = obj;
}

function addRow()
{
	var displacement = 75;
	
	var obj1 = null;
	var obj2 = null;
	var obj3 = null;
	
	var num_of_elements = 1+Math.floor(Math.random() * 3);
	side_walls_positions.sort(() => Math.random() - 0.5); //shuffles side_walls_positions
	switch(num_of_elements)
	{
		case 3:
			var element_type = Math.floor(Math.random() * 2) + 1; //if three obstacles are present it guarantees that at least one is either a hurdle or an arc
			obj1 = models[idx_to_key[element_type]].clone();
			obj1.position.x += side_walls_positions[0];
			obj1.position.z -= displacement;
			scene.add(obj1);
		case 2:
			var element_type = Math.floor(Math.random() * 3);
			obj2 = models[idx_to_key[element_type]].clone();
			obj2.position.x += side_walls_positions[1];
			obj2.position.z -= displacement;
			scene.add(obj2);
		case 1:
			var element_type = Math.floor(Math.random() * 3);
			obj3 = models[idx_to_key[element_type]].clone();
			obj3.position.x += side_walls_positions[2];
			obj3.position.z -= displacement;
			scene.add(obj3);
		case 0:
			break;
	}
	scene_elements.push([obj1, obj2, obj3]);
	
}

function initCollisionModule()
{
	raycasters = [];
	var direction = new THREE.Vector3(0,0,-1);
	
	var worldCoord = new THREE.Vector3()
	scene_character_parts["Bone_belly"].getWorldPosition(worldCoord);
	raycasters.push(new THREE.Raycaster(worldCoord, direction, 0, 0.5));
	
	worldCoord = new THREE.Vector3();
	scene_character_parts["Bone_left_upper_leg"].getWorldPosition(worldCoord);
	worldCoord.x = 0;
	raycasters.push(new THREE.Raycaster(worldCoord, direction, 0, 0.5));
	
	worldCoord = new THREE.Vector3();
	scene_character_parts["Bone_left_lower_leg"].getWorldPosition(worldCoord);
	worldCoord.x = 0;
	raycasters.push(new THREE.Raycaster(worldCoord, direction, 0, 0.5));
	
	worldCoord = new THREE.Vector3();
	scene_character_parts["Bone_left_foot"].getWorldPosition(worldCoord);
	worldCoord.x = 0;
	raycasters.push(new THREE.Raycaster(worldCoord, direction, 0, 0.5));
	
	worldCoord = new THREE.Vector3();
	scene_character_parts["Bone_neck"].getWorldPosition(worldCoord);
	raycasters.push(new THREE.Raycaster(worldCoord, direction, 0, 0.5));

	raycaster_arrows.forEach(arrow => {scene.remove(arrow)});
	raycaster_arrows = [];
	raycasters.forEach(elem =>
	{
		var arrow_helper = new THREE.ArrowHelper(elem.ray.direction, elem.ray.origin, 10, 0xff0000)
		scene.add(arrow_helper);
		raycaster_arrows.push(arrow_helper);
	});
}

function loadModel(gltfLoader, url)
{
  return new Promise(resolve => {gltfLoader.load(url, resolve)});
}

function execute_animation()
{
	scene_elements.forEach(row => row.forEach(elem => {if(elem) elem.position.z += 0.4;}));
	scene_side_walls.forEach(elem => {if(elem) elem.position.z += 0.4;});
	clock += 1;
	if(clock%75==0)
	{
		addRow();
	}
	
	if(clock%50==0)
	{
		scene_side_walls[0].position.z -= 20;
		scene_side_walls[1].position.z -= 20;
		scene_side_walls[2].position.z -= 20;
		scene_side_walls[3].position.z -= 20;
	}
	
	if(scene_elements.length>4)
	{
		var row_to_delete = scene_elements.shift();
		row_to_delete.forEach(elem => {if(elem != null) scene.remove(elem);});
	}
	
	raycaster_arrows.forEach(arrow => {scene.remove(arrow)});
	raycaster_arrows = [];
	raycasters.forEach(elem =>
	{
		var arrow_helper = new THREE.ArrowHelper(elem.ray.direction, elem.ray.origin, 10, 0xff0000);
		scene.add(arrow_helper);
		raycaster_arrows.push(arrow_helper);
	});
	
	if(scene_elements.length>2)
	{
		var idx = scene_elements.length==3 ? 0 : 1;
		var obstacles = [];
		for(var i=0; i<3; i++)
			if(scene_elements[idx][i] != null)
				obstacles.push(scene_elements[idx][i]);
		raycasters.forEach(elem =>
		{
			if(elem.intersectObjects(obstacles, true).length>0)
			{
				collision_detected = true;
				document.body.onkeydown = start_game;
				document.getElementById("controls").innerHTML = "Game Over! Press spacebar to start a new game";
				scene_character_lane = 0;
				raycasters.forEach(e =>
				{
					var raycaster_tween = new TWEEN.Tween(e.ray.origin);
					raycaster_tween.to({x: 0}, 1).start();
				});
				scene_character_jumping_sliding = false;
				clock = 0;
				scene_side_walls[0].position.z = 0;
				scene_side_walls[1].position.z = 0;
				scene_side_walls[2].position.z = 0;
				scene_side_walls[3].position.z = 0;
				scene_character.position.x = 0;
				scene_character.position.y = 0;
				scene_character_parts["Bone_left_forearm"].rotation.x = Math.PI/2;
				scene_character_parts["Bone_right_forearm"].rotation.x = Math.PI/2;
				scene_character_parts["Bone_right_lower_leg"].rotation.x = -Math.PI/2;
				scene_elements.forEach(row => {row.forEach(obstacle => {if(obstacle != null) scene.remove(obstacle);})});
				scene_elements = [];
			};
		});
	}
	
	if(!collision_detected)
	{
		TWEEN.update();
		renderer.render(scene, camera);
		setTimeout(execute_animation, 20);
	}
}

function move_character(e)
{
	if(e.key=="ArrowRight" && scene_character_lane<1)
	{
		scene_character_lane += 1;
		var tween = new TWEEN.Tween(scene_character.position);
		tween.to({x: scene_character_lane*4.5}, 250);
		tween.start();
		
		raycasters.forEach(e =>
		{
			var raycaster_tween = new TWEEN.Tween(e.ray.origin);
			raycaster_tween.to({x: scene_character_lane*4.5}, 250);
			raycaster_tween.start();
		});
	}
	else if(e.key=="ArrowLeft" && scene_character_lane>-1)
	{
		scene_character_lane -= 1;
		var tween = new TWEEN.Tween(scene_character.position);
		tween.to({x: scene_character_lane*4.5}, 250);
		tween.start();
		
		raycasters.forEach(e =>
		{
			var raycaster_tween = new TWEEN.Tween(e.ray.origin);
			raycaster_tween.to({x: scene_character_lane*4.5}, 250);
			raycaster_tween.start();
		});
	}
	else if(!scene_character_jumping_sliding && e.key=="ArrowUp")
	{
		for(var i=0; i<scene_character_parts_keys.length; i++)
		{
			runAnimationBuffer[scene_character_parts_keys[i]].pause();
			resetRunAnimationBuffer[scene_character_parts_keys[i]].start();
		}
		scene_character_jumping_sliding = true;
		
		jump_type += 1;
		jump_type %= 2;
		if(jump_type==0) //normal jump
		{
			var tween_left_forearm = new TWEEN.Tween(scene_character_parts["Bone_left_forearm"].rotation).to({x:[Math.PI/2,0]}, 900).start();
			var tween_left_shoulder = new TWEEN.Tween(scene_character_parts["Bone_left_shoulder"].rotation).to({x:[0,0]}, 900).start();
			var tween_right_forearm = new TWEEN.Tween(scene_character_parts["Bone_right_forearm"].rotation).to({x:[Math.PI/2,0]}, 900).start();
			var tween_right_shoulder = new TWEEN.Tween(scene_character_parts["Bone_right_shoulder"].rotation).to({x:[0,0]}, 900).start();
			var tween_left_upper_leg = new TWEEN.Tween(scene_character_parts["Bone_left_upper_leg"].rotation).to({x:[Math.PI/2,0]}, 900).start();
			var tween_left_lower_leg = new TWEEN.Tween(scene_character_parts["Bone_left_lower_leg"].rotation).to({x:[-Math.PI/2,0]}, 900).start();
			var tween_right_upper_leg = new TWEEN.Tween(scene_character_parts["Bone_right_upper_leg"].rotation).to({x:[Math.PI/2,0]}, 900).start();
			var tween_right_lower_leg = new TWEEN.Tween(scene_character_parts["Bone_right_lower_leg"].rotation).to({x:[-Math.PI/2,0]}, 900).start();

			var tweenUp = new TWEEN.Tween(scene_character.position);
			tweenUp.to({y: scene_character.position.y+2}, 450);
			tweenUp.easing(TWEEN.Easing.Quadratic.Out);
			
			var tweenDown = new TWEEN.Tween(scene_character.position);
			tweenDown.to({y: scene_character.position.y}, 450);
			tweenDown.easing(TWEEN.Easing.Quadratic.In);
			tweenDown.onComplete(function ()
			{
				scene_character_jumping_sliding = false;
				
				for(var i=0; i<scene_character_parts_keys.length; i++)
				{
					runAnimationBuffer[scene_character_parts_keys[i]].resume();
				}
			});
			
			tweenUp.chain(tweenDown);
			tweenUp.start();
			
			raycasters.forEach(e =>
			{
				var raycaster_tween_up = new TWEEN.Tween(e.ray.origin);
				raycaster_tween_up.to({y: "+2"}, 450);
				raycaster_tween_up.easing(TWEEN.Easing.Quadratic.Out);
				
				var raycaster_tween_down = new TWEEN.Tween(e.ray.origin);
				raycaster_tween_down.to({y: "-2"}, 450);
				raycaster_tween_down.easing(TWEEN.Easing.Quadratic.In);
				
				raycaster_tween_up.chain(raycaster_tween_down);
				raycaster_tween_up.start();
			});
		}
		else //front flip 
		{
			var tween_left_forearm = new TWEEN.Tween(scene_character_parts["Bone_left_forearm"].rotation).to({z:[-Math.PI/6,0]}, 900).start();
			var tween_left_shoulder = new TWEEN.Tween(scene_character_parts["Bone_left_shoulder"].rotation).to({x:[-Math.PI/6,0]}, 900).start();
			var tween_right_forearm = new TWEEN.Tween(scene_character_parts["Bone_right_forearm"].rotation).to({z:[Math.PI/6,0]}, 900).start();
			var tween_right_shoulder = new TWEEN.Tween(scene_character_parts["Bone_right_shoulder"].rotation).to({x:[-Math.PI/6,0]}, 900).start();
			var tween_belly_flip_rot = new TWEEN.Tween(scene_character_parts["Bone_belly"].rotation).to({x:[Math.PI,2*Math.PI]}, 900).start();
			var tween_belly_flip_pos_1 = new TWEEN.Tween(scene_character_parts["Bone_belly"].position).to({y:["+2"]}, 450).easing(TWEEN.Easing.Quadratic.Out);
			var tween_belly_flip_pos_2 = new TWEEN.Tween(scene_character_parts["Bone_belly"].position).to({y:["-2"]}, 450).easing(TWEEN.Easing.Quadratic.In);
			tween_belly_flip_pos_1.chain(tween_belly_flip_pos_2).start();
			var tween_left_upper_leg = new TWEEN.Tween(scene_character_parts["Bone_left_upper_leg"].rotation).to({x:[7*Math.PI/8,0]}, 900).start();
			var tween_left_lower_leg = new TWEEN.Tween(scene_character_parts["Bone_left_lower_leg"].rotation).to({x:[-7*Math.PI/8,0]}, 900).start();
			var tween_right_upper_leg = new TWEEN.Tween(scene_character_parts["Bone_right_upper_leg"].rotation).to({x:[7*Math.PI/8,0]}, 900).start();
			var tween_right_lower_leg = new TWEEN.Tween(scene_character_parts["Bone_right_lower_leg"].rotation).to({x:[-7*Math.PI/8,0]}, 900).start();
			
			tween_belly_flip_pos_2.onComplete(function ()
			{
				scene_character_jumping_sliding = false;
				scene_character_parts["Bone_belly"].rotation.x = 0;
				
				for(var i=0; i<scene_character_parts_keys.length; i++)
				{
					runAnimationBuffer[scene_character_parts_keys[i]].resume();
				}
			});
			
			raycasters.forEach(e =>
			{
				var raycaster_tween_up = new TWEEN.Tween(e.ray.origin);
				raycaster_tween_up.to({y: "+2"}, 450);
				raycaster_tween_up.easing(TWEEN.Easing.Quadratic.Out);
				
				var raycaster_tween_down = new TWEEN.Tween(e.ray.origin);
				raycaster_tween_down.to({y: "-2"}, 450);
				raycaster_tween_down.easing(TWEEN.Easing.Quadratic.In);
				
				var raycaster_tween_rotate = new TWEEN.Tween(e.ray.origin);
				raycaster_tween_rotate.to({z: ["+3", "+0", "-3", "+0"]}, 900);
				raycaster_tween_rotate.start();
				
				raycaster_tween_up.chain(raycaster_tween_down);
				raycaster_tween_up.start();
			});
		}
	}
	else if(!scene_character_jumping_sliding && e.key=="ArrowDown")
	{
		for(var i=0; i<scene_character_parts_keys.length; i++)
		{
			runAnimationBuffer[scene_character_parts_keys[i]].pause();
			resetRunAnimationBuffer[scene_character_parts_keys[i]].start();
		}
		scene_character_jumping_sliding = true;
		
		var execute_slide_animation = scene_character_lane;
		if(scene_character_lane == 0)
			execute_slide_animation = -Math.floor(Math.random()*2); //randomize sliding animation when the character is in the middle line
		
		if(execute_slide_animation >= 0)
		{
			var tween_belly_glide_rot = new TWEEN.Tween(scene_character_parts["Bone_belly"].rotation).to({x:[-Math.PI/2,-Math.PI/2,0],y:[Math.PI/4,Math.PI/4,0]}, 900).start();
			var tween_belly_glide_pos = new TWEEN.Tween(scene_character_parts["Bone_belly"].position).to({y:["-3","-3","+0"]}, 900).start();
			var tween_left_upper_leg = new TWEEN.Tween(scene_character_parts["Bone_left_upper_leg"].rotation).to({x:[Math.PI/4,Math.PI/4,0]}, 900).start();
			var tween_left_lower_leg = new TWEEN.Tween(scene_character_parts["Bone_left_lower_leg"].rotation).to({x:[-2*Math.PI/4,-2*Math.PI/4,0]}, 900).start();
			var tween_right_forearm = new TWEEN.Tween(scene_character_parts["Bone_right_forearm"].rotation).to({x:[Math.PI/2,Math.PI/2,0]}, 900).start();
			var tween_right_shoulder = new TWEEN.Tween(scene_character_parts["Bone_right_shoulder"].rotation).to({x:[0,0]}, 900).start();
		
			tween_belly_glide_rot.onComplete(function ()
			{
				scene_character_jumping_sliding = false;
				scene_character_parts["Bone_belly"].rotation.x = 0;
				
				for(var i=0; i<scene_character_parts_keys.length; i++)
				{
					runAnimationBuffer[scene_character_parts_keys[i]].resume();
				}
			});
		}
		else
		{
			var tween_belly_glide_rot = new TWEEN.Tween(scene_character_parts["Bone_belly"].rotation).to({x:[-Math.PI/2,-Math.PI/2,0],y:[-Math.PI/4,-Math.PI/4,0]}, 900).start();
			var tween_belly_glide_pos = new TWEEN.Tween(scene_character_parts["Bone_belly"].position).to({y:["-3","-3","+0"]}, 900).start();
			var tween_left_upper_leg = new TWEEN.Tween(scene_character_parts["Bone_right_upper_leg"].rotation).to({x:[Math.PI/4,Math.PI/4,0]}, 900).start();
			var tween_left_lower_leg = new TWEEN.Tween(scene_character_parts["Bone_right_lower_leg"].rotation).to({x:[-2*Math.PI/4,-2*Math.PI/4,0]}, 900).start();
			var tween_right_forearm = new TWEEN.Tween(scene_character_parts["Bone_left_forearm"].rotation).to({x:[Math.PI/2,Math.PI/2,0]}, 900).start();
			var tween_right_shoulder = new TWEEN.Tween(scene_character_parts["Bone_left_shoulder"].rotation).to({x:[0,0]}, 900).start();
		
			tween_belly_glide_rot.onComplete(function ()
			{
				scene_character_jumping_sliding = false;
				scene_character_parts["Bone_belly"].rotation.x = 0;
				
				for(var i=0; i<scene_character_parts_keys.length; i++)
				{
					runAnimationBuffer[scene_character_parts_keys[i]].resume();
				}
			});
		}
		var raycaster_tween = new TWEEN.Tween(raycasters[4].ray.origin); //only neck raycaster needs to be animated to make the mannequin go under the arc
		raycaster_tween.to({y: ["-2", "+0"]}, 900);
		raycaster_tween.start();
	}
}
