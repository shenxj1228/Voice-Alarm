// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
Displays a notification with the current time. Requires "notifications"
permission in the manifest file (or calling
"webkitNotifications.requestPermission" beforehand).
 */

var timeout_arry = [];
var myDB = {
	name : 'VoiceRemindEX',
	version : 1,
	db : null
};
var storeName = 't_remind';
chrome.browserAction.onClicked.addListener(
	function () {
	chrome.tabs.create({
		"url" : '../options.html',
		"selected" : true
	}, function () {});
});

if (!localStorage.conn_google) {
	localStorage.conn_google = false;
}
if (!localStorage.add_window) {
	localStorage.add_window = '';
}
if (!localStorage.isActivated) {
	localStorage.isActivated = true;
}
if (!localStorage.isSpeak) {
	localStorage.isSpeak = true;
}

//打开数据库
function openDB(callback) {
	var version = myDB.version || 1;
	var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
	var request = indexedDB.open(myDB.name, version);
	request.onerror = function (e) {
		console.log(e.currentTarget.error.message);
	};
	request.onsuccess = function (e) {
		myDB.db = e.target.result;
		if(typeof callback == "function") 
			callback();
	};
	request.onupgradeneeded = function (e) {
		myDB.db = e.target.result;
		if (!myDB.db.objectStoreNames.contains(storeName)) {
			myDB.db.createObjectStore(storeName, {
				keyPath : "id"
			});
		}
		if(typeof callback == "function") 
			callback();
		console.log('DB version changed to ' + myDB.version);
	};
}
//关闭数据库
function closeDB(db) {
	db.close();
}
//删除数据库
function deleteDB(name) {
	indexedDB.deleteDatabase(name);
}
//增加数据
function addData(db, storeName, reminds) {
	var transaction = db.transaction(storeName, 'readwrite');
	var store = transaction.objectStore(storeName);
	for (var i = 0; i < reminds.length; i++) {
		store.add(reminds[i]);
	}
}
/*查询数据
function getDataByKey(db,storeName,id){
var transaction=db.transaction(storeName,'readwrite');
var store=transaction.objectStore(storeName);
var request=store.get(id);
request.onsuccess=function(e){
var result=e.target.result;
};
} */
//更新数据
function updateDataByKey(db, storeName, id, key, value) {
	var transaction = db.transaction(storeName, 'readwrite');
	var store = transaction.objectStore(storeName);
	var request = store.get(id);
	request.onsuccess = function (e) {
		var remindinfo = e.target.result;
		remindinfo.key = value;
		store.put(remindinfo);
	};
}
//删除数据
function deleteDataByKey(db, storeName, id) {
	var transaction = db.transaction(storeName, 'readwrite');
	var store = transaction.objectStore(storeName);
	store.delete (id);
}

//产生guid
function guid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16 | 0,
		v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

//分辨语言
function Distinguishlanguage(str) {
	var hwkeycode = /[\uac00-\ud7ff]/gi;
	var rwkeycode = /[\u0800-\u4e00]/gi;
	var zwkeycode = /[\u4e00-\u9fa5]/gi;
	var ywkeycode = /[\u2E80-\u9FFF]/gi;
	if (str.match(hwkeycode)) {
		return 'ko-KR'; //韩语
	} else if (str.match(rwkeycode)) {
		return 'ja-JP'; //日语
	} else if (str.match(zwkeycode)) {
		return 'zh_CN'; //汉语
	} else {
		return 'en_US'; //英语
	}
}
//组合时间
function getTimeString(hh, mm) {
	var ampm = hh >= 12 ? 'PM' : 'AM';
	hh = (hh % 12);
	if (hh === 0)
		hh = 12;
	return hh + ':' + mm + ' ' + ampm;
}
//修改状态
function updatestate(xh) {
	var transaction = myDB.db.transaction(storeName, 'readwrite');
	var store = transaction.objectStore(storeName);
	var request = store.get(xh);
	request.onsuccess = function (e) {
		var remindinfo = e.target.result;
		remindinfo.state = false;
		store.put(remindinfo);
		reloadOptionHtml('/options.html');
	};

}

function oninstall() {
	if (typeof localStorage.version === 'undefined') {
		chrome.tabs.create({
			selected : true,
			url : "../options.html"
		});
		localStorage.version = 1.1;
	}
}

//弹出通知的方法
function ShowNotification(myNotification) {
	var title = myNotification.title;
	var icon = myNotification.icon;
	var message = myNotification.message;
	var notifica_id = myNotification.id;
	var click_function = myNotification.callback;
	var delayTime = myNotification.delayTime;
	var re = /^[0-9]*[1-9][0-9]*$/;
	if (!notifica_id) {
		chrome.notifications.create('', {
			type : 'basic',
			iconUrl : icon,
			title : title,
			message : message
		}, function (notificationId) {
			chrome.notifications.onClicked.addListener(function (id) {
				if (id == notificationId) {
					if (click_function) {
						click_function();
					}
					chrome.notifications.clear(notificationId, function () {});
				}
			});
			if (re.test(delayTime)) {
				setTimeout(function () {
					chrome.notifications.clear(notificationId, function () {});
				}, delayTime);
			}
		});
	} else {
		chrome.notifications.create(notifica_id, {
			type : 'basic',
			iconUrl : icon,
			title : title,
			message : message
		}, function (notificationId) {
			chrome.notifications.onClicked.addListener(function (id) {
				if (id == notificationId) {
					if (click_function) {
						click_function();
					}
					chrome.notifications.clear(notificationId);
				}
			});
			if (re.test(delayTime)) {
				setTimeout(function () {
					chrome.notifications.clear(notificationId);
				}, delayTime);
			}
		});
	}
}
function reloadOptionHtml(pathname) {
	var str = window.location.host + pathname;
	chrome.windows.getAll({
		populate : true
	}, function (windowList) {
		for (var i = 0; i < windowList.length; i++) {
			windowList[i].tabs.forEach(function (e) {
				if (e.url.indexOf(str) > -1) {
					chrome.tabs.reload(e.id);
				}
			});
		}
	});

}

function speak(speakingtxt, language, voice) {
	if (JSON.parse(localStorage.isSpeak)) {
		chrome.tts.speak(speakingtxt, {
			lang : language,
			rate : 1.0,
			voiceName : voice,
			enqueue : true
		}, function () {
			if (chrome.runtime.lastError) {
				console.log('Error: ' + chrome.runtime.lastError.message);
			}
		});
	}
}

//产生提示
function ts(value, index) {
	var now = new Date();
	var PercentTime = (function getPercentTime() {
		var nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
		var differenceSeconds = parseInt(value.hour, 10) * 3600 + parseInt(value.minute, 10) * 60 - nowSeconds;
		if (differenceSeconds < 0) {
			differenceSeconds = differenceSeconds + 24 * 3600;
		}
		return differenceSeconds * 1000;
	})();
	var state = value.state;
	var Arrweek = value.timefrequencys.split(',');
	var hours = value.hour;
	var minutes = value.minute;
	var title = value.title;
	var body = value.content;
	var orderWeek = new Date(now.getTime() + PercentTime).getDay().toString();
	var cunt = value.timefrequencys;
	if ((Arrweek.indexOf(orderWeek) >= 0 || cunt == "-1") && state === true) {
		var speakingtxt = "";
		var voice = "";
		var clickMe = "";
		var lang = Distinguishlanguage(title);
		var time = getTimeString(hours, minutes);
		if (JSON.parse(localStorage.conn_google)) {
			switch (lang) {
			case 'ko-KR':
				speakingtxt = '이제' + time + "," + title;
				voice = 'Google 한국의';
				clickMe = '로 이동 합니다';
				break;
			case 'ja-JP':
				speakingtxt = '今' + time + "," + title;
				voice = 'Google 日本人';
				clickMe = 'に移動するにはクリック';
				break;
			case 'zh_CN':
				speakingtxt = '现在是' + time + "，" + title;
				voice = 'Google 中国的';
				clickMe = '点击前往';
				break;
			case 'en_US':
				speakingtxt = 'There is' + time + " now, " + title;
				voice = 'Google US English';
				lang = '';
				clickMe = 'Click to GO';
				break;
			}
		} else {
			speakingtxt = "现在是:" + hours + '时，' + minutes + '分。' + "," + title;
			lang = 'zh_CN';
			voice = 'native';
			clickMe = '点击前往';
		}
		var addurl = value.url;
		timeout_arry[index] = window.setTimeout(
				function () {
				if (cunt == "-1") {
					updatestate(value.id);
				}
				if (addurl === "") {
					ShowNotification({
						title : title,
						icon : "../images/tx.png",
						message : body
					});
				} else {
					ShowNotification({
						title : title + '(' + clickMe + ')',
						icon : "../images/tx.png",
						message : body,
						callback : function () {
							window.open(addurl);
						}
					});
				}
				speak(speakingtxt, lang, voice);
			}, PercentTime);
	}
}

function remind() {
	if (JSON.parse(localStorage.isActivated)) {
		var transaction = myDB.db.transaction(storeName, 'readwrite');
		var store = transaction.objectStore(storeName);
		var cursorRequest = store.openCursor();
		var i = 0;
		cursorRequest.onsuccess = function (e) {
			var cursor = e.target.result;
			if (cursor) {
				//console.log(cursor.value.hour);
				ts(cursor.value, i);
				i++;
				cursor.continue();
			}
		};

	}
	if (timeout_arry.length > 0) {
		for (var j = 0; j < timeout_arry.length; j++) {
			clearTimeout(timeout_arry[j]);
		}
		timeout_arry = [];
	}
}

//加载页面
window.onload = function () {
	/* openDB(myDB);
	setTimeout(function(){
	addData(myDB.db,storeName,reminds);
	closeDB(myDB.db);
	},100); */
	if (!myDB.db) {
		openDB(function () {
			remind();
			oninstall();
			setInterval(function () {
				this.location.reload();
			}, 3600 * 1000);
		});
		if (!localStorage.version) {
			window.open('./options.html');
			localStorage.version = true;
		}
	} else {
		remind();
		oninstall();
		setInterval(function () {
			this.location.reload();
		}, 3600 * 1000);
		if (!localStorage.version) {
			window.open('./options.html');
			localStorage.version = true;
		}
	}
	window.clearInterval(); //清除周期性方法
	chrome.tts.stop(); //取消tts朗读

};
