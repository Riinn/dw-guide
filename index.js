const format = require('./format.js');

const dw = 466; //Demon's Wheel
const bandersnatch = 46601; // Bandersnatch
const demoros = 46602; //Demoros


//Planned call outs: Bandersnatch: Stay in or Get out
//Demoros: LASER
//Demoros: In-out or Out-in
//Demoros: Blue? Not Blue? Red? Not Red? White? Not White? Hit everything

module.exports = function DWGuide(dispatch) {
	
	let boss = null;
	let enabled = true;
	let sendToParty = false;
	
	
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
			if(hp<=0) {
				boss = null;
			}
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
			//1171391783:  Odd/Red body/Green circles
			//1171391784:  Even/Blue body/Green circles
			
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
			//1171391773 First Red Outer-inner explosion
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
			
			//1171391681 Blue circles, 3 times
			//1171391687 Red circles, 3 times
			if (event.skill==1171391687){
				sendMessage('Double RED');
			}
		}
	});
}

