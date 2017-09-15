const format = require('./format.js');

const dw = 466; //Demon's Wheel
const bandersnatch = 46601; // Bandersnatch
const demoros = 46602; //Demoros


const dices = {
	0: {0: 'Hit ALL', 1: 'Don\'t hit RED', 2: 'Hit RED'},	//red dice
	1: {0: 'Hit ALL', 1: 'Don\'t hit BLUE', 2: 'Hit BLUE'},	//blue dice
	2: {0: 'Hit ALL', 1: 'Don\'t hit WHITE', 2: 'Hit WHITE'}	//white dice
};

//Planned call outs: Bandersnatch: Stay in or Get out
//Demoros: LASER
//Demoros: In-out or Out-in
//Demoros: Blue? Not Blue? Red? Not Red? White? Not White? Hit everything

module.exports = function DWGuide(dispatch) {
	
	let boss = null;
	let ball = null;
	let x;
	let y;
	let color; //0: red, 1: blue, 2: white
	let enabled = true;
	let sendToParty = false;
	let msg;
	let orbit=0; //0: STOP, 1:counter-clockwise, 2:clockwise
	
	//Chat hooks and messages
	const chatHook = event => {		
		let command = format.stripTags(event.message).split(' ');
		
		if (['!dw'].includes(command[0].toLowerCase())) {
			toggleModule();
			return false;
		} else if (['!dw.party'].includes(command[0].toLowerCase())) {
			toggleSentMessages();
			return false;
		}
	}
	dispatch.hook('C_CHAT', 1, chatHook)	
	dispatch.hook('C_WHISPER', 1, chatHook)
	function toggleModule() {
		enabled = !enabled;
		systemMessage((enabled ? 'enabled' : 'disabled'));
	}

	function toggleSentMessages() {
		sendToParty = !sendToParty;
		systemMessage((sendToParty ? 'Messages will be sent to the party' : 'Only you will see messages'));
	}
	
	function sendMessage(msg) {
		if (!enabled) return;
		
		if (sendToParty) {
			dispatch.toServer('C_CHAT', 1, {
				channel: 21, //21 = p-notice, 1 = party
				message: msg
			});
		} else {
			dispatch.toClient('S_CHAT', 1, {
				channel: 21, //21 = p-notice, 1 = party
				authorName: 'DW-Guide',
				message: msg
			});
		}		
	}	
		
	function systemMessage(msg) {
		dispatch.toClient('S_CHAT', 1, {
			channel: 21, //21 = p-notice, 24 = system
			authorName: 'DW-Guide',
			message: msg
		});
	}
	
	
	
	dispatch.hook('S_BOSS_GAGE_INFO', 2, (event) => {
		let hp;
		if (!enabled) return;
		
		if (event.huntingZoneId == dw) {
			if(event.templateId == bandersnatch || event.templateId == demoros) {
				boss = event;
			}
		}
		if(boss) {
			hp = boss.curHP/boss.maxHP;
			if(hp<=0) boss = null;
			if(hp<=0.3) orbit = 0;
		}
	});
	
	dispatch.hook('S_ACTION_STAGE', 1, (event) => {
		if (!enabled || !boss) return;
			if (event.source - boss.id == 0 && boss.templateId == bandersnatch) {
			//systemMessage(''+event.skill);
			//Bandersnatch actions
			//pre 50%
			//1171391770:  Odd/Red circles
			//1171391771:  Even/Blue circles
			//1171391775:  Red inner explosion
			//1171391776:  Red outer explosion
			//1171391777:  Blue inner explosion
			//1171391778:  Blue outer explosion
			//post 50%
			//1171391779:  Red inner explosion
			//1171391780:  Red outer explosion
			//1171391781:  Blue inner explosion
			//1171391782:  Blue outer explosion
			//1171391783:  Odd/Green circles
			//1171391784:  Even/Green circles
			
			if (event.skill==1171391775 || event.skill==1171391777 || event.skill==1171391779 || event.skill==1171391781) {
				sendMessage('OUT OUT OUT');
			}
			if (event.skill==1171391776 || event.skill==1171391778 || event.skill==1171391780 || event.skill==1171391782) {
				sendMessage('IN IN IN IN');
			}
		}
		if (event.source - boss.id == 0 && boss.templateId == demoros) {
			//systemMessage(''+event.skill);
			//1171391577 Laser, 4 times
			if (event.skill==1171391577) {
				sendMessage('<font color = "#ff3300">LASER!!!!!!</font>');
			}
			//1171391773 First Blue Outer-inner explosion
			//1171391774 First Red Outer-inner explosion
			//1171391775 Blue Outer-inner explosion
			//1171391776 Red Inner-outer explosion
			//1171391777 Blue Inner-outer explosion
			//1171391778 Red Outer-inner explosion
			if (event.skill==1171391775 || event.skill==1171391778){
				sendMessage('IN then OUT');
			}
			if (event.skill==1171391776 || event.skill==1171391777){
				sendMessage('OUT then IN');
			}
			//1171391767 Red,Blue,White dice? mech
			if (event.skill==1171391767){
				sendMessage(''+dices[color][orbit]);
			}
			
			//1171391681 Blue circles, 3 times
			//1171391687 Red circles, 3 times
			if (event.skill==1171391687){
				sendMessage('Double RED');
			}
		}
	});
	
	dispatch.hook('S_SPAWN_NPC', 3, (event) => {
		if(!enabled || !boss) return;
		if(event.huntingZoneId != 11796946) return;
		//46621 clockwise ball
		//46622 counterclockwise ball
		if(event.templateId == 46621){
			//sendMessage('DON\'T HIT THAT COLOR');
			ball = event;
			orbit = 1;
		}
		if(event.templateId == 46622){
			//sendMessage('HIT THAT COLOR');
			ball = event;
			orbit = 2;
		}
	});
	
	dispatch.hook('S_DESPAWN_NPC', 1, (event) => {
		if(!enabled || !boss || !ball) return;
		if(event.target - ball.id == 0){
			x = event.x;
			y = event.y;
			//systemMessage('x = '+x+' , y = '+y);
			if(Math.abs(x+21927.0)<200 && Math.abs(y-43462.6)<200) color = 0;
			if(Math.abs(x+23881.0)<200 && Math.abs(y-42350.3)<200) color = 0;
			if(Math.abs(x+22896.0)<200 && Math.abs(y-41786.0)<200) color = 1;
			if(Math.abs(x+22911.0)<200 && Math.abs(y-44026.0)<200) color = 1;
			if(Math.abs(x+23847.4)<200 && Math.abs(y-43489.7)<200) color = 2;
			if(Math.abs(x+21960.7)<200 && Math.abs(y-42323.2)<200) color = 2;
			//if(color == 0) systemMessage('RED');
			//if(color == 1) systemMessage('BLUE');
			//if(color == 2) systemMessage('WHITE');
			sendMessage(''+dices[color][orbit]);
		}
	});
}
