
var form_options;
var form_isActivated;
var form_Tab;
var weekarry = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
var addconfig = '<p><a id="close" href="#"><b>关闭</b></a><a  style="margin-left:310px;color:white" id="ok" href="#"><b>提交</b></a></p><div class="fileInput"><input type="file" name="upfile" id="upfile" accept="text/plain" class="upfile" /><input class="upFileBtn" type="button" id="upFileBtn" value="上传" /></div><div id="drop_div"  ><br>点击浏览导入配置文件<br>或<br>将配置文件拖拽到这里</div >';
var textarea = '<textarea id="inportcontent" rows="6" readonly="readonly" wrap="off"></textarea>';
var myDB = chrome.extension.getBackgroundPage().myDB;
var storeName = 't_remind';
//是否启用
function ghost(noActivated) {
	var tmp = !noActivated;
	if (tmp) {
		$("a[name='addbtn']").off();
		$("a[name='delbtn']").off();
	} else {
		$("a[name='addbtn']").off().click(function () {
			loadWindowList('-1');
		});
		$("a[name='delbtn']").off().click(function () {
			delRow();
		});
	}
	chrome.extension.getBackgroundPage().remind();
}

//判断是否打开新增提醒页面
function loadWindowList(xh) {
	var windowidList = [];
	var windowurlList = [];
	chrome.windows.getAll({
		populate : true
	}, function (windowList) {
		for (var i = 0; i < windowList.length; i++) {
			windowidList.push(String(windowList[i].id));
			for (var j = 0; j < windowList[i].tabs.length; j++) {
				windowurlList.push(windowList[i].tabs[j].url);
			}
			windowurlList.push(windowList[i].url);
		}
		if ((windowidList.indexOf(localStorage.add_window) > -1 && xh == -1) || windowurlList.indexOf(window.location.href.replace('options', 'add').replace('#', '') + '?xh=' + xh) > -1) {
			chrome.windows.update(parseInt(localStorage.add_window, 10), {
				focused : true
			});
		} else {
			openaddHtml(xh);
		}
	});
}

//打开提醒页面
function openaddHtml(xh) {
	var ileft = (window.screen.width - 730) / 2;
	var iheight = 800;
	if (window.height <= 800) {
		iheight = window.height;
	}
	chrome.windows.create({
		url : "add.html?xh=" + xh + "",
		left : ileft,
		width : 730,
		height : iheight,
		type : "popup"
	}, function (window) {
		localStorage.add_window = window.id;
	});

}

//删除行
function delRow() {
	if ($("a[name='checkSel'][class='divCheckBoxSel']").length == 0) {
		$("#tipinfo").text('没有选择行');
		showtip('tip', 'tipinfo');
		setTimeout(function () {
			closetip('tip');
		}, 2000);
	} else {

		$("a[name='checkSel'][class='divCheckBoxSel']").each(function () {
			var delId = $(this).attr('id').replace($(this).attr('name') + '-', '');
			chrome.extension.getBackgroundPage().deleteDataByKey(myDB.db, storeName, delId);
			$("a[name='checkSel'][class='divCheckBoxSel']").parent().parent().remove();
		});

	}
}

//checkBOX加载
function clickCbx() {
	$("#remindTab").on("click", "a[name='checkSel']", function () {
		if ($(this).hasClass('divCheckBoxSel')) {
			$(this).removeClass('divCheckBoxSel').addClass('divCheckBoxNoSel');
		} else {
			$(this).removeClass().addClass('divCheckBoxSel');
		}
	});
	$("#remindTab").on("click", "a[id='checkAllSel']", function () {
		if ($(this).hasClass('divCheckBoxSel')) {
			$(this).removeClass().addClass('divCheckBoxNoSel');
			$("a[name='checkSel']").removeClass().addClass('divCheckBoxNoSel');
		} else {
			$(this).removeClass().addClass('divCheckBoxSel');
			$("a[name='checkSel']").removeClass().addClass('divCheckBoxSel');
		}
	});

	$("#remindTab").on('change', "input[name='isuse']", function () {
		var zt;
		var transaction = myDB.db.transaction(storeName, 'readwrite');
		var store = transaction.objectStore(storeName);
		var updateId = $(this).attr('id').replace($(this).attr('name') + '-', '');
		var request = store.get(updateId);
		if ($(this).is(':checked')) {
			$(this).parent().css('background', '#26ca28');
			zt = true;
		} else {
			$(this).parent().css('background', '#bbbbbb');
			zt = false;
		}
		request.onsuccess = function (e) {
			var remindinfo = e.target.result;
			remindinfo.state = zt;
			store.put(remindinfo);
			chrome.extension.getBackgroundPage().remind();
		};
	});
}
//提醒列表加载
function tab_ready() {
	var transaction = myDB.db.transaction(storeName, 'readwrite');
	var store = transaction.objectStore(storeName);
	var cursorRequest = store.openCursor();
	cursorRequest.onsuccess = function (e) {
		var cursor = e.target.result;
		if (cursor) {
			//console.log(cursor.value.hour);
			if (cursor.key != '') {
				var id = cursor.key;
				var state = cursor.value.state;
				var hour = cursor.value.hour;
				var minute = cursor.value.minute;
				var title = cursor.value.title;
				var content = cursor.value.content;
				var url = cursor.value.url;
				var weeks = cursor.value.timefrequencys;
				var remindWeek = "";
				var isuse;
				var isuesid = "isuse-" + id;
				var timeid = "time-" + id;
				var checkSelid = "checkSel-" + id;
				if (weeks == '-1') {
					remindWeek = '一次';
				} else {
					if (weeks.split(',').length == 7) {
						remindWeek = '每天';
					} else {
						for (var j = 0; j < weeks.split(',').length; j++) {
							remindWeek += weekarry[parseInt(weeks.split(',')[j], 10)] + ' ';
						}
					}
				}
				if (state) {
					isuse = 'checked="true"';
				} else {
					isuse = "";
				}
				var newRow = '<tr><th><a name="checkSel" id=' + checkSelid + ' class="divCheckBoxNoSel"></a></th><th><div id="sliding" class="labelBox"><input type="checkbox"  id=' + isuesid + ' name="isuse" ' + isuse + '><label for=' + isuesid + ' class="check"></label></div></th><th><a id=' + timeid + ' name=time href="javascript:void(0);" >' + hour + ':' + minute + '(' + remindWeek + ')</a></th><th><div name="title"    >' + title + '</div></th><th><div  name="content" >' + content + '</div></th><th><a name="addrs" href=' + url + ' target="_blank" >' + url + '</a></th></tr>';
				form_Tab.append(newRow);
				$("a[name='time']").each(function () {
					$(this).off().on('click', function () {
						loadWindowList($(this).attr('id').replace('time-', ''));
					});
				});
				$("input[name='isuse']").each(function () {
					if ($(this).is(':checked')) {
						$(this).parent().css('background', '#26ca28');
					} else {
						$(this).parent().css('background', '#bbbbbb');
					}
				});
			}
			cursor.continue();
		}
	};
}
//将内容下载到本地
function downloadFile(fileName, content) {
	var aLink = document.createElement('a');
	var blob = new Blob([content]);
	var evt = document.createEvent("HTMLEvents");
	evt.initEvent("click", false, false);
	aLink.download = fileName;
	aLink.href = URL.createObjectURL(blob);
	aLink.dispatchEvent(evt);
}

//弹出框加载
function Dialog_ready() {
	//提交按钮
	$("#dialog").on('click', "#ok", function () {
		var content = [];
		var str = $("#inportcontent").val();
		content = str.split('\n');
		var info = "";
		var reminds = [];
		for (var i = 0; i < content.length; i++) {
			var new_arry = content[i].split('~');
			if (new_arry.length != 8) {
				if (i == 0) {
					info = i + 1;
				} else {
					info += '、' + (i + 1);
				}
			} else {
				var remind = {
					id : new_arry[0],
					hour : new_arry[1],
					minute : new_arry[2],
					title : new_arry[3],
					content : new_arry[4],
					url : new_arry[5],
					state : new_arry[6],
					timefrequencys : new_arry[7]
				};
				reminds.push(remind);
			}
		}
		chrome.extension.getBackgroundPage().addData(myDB.db, storeName, reminds);
		if (info == "") {
			setTimeout(function () {
				location.reload();
			}, 100);
		}
		if (info.length > 20) {
			$("#tipinfo").text('错误行数太多，请检查文件是否正确.');
			showtip('tip', 'tipinfo');
			setTimeout(function () {
				closetip('tip');
			}, 2000);
		} else {
			$("#tipinfo").text('第' + info + '行' + '存在问题.');
			showtip('tip', 'tipinfo');
			setTimeout(function () {
				closetip('tip');
			}, 2000);
		}

	});
	//上传按钮
	$("#dialog").on('click', "#upFileBtn", function () {
		$("#upfile").click();
	});
	$("#dialog").on('change', "#upfile", function () {
		var resultFile = $("#upfile")[0].files[0];
		if (resultFile) {
			var reader = new FileReader();
			reader.readAsText(resultFile, 'utf-8');
			reader.onload = function () {
				var urlData = this.result;
				$("#drop_div")[0].innerHTML = "";
				$("#drop_div").append(textarea);
				$("#inportcontent")[0].innerHTML = urlData;
			};
		}
	});
	//拖拽上传
	$('#dialog').on(
		'dragover',
		function (e) {
		e.preventDefault();
		e.stopPropagation();
	});
	$('#dialog').on(
		'dragenter',
		function (e) {
		e.preventDefault();
		e.stopPropagation();
	});
	$("#dialog").on('drop', function (e) {
		if (e.originalEvent.dataTransfer) {
			if (e.originalEvent.dataTransfer.files.length) {
				e.preventDefault();
				e.stopPropagation();
				if (e.originalEvent.dataTransfer.files[0].type.indexOf('text') === -1) {
					$("#tipinfo").text("您拖入的不是txt文件");
					showtip('tip', 'tipinfo');
					setTimeout(function () {
						closetip('tip');
					}, 2000);
					return false;
				}
				var reader = new FileReader();
				reader.readAsText(e.originalEvent.dataTransfer.files[0], 'utf-8');
				reader.onload = function () {
					var urlData = this.result;
					$("#drop_div")[0].innerHTML = "";
					$("#drop_div").append(textarea);
					$("#inportcontent")[0].innerHTML = urlData;
				};
			}
		}
	});
	//关闭按钮
	$("#dialog").on('click', "#close", function () {
		hideDialog('dialog');
		hideOverlay();
		$("#dialog").empty();
	});

}

//按钮加载
function button_ready() {
	//查看样式按钮
	$('#testbtn').click(function () {
		chrome.extension.getBackgroundPage().ShowNotification({
			title : '这是一个演示',
			icon : '../images/tx.png',
			message : '这是一个演示',
			delayTime:4000
		});
		chrome.extension.getBackgroundPage().speak('这是一个演示', 'zh_CN', 'native');
		if (JSON.parse(localStorage.conn_google)) {
			chrome.extension.getBackgroundPage().speak('This is a demonstration', 'en_US', 'Google US English');
			chrome.extension.getBackgroundPage().speak('これはデモです', 'ja-JP', 'Google 日本人');
			chrome.extension.getBackgroundPage().speak('이데모', 'ko-KR', 'Google 한국의');
		}
	});
	//增加按钮
	$("a[name='addbtn']").click(function () {
		loadWindowList('-1');
	});
	//删除按钮
	$("a[name='delbtn']").click(function () {
		delRow();
	});
	//导出按钮
	$("a[name='exportbtn']").click(function () {
		var transaction = myDB.db.transaction(storeName, 'readwrite');
		var store = transaction.objectStore(storeName);
		var cursorRequest = store.openCursor();
		var i = 0;
		var str = "";
		cursorRequest.onsuccess = function (e) {
			var cursor = e.target.result;
			if (cursor) {
				if (i == 0) {
					str = chrome.extension.getBackgroundPage().guid() + '~' + cursor.value.hour + '~' + cursor.value.minute + '~' + cursor.value.title + '~' + cursor.value.content + '~' + cursor.value.url + '~' + cursor.value.state + '~' + cursor.value.timefrequencys;
				} else {
					str = str + '\r\n' + chrome.extension.getBackgroundPage().guid() + '~' + cursor.value.hour + '~' + cursor.value.minute + '~' + cursor.value.title + '~' + cursor.value.content + '~' + cursor.value.url + '~' + cursor.value.state + '~' + cursor.value.timefrequencys;
				}
				i++;
				cursor.continue();
			}
		};
		setTimeout(function () {
			if (i == 0) {
				$("#tipinfo").text('没有可以导出的内容');
				showtip('tip', 'tipinfo');
				setTimeout(function () {
					closetip('tip');
				}, 2000);
			} else {
				downloadFile('chrome提醒列表的备份文件.txt', str);
			}
		}, 100);
	});

	//导入按钮
	$("a[name='inportbtn']").click(function () {
		showOverlay();
		$("#dialog").append(addconfig);
		showDialog('dialog');
	});
	//上移下移按钮
	$("#up_down").click(function () {
		var image = $("#up_down>:first-child")[0].src;
		if (image.indexOf("arrow_up.png") > -1) {
			$('#is_option').slideUp(700,
				function () {
				$("#up_down>:first-child")[0].src = image.replace('arrow_up.png', 'arrow_down.png');
				$("#up_down").tooltipster('content', "下移");

			});
		} else {
			$('#is_option').slideDown(700,
				function () {
				$("#up_down>:first-child")[0].src = image.replace('arrow_down.png', 'arrow_up.png');
				$("#up_down").tooltipster('content', "上移");

			});
		}
	});
}

//页面加载
$(document).ready(function () {
	$.ajax({
		url : 'http://www.google.com.hk',
		type : 'GET',
		timeout : 30000,
		beforeSend : function () {
			$("a[name='connect_google']").html('正在连接google.com.hk......');
		},
		success : function () {
			localStorage.conn_google = true;
			$("a[name='connect_google']").html('成功连接google服务器，支持中、英、日、韩语音');
		},
		error : function () {
			localStorage.conn_google = false;
			$("a[name='connect_google']").html('无法连接google服务器，只支持中、英语音');
		}
	});
	form_options = $("form[id='options']");
	form_isActivated = $("input[name='isActivated']");
	form_Tab = $("table[name='remindTab']");
	tab_ready();
	clickCbx();
	button_ready();
	Dialog_ready();
	form_isActivated.attr("checked", JSON.parse(localStorage.isActivated));
	$("#tts").attr("checked", JSON.parse(localStorage.isSpeak));
	ghost(form_isActivated.is(':checked'));
	// Set the display activation and frequency.
	form_isActivated.change(function () {
		var tmp = form_isActivated.is(':checked');
		localStorage.isActivated = tmp;
		ghost(tmp);
	});
	$("#tts").change(function () {
		localStorage.isSpeak = $("#tts").is(':checked');
	});
	$('#up_down').tooltipster();
});
