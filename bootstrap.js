const Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/NetUtil.jsm');

const stylesheetService = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
const resource = Services.io.getProtocolHandler('resource').QueryInterface(Ci.nsIResProtocolHandler);
const css = NetUtil.newURI('resource://tabsincontent/browser.css');

function processWindows(callback) {
	const windows = Services.wm.getEnumerator('navigator:browser');
	while(windows.hasMoreElements())
		callback(windows.getNext());
}

function moveTabs(window) {
	if(window.document.querySelector('window#main-window[chromehidden~="location"]')) return;
	var tabsToolbar = window.document.getElementById('TabsToolbar');
	window.document.getElementById('appcontent').prepend(tabsToolbar);
	tabsToolbar.style.setProperty('-moz-box-ordinal-group', '0', 'important');
}

function restoreTabs(window) {
	var tabsToolbar = window.document.getElementById('TabsToolbar');
	window.document.getElementById('navigator-toolbox').insertBefore(tabsToolbar, window.document.getElementById('status-bar'));
	tabsToolbar.style.removeProperty('-moz-box-ordinal-group');
}

const observers = {
	windowOpened: {
		observe(subject, topic, data) {
			subject.addEventListener('load', function onload() {
				subject.removeEventListener('load', onload, false);
				if(subject.document.documentElement.getAttribute('windowtype') == 'navigator:browser')
					moveTabs(subject);
			}, false);
		},
		register() {
			Services.obs.addObserver(this, 'domwindowopened', false);
		},
		unregister() {
			Services.obs.removeObserver(this, 'domwindowopened');
		},
	},
};

function startup(data, reason) {
	var extname;
	if(data.installPath.isDirectory())
		extname = Services.io.newFileURI(data.installPath);
	else
		extname = Services.io.newURI('jar:' + extname.spec + '!/', null, null);
	resource.setSubstitution('tabsincontent', extname);
	if(!stylesheetService.sheetRegistered(css, stylesheetService.USER_SHEET))
		stylesheetService.loadAndRegisterSheet(css, stylesheetService.USER_SHEET);
	
	observers.windowOpened.register();
	processWindows(moveTabs);
}

function shutdown(data, reason) {
	if(reason == APP_SHUTDOWN) return;
	
	if(stylesheetService.sheetRegistered(css, stylesheetService.USER_SHEET))
		stylesheetService.unregisterSheet(css, stylesheetService.USER_SHEET);
	resource.setSubstitution('tabsincontent', null);
	
	observers.windowOpened.unregister();
	processWindows(restoreTabs);
}

function install() {}

function uninstall() {}
